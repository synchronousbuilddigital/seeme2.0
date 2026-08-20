const CACHE_NAME = 'seemee-client-pwa-v1.0.1787249534838'
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
      console.log('📦 Client PWA Service Worker caching shell assets')
      return Promise.allSettled(
        STATIC_ASSETS.map(asset => 
          fetch(asset)
            .then(res => {
              if (res.ok) return cache.put(asset, res)
            })
            .catch(err => console.warn('PWA asset cache notice:', asset, err.message))
        )
      )
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

// ─── FETCH INTERCEPTION & OFFLINE / PRODUCTION STRATEGY ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 1. NEVER cache API requests, auth, checkout, or cart mutations
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return
  }

  // 2. Handle HTML navigation requests (Network-first with index.html fallback for SPA)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return networkResponse
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cached) => cached || caches.match('/index.html') || caches.match('/offline.html'))
        })
    )
    return
  }

  // 3. Stale-while-revalidate for static assets & images
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()))
          }
          return networkResponse
        })
        .catch(() => {})

      return cachedResponse || fetchPromise
    })
  )
})
