import express from 'express'
import Product from '../models/Product.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, featured, inCollection } = req.query
    const filter = { isActive: true }
    
    if (category) filter.category = category
    if (featured) filter.featured = true
    if (inCollection) filter.inCollection = true

    console.log('Fetching products with filter:', filter) // Debug log

    const products = await Product.find(filter).sort({ createdAt: -1 })
    
    console.log(`Found ${products.length} products`) // Debug log
    
    res.json({ success: true, data: products })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get collection count
router.get('/collection/count', async (req, res) => {
  try {
    const count = await Product.countDocuments({ inCollection: true, isActive: true })
    res.json({ success: true, count })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    res.json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create product (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    console.log('Creating product with data:', req.body) // Debug log
    
    // Check collection limit if inCollection is true
    if (req.body.inCollection) {
      const collectionCount = await Product.countDocuments({ inCollection: true, isActive: true })
      if (collectionCount >= 15) {
        return res.status(400).json({ 
          success: false, 
          message: 'Collection is full. Maximum 15 products allowed in collection. Please add as regular product instead.' 
        })
      }
    }
    
    const product = await Product.create(req.body)
    console.log('Product created:', product) // Debug log
    
    res.status(201).json({ success: true, data: product })
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update product (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    console.log('Updating product:', req.params.id, 'with data:', req.body) // Debug log
    
    const existingProduct = await Product.findById(req.params.id)
    
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    
    // Check collection limit if trying to add to collection
    if (req.body.inCollection && !existingProduct.inCollection) {
      const collectionCount = await Product.countDocuments({ inCollection: true, isActive: true })
      if (collectionCount >= 15) {
        return res.status(400).json({ 
          success: false, 
          message: 'Collection is full. Maximum 15 products allowed in collection.' 
        })
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    console.log('Product updated:', product) // Debug log
    
    res.json({ success: true, data: product })
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete product (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    res.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
