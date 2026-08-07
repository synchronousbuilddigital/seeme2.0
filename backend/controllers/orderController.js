import dotenv from 'dotenv'
dotenv.config()

import Order from '../models/Order.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { sendOrderEmail } from '../services/emailService.js'

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
  const { customer, items, paymentMethod } = req.body

  if (!customer || !items || items.length === 0) {
    res.status(400)
    throw new Error('Customer info and at least one item are required')
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

  const order = await Order.create({
    customer,
    items: orderItems,
    totalAmount,
    paymentMethod
  })

  // Send Order Placed Email via Nodemailer Gmail Service
  sendOrderEmail(order, 'Placed').catch(err => console.error('Order email error:', err.message))

  res.status(201).json({ success: true, data: order })
})

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Admin
export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('items.product').sort({ createdAt: -1 })
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
  if (['shipped', 'delivered'].includes(currentStatus)) {
    res.status(400)
    throw new Error(`Cannot cancel order. Status is already ${order.status}.`)
  }

  if (currentStatus === 'cancelled') {
    res.status(400)
    throw new Error('Order is already cancelled.')
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

  order.status = 'cancelled'
  await order.save()

  // Send Order Cancelled Email
  try {
    await sendOrderEmail(order, 'Cancelled')
  } catch (err) {
    console.error('Order cancellation email error:', err.message)
  }

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
    totalAmount
  } = req.body

  // For COD (no razorpay_order_id), we should have handled this elsewhere but 
  // keeping it robust for potential direct calls
  if (!razorpay_order_id) {
    // This part should technically be handled by createOrder, but if called here:
    const order = await Order.create({
      customer,
      items,
      totalAmount,
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
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id || 'mock_pay_id'
      }
    })

    // Send confirmation email
    sendOrderEmail(order, 'Placed').catch(err => console.error('Order email error:', err.message))

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
    paymentMethod: 'online',
    paymentStatus: 'paid',
    paymentDetails: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    }
  })

  // Send confirmation email
  sendOrderEmail(order, 'Placed').catch(err => console.error('Order email error:', err.message))

  res.json({ success: true, data: order })
})
