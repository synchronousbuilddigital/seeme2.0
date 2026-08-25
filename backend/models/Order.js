import mongoose from 'mongoose'

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
    image: String
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
    expectedDeliveryAt: Date
  }
}, {
  timestamps: true
})

// Generate order number
orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments()
    this.orderNumber = `SM${Date.now()}${count + 1}`
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

