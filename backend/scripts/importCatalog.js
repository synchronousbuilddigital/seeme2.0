import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'dns'
import XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import User from '../models/User.js'
import Product from '../models/Product.js'
import Magazine from '../models/Magazine.js'
import NewArrival from '../models/NewArrival.js'
import Order from '../models/Order.js'
import HeroCarousel from '../models/HeroCarousel.js'
import SiteSettings from '../models/SiteSettings.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use reliable DNS servers for Atlas connectivity
dns.setServers(['1.1.1.1', '8.8.8.8'])
dotenv.config()

const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const adminPassword = (process.env.ADMIN_PASSWORD || '').trim()

if (!adminEmail || !adminPassword) {
  console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be defined in .env')
  process.exit(1)
}

const connect = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is missing in .env')
  }
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 })
}

const preserveAdminAndPurge = async () => {
  console.log('🔄 Preserving admin and purging other data...')
  
  // Ensure one canonical admin exists
  const existingAdminCandidates = await User.find({ role: 'admin' })
  let admin = existingAdminCandidates.find((user) => String(user.email || '').trim().toLowerCase() === adminEmail)

  if (!admin) {
    admin = await User.create({ email: adminEmail, password: adminPassword, name: 'Admin', role: 'admin' })
    console.log('✅ Admin created:', adminEmail)
  } else {
    admin.email = adminEmail
    admin.password = adminPassword
    admin.role = 'admin'
    admin.name = admin.name || 'Admin'
    await admin.save()
    console.log('✅ Admin preserved:', adminEmail)
  }

  // Remove all other users
  const removedUsers = await User.deleteMany({ _id: { $ne: admin._id } })
  console.log(`🗑️  Removed ${removedUsers.deletedCount || 0} non-admin users`)

  // Clear other collections
  const models = [Product, Magazine, NewArrival, Order, HeroCarousel, SiteSettings]
  for (const model of models) {
    try {
      const result = await model.deleteMany({})
      console.log(`🗑️  Cleared ${model.collection.name}: ${result.deletedCount || 0} documents`)
    } catch (err) {
      console.log(`⚠️  Could not clear ${model.collection.name}:`, err.message)
    }
  }
}

const readExcelFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet)
    return data
  } catch (err) {
    console.error('❌ Error reading Excel file:', err.message)
    return []
  }
}

const groupProductsByStyleCode = (items) => {
  const grouped = {}
  
  for (const item of items) {
    const styleCode = item['Style code'] || ''
    if (!styleCode) continue
    
    if (!grouped[styleCode]) {
      grouped[styleCode] = []
    }
    grouped[styleCode].push(item)
  }
  
  return grouped
}

