import XLSX from 'xlsx'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import cloudinary from '../config/cloudinary.js'
import streamifier from 'streamifier'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

import Product from '../models/Product.js'

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

// Download image from URL
const downloadImage = async (imageUrl, timeout = 15000) => {
  try {
    const resp = await fetch(imageUrl, { timeout })
    if (!resp.ok) {
      console.log(`  ⚠️  HTTP ${resp.status}`)
      return null
    }

    const contentType = resp.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      console.log(`  ⚠️  Not an image: ${contentType}`)
      return null
    }

    const arrayBuffer = await resp.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.log(`  ⚠️  Download error: ${err.message}`)
    return null
  }
}

// Upload image to Cloudinary
const uploadImageBuffer = async (buffer, productName) => {
  try {
    const result = await uploadToCloudinary(buffer, {
      folder: 'seemee/catalog',
      public_id: `${productName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      overwrite: false
    })
    return result.secure_url
  } catch (err) {
    console.log(`  ❌ Upload failed: ${err.message}`)
    return null
  }
}

// Parse Excel file
const parseExcelCatalog = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet)
    console.log(`✅ Parsed ${data.length} rows from Excel\n`)
    return data
  } catch (err) {
    console.error(`❌ Failed to parse Excel: ${err.message}`)
    return []
  }
}

// Main import function
const importCatalogWithImages = async (excelPath) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Parse Excel
    const rows = parseExcelCatalog(excelPath)
    if (rows.length === 0) {
      console.log('❌ No data found in Excel file')
      process.exit(1)
    }

    let imported = 0
    let skipped = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const productName = row.name || row.Name || `Product ${i + 1}`
      
      console.log(`\n[${i + 1}/${rows.length}] Processing: ${productName}`)

      // Extract image URL from Excel row (supports common column names)
      const imageUrl = row.image_url || row.imageUrl || row.Image || row.image || row.url || row.URL
      
      if (!imageUrl) {
        console.log('  ⏭️  No image URL found, skipping')
        skipped++
        continue
      }

      console.log(`  📥 Downloading from: ${imageUrl.substring(0, 60)}...`)

      // Download image
      const buffer = await downloadImage(imageUrl)
      if (!buffer) {
        console.log(`  ⏭️  Skipped (download failed)`)
        skipped++
        continue
      }

      console.log(`  ✅ Downloaded ${buffer.length} bytes`)
      console.log(`  📤 Uploading to Cloudinary...`)

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadImageBuffer(buffer, productName)
      if (!cloudinaryUrl) {
        console.log(`  ⏭️  Skipped (upload failed)`)
        skipped++
        continue
      }

      console.log(`  ✅ Uploaded: ${cloudinaryUrl.substring(0, 80)}...`)

      // Prepare product data
      const productData = {
        name: productName,
        category: row.category || row.Category || 'uncategorized',
        price: parseFloat(row.price || row.Price || 0) || 0,
        mrp: parseFloat(row.mrp || row.MRP || 0) || 0,
        description: row.description || row.Description || '',
        images: [cloudinaryUrl],
        stock: parseInt(row.stock || row.Stock || 10, 10),
        sku: row.sku || row.SKU || `SKU-${Date.now()}-${i}`,
        isActive: true
      }

      // Check if product exists (by name or SKU)
      const existingProduct = await Product.findOne({
        $or: [{ name: productData.name }, { sku: productData.sku }]
      })

      if (existingProduct) {
        // Update existing product
        existingProduct.images = [cloudinaryUrl]
        await existingProduct.save()
        console.log(`  ✏️  Updated existing product in DB`)
      } else {
        // Create new product
        const newProduct = new Product(productData)
        await newProduct.save()
        console.log(`  ➕ Created new product in DB`)
      }

      imported++
    }

    console.log(`\n\n📊 Import Summary`)
    console.log(`================`)
    console.log(`✅ Imported: ${imported}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📦 Total: ${imported + skipped}`)
    console.log(`\n✨ Complete!`)

    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

// Get Excel file path from command line or use default
const excelPath = process.argv[2] || path.join(__dirname, '../SeeMee_Catlog.xlsx')

if (!fs.existsSync(excelPath)) {
  console.error(`❌ Excel file not found: ${excelPath}`)
  console.log(`\nUsage: node scripts/importCatalogImages.js [path/to/file.xlsx]`)
  process.exit(1)
}

console.log('🚀 Catalog Import with Image Upload to Cloudinary')
console.log('================================================')
console.log(`File: ${excelPath}\n`)

importCatalogWithImages(excelPath)
