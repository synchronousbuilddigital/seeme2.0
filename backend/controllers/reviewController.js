import Review from '../models/Review.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body
  const product = await Product.findById(req.params.id)

  if (product) {
    const alreadyReviewed = await Review.findOne({ user: req.user._id, product: req.params.id })

    if (alreadyReviewed) {
      res.status(400)
      throw new Error('Product already reviewed')
    }

    const review = await Review.create({
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
      product: req.params.id
    })

    // Calculate average rating (simplified for now)
    const reviews = await Review.find({ product: req.params.id })
    const numReviews = reviews.length
    const ratingAvg = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews

    // Update product with new stats if needed (could add fields to Product model)
    
    res.status(201).json({ success: true, data: review })
  } else {
    res.status(404)
    throw new Error('Product not found')
  }
})

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 })
  res.json({ success: true, data: reviews })
})
