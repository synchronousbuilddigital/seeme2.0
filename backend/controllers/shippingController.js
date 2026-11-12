import asyncHandler from '../utils/asyncHandler.js'
import shippingService from '../services/shippingService.js'
import Order from '../models/Order.js'
import { mapAd2ShipStatusToOrder } from '../utils/shippingStatuses.js'

// Helper error wrapper for shipping actions
const handleShippingAction = async (res, actionFn) => {
  try {
    return await actionFn()
  } catch (error) {
    const status = error.statusCode || 400
    res.status(status).json({
      success: false,
      message: error.message || 'Shipping operation failed'
    })
  }
}

// @desc    Calculate shipping rates and courier partner availability
// @route   POST /api/shipping/rate
// @access  Public
export const calculateRate = asyncHandler(async (req, res) => {
  const { deliveryPincode, paymentType, orderType, items, invoiceAmount } = req.body

  if (!deliveryPincode) {
    return res.status(400).json({ success: false, message: 'Delivery pincode is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.getShippingRates({
      deliveryPincode,
      paymentType: paymentType || 'prepaid',
      orderType: orderType || 'forward',
      items: items || [],
      invoiceAmount: invoiceAmount || 0
    })

    res.json({
      success: result.success,
      data: result.data || result,
      message: result.message
    })
  })
})

// @desc    Create Ad2Ship shipment order for a Seemee Order
// @route   POST /api/shipping/create
// @access  Admin
export const createOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Seemee Order ID is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.createAd2ShipOrderForSeemeeOrder(orderId)

    res.json({
      success: true,
      message: result.message,
      ad2shipOrderId: result.ad2shipOrderId,
      data: result.order
    })
  })
})

// @desc    Ship order via chosen courier partner and generate AWB
// @route   POST /api/shipping/ship
// @access  Admin
export const shipOrder = asyncHandler(async (req, res) => {
  const { orderId, courierPartnerId } = req.body

  if (!orderId || !courierPartnerId) {
    return res.status(400).json({ success: false, message: 'Order ID and CourierPartnerId are required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.shipAd2ShipOrder({ orderId, courierPartnerId })

    res.json({
      success: true,
      message: result.message,
      shipping: result.shipping,
      data: result.order
    })
  })
})

// @desc    Generate Manifest PDF
// @route   POST /api/shipping/manifest
// @access  Admin
export const generateManifest = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.generateShippingDocument({
      orderId,
      documentType: 'manifest'
    })

    res.json({
      success: true,
      message: result.message
    })
  })
})

// @desc    Generate Shipping Label
// @route   POST /api/shipping/label
// @access  Admin
export const generateLabel = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.generateShippingDocument({
      orderId,
      documentType: 'label'
    })

    res.json({
      success: true,
      message: result.message,
      labelUrl: result.labelUrl
    })
  })
})

// @desc    Generate Invoice PDF
// @route   POST /api/shipping/invoice
// @access  Public / Protected
export const generateInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.generateShippingDocument({
      orderId,
      documentType: 'invoice'
    })

    res.json({
      success: true,
      message: result.message,
      invoiceUrl: result.invoiceUrl
    })
  })
})

// @desc    Track Order by AWB
// @route   POST /api/shipping/track
// @access  Public
export const trackOrder = asyncHandler(async (req, res) => {
  const { awbNumber, orderId } = req.body

  if (!awbNumber && !orderId) {
    return res.status(400).json({ success: false, message: 'AWB Number or Order ID is required for tracking' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.trackShipment({ awbNumber, orderId })

    res.json({
      success: true,
      data: result.data,
      order: result.order
    })
  })
})

// @desc    Track Order by Ad2Ship Order ID
// @route   POST /api/shipping/track-by-id
// @access  Admin
export const trackOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Ad2Ship Order ID is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.trackShipment({ orderId })

    res.json({
      success: true,
      data: result.data,
      order: result.order
    })
  })
})

