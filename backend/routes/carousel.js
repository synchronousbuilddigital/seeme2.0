import express from 'express'
import * as carouselController from '../controllers/carouselController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get active carousel images (public)
router.get('/', carouselController.getActiveCarousel)

// Get all carousel images (admin)
router.get('/all', protect, admin, carouselController.getAllCarousel)

// Create carousel image (admin)
router.post('/', protect, admin, carouselController.createCarousel)

// Update carousel image (admin)
router.put('/:id', protect, admin, carouselController.updateCarousel)

// Delete carousel image (admin)
router.delete('/:id', protect, admin, carouselController.deleteCarousel)

export default router
