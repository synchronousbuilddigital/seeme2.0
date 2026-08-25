import crypto from 'crypto'
import mongoose from 'mongoose'
import Refund from '../models/Refund.js'
import Order from '../models/Order.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getRazorpay } from './orderController.js'
import shippingService from '../services/shippingService.js'
import { sendOrderEmail } from '../services/emailService.js'

/**
 * Helper to determine if an order has been shipped or picked up from warehouse.
 * Checks main order status, internal shipping status, AWB presence, and pickup timestamps.
 */
export const isOrderShipped = (order) => {
  if (!order) return false

  const currentStatus = String(order.status || '').toLowerCase().trim()
  const shippingStatus = String(order.shipping?.status || '').toLowerCase().trim()

  const shippedStatuses = ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up']
  
  const isStatusShipped = shippedStatuses.includes(currentStatus) || shippedStatuses.includes(shippingStatus)
  const hasAwb = Boolean(order.shipping?.awbNumber || order.trackingNumber)
  const hasPickupAt = Boolean(order.shipping?.pickupAt)

  return isStatusShipped || hasAwb || hasPickupAt
}

// @desc    Customer creates refund request for an online/prepaid order
// @route   POST /api/orders/:orderId/refund-request
// @access  Private (Customer)
export const requestRefund = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const { reason } = req.body

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400)
    throw new Error('Invalid Order ID format')
  }

  const order = await Order.findById(orderId)
  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  // 1. Customer Ownership Validation
  const userEmail = String(req.user?.email || '').trim().toLowerCase()
  const orderEmail = String(order.customer?.email || '').trim().toLowerCase()
  const isOwner = (orderEmail && orderEmail === userEmail) || (order.user && String(order.user) === String(req.user?._id))

  if (!isOwner && req.user?.role !== 'admin') {
    res.status(403)
    throw new Error('Unauthorized: You can only request a refund for your own order')
  }

  // 2. Payment Method Validation (Online/Prepaid only)
  const paymentMethod = String(order.paymentMethod || '').toLowerCase()
  if (paymentMethod === 'cod') {
    res.status(400)
    throw new Error('Refund is not available for COD orders.')
  }

  // 3. Payment Status Validation (Must be Paid)
  const paymentStatus = String(order.paymentStatus || '').toLowerCase()
  if (paymentStatus !== 'paid') {
    res.status(400)
    throw new Error('Refund can only be requested for orders with successful payment.')
  }

  // 4. Order Status Validation (Not Cancelled)
  if (String(order.status || '').toLowerCase() === 'cancelled') {
    res.status(400)
    throw new Error('Order is already cancelled.')
  }

  // 5. Shipping Status Validation (MOST CRITICAL: NOT SHIPPED)
  if (isOrderShipped(order)) {
    res.status(400)
    throw new Error('Refund is not available because this order has already been shipped from the warehouse.')
  }

  // 6. Duplicate Refund Request Validation
  const existingActiveRefund = await Refund.findOne({
    order: order._id,
    status: { $in: ['requested', 'approved', 'processing', 'refunded'] }
  })

  if (existingActiveRefund || ['refund_requested', 'refund_processing', 'refunded'].includes(order.refundStatus)) {
    res.status(400)
    throw new Error('A refund request is already active or processed for this order.')
  }

  // Create Refund Record
  const refund = await Refund.create({
    order: order._id,
    paymentId: order.paymentDetails?.paymentId || 'online_pay',
    amount: order.totalAmount,
    reason: reason || 'Ordered by mistake',
    status: 'requested',
    requestedBy: req.user?._id
  })

  // Update Order refundStatus
  order.refundStatus = 'refund_requested'
  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'Refund Requested',
    timestamp: new Date(),
    note: `Refund requested by customer. Reason: ${reason || 'Ordered by mistake'}`
  })

  await order.save()

  res.status(201).json({
    success: true,
    message: 'Refund request submitted successfully.',
    data: refund,
    order
  })
})

// @desc    Get refund status & details for an order
// @route   GET /api/orders/:orderId/refund
// @access  Private
export const getRefundByOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400)
    throw new Error('Invalid Order ID format')
  }

  const order = await Order.findById(orderId)
  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  const userEmail = String(req.user?.email || '').trim().toLowerCase()
  const orderEmail = String(order.customer?.email || '').trim().toLowerCase()
  const isOwner = (orderEmail && orderEmail === userEmail) || (order.user && String(order.user) === String(req.user?._id))

  if (!isOwner && req.user?.role !== 'admin') {
    res.status(403)
    throw new Error('Not authorized to view refund for this order')
  }

  const refund = await Refund.findOne({ order: order._id }).sort({ createdAt: -1 })
  const isEligible = (order.paymentMethod === 'online') &&
                     (order.paymentStatus === 'paid') &&
                     !isOrderShipped(order) &&
                     (order.status !== 'cancelled') &&
                     (!order.refundStatus || order.refundStatus === 'not_refunded' || order.refundStatus === 'refund_rejected')

  res.json({
    success: true,
    data: {
      refund,
      refundStatus: order.refundStatus || 'not_refunded',
      refundedAmount: order.refundedAmount || 0,
      isEligible,
      shippingStatus: order.shipping?.status || 'pending',
      isShipped: isOrderShipped(order)
    }
  })
})

