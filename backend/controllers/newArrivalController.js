import NewArrival from '../models/NewArrival.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Get active new arrivals (public)
// @route   GET /api/new-arrivals
// @access  Public
export const getNewArrivals = asyncHandler(async (req, res) => {
  const arrivals = await NewArrival.find({ isActive: true })
  res.json({ success: true, data: arrivals })
})

// @desc    Update/create new arrival by category
// @route   PUT /api/new-arrivals/:category
// @access  Admin
export const updateNewArrival = asyncHandler(async (req, res) => {
  const { category } = req.params
  const { image } = req.body

  let arrival = await NewArrival.findOne({ category })

  if (arrival) {
    arrival.image = image
    await arrival.save()
  } else {
    arrival = await NewArrival.create({ category, image })
  }

  res.json({ success: true, data: arrival })
})
