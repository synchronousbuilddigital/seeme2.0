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

// UPDATE site settings (admin only)
router.put('/', protect, admin, siteSettingsController.updateSettings)

export default router

