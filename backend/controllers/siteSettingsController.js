import * as siteSettingsService from '../services/siteSettingsService.js'
import asyncHandler from '../utils/asyncHandler.js'

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await siteSettingsService.getSettings()
  res.json({ success: true, data: settings })
})

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await siteSettingsService.updateSettings(req.body)
  res.json({ success: true, data: settings })
})
