import express from 'express'
import * as shippingController from '../controllers/shippingController.js'
import { protect, admin, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

// Rate calculation (Public — used during checkout)
router.post('/rate', shippingController.calculateRate)

// Order creation in Ad2Ship (Admin)
router.post('/create', protect, admin, shippingController.createOrder)

// Courier dispatch & AWB generation (Admin)
router.post('/ship', protect, admin, shippingController.shipOrder)

// Documents generation (Admin for manifest/label; optionalAuth for invoice)
router.post('/manifest', protect, admin, shippingController.generateManifest)
router.post('/label', protect, admin, shippingController.generateLabel)
router.post('/invoice', optionalAuth, shippingController.generateInvoice)

// Tracking (Public for customer tracking, Admin for ID tracking)
router.post('/track', shippingController.trackOrder)
router.post('/track-by-id', protect, admin, shippingController.trackOrderById)

// Cancellation (Protected)
router.post('/cancel', protect, shippingController.cancelOrder)

export default router
