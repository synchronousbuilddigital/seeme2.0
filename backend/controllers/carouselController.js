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

  // If order is provided, shift existing slides
  if (order !== undefined) {
    await HeroCarousel.updateMany(
      { order: { $gte: order } },
      { $inc: { order: 1 } }
    )
  } else {
    // If no order provided, put at the end
    const lastSlide = await HeroCarousel.findOne().sort({ order: -1 })
    req.body.order = lastSlide ? lastSlide.order + 1 : 1
  }

  const carouselImage = await HeroCarousel.create({
    image,
    productId: productId || null,
    productName: productName || '',
    productCategory: productCategory || '',
    title: title || productName || '',
    subtitle: subtitle || productCategory || '',
    order: req.body.order,
    isActive: true
  })

  res.status(201).json({ success: true, data: carouselImage })
})

// @desc    Update carousel image
// @route   PUT /api/carousel/:id
// @access  Admin
export const updateCarousel = asyncHandler(async (req, res) => {
  const { image, productId, productName, productCategory, title, subtitle, order, isActive } = req.body
  const currentSlide = await HeroCarousel.findById(req.params.id)

  if (!currentSlide) {
    res.status(404)
    throw new Error('Carousel image not found')
  }

  // Handle re-ordering if order changed
  if (order !== undefined && order !== currentSlide.order) {
    if (order > currentSlide.order) {
      // Moving down: shift items between old and new position up
      await HeroCarousel.updateMany(
        { order: { $gt: currentSlide.order, $lte: order }, _id: { $ne: currentSlide._id } },
        { $inc: { order: -1 } }
      )
    } else {
      // Moving up: shift items between new and old position down
      await HeroCarousel.updateMany(
        { order: { $gte: order, $lt: currentSlide.order }, _id: { $ne: currentSlide._id } },
        { $inc: { order: 1 } }
      )
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

