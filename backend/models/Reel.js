import mongoose from 'mongoose'

const reelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  likesCount: {
    type: Number,
    default: 0
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

const Reel = mongoose.models.Reel || mongoose.model('Reel', reelSchema)
export default Reel
