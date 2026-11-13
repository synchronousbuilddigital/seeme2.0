import Order from '../models/Order.js'
import Product from '../models/Product.js'
import ad2shipService from './ad2shipService.js'
import { mapAd2ShipStatusToOrder, shouldAdvanceOrderStatus, AD2SHIP_STATUSES } from '../utils/shippingStatuses.js'

export const cleanPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length >= 10) return digits.slice(-10)
  return digits.padStart(10, '9')
}

export const parseAd2ShipMessage = (msgData) => {
  if (!msgData) return 'Ad2Ship operation failed'
  if (typeof msgData === 'string') return msgData
  if (Array.isArray(msgData)) {
    return msgData.map(parseAd2ShipMessage).filter(Boolean).join('; ')
  }
  if (typeof msgData === 'object') {
    if (msgData.message) return parseAd2ShipMessage(msgData.message)
    if (msgData.error) return parseAd2ShipMessage(msgData.error)
    const entries = Object.entries(msgData).map(([k, v]) => {
      const valStr = typeof v === 'object' ? parseAd2ShipMessage(v) : (Array.isArray(v) ? v.join(', ') : String(v))
      return `${k}: ${valStr}`
    })
    return entries.join('; ')
  }
  return String(msgData)
}

/**
 * Calculates aggregate shipment weight (kg) and dimensions (cm) for an array of cart/order items.
 * Extracts the ACTUAL dimensions and weight configured on the products or saved on order line-items.
 */
