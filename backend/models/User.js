import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  addresses: [{
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1
    },
    size: String,
    color: String
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // OTP Password Reset Fields
  otpCode: { type: String },
  otpExpires: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  isBlocked: {
    type: Boolean,
    default: false
  },
  totalSpending: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  activity: [{
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],
  designFiles: [{
    url: String,
    name: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)
