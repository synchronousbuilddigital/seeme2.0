let deferredPrompt = null
let listeners = []
let isInitialized = false

export function initPWAInstallPrompt() {
  if (isInitialized) return
  isInitialized = true

  console.log('PWA: install manager initialized')
  if ('serviceWorker' in navigator) {
    console.log('PWA controller:', navigator.serviceWorker.controller)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('PWA controller updated:', navigator.serviceWorker.controller)
    })
  }

  // Check if early inline script in index.html captured beforeinstallprompt
  if (window.deferredInstallPrompt) {
    deferredPrompt = window.deferredInstallPrompt
    console.log('PWA: beforeinstallprompt received')
    console.log('PWA EVENT STORED:', deferredPrompt !== null)
  }

  const handleBeforeInstallPrompt = (event) => {
    event.preventDefault()
    deferredPrompt = event
    window.deferredInstallPrompt = event
    console.log('PWA: beforeinstallprompt received')
    console.log('PWA EVENT STORED:', deferredPrompt !== null)

    listeners.forEach(callback => {
      try {
        callback(true)
      } catch (err) {}
    })
  }

  const handleAppInstalled = () => {
    console.log('PWA: appinstalled fired')
    deferredPrompt = null
    window.deferredInstallPrompt = null

    listeners.forEach(callback => {
      try {
        callback(false)
      } catch (err) {}
    })
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  window.addEventListener('pwa-prompt-ready', () => {
    if (window.deferredInstallPrompt) {
      deferredPrompt = window.deferredInstallPrompt
      console.log('PWA: beforeinstallprompt received')
      listeners.forEach(callback => {
        try {
          callback(true)
        } catch (err) {}
      })
    }
  })
}

export function getDeferredInstallPrompt() {
  return deferredPrompt || window.deferredInstallPrompt || null
}

export function canInstallPWA() {
  return (deferredPrompt !== null || (window.deferredInstallPrompt !== undefined && window.deferredInstallPrompt !== null))
}

export function subscribeToPWAInstall(callback) {
  listeners.push(callback)
  const isAvailable = canInstallPWA()
  console.log('PWA: InstallAppWidget subscribed')
  callback(isAvailable)

  return () => {
    listeners = listeners.filter(listener => listener !== callback)
  }
}

export function clearDeferredInstallPrompt() {
  deferredPrompt = null
  window.deferredInstallPrompt = null

  listeners.forEach(callback => {
    try {
      callback(false)
    } catch (err) {}
  })
}
