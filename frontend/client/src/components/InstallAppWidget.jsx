import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './InstallAppWidget.css'
import {
  getDeferredInstallPrompt,
  canInstallPWA,
  subscribeToPWAInstall,
  clearDeferredInstallPrompt
} from '../utils/pwaInstallManager'

const InstallAppWidget = () => {
  const [canInstall, setCanInstall] = useState(canInstallPWA())
  const [isStandalone, setIsStandalone] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [installToast, setInstallToast] = useState(false)

  const detectDeviceOS = () => {
    const ua = navigator.userAgent || ''
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'iOS'
    if (/Android/.test(ua)) return 'Android'
    return 'Desktop'
  }

  useEffect(() => {
    console.log('PWA: InstallAppWidget mounted')

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true)
    }

    const unsubscribe = subscribeToPWAInstall((installable) => {
      setCanInstall(installable)
    })

    const handleAppInstalled = () => {
      console.log('PWA: appinstalled fired')
      setIsStandalone(true)
      setIsOpen(false)
      setShowIosGuide(false)
      setInstallToast(true)
      setTimeout(() => {
        setInstallToast(false)
      }, 5000)
    }

    const handleTriggerInstallEvent = () => {
      const os = detectDeviceOS()
      if (os === 'iOS') {
        setShowIosGuide(true)
        setIsOpen(false)
        return
      }
      executeDirectInstall()
    }

    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('trigger-app-install', handleTriggerInstallEvent)

    return () => {
      unsubscribe()
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('trigger-app-install', handleTriggerInstallEvent)
    }
  }, [])

  // DIRECT NATIVE INSTALLATION TRIGGER FUNCTION
  const executeDirectInstall = async (preferredOS) => {
    console.log('PWA: Install Now clicked')
    const os = preferredOS || detectDeviceOS()

    if (os === 'iOS') {
      setShowIosGuide(true)
      setIsOpen(false)
      return
    }

    const promptEvent = getDeferredInstallPrompt()

    if (!promptEvent) {
      console.warn('Native PWA installation is currently unavailable')
      return
    }

    try {
      setIsOpen(false)
      console.log('PWA: opening native installation dialog')

      promptEvent.prompt()

      const choiceResult = await promptEvent.userChoice

      console.log('PWA installation result:', choiceResult?.outcome)

      clearDeferredInstallPrompt()

      if (choiceResult?.outcome === 'accepted') {
        console.log('PWA: installation accepted')
      } else {
        console.log('PWA: installation dismissed')
      }
    } catch (error) {
      console.error('PWA installation failed:', error)
    }
  }

  const handleMainButtonClick = () => {
    const os = detectDeviceOS()
    if (os === 'iOS') {
      setShowIosGuide(true)
      setIsOpen(false)
      return
    }
    executeDirectInstall()
  }

  const handleInstallClick = (targetOS) => {
    executeDirectInstall(targetOS === 'android' ? 'Android' : targetOS === 'ios' ? 'iOS' : 'Desktop')
  }

  // Hide if already running inside standalone installed app mode
  if (isStandalone) return null

  return (
    <>
      {/* Floating Side Install Button */}
      <div className="install-app-floating-wrap">
        <button 
          type="button" 
          className={`btn-floating-install ${isOpen ? 'active' : ''}`}
          onClick={handleMainButtonClick}
          title="Install See Mee Web App"
          aria-label="Install See Mee App"
        >
          <div className="install-icon-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <span className="install-btn-text">Install App</span>
          <span className="install-pulse-dot"></span>
        </button>

        {/* Floating Side Options Card */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="install-side-popover"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="popover-header">
                <div className="header-title-wrap">
                  <span className="gold-sparkle">✦</span>
                  <h4>Install See Mee App</h4>
                </div>
                <button type="button" className="popover-close-btn" onClick={() => setIsOpen(false)}>✕</button>
              </div>

              <p className="popover-sub">1-Click access from home screen for Mobile & Desktop:</p>

              <div className="popover-os-list">
                {/* Android Option */}
                <div 
                  className={`popover-os-item android ${!canInstall ? 'disabled-item' : ''}`}
                  onClick={() => canInstall && handleInstallClick('android')}
                >
                  <div className="popover-os-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="3" ry="3"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                  </div>
                  <div className="popover-os-meta">
                    <span className="os-name font-bold">Android Phone</span>
                    <span className="os-desc">Chrome & Edge</span>
                  </div>
                  <button type="button" className="os-action-btn gold-btn" disabled={!canInstall}>
                    {canInstall ? 'Install Now' : 'Unavailable'}
                  </button>
                </div>

                {/* Desktop Option */}
                <div 
                  className={`popover-os-item desktop ${!canInstall ? 'disabled-item' : ''}`}
                  onClick={() => canInstall && handleInstallClick('desktop')}
                >
                  <div className="popover-os-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <div className="popover-os-meta">
                    <span className="os-name font-bold">Desktop PC / Mac</span>
                    <span className="os-desc">Standalone Web App</span>
                  </div>
                  <button type="button" className="os-action-btn gold-btn" disabled={!canInstall}>
                    {canInstall ? 'Install Now' : 'Unavailable'}
                  </button>
                </div>

                {/* iOS Option */}
                <div 
                  className="popover-os-item ios"
                  onClick={() => handleInstallClick('ios')}
                >
                  <div className="popover-os-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.68-.82 1.14-1.97.99-3.12-.98.04-2.17.65-2.87 1.47-.63.73-1.18 1.9-.99 3.03 1.1.09 2.21-.56 2.87-1.38z"/>
                    </svg>
                  </div>
                  <div className="popover-os-meta">
                    <span className="os-name font-bold">iPhone / iPad (iOS)</span>
                    <span className="os-desc">Safari Web App</span>
                  </div>
                  <button type="button" className="os-action-btn outline-btn">
                    View Guide
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* iOS Installation Step-by-Step Guide Modal */}
      {showIosGuide && (
        <div className="ios-install-modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="ios-install-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn-close-modal-x" onClick={() => setShowIosGuide(false)}>✕</button>
            
            <div className="ios-modal-header">
              <span className="ios-apple-icon"></span>
              <h3>Install See Mee on iPhone / iPad</h3>
              <p>Add See Mee to your Home Screen in 3 quick steps:</p>
            </div>

            <div className="ios-steps-list">
              <div className="ios-step-item">
                <div className="step-num">1</div>
                <div className="step-text">
                  Tap the <strong>Share button</strong> in Safari bottom menu.
                  <span className="step-icon-badge">⎋</span>
                </div>
              </div>

              <div className="ios-step-item">
                <div className="step-num">2</div>
                <div className="step-text">
                  Scroll down options and tap <strong>'Add to Home Screen'</strong>.
                  <span className="step-icon-badge">➕</span>
                </div>
              </div>

              <div className="ios-step-item">
                <div className="step-num">3</div>
                <div className="step-text">
                  Tap <strong>'Add'</strong> in top right. See Mee App will appear on your Home Screen!
                </div>
              </div>
            </div>

            <button type="button" className="btn-ios-got-it" onClick={() => setShowIosGuide(false)}>
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {installToast && (
        <div className="pwa-installed-toast">
          <span>🎉 See Mee Web App installed successfully!</span>
        </div>
      )}
    </>
  )
}

export default InstallAppWidget
