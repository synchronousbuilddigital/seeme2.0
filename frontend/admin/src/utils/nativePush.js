import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from './apiClient'

/**
 * Convert VAPID URL-safe Base64 string to Uint8Array buffer required by PushManager
 */
export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Register PWA Service Worker (/sw.js)
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker is not supported in this browser environment.')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('✅ PWA Service Worker registered with scope:', registration.scope)
    return registration
  } catch (err) {
    console.error('❌ Service Worker registration failed:', err.message)
    return null
  }
}

/**
 * Safely get active ServiceWorkerRegistration with a 3s timeout fallback
 * to prevent navigator.serviceWorker.ready from hanging indefinitely.
 */
export const getActiveServiceWorkerRegistration = async (timeoutMs = 3500) => {
  if (!('serviceWorker' in navigator)) return null

  // 1. Try to register / get registration
  let reg = await registerServiceWorker()
  if (!reg) {
    try {
      reg = await navigator.serviceWorker.getRegistration()
    } catch (e) {
      console.warn('getRegistration warning:', e.message)
    }
  }

  if (!reg) return null

  // 2. Race navigator.serviceWorker.ready with a timeout fallback
  try {
    const readyPromise = navigator.serviceWorker.ready
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(reg), timeoutMs))
    return await Promise.race([readyPromise, timeoutPromise])
  } catch (e) {
    return reg
  }
}

/**
 * Get VAPID Public Key from env or backend
 */
export const getVapidPublicKey = async () => {
  const envKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim()
  if (envKey && envKey !== 'your_vapid_public_key') {
    return envKey
  }

  try {
    const res = await apiRequest(API_ENDPOINTS.PUSH.VAPID_KEY)
    if (res.success && res.publicKey) {
      return res.publicKey
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch VAPID key from backend:', err.message)
  }

  return null
}

/**
 * Subscribe admin browser to Native Web Push Notifications
 */
export const subscribeToPush = async () => {
  if (!('Notification' in window)) {
    throw new Error('Notifications API is not supported by your browser.')
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web Push is not supported by your browser or environment.')
  }

  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    throw new Error('Web Push requires a Secure Context (HTTPS or localhost).')
  }

  // 1. Request notification permission explicitly
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied by user or browser.')
  }

  // 2. Ensure Service Worker is active without hanging indefinitely
  const registration = await getActiveServiceWorkerRegistration()
  if (!registration || !registration.pushManager) {
    throw new Error('Service Worker push manager is unavailable.')
  }

  // 3. Get VAPID Public Key
  const publicKey = await getVapidPublicKey()
  if (!publicKey) {
    throw new Error('VAPID Public Key is missing or not configured on server.')
  }

  const convertedKey = urlBase64ToUint8Array(publicKey)

  // 4. Create or reuse existing PushSubscription with a 10s timeout
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    const subscribePromise = registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Push subscription timed out. Check browser notification permissions.')), 10000)
    )

    subscription = await Promise.race([subscribePromise, timeoutPromise])
  }

  const subscriptionJSON = subscription.toJSON()

  // 5. Save subscription to backend database
  const backendRes = await apiRequest(
    API_ENDPOINTS.PUSH.SUBSCRIBE,
    {
      method: 'POST',
      auth: true,
      body: { subscription: subscriptionJSON }
    }
  )

  console.log('✅ Native Web Push subscription registered on backend:', backendRes)
  return { success: true, subscription }
}

/**
 * Unsubscribe admin browser from Web Push Notifications
 */
export const unsubscribeFromPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: true }
  }

  try {
    const registration = await getActiveServiceWorkerRegistration()
    if (!registration || !registration.pushManager) return { success: true }

    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()

      // Inform backend
      await apiRequest(
        API_ENDPOINTS.PUSH.UNSUBSCRIBE,
        {
          method: 'DELETE',
          auth: true,
          body: { endpoint }
        }
      ).catch(e => console.warn('Unsubscribe backend notice:', e.message))
    }

    console.log('👋 Native Push Subscription unsubscribed.')
    return { success: true }
  } catch (err) {
    console.error('❌ Push unsubscription failed:', err.message)
    throw err
  }
}

/**
 * Check push subscription status
 */
export const checkPushStatus = async () => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { isSupported: false, isGranted: false, isSubscribed: false }
  }

  const isGranted = Notification.permission === 'granted'

  try {
    const registration = await getActiveServiceWorkerRegistration(2000)
    if (!registration || !registration.pushManager) {
      return { isSupported: true, isGranted, permissionState: Notification.permission, isSubscribed: false }
    }

    const subscription = await registration.pushManager.getSubscription()
    const isSubscribed = Boolean(subscription && isGranted)

    return {
      isSupported: true,
      isGranted,
      permissionState: Notification.permission,
      isSubscribed,
      endpoint: subscription ? subscription.endpoint : null
    }
  } catch (e) {
    return {
      isSupported: true,
      isGranted,
      permissionState: Notification.permission,
      isSubscribed: false
    }
  }
}

/**
 * Send test push notification to current logged-in admin device
 */
export const triggerTestPush = async () => {
  return await apiRequest(
    API_ENDPOINTS.PUSH.SEND_TEST,
    {
      method: 'POST',
      auth: true
    }
  )
}
