import dotenv from 'dotenv'
dotenv.config()

import webpush from 'web-push'
import PushSubscription from '../models/PushSubscription.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

class PushNotificationService {
  constructor() {
    this.configured = false
  }

  ensureVapidConfigured() {
    if (this.configured) return true

    const publicKey = (process.env.VAPID_PUBLIC_KEY || '').trim()
    const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim()
    const subject = (process.env.VAPID_SUBJECT || 'mailto:bizseemee@gmail.com').trim()

    if (!publicKey || !privateKey || publicKey.includes('your_vapid_public_key')) {
      console.warn('⚠️ VAPID keys (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) missing or unconfigured. Push delivery disabled.')
      return false
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey)
      this.configured = true
      console.log('✅ Web Push VAPID details configured successfully.')
      return true
    } catch (err) {
      console.error('❌ Failed to set VAPID details:', err.message)
      return false
    }
  }

  /**
   * Save or update a push subscription for a user.
   */
  async subscribeUser(userId, subscriptionData, userAgent = '') {
    if (!subscriptionData || !subscriptionData.endpoint || !subscriptionData.keys) {
      throw new Error('Invalid push subscription payload')
    }

    const { endpoint, keys } = subscriptionData

    let subscription = await PushSubscription.findOne({ endpoint })

    if (subscription) {
      subscription.user = userId
      subscription.keys = keys
      subscription.userAgent = userAgent
      await subscription.save()
    } else {
      subscription = await PushSubscription.create({
        user: userId,
        endpoint,
        keys,
        userAgent
      })
    }

    console.log(`✅ Push subscription saved for Admin user: ${userId} (${userAgent.substring(0, 30)}...)`)
    return subscription
  }

  /**
   * Remove a push subscription by endpoint.
   */
  async unsubscribeUser(userId, endpoint) {
    if (!endpoint) {
      throw new Error('Endpoint required for unsubscription')
    }

    const result = await PushSubscription.deleteOne({
      user: userId,
      endpoint
    })

    console.log(`👋 Push subscription removed for user ${userId}. Count deleted: ${result.deletedCount}`)
    return result
  }

  /**
   * Send a Web Push notification to a specific push subscription.
   */
  async sendSinglePush(subscriptionDoc, payload) {
    if (!this.ensureVapidConfigured()) return { success: false, reason: 'VAPID not configured' }

    const pushSubscriptionObj = {
      endpoint: subscriptionDoc.endpoint,
      keys: {
        p256dh: subscriptionDoc.keys.p256dh,
        auth: subscriptionDoc.keys.auth
      }
    }

    try {
      const payloadString = JSON.stringify(payload)
      const res = await webpush.sendNotification(pushSubscriptionObj, payloadString)
      return { success: true, res }
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.warn(`🧹 Stale push subscription detected (${error.statusCode}). Cleaning up endpoint...`)
        await PushSubscription.deleteOne({ _id: subscriptionDoc._id }).catch(e => console.error(e.message))
      } else {
        console.error('❌ Web Push delivery error:', error.message)
      }
      return { success: false, error: error.message, statusCode: error.statusCode }
    }
  }

  /**
   * Order notification dispatcher for Admin (Placed / Cancelled):
   * 1. Finds all active admin users.
   * 2. Creates DB Notification records (in-app history).
   * 3. Dispatches Web Push notifications to all active admin devices.
   */
  async sendOrderNotification(order, type = 'NEW_ORDER') {
    try {
      if (!order || !order._id) return

      const admins = await User.find({ role: 'admin', isBlocked: { $ne: true } })
      if (!admins || admins.length === 0) {
        console.warn('⚠️ No active admin users found for order push notification.')
        return
      }

      const adminUserIds = admins.map(a => a._id)
      const formattedAmount = order.totalAmount?.toLocaleString('en-IN') || order.totalAmount

      let title = '🛍️ New Order Received'
      let body = `Order #${order.orderNumber} has been placed for ₹${formattedAmount}.`
      let notifType = 'NEW_ORDER'

      if (type === 'ORDER_CANCELLED' || type === 'CANCELLED' || String(type).toLowerCase() === 'cancelled') {
        title = '❌ Order Cancelled'
        body = `Order #${order.orderNumber} placed by ${order.customer?.name || 'Customer'} has been cancelled.`
        notifType = 'ORDER_CANCELLED'
      }

      // 1. Save in-app notification records for admins
      for (const adminUser of admins) {
        try {
          await Notification.create({
            recipient: adminUser._id,
            type: notifType,
            title,
            message: body,
            order: order._id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount
          })
        } catch (dbErr) {
          if (dbErr.code !== 11000) {
            console.error('In-app notification save notice:', dbErr.message)
          }
        }
      }

      // 2. Fetch push subscriptions for admin users
      const subscriptions = await PushSubscription.find({ user: { $in: adminUserIds } })
      if (subscriptions.length === 0) {
        console.log(`ℹ️ No native push subscriptions found for admin users (${notifType}).`)
        return
      }

      const adminBaseUrl = (process.env.ADMIN_URL || 'http://localhost:3001').replace(/\/$/, '')
      const targetUrl = `${adminBaseUrl}/dashboard?orderId=${order._id.toString()}`

      const pushPayload = {
        title,
        body,
        icon: '/images/logoSEEMEE1.png',
        badge: '/images/logoSEEMEE1.png',
        tag: `order-${notifType.toLowerCase()}-${order._id.toString()}`,
        requireInteraction: true,
        data: {
          notificationType: notifType,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          url: targetUrl
        }
      }

      // 3. Dispatch web push to all admin devices concurrently
      const pushPromises = subscriptions.map(sub => this.sendSinglePush(sub, pushPayload))
      const results = await Promise.allSettled(pushPromises)

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      console.log(`✅ Native Web Push (${notifType}) sent to ${successCount}/${subscriptions.length} admin device(s) for Order #${order.orderNumber}.`)

    } catch (error) {
      console.error(`❌ Error in sendOrderNotification (${type}) push service:`, error.message)
      // Never throw - order placement or cancellation must remain successful
    }
  }

  async sendNewOrderNotification(order) {
    return this.sendOrderNotification(order, 'NEW_ORDER')
  }

  async sendOrderCancelledNotification(order) {
    return this.sendOrderNotification(order, 'ORDER_CANCELLED')
  }

  /**
   * Send a test push notification to a specific admin user's devices.
   */
  async sendTestNotification(userId) {
    const subscriptions = await PushSubscription.find({ user: userId })
    if (subscriptions.length === 0) {
      throw new Error('No push subscriptions found for your account. Please click "Enable Notifications" first.')
    }

    const adminBaseUrl = (process.env.ADMIN_URL || 'http://localhost:3001').replace(/\/$/, '')

    const testPayload = {
      title: '🔔 Test Push Notification',
      body: 'Web Push Notifications are working perfectly on your device!',
      icon: '/images/logoSEEMEE1.png',
      badge: '/images/logoSEEMEE1.png',
      tag: `test-notif-${Date.now()}`,
      data: {
        notificationType: 'TEST',
        url: `${adminBaseUrl}/dashboard`
      }
    }

    const results = await Promise.all(subscriptions.map(sub => this.sendSinglePush(sub, testPayload)))
    const successCount = results.filter(r => r.success).length

    if (successCount === 0) {
      throw new Error('Failed to deliver push notification to your device. Check browser permissions or re-subscribe.')
    }

    return { success: true, deliveredDevices: successCount }
  }
}

export default new PushNotificationService()
