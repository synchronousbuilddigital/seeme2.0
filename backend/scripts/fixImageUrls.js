import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import cloudinary from '../config/cloudinary.js'
import streamifier from 'streamifier'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

import Product from '../models/Product.js'
import HeroCarousel from '../models/HeroCarousel.js'

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (result) resolve(result)
        else reject(error)
      }
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })
}

// Check if URL is absolute (starts with http)
const isAbsoluteUrl = (url) => {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
}

// Check if URL is already on Cloudinary
const isCloudinaryUrl = (url) => {
  return url && url.includes('res.cloudinary.com') && url.includes(process.env.CLOUDINARY_CLOUD_NAME)
}

// Attempt to fetch external image and upload to Cloudinary
const uploadExternalImageToCloudinary = async (imageUrl) => {
  try {
    console.log(`  Fetching external image: ${imageUrl.substring(0, 50)}...`)
    const resp = await fetch(imageUrl, { timeout: 10000 })
    
    if (!resp.ok) {
      console.log(`  ⚠️  Failed to fetch (HTTP ${resp.status}). Keeping original URL.`)
      return imageUrl // fallback: keep original
    }

    const contentType = resp.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      console.log(`  ⚠️  Not an image (${contentType}). Keeping original URL.`)
      return imageUrl
    }

    const arrayBuffer = await resp.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadToCloudinary(buffer, {
      folder: 'seemee/images/migrated'
    })

    console.log(`  ✅ Uploaded to Cloudinary: ${result.public_id}`)
    return result.secure_url
  } catch (err) {
    console.log(`  ⚠️  Error uploading: ${err.message}. Keeping original URL.`)
    return imageUrl // fallback
  }
}

// Convert relative filename to full URL using API base
const convertRelativeToAbsolute = (filename, apiUrl) => {
  if (isAbsoluteUrl(filename)) return filename
  // Assume relative filenames should come from /uploads or /images API
  return `${apiUrl}/uploads/${filename}`
}

const fixProductImages = async () => {
  console.log('\n📦 Fixing Product images...')
  const products = await Product.find({})
  console.log(`Found ${products.length} products`)

  let fixed = 0
  for (const product of products) {
    if (!product.images || product.images.length === 0) continue

    let modified = false
    const newImages = []

    for (const img of product.images) {
      let url = img

      // Skip Cloudinary URLs (already good)
      if (isCloudinaryUrl(url)) {
        newImages.push(url)
        continue
      }

      // If relative path, convert to absolute API URL
      if (!isAbsoluteUrl(url)) {
        url = convertRelativeToAbsolute(url, process.env.VITE_API_URL || 'http://localhost:5000/api')
        console.log(`  Product "${product.name}": converted relative path to ${url}`)
        modified = true
      }

      // If external URL (Dropbox, etc), try to upload to Cloudinary
      if (isAbsoluteUrl(url) && !isCloudinaryUrl(url)) {
        console.log(`  Product "${product.name}": attempting to upload external image...`)
        url = await uploadExternalImageToCloudinary(url)
        modified = true
      }

      newImages.push(url)
    }

    if (modified) {
      product.images = newImages
      await product.save()
      fixed++
      console.log(`  ✅ Updated product: ${product.name}`)
    }
  }

  console.log(`✅ Fixed ${fixed}/${products.length} products\n`)
}

const fixCarouselImages = async () => {
  console.log('\n🎠 Fixing HeroCarousel images...')
  const carousels = await HeroCarousel.find({})
  console.log(`Found ${carousels.length} carousel slides`)

  let fixed = 0
  for (const carousel of carousels) {
    if (!carousel.image) continue

    let url = carousel.image
    let modified = false

    // Skip Cloudinary URLs
    if (isCloudinaryUrl(url)) {
      continue
    }

    // Convert relative to absolute
    if (!isAbsoluteUrl(url)) {
      url = convertRelativeToAbsolute(url, process.env.VITE_API_URL || 'http://localhost:5000/api')
      console.log(`  Carousel order ${carousel.order}: converted relative path to ${url}`)
      modified = true
    }

    // Upload external URLs to Cloudinary
    if (isAbsoluteUrl(url) && !isCloudinaryUrl(url)) {
      console.log(`  Carousel order ${carousel.order}: attempting to upload external image...`)
      url = await uploadExternalImageToCloudinary(url)
      modified = true
    }

    if (modified) {
      carousel.image = url
      await carousel.save()
      fixed++
      console.log(`  ✅ Updated carousel slide order ${carousel.order}`)
    }
  }

  console.log(`✅ Fixed ${fixed}/${carousels.length} carousel slides\n`)
}

const main = async () => {
  try {
    console.log('🔄 Database Image URL Migration')
    console.log('================================')
    console.log(`API URL: ${process.env.VITE_API_URL || 'http://localhost:5000/api'}`)
    console.log(`Cloudinary Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`)

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    await fixProductImages()
    await fixCarouselImages()

    console.log('✨ Migration complete!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()
