import express from 'express'
import { protect, admin } from '../middleware/auth.js'
import {
  getAdminCoupons,
  getAdminCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  duplicateCoupon
} from '../controllers/adminCouponController.js'

const router = express.Router()

// Secure all admin coupon endpoints
router.use(protect)
router.use(admin)

router.route('/')
  .get(getAdminCoupons)
  .post(createCoupon)

router.route('/:id')
  .get(getAdminCouponById)
  .put(updateCoupon)
  .delete(deleteCoupon)

router.patch('/:id/status', toggleCouponStatus)
router.post('/:id/duplicate', duplicateCoupon)

export default router
