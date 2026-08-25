import express from 'express'
import * as orderController from '../controllers/orderController.js'
import * as refundController from '../controllers/refundController.js'
import { protect, admin } from '../middleware/auth.js'

import { orderValidationRules, validate } from '../middleware/validator.js'

const router = express.Router()

// Create order (protected — authenticated customers can place orders)
router.post('/', protect, orderValidationRules(), validate, orderController.createOrder)

// Get all orders (admin only)
router.get('/', protect, admin, orderController.getOrders)
 
// Get user orders
router.get('/myorders', protect, orderController.getMyOrders)

// Razorpay & Webhook routes
router.post('/create-razorpay-order', protect, orderController.createRazorpayOrder)
router.post('/verify-payment', protect, orderController.verifyPayment)
router.post('/razorpay-webhook', refundController.handleRazorpayWebhook)

// Refund routes (Customer)
router.post('/:orderId/refund-request', protect, refundController.requestRefund)
router.get('/:orderId/refund', protect, refundController.getRefundByOrder)

// Cancel order (user or admin)
router.put('/:id/cancel', protect, orderController.cancelMyOrder)

// Update order status (admin only)
router.put('/:id/status', protect, admin, orderController.updateOrderStatus)

// COD Approval/Rejection routes for Offline Store orders (admin only)
router.put('/:id/approve-cod', protect, admin, orderController.approveCodOrder)
router.put('/:id/reject-cod', protect, admin, orderController.rejectCodOrder)

// Get single order (private — owner or admin)
router.get('/:id', protect, orderController.getOrder)

export default router

