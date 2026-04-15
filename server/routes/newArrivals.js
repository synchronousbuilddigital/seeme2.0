import express from 'express'
import NewArrival from '../models/NewArrival.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get all new arrivals (public)
router.get('/', async (req, res) => {
  try {
    const arrivals = await NewArrival.find({ isActive: true })
    res.json({ success: true, data: arrivals })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update new arrival (admin only)
router.put('/:category', protect, admin, async (req, res) => {
  try {
    const { category } = req.params
    const { image } = req.body

    let arrival = await NewArrival.findOne({ category })
    
    if (arrival) {
      arrival.image = image
      await arrival.save()
    } else {
      arrival = await NewArrival.create({ category, image })
    }

    res.json({ success: true, data: arrival })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
