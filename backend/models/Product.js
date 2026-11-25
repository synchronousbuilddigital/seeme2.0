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
    default: ['all']
  },
  targetAudience: {
    type: mongoose.Schema.Types.Mixed,
    default: ['all']
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
  colorImages: [{
    color: {
      type: String,
      trim: true
    },
    hex: {
      type: String,
      trim: true
    },
    images: [{
      type: String
    }],
    sizeStock: [{
      size: {
        type: String,
        trim: true
      },
      quantity: {
        type: Number,
        min: 0,
        default: 0
      }
    }]
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
      required: true,
      trim: true
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
  colors: [{
    type: String,
    trim: true
  }],
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
  isSale: {
    type: Boolean,
    default: false
  },
  onSale: {
    type: Boolean,
    default: false
  },
  isTryTheLook: {
    type: Boolean,
    default: false
  },
  tryTheLook: {
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
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Auto-calculate total stock and sizes array from sizeStock and colorImages, and sync color/colors
productSchema.pre('save', function (next) {
  // Aggregate all unique sizes across sizeStock and colorImages
  const sizeSet = new Set()
  if (Array.isArray(this.sizes)) {
    this.sizes.forEach(s => s && sizeSet.add(String(s).trim()))
  }
  if (Array.isArray(this.sizeStock) && this.sizeStock.length > 0) {
    this.sizeStock.forEach(item => item.size && sizeSet.add(String(item.size).trim()))
  }

  // Check color-specific size stock
  let colorStockTotal = 0
  let hasColorSizeStock = false
  if (Array.isArray(this.colorImages) && this.colorImages.length > 0) {
    if (!this.colors) this.colors = []
    this.colorImages.forEach(ci => {
      if (ci && ci.color && ci.color.trim()) {
        const cTrim = ci.color.trim()
        if (!this.colors.some(existing => existing.toLowerCase() === cTrim.toLowerCase())) {
          this.colors.push(cTrim)
        }
      }
      if (ci && Array.isArray(ci.sizeStock) && ci.sizeStock.length > 0) {
        hasColorSizeStock = true
        ci.sizeStock.forEach(s => {
          if (s && s.size) sizeSet.add(String(s.size).trim())
          colorStockTotal += Math.max(0, Number(s.quantity) || 0)
        })
      }
    })
  }

  if (hasColorSizeStock && colorStockTotal > 0) {
    this.stock = colorStockTotal
  } else if (this.sizeStock && this.sizeStock.length > 0) {
    this.stock = this.sizeStock.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
  }

  if (sizeSet.size > 0) {
    this.sizes = Array.from(sizeSet)
  }

  if (this.color) {
    const cTrim = String(this.color).trim()
    this.color = cTrim
    if (!Array.isArray(this.colors)) this.colors = []
    const rest = this.colors.filter(c => c && c.toLowerCase() !== cTrim.toLowerCase())
    this.colors = [cTrim, ...rest]
  } else if (Array.isArray(this.colors) && this.colors.length > 0) {
    this.color = this.colors[0]
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

  // Sync color & colors on update reliably
  const hasExplicitColors = Array.isArray(update.colors) || (update.$set && Array.isArray(update.$set.colors))
  const rawColors = update.colors || (update.$set && update.$set.colors)
  const rawColor = update.color || (update.$set && update.$set.color)
  const rawColorImages = update.colorImages || (update.$set && update.$set.colorImages)

  if (hasExplicitColors) {
    const cleanColors = (rawColors || []).map(c => String(c || '').trim()).filter(Boolean)
    const primaryColor = (rawColor ? String(rawColor).trim() : cleanColors[0]) || ''
    const finalColors = []
    if (primaryColor) finalColors.push(primaryColor)
    cleanColors.forEach(c => {
      if (!finalColors.some(fc => fc.toLowerCase() === c.toLowerCase())) {
        finalColors.push(c)
      }
    })

    if (update.$set) {
      update.$set.colors = finalColors
      if (primaryColor) update.$set.color = primaryColor
    } else {
      update.colors = finalColors
      if (primaryColor) update.color = primaryColor
    }
  } else if (rawColor) {
    const cTrim = String(rawColor).trim()
    if (update.$set) {
      update.$set.color = cTrim
      if (!update.$set.colors) update.$set.colors = [cTrim]
    } else {
      update.color = cTrim
      if (!update.colors) update.colors = [cTrim]
    }
  } else if (Array.isArray(rawColorImages) && rawColorImages.length > 0) {
    const extractedColors = []
    rawColorImages.forEach(ci => {
      if (ci && ci.color && ci.color.trim()) {
        const ct = ci.color.trim()
        if (!extractedColors.some(e => e.toLowerCase() === ct.toLowerCase())) {
          extractedColors.push(ct)
        }
      }
    })
    if (extractedColors.length > 0) {
      if (update.$set) {
        update.$set.colors = extractedColors
        update.$set.color = extractedColors[0]
      } else {
        update.colors = extractedColors
        update.color = extractedColors[0]
      }
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
productSchema.index({ isActive: 1, isTryTheLook: 1 })
productSchema.index({ isActive: 1, tryTheLook: 1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ styleCode: 1 })

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
