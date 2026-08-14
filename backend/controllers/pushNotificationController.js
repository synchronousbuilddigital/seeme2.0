import pushNotificationService from '../services/pushNotificationService.js'
import PushSubscription from '../models/PushSubscription.js'
import Notification from '../models/Notification.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Get VAPID Public Key for client subscription
// @route   GET /api/notifications/vapid-key
// @access  Public
export const getVapidPublicKey = asyncHandler(async (req, res) => {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || '').trim()
  if (!publicKey || publicKey.includes('your_vapid_public_key')) {
    return res.status(503).json({
      success: false,
      message: 'VAPID public key is not configured on backend server.'
    })
  }

  res.json({
    success: true,
    publicKey
  })
})

// @desc    Save/Update admin push subscription
// @route   POST /api/notifications/subscribe
// @access  Admin
export const subscribePush = asyncHandler(async (req, res) => {
  const { subscription } = req.body
  const userAgent = req.headers['user-agent'] || ''

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400)
    throw new Error('Valid PushSubscription object with endpoint and keys is required')
  }

  const savedSubscription = await pushNotificationService.subscribeUser(
    req.user._id,
    subscription,
    userAgent
  )

  res.status(201).json({
    success: true,
    message: 'Push notification subscription registered successfully',
    data: savedSubscription
  })
})

// @desc    Remove admin push subscription
// @route   DELETE /api/notifications/unsubscribe
// @access  Admin
export const unsubscribePush = asyncHandler(async (req, res) => {
  const { endpoint } = req.body

  if (!endpoint) {
    res.status(400)
    throw new Error('Endpoint string is required')
  }

  await pushNotificationService.unsubscribeUser(req.user._id, endpoint)

  res.json({
    success: true,
    message: 'Push notification subscription removed successfully'
  })
})

// @desc    Get subscription status for logged in admin
// @route   GET /api/notifications/status
// @access  Admin
export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const subscriptions = await PushSubscription.find({ user: req.user._id })

  res.json({
    success: true,
    isSubscribed: subscriptions.length > 0,
    deviceCount: subscriptions.length,
    subscriptions
  })
})

// @desc    Send test push notification to logged in admin
// @route   POST /api/notifications/send-test
// @access  Admin
export const sendTestPush = asyncHandler(async (req, res) => {
  const result = await pushNotificationService.sendTestNotification(req.user._id)

  res.json({
    success: true,
    message: 'Test push notification sent successfully!',
    result
  })
})

// ==========================================
// IN-APP NOTIFICATION MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Get all in-app notifications for logged in admin
// @route   GET /api/notifications
// @access  Admin
export const getInAppNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  const skip = (page - 1) * limit

  const query = { recipient: req.user._id }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('order', 'orderNumber status totalAmount customer createdAt'),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, isRead: false })
  ])

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  })
})

// @desc    Get unread in-app notification count
// @route   GET /api/notifications/unread-count
// @access  Admin
export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  })

  res.json({
    success: true,
    unreadCount
  })
})

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Admin
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id
  })

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  if (!notification.isRead) {
    notification.isRead = true
    notification.readAt = new Date()
    await notification.save()
  }

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  })

  res.json({
    success: true,
    data: notification,
    unreadCount
  })
})

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Admin
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )

  res.json({
    success: true,
    message: 'All notifications marked as read',
    unreadCount: 0
  })
})

// @desc    Delete a single notification by ID
// @route   DELETE /api/notifications/:id
// @access  Admin
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id
  })

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  })

  res.json({
    success: true,
    message: 'Notification deleted successfully',
    unreadCount
  })
})

// @desc    Clear all notifications for logged in admin
// @route   DELETE /api/notifications/clear-all
// @access  Admin
export const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id })

  res.json({
    success: true,
    message: 'All notifications cleared successfully',
    unreadCount: 0
  })
})
