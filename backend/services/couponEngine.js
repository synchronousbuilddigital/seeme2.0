import mongoose from 'mongoose'
import Coupon from '../models/Coupon.js'
import CouponUsage from '../models/CouponUsage.js'
import Order from '../models/Order.js'
import User from '../models/User.js'

export const validateAndCalculateCoupon = async ({
  code,
  cartItems = [],
  userId = null,
  userEmail = null
}) => {
  if (!code || typeof code !== 'string') {
    return { isValid: false, reason: 'INVALID_CODE', message: 'Please enter a valid coupon code.' }
  }

  const cleanCode = code.trim().toUpperCase()
  const coupon = await Coupon.findOne({ code: cleanCode })

  if (!coupon) {
    return { isValid: false, reason: 'NOT_FOUND', message: 'Coupon code does not exist.' }
  }

  if (!coupon.isActive) {
    return { isValid: false, reason: 'INACTIVE', message: 'This coupon is currently inactive.' }
  }

  const now = new Date()
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { isValid: false, reason: 'UPCOMING', message: 'This coupon is not active yet.' }
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    return { isValid: false, reason: 'EXPIRED', message: 'This coupon has expired.' }
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { isValid: false, reason: 'USAGE_LIMIT_EXCEEDED', message: 'This coupon limit has been fully redeemed.' }
  }

  // Resolve valid user ObjectId if available
  let validUserId = null
  if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
    validUserId = userId
  } else if (userEmail) {
    const userObj = await User.findOne({ email: String(userEmail).toLowerCase().trim() }).select('_id')
    if (userObj) {
      validUserId = userObj._id
    }
  }

  // Check target user restriction if targeted to selected users
  const isTargeted = coupon.targetAudience === 'selected' || (coupon.allowedUsers && coupon.allowedUsers.length > 0)
  if (isTargeted) {
    const allowedUserIds = (coupon.allowedUsers || []).map(u => String(u._id || u))
    let userMatched = false

    if (validUserId && allowedUserIds.includes(String(validUserId))) {
      userMatched = true
    }

    if (!userMatched && userEmail) {
      const userObj = await User.findOne({ email: String(userEmail).toLowerCase().trim() }).select('_id')
      if (userObj && allowedUserIds.includes(String(userObj._id))) {
        userMatched = true
      }
    }

    if (!userMatched) {
      return {
        isValid: false,
        reason: 'USER_NOT_ELIGIBLE',
        message: 'This coupon is valid only for specific selected customers.'
      }
    }
  }

  // Check per-user limit
  if (coupon.perUserLimit && (validUserId || userEmail)) {
    let usageConditions = []
    if (validUserId) usageConditions.push({ user: validUserId })
    if (userEmail) usageConditions.push({ userEmail: String(userEmail).toLowerCase().trim() })

    if (usageConditions.length > 0) {
      const userUsageCount = await CouponUsage.countDocuments({
        coupon: coupon._id,
        $or: usageConditions
      })
      if (userUsageCount >= coupon.perUserLimit) {
        return {
          isValid: false,
          reason: 'USER_LIMIT_EXCEEDED',
          message: `You have already used this coupon maximum allowed times (${coupon.perUserLimit}).`
        }
      }
    }
  }

  // Check first-order only
  if (coupon.firstOrderOnly && (validUserId || userEmail)) {
    let orderConditions = []
    if (validUserId) {
      orderConditions.push({ user: validUserId })
    }
    if (userEmail) {
      orderConditions.push({ 'customer.email': String(userEmail).toLowerCase().trim() })
    }

    if (orderConditions.length > 0) {
      const userOrdersCount = await Order.countDocuments({ $or: orderConditions })
      if (userOrdersCount > 0) {
        return { isValid: false, reason: 'FIRST_ORDER_ONLY', message: 'This coupon is valid only for your first order.' }
      }
    }
  }

  // Normalize cart items and calculate total subtotal
  const normalizedCart = cartItems.map(item => {
    let price = 0
    if (item.price) {
      if (typeof item.price === 'string') {
        price = parseInt(item.price.replace(/[₹,]/g, '')) || 0
      } else if (typeof item.price === 'number') {
        price = item.price
      }
    }
    const qty = Number(item.quantity) || 1
    const pId = String(item.id || item._id || item.product || '')
    const cat = String(item.category || '').toLowerCase()
    return { ...item, price, qty, lineTotal: price * qty, pId, cat }
  })

  const cartSubtotal = normalizedCart.reduce((sum, item) => sum + item.lineTotal, 0)

  if (cartSubtotal < (coupon.minimumOrder || 0)) {
    return {
      isValid: false,
      reason: 'MINIMUM_ORDER_NOT_MET',
      message: `Minimum order value of ₹${coupon.minimumOrder.toLocaleString('en-IN')} required for this coupon.`
    }
  }

  // Filter items for product & category inclusions / exclusions
  let eligibleSubtotal = 0

  const hasAppProducts = coupon.applicableProducts && coupon.applicableProducts.length > 0
  const hasAppCategories = coupon.applicableCategories && coupon.applicableCategories.length > 0
  const hasExcProducts = coupon.excludedProducts && coupon.excludedProducts.length > 0
  const hasExcCategories = coupon.excludedCategories && coupon.excludedCategories.length > 0

  const appProductIds = (coupon.applicableProducts || []).map(id => String(id))
  const excProductIds = (coupon.excludedProducts || []).map(id => String(id))
  const appCategories = (coupon.applicableCategories || []).map(c => c.toLowerCase())
  const excCategories = (coupon.excludedCategories || []).map(c => c.toLowerCase())

  normalizedCart.forEach(item => {
    let isEligible = true

    if (hasExcProducts && excProductIds.includes(item.pId)) isEligible = false
    if (hasExcCategories && excCategories.includes(item.cat)) isEligible = false

    if (hasAppProducts || hasAppCategories) {
      const matchProduct = hasAppProducts && appProductIds.includes(item.pId)
      const matchCategory = hasAppCategories && appCategories.includes(item.cat)
      if (!matchProduct && !matchCategory) isEligible = false
    }

    if (isEligible) {
      eligibleSubtotal += item.lineTotal
    }
  })

  if (eligibleSubtotal === 0 && (hasAppProducts || hasAppCategories || hasExcProducts || hasExcCategories)) {
    return {
      isValid: false,
      reason: 'NO_ELIGIBLE_ITEMS',
      message: 'None of the items in your shopping bag are eligible for this coupon.'
    }
  }

  const baseForDiscount = (eligibleSubtotal > 0 || hasAppProducts || hasAppCategories) ? eligibleSubtotal : cartSubtotal

  // Calculate discount amount
  let discountAmount = 0
  let isFreeShipping = coupon.freeShipping || false

  if (coupon.discountType === 'percentage') {
    discountAmount = (baseForDiscount * (coupon.percentage || 0)) / 100
    if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maximumDiscount)
    }
  } else if (coupon.discountType === 'fixedAmount') {
    discountAmount = Math.min(coupon.fixedAmount || 0, baseForDiscount)
  } else if (coupon.discountType === 'freeShipping') {
    isFreeShipping = true
  } else if (coupon.discountType === 'buyXgetY') {
    const config = coupon.buyXGetYConfig || { buyQuantity: 1, getQuantity: 1, getDiscountPercentage: 100 }
    const totalItemsCount = normalizedCart.reduce((sum, i) => sum + i.qty, 0)
    const setsCount = Math.floor(totalItemsCount / (config.buyQuantity + config.getQuantity))
    if (setsCount > 0) {
      const sortedPrices = normalizedCart.flatMap(i => Array(i.qty).fill(i.price)).sort((a, b) => a - b)
      const discountedItems = sortedPrices.slice(0, setsCount * config.getQuantity)
      discountAmount = discountedItems.reduce((sum, p) => sum + (p * (config.getDiscountPercentage / 100)), 0)
    }
  }

  discountAmount = Math.round(discountAmount)

  return {
    isValid: true,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      percentage: coupon.percentage,
      fixedAmount: coupon.fixedAmount,
      minimumOrder: coupon.minimumOrder,
      maximumDiscount: coupon.maximumDiscount,
      freeShipping: isFreeShipping,
      expiryDate: coupon.expiryDate
    },
    discountAmount,
    isFreeShipping,
    message: `✦ Coupon "${coupon.code}" applied! You saved ₹${discountAmount.toLocaleString('en-IN')}`
  }
}

