import express from 'express'
import * as magazineController from '../controllers/magazineController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get active magazine items (public)
router.get('/', magazineController.getActiveMagazines)

// Get all magazine items (admin)
router.get('/all', protect, admin, magazineController.getAllMagazines)

// Create magazine item (admin)
router.post('/', protect, admin, magazineController.createMagazine)

// Update magazine item (admin)
router.put('/:id', protect, admin, magazineController.updateMagazine)

// Delete magazine item (admin)
router.delete('/:id', protect, admin, magazineController.deleteMagazine)

export default router
