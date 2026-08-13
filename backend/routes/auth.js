import express from 'express'
import * as authController from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

import { registerValidationRules, loginValidationRules, validate } from '../middleware/validator.js'

const router = express.Router()

// Register
router.post('/register', registerValidationRules(), validate, authController.register)
router.post('/signup', registerValidationRules(), validate, authController.register) // Alias

// Login
router.post('/login', loginValidationRules(), validate, authController.login)

// Google OAuth
router.get('/google', authController.googleAuthStart)
router.get('/google/callback', authController.googleAuthCallback)

// Refresh Token
router.post('/refresh', authController.refresh)

// Logout
router.post('/logout', authController.logout)

// Get current user
router.get('/me', protect, authController.getMe)

// Password Reset (OTP Flow)
router.post('/forgot-password', authController.forgotPassword)
router.post('/verify-otp', authController.verifyOtp)
router.post('/reset-password', authController.resetPassword)

export default router
