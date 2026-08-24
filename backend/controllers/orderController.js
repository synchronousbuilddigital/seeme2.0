import dotenv from 'dotenv'
dotenv.config()

import Order from '../models/Order.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { sendOrderEmail } from '../services/emailService.js'
import shippingService from '../services/shippingService.js'
import pushNotificationService from '../services/pushNotificationService.js'

// Initialize Razorpay dynamically
let razorpayInstance = null

export const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
  if (keyId && keySecret && !keyId.includes('your_razorpay_key')) {
    try {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      })
      console.log(`✅ Razorpay initialized successfully (${keyId})`)
    } catch (error) {
      console.error('❌ Failed to initialize Razorpay:', error.message)
    }
  }
  return razorpayInstance
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, paymentMethod, orderType } = req.body

  if (!customer || !items || items.length === 0) {
    res.status(400)
    throw new Error('Customer info and at least one item are required')
  }

  const normalizedOrderType = String(orderType || 'ONLINE').toUpperCase()
  const normalizedPaymentMethod = String(paymentMethod || 'online').toLowerCase()

  // SECURITY RULE: Online Store orders MUST NOT allow COD
  if (normalizedOrderType === 'ONLINE' && normalizedPaymentMethod === 'cod') {
    res.status(400)
    throw new Error('COD payment method is not allowed for Online Store orders. Please use Online Payment.')
  }

  let totalAmount = 0
  const orderItems = []

  for (const item of items) {
    const product = await Product.findById(item.product)
    if (!product) {
      res.status(404)
      throw new Error(`Product ${item.product} not found`)
    }

    if (product.stock < item.quantity) {
      res.status(400)
      throw new Error(`Insufficient stock for ${product.name}`)
    }

    totalAmount += product.price * item.quantity

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      image: product.images?.[0]
    })

    // Update specific size stock if it exists
    if (product.sizeStock && product.sizeStock.length > 0) {
      const sizeItem = product.sizeStock.find(s => s.size === item.size)
      if (sizeItem) {
        if (sizeItem.quantity < item.quantity) {
          res.status(400)
          throw new Error(`Insufficient stock for size ${item.size} of ${product.name}`)
        }
        sizeItem.quantity -= item.quantity
      }
    } else {
      // Fallback to general stock
      product.stock -= item.quantity
    }

    await product.save()
  }

  const isCodOrder = normalizedPaymentMethod === 'cod'

  const order = await Order.create({
    customer,
    items: orderItems,
    totalAmount,
    orderType: normalizedOrderType,
    paymentMethod: normalizedPaymentMethod,
    status: isCodOrder ? 'pending_approval' : 'pending',
    paymentStatus: isCodOrder ? 'pending_approval' : 'pending'
  })

  // Automatically initialize Ad2Ship shipment order directly upon customer placement (ONLINE STORE ONLY)
  if (normalizedOrderType === 'ONLINE') {
    try {
      const shipResult = await shippingService.createAd2ShipOrderForSeemeeOrder(order._id)
      if (shipResult?.ad2shipOrderId) {
        if (!order.shipping) order.shipping = {}
        order.shipping.provider = 'ad2ship'
        order.shipping.ad2shipOrderId = shipResult.ad2shipOrderId
        order.shipping.status = 'pending'
      }
    } catch (shipErr) {
      console.warn(`⚠️ Ad2Ship auto-creation notice for #${order.orderNumber}:`, shipErr.message)
    }
  }

  // Send Order Placed Email via Nodemailer Gmail Service
  sendOrderEmail(order, isCodOrder ? 'COD_PENDING' : 'Placed').catch(err => console.error('Order email error:', err.message))

  // Trigger Native Web Push & In-App Admin Notification
  pushNotificationService.sendNewOrderNotification(order).catch(err => console.error('Order push notification error:', err.message))

  res.status(201).json({ success: true, data: order })
})

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Admin
export const getOrders = asyncHandler(async (req, res) => {
  const query = {}
  if (req.query.orderType) {
    query.orderType = String(req.query.orderType).toUpperCase()
  }
  const orders = await Order.find(query)
    .populate('items.product')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
  res.json({ success: true, data: orders })
})

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const emailStr = (req.user?.email || '').trim()
  const orders = await Order.find({
    $or: [
      { 'customer.email': { $regex: new RegExp(`^${emailStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') } },
      { user: req.user?._id }
    ]
  }).sort({ createdAt: -1 })
  res.json({ success: true, data: orders })
})

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product')
  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }
  res.json({ success: true, data: order })
})

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  )
  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  // Send Order Status Email (Confirmed, Shipped, Delivered, Cancelled, etc.)
  sendOrderEmail(order, status).catch(err => console.error('Order status email error:', err.message))

  if (String(status || '').toLowerCase() === 'cancelled') {
    pushNotificationService.sendOrderCancelledNotification(order).catch(err => console.error('Order cancellation push error:', err.message))
  }

  res.json({ success: true, data: order })
})

// @desc    Cancel order by user
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  // Ensure user owns this order or is admin
  const userEmail = (req.user?.email || '').trim().toLowerCase()
  const orderEmail = (order.customer?.email || '').trim().toLowerCase()
  const isOwner = (orderEmail && orderEmail === userEmail) || (order.user && String(order.user) === String(req.user?._id))

  if (!isOwner && req.user?.role !== 'admin') {
    res.status(403)
    throw new Error('Not authorized to cancel this order')
  }

  const currentStatus = (order.status || '').toLowerCase()
  const shippingStatus = (order.shipping?.status || '').toLowerCase()

  if (currentStatus === 'cancelled') {
    res.status(400)
    throw new Error('Order is already cancelled.')
  }

  // RULE 1: Cancellation can ONLY be done BEFORE shipping
  const isShipped = ['shipped', 'delivered', 'in_transit', 'out_for_delivery'].includes(currentStatus) ||
    ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(shippingStatus) ||
    Boolean(order.shipping?.awbNumber)

  if (isShipped) {
    res.status(400)
    throw new Error('Order cancellation is ONLY allowed BEFORE shipping. Once shipped with an assigned AWB, the order cannot be cancelled.')
  }

  // RULE 2: Refund can ONLY be done BEFORE pickup from warehouse
  const isPickedUp = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus) ||
    ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(shippingStatus) ||
    Boolean(order.shipping?.pickupAt)

  if (isPickedUp) {
    res.status(400)
    throw new Error('Refunds and cancellation can ONLY be processed BEFORE package pickup from warehouse.')
  }

  // Restore inventory stock
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product)
        if (product) {
          if (product.sizeStock && product.sizeStock.length > 0) {
            const sizeItem = product.sizeStock.find(s => s.size === item.size)
            if (sizeItem) {
              sizeItem.quantity += (item.quantity || 1)
            }
          } else {
            product.stock += (item.quantity || 1)
          }
          await product.save()
        }
      }
    }
  }

  // Synchronize cancellation with Ad2Ship if shipment exists
  if (order.shipping?.ad2shipOrderId) {
    try {
      await shippingService.cancelShipment(order._id)
    } catch (shipErr) {
      console.warn(`⚠️ Ad2Ship cancellation notice for #${order.orderNumber}:`, shipErr.message)
    }
  }

  // Initialize refund request record if order was online / prepaid
  if (order.paymentMethod === 'online' || order.paymentStatus === 'paid') {
    order.refundStatus = 'refund_requested'
    try {
      const Refund = (await import('../models/Refund.js')).default
      const existingRefund = await Refund.findOne({ order: order._id })
      if (!existingRefund) {
        await Refund.create({
          order: order._id,
          paymentId: order.paymentDetails?.paymentId || 'online_pay',
          amount: order.totalAmount,
          reason: 'Order cancelled by customer before shipping',
          status: 'requested',
          requestedBy: req.user?._id
        })
      }
    } catch (rErr) {
      console.warn('⚠️ Auto-refund record creation notice:', rErr.message)
    }
  }

  order.status = 'cancelled'
  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: 'Order cancelled before shipping & warehouse pickup. Refund of 5-7 working days initiated.'
  })

  await order.save()

  // Send Order Cancelled Email to customer with SEEMEE Logo
  try {
    await sendOrderEmail(order, 'Cancelled')
  } catch (err) {
    console.error('Order cancellation email error:', err.message)
  }

  // Trigger Admin Web Push & In-App Notification for Order Cancellation
  pushNotificationService.sendOrderCancelledNotification(order).catch(err => console.error('Order cancellation push error:', err.message))

  res.json({ success: true, message: 'Order cancelled successfully.', data: order })
})

