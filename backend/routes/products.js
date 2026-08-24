import express from 'express'
import * as productController from '../controllers/productController.js'
import { protect, admin } from '../middleware/auth.js'
import { createProductReview, getProductReviews } from '../controllers/reviewController.js'

import { productValidationRules, validate } from '../middleware/validator.js'

const router = express.Router()

// Get all products (public)
router.get('/', productController.getProducts)

// Get top three products
router.get('/top-three', productController.getTopThreeProducts)

// Search products
router.get('/search', productController.searchProducts)

// Get collection count
router.get('/collection/count', productController.getCollectionCount)

// Get unique categories
router.get('/categories/all', productController.getCategories)

// Restock Notification Subscription
router.post('/:id/notify-restock', productController.requestRestockNotification)

// Get single product
router.get('/:id', productController.getProduct)

// Reviews
router.get('/:id/reviews', getProductReviews)
router.post('/:id/reviews', protect, createProductReview)



// Create product (admin only)
router.post('/', protect, admin, productValidationRules(), validate, productController.createProduct)

// Update product (admin only)
router.put('/:id', protect, admin, productValidationRules(), validate, productController.updateProduct)

// Delete product (admin only)
router.delete('/:id', protect, admin, productController.deleteProduct)

export default router

