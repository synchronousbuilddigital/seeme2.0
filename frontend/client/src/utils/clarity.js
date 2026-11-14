import Clarity from '@microsoft/clarity'

const DEFAULT_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || 'zdbki96960'

let isInitialized = false

/**
 * Initialize Microsoft Clarity Behavioral Analytics
 * @param {string} [projectId] - Clarity project ID
 */
export const initClarity = (projectId = DEFAULT_PROJECT_ID) => {
  if (typeof window === 'undefined' || isInitialized) return
  if (!projectId) {
    console.warn('[Clarity] Project ID is missing')
    return
  }

  try {
    Clarity.init(projectId)
    isInitialized = true
    console.log('[Clarity] Initialized with project ID:', projectId)
  } catch (error) {
    console.error('[Clarity] Initialization failed:', error)
  }
}

/**
 * Identify a user in Microsoft Clarity
 * @param {Object} user - User object with _id/id, name, email
 * @param {string} [customSessionId]
 * @param {string} [customPageId]
 */
export const identifyClarityUser = (user, customSessionId, customPageId) => {
  if (typeof window === 'undefined' || !user) return

  const customId = String(user.id || user._id || user.email || '')
  if (!customId) return

  const friendlyName = user.name || user.fullName || user.email || 'Client'

  try {
    Clarity.identify(customId, customSessionId, customPageId, friendlyName)
  } catch (error) {
    console.error('[Clarity] identify failed:', error)
  }
}

/**
 * Set custom key/value tag for filtering in Clarity dashboard
 * @param {string} key
 * @param {string|string[]} value
 */
export const setClarityTag = (key, value) => {
  if (typeof window === 'undefined' || !key || value === undefined) return
  try {
    Clarity.setTag(String(key), value)
  } catch (error) {
    console.error('[Clarity] setTag failed:', error)
  }
}

/**
 * Track custom business event in Clarity
 * @param {string} eventName
 */
export const trackClarityEvent = (eventName) => {
  if (typeof window === 'undefined' || !eventName) return
  try {
    Clarity.event(String(eventName))
  } catch (error) {
    console.error('[Clarity] event failed:', error)
  }
}

/**
 * Upgrade session priority in Clarity recordings (e.g. for cart abandonment, checkout, errors)
 * @param {string} reason
 */
export const upgradeClaritySession = (reason) => {
  if (typeof window === 'undefined' || !reason) return
  try {
    Clarity.upgrade(String(reason))
  } catch (error) {
    console.error('[Clarity] upgrade failed:', error)
  }
}

/**
 * Grant cookie consent for Clarity v2
 * @param {boolean} granted
 */
export const consentClarity = (granted = true) => {
  if (typeof window === 'undefined') return
  try {
    Clarity.consentV2({
      ad_Storage: granted ? 'granted' : 'denied',
      analytics_Storage: granted ? 'granted' : 'denied'
    })
  } catch (error) {
    console.error('[Clarity] consent failed:', error)
  }
}

export default {
  init: initClarity,
  identify: identifyClarityUser,
  setTag: setClarityTag,
  event: trackClarityEvent,
  upgrade: upgradeClaritySession,
  consent: consentClarity
}