// @desc    Create Razorpay order
// @route   POST /api/orders/create-razorpay-order
// @access  Public
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body

  const options = {
    amount: Math.round(amount * 100), // amount in smallest currency unit
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  }

  // Razorpay Configuration Guard
  const razorpay = getRazorpay()
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
  const hasKeys = !!razorpay && keyId && !keyId.includes('your_razorpay_key')

  if (!hasKeys) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ WARNING: Razorpay keys are not configured. Returning a mock order for development.')
      return res.json({
        success: true,
        data: {
          id: `order_mock_${Date.now()}`,
          amount: options.amount,
          currency: options.currency
        }
      })
    } else {
      res.status(500)
      throw new Error('Razorpay payment gateway is not configured for production.')
    }
  }

  try {
    const order = await razorpay.orders.create(options)
    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Razorpay Error:', error)
    res.status(500)
    throw new Error('Failed to create Razorpay order')
  }
})

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify-payment
// @access  Public
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    customer,
    items,
    totalAmount,
    orderType
  } = req.body

  const normalizedOrderType = String(orderType || 'ONLINE').toUpperCase()

  // For COD (no razorpay_order_id), we should have handled this elsewhere but 
  // keeping it robust for potential direct calls
  if (!razorpay_order_id) {
    const order = await Order.create({
      customer,
      items,
      totalAmount,
      orderType: normalizedOrderType,
      paymentMethod: 'cod',
      paymentStatus: 'pending'
    })
    return res.json({ success: true, data: order })
  }

  // Development Fallback: If it's a mock order ID, skip signature verification
  if (razorpay_order_id.startsWith('order_mock_')) {
    console.warn('⚠️ WARNING: Verifying a mock order. Skipping signature check.')

    // Check and update stock even for mock orders
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (product) {
        if (product.sizeStock && product.sizeStock.length > 0) {
          const sizeItem = product.sizeStock.find(s => s.size === item.size)
          if (sizeItem && sizeItem.quantity >= item.quantity) {
            sizeItem.quantity -= item.quantity
          }
        } else if (product.stock >= item.quantity) {
          product.stock -= item.quantity
        }
        await product.save()
      }
    }

    const order = await Order.create({
      customer,
      items,
      totalAmount,
      orderType: normalizedOrderType,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id || 'mock_pay_id'
      }
    })

    // Send confirmation email
    sendOrderEmail(order, 'Placed').catch(err => console.error('Order email error:', err.message))

    // Trigger Native Web Push & In-App Admin Notification
    pushNotificationService.sendNewOrderNotification(order).catch(err => console.error('Order push notification error:', err.message))

    // Initialize Ad2Ship shipment order after verified online payment (ONLINE STORE ONLY)
    if (normalizedOrderType === 'ONLINE') {
      try {
        const shipResult = await shippingService.createAd2ShipOrderForSeemeeOrder(order._id)
        if (shipResult?.ad2shipOrderId) {
          if (!order.shipping) order.shipping = {}
          order.shipping.provider = 'ad2ship'
          order.shipping.ad2shipOrderId = shipResult.ad2shipOrderId
          order.shipping.status = 'pending'
        }
      } catch (shipErr) {
        console.warn(`⚠️ Ad2Ship online order creation notice for #${order.orderNumber}:`, shipErr.message)
      }
    }

    return res.json({ success: true, data: order })
  }

  // Verify signature
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
  const generated_signature = hmac.digest('hex')

  if (generated_signature !== razorpay_signature) {
    res.status(400)
    throw new Error('Invalid payment signature')
  }

  // Payment verified, check and update stock
  for (const item of items) {
    const product = await Product.findById(item.product)
    if (!product) {
      res.status(404)
      throw new Error(`Product ${item.product} not found`)
    }
    if (product.stock < item.quantity) {
      res.status(400)
      throw new Error(`Insufficient stock for ${product.name}`)
    }
    product.stock -= item.quantity
    await product.save()
  }

  // Create order
  const order = await Order.create({
    customer,
    items,
    totalAmount,
    orderType: normalizedOrderType,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    paymentDetails: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    }
  })

  // Send confirmation email
  sendOrderEmail(order, 'Placed').catch(err => console.error('Order email error:', err.message))

  // Trigger Native Web Push & In-App Admin Notification
  pushNotificationService.sendNewOrderNotification(order).catch(err => console.error('Order push notification error:', err.message))

  // Initialize Ad2Ship shipment order after verified online payment (ONLINE STORE ONLY)
  if (normalizedOrderType === 'ONLINE') {
    try {
      const shipResult = await shippingService.createAd2ShipOrderForSeemeeOrder(order._id)
      if (shipResult?.ad2shipOrderId) {
        if (!order.shipping) order.shipping = {}
        order.shipping.provider = 'ad2ship'
        order.shipping.ad2shipOrderId = shipResult.ad2shipOrderId
        order.shipping.status = 'pending'
      }
    } catch (shipErr) {
      console.warn(`⚠️ Ad2Ship online order creation notice for #${order.orderNumber}:`, shipErr.message)
    }
  }

  res.json({ success: true, data: order })
})

// @desc    Approve COD payment for Offline Store order
// @route   PUT /api/orders/:id/approve-cod
// @access  Admin
export const approveCodOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  if (String(order.orderType || '').toUpperCase() !== 'OFFLINE' || String(order.paymentMethod || '').toLowerCase() !== 'cod') {
    res.status(400)
    throw new Error('Only Offline Store COD orders can be approved.')
  }

  order.paymentStatus = 'paid'
  order.status = 'confirmed'
  order.approvedBy = req.user?._id
  order.approvedAt = new Date()

  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'COD Approved',
    timestamp: new Date(),
    note: `COD Payment approved by ${req.user?.name || 'Admin'}`
  })

  await order.save()
  await order.populate('approvedBy', 'name email')

  // Send COD Approval Email to Customer!
  sendOrderEmail(order, 'COD_APPROVED').catch(err => console.error('COD approval email error:', err.message))

  res.json({ success: true, data: order })
})

// @desc    Reject COD payment for Offline Store order
// @route   PUT /api/orders/:id/reject-cod
// @access  Admin
export const rejectCodOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  if (String(order.orderType || '').toUpperCase() !== 'OFFLINE' || String(order.paymentMethod || '').toLowerCase() !== 'cod') {
    res.status(400)
    throw new Error('Only Offline Store COD orders can be rejected.')
  }

  order.paymentStatus = 'rejected'
  order.status = 'cancelled'

  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'COD Rejected',
    timestamp: new Date(),
    note: 'COD Payment rejected by Admin'
  })

  await order.save()
  await order.populate('approvedBy', 'name email')

  // Send COD Rejection Email to Customer!
  sendOrderEmail(order, 'CANCELLED').catch(err => console.error('COD rejection email error:', err.message))

  res.json({ success: true, data: order })
})
