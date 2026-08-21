import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initPWAInstallPrompt } from './utils/pwaInstallManager'

// Initialize PWA Install Prompt listener before React renders
initPWAInstallPrompt()

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