/**
 * Record coupon usage atomically after an order is successfully created or paid
 */
export const recordCouponUsage = async ({
  couponCode,
  userId = null,
  userEmail = null,
  orderId = null,
  discountAmount = 0
}) => {
  if (!couponCode || typeof couponCode !== 'string' || !couponCode.trim()) return null

  const cleanCode = couponCode.trim().toUpperCase()

  // Prevent duplicate CouponUsage creation for the same order
  if (orderId) {
    const existingUsage = await CouponUsage.findOne({ order: orderId })
    if (existingUsage) {
      return { usageRecord: existingUsage }
    }
  }

  // Find coupon
  const couponDoc = await Coupon.findOne({ code: cleanCode })
  if (!couponDoc) {
    console.warn(`⚠️ Coupon "${cleanCode}" not found in database.`)
    return null
  }

  if (!couponDoc.isActive) {
    console.warn(`⚠️ Coupon "${cleanCode}" is inactive. Usage count not incremented.`)
    return null
  }

  if (couponDoc.usageLimit !== null && couponDoc.usageLimit !== undefined && (couponDoc.usedCount || 0) >= couponDoc.usageLimit) {
    console.warn(`⚠️ Coupon "${cleanCode}" usage limit (${couponDoc.usageLimit}) reached.`)
    return null
  }

  // Increment usedCount
  const updatedCoupon = await Coupon.findByIdAndUpdate(
    couponDoc._id,
    { $inc: { usedCount: 1 } },
    { new: true }
  )

  const userIdentifier = userId ? String(userId) : (userEmail ? String(userEmail).toLowerCase().trim() : 'anonymous')

  const usageRecord = await CouponUsage.create({
    coupon: couponDoc._id,
    user: userIdentifier,
    order: orderId || null,
    discountAmount: Number(discountAmount) || 0
  })

  console.log(`✅ [COUPON USED] Code: "${cleanCode}" | New usedCount: ${updatedCoupon?.usedCount} | Order: ${orderId || 'N/A'}`)

  return { coupon: updatedCoupon || couponDoc, usageRecord }
}

/**
 * Revert coupon usage when an order is cancelled or refunded
 */
export const revertCouponUsage = async (orderId) => {
  if (!orderId) return null
  try {
    const usages = await CouponUsage.find({ order: orderId })
    for (const usage of usages) {
      const updatedCoupon = await Coupon.findByIdAndUpdate(
        usage.coupon,
        { $inc: { usedCount: -1 } },
        { new: true }
      )
      if (updatedCoupon && updatedCoupon.usedCount < 0) {
        updatedCoupon.usedCount = 0
        await updatedCoupon.save()
      }
      await CouponUsage.findByIdAndDelete(usage._id)
      console.log(`↩️ [COUPON REVERTED] Order: ${orderId} | New usedCount: ${updatedCoupon?.usedCount || 0}`)
    }
  } catch (err) {
    console.error('Error reverting coupon usage:', err.message)
  }
}
