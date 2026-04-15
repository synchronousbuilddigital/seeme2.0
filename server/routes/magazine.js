import express from 'express'
import Magazine from '../models/Magazine.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get all active magazine items (public)
router.get('/', async (req, res) => {
  try {
    const magazines = await Magazine.find({ isActive: true }).sort({ order: 1 })
    res.json({ success: true, data: magazines })
  } catch (error) {
    console.error('Error fetching magazines:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get all magazine items (admin)
router.get('/all', protect, admin, async (req, res) => {
  try {
    const magazines = await Magazine.find().sort({ order: 1 })
    res.json({ success: true, data: magazines })
  } catch (error) {
    console.error('Error fetching all magazines:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create magazine item (admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, image, order } = req.body

    // Get the highest order number and add 1
    const highestOrder = await Magazine.findOne().sort({ order: -1 })
    const newOrder = order !== undefined ? order : (highestOrder ? highestOrder.order + 1 : 0)

    const magazine = await Magazine.create({
      title,
      description,
      image,
      order: newOrder,
      isActive: true
    })

    res.status(201).json({ success: true, data: magazine })
  } catch (error) {
    console.error('Error creating magazine:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Update magazine item (admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, description, image, order, isActive } = req.body

    const magazine = await Magazine.findByIdAndUpdate(
      req.params.id,
      { title, description, image, order, isActive },
      { new: true, runValidators: true }
    )

    if (!magazine) {
      return res.status(404).json({ success: false, message: 'Magazine item not found' })
    }

    res.json({ success: true, data: magazine })
  } catch (error) {
    console.error('Error updating magazine:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Delete magazine item (admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const magazine = await Magazine.findByIdAndDelete(req.params.id)

    if (!magazine) {
      return res.status(404).json({ success: false, message: 'Magazine item not found' })
    }

    res.json({ success: true, message: 'Magazine item deleted' })
  } catch (error) {
    console.error('Error deleting magazine:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
