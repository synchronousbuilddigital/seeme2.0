import mongoose from 'mongoose'
import Counter from './Counter.js'

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    }
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: String,
    color: String,
    image: String,
    weightKg: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    default: 'ONLINE',
    set: v => (v ? String(v).toUpperCase().trim() : 'ONLINE')
  },
  status: {
    type: String,
    enum: [
      'pending', 'pending_approval', 'confirmed', 'processing', 'printing', 'packaging', 'shipped', 'delivered', 'cancelled', 'refunded'
    ],
    default: 'pending',
    set: v => (v ? String(v).toLowerCase().trim() : 'pending')
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cod'],
    default: 'online',
    set: v => (v ? String(v).toLowerCase().trim() : 'online')
  },
  paymentStatus: {
    type: String,
    enum: [
      'pending', 'pending_approval', 'paid', 'failed', 'refunded', 'rejected'
    ],
    default: 'pending',
    set: v => (v ? String(v).toLowerCase().trim() : 'pending')
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  couponCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  designFiles: [String],
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  internalNotes: String,
  customerNotes: String,
  billingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentDetails: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  refundStatus: {
    type: String,
    enum: [
      'not_refunded',
      'refund_requested',
      'refund_approved',
      'refund_processing',
      'partially_refunded',
      'refunded',
      'refund_rejected',
      'refund_failed'
    ],
    default: 'not_refunded'
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  shipping: {
    provider: { type: String, default: 'ad2ship' },
    ad2shipOrderId: Number,
    courierPartnerId: Number,
    courierName: String,
    courierKeyword: String,
    awbNumber: String,
    routeCode: String,
    status: String,
    shippingCharges: { type: Number, default: 0 },
    codCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    totalCharges: { type: Number, default: 0 },
    labelUrl: String,
    invoiceUrl: String,
    manifestGenerated: { type: Boolean, default: false },
    shippedAt: Date,
    pickupAt: Date,
    expectedDeliveryAt: Date,
    lastSyncedAt: Date
  }
}, {
  timestamps: true
})

// Generate clean, human-readable, non-random sequential order number (e.g. SM-26-1085)
orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    try {
      const year = new Date().getFullYear().toString().slice(-2) // "26"
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'orderNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )

      let seqNum = counter.seq
      if (seqNum < 1001) {
        const total = await mongoose.model('Order').countDocuments()
        seqNum = Math.max(1001, total + 1000)
        await Counter.findByIdAndUpdate({ _id: 'orderNumber' }, { seq: seqNum })
      }

      this.orderNumber = `SM-${year}-${seqNum}`
    } catch (err) {
      // Fallback: compact readable date + 4-digit code (SM-2611-4821)
      const year = new Date().getFullYear().toString().slice(-2)
      const month = String(new Date().getMonth() + 1).padStart(2, '0')
      const fallbackSuffix = Math.floor(1000 + Math.random() * 9000)
      this.orderNumber = `SM-${year}${month}-${fallbackSuffix}`
    }
  }
})

// Add indexes for fast queries
orderSchema.index({ 'customer.email': 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ orderType: 1 })
orderSchema.index({ paymentStatus: 1 })
orderSchema.index({ refundStatus: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ 'shipping.ad2shipOrderId': 1 })
orderSchema.index({ 'shipping.awbNumber': 1 })

export default mongoose.model('Order', orderSchema)

