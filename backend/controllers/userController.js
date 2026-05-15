import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

// Profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body
  const user = await User.findById(req.user._id)

  if (user) {
    user.name = name || user.name
    user.email = email || user.email
    user.phone = phone || user.phone
    
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
  } else {
    res.status(404)
    throw new Error('User not found')
  }
})

// Addresses
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, data: user.addresses })
})

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  user.addresses.push(req.body)
  await user.save()
  res.status(201).json({ success: true, data: user.addresses })
})

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const address = user.addresses.id(req.params.id)
  if (address) {
    Object.assign(address, req.body)
    await user.save()
    res.json({ success: true, data: user.addresses })
  } else {
    res.status(404)
    throw new Error('Address not found')
  }
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
