import express from 'express'
import * as userController from '../controllers/userController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect) // All user routes require authentication

router.put('/profile', userController.updateProfile)

router.get('/addresses', userController.getAddresses)
router.post('/addresses', userController.addAddress)
router.put('/addresses/:id', userController.updateAddress)
router.delete('/addresses/:id', userController.deleteAddress)

// Wishlist
router.get('/wishlist', userController.getWishlist)
router.post('/wishlist/toggle', userController.toggleWishlist)

// Cart
router.get('/cart', userController.getCart)
router.post('/cart/sync', userController.syncCart)

export default router
