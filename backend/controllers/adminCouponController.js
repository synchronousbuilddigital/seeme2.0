import Coupon from '../models/Coupon.js'
import CouponUsage from '../models/CouponUsage.js'
import Order from '../models/Order.js'
import asyncHandler from '../utils/asyncHandler.js'
import { invalidateCouponCache } from './couponController.js'

// @desc    Get all coupons for admin panel with filters, search, & pagination
// @route   GET /api/admin/coupons
// @access  Admin
export const getAdminCoupons = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
  const filter = {}

  if (search && search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [
      { code: regex },
      { description: regex }
    ]
  }

  const now = new Date()
  if (status === 'active') {
    filter.isActive = true
    filter.startDate = { $lte: now }
    filter.expiryDate = { $gte: now }
  } else if (status === 'expired') {
    filter.expiryDate = { $lt: now }
  } else if (status === 'upcoming') {
    filter.startDate = { $gt: now }
  } else if (status === 'disabled') {
    filter.isActive = false
  }

  const skip = (Number(page) - 1) * Number(limit)
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

  const coupons = await Coupon.find(filter)
    .populate('allowedUsers', '_id name email phone')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean()

  const total = await Coupon.countDocuments(filter)

  res.json({
    success: true,
    data: coupons,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit))
    }
  })
})

// @desc    Get single coupon with usage stats & order history
// @route   GET /api/admin/coupons/:id
// @access  Admin
export const getAdminCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id).populate('allowedUsers', '_id name email phone')
  if (!coupon) {
    res.status(404)
    throw new Error('Coupon not found')
  }

  const usages = await CouponUsage.find({ coupon: coupon._id })
    .sort({ usedAt: -1 })
    .limit(20)
    .lean()

  res.json({
    success: true,
    data: {
      ...coupon.toObject(),
      usages
    }
  })
})

// @desc    Create new coupon
// @route   POST /api/admin/coupons
// @access  Admin
export const createCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body
  if (!code) {
    res.status(400)
    throw new Error('Coupon code is required')
  }

  const cleanCode = code.trim().toUpperCase()
  const existing = await Coupon.findOne({ code: cleanCode })
  if (existing) {
    res.status(400)
    throw new Error(`Coupon code "${cleanCode}" already exists.`)
  }

  const newCoupon = await Coupon.create({
    ...req.body,
    code: cleanCode
  })

  invalidateCouponCache()

  res.status(201).json({
    success: true,
    data: newCoupon,
    message: `Coupon "${cleanCode}" created successfully.`
  })
})

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Admin
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) {
    res.status(404)
    throw new Error('Coupon not found')
  }

  if (req.body.code) {
    req.body.code = req.body.code.trim().toUpperCase()
    const duplicate = await Coupon.findOne({ code: req.body.code, _id: { $ne: req.params.id } })
    if (duplicate) {
      res.status(400)
      throw new Error(`Coupon code "${req.body.code}" is already in use by another coupon.`)
    }
  }

  const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

  invalidateCouponCache()

  res.json({
    success: true,
    data: updated,
    message: 'Coupon updated successfully.'
  })
})

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Admin
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) {
    res.status(404)
    throw new Error('Coupon not found')
  }

  await Coupon.findByIdAndDelete(req.params.id)

  invalidateCouponCache()

  res.json({
    success: true,
    message: `Coupon "${coupon.code}" deleted successfully.`
  })
})

// @desc    Toggle coupon status (enable / disable)
// @route   PATCH /api/admin/coupons/:id/status
// @access  Admin
export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) {
    res.status(404)
    throw new Error('Coupon not found')
  }

  coupon.isActive = req.body.isActive !== undefined ? req.body.isActive : !coupon.isActive
  await coupon.save()

  invalidateCouponCache()

  res.json({
    success: true,
    data: coupon,
    message: `Coupon "${coupon.code}" is now ${coupon.isActive ? 'Active' : 'Disabled'}.`
  })
})

// @desc    Duplicate an existing coupon
// @route   POST /api/admin/coupons/:id/duplicate
// @access  Admin
export const duplicateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) {
    res.status(404)
    throw new Error('Coupon not found')
  }

  const originalObj = coupon.toObject()
  delete originalObj._id
  delete originalObj.createdAt
  delete originalObj.updatedAt

  let copyCode = `${originalObj.code}_COPY`
  let count = 1
  while (await Coupon.findOne({ code: copyCode })) {
    copyCode = `${originalObj.code}_COPY${count++}`
  }

  const duplicated = await Coupon.create({
    ...originalObj,
    code: copyCode,
    usedCount: 0,
    isActive: false // Default duplicated coupon to disabled for safety
  })

  invalidateCouponCache()

  res.status(201).json({
    success: true,
    data: duplicated,
    message: `Duplicated as "${copyCode}".`
  })
})
