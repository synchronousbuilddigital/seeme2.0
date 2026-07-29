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
      { 
        $match: { 
          $and: [
            {
              $or: [
                { paymentStatus: 'paid' },
                { status: { $in: ['confirmed', 'processing', 'printing', 'packaging', 'shipped', 'delivered'] } }
              ]
            },
            { status: { $nin: ['cancelled', 'refunded'] } }
          ]
        } 
      },
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
  const { timeframe = '6months' } = req.query
  const monthsCount = (timeframe === '12months' || timeframe === '1year' || timeframe === 'Last Year') ? 12 : 6

  const baseRevenueMatch = [
    {
      $or: [
        { paymentStatus: 'paid' },
        { status: { $in: ['confirmed', 'processing', 'printing', 'packaging', 'shipped', 'delivered'] } }
      ]
    },
    { status: { $nin: ['cancelled', 'refunded'] } }
  ]

  // 1. Total Revenue (all time)
  const revenueData = await Order.aggregate([
    { $match: { $and: baseRevenueMatch } },
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
    .select('customer totalAmount status createdAt orderNumber')
    .lean()

  // 5. Monthly Revenue (dynamic timeframe with continuous months)
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - (monthsCount - 1))
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)
  
  const rawMonthlyRevenue = await Order.aggregate([
    { 
      $match: { 
        $and: [
          ...baseRevenueMatch,
          { createdAt: { $gte: startDate } }
        ]
      } 
    },
    {
      $group: {
        _id: { 
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  // Build continuous array for requested timeframe
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyRevenue = []
  const now = new Date()

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mNum = d.getMonth() + 1
    const yNum = d.getFullYear()

    const found = rawMonthlyRevenue.find(item => item._id.month === mNum && item._id.year === yNum)

    monthlyRevenue.push({
      _id: { month: mNum, year: yNum },
      year: yNum,
      month: mNum,
      monthLabel: monthNames[mNum - 1],
      shortLabel: `${monthNames[mNum - 1]} '${yNum.toString().slice(-2)}`,
      revenue: found ? found.revenue : 0,
      count: found ? found.count : 0
    })
  }

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
      totalUsers,
      timeframe
    }
  })
})
// @desc    Get inventory stats
// @route   GET /api/admin/inventory
// @access  Admin
export const getInventoryStats = asyncHandler(async (req, res) => {
  const lowStockThreshold = 10
  
  const [allProducts, totalProducts] = await Promise.all([
    Product.find().select('name stock category images sku price sizeStock updatedAt').sort({ stock: 1 }).lean(),
    Product.countDocuments()
  ])

  const outOfStockProducts = allProducts.filter(p => p.stock <= 0)
  const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= lowStockThreshold)
  const healthyProducts = allProducts.filter(p => p.stock > lowStockThreshold)

  res.json({
    success: true,
    data: {
      allProducts,
      outOfStockProducts,
      lowStockProducts,
      healthyProducts,
      totalProducts,
      totalLowStock: lowStockProducts.length,
      totalOutOfStock: outOfStockProducts.length,
      totalHealthy: healthyProducts.length
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
    .lean()

  const customerStats = await Order.aggregate([
    {
      $match: {
        status: { $nin: ['cancelled', 'refunded'] }
      }
    },
    {
      $group: {
        _id: { $toLower: '$customer.email' },
        orderCount: { $sum: 1 },
        totalSpending: { $sum: '$totalAmount' }
      }
    }
  ])

  const customersWithStats = customers.map(c => {
    const emailKey = (c.email || '').toLowerCase().trim()
    const stats = customerStats.find(s => s._id === emailKey)
    return {
      ...c,
      orderCount: stats ? stats.orderCount : 0,
      totalSpending: stats ? stats.totalSpending : 0
    }
  })

  res.json({
    success: true,
    data: customersWithStats
  })
})