// @desc    Get all refund requests (Admin)
// @route   GET /api/admin/refunds
// @access  Admin
export const getAllRefunds = asyncHandler(async (req, res) => {
  const refunds = await Refund.find()
    .populate({
      path: 'order',
      select: 'orderNumber customer totalAmount status paymentMethod paymentStatus shipping refundStatus createdAt'
    })
    .populate('requestedBy', 'name email')
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    data: refunds
  })
})

// @desc    Admin approves customer refund request (Accepts Refund ID or Order ID)
// @route   POST /api/admin/refunds/:refundId/approve
// @access  Admin
export const approveRefund = asyncHandler(async (req, res) => {
  const { refundId } = req.params

  if (!mongoose.Types.ObjectId.isValid(refundId)) {
    res.status(400)
    throw new Error('Invalid Refund ID or Order ID format')
  }

  let refund = await Refund.findById(refundId)
  if (!refund) {
    refund = await Refund.findOne({ order: refundId })
  }

  let order = null
  if (refund) {
    order = await Order.findById(refund.order)
  } else {
    order = await Order.findById(refundId)
    if (order && (order.refundStatus === 'refund_requested' || order.paymentMethod === 'online')) {
      refund = await Refund.create({
        order: order._id,
        paymentId: order.paymentDetails?.paymentId || 'online_pay',
        amount: order.totalAmount,
        reason: 'Order refund approved by admin',
        status: 'requested',
        requestedBy: order.user || null
      })
    }
  }

  if (!order) {
    res.status(404)
    throw new Error('Associated order not found')
  }

  if (!refund) {
    res.status(404)
    throw new Error('Refund request record not found')
  }

  // 1. Double check state to prevent duplicate approval
  if (['refunded', 'processing', 'approved'].includes(refund.status)) {
    res.status(400)
    throw new Error(`Refund has already been ${refund.status}`)
  }

  // 2. CRITICAL RACE CONDITION GUARD: Re-verify shipment status immediately before calling gateway
  if (isOrderShipped(order)) {
    refund.status = 'rejected'
    refund.adminNote = 'Auto-rejected: Order was shipped from warehouse prior to admin approval.'
    await refund.save()

    order.refundStatus = 'refund_rejected'
    if (!order.timeline) order.timeline = []
    order.timeline.push({
      status: 'Refund Rejected',
      timestamp: new Date(),
      note: 'Refund request auto-rejected because order was shipped from warehouse prior to approval.'
    })
    await order.save()

    res.status(400)
    throw new Error('Refund rejected: Order has already been shipped from warehouse. Refunds are permanently unavailable after shipment.')
  }

  // 3. Cancel Ad2Ship order if active and not shipped
  if (order.shipping?.ad2shipOrderId && order.shipping?.status !== 'cancelled') {
    try {
      await shippingService.cancelShipment(order._id)
    } catch (shipErr) {
      console.warn(`⚠️ Ad2Ship shipment cancellation during refund notice for #${order.orderNumber}:`, shipErr.message)
    }
  }

  // 4. Razorpay Gateway Refund Processing
  const paymentId = order.paymentDetails?.paymentId || refund.paymentId
  const razorpay = getRazorpay()
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
  const hasRealKeys = !!razorpay && keyId && !keyId.includes('your_razorpay_key')
  const isRealRazorpayPayId = Boolean(paymentId && typeof paymentId === 'string' && paymentId.startsWith('pay_'))

  let gatewayRefundId = `rfnd_mock_${Date.now()}`
  let refundStatusVal = 'refunded'
  let orderRefundStatusVal = 'refunded'

  // If real Razorpay keys exist and paymentId is a real Razorpay payment ID (starts with pay_)
  if (hasRealKeys && isRealRazorpayPayId) {
    try {
      const razorpayRefund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(order.totalAmount * 100), // amount in paise
        speed: 'normal',
        notes: {
          reason: refund.reason || 'Customer requested refund',
          orderNumber: order.orderNumber
        },
        receipt: `receipt_refund_${refund._id}`
      })

      if (razorpayRefund && razorpayRefund.id) {
        gatewayRefundId = razorpayRefund.id
        if (razorpayRefund.status !== 'processed') {
          refundStatusVal = 'processing'
          orderRefundStatusVal = 'refund_processing'
        }
      }
    } catch (gatewayErr) {
      console.error('❌ Razorpay Refund API Error:', gatewayErr)
      refund.status = 'failed'
      refund.adminNote = `Gateway Error: ${gatewayErr.message}`
      await refund.save()

      order.refundStatus = 'refund_failed'
      await order.save()

      res.status(400)
      throw new Error(`Payment Gateway Refund Failed: ${gatewayErr.message}`)
    }
  } else {
    console.warn(`ℹ️ Operating in Mock/Dev mode for Razorpay refund. Payment ID: "${paymentId}". Generated ID: ${gatewayRefundId}`)
  }

  // 5. Update Refund & Order Records
  refund.gatewayRefundId = gatewayRefundId
  refund.status = refundStatusVal
  refund.processedBy = req.user?._id
  refund.processedAt = new Date()
  if (req.body.adminNote) refund.adminNote = req.body.adminNote
  await refund.save()

  order.refundStatus = orderRefundStatusVal
  order.paymentStatus = 'refunded'
  order.refundedAmount = order.totalAmount
  order.status = 'refunded'

  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'Refund Approved',
    timestamp: new Date(),
    note: `Refund of ₹${order.totalAmount.toLocaleString('en-IN')} approved and processed via Razorpay. Refund ID: ${gatewayRefundId}`
  })

  await order.save()

  // Send Order Refunded Email
  sendOrderEmail(order, 'Refunded').catch(err => console.error('Refund email error:', err.message))

  res.json({
    success: true,
    message: 'Refund approved and processed successfully.',
    data: refund,
    order
  })
})

