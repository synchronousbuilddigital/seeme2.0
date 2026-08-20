import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// ─── AUTOMATED ZERO-HARD-REFRESH CACHE & VERSION MANAGER ───────────
let currentVersion = null

const checkForVersionUpdate = async () => {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (currentVersion && data.version && data.version !== currentVersion) {
        console.log(`🔄 [AUTO-RELOAD] New commit detected (${data.version}). Refreshing cache...`)
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map(key => caches.delete(key)))
        }
        window.location.reload(true)
      } else {
        currentVersion = data.version
      }
    }
  } catch (err) {
    // Ignore version check errors silently
  }
}

// Initial version fetch
checkForVersionUpdate()

// Check version when user returns to tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkForVersionUpdate()
  }
})

// Register Client PWA Service Worker with Auto-Update
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      console.log('🔄 [SW UPDATED] Service Worker controller changed. Reloading page for new build...')
      window.location.reload(true)
    }
  })

  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('✅ Client PWA Service Worker registered:', reg.scope)
      // Check for SW update on page load & focus
      reg.update().catch(() => {})
      window.addEventListener('focus', () => reg.update().catch(() => {}))
    }).catch(err => {
      console.warn('⚠️ Service Worker notice:', err.message)
    })
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW()
  } else {
    window.addEventListener('load', registerSW)
  }
}
