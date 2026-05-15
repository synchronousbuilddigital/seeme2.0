import express from 'express'
import * as orderController from '../controllers/orderController.js'
import { protect, admin } from '../middleware/auth.js'

import { orderValidationRules, validate } from '../middleware/validator.js'

const router = express.Router()

// Create order (public — customers can place orders)
router.post('/', orderValidationRules(), validate, orderController.createOrder)

// Get all orders (admin only)
router.get('/', protect, admin, orderController.getOrders)
 
// Get user orders
router.get('/myorders', protect, orderController.getMyOrders)

// Get single order
router.get('/:id', orderController.getOrder)
 
// Razorpay routes
router.post('/create-razorpay-order', orderController.createRazorpayOrder)
router.post('/verify-payment', orderController.verifyPayment)

// Update order status (admin only)
router.put('/:id/status', protect, admin, orderController.updateOrderStatus)

export default router
