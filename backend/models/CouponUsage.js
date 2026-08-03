import mongoose from 'mongoose'

const couponUsageSchema = new mongoose.Schema({
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
    index: true
  },
  user: {
    type: String, // User ID or Email
    required: true,
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  discountAmount: {
    type: Number,
    required: true,
    default: 0
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Fast compound lookup for per-user usage checks
couponUsageSchema.index({ coupon: 1, user: 1 })

export default mongoose.model('CouponUsage', couponUsageSchema)
