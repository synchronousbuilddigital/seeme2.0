import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Product from '../models/Product.js'
import dns from 'dns'

dns.setServers(['1.1.1.1', '8.8.8.8'])
dotenv.config()

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    console.log('✅ MongoDB Connected')

    await Product.deleteMany({})
    console.log('🗑️  Cleared existing products')

    const products = [
      {
        name: 'Royal Midnight Anarkali',
        description: 'A masterpiece of deep navy velvet adorned with intricate silver Zardosi embroidery. This floor-length silhouette features a regal flare and comes with a sheer georgette dupatta.',
        category: 'anarkali',
        price: 18500,
        images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800'],
        featured: true,
        inCollection: true,
        sizeStock: [
          { size: 'S', quantity: 5 },
          { size: 'M', quantity: 8 },
          { size: 'L', quantity: 4 }
        ]
      },
      {
        name: 'Pastel Blush Palazzo Set',
        description: 'Effortless elegance in breathable handloom cotton. This set pairs a delicate floral kurta with wide-leg palazzos, perfect for high-tea or summer soirées.',
        category: 'palazzo',
        price: 7200,
        images: ['https://images.unsplash.com/photo-1610173826014-9336df76906a?auto=format&fit=crop&q=80&w=800'],
        featured: true,
        inCollection: true,
        sizeStock: [
          { size: 'M', quantity: 10 },
          { size: 'L', quantity: 12 },
          { size: 'XL', quantity: 5 }
        ]
      },
      {
        name: 'Emerald Silk Straight Cut',
        description: 'Sophistication redefined. This pure silk straight-cut suit features a minimal gold border and a tailored fit that transitions perfectly from office to evening events.',
        category: 'straight-cut',
        price: 12400,
        images: ['https://images.unsplash.com/photo-1589156206699-bc21e38c8a7d?auto=format&fit=crop&q=80&w=800'],
        featured: true,
        inCollection: true,
        sizeStock: [
          { size: 'S', quantity: 3 },
          { size: 'M', quantity: 6 },
          { size: 'L', quantity: 8 }
        ]
      },
      {
        name: 'Golden Saffron Sharara',
        description: 'Celebrate in style with this vibrant saffron sharara. The heavily embellished flares and short kurta create a dynamic silhouette for festive celebrations.',
        category: 'sharara',
        price: 21000,
        images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e44bb?auto=format&fit=crop&q=80&w=800'],
        featured: true,
        inCollection: true,
        sizeStock: [
          { size: 'S', quantity: 2 },
          { size: 'M', quantity: 5 },
          { size: 'L', quantity: 3 }
        ]
      }
    ]

    await Product.insertMany(products)
    console.log('✅ Successfully seeded premium products')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding products:', error)
    process.exit(1)
  }
}

seedProducts()
