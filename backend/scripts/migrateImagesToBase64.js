import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import path from 'path'
import Product from '../models/Product.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

const migrateImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const products = await Product.find()
    console.log(`\n📦 Found ${products.length} products to migrate\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const product of products) {
      try {
        let needsUpdate = false
        const updates = {}

        // Check if images need migration
        if (product.images && product.images.length > 0) {
          const migratedImages = []
          
          for (const img of product.images) {
            // If it's already an object with base64 data, skip
            if (typeof img === 'object' && img.data) {
              migratedImages.push(img)
              continue
            }

            // If it's a string path, convert to base64
            if (typeof img === 'string') {
              const imagePath = join(__dirname, '../../public', img)
              
              if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath)
                const base64Data = imageBuffer.toString('base64')
                const ext = path.extname(imagePath).toLowerCase()
                
                let contentType = 'image/jpeg'
                if (ext === '.png') contentType = 'image/png'
                else if (ext === '.gif') contentType = 'image/gif'
                else if (ext === '.webp') contentType = 'image/webp'
                
                migratedImages.push({
                  data: base64Data,
                  contentType: contentType,
                  filename: path.basename(imagePath)
                })
                
                needsUpdate = true
              } else {
                console.log(`  ⚠️  Image not found: ${imagePath}`)
                // Keep the original path if file doesn't exist
                migratedImages.push(img)
              }
            }
          }
          
          if (needsUpdate) {
            updates.images = migratedImages
          }
        }

        // Check if video needs migration
        if (product.video && typeof product.video === 'string') {
          const videoPath = join(__dirname, '../../public', product.video)
          
          if (fs.existsSync(videoPath)) {
            const videoBuffer = fs.readFileSync(videoPath)
            const base64Data = videoBuffer.toString('base64')
            const ext = path.extname(videoPath).toLowerCase()
            
            let contentType = 'video/mp4'
            if (ext === '.webm') contentType = 'video/webm'
            else if (ext === '.ogg') contentType = 'video/ogg'
            
            updates.video = {
              data: base64Data,
              contentType: contentType,
              filename: path.basename(videoPath)
            }
            
            needsUpdate = true
          }
        }

        if (needsUpdate) {
          await Product.findByIdAndUpdate(product._id, updates)
          console.log(`✅ Migrated: ${product.name}`)
          migrated++
        } else {
          console.log(`⏭️  Skipped: ${product.name} (already migrated or no files)`)
          skipped++
        }
      } catch (error) {
        console.error(`❌ Error migrating ${product.name}:`, error.message)
        errors++
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Migrated: ${migrated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)

    await mongoose.connection.close()
    console.log('\n✅ Done')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

migrateImages()
