import Brand from '../models/Brand.js'
import asyncHandler from '../utils/asyncHandler.js'
import cloudinary from '../config/cloudinary.js'

// @desc    Get all active brands (or all for admin)
// @route   GET /api/brands
// @access  Public
export const getBrands = asyncHandler(async (req, res) => {
  const { gender, admin } = req.query
  let query = {}

  if (admin !== 'true') {
    query.isActive = true
  }

  const brands = await Brand.find(query).sort({ order: 1, createdAt: -1 }).lean()

  const normalized = brands.map(b => {
    const audience = Array.isArray(b.targetAudience)
      ? b.targetAudience.map(v => (v || '').toLowerCase())
      : (typeof b.targetAudience === 'string' && b.targetAudience.trim() ? [b.targetAudience.toLowerCase()] : ['all'])
    return { ...b, targetAudience: audience }
  })

  if (gender && admin !== 'true') {
    const g = gender.toLowerCase()
    const filtered = normalized.filter(b => b.targetAudience.includes(g) || b.targetAudience.includes('all'))
    return res.json({ success: true, count: filtered.length, data: filtered })
  }

  res.json({ success: true, count: normalized.length, data: normalized })
})

// @desc    Create a new brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = asyncHandler(async (req, res) => {
  const { name, tagline, image, bgImage, bgColor, targetAudience, buttonText, link, order, isActive } = req.body

  if (!name || !image) {
    res.status(400)
    throw new Error('Brand name and avatar image are required')
  }

  const audience = Array.isArray(targetAudience) && targetAudience.length > 0
    ? targetAudience
    : (typeof targetAudience === 'string' && targetAudience.trim() ? [targetAudience] : ['men'])

  const brand = await Brand.create({
    name,
    tagline: tagline || '',
    image,
    bgImage: bgImage || '',
    bgColor: bgColor || '#D1F2EE',
    targetAudience: audience,
    buttonText: buttonText || 'Products ↗',
    link: link || '',
    order: Number(order) || 0,
    isActive: isActive !== false
  })

  res.status(201).json({ success: true, data: brand })
})

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params

  let brand = await Brand.findById(id)
  if (!brand) {
    res.status(404)
    throw new Error('Brand not found')
  }

  if (req.body.targetAudience) {
    req.body.targetAudience = Array.isArray(req.body.targetAudience) && req.body.targetAudience.length > 0
      ? req.body.targetAudience
      : [req.body.targetAudience]
  }

  brand = await Brand.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })

  res.json({ success: true, data: brand })
})

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params

  const brand = await Brand.findById(id)
  if (!brand) {
    res.status(404)
    throw new Error('Brand not found')
  }

  // Cleanup Cloudinary image if uploaded
  if (brand.image) {
    await deleteCloudinaryImage(brand.image).catch(() => {})
  }
  if (brand.bgImage) {
    await deleteCloudinaryImage(brand.bgImage).catch(() => {})
  }

  await brand.deleteOne()

  res.json({ success: true, message: 'Brand removed successfully' })
})
