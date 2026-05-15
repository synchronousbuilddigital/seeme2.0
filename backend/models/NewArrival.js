import mongoose from 'mongoose'

const newArrivalSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['anarkali', 'palazzo', 'straight-cut'],
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
