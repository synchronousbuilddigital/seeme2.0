const CACHE_NAME = 'seemee-client-pwa-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/images/logoSEEMEE1.png'
]

// ─── SERVICE WORKER INSTALLATION ─────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Client PWA Service Worker caching shell assets')
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
            console.log('🧹 Removing old client PWA cache:', key)
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

  // 1. NEVER cache API requests, auth, checkout, or cart mutations
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return
  }

  // 2. Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse))
          }
        }).catch(() => {})
        return cachedResponse
      }

      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/offline.html')
        }
      })
    })
  )
})
