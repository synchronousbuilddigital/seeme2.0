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
    enum: ['pending', 'confirmed', 'processing', 'printing', 'packaging', 'shipped', 'delivered', 'cancelled', 'refunded'],
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
// Add indexes for fast queries
orderSchema.index({ 'customer.email': 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })

export default mongoose.model('Order', orderSchema)
