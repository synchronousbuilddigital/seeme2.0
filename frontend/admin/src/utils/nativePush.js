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
    throw new Error('Service Workers are not supported by this browser.')
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('✅ PWA Service Worker registered with scope:', registration.scope)
    return registration
  } catch (err) {
    console.error('❌ Service Worker registration failed:', err)
    if (err.message && (err.message.includes('MIME type') || err.message.includes('text/html'))) {
      throw new Error(`Service Worker file (/sw.js) returned HTML instead of JavaScript. Please verify sw.js in public/ folder and Vercel route settings.`)
    }
    throw new Error(`Service Worker registration failed (/sw.js): ${err.message}`)
  }
}

/**
 * Safely get active ServiceWorkerRegistration
 */
export const getActiveServiceWorkerRegistration = async (timeoutMs = 3500) => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported by this browser.')
  }

  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    throw new Error('Web Push Notifications require a Secure Context (HTTPS or http://localhost).')
  }

  // 1. Try fetching existing registration first
  let reg = await navigator.serviceWorker.getRegistration('/')
  
  // 2. If not registered, attempt new registration
  if (!reg) {
    reg = await registerServiceWorker()
  }

  if (!reg) {
    throw new Error('Could not obtain Service Worker registration for /sw.js.')
  }

  // 3. Race navigator.serviceWorker.ready with a fallback timer
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
    throw new Error('Web Push Notifications require a Secure Context (HTTPS or http://localhost).')
  }

  // 1. Request notification permission explicitly
  const permission = await Notification.requestPermission()
  if (permission === 'denied') {
    throw new Error('Notification permission was blocked in browser settings. Please click the lock icon in your address bar and allow Notifications.')
  }
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  // 2. Ensure Service Worker is active
  const registration = await getActiveServiceWorkerRegistration()
  if (!registration || !registration.pushManager) {
    throw new Error('Browser PushManager is disabled or blocked in this environment (requires HTTPS or Chrome permissions).')
  }

  // 3. Get VAPID Public Key
  const publicKey = await getVapidPublicKey()
  if (!publicKey) {
    throw new Error('VAPID Public Key is missing or not configured on server.')
  }

  const convertedKey = urlBase64ToUint8Array(publicKey)

  // 4. Create or reuse existing PushSubscription
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    try {
      const subscribePromise = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Push subscription timed out. Check browser notification permissions.')), 10000)
      )

      subscription = await Promise.race([subscribePromise, timeoutPromise])
    } catch (subErr) {
      console.error('pushManager.subscribe error:', subErr)
      throw new Error(`Push subscription failed: ${subErr.message}`)
    }
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
