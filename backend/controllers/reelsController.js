import Reel from '../models/Reel.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Get active reels (public)
// @route   GET /api/reels
// @access  Public
export const getActiveReels = asyncHandler(async (req, res) => {
  const reels = await Reel.find({ isActive: true })
    .populate('product', 'name price images category tag description')
    .sort({ order: 1, createdAt: -1 })
  res.json({ success: true, data: reels })
})

// @desc    Get all reels (admin)
// @route   GET /api/reels/all
// @access  Admin
export const getAllReels = asyncHandler(async (req, res) => {
  const reels = await Reel.find()
    .populate('product', 'name price images category')
    .sort({ order: 1, createdAt: -1 })
  res.json({ success: true, data: reels })
})

// @desc    Create new reel
// @route   POST /api/reels
// @access  Admin
export const createReel = asyncHandler(async (req, res) => {
  const { title, caption, videoUrl, coverImage, product, order, isActive } = req.body

  if (!title || !videoUrl) {
    res.status(400)
    throw new Error('Title and Video URL are required')
  }

  let finalOrder = order
  if (finalOrder === undefined) {
    const lastReel = await Reel.findOne().sort({ order: -1 })
    finalOrder = lastReel ? (lastReel.order || 0) + 1 : 1
  }

  const newReel = await Reel.create({
    title,
    caption: caption || '',
    videoUrl,
    coverImage: coverImage || '',
    product: product || null,
    order: finalOrder,
    isActive: isActive !== false
  })

  const populatedReel = await Reel.findById(newReel._id).populate('product', 'name price images category')
  res.status(201).json({ success: true, data: populatedReel })
})

// @desc    Update reel
// @route   PUT /api/reels/:id
// @access  Admin
export const updateReel = asyncHandler(async (req, res) => {
  const { title, caption, videoUrl, coverImage, product, order, isActive, likesCount } = req.body

  const reel = await Reel.findById(req.params.id)
  if (!reel) {
    res.status(404)
    throw new Error('Reel not found')
  }

  if (title !== undefined) reel.title = title
  if (caption !== undefined) reel.caption = caption
  if (videoUrl !== undefined) reel.videoUrl = videoUrl
  if (coverImage !== undefined) reel.coverImage = coverImage
  if (product !== undefined) reel.product = product || null
  if (order !== undefined) reel.order = order
  if (isActive !== undefined) reel.isActive = isActive
  if (likesCount !== undefined) reel.likesCount = likesCount

  await reel.save()

  const updatedReel = await Reel.findById(reel._id).populate('product', 'name price images category')
  res.json({ success: true, data: updatedReel })
})

// @desc    Delete reel
// @route   DELETE /api/reels/:id
// @access  Admin
export const deleteReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id)
  if (!reel) {
    res.status(404)
    throw new Error('Reel not found')
  }

  await reel.deleteOne()
  res.json({ success: true, message: 'Reel deleted successfully' })
})

// @desc    Like a reel
// @route   POST /api/reels/:id/like
// @access  Public
export const likeReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findByIdAndUpdate(
    req.params.id,
    { $inc: { likesCount: 1 } },
    { new: true }
  ).populate('product', 'name price images category')

  if (!reel) {
    res.status(404)
    throw new Error('Reel not found')
  }

  res.json({ success: true, data: reel })
})
