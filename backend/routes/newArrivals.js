import express from 'express'
import * as newArrivalController from '../controllers/newArrivalController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get active new arrivals (public)
router.get('/', newArrivalController.getNewArrivals)

// Update/create new arrival (admin)
router.put('/:category', protect, admin, newArrivalController.updateNewArrival)

export default router
