import mongoose from 'mongoose'

const restockSubscriptionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  size: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'notified'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notifiedAt: {
    type: Date
  }
}, {
  timestamps: true
})

restockSubscriptionSchema.index({ product: 1, email: 1, size: 1, status: 1 })

const RestockSubscription = mongoose.models.RestockSubscription || mongoose.model('RestockSubscription', restockSubscriptionSchema)

export default RestockSubscription