// @desc    Admin rejects customer refund request (Accepts Refund ID or Order ID)
// @route   POST /api/admin/refunds/:refundId/reject
// @access  Admin
export const rejectRefund = asyncHandler(async (req, res) => {
  const { refundId } = req.params
  const { adminNote } = req.body

  if (!mongoose.Types.ObjectId.isValid(refundId)) {
    res.status(400)
    throw new Error('Invalid Refund ID or Order ID format')
  }

  let refund = await Refund.findById(refundId)
  if (!refund) {
    refund = await Refund.findOne({ order: refundId })
  }

  let order = null
  if (refund) {
    order = await Order.findById(refund.order)
  } else {
    order = await Order.findById(refundId)
  }

  if (!order) {
    res.status(404)
    throw new Error('Associated order not found')
  }

  if (!refund) {
    refund = await Refund.create({
      order: order._id,
      paymentId: order.paymentDetails?.paymentId || 'online_pay',
      amount: order.totalAmount,
      reason: 'Refund request rejected by admin',
      status: 'rejected',
      adminNote: adminNote || 'Refund request rejected by administrator.'
    })
  } else {
    refund.status = 'rejected'
    refund.adminNote = adminNote || 'Refund request rejected by administrator.'
    refund.processedBy = req.user?._id
    refund.processedAt = new Date()
    await refund.save()
  }

  order.refundStatus = 'refund_rejected'
  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'Refund Rejected',
    timestamp: new Date(),
    note: `Refund request rejected by admin. Note: ${adminNote || 'No specific reason provided'}`
  })
  await order.save()

  res.json({
    success: true,
    message: 'Refund request rejected successfully.',
    data: refund,
    order
  })
})

// @desc    Razorpay Refund Webhook handler
// @route   POST /api/orders/razorpay-webhook
// @access  Public (Signature Verified)
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '').trim()

  if (!webhookSecret) {
    res.status(500)
    throw new Error('Razorpay webhook secret is not configured on the server')
  }

  const signature = req.headers['x-razorpay-signature']
  if (!signature) {
    res.status(400)
    throw new Error('Missing X-Razorpay-Signature header')
  }

  // Calculate HMAC SHA256 signature over request body
  const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyString)
    .digest('hex')

  if (expectedSignature !== signature) {
    res.status(400)
    throw new Error('Invalid Razorpay webhook signature')
  }

  const event = req.body?.event
  const payload = req.body?.payload

  if (event === 'refund.processed') {
    const refundEntity = payload?.refund?.entity
    if (refundEntity?.id) {
      const refund = await Refund.findOne({ gatewayRefundId: refundEntity.id })
      if (refund) {
        refund.status = 'refunded'
        await refund.save()

        const order = await Order.findById(refund.order)
        if (order) {
          order.refundStatus = 'refunded'
          order.paymentStatus = 'refunded'
          order.refundedAmount = refund.amount
          order.status = 'refunded'
          await order.save()
        }
      }
    }
  } else if (event === 'refund.failed') {
    const refundEntity = payload?.refund?.entity
    if (refundEntity?.id) {
      const refund = await Refund.findOne({ gatewayRefundId: refundEntity.id })
      if (refund) {
        refund.status = 'failed'
        await refund.save()

        const order = await Order.findById(refund.order)
        if (order) {
          order.refundStatus = 'refund_failed'
          await order.save()
        }
      }
    }
  }

  res.json({ status: 'ok' })
})

export default {
  requestRefund,
  getRefundByOrder,
  getAllRefunds,
  approveRefund,
  rejectRefund,
  handleRazorpayWebhook,
  isOrderShipped
}
