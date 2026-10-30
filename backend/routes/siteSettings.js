import express from 'express'
import * as siteSettingsController from '../controllers/siteSettingsController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Middleware to prevent 304 Not Modified caching issues and ensure fresh 200 response
router.use((req, res, next) => {
  delete req.headers['if-none-match']
  delete req.headers['if-modified-since']
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')

  // Suppress ETag header so client/browser does not receive or send ETags for site-settings
  const origSet = res.set
  res.set = function (field, val) {
    if (typeof field === 'string' && field.toLowerCase() === 'etag') return this
    return origSet.apply(this, arguments)
  }

  next()
})

// GET site settings (public)
router.get('/', siteSettingsController.getSettings)

// GET online COD status (public, un-cached)
router.get('/cod-status', async (req, res) => {
  try {
    const { getSettings } = await import('../services/siteSettingsService.js')
    const settings = await getSettings()
    const isOnlineCodEnabled = settings ? settings.isOnlineCodEnabled !== false : true
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.json({ success: true, isOnlineCodEnabled })
  } catch (err) {
    res.json({ success: true, isOnlineCodEnabled: true })
  }
})

// UPDATE site settings (admin only)
router.put('/', protect, admin, siteSettingsController.updateSettings)

// TOGGLE online COD specifically (admin only)
router.put('/toggle-online-cod', protect, admin, async (req, res) => {
  try {
    const { isOnlineCodEnabled } = req.body
    const enabled = Boolean(isOnlineCodEnabled !== false && isOnlineCodEnabled !== 'false')
    const { updateSettings } = await import('../services/siteSettingsService.js')
    const settings = await updateSettings({ isOnlineCodEnabled: enabled })
    res.json({ success: true, isOnlineCodEnabled: enabled, data: settings })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router

