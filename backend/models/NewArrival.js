import mongoose from 'mongoose'

const newArrivalSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['2-piece-sets', '3-piece-sets', 'co-ord-sets'],
    unique: true
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export default mongoose.model('NewArrival', newArrivalSchema)
