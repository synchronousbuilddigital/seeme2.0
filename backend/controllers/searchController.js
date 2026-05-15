import asyncHandler from '../utils/asyncHandler.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import User from '../models/User.js'

export const globalSearch = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim()
  const limit = Math.min(parseInt(req.query.limit || '5', 10) || 5, 20)

  if (!query) {
    return res.json({ success: true, data: { products: [], orders: [], users: [] } })
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

  const [products, orders, users] = await Promise.all([
    Product.find({
      isActive: true,
      $or: [
        { name: regex },
        { description: regex },
        { category: regex }
      ]
    }).sort({ createdAt: -1 }).limit(limit),
    Order.find({
      $or: [
        { orderNumber: regex },
        { 'customer.name': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex }
      ]
    }).sort({ createdAt: -1 }).limit(limit),
    User.find({
      $or: [
        { name: regex },
        { email: regex },
        { role: regex }
      ]
    }).select('-password').sort({ createdAt: -1 }).limit(limit)
  ])

  res.json({
    success: true,
    data: {
      products,
      orders,
      users
    }
  })
})
