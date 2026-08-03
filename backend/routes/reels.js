import express from 'express'
import * as reelsController from '../controllers/reelsController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get active reels (public)
router.get('/', reelsController.getActiveReels)

// Get all reels (admin)
router.get('/all', protect, admin, reelsController.getAllReels)

// Create reel (admin)
router.post('/', protect, admin, reelsController.createReel)

// Update reel (admin)
router.put('/:id', protect, admin, reelsController.updateReel)

// Delete reel (admin)
router.delete('/:id', protect, admin, reelsController.deleteReel)

// Like reel (public)
router.post('/:id/like', reelsController.likeReel)

export default router
