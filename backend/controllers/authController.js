import crypto from 'crypto'
import * as authService from '../services/authService.js'
import * as googleAuthService from '../services/googleAuthService.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import { sendOtpEmail } from '../services/emailService.js'

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

/**
 * @desc    Forgot Password - Generate & Send 6-digit OTP to User's Gmail
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email || !email.trim()) {
    res.status(400)
    throw new Error('Please enter a valid email address.')
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })

  if (!user) {
    res.status(404)
    throw new Error('No registered account found with this email address.')
  }

  // Generate secure 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Store OTP and set expiration to 2 minutes from now
  user.otpCode = otp
  user.otpExpires = new Date(Date.now() + 2 * 60 * 1000) // Expiration reduced to 2 mins

  await user.save()

  console.log(`🔑 [OTP GENERATED] To: ${user.email} | OTP Code: ${otp} | Expires in: 2 mins`)

  // Send OTP Email via Nodemailer Gmail Service
  await sendOtpEmail(user.email, user.name, otp)

  res.json({
    success: true,
    message: 'A 6-digit verification OTP has been sent to your email address (Valid for 2 minutes).'
  })
})

/**
 * @desc    Verify 6-digit OTP Code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    res.status(400)
    throw new Error('Email and 6-digit OTP code are required.')
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })

  if (!user || !user.otpCode || !user.otpExpires) {
    res.status(400)
    throw new Error('No active OTP request found. Please request a new code.')
  }

  // Check if OTP is expired (10 minutes)
  if (new Date(user.otpExpires).getTime() < Date.now()) {
    user.otpCode = undefined
    user.otpExpires = undefined
    await user.save()
    res.status(400)
    throw new Error('OTP has expired. Please request a new OTP code.')
  }

  // Verify OTP match
  if (String(user.otpCode).trim() !== String(otp).trim()) {
    res.status(400)
    throw new Error('Invalid OTP code. Please check your email and try again.')
  }

  res.json({
    success: true,
    message: 'OTP verified successfully. You can now set your new password.'
  })
})

/**
 * @desc    Reset Password after OTP Verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body

  if (!email || !otp || !password) {
    res.status(400)
    throw new Error('Email, OTP, and new password are required.')
  }

  if (password.length < 6) {
    res.status(400)
    throw new Error('Password must be at least 6 characters long.')
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })

  if (!user || !user.otpCode || !user.otpExpires) {
    res.status(400)
    throw new Error('Invalid or expired password reset session.')
  }

  if (new Date(user.otpExpires).getTime() < Date.now()) {
    res.status(400)
    throw new Error('OTP has expired. Please request a new code.')
  }

  if (String(user.otpCode).trim() !== String(otp).trim()) {
    res.status(400)
    throw new Error('Invalid OTP code.')
  }

  // Update password (pre-save hook in User model will hash it with bcrypt)
  user.password = password

  // Clear OTP fields
  user.otpCode = undefined
  user.otpExpires = undefined

  await user.save()

  res.json({
    success: true,
    message: 'Password reset successfully. Please sign in with your new password.'
  })
})

/**
 * @desc    Start Google OAuth Flow
 * @route   GET /api/auth/google
 * @access  Public
 */
export const googleAuthStart = asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(32).toString('hex')

  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  })

  const googleUrl = googleAuthService.getGoogleAuthUrl(state)
  res.redirect(googleUrl)
})

/**
 * @desc    Google OAuth Callback Handler
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
export const googleAuthCallback = asyncHandler(async (req, res) => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
  const { code, state, error } = req.query
  const storedState = req.cookies.oauth_state

  res.clearCookie('oauth_state')

  if (error) {
    console.warn('⚠️ Google Auth User Cancelled/Error:', error)
    return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Google authentication was cancelled or failed.')}`)
  }

  if (!code || !state || !storedState || state !== storedState) {
    console.error('❌ OAuth CSRF State Mismatch or Missing Code')
    return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Invalid OAuth state session. Please try again.')}`)
  }

  try {
    const googleUser = await googleAuthService.getGoogleUserFromCode(code)

    if (!googleUser.email) {
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Google account did not return a valid email address.')}`)
    }

    if (!googleUser.emailVerified) {
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Unverified Google email accounts are not permitted.')}`)
    }

    const email = googleUser.email.toLowerCase().trim()

    // 1. Search by googleId first
    let user = await User.findOne({ googleId: googleUser.googleId })

    // 2. Search by email if not found by googleId
    if (!user) {
      user = await User.findOne({ email })
      if (user) {
        // Link Google account to existing user
        user.googleId = googleUser.googleId
        if (googleUser.avatar && !user.avatar) {
          user.avatar = googleUser.avatar
        }
        await user.save()
      } else {
        // Create new user (Role defaults to 'customer' - NEVER admin)
        user = await User.create({
          name: googleUser.name,
          email: email,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          role: 'customer'
        })
      }
    }

    if (user.isBlocked) {
      return res.redirect(`${clientUrl}/auth?error=${encodeURIComponent('Your account has been suspended. Please contact support.')}`)
    }

    // Generate JWT access token & refresh token
    const accessToken = authService.generateToken(user._id)
    const refreshToken = authService.generateRefreshToken(user._id)

    setRefreshTokenCookie(res, refreshToken)

    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    }

    res.redirect(`${clientUrl}/auth?token=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify(userPayload))}`)
  } catch (err) {
    console.error('❌ Google Auth Callback Exception:', err.message)
    res.redirect(`${clientUrl}/auth?error=${encodeURIComponent(err.message || 'Google authentication failed.')}`)
  }
})

