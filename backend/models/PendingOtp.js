import mongoose from 'mongoose'

const pendingOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  otpCode: {
    type: String,
    required: true
  },
  otpExpires: {
    type: Date,
    required: true,
    expires: 600 // Auto-delete record 10 minutes (600 seconds) after creation
  },
  otpAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

export default mongoose.model('PendingOtp', pendingOtpSchema)
