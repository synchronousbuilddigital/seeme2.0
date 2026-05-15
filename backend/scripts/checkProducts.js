import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Product from '../models/Product.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from server directory
dotenv.config({ path: join(__dirname, '../.env') })

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const products = await Product.find().limit(5)
    
    console.log(`\n📦 Found ${products.length} products\n`)
    
    products.forEach((product, index) => {
      console.log(`\n--- Product ${index + 1}: ${product.name} ---`)
      console.log(`ID: ${product._id}`)
      console.log(`Category: ${product.category}`)
      console.log(`Price: $${product.price}`)
      console.log(`Stock: ${product.stock}`)
      console.log(`In Collection: ${product.inCollection}`)
      console.log(`Active: ${product.isActive}`)
      
      console.log(`\nImages (${product.images?.length || 0}):`)
      if (product.images && product.images.length > 0) {
        product.images.forEach((img, idx) => {
          if (typeof img === 'string') {
            console.log(`  ${idx + 1}. String URL: ${img.substring(0, 50)}...`)
          } else if (img.data) {
            console.log(`  ${idx + 1}. Base64 Object:`)
            console.log(`     - Content Type: ${img.contentType}`)
            console.log(`     - Filename: ${img.filename}`)
            console.log(`     - Data Length: ${img.data?.length || 0} chars`)
          } else {
            console.log(`  ${idx + 1}. Unknown format:`, typeof img)
          }
        })
      } else {
        console.log('  No images')
      }
      
      if (product.video) {
        console.log(`\nVideo:`)
        if (typeof product.video === 'string') {
          console.log(`  String URL: ${product.video.substring(0, 50)}...`)
        } else if (product.video.data) {
          console.log(`  Base64 Object:`)
          console.log(`  - Content Type: ${product.video.contentType}`)
          console.log(`  - Filename: ${product.video.filename}`)
          console.log(`  - Data Length: ${product.video.data?.length || 0} chars`)
        }
      }
    })

    await mongoose.connection.close()
    console.log('\n✅ Done')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkProducts()
