import mongoose from 'mongoose'

const refundSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  paymentId: {
    type: String,
    trim: true
  },
  gatewayRefundId: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    trim: true,
    default: 'Customer requested refund'
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'processing', 'refunded', 'rejected', 'failed'],
    default: 'requested'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNote: {
    type: String,
    trim: true
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexing for quick retrieval and duplicate protection
refundSchema.index({ order: 1 })
refundSchema.index({ status: 1 })

export default mongoose.model('Refund', refundSchema)
