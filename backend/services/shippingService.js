import Order from '../models/Order.js'
import Product from '../models/Product.js'
import ad2shipService from './ad2shipService.js'
import { mapAd2ShipStatusToOrder, AD2SHIP_STATUSES } from '../utils/shippingStatuses.js'

/**
 * Calculates aggregate shipment weight (kg) and dimensions (cm) for an array of cart/order items
 */
export const calculateShipmentSpecs = async (items = []) => {
  let totalWeightKg = 0
  let maxLengthCm = 10
  let maxBreadthCm = 10
  let totalHeightCm = 0

  for (const item of items) {
    const productId = item.product || item.id || item._id
    const qty = Number(item.quantity) || 1

    let weightGrams = 500 // default 500g per item
    let l = 10, b = 10, h = 5

    if (productId) {
      const product = await Product.findById(productId).lean().catch(() => null)
      if (product) {
        if (product.weight?.valueGrams && product.weight.valueGrams > 0) {
          weightGrams = product.weight.valueGrams
        }
        if (product.dimensions) {
          if (product.dimensions.lengthCm > 0) l = product.dimensions.lengthCm
          if (product.dimensions.widthCm > 0) b = product.dimensions.widthCm
          if (product.dimensions.heightCm > 0) h = product.dimensions.heightCm
        }
      }
    }

    totalWeightKg += (weightGrams / 1000) * qty
    maxLengthCm = Math.max(maxLengthCm, l)
    maxBreadthCm = Math.max(maxBreadthCm, b)
    totalHeightCm += h * qty
  }

  // Sanity lower bounds
  totalWeightKg = Math.max(0.1, Number(totalWeightKg.toFixed(2)))
  maxLengthCm = Math.max(5, Number(maxLengthCm.toFixed(1)))
  maxBreadthCm = Math.max(5, Number(maxBreadthCm.toFixed(1)))
  totalHeightCm = Math.max(5, Number(totalHeightCm.toFixed(1)))

  return {
    weight: totalWeightKg,
    length: maxLengthCm,
    breadth: maxBreadthCm,
    height: totalHeightCm
  }
}

/**
 * Helper to get default pickup warehouse details from environment
 */
export const getPickupWarehouseDetails = () => {
  const warehouseName = process.env.AD2SHIP_PICKUP_WAREHOUSE_NAME
  const contactName = process.env.AD2SHIP_PICKUP_CONTACT_NAME
  const addressLine1 = process.env.AD2SHIP_PICKUP_ADDRESS_LINE1
  const addressLine2 = process.env.AD2SHIP_PICKUP_ADDRESS_LINE2 || ''
  const city = process.env.AD2SHIP_PICKUP_CITY
  const state = process.env.AD2SHIP_PICKUP_STATE
  const pincode = process.env.AD2SHIP_PICKUP_PINCODE
  const phone = process.env.AD2SHIP_PICKUP_PHONE
  const email = process.env.AD2SHIP_PICKUP_EMAIL

  if (!addressLine1 || !city || !state || !pincode) {
    const err = new Error('Pickup warehouse address is not configured.')
    err.statusCode = 400
    throw err
  }

  return {
    WarehouseName: warehouseName || '',
    ContactName: contactName || '',
    AddressLine1: addressLine1,
    AddressLine2: addressLine2,
    City: city,
    State: state,
    Pincode: String(pincode).trim(),
    Contact: phone || '',
    Email: email || ''
  }
}

/**
 * 1. Calculate Shipping Rates
 */
export const getShippingRates = async ({
  deliveryPincode,
  paymentType = 'prepaid',
  orderType = 'forward',
  items = [],
  invoiceAmount = 0
}) => {
  const cleanPin = String(deliveryPincode || '').replace(/\D/g, '')
  if (!cleanPin || cleanPin.length !== 6) {
    const err = new Error('Valid 6-digit delivery pincode is required.')
    err.statusCode = 400
    throw err
  }

  const pickupPincode = process.env.AD2SHIP_PICKUP_PINCODE
  if (!pickupPincode) {
    const err = new Error('AD2SHIP_PICKUP_PINCODE is missing .')
    err.statusCode = 400
    throw err
  }

  const specs = await calculateShipmentSpecs(items)

  const result = await ad2shipService.calculateRate({
    pickupPincode,
    deliveryPincode: cleanPin,
    orderType,
    paymentType,
    weight: specs.weight,
    length: specs.length,
    breadth: specs.breadth,
    height: specs.height,
    invoiceAmount
  })

  if (!result || result.status === false) {
    return {
      success: false,
      message: result?.message || 'Pincode not serviceable by logistics network.',
      partners: []
    }
  }

  return {
    success: true,
    data: result.data || result
  }
}

/**
 * 2. Create Ad2Ship Shipment Order (with Duplicate Protection)
 */