export const calculateShipmentSpecs = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      weight: 0.5,
      length: 20,
      breadth: 15,
      height: 5
    }
  }

  let totalWeightKg = 0
  let maxLengthCm = 0
  let maxBreadthCm = 0
  let totalHeightCm = 0

  for (const item of items) {
    if (!item) continue
    const qty = Math.max(1, Number(item.quantity) || 1)

    // 1. Resolve product object or lookup by ID
    let prodObj = null
    let productId = null

    if (item.product && typeof item.product === 'object' && item.product._id) {
      prodObj = item.product
      productId = item.product._id
    } else if (item.product && typeof item.product === 'object' && item.product.id) {
      prodObj = item.product
      productId = item.product.id
    } else {
      productId = item.product || item.id || item._id
    }

    if (productId && (!prodObj || (!prodObj.dimensions && !prodObj.weightKg))) {
      try {
        const dbProduct = await Product.findById(productId).lean()
        if (dbProduct) {
          prodObj = { ...dbProduct, ...(prodObj || {}) }
        }
      } catch (err) {
        // Query fallback; continue with item data
      }
    }

    // 2. Resolve Actual Weight (in kg)
    let itemWeightKg = null

    // Priority A: Order item snapshot (convert grams >= 20 to kg)
    if (typeof item.weightKg === 'number' && item.weightKg > 0) {
      itemWeightKg = item.weightKg >= 20 ? (item.weightKg / 1000) : item.weightKg
    } else if (typeof item.weightKg === 'string' && parseFloat(item.weightKg) > 0) {
      const parsedKg = parseFloat(item.weightKg)
      itemWeightKg = parsedKg >= 20 ? (parsedKg / 1000) : parsedKg
    } else if (typeof item.weight === 'number' && item.weight > 0) {
      itemWeightKg = item.weight >= 20 ? (item.weight / 1000) : item.weight
    } else if (typeof item.weight === 'string' && parseFloat(item.weight) > 0) {
      const parsed = parseFloat(item.weight)
      itemWeightKg = parsed >= 20 ? (parsed / 1000) : parsed
    }

    // Priority B: Product definition (convert grams >= 20 to kg)
    if (itemWeightKg === null && prodObj) {
      if (typeof prodObj.weightKg === 'number' && prodObj.weightKg > 0) {
        itemWeightKg = prodObj.weightKg >= 20 ? (prodObj.weightKg / 1000) : prodObj.weightKg
      } else if (typeof prodObj.weightKg === 'string' && parseFloat(prodObj.weightKg) > 0) {
        const parsedKg = parseFloat(prodObj.weightKg)
        itemWeightKg = parsedKg >= 20 ? (parsedKg / 1000) : parsedKg
      } else if (typeof prodObj.weight === 'number' && prodObj.weight > 0) {
        itemWeightKg = prodObj.weight >= 20 ? (prodObj.weight / 1000) : prodObj.weight
      } else if (typeof prodObj.weight === 'string' && parseFloat(prodObj.weight) > 0) {
        const parsed = parseFloat(prodObj.weight)
        itemWeightKg = parsed >= 20 ? (parsed / 1000) : parsed
      } else if (prodObj.weight && typeof prodObj.weight === 'object') {
        if (typeof prodObj.weight.valueGrams === 'number' && prodObj.weight.valueGrams > 0) {
          itemWeightKg = prodObj.weight.valueGrams / 1000
        } else if (typeof prodObj.weight.value === 'number' && prodObj.weight.value > 0) {
          itemWeightKg = prodObj.weight.value >= 20 ? (prodObj.weight.value / 1000) : prodObj.weight.value
        }
      }
    }

    // Fallback ONLY if product has no weight defined anywhere in system
    if (itemWeightKg === null || itemWeightKg <= 0) {
      itemWeightKg = 0.5
    }

    // 3. Resolve Actual Dimensions (Length, Breadth/Width, Height in cm)
    let itemL = null
    let itemB = null
    let itemH = null

    // Priority A: Line-item snapshot
    if (item.dimensions) {
      if (parseFloat(item.dimensions.length) > 0) itemL = parseFloat(item.dimensions.length)
      if (parseFloat(item.dimensions.width) > 0) itemB = parseFloat(item.dimensions.width)
      else if (parseFloat(item.dimensions.breadth) > 0) itemB = parseFloat(item.dimensions.breadth)
      if (parseFloat(item.dimensions.height) > 0) itemH = parseFloat(item.dimensions.height)
    }

    // Priority B: Product definition
    if (prodObj) {
      const dim = prodObj.dimensions || {}
      if (itemL === null) {
        if (parseFloat(dim.length) > 0) itemL = parseFloat(dim.length)
        else if (parseFloat(dim.lengthCm) > 0) itemL = parseFloat(dim.lengthCm)
        else if (parseFloat(prodObj.lengthCm) > 0) itemL = parseFloat(prodObj.lengthCm)
        else if (typeof prodObj.length === 'number' && prodObj.length > 0) itemL = prodObj.length
      }
      if (itemB === null) {
        if (parseFloat(dim.width) > 0) itemB = parseFloat(dim.width)
        else if (parseFloat(dim.widthCm) > 0) itemB = parseFloat(dim.widthCm)
        else if (parseFloat(dim.breadth) > 0) itemB = parseFloat(dim.breadth)
        else if (parseFloat(prodObj.breadth) > 0) itemB = parseFloat(prodObj.breadth)
        else if (parseFloat(prodObj.widthCm) > 0) itemB = parseFloat(prodObj.widthCm)
      }
      if (itemH === null) {
        if (parseFloat(dim.height) > 0) itemH = parseFloat(dim.height)
        else if (parseFloat(dim.heightCm) > 0) itemH = parseFloat(dim.heightCm)
        else if (parseFloat(prodObj.heightCm) > 0) itemH = parseFloat(prodObj.heightCm)
        else if (typeof prodObj.height === 'number' && prodObj.height > 0) itemH = prodObj.height
      }
    }

    // Fallbacks ONLY if no actual dimensions exist on the product
    itemL = itemL !== null && itemL > 0 ? itemL : 20
    itemB = itemB !== null && itemB > 0 ? itemB : 15
    itemH = itemH !== null && itemH > 0 ? itemH : 5

    // 4. Apparel Folding Normalizer:
    // Garment flat dimensions (e.g., 72cm length, 52cm chest width) are folded into standard shipping polybags.
    // If a dimension exceeds courier flyer limits (> 38cm length or > 28cm breadth), fold it to standard flyer size.
    if (itemL > 38 || itemB > 28) {
      itemL = Math.min(35, itemL / 2 > 20 ? itemL / 2 : 30)
      itemB = Math.min(28, itemB / 2 > 15 ? itemB / 2 : 24)
      itemH = Math.max(itemH, 3) // Folded apparel creates ~3-4cm thickness
    }

    // 5. Aggregate across quantity and items
    totalWeightKg += itemWeightKg * qty
    maxLengthCm = Math.max(maxLengthCm, itemL)
    maxBreadthCm = Math.max(maxBreadthCm, itemB)
    totalHeightCm += itemH * qty
  }

  // Courier acceptance bounds (min 0.01kg, max 50kg allowed by logistics network)
  // Ensure final aggregated parcel dimensions never exceed a standard e-commerce courier flyer (max 38 x 30 cm)
  // for apparel parcels weighing under 1.5kg
  if (totalWeightKg <= 1.5) {
    maxLengthCm = Math.min(35, maxLengthCm)
    maxBreadthCm = Math.min(28, maxBreadthCm)
    totalHeightCm = Math.min(8, Math.max(3, totalHeightCm))
  }
  totalWeightKg = Math.min(50, Math.max(0.01, Number(totalWeightKg.toFixed(3))))
  maxLengthCm = Math.max(1, Number(maxLengthCm.toFixed(1)))
  maxBreadthCm = Math.max(1, Number(maxBreadthCm.toFixed(1)))
  totalHeightCm = Math.max(1, Number(totalHeightCm.toFixed(1)))

  const specs = {
    weight: totalWeightKg,
    length: maxLengthCm,
    breadth: maxBreadthCm,
    height: totalHeightCm
  }

  console.log(` Ad2Ship Real Shipment Specs: weight=${specs.weight}kg, length=${specs.length}cm, breadth=${specs.breadth}cm, height=${specs.height}cm (${items.length} item(s))`)

  return specs
}

