import express from 'express'
import { getBrands, createBrand, updateBrand, deleteBrand } from '../controllers/brandController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
  .get(getBrands)
  .post(protect, admin, createBrand)

router.route('/:id')
  .put(protect, admin, updateBrand)
  .delete(protect, admin, deleteBrand)

export default router
