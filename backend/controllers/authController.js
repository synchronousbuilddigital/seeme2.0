import crypto from 'crypto'
import * as authService from '../services/authService.js'
import * as googleAuthService from '../services/googleAuthService.js'
import User from '../models/User.js'
import asyncHandler from '../utils/asyncHandler.js'
import PendingOtp from '../models/PendingOtp.js'
import { sendOtpEmail, sendSignupOtpEmail } from '../services/emailService.js'

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

/**
 * @desc    Send 6-digit OTP for Account Signup Verification
 * @route   POST /api/auth/send-signup-otp
 * @access  Public
 */
export const sendSignupOtp = asyncHandler(async (req, res) => {
  const { email, name } = req.body

  if (!email || !email.trim()) {
    res.status(400)
    throw new Error('Email address is required.')
  }

  const cleanEmail = email.toLowerCase().trim()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(cleanEmail)) {
    res.status(400)
    throw new Error('Please enter a valid email address (e.g., user@example.com).')
  }

  // 1. Check if an account already exists with this email
  const existingUser = await User.findOne({ email: cleanEmail })
  if (existingUser) {
    res.status(400)
    throw new Error('An account with this email address already exists. Please sign in instead.')
  }

  // 2. Generate secure 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // 3. Upsert pending OTP in database (valid for 10 minutes)
  await PendingOtp.deleteMany({ email: cleanEmail })
  await PendingOtp.create({
    email: cleanEmail,
    name: name ? name.trim() : 'Valued Customer',
    otpCode: otp,
    otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    otpAttempts: 0
  })

  console.log(`🔑 [SIGNUP OTP SENT] Verification code sent to: ${cleanEmail}`)

  // 4. Send email
  await sendSignupOtpEmail(cleanEmail, name, otp)

  res.json({
    success: true,
    message: `Verification OTP has been sent to ${cleanEmail}. Please enter the 6-digit code to complete registration.`
  })
})

export const register = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  if (!otp || !otp.trim()) {
    res.status(400)
    throw new Error('Email Verification OTP code is required.')
  }

  const cleanEmail = String(email || '').toLowerCase().trim()

  // Check pending OTP in database
  const pendingRecord = await PendingOtp.findOne({ email: cleanEmail })
  if (!pendingRecord || !pendingRecord.otpCode || !pendingRecord.otpExpires) {
    res.status(400)
    throw new Error('No active OTP request found for this email. Please request a new verification code.')
  }

  // Check expiration
  if (new Date(pendingRecord.otpExpires).getTime() < Date.now()) {
    await PendingOtp.deleteMany({ email: cleanEmail })
    res.status(400)
    throw new Error('Verification OTP has expired. Please request a new verification code.')
  }

  // Check OTP attempts limit (max 5)
  if ((pendingRecord.otpAttempts || 0) >= 5) {
    await PendingOtp.deleteMany({ email: cleanEmail })
    res.status(400)
    throw new Error('Too many failed OTP verification attempts. Please request a new verification code.')
  }

  // Verify OTP match
  if (String(pendingRecord.otpCode).trim() !== String(otp).trim()) {
    pendingRecord.otpAttempts = (pendingRecord.otpAttempts || 0) + 1
    await pendingRecord.save()
    const remaining = 5 - pendingRecord.otpAttempts
    res.status(400)
    throw new Error(`Invalid OTP verification code. ${remaining} attempt(s) remaining.`)
  }

  // OTP verified! Create user account
  const user = await authService.registerUser(req.body)

  // Clear pending OTP record
  await PendingOtp.deleteMany({ email: cleanEmail })

  const accessToken = authService.generateToken(user._id)
  const refreshToken = authService.generateRefreshToken(user._id)

  setRefreshTokenCookie(res, refreshToken)

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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

    // Update lastLogin timestamp
    user.lastLogin = new Date()
    await user.save()

    const accessToken = authService.generateToken(user._id)
    const refreshToken = authService.generateRefreshToken(user._id)

    setRefreshTokenCookie(res, refreshToken)

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
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

  // Store OTP and set expiration to 10 minutes from now
  user.otpCode = otp
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000) // Expiration set to 10 mins
  user.otpAttempts = 0

  await user.save()

  console.log(`🔑 [OTP SENT] Verification email dispatched to: ${user.email} | Expires in: 10 mins`)

  // Send OTP Email via Nodemailer Gmail Service
  await sendOtpEmail(user.email, user.name, otp)

  res.json({
    success: true,
    message: 'A 6-digit verification OTP has been sent to your email address (Valid for 10 minutes).'
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

  const MAX_OTP_ATTEMPTS = 5

  // Check if OTP is expired (10 minutes)
  if (new Date(user.otpExpires).getTime() < Date.now()) {
    user.otpCode = undefined
    user.otpExpires = undefined
    user.otpAttempts = 0
    await user.save()
    res.status(400)
    throw new Error('OTP has expired. Please request a new OTP code.')
  }

  // Check max failed attempts threshold
  if ((user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    user.otpCode = undefined
    user.otpExpires = undefined
    user.otpAttempts = 0
    await user.save()
    res.status(400)
    throw new Error('Too many failed OTP attempts. This OTP has been invalidated for security. Please request a new code.')
  }

  // Verify OTP match
  if (String(user.otpCode).trim() !== String(otp).trim()) {
    user.otpAttempts = (user.otpAttempts || 0) + 1
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpCode = undefined
      user.otpExpires = undefined
      user.otpAttempts = 0
      await user.save()
      res.status(400)
      throw new Error(`Too many failed OTP attempts (${MAX_OTP_ATTEMPTS}/${MAX_OTP_ATTEMPTS}). This OTP has been invalidated for security. Please request a new code.`)
    }
    await user.save()
    const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts
    res.status(400)
    throw new Error(`Invalid OTP code. ${remaining} attempt(s) remaining.`)
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

  const MAX_OTP_ATTEMPTS = 5

  if (new Date(user.otpExpires).getTime() < Date.now()) {
    user.otpCode = undefined
    user.otpExpires = undefined
    user.otpAttempts = 0
    await user.save()
    res.status(400)
    throw new Error('OTP has expired. Please request a new code.')
  }

  if ((user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    user.otpCode = undefined
    user.otpExpires = undefined
    user.otpAttempts = 0
    await user.save()
    res.status(400)
    throw new Error('Too many failed OTP attempts. This OTP has been invalidated for security. Please request a new code.')
  }

  if (String(user.otpCode).trim() !== String(otp).trim()) {
    user.otpAttempts = (user.otpAttempts || 0) + 1
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpCode = undefined
      user.otpExpires = undefined
      user.otpAttempts = 0
      await user.save()
      res.status(400)
      throw new Error(`Too many failed OTP attempts (${MAX_OTP_ATTEMPTS}/${MAX_OTP_ATTEMPTS}). This OTP has been invalidated for security. Please request a new code.`)
    }
    await user.save()
    const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts
    res.status(400)
    throw new Error(`Invalid OTP code. ${remaining} attempt(s) remaining.`)
  }

  // Update password (pre-save hook in User model will hash it with bcrypt)
  user.password = password

  // Clear OTP fields upon successful reset
  user.otpCode = undefined
  user.otpExpires = undefined
  user.otpAttempts = 0

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

    user.lastLogin = new Date()
    await user.save()

    // Generate JWT access token & refresh token
    const accessToken = authService.generateToken(user._id)
    const refreshToken = authService.generateRefreshToken(user._id)

    setRefreshTokenCookie(res, refreshToken)

    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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

