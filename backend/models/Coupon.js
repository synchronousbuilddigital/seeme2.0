import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixedAmount', 'freeShipping', 'buyXgetY'],
    required: true,
    default: 'percentage'
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  fixedAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  minimumOrder: {
    type: Number,
    min: 0,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    min: 0,
    default: null
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true,
    index: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  applicableCategories: [{
    type: String,
    trim: true
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedCategories: [{
    type: String,
    trim: true
  }],
  firstOrderOnly: {
    type: Boolean,
    default: false
  },
  isStackable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    default: 'Admin'
  },
  buyXGetYConfig: {
    buyQuantity: { type: Number, default: 1 },
    getQuantity: { type: Number, default: 1 },
    getDiscountPercentage: { type: Number, default: 100 }
  }
}, {
  timestamps: true
})

// Index for fast query lookups
couponSchema.index({ code: 1, isActive: 1 })
couponSchema.index({ expiryDate: 1, isActive: 1 })

export default mongoose.model('Coupon', couponSchema)