/**
 * Helper to get default pickup warehouse details from environment
 */
export const getPickupWarehouseDetails = () => {
  const warehouseName = process.env.WAREHOUSE_NAME || process.env.AD2SHIP_PICKUP_WAREHOUSE_NAME
  const contactName = process.env.WAREHOUSE_CONTACT_NAME || process.env.AD2SHIP_PICKUP_CONTACT_NAME
  const addressLine1 = process.env.WAREHOUSE_ADDRESS_LINE1 || process.env.AD2SHIP_PICKUP_ADDRESS_LINE1
  const addressLine2 = process.env.WAREHOUSE_ADDRESS_LINE2 || process.env.AD2SHIP_PICKUP_ADDRESS_LINE2 || ''
  const city = process.env.WAREHOUSE_CITY || process.env.AD2SHIP_PICKUP_CITY
  const state = process.env.WAREHOUSE_STATE || process.env.AD2SHIP_PICKUP_STATE
  const pincode = process.env.WAREHOUSE_PINCODE || process.env.AD2SHIP_PICKUP_PINCODE
  const phone = process.env.WAREHOUSE_CONTACT || process.env.AD2SHIP_PICKUP_PHONE
  const email = process.env.WAREHOUSE_EMAIL || process.env.AD2SHIP_PICKUP_EMAIL

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

  const pickupPincode = (process.env.WAREHOUSE_PINCODE || process.env.AD2SHIP_PICKUP_PINCODE || '').trim()
  if (!pickupPincode) {
    const err = new Error('Pickup pincode (WAREHOUSE_PINCODE) is missing in environment.')
    err.statusCode = 400
    throw err
  }

  const specs = await calculateShipmentSpecs(items)

  let cleanInvoiceAmount = 100
  if (invoiceAmount) {
    if (typeof invoiceAmount === 'number' && !isNaN(invoiceAmount) && invoiceAmount > 0) {
      cleanInvoiceAmount = invoiceAmount
    } else if (typeof invoiceAmount === 'string') {
      const parsed = parseFloat(invoiceAmount.replace(/[^\d.]/g, ''))
      if (!isNaN(parsed) && parsed > 0) cleanInvoiceAmount = parsed
    }
  }

  const result = await ad2shipService.calculateRate({
    pickupPincode,
    deliveryPincode: cleanPin,
    orderType,
    paymentType,
    weight: specs.weight,
    length: specs.length,
    breadth: specs.breadth,
    height: specs.height,
    invoiceAmount: cleanInvoiceAmount
  })

  if (!result || result.status === false) {
    let msg = result?.message || 'Pincode not serviceable by logistics network.'
    if (typeof msg === 'object' && msg !== null) {
      msg = Object.entries(msg)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('; ')
    }
    return {
      success: false,
      message: String(msg),
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

  const order = await Order.findById(orderId).populate('items.product').catch(() => null)
  if (!order) {
    const err = new Error('Order not found.')
    err.statusCode = 404
    throw err
  }

  // OFFLINE STORE ORDER CHECK: Prevent offline orders from sending products to Ad2Ship
  if (String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE') {
    const err = new Error('Ad2Ship logistics/shipping creation is disabled for Offline Store orders.')
    err.statusCode = 400
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
  if (pickupDetails.Contact) {
    pickupDetails.Contact = cleanPhone(pickupDetails.Contact)
  }

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
    InvoiceAmount: Number(order.totalAmount || 0),
    CollectableAmount: order.paymentMethod === 'cod' ? Number(order.totalAmount || 0) : 0,
    Addresses: {
      ShippingAddress: {
        CustomerName: order.customer.name || 'Customer',
        AddressLine1: order.customer.address?.street || 'Address Line 1',
        AddressLine2: order.customer.address?.city || '',
        City: order.customer.address?.city || 'City',
        State: order.customer.address?.state || 'State',
        Pincode: cleanShippingPin,
        Contact: cleanPhone(order.customer.phone),
        Email: order.customer.email || ''
      },
      BillingAddress: {
        CustomerName: order.billingAddress?.name || order.customer.name || 'Customer',
        AddressLine1: order.billingAddress?.street || order.customer.address?.street || 'Address Line 1',
        AddressLine2: order.billingAddress?.city || order.customer.address?.city || '',
        City: order.billingAddress?.city || order.customer.address?.city || 'City',
        State: order.billingAddress?.state || order.customer.address?.state || 'State',
        Pincode: String(order.billingAddress?.pincode || cleanShippingPin).replace(/\D/g, '') || cleanShippingPin,
        Contact: cleanPhone(order.customer.phone),
        Email: order.customer.email || ''
      },
      PickupAddress: pickupDetails
    },
    ProductDetails: order.items.map(item => {
      const p = item.product
      // Build human-friendly SKU code: SKU (or short ID) + Size + Color (e.g., "TSHIRT-M" or "SM-BLK-L")
      const baseSku = (typeof p === 'object' && p !== null && p.sku) ? String(p.sku).trim() : ''
      const sizeTag = item.size ? `-${String(item.size).toUpperCase().trim()}` : ''
      const colorTag = item.color ? `-${String(item.color).toUpperCase().trim()}` : ''
      
      const fallbackSku = baseSku ? `${baseSku}${sizeTag}${colorTag}` : (
        item.name 
          ? `${item.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}${sizeTag}`
          : `SKU${sizeTag || '-STD'}`
      )

      // Include size and color directly in the item name printed on the label
      const sizeStr = item.size ? ` (Size: ${item.size})` : ''
      const colorStr = item.color ? ` (Color: ${item.color})` : ''
      const displayName = `${item.name || 'Product'}${sizeStr}${colorStr}`

      return {
        Name: displayName.slice(0, 80),
        SKU: fallbackSku.slice(0, 30),
        QTY: String(item.quantity || 1),
        Amount: String(item.price || 0)
      }
    }),
    EwayBill: '',
    GstNumber: '',
    ShippingCharge: '0',
    CodCharge: '0',
    Discount: String(order.couponDiscount || 0)
  }

  const response = await ad2shipService.createOrder([orderPayload])
  console.log('📦 Ad2Ship createOrder response:', JSON.stringify(response))

  if (!Array.isArray(response) || !response[0] || response[0].status === false) {
    const rawMsg = response?.[0]?.message || response?.message || 'Order creation failed in Ad2Ship.'
    const errorMsg = parseAd2ShipMessage(rawMsg)
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
    message: parseAd2ShipMessage(response[0].message) || 'Order created successfully in Ad2Ship.',
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
    const createdRes = await createAd2ShipOrderForSeemeeOrder(order._id)
    order.shipping = createdRes.order.shipping
  }

  // DUPLICATE SHIPMENT CHECK
  if (order.shipping?.awbNumber) {
    throw new Error(`Order #${order.orderNumber} is already shipped with AWB: ${order.shipping.awbNumber}`)
  }

  const response = await ad2shipService.shipOrder({
    orderId: order.shipping.ad2shipOrderId,
    courierPartnerId
  })
  console.log('📦 Ad2Ship shipOrder response:', JSON.stringify(response))

  if (!response || response.status === false) {
    const errorMsg = parseAd2ShipMessage(response?.message || response)
    const err = new Error(errorMsg || 'Failed to dispatch shipment via Ad2Ship.')
    err.statusCode = 400
    throw err
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
    const err = new Error('No Ad2Ship Order ID found for this order.')
    err.statusCode = 400
    throw err
  }

  if (!order.shipping?.awbNumber) {
    const err = new Error(`Order must be shipped with an assigned AWB number before generating ${documentType}. Please ship the order first.`)
    err.statusCode = 400
    throw err
  }

  const ad2shipId = order.shipping.ad2shipOrderId

  if (documentType === 'label') {
    const res = await ad2shipService.generateLabel({ orderId: ad2shipId })
    if (!res || res.status === false) {
      const err = new Error(parseAd2ShipMessage(res?.message) || 'Failed to generate label.')
      err.statusCode = 400
      throw err
    }
    
    order.shipping.labelUrl = res.label
    await order.save()
    return { success: true, labelUrl: res.label, message: parseAd2ShipMessage(res.message) || 'Label generated successfully.' }
  }

  if (documentType === 'invoice') {
    const res = await ad2shipService.generateInvoice({ orderId: ad2shipId })
    if (!res || res.status === false) {
      const err = new Error(parseAd2ShipMessage(res?.message) || 'Failed to generate invoice.')
      err.statusCode = 400
      throw err
    }
    
    order.shipping.invoiceUrl = res.invoice
    await order.save()
    return { success: true, invoiceUrl: res.invoice, message: parseAd2ShipMessage(res.message) || 'Invoice generated successfully.' }
  }

  if (documentType === 'manifest') {
    if (order.shipping?.manifestGenerated) {
      return {
        success: true,
        message: 'Manifest has already been generated for this order.',
        manifestUrl: order.shipping.manifestUrl || '',
        manifestGenerated: true
      }
    }

    const res = await ad2shipService.generateManifest({ orderId: ad2shipId })
    if (!res || res.status === false) {
      const msgStr = parseAd2ShipMessage(res?.message)
      // Ad2Ship returns "Unable to generate manifest." if already generated or processed
      if (msgStr.toLowerCase().includes('unable') || msgStr.toLowerCase().includes('already')) {
        order.shipping.manifestGenerated = true
        await order.save()
        return {
          success: true,
          message: 'Manifest marked as generated for this order.',
          manifestGenerated: true
        }
      }
      const err = new Error(msgStr || 'Order cannot be manifested.')
      err.statusCode = 400
      throw err
    }
    
    const manifestPdfUrl = res.manifest || res.url || res.manifest_url || res.data?.manifest || ''
    order.shipping.manifestGenerated = true
    order.shipping.status = AD2SHIP_STATUSES.MANIFESTED
    if (manifestPdfUrl) {
      order.shipping.manifestUrl = manifestPdfUrl
    }
    await order.save()
    return { success: true, manifestUrl: manifestPdfUrl, message: parseAd2ShipMessage(res.message) || 'Manifest generated successfully.', manifestGenerated: true }
  }

  throw new Error(`Unsupported document type: ${documentType}`)
}

const cleanOptionalStr = (val) => {
  if (val === null || val === undefined || typeof val === 'boolean') return ''
  const str = String(val).trim()
  if (!str || ['null', 'undefined', 'unassigned', 'none', 'n/a'].includes(str.toLowerCase())) {
    return ''
  }
  return str
}

/**
 * Syncs Ad2Ship tracking or webhook payload fields (AWB, courier, charges, status, timeline)
 * back into the local Seemee Order document.
 */
export const applyAd2ShipTrackingToOrder = async (order, trackingRes, { source = 'Ad2Ship sync', saveAlways = false } = {}) => {
  if (!order || !trackingRes || trackingRes.status === false) {
    return { order, changed: false }
  }

  const payload = (trackingRes.data && typeof trackingRes.data === 'object' && !Array.isArray(trackingRes.data))
    ? { ...trackingRes, ...trackingRes.data }
    : trackingRes

  if (!order.shipping) order.shipping = {}
  let changed = false

  const awb = cleanOptionalStr(
    payload.AWBNumber || payload.awbNumber || payload.awb_number || payload.awb || payload.AWB || payload.Awb
  )
  if (awb && order.shipping.awbNumber !== awb) {
    order.shipping.awbNumber = awb
    order.trackingNumber = awb
    if (!order.shipping.shippedAt) {
      order.shipping.shippedAt = new Date()
    }
    changed = true
  } else if (awb && !order.trackingNumber) {
    order.trackingNumber = awb
    changed = true
  }

  const courier = cleanOptionalStr(
    payload.CourierPartner || payload.courierPartner || payload.courier || payload.courier_name || payload.CourierName
  )
  if (courier && order.shipping.courierName !== courier) {
    order.shipping.courierName = courier
    changed = true
  }

  const totalCharges = Number(payload.total_charges ?? payload.totalCharges ?? payload.TotalCharges ?? 0)
  if (totalCharges > 0 && order.shipping.totalCharges !== totalCharges) {
    order.shipping.totalCharges = totalCharges
    const shipCharges = Number(payload.shipping_charges ?? payload.shippingCharges ?? 0)
    const codCharges = Number(payload.cod_charges ?? payload.codCharges ?? 0)
    const otherCharges = Number(payload.other_charges ?? payload.otherCharges ?? 0)
    if (shipCharges > 0) order.shipping.shippingCharges = shipCharges
    if (codCharges > 0) order.shipping.codCharges = codCharges
    if (otherCharges > 0) order.shipping.otherCharges = otherCharges
    changed = true
  }

  const expectedDateRaw = cleanOptionalStr(
    payload.ExpectedDeliveryDate || payload.expectedDeliveryDate || payload.expected_delivery_date
  )
  if (expectedDateRaw) {
    const parsedDate = new Date(expectedDateRaw)
    if (!isNaN(parsedDate.getTime())) {
      const prevTs = order.estimatedDelivery ? new Date(order.estimatedDelivery).getTime() : 0
      if (prevTs !== parsedDate.getTime()) {
        order.estimatedDelivery = parsedDate
        order.shipping.expectedDeliveryAt = parsedDate
        changed = true
      }
    }
  }

  const rawStatus = cleanOptionalStr(
    payload.CurrentStatus || payload.StatusCode || payload.currentStatus || payload.status || payload.Status
  )
  const statusDesc = cleanOptionalStr(
    payload.StatusDescription || payload.statusDescription || payload.activity || payload.remark || payload.message
  )

  if (rawStatus) {
    const normalizedShippingStatus = rawStatus.toLowerCase()
    const shippingStatusChanged = order.shipping.status !== normalizedShippingStatus
    if (shippingStatusChanged) {
      order.shipping.status = normalizedShippingStatus
      changed = true
    }

    const mappedStatus = mapAd2ShipStatusToOrder(rawStatus)
    const mainStatusChanged = shouldAdvanceOrderStatus(order.status, mappedStatus)
    if (mainStatusChanged) {
      order.status = mappedStatus
      if (mappedStatus === 'delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid'
      }
      changed = true
    }

    if (shippingStatusChanged || mainStatusChanged) {
      if (!order.timeline) order.timeline = []
      const noteText = `${source}: ${statusDesc || rawStatus}`
      const lastEntry = order.timeline[order.timeline.length - 1]
      if (!lastEntry || lastEntry.status !== rawStatus || lastEntry.note !== noteText) {
        order.timeline.push({
          status: rawStatus,
          note: noteText,
          timestamp: new Date()
        })
      }
    }
  } else if (awb && shouldAdvanceOrderStatus(order.status, 'shipped')) {
    // AWB assigned directly on Ad2Ship panel even if CurrentStatus wasn't returned
    order.status = 'shipped'
    if (!order.shipping.status || order.shipping.status === 'pending') {
      order.shipping.status = AD2SHIP_STATUSES.SHIPPED
    }
    if (!order.timeline) order.timeline = []
    order.timeline.push({
      status: 'Shipped',
      note: `${source}: AWB ${awb}${courier ? ` via ${courier}` : ''}`,
      timestamp: new Date()
    })
    changed = true
  }

  order.shipping.lastSyncedAt = new Date()
  if (changed || saveAlways) {
    await order.save()
  }

  return { order, changed }
}

/**
 * 5. Track Order
 */
export const trackShipment = async ({ awbNumber, orderId }) => {
  let awb = cleanOptionalStr(awbNumber)
  let order = null

  if (orderId) {
    order = await Order.findById(orderId).catch(() => null)
    if (!awb && order?.shipping?.awbNumber) {
      awb = cleanOptionalStr(order.shipping.awbNumber)
    }
  }

  let res = null
  if (awb) {
    res = await ad2shipService.trackOrder({ awbNumber: awb })
  } else if (order?.shipping?.ad2shipOrderId) {
    res = await ad2shipService.trackOrderById({ orderId: order.shipping.ad2shipOrderId })
  } else {
    throw new Error('AWB Number or valid Order ID is required for tracking.')
  }

  if (order && res) {
    await applyAd2ShipTrackingToOrder(order, res, { source: 'Shipment update', saveAlways: true })
  }

  return {
    success: true,
    data: res,
    order
  }
}

/**
 * 5b. Force-sync a single order from Ad2Ship (used by Admin Sync button)
 */
export const syncOrderFromAd2Ship = async (orderId) => {
  const order = await Order.findById(orderId)
  if (!order) {
    const err = new Error('Order not found.')
    err.statusCode = 404
    throw err
  }
  if (!order.shipping?.ad2shipOrderId && !order.shipping?.awbNumber && !order.trackingNumber) {
    const err = new Error('This order does not have an Ad2Ship Order ID or AWB number yet.')
    err.statusCode = 400
    throw err
  }

  return trackShipment({
    awbNumber: order.shipping?.awbNumber || order.trackingNumber,
    orderId: order._id
  })
}

/**
 * 5c. Lightweight auto-sync for active online orders when listing customer/admin orders
 */
export const syncActiveAd2ShipOrders = async (orders = [], { cooldownMs = 2 * 60 * 1000, maxOrders = 8 } = {}) => {
  if (!Array.isArray(orders) || orders.length === 0) return orders

  const now = Date.now()
  const candidates = orders.filter((order) => {
    if (!order || String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE') return false
    const status = String(order.status || '').toLowerCase()
    if (['delivered', 'cancelled', 'refunded'].includes(status)) return false
    if (!order.shipping?.ad2shipOrderId && !order.shipping?.awbNumber && !order.trackingNumber) return false

    const lastSynced = order.shipping?.lastSyncedAt ? new Date(order.shipping.lastSyncedAt).getTime() : 0
    return (now - lastSynced) >= cooldownMs
  }).slice(0, maxOrders)

  if (candidates.length === 0) return orders

  await Promise.allSettled(
    candidates.map(async (order) => {
      try {
        const awb = cleanOptionalStr(order.shipping?.awbNumber || order.trackingNumber)
        const res = awb
          ? await ad2shipService.trackOrder({ awbNumber: awb })
          : await ad2shipService.trackOrderById({ orderId: order.shipping.ad2shipOrderId })
        await applyAd2ShipTrackingToOrder(order, res, { source: 'Auto sync', saveAlways: true })
      } catch (err) {
        // Non-fatal: keep existing DB order data if Ad2Ship is temporarily unreachable
        console.warn(`⚠️ Auto-sync skipped for Order #${order.orderNumber}:`, err.message)
      }
    })
  )

  return orders
}

/**
 * 6. Cancel Ad2Ship Order
 */
export const cancelShipment = async (orderId) => {
  const order = await Order.findById(orderId)
  if (!order) {
    const err = new Error('Order not found.')
    err.statusCode = 404
    throw err
  }

  const currentStatus = String(order.status).toLowerCase()
  const shippingStatus = String(order.shipping?.status || '').toLowerCase()

  if (currentStatus === 'cancelled') {
    return {
      success: true,
      message: 'Order is already cancelled.',
      order
    }
  }

  // RULE 1: Cancellation can ONLY be done BEFORE shipping
  const isShipped = ['shipped', 'delivered', 'in_transit', 'out_for_delivery'].includes(currentStatus) ||
                    ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(shippingStatus) ||
                    Boolean(order.shipping?.awbNumber)

  if (isShipped) {
    const err = new Error('Order cancellation is ONLY allowed BEFORE shipping. Once shipped with an AWB, the order cannot be cancelled.')
    err.statusCode = 400
    throw err
  }

  // RULE 2: Refund can ONLY be done BEFORE pickup from warehouse
  const isPickedUp = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus) ||
                     ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].includes(shippingStatus) ||
                     Boolean(order.shipping?.pickupAt)

  if (isPickedUp) {
    const err = new Error('Refunds and cancellation are ONLY allowed BEFORE package pickup from warehouse.')
    err.statusCode = 400
    throw err
  }

  // If Ad2Ship Order exists, call Ad2Ship cancel API
  if (order.shipping?.ad2shipOrderId) {
    const res = await ad2shipService.cancelOrder({ orderId: order.shipping.ad2shipOrderId })
    if (!res || res.status === false) {
      const err = new Error(parseAd2ShipMessage(res?.message) || 'Ad2Ship order cancellation rejected.')
      err.statusCode = 400
      throw err
    }
    if (!order.shipping) order.shipping = {}
    order.shipping.status = AD2SHIP_STATUSES.CANCELLED
  }

  // Restore inventory stock
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product).catch(() => null)
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

  // Update order status to cancelled
  order.status = 'cancelled'

  if (!order.timeline) order.timeline = []
  order.timeline.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: 'Shipment and order cancelled by admin.'
  })

  await order.save()

  return {
    success: true,
    message: 'Shipment cancelled successfully and inventory restored.',
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
  syncOrderFromAd2Ship,
  syncActiveAd2ShipOrders,
  applyAd2ShipTrackingToOrder,
  cancelShipment
}
