import mongoose from 'mongoose'

const magazineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for sorting by order
magazineSchema.index({ order: 1 })

export default mongoose.model('Magazine', magazineSchema)
