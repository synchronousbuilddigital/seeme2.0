import express from 'express'
import {
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  getSubscriptionStatus,
  sendTestPush,
  getInAppNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from '../controllers/pushNotificationController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Public endpoint to fetch VAPID public key
router.get('/vapid-key', getVapidPublicKey)

// All subsequent push & in-app notification endpoints require Admin authentication
router.use(protect, admin)

// Push Subscription routes
router.post('/subscribe', subscribePush)
router.delete('/unsubscribe', unsubscribePush)
router.get('/status', getSubscriptionStatus)
router.post('/send-test', sendTestPush)

// In-App Notification Management routes
router.get('/', getInAppNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/read-all', markAllNotificationsAsRead)
router.patch('/:id/read', markNotificationAsRead)
router.delete('/clear-all', clearAllNotifications)
router.delete('/:id', deleteNotification)

export default router
