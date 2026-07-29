import mongoose from 'mongoose'

const magazineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Craftsmanship'
  },
  author: {
    type: String,
    default: 'SEEMEE Atelier'
  },
  quote: {
    type: String,
    default: ''
  },
  readTime: {
    type: String,
    default: '5 MIN READ'
  },
  date: {
    type: String,
    default: ''
  },
  chapter: {
    type: String,
    default: 'CHAPTER 01'
  },
  sections: [String],
  highlights: [String],
  marginalia: {
    type: String,
    default: ''
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