const importProducts = async (products) => {
  console.log(`\n📦 Processing ${products.length} rows from Excel...`)
  
  // Group by style code (each style code = one product with multiple sizes)
  const groupedProducts = groupProductsByStyleCode(products)
  console.log(`📦 Found ${Object.keys(groupedProducts).length} unique products`)
  
  let successCount = 0
  let errorCount = 0

  for (const [styleCode, variants] of Object.entries(groupedProducts)) {
    try {
      // Use first variant for common product info
      const firstVariant = variants[0]
      
      const productName = firstVariant['Product Name'] || ''
      if (!productName) {
        console.warn(`⚠️  Skipping - no product name for style code: ${styleCode}`)
        errorCount++
        continue
      }

      const productData = {
        name: productName.trim(),
        category: firstVariant['Type(*)'] || 'Unspecified',
        price: parseInt(firstVariant['SELLING PRICE(*PRODUCT)(ITEM)(*SKU)'] || 0),
        mrp: parseInt(firstVariant['M.R.P.(*PRODUCT)(*ITEM)(*SKU)'] || 0),
        styleCode: styleCode,
        sku: firstVariant['SKU  Code'] || styleCode,
        brand: firstVariant['Brand(*)'] || 'SeeMee',
        productType: firstVariant['Type(*)'] || '',
        color: firstVariant['Colour(*)'] || '',
        fabric: firstVariant['Fabric(*)'] || '',
        fit: firstVariant['Fit(*)'] || '',
        occasion: firstVariant['Occasion(*)'] || '',
        design: firstVariant['Design'] || '',
        sleeves: firstVariant['Sleeves(*)'] || '',
        length: firstVariant['Length(*)'] || '',
        material: firstVariant['Material'] || '',
        careInstructions: firstVariant['Care'] || '',
        forTarget: firstVariant['For(*)'] || 'Women',
        images: [],
        sizeStock: [],
        createdAt: new Date()
      }

      // Extract dimensions
      if (firstVariant['Length (cm)'] || firstVariant['Width (cm)'] || firstVariant['Height (cm)']) {
        productData.dimensions = {
          lengthCm: parseFloat(firstVariant['Length (cm)']) || 0,
          widthCm: parseFloat(firstVariant['Width (cm)']) || 0,
          heightCm: parseFloat(firstVariant['Height (cm)']) || 0
        }
      }

      // Extract weight
      if (firstVariant['Weight (g)']) {
        productData.weight = {
          valueGrams: parseFloat(firstVariant['Weight (g)']) || 0
        }
      }

      // Collect unique images from all variants
      const imageUrls = new Set()
      for (const variant of variants) {
        if (variant['Image 1'] && variant['Image 1'].startsWith('http')) {
          imageUrls.add(variant['Image 1'])
        }
        if (variant['Image 2'] && variant['Image 2'].startsWith('http')) {
          imageUrls.add(variant['Image 2'])
        }
      }
      productData.images = Array.from(imageUrls)

      // Process sizes and create sizeStock entries
      const sizeMap = new Map()
      for (const variant of variants) {
        const size = variant['Size'] || 'M'
        if (!sizeMap.has(size)) {
          sizeMap.set(size, 1)
          productData.sizeStock.push({
            size: size,
            quantity: 1
          })
        }
      }

      // Validate required fields
      if (!productData.name || !productData.category) {
        console.warn(`⚠️  Skipping - missing required fields: ${productName}`)
        errorCount++
        continue
      }

      // Check if product already exists
      const existingProduct = await Product.findOne({ sku: productData.sku })
      let product
      if (existingProduct) {
        Object.assign(existingProduct, productData)
        product = await existingProduct.save()
        console.log(`🔄 Updated: ${productData.name} [${productData.color}] (${variants.length} sizes)`)
      } else {
        product = await Product.create(productData)
        console.log(`✅ Imported: ${productData.name} [${productData.color}] (${variants.length} sizes) - ₹${productData.price}`)
      }
      successCount++
    } catch (err) {
      console.error(`❌ Error importing product "${styleCode}":`, err.message)
      errorCount++
    }
  }

  console.log(`\n📊 Product Import Summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log(`   📈 Total Products: ${successCount + errorCount}`)
}

const importFromExcelFile = async (filePath) => {
  try {
    console.log(`\n📂 Reading Excel file: ${filePath}`)
    const data = readExcelFile(filePath)

    if (data.length === 0) {
      console.warn('⚠️  No data found in Excel file')
      return
    }

    console.log(`✅ Successfully read ${data.length} rows from Excel`)
    await importProducts(data)
  } catch (err) {
    console.error('❌ Error during import:', err.message)
  }
}

const main = async () => {
  try {
    console.log('🚀 Starting Database Reset & Catalog Import...')
    console.log('='.repeat(50))

    await connect()
    console.log('✅ Connected to MongoDB')

    // Preserve admin and clear other data
    await preserveAdminAndPurge()

    // Import from Excel file
    const excelPath = path.join(__dirname, '../uploads/SeeMee_Catlog.xlsx')
    const alternativePath = path.join(__dirname, '../SeeMee_Catlog.xlsx')
    
    let fileToImport = null
    if (fs.existsSync(excelPath)) {
      fileToImport = excelPath
    } else if (fs.existsSync(alternativePath)) {
      fileToImport = alternativePath
    } else {
      console.warn('⚠️  Excel file not found in expected locations:')
      console.warn(`   - ${excelPath}`)
      console.warn(`   - ${alternativePath}`)
      console.log('\n💡 Please place "SeeMee_Catlog.xlsx" in the backend folder')
    }

    if (fileToImport) {
      await importFromExcelFile(fileToImport)
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Database reset and import completed successfully!')
  } catch (err) {
    console.error('❌ Fatal error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

main()
