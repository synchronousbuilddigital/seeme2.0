import express from 'express'
import { applyCoupon, removeCoupon, getAvailableCoupons } from '../controllers/couponController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/available', optionalAuth, getAvailableCoupons)
router.post('/apply', optionalAuth, applyCoupon)
router.post('/remove', removeCoupon)

export default router

