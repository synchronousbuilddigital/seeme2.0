import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'NEW_ORDER',
      'PAYMENT_RECEIVED',
      'ORDER_CANCELLED',
      'REFUND_REQUESTED',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED'
    ],
    default: 'NEW_ORDER'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderNumber: {
    type: String
  },
  totalAmount: {
    type: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Composite index to enforce idempotency per recipient + order + type
notificationSchema.index({ recipient: 1, order: 1, type: 1 }, { unique: true, sparse: true })
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, isRead: 1 })

export default mongoose.model('Notification', notificationSchema)
