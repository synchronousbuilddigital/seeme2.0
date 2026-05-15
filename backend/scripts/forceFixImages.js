import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns'

// Force DNS to avoid resolution issues
dns.setServers(['1.1.1.1', '8.8.8.8'])

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

import Product from '../models/Product.js'
import HeroCarousel from '../models/HeroCarousel.js'

const FALLBACK_IMAGES = {
  anarkali: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=1200',
  palazzo: 'https://images.unsplash.com/photo-1610173826014-9336df76906a?auto=format&fit=crop&q=80&w=1200',
  'straight-cut': 'https://images.unsplash.com/photo-1589156206699-bc21e38c8a7d?auto=format&fit=crop&q=80&w=1200',
  sharara: 'https://images.unsplash.com/photo-1617627143750-d86bc21e44bb?auto=format&fit=crop&q=80&w=1200',
  default: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1200'
}

const isPlaceholder = (url) => {
  if (!url) return true
  return url.includes('placeholder') || 
         url.includes('via.placeholder.com') || 
         url.match(/^\d+x\d+/) ||
         url.includes('?text=')
}

const fixDatabaseImages = async () => {
  try {
    console.log('🔄 Force-fixing broken placeholders in database...')
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    console.log('✅ Connected to MongoDB\n')

    // 1. Fix Hero Carousel
    const carousels = await HeroCarousel.find({})
    console.log(`Checking ${carousels.length} carousel slides...`)
    let carouselFixed = 0
    for (const slide of carousels) {
      if (isPlaceholder(slide.image)) {
        const category = (slide.title || slide.productCategory || 'default').toLowerCase()
        slide.image = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default
        await slide.save()
        carouselFixed++
        console.log(`  ✅ Fixed slide order ${slide.order} (${category})`)
      }
    }
    console.log(`✅ Fixed ${carouselFixed} carousel slides\n`)

    // 2. Fix Product Images
    const products = await Product.find({})
    console.log(`Checking ${products.length} products...`)
    let productFixed = 0
    for (const product of products) {
      let modified = false
      const newImages = product.images.map(img => {
        if (isPlaceholder(img)) {
          modified = true
          return FALLBACK_IMAGES[product.category?.toLowerCase()] || FALLBACK_IMAGES.default
        }
        return img
      })

      if (modified) {
        product.images = newImages
        await product.save()
        productFixed++
        console.log(`  ✅ Fixed product: ${product.name}`)
      }
    }
    console.log(`✅ Fixed ${productFixed} products\n`)

    console.log('✨ Database cleanup complete!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

fixDatabaseImages()
