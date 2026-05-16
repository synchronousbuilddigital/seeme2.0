import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  // SKU and Style Code
  sku: {
    type: String,
    unique: true,
    sparse: true,
    set: v => v === '' ? undefined : v
  },
  styleCode: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    default: 'SeeMee'
  },
  productType: {
    type: String,
    trim: true
  },
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Images
  images: [{
    type: String  // URLs or Cloudinary links
  }],
  video: {
    type: String
  },
  // Stock Management
  stock: {
    type: Number,
    default: 1,
    min: 0
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
      default: 1
    }
  }],
  // Product Attributes
  color: {
    type: String,
    trim: true
  },
  fabric: {
    type: String,
    trim: true
  },
  fit: {
    type: String,
    trim: true
  },
  occasion: {
    type: String,
    trim: true
  },
  design: {
    type: String,
    trim: true
  },
  sleeves: {
    type: String,
    trim: true
  },
  length: {
    type: String,
    trim: true
  },
  // Physical Dimensions
  dimensions: {
    lengthCm: Number,
    widthCm: Number,
    heightCm: Number
  },
  weight: {
    valueGrams: Number
  },
  // Material & Care
  material: {
    type: String,
    trim: true
  },
  careInstructions: {
    type: String,
    trim: true
  },
  // Additional Info
  forTarget: {
    type: String,
    trim: true
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Auto-calculate total stock from sizeStock
productSchema.pre('save', function(next) {
  if (this.sizeStock && this.sizeStock.length > 0) {
    this.stock = this.sizeStock.reduce((total, item) => total + item.quantity, 0)
  }
  next()
})

// Also handle updates
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate()
  
  // Handle both direct updates and $set updates
  const sizeStock = update.sizeStock || (update.$set && update.$set.sizeStock)
  
  if (sizeStock && Array.isArray(sizeStock)) {
    const totalStock = sizeStock.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
    const sizes = sizeStock.map(item => item.size)

    if (update.$set) {
      update.$set.stock = totalStock
      update.$set.sizes = sizes
    } else {
      update.stock = totalStock
      update.sizes = sizes
    }
  }
  next()
})

// Add text index for search
productSchema.index({ name: 'text', description: 'text' })

export default mongoose.model('Product', productSchema)