export const createAd2ShipOrderForSeemeeOrder = async (orderId) => {
  if (!orderId) {
    const err = new Error('Order ID is required.')
    err.statusCode = 400
    throw err
  }

  const order = await Order.findById(orderId).catch(() => null)
  if (!order) {
    const err = new Error('Order not found.')
    err.statusCode = 404
    throw err
  }

  // DUPLICATE CREATION CHECK
  if (order.shipping && order.shipping.ad2shipOrderId) {
    console.log(`ℹ️ Ad2Ship order already exists for Order #${order.orderNumber} (ID: ${order.shipping.ad2shipOrderId})`)
    return {
      success: true,
      message: 'Ad2Ship order already created.',
      ad2shipOrderId: order.shipping.ad2shipOrderId,
      order
    }
  }

  const pickupDetails = getPickupWarehouseDetails()
  const specs = await calculateShipmentSpecs(order.items)

  const formattedDate = new Date(order.createdAt || Date.now())
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19)

  const cleanShippingPin = String(order.customer.address?.pincode || '110001').replace(/\D/g, '') || '110001'

  const orderPayload = {
    OrderNumber: String(order.orderNumber || `#${order._id}`),
    OrderType: 'forward',
    PaymentType: order.paymentMethod === 'cod' ? 'cod' : 'prepaid',
    OrderDate: formattedDate,
    Weight: specs.weight,
    Length: specs.length,
    Breadth: specs.breadth,
    Height: specs.height,
    InvoiceAmount: order.totalAmount,
    CollectableAmount: order.paymentMethod === 'cod' ? order.totalAmount : 0,
    Addresses: {
      ShippingAddress: {
        CustomerName: order.customer.name || 'Customer',
        AddressLine1: order.customer.address?.street || 'Address Line 1',
        AddressLine2: order.customer.address?.city || '',
        City: order.customer.address?.city || 'City',
        State: order.customer.address?.state || 'State',
        Pincode: cleanShippingPin,
        Contact: String(order.customer.phone || '9999999999'),
        Email: order.customer.email || ''
      },
      BillingAddress: {
        CustomerName: order.billingAddress?.name || order.customer.name || 'Customer',
        AddressLine1: order.billingAddress?.street || order.customer.address?.street || 'Address Line 1',
        AddressLine2: order.billingAddress?.city || order.customer.address?.city || '',
        City: order.billingAddress?.city || order.customer.address?.city || 'City',
        State: order.billingAddress?.state || order.customer.address?.state || 'State',
        Pincode: String(order.billingAddress?.pincode || cleanShippingPin).replace(/\D/g, '') || cleanShippingPin,
        Contact: String(order.customer.phone || '9999999999'),
        Email: order.customer.email || ''
      },
      PickupAddress: pickupDetails
    },
    ProductDetails: order.items.map(item => {
      const p = item.product
      const skuVal = typeof p === 'object' && p !== null ? (p.sku || String(p._id)) : String(p)
      return {
        Name: item.name || 'Product',
        SKU: skuVal,
        QTY: String(item.quantity || 1),
        Amount: String(item.price || 0)
      }
    }),
    EwayBill: '',
    GstNumber: '',
    ShippingCharge: '0',
    CodCharge: '0',
    Discount: '0'
  }

  const response = await ad2shipService.createOrder([orderPayload])

  if (!Array.isArray(response) || !response[0] || response[0].status === false) {
    const errorMsg = response?.[0]?.message || response?.message || 'Order creation failed in Ad2Ship.'
    throw new Error(errorMsg)
  }

  const ad2shipOrderId = response[0].order_id

  // Save ad2shipOrderId into Seemee order
  if (!order.shipping) {
    order.shipping = {}
  }
  order.shipping.provider = 'ad2ship'
  order.shipping.ad2shipOrderId = ad2shipOrderId
  order.shipping.status = AD2SHIP_STATUSES.PENDING
  await order.save()

  return {
    success: true,
    message: response[0].message || 'Order created successfully in Ad2Ship.',
    ad2shipOrderId,
    order
  }
}

/**
 * 3. Ship Order and Assign Courier (with Duplicate Protection)
 */
export const shipAd2ShipOrder = async ({ orderId, courierPartnerId }) => {
  const order = await Order.findById(orderId)
  if (!order) {
    throw new Error('Order not found.')
  }

  // Ensure Ad2Ship order exists first
  if (!order.shipping?.ad2shipOrderId) {
    await createAd2ShipOrderForSeemeeOrder(order._id)
    await order.reload()
  }

  // DUPLICATE SHIPMENT CHECK
  if (order.shipping?.awbNumber) {
    throw new Error(`Order #${order.orderNumber} is already shipped with AWB: ${order.shipping.awbNumber}`)
  }

  const response = await ad2shipService.shipOrder({
    orderId: order.shipping.ad2shipOrderId,
    courierPartnerId
  })

  if (!response || response.status === false) {
    throw new Error(response?.message || 'Failed to dispatch shipment via Ad2Ship.')
  }

  const shipData = response.data || {}

  // Update order shipping record
  order.shipping.courierPartnerId = Number(courierPartnerId)
  order.shipping.awbNumber = shipData.awb_number
  order.shipping.courierName = shipData.courier
  order.shipping.courierKeyword = shipData.courier_keyword
  order.shipping.routeCode = shipData.route_code || ''
  order.shipping.shippingCharges = Number(response.shipping_charges || 0)
  order.shipping.codCharges = Number(response.cod_charges || 0)
  order.shipping.otherCharges = Number(response.other_charges || 0)
  order.shipping.totalCharges = Number(response.total_charges || 0)
  order.shipping.status = AD2SHIP_STATUSES.SHIPPED
  order.shipping.shippedAt = new Date()

  // Update main order tracking number and status
  order.trackingNumber = shipData.awb_number
  order.status = 'shipped'

  // Push timeline event
  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'Shipped',
    timestamp: new Date(),
    note: `Shipment dispatched via ${shipData.courier}. AWB: ${shipData.awb_number}`
  })

  await order.save()

  return {
    success: true,
    message: 'Shipment dispatched successfully.',
    shipping: order.shipping,
    order
  }
}

