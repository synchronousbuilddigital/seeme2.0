import mongoose from 'mongoose'

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tagline: {
    type: String,
    default: '',
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  bgImage: {
    type: String,
    default: ''
  },
  bgColor: {
    type: String,
    default: '#D1F2EE'
  },
  targetAudience: {
    type: mongoose.Schema.Types.Mixed,
    default: ['men']
  },
  buttonText: {
    type: String,
    default: 'Products ↗'
  },
  link: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export default mongoose.model('Brand', brandSchema)
