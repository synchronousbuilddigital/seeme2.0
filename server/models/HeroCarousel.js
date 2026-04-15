import mongoose from 'mongoose'

const heroCarouselSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
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
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for sorting by order
heroCarouselSchema.index({ order: 1 })

export default mongoose.model('HeroCarousel', heroCarouselSchema)