/**
 * 4. Document Operations: Label, Invoice, Manifest
 */
export const generateShippingDocument = async ({ orderId, documentType }) => {
  const order = await Order.findById(orderId)
  if (!order) throw new Error('Order not found.')
  if (!order.shipping?.ad2shipOrderId) {
    throw new Error('No Ad2Ship Order ID found for this order.')
  }

  const ad2shipId = order.shipping.ad2shipOrderId

  if (documentType === 'label') {
    const res = await ad2shipService.generateLabel({ orderId: ad2shipId })
    if (!res || res.status === false) throw new Error(res?.message || 'Failed to generate label.')
    
    order.shipping.labelUrl = res.label
    await order.save()
    return { success: true, labelUrl: res.label, message: res.message }
  }

  if (documentType === 'invoice') {
    const res = await ad2shipService.generateInvoice({ orderId: ad2shipId })
    if (!res || res.status === false) throw new Error(res?.message || 'Failed to generate invoice.')
    
    order.shipping.invoiceUrl = res.invoice
    await order.save()
    return { success: true, invoiceUrl: res.invoice, message: res.message }
  }

  if (documentType === 'manifest') {
    const res = await ad2shipService.generateManifest({ orderId: ad2shipId })
    if (!res || res.status === false) throw new Error(res?.message || 'Failed to generate manifest.')
    
    order.shipping.manifestGenerated = true
    order.shipping.status = AD2SHIP_STATUSES.MANIFESTED
    await order.save()
    return { success: true, message: res.message }
  }

  throw new Error(`Unsupported document type: ${documentType}`)
}

/**
 * 5. Track Order
 */
export const trackShipment = async ({ awbNumber, orderId }) => {
  let awb = awbNumber

  if (!awb && orderId) {
    const order = await Order.findById(orderId)
    if (order?.shipping?.awbNumber) {
      awb = order.shipping.awbNumber
    } else if (order?.shipping?.ad2shipOrderId) {
      // Fallback to track by Ad2Ship order ID
      const res = await ad2shipService.trackOrderById({ orderId: order.shipping.ad2shipOrderId })
      return { success: true, data: res }
    }
  }

  if (!awb) {
    throw new Error('AWB Number or valid Order ID is required for tracking.')
  }

  const res = await ad2shipService.trackOrder({ awbNumber: awb })
  
  // Also sync order status if orderId is available
  if (orderId && res && res.CurrentStatus) {
    const order = await Order.findById(orderId)
    if (order) {
      const mappedStatus = mapAd2ShipStatusToOrder(res.CurrentStatus)
      if (mappedStatus && mappedStatus !== order.status) {
        order.status = mappedStatus
        if (order.shipping) {
          order.shipping.status = res.CurrentStatus.toLowerCase()
        }
        await order.save()
      }
    }
  }

  return {
    success: true,
    data: res
  }
}

/**
 * 6. Cancel Ad2Ship Order
 */
export const cancelShipment = async (orderId) => {
  const order = await Order.findById(orderId)
  if (!order) throw new Error('Order not found.')

  const currentStatus = String(order.status).toLowerCase()
  if (['delivered'].includes(currentStatus)) {
    throw new Error('Cannot cancel an order that has already been delivered.')
  }
  if (currentStatus === 'cancelled') {
    throw new Error('Order is already cancelled.')
  }

  // If Ad2Ship Order exists, call Ad2Ship cancel API
  if (order.shipping?.ad2shipOrderId) {
    const res = await ad2shipService.cancelOrder({ orderId: order.shipping.ad2shipOrderId })
    if (!res || res.status === false) {
      throw new Error(res?.message || 'Ad2Ship order cancellation rejected.')
    }
    order.shipping.status = AD2SHIP_STATUSES.CANCELLED
  }

  // Update order status to cancelled
  order.status = 'cancelled'

  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: 'Order shipment cancelled.'
  })

  await order.save()

  return {
    success: true,
    message: 'Shipment cancelled successfully.',
    order
  }
}

export default {
  calculateShipmentSpecs,
  getPickupWarehouseDetails,
  getShippingRates,
  createAd2ShipOrderForSeemeeOrder,
  shipAd2ShipOrder,
  generateShippingDocument,
  trackShipment,
  cancelShipment
}
