import express from 'express'
import HeroCarousel from '../models/HeroCarousel.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get all active carousel images (public)
router.get('/', async (req, res) => {
  try {
    const carouselImages = await HeroCarousel.find({ isActive: true }).sort({ order: 1 })
    res.json({ success: true, data: carouselImages })
  } catch (error) {
    console.error('Error fetching carousel images:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get all carousel images (admin)
router.get('/all', protect, admin, async (req, res) => {
  try {
    const carouselImages = await HeroCarousel.find().sort({ order: 1 })
    res.json({ success: true, data: carouselImages })
  } catch (error) {
    console.error('Error fetching all carousel images:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Create carousel image (admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { image, title, subtitle, order } = req.body

    // Check if order already exists
    const existingOrder = await HeroCarousel.findOne({ order })
    if (existingOrder) {
      return res.status(400).json({ 
        success: false, 
        message: `Order ${order} already exists. Please use a different order number.` 
      })
    }

    const carouselImage = await HeroCarousel.create({
      image,
      title: title || '',
      subtitle: subtitle || '',
      order,
      isActive: true
    })

    res.status(201).json({ success: true, data: carouselImage })
  } catch (error) {
    console.error('Error creating carousel image:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Update carousel image (admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { image, title, subtitle, order, isActive } = req.body

    // If order is being changed, check if new order already exists
    if (order !== undefined) {
      const existingOrder = await HeroCarousel.findOne({ 
        order, 
        _id: { $ne: req.params.id } 
      })
      if (existingOrder) {
        return res.status(400).json({ 
          success: false, 
          message: `Order ${order} already exists. Please use a different order number.` 
        })
      }
    }

    const carouselImage = await HeroCarousel.findByIdAndUpdate(
      req.params.id,
      { image, title, subtitle, order, isActive },
      { new: true, runValidators: true }
    )

    if (!carouselImage) {
      return res.status(404).json({ success: false, message: 'Carousel image not found' })
    }

    res.json({ success: true, data: carouselImage })
  } catch (error) {
    console.error('Error updating carousel image:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Delete carousel image (admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const carouselImage = await HeroCarousel.findByIdAndDelete(req.params.id)

    if (!carouselImage) {
      return res.status(404).json({ success: false, message: 'Carousel image not found' })
    }

    res.json({ success: true, message: 'Carousel image deleted' })
  } catch (error) {
    console.error('Error deleting carousel image:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
