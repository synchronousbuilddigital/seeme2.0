import Coupon from '../models/Coupon.js'
import { validateAndCalculateCoupon } from '../services/couponEngine.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Apply coupon to cart
// @route   POST /api/coupon/apply
// @access  Public
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, cartItems, userId, userEmail } = req.body

  if (!code) {
    return res.status(400).json({ success: false, message: 'Please enter a coupon code.' })
  }

  const result = await validateAndCalculateCoupon({
    code,
    cartItems: cartItems || [],
    userId: userId || req.user?._id || req.user?.email,
    userEmail: userEmail || req.user?.email
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

// @desc    Get available public coupons for suggestions
// @route   GET /api/coupon/available
// @access  Public
export const getAvailableCoupons = asyncHandler(async (req, res) => {
  const now = new Date()

  const coupons = await Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now }
  })
  .select('code description discountType percentage fixedAmount minimumOrder maximumDiscount freeShipping expiryDate')
  .sort({ minimumOrder: 1, createdAt: -1 })
  .lean()

  res.json({
    success: true,
    data: coupons
  })
})
