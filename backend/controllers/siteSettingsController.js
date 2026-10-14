import * as siteSettingsService from '../services/siteSettingsService.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await siteSettingsService.getSettings()
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')
  res.status(200).json({ success: true, data: settings })
})

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await siteSettingsService.updateSettings(req.body)
  res.status(200).json({ success: true, data: settings })
})

