import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['anarkali', 'palazzo', 'straight-cut', 'sharara']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    type: String  // Cloudinary URLs
  }],
  video: {
    type: String  // Cloudinary URL
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sizeStock: [{
    size: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  }],
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  }],
  colors: [{
    type: String
  }],
  featured: {
    type: Boolean,
    default: false
  },
  inCollection: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Auto-calculate total stock from sizeStock
productSchema.pre('save', function(next) {
  if (this.sizeStock && this.sizeStock.length > 0) {
    this.stock = this.sizeStock.reduce((total, item) => total + item.quantity, 0)
    this.sizes = this.sizeStock.map(item => item.size)
  }
  next()
})

// Also handle updates
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate()
  if (update.sizeStock && update.sizeStock.length > 0) {
    update.stock = update.sizeStock.reduce((total, item) => total + item.quantity, 0)
    update.sizes = update.sizeStock.map(item => item.size)
  }
  next()
})

export default mongoose.model('Product', productSchema)
