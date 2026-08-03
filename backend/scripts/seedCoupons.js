import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import Coupon from '../models/Coupon.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/seemee'

const demoCoupons = [
  {
    code: 'WELCOME10',
    description: '10% OFF on your first couture order above ₹2,000',
    discountType: 'percentage',
    percentage: 10,
    minimumOrder: 2000,
    maximumDiscount: 1000,
    freeShipping: false,
    firstOrderOnly: true,
    perUserLimit: 1,
    usageLimit: 500,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    isActive: true
  },
  {
    code: 'FREEDELIVERY',
    description: 'Complimentary Express White-Glove Shipping on orders over ₹1,500',
    discountType: 'freeShipping',
    freeShipping: true,
    minimumOrder: 1500,
    perUserLimit: 5,
    usageLimit: 1000,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'SAVE500',
    description: 'Flat ₹500 OFF on heritage orders above ₹3,000',
    discountType: 'fixedAmount',
    fixedAmount: 500,
    minimumOrder: 3000,
    perUserLimit: 2,
    usageLimit: 300,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'ROYAL15',
    description: '15% OFF Royal Couture drapes & sets above ₹5,000',
    discountType: 'percentage',
    percentage: 15,
    minimumOrder: 5000,
    maximumDiscount: 2500,
    freeShipping: true,
    perUserLimit: 3,
    usageLimit: 200,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true
  }
]

async function seedCoupons() {
  try {
    console.log('🔌 Connecting to MongoDB:', MONGO_URI)
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB')

    for (const c of demoCoupons) {
      await Coupon.findOneAndUpdate(
        { code: c.code },
        c,
        { upsert: true, new: true }
      )
      console.log(`✦ Seeded / Updated Coupon: ${c.code}`)
    }

    console.log('🎉 Coupon seeding completed successfully!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error seeding coupons:', err)
    process.exit(1)
  }
}

seedCoupons()
