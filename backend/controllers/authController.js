import crypto from 'crypto'
import * as authService from '../services/authService.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body)
  const accessToken = authService.generateToken(user._id)
  const refreshToken = authService.generateRefreshToken(user._id)

  setRefreshTokenCookie(res, refreshToken)

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    token: accessToken
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await authService.loginUser({ email, password })
    const accessToken = authService.generateToken(user._id)
    const refreshToken = authService.generateRefreshToken(user._id)

    setRefreshTokenCookie(res, refreshToken)

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token: accessToken
    })
  } catch (error) {
    res.status(401)
    throw error
  }
})

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    res.status(401)
    throw new Error('No refresh token provided')
  }

  const decoded = authService.verifyRefreshToken(refreshToken)
  if (!decoded) {
    res.status(401)
    throw new Error('Invalid or expired refresh token')
  }

  const accessToken = authService.generateToken(decoded.id)
  res.json({ success: true, token: accessToken })
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken')
  res.json({ success: true, message: 'Logged out successfully' })
})

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user._id)
  res.json({
    success: true,
    data: user
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000 // 30 mins

  await user.save()

  // In a real app, send email here. For now, we'll return the token in the response for development/demo
  // if (process.env.NODE_ENV === 'development') {
    res.json({
      success: true,
      message: 'Password reset token generated (Development Mode)',
      resetToken // In production, this would only be in the email
    })
  // } else {
  //   // Send email logic...
  //   res.json({ success: true, message: 'Password reset link sent to email' })
  // }
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  })

  if (!user) {
    res.status(400)
    throw new Error('Invalid or expired reset token')
  }

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined

  await user.save()

  res.json({
    success: true,
    message: 'Password reset successfully'
  })
})
