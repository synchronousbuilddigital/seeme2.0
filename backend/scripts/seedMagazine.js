import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Magazine from '../models/Magazine.js'
import dns from 'dns'

// Set DNS servers to bypass local DNS resolution issues with MongoDB Atlas
dns.setServers(['1.1.1.1', '8.8.8.8'])

dotenv.config()

const seedMagazine = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4
    })
    console.log('✅ MongoDB Connected')

    // Clear existing magazine stories
    await Magazine.deleteMany({})
    console.log('🗑️  Cleared existing magazine stories')

    const stories = [
      {
        title: 'THE ART OF HAND-EMBROIDERY: REVIVING ZARDOSI',
        description: 'A deep dive into the painstaking process of Zardosi embroidery. Our master artisans spend hundreds of hours stitching gold and silver threads into luxurious velvet, creating heirlooms that carry the soul of Indian craftsmanship.',
        image: '/images/magazine/anarkali_editorial.png',
        order: 0,
        isActive: true
      },
      {
        title: 'WEAVING DREAMS: THE BANARASI LEGACY',
        description: 'From the looms of Varanasi to the modern wardrobe. Discover how we preserve the intricate patterns of traditional Banarasi silk while adapting them for the contemporary woman. A celebration of texture and heritage.',
        image: '/images/magazine/banarasi_weaving.png',
        order: 1,
        isActive: true
      },
      {
        title: 'THE MODERN ANARKALI: A TIMELESS EVOLUTION',
        description: 'Explore the evolution of the Anarkali silhouette. We step inside the SEEMEE design studio to see how we balance royal grandeur with modern ease, ensuring every piece feels as good as it looks.',
        image: '/images/magazine/artisan_craftsmanship.png',
        order: 2,
        isActive: true
      }
    ]

    await Magazine.insertMany(stories)
    console.log('✅ Successfully seeded magazine stories')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding magazine:', error)
    process.exit(1)
  }
}

seedMagazine()
