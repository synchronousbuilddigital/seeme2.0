import mongoose from 'mongoose'
import dotenv from 'dotenv'
import NewArrival from '../models/NewArrival.js'

dotenv.config()

const seedImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB Connected')

    // Clear existing new arrivals
    await NewArrival.deleteMany({})
    console.log('🗑️  Cleared existing new arrivals')

    // Add current images to database
    const arrivals = [
      {
        category: 'anarkali',
        image: '/images/ANARKALI.png',
        isActive: true
      },
      {
        category: 'palazzo',
        image: '/images/Plazzo_suit.jpg',
        isActive: true
      },
      {
        category: 'straight-cut',
        image: '/images/Straightcut.jpg',
        isActive: true
      }
    ]

    await NewArrival.insertMany(arrivals)
    console.log('✅ Successfully added current images to database:')
    console.log('   - Anarkali: ANARKALI.png')
    console.log('   - Palazzo: Plazzo_suit.jpg')
    console.log('   - Straight Cut: Straightcut.jpg')
    
    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Go to http://localhost:3000/admin/login')
    console.log('2. Login with: admin@seemee.com / admin123')
    console.log('3. Navigate to "New Arrivals" tab to see your images')
    console.log('4. Upload new images to replace them')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedImages()
