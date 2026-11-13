import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

// Profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Security Check: Prevent unverified email modification
  if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const cleanEmail = email.trim().toLowerCase()
    
    // Check if requested email belongs to another registered account
    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      res.status(400)
      throw new Error('Email address is already in use by another account')
    }

    res.status(400)
    throw new Error('Email address cannot be changed directly without verification. Please verify your new email address.')
  }

  if (name) user.name = name.trim()
  if (phone !== undefined) user.phone = phone
  if (password && password.trim().length >= 6) {
    user.password = password
  }

  const updatedUser = await user.save()
  res.json({
    success: true,
    data: {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role
    }
  })
})

// Strip HTML tags to eliminate XSS injections
const sanitizeText = (str = '') => {
  return String(str || '').replace(/<[^>]*>?/gm, '').trim()
}

// Verify Indian Postal PIN Code via India Post API
const verifyPostalPincode = async (pincode) => {
  const cleanPin = String(pincode || '').trim()
  if (!/^[1-8][0-9]{5}$/.test(cleanPin)) {
    return { valid: false, message: 'Invalid Indian PIN code format. Must be 6 digits starting with 1-8.' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const resp = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    })
    clearTimeout(timeout)

    if (resp.ok) {
      const data = await resp.json()
      if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
        return { valid: true }
      }
      return { valid: false, message: `PIN code ${cleanPin} is non-existent or not recognized by India Post.` }
    }
  } catch (err) {
    // If India Post API is temporarily unreachable or times out, allow valid 6-digit pattern starting with 1-8
    console.warn('⚠️ India Post API verification notice:', err.message)
  }

  return { valid: true }
}

const validateAndSanitizeAddress = async (body, user = null) => {
  const name = sanitizeText(body.name || user?.name || '')
  const street = sanitizeText(body.street || body.addressLine1 || '')
  const city = sanitizeText(body.city || '')
  const state = sanitizeText(body.state || '')
  const pincode = String(body.pincode || '').trim()
  const rawPhone = String(body.phone || user?.phone || '').replace(/\D/g, '').slice(-10)

  if (!name || name.length < 2) {
    throw new Error('Recipient name is required.')
  }

  if (!rawPhone || !/^[6-9]\d{9}$/.test(rawPhone)) {
    throw new Error('A valid 10-digit Indian phone number is compulsory (must start with 6-9).')
  }

  if (!street || street.length < 3) {
    throw new Error('Street address / house details are required.')
  }

  if (!city) {
    throw new Error('City is required.')
  }

  if (!state) {
    throw new Error('State is required.')
  }

  const pinCheck = await verifyPostalPincode(pincode)
  if (!pinCheck.valid) {
    throw new Error(pinCheck.message || 'Invalid or non-existent PIN code.')
  }

  return {
    name,
    phone: rawPhone,
    street,
    city,
    state,
    pincode,
    country: 'India',
    isDefault: !!body.isDefault
  }
}

// Addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, data: user.addresses })
})

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const cleanAddr = await validateAndSanitizeAddress(req.body, user)

  if (cleanAddr.isDefault || user.addresses.length === 0) {
    user.addresses.forEach(a => { a.isDefault = false })
    cleanAddr.isDefault = true
  }

  // Update user's primary phone if not present
  if (!user.phone && cleanAddr.phone) {
    user.phone = cleanAddr.phone
  }

  user.addresses.push(cleanAddr)
  await user.save()
  res.status(201).json({ success: true, data: user.addresses })
})

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const address = user.addresses.id(req.params.id)
  if (!address) {
    res.status(404)
    throw new Error('Address not found')
  }

  const cleanAddr = await validateAndSanitizeAddress(req.body, user)

  if (cleanAddr.isDefault) {
    user.addresses.forEach(a => {
      if (a._id.toString() !== req.params.id) {
        a.isDefault = false
      }
    })
  }

  Object.assign(address, cleanAddr)
  await user.save()
  res.json({ success: true, data: user.addresses })
})

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id)
  await user.save()
  res.json({ success: true, data: user.addresses })
})

// Wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist')
  res.json({ success: true, data: user.wishlist })
})

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body
  const user = await User.findById(req.user._id)
  
  const index = user.wishlist.indexOf(productId)
  if (index === -1) {
    user.wishlist.push(productId)
  } else {
    user.wishlist.splice(index, 1)
  }
  
  await user.save()
  const updatedUser = await User.findById(req.user._id).populate('wishlist')
  res.json({ success: true, data: updatedUser.wishlist })
})

// Cart Persistence
export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product')
  res.json({ success: true, data: user.cart })
})

export const syncCart = asyncHandler(async (req, res) => {
  const { cart } = req.body
  const user = await User.findById(req.user._id)
  user.cart = cart
  await user.save()
  res.json({ success: true, message: 'Cart synced' })
})
