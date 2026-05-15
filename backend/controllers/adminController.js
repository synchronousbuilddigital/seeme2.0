import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Get quick dashboard summary
// @route   GET /api/admin/dashboard-summary
// @access  Admin
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [totalOrders, totalProducts, totalUsers, revenueData] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ])
  ])

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0

  res.json({
    success: true,
    data: {
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue
    }
  })
})

// @desc    Get admin analytics
// @route   GET /api/admin/analytics
// @access  Admin
export const getAnalytics = asyncHandler(async (req, res) => {
  // 1. Total Revenue (all time)
  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
  ])
  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0

  // 2. Orders count by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ])

  // 3. Top selling products
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { 
        _id: '$items.product', 
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      } 
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ])

  // 4. Recent 10 orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('customer totalAmount status createdAt')

  // 5. Monthly Revenue (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const monthlyRevenue = await Order.aggregate([
    { 
      $match: { 
        paymentStatus: 'paid',
        createdAt: { $gte: sixMonthsAgo }
      } 
    },
    {
      $group: {
        _id: { 
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  // 6. User Stats
  const totalUsers = await User.countDocuments({ role: 'customer' })

  res.json({
    success: true,
    data: {
      totalRevenue,
      ordersByStatus,
      topProducts,
      recentOrders,
      monthlyRevenue,
      totalUsers
    }
  })
})
// @desc    Get inventory stats
// @route   GET /api/admin/inventory
// @access  Admin
export const getInventoryStats = asyncHandler(async (req, res) => {
  const lowStockThreshold = 10
  const lowStockProducts = await Product.find({ stock: { $lte: lowStockThreshold } })
    .select('name stock category images sku')
  
  const outOfStockProducts = await Product.find({ stock: 0 })
    .select('name stock category images sku')

  res.json({
    success: true,
    data: {
      lowStockProducts,
      outOfStockProducts,
      totalLowStock: lowStockProducts.length,
      totalOutOfStock: outOfStockProducts.length
    }
  })
})

// @desc    Update order status and add timeline entry
// @route   PUT /api/admin/orders/:id/status
// @access  Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, estimatedDelivery } = req.body
  const order = await Order.findById(req.params.id)

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  order.status = status || order.status
  if (trackingNumber) order.trackingNumber = trackingNumber
  if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery

  order.timeline.push({
    status: order.status,
    note: note || `Order status updated to ${order.status}`,
    timestamp: new Date()
  })

  await order.save()

  res.json({
    success: true,
    data: order
  })
})

// @desc    Bulk update products
// @route   PUT /api/admin/products/bulk
// @access  Admin
export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { ids, update } = req.body
  await Product.updateMany({ _id: { $in: ids } }, { $set: update })
  res.json({ success: true, message: 'Products updated' })
})

// @desc    Get customer list with stats
// @route   GET /api/admin/customers
// @access  Admin
export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('-password')
    .sort({ createdAt: -1 })

  res.json({
    success: true,
    data: customers
  })
})
