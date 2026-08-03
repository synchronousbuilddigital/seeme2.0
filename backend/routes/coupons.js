import express from 'express'
import { applyCoupon, removeCoupon, getAvailableCoupons } from '../controllers/couponController.js'

const router = express.Router()

router.get('/available', getAvailableCoupons)
router.post('/apply', applyCoupon)
router.post('/remove', removeCoupon)

export default router
