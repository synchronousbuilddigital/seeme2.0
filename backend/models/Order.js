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
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 'printing', 'packaging', 'shipped', 'delivered', 'cancelled', 'refunded',
      'Pending', 'Confirmed', 'Processing', 'Printing', 'Packaging', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'
    ],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
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
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments()
    this.orderNumber = `SM${Date.now()}${count + 1}`
  }
  next()
})

// Add indexes for fast queries
orderSchema.index({ 'customer.email': 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ 'shipping.ad2shipOrderId': 1 })
orderSchema.index({ 'shipping.awbNumber': 1 })

export default mongoose.model('Order', orderSchema)