// @desc    Force-sync Order shipping & AWB details from Ad2Ship
// @route   POST /api/shipping/sync
// @access  Admin
export const syncOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.syncOrderFromAd2Ship(orderId)

    res.json({
      success: true,
      message: result.order?.shipping?.awbNumber
        ? `Synced from Ad2Ship (AWB: ${result.order.shipping.awbNumber})`
        : 'Synced latest status from Ad2Ship.',
      data: result.data,
      order: result.order
    })
  })
})

// @desc    Cancel Shipment Order
// @route   POST /api/shipping/cancel
// @access  Protected (User or Admin)
export const cancelOrder = asyncHandler(async (req, res) => {
  const targetOrderId = req.body.orderId || req.body._id || req.body.id

  if (!targetOrderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' })
  }

  // Authorization Guard: Verify order exists and requesting user is owner or admin
  const order = await Order.findById(targetOrderId)
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  const isAdmin = req.user && req.user.role === 'admin'
  const userEmail = (req.user?.email || '').trim().toLowerCase()
  const orderEmail = (order.customer?.email || '').trim().toLowerCase()
  const isOwner = (orderEmail && orderEmail === userEmail) || (order.user && String(order.user) === String(req.user?._id))

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized to cancel shipment for this order' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.cancelShipment(targetOrderId)

    res.json({
      success: true,
      message: result.message,
      data: result.order
    })
  })
})

// @desc    Ad2Ship Logistics Webhook for automatic delivery lifecycle updates
// @route   POST /api/shipping/webhook
// @access  Public (Webhook / Courier callback)
export const handleShippingWebhook = asyncHandler(async (req, res) => {
  const payload = req.body || {}
  
  // Extract identifiers from various potential Ad2Ship webhook payload formats
  const awb = payload.awbNumber || payload.awb || payload.AWB || payload.Awb || payload.data?.awb
  const ad2shipOrderId = payload.ad2shipOrderId || payload.order_id || payload.OrderId || payload.orderId
  const orderNumber = payload.orderNumber || payload.OrderNumber || payload.data?.orderNumber
  const currentStatus = payload.currentStatus || payload.CurrentStatus || payload.status || payload.Status || payload.data?.status
  const statusDescription = payload.statusDescription || payload.StatusDescription || payload.activity || payload.remark || payload.message || currentStatus

  if (!awb && !ad2shipOrderId && !orderNumber) {
    return res.status(400).json({ success: false, message: 'Missing tracking or order identifiers in webhook payload' })
  }

  // Find order in database
  const query = {
    $or: [
      ...(awb ? [{ 'shipping.awbNumber': awb }, { trackingNumber: awb }] : []),
      ...(ad2shipOrderId ? [{ 'shipping.ad2shipOrderId': String(ad2shipOrderId) }] : []),
      ...(orderNumber ? [{ orderNumber: String(orderNumber) }] : [])
    ]
  }

  const order = await Order.findOne(query)
  if (!order) {
    console.warn('⚠️ [AD2SHIP WEBHOOK] Order not found for webhook payload:', { awb, ad2shipOrderId, orderNumber })
    return res.status(200).json({ success: true, message: 'Webhook received but order not found' })
  }

  const prevStatus = order.status
  const { changed } = await shippingService.applyAd2ShipTrackingToOrder(order, payload, {
    source: 'Ad2Ship webhook',
    saveAlways: true
  })

  if (changed && order.status !== prevStatus && (order.status === 'delivered' || order.status === 'shipped')) {
    try {
      const { sendOrderEmail } = await import('../services/emailService.js')
      sendOrderEmail(order, order.status === 'delivered' ? 'Delivered' : 'Shipped')
        .catch(err => console.error('Webhook order notification email error:', err.message))
    } catch (e) {}
  }

  if (changed) {
    console.log(`✅ [AD2SHIP WEBHOOK] Order #${order.orderNumber} synced (status: ${order.status}, awb: ${order.shipping?.awbNumber || 'none'})`)
  }

  res.json({ success: true, message: 'Webhook processed successfully' })
})

export default {
  calculateRate,
  createOrder,
  shipOrder,
  generateManifest,
  generateLabel,
  generateInvoice,
  trackOrder,
  trackOrderById,
  syncOrder,
  cancelOrder,
  handleShippingWebhook
}
