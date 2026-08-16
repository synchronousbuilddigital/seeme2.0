import { useState, useEffect } from 'react'
import {
  checkPushStatus,
  subscribeToPush,
  unsubscribeFromPush,
  triggerTestPush
} from '../utils/nativePush'
import './NotificationSettings.css'

const NotificationSettings = () => {
  const [pushStatus, setPushStatus] = useState({
    isSupported: true,
    isGranted: false,
    isSubscribed: false,
    permissionState: 'default'
  })
  const [loading, setLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  useEffect(() => {
    loadStatus()

    // Listen for PWA beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredInstallPrompt(e)
    }

    // Check if app is running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsAppInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true)
      setDeferredInstallPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const loadStatus = async () => {
    const status = await checkPushStatus()
    setPushStatus(status)
  }

  const showMsg = (text, type = 'success') => {
    setActionMessage({ text, type })
    setTimeout(() => setActionMessage(null), 5000)
  }

  const handleEnablePush = async () => {
    setLoading(true)
    try {
      await subscribeToPush()
      await loadStatus()
      showMsg('✅ Web Push notifications enabled! You will now receive instant desktop & mobile alerts for new customer orders.')
    } catch (err) {
      console.error('Push enable error:', err)
      showMsg(err.message || 'Failed to enable notifications.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDisablePush = async () => {
    setLoading(true)
    try {
      await unsubscribeFromPush()
      await loadStatus()
      showMsg('👋 Web Push notifications disabled for this device.', 'info')
    } catch (err) {
      console.error('Push disable error:', err)
      showMsg(err.message || 'Failed to disable notifications.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestPush = async () => {
    setLoading(true)
    try {
      const res = await triggerTestPush()
      showMsg(`🚀 Test push notification delivered to ${res.result?.deliveredDevices || 1} device(s)!`)
    } catch (err) {
      console.error('Test push error:', err)
      showMsg(err.message || 'Failed to send test push alert.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInstallPWA = async () => {
    if (!deferredInstallPrompt) return
    deferredInstallPrompt.prompt()
    const { outcome } = await deferredInstallPrompt.userChoice
    if (outcome === 'accepted') {
      setIsAppInstalled(true)
    }
    setDeferredInstallPrompt(null)
  }

  return (
    <div className="notification-settings-card">
      <div className="pwa-settings-header">
        <div className="pwa-header-left">
          <div className="notif-settings-icon">🔔</div>
          <div className="pwa-header-titles">
            <h3 className="settings-title">Notifications Status</h3>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`notif-alert-banner ${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {!pushStatus.isSupported ? (
        <div className="notif-unsupported-notice">
          ⚠️ Web Push API is not supported in this browser environment or requires HTTPS.
        </div>
      ) : (
        <div className="notif-settings-actions">
          {!pushStatus.isSubscribed ? (
            <button
              type="button"
              className="btn-enable-push"
              onClick={handleEnablePush}
              disabled={loading}
            >
              {loading ? 'Subscribing...' : '🔔 Enable Notifications'}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-test-push"
                onClick={handleSendTestPush}
                disabled={loading}
              >
                {loading ? 'Sending...' : '🚀 Send Test Notification'}
              </button>
              <button
                type="button"
                className="btn-disable-push"
                onClick={handleDisablePush}
                disabled={loading}
              >
                {loading ? 'Disabling...' : 'Disable Notifications'}
              </button>
            </>
          )}

          {deferredInstallPrompt && !isAppInstalled && (
            <button
              type="button"
              className="btn-install-pwa"
              onClick={handleInstallPWA}
            >
              📲 Install Admin PWA App
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationSettings
