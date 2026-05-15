import Magazine from '../models/Magazine.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Get active magazine items (public)
// @route   GET /api/magazine
// @access  Public
export const getActiveMagazines = asyncHandler(async (req, res) => {
  const magazines = await Magazine.find({ isActive: true }).sort({ order: 1 })
  res.json({ success: true, data: magazines })
})

// @desc    Get all magazine items (admin)
// @route   GET /api/magazine/all
// @access  Admin
export const getAllMagazines = asyncHandler(async (req, res) => {
  const magazines = await Magazine.find().sort({ order: 1 })
  res.json({ success: true, data: magazines })
})

// @desc    Create magazine item
// @route   POST /api/magazine
// @access  Admin
export const createMagazine = asyncHandler(async (req, res) => {
  const { title, description, image, order } = req.body

  const highestOrder = await Magazine.findOne().sort({ order: -1 })
  const newOrder = order !== undefined ? order : (highestOrder ? highestOrder.order + 1 : 0)

  const magazine = await Magazine.create({
    title,
    description,
    image,
    order: newOrder,
    isActive: true
  })

  res.status(201).json({ success: true, data: magazine })
})

// @desc    Update magazine item
// @route   PUT /api/magazine/:id
// @access  Admin
export const updateMagazine = asyncHandler(async (req, res) => {
  const { title, description, image, order, isActive } = req.body

  const magazine = await Magazine.findByIdAndUpdate(
    req.params.id,
    { title, description, image, order, isActive },
    { new: true, runValidators: true }
  )

  if (!magazine) {
    res.status(404)
    throw new Error('Magazine item not found')
  }

  res.json({ success: true, data: magazine })
})

// @desc    Delete magazine item
// @route   DELETE /api/magazine/:id
// @access  Admin
export const deleteMagazine = asyncHandler(async (req, res) => {
  const magazine = await Magazine.findByIdAndDelete(req.params.id)
  if (!magazine) {
    res.status(404)
    throw new Error('Magazine item not found')
  }
  res.json({ success: true, message: 'Magazine item deleted' })
})
