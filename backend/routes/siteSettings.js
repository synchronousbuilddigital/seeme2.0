import express from 'express'
import * as siteSettingsController from '../controllers/siteSettingsController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// GET site settings (public)
router.get('/', siteSettingsController.getSettings)

// UPDATE site settings (admin only)
router.put('/', protect, admin, siteSettingsController.updateSettings)

export default router
