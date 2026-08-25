import mongoose from 'mongoose'

const heroCarouselSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  productName: {
    type: String,
    default: ''
  },
  productCategory: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for sorting by order is already created by unique: true
// heroCarouselSchema.index({ order: 1 })

export default mongoose.model('HeroCarousel', heroCarouselSchema)

