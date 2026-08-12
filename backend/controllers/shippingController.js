import asyncHandler from '../utils/asyncHandler.js'
import shippingService from '../services/shippingService.js'

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
      data: result.data
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
      data: result.data
    })
  })
})

// @desc    Cancel Shipment Order
// @route   POST /api/shipping/cancel
// @access  Protected (User or Admin)
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' })
  }

  await handleShippingAction(res, async () => {
    const result = await shippingService.cancelShipment(orderId)

    res.json({
      success: true,
      message: result.message,
      data: result.order
    })
  })
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
  cancelOrder
}
