import dotenv from 'dotenv'
dotenv.config()

/**
 * Low-level service for interacting directly with Ad2Ship API endpoints.
 * Base URL: https://pro.ad2ship.com/api
 */

const getApiBaseUrl = () => {
  const url = process.env.AD2SHIP_API_URL || 'https://pro.ad2ship.com/api'
  return url.replace(/\/+$/, '')
}

const getApiKey = () => {
  return (process.env.AD2SHIP_API_KEY || '').trim()
}

const isApiKeyConfigured = () => {
  const key = getApiKey()
  return Boolean(key && key !== 'YOUR_REAL_AD2SHIP_API_KEY' && key !== 'your_real_ad2ship_api_key')
}

const isMockMode = () => {
  if (process.env.AD2SHIP_MOCK_MODE === 'true' || process.env.AD2SHIP_MOCK_MODE === '1') {
    return true
  }
  // If API key is not configured, default to mock mode unless explicitly set to 'false'
  if (!isApiKeyConfigured() && process.env.AD2SHIP_MOCK_MODE !== 'false') {
    return true
  }
  return false
}

/**
 * Internal helper to send HTTP POST requests to Ad2Ship endpoints
 */
const postToAd2Ship = async (endpoint, payload = {}) => {
  const apiKey = getApiKey()

  if (!isApiKeyConfigured()) {
    if (isMockMode()) {
      return null // Signal caller to use mock fallback response
    }
    const error = new Error('Ad2Ship API credentials are not configured. Please set AD2SHIP_API_KEY in .env or set AD2SHIP_MOCK_MODE=true.')
    error.statusCode = 400
    throw error
  }

  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/${endpoint.replace(/^\/+/, '')}`

  const requestBody = {
    ApiKey: apiKey,
    ...payload
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Ad2Ship API HTTP error ${response.status}: ${errorText || response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error('Ad2Ship API request timed out after 15 seconds.')
    }
    // Mask API key in error messages if present
    const sanitizedMsg = (error.message || 'Ad2Ship request failed').replace(/ApiKey["']?\s*:\s*["']?[^,"'}\s]+/, 'ApiKey: [REDACTED]')
    throw new Error(sanitizedMsg)
  }
}

/**
 * 1. Rate Calculator
 * POST /rate-calculator
 */
export const calculateRate = async ({
  pickupPincode,
  deliveryPincode,
  orderType = 'forward',
  paymentType = 'prepaid',
  weight = 0.5,
  length = 10,
  breadth = 10,
  height = 10,
  invoiceAmount = 100
}) => {
  const payload = {
    PickupPincode: Number(pickupPincode),
    DeliveryPincode: Number(deliveryPincode),
    OrderType: orderType,
    PaymentType: paymentType,
    Weight: Number(weight),
    Length: Number(length),
    Breadth: Number(breadth),
    Height: Number(height),
    InvoiceAmount: Number(invoiceAmount)
  }

  const response = await postToAd2Ship('rate-calculator', payload)

  if (response === null) {
    // Mock Mode Fallback for rate calculator
    return {
      status: true,
      message: 'Success (Mock Mode)',
      data: {
        pickup_pincode: Number(pickupPincode),
        delivery_pincode: Number(deliveryPincode),
        order_type: orderType,
        payment_type: paymentType,
        order_amount: Number(invoiceAmount),
        weight: Number(weight),
        length: Number(length),
        breadth: Number(breadth),
        height: Number(height),
        zone: 'A',
        partners: [
          {
            id: 1,
            name: 'Express Courier (Standard)',
            image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
            freight_charge: 60,
            cod_charge: paymentType === 'cod' ? 40 : 0,
            gst_charge: 18,
            total_charge: paymentType === 'cod' ? 118 : 78
          },
          {
            id: 2,
            name: 'Priority Air Cargo',
            image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec',
            freight_charge: 120,
            cod_charge: paymentType === 'cod' ? 40 : 0,
            gst_charge: 28,
            total_charge: paymentType === 'cod' ? 188 : 148
          }
        ]
      }
    }
  }

  return response
}

/**
 * 2. Create Order
 * POST /order-create
 */
export const createOrder = async (orderDetailsArray) => {
  const response = await postToAd2Ship('order-create', { OrderDetails: orderDetailsArray })

  if (response === null) {
    // Mock Mode Fallback for order creation
    const mockId = Math.floor(100000 + Math.random() * 900000)
    return [
      {
        order_id: mockId,
        status: true,
        message: 'Order created successfully (Mock Mode).'
      }
    ]
  }

  return response
}

/**
 * 3. Ship Order
 * POST /order-ship
 */
export const shipOrder = async ({ orderId, courierPartnerId }) => {
  const payload = {
    OrderID: Number(orderId),
    CourierPartnerId: Number(courierPartnerId)
  }

  const response = await postToAd2Ship('order-ship', payload)

  if (response === null) {
    // Mock Mode Fallback for ship order
    const mockAwb = 'AWB' + Math.floor(100000000 + Math.random() * 900000000)
    return {
      status: true,
      message: 'Order Shipped Successfully (Mock Mode)',
      total_charges: '75',
      shipping_charges: 40,
      cod_charges: 35,
      other_charges: 0,
      data: {
        awb_number: mockAwb,
        courier: 'Ad2Ship Express',
        courier_keyword: 'ad2ship_express',
        route_code: 'DEL-NORTH-01'
      }
    }
  }

  return response
}

/**
 * 4. Generate Manifest
 * POST /generate-manifest
 */
export const generateManifest = async ({ orderId }) => {
  const payload = { OrderID: Number(orderId) }
  const response = await postToAd2Ship('generate-manifest', payload)

  if (response === null) {
    return {
      status: true,
      message: 'Manifest Generated successfully (Mock Mode).'
    }
  }

  return response
}

/**
 * 5. Generate Label
 * POST /generate-label
 */
export const generateLabel = async ({ orderId }) => {
  const payload = { OrderID: Number(orderId) }
  const response = await postToAd2Ship('generate-label', payload)

  if (response === null) {
    return {
      status: true,
      message: 'Label Generated successfully (Mock Mode).',
      label: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
    }
  }

  return response
}

/**
 * 6. Generate Invoice
 * POST /generate-invoice
 */
export const generateInvoice = async ({ orderId }) => {
  const payload = { OrderID: Number(orderId) }
  const response = await postToAd2Ship('generate-invoice', payload)

  if (response === null) {
    return {
      status: true,
      message: 'Invoice Generated successfully (Mock Mode).',
      invoice: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
    }
  }

  return response
}

/**
 * 7. Track Order by AWB
 * POST /order-track
 */
export const trackOrder = async ({ awbNumber }) => {
  const payload = { AWBNumber: String(awbNumber) }
  const response = await postToAd2Ship('order-track', payload)

  if (response === null) {
    return {
      OrderId: '12345',
      OrderNumber: '#00023',
      OrderType: 'forward',
      PaymentType: 'prepaid',
      AWBNumber: String(awbNumber),
      CourierPartner: 'Ad2Ship Express',
      CurrentStatus: 'in_transit',
      StatusCode: 'in_transit',
      OrderDate: new Date().toISOString(),
      ShippedDate: new Date().toISOString(),
      PickupDate: new Date().toISOString(),
      ExpectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      OrderHistory: [
        {
          status_code: 'pending',
          status: 'Order Placed',
          status_description: 'Order created in logistics network',
          remarks: 'System initialized',
          location: 'Delhi Hub',
          event_date: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          status_code: 'picked_up',
          status: 'Picked Up',
          status_description: 'Shipment collected from warehouse',
          remarks: 'Handed over to courier driver',
          location: 'Delhi Warehouse',
          event_date: new Date(Date.now() - 86400000).toISOString()
        },
        {
          status_code: 'in_transit',
          status: 'In Transit',
          status_description: 'Package in transit to destination hub',
          remarks: 'Dispatched on route',
          location: 'Regional Sorting Hub',
          event_date: new Date().toISOString()
        }
      ]
    }
  }

  return response
}

/**
 * 8. Track Order by Ad2Ship Order ID
 * POST /order-track-by-id
 */
export const trackOrderById = async ({ orderId }) => {
  const payload = { OrderID: String(orderId) }
  const response = await postToAd2Ship('order-track-by-id', payload)

  if (response === null) {
    return trackOrder({ awbNumber: `AWB_MOCK_${orderId}` })
  }

  return response
}

/**
 * 9. Cancel Order
 * POST /order-cancel
 */
export const cancelOrder = async ({ orderId }) => {
  const payload = { OrderID: Number(orderId) }
  const response = await postToAd2Ship('order-cancel', payload)

  if (response === null) {
    return {
      status: true,
      message: 'Order Cancelled Successfully (Mock Mode).'
    }
  }

  return response
}

export default {
  calculateRate,
  createOrder,
  shipOrder,
  generateManifest,
  generateLabel,
  generateInvoice,
  trackOrder,
  trackOrderById,
  cancelOrder,
  isApiKeyConfigured
}
