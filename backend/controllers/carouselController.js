import HeroCarousel from '../models/HeroCarousel.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Get active carousel images (public)
// @route   GET /api/carousel
// @access  Public
export const getActiveCarousel = asyncHandler(async (req, res) => {
  const carouselImages = await HeroCarousel.find({ isActive: true }).sort({ order: 1 })
  res.json({ success: true, data: carouselImages })
})

// @desc    Get all carousel images (admin)
// @route   GET /api/carousel/all
// @access  Admin
export const getAllCarousel = asyncHandler(async (req, res) => {
  const carouselImages = await HeroCarousel.find().sort({ order: 1 })
  res.json({ success: true, data: carouselImages })
})

// @desc    Create carousel image
// @route   POST /api/carousel
// @access  Admin
export const createCarousel = asyncHandler(async (req, res) => {
  const { image, productId, productName, productCategory, title, subtitle, order } = req.body

  const existingOrder = await HeroCarousel.findOne({ order })
  if (existingOrder) {
    res.status(400)
    throw new Error(`Order ${order} already exists. Please use a different order number.`)
  }

  const carouselImage = await HeroCarousel.create({
    image,
    productId: productId || null,
    productName: productName || '',
    productCategory: productCategory || '',
    title: title || productName || '',
    subtitle: subtitle || productCategory || '',
    order,
    isActive: true
  })

  res.status(201).json({ success: true, data: carouselImage })
})

// @desc    Update carousel image
// @route   PUT /api/carousel/:id
// @access  Admin
export const updateCarousel = asyncHandler(async (req, res) => {
  const { image, productId, productName, productCategory, title, subtitle, order, isActive } = req.body

  if (order !== undefined) {
    const existingOrder = await HeroCarousel.findOne({
      order,
      _id: { $ne: req.params.id }
    })
    if (existingOrder) {
      res.status(400)
      throw new Error(`Order ${order} already exists. Please use a different order number.`)
    }
  }

  const updateData = { image, productId, productName, productCategory, title, subtitle, order, isActive }
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key]
    }
  })

  const carouselImage = await HeroCarousel.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  )

  if (!carouselImage) {
    res.status(404)
    throw new Error('Carousel image not found')
  }

  res.json({ success: true, data: carouselImage })
})

// @desc    Delete carousel image
// @route   DELETE /api/carousel/:id
// @access  Admin
export const deleteCarousel = asyncHandler(async (req, res) => {
  const carouselImage = await HeroCarousel.findByIdAndDelete(req.params.id)
  if (!carouselImage) {
    res.status(404)
    throw new Error('Carousel image not found')
  }
  res.json({ success: true, message: 'Carousel image deleted' })
})
