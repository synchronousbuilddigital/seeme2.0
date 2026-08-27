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
  shortDescription: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  gender: {
    type: mongoose.Schema.Types.Mixed,
    default: ['women']
  },
  targetAudience: {
    type: mongoose.Schema.Types.Mixed,
    default: ['women']
  },
  subcategory: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    trim: true
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
  sizes: [{
    type: String
  }],
  sizeStock: [{
    size: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', 'Custom'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
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
  // Physical Dimensions & Shipping Specs (Ad2Ship)
  dimensions: {
    length: { type: Number, default: 20 },
    width: { type: Number, default: 15 },
    height: { type: Number, default: 5 }
  },
  weightKg: {
    type: Number,
    default: 0.5
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
  tags: [{
    type: String,
    trim: true
  }],
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
  inCollection: {
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
  }
}, {
  timestamps: true
})

// Auto-calculate total stock from sizeStock
productSchema.pre('save', function (next) {
  if (this.sizeStock && this.sizeStock.length > 0) {
    this.stock = this.sizeStock.reduce((total, item) => total + item.quantity, 0)
  }
  next()
})

// Also handle updates
productSchema.pre('findOneAndUpdate', function (next) {
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

// Add indexes for fast queries
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text', tags: 'text', category: 'text' })
productSchema.index({ isActive: 1, category: 1 })
productSchema.index({ isActive: 1, featured: 1 })
productSchema.index({ isActive: 1, inCollection: 1 })
productSchema.index({ isActive: 1, isNewArrival: 1 })
productSchema.index({ createdAt: -1 })

// Virtual getters for backwards compatibility with legacy dimension/weight property access
productSchema.virtual('dimensions.lengthCm').get(function () { return this.dimensions?.length })
productSchema.virtual('dimensions.widthCm').get(function () { return this.dimensions?.width })
productSchema.virtual('dimensions.heightCm').get(function () { return this.dimensions?.height })
productSchema.virtual('dimensions.breadth').get(function () { return this.dimensions?.width })

productSchema.virtual('lengthCm').get(function () { return this.dimensions?.length })
productSchema.virtual('widthCm').get(function () { return this.dimensions?.width })
productSchema.virtual('breadth').get(function () { return this.dimensions?.width })
productSchema.virtual('heightCm').get(function () { return this.dimensions?.height })
productSchema.virtual('weight').get(function () { return this.weightKg })

productSchema.set('toObject', { virtuals: true })
productSchema.set('toJSON', { virtuals: true })

export default mongoose.model('Product', productSchema)
