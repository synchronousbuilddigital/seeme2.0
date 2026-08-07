import Coupon from '../models/Coupon.js'
import { validateAndCalculateCoupon } from '../services/couponEngine.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Apply coupon to cart
// @route   POST /api/coupon/apply
// @access  Public (with optionalAuth)
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, cartItems, userId, userEmail } = req.body

  if (!code) {
    return res.status(400).json({ success: false, message: 'Please enter a coupon code.' })
  }

  const result = await validateAndCalculateCoupon({
    code,
    cartItems: cartItems || [],
    userId: req.user?._id || userId,
    userEmail: req.user?.email || userEmail
  })

  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      reason: result.reason,
      message: result.message
    })
  }

  res.json({
    success: true,
    data: result
  })
})

// @desc    Remove coupon
// @route   POST /api/coupon/remove
// @access  Public
export const removeCoupon = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Coupon removed successfully.'
  })
})

// @desc    Get available public and user-targeted coupons
// @route   GET /api/coupon/available
// @access  Public (with optionalAuth)
export const getAvailableCoupons = asyncHandler(async (req, res) => {
  const now = new Date()

  const audienceFilter = req.user ? {
    $or: [
      { targetAudience: 'all' },
      { targetAudience: { $exists: false } },
      { allowedUsers: { $size: 0 } },
      { allowedUsers: req.user._id }
    ]
  } : {
    $or: [
      { targetAudience: 'all' },
      { targetAudience: { $exists: false } },
      { allowedUsers: { $size: 0 } }
    ]
  }

  const query = {
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
    ...audienceFilter
  }

  const coupons = await Coupon.find(query)
    .select('code description discountType percentage fixedAmount minimumOrder maximumDiscount freeShipping expiryDate targetAudience allowedUsers')
    .sort({ minimumOrder: 1, createdAt: -1 })
    .lean()

  const formattedCoupons = coupons.map(c => {
    const allowedUserIds = (c.allowedUsers || []).map(u => String(u))
    const isExclusiveForUser = req.user ? allowedUserIds.includes(String(req.user._id)) : false
    const { allowedUsers, ...rest } = c
    return {
      ...rest,
      isExclusiveForUser
    }
  })

  res.json({
    success: true,
    data: formattedCoupons
  })
})

