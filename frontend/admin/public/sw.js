const CACHE_NAME = 'seemee-admin-pwa-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/images/logoSEEMEE1.png',
  '/images/icon-192.png',
  '/images/icon-512.png'
]

// ─── SERVICE WORKER INSTALLATION ─────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 PWA Service Worker caching static shell assets')
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn('PWA caching warning:', err.message))
    })
  )
})

// ─── SERVICE WORKER ACTIVATION ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Removing old PWA cache:', key)
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// ─── FETCH INTERCEPTION & OFFLINE STRATEGY ────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 1. NEVER cache API requests, auth, checkout, or admin mutations
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return
  }

  // 2. Cache-first / Stale-while-revalidate for static UI assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in background for next reload
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse))
          }
        }).catch(() => {/* Ignore background fetch failure */})
        return cachedResponse
      }

      return fetch(event.request).catch(() => {
        // Return offline.html fallback for navigation HTML requests
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/offline.html')
        }
      })
    })
  )
})

// ─── NATIVE WEB PUSH NOTIFICATION RECEIVER ───────────────
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker Push Received:', event)

  let payload = {
    title: '🛍️ New Order Received',
    body: 'A new order has been placed on See Mee!',
    icon: '/images/logoSEEMEE1.png',
    badge: '/images/logoSEEMEE1.png',
    tag: 'new-order-alert',
    requireInteraction: true,
    data: {
      url: '/dashboard'
    }
  }

  if (event.data) {
    try {
      const dataJson = event.data.json()
      payload = {
        ...payload,
        ...dataJson,
        data: {
          ...payload.data,
          ...(dataJson.data || {})
        }
      }
    } catch (e) {
      payload.body = event.data.text()
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/images/logoSEEMEE1.png',
    badge: payload.badge || '/images/logoSEEMEE1.png',
    tag: payload.tag || `notif-${Date.now()}`,
    data: payload.data || {},
    requireInteraction: payload.requireInteraction !== false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Order' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  )
})

// ─── NOTIFICATION CLICK HANDLING ──────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker Notification Clicked:', event)

  event.notification.close()

  const notificationData = event.notification.data || {}
  const targetUrl = notificationData.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Look for an existing open tab matching admin dashboard
      for (const client of clientList) {
        if ((client.url.includes('3001') || client.url.includes('/dashboard')) && 'focus' in client) {
          client.focus()
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl)
          }
          return
        }
      }

      // If no tab open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
