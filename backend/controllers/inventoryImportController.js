import * as XLSX from 'xlsx'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'

// Standard size list matching Product schema enum
const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', 'Custom']

// Helper to normalize column names (flexible header matching)
const normalizeRowKeys = (row) => {
  const normalized = {}
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    normalized[cleanKey] = typeof value === 'string' ? value.trim() : value
  }
  return normalized
}

// Parse Size Stock Breakdown string like "XS:5, S:10, M:15"
const parseSizeStockString = (sizeStr) => {
  if (!sizeStr) return []
  const str = String(sizeStr).trim()
  if (!str) return []

  const result = []
  // Split by comma or pipe
  const parts = str.split(/[,|]/)
  for (const part of parts) {
    if (!part.trim()) continue
    const pair = part.split(':')
    if (pair.length === 2) {
      const szName = pair[0].trim().toUpperCase()
      // Match size name case-insensitively with VALID_SIZES
      const matchedSize = VALID_SIZES.find(s => s.toUpperCase() === szName) || szName
      const qty = parseInt(pair[1].trim())
      if (matchedSize && !isNaN(qty) && qty >= 0) {
        result.push({ size: matchedSize, quantity: qty })
      }
    }
  }
  return result
}

// Parse comma-separated images string
const parseImagesString = (imgStr) => {
  if (!imgStr) return []
  if (Array.isArray(imgStr)) return imgStr.map(s => String(s).trim()).filter(Boolean)
  return String(imgStr)
    .split(',')
    .map(s => s.trim())
    .filter(s => s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/'))
}

// Parse boolean values (TRUE/FALSE, Yes/No, 1/0)
const parseBooleanValue = (val, defaultValue = false) => {
  if (val === undefined || val === null || val === '') return defaultValue
  if (typeof val === 'boolean') return val
  const str = String(val).trim().toLowerCase()
  if (['true', 'yes', 'y', '1'].includes(str)) return true
  if (['false', 'no', 'n', '0'].includes(str)) return false
  return defaultValue
}

// @desc    Download Excel Catalog Import Template
// @route   GET /api/admin/inventory/import/template
// @access  Admin
export const downloadImportTemplate = asyncHandler(async (req, res) => {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Template Data Header & Example Row
  const templateHeaders = [
    'SKU',
    'Product Name',
    'Category',
    'Subcategory',
    'Price',
    'MRP',
    'Stock',
    'Size Stock Breakdown',
    'Color',
    'Fabric',
    'Fit',
    'Occasion',
    'Design',
    'Sleeves',
    'Length',
    'Description',
    'Images',
    'Is Active',
    'Is Featured',
    'Is New Arrival'
  ]

  const sampleRow = {
    'SKU': 'SM-ANK-101',
    'Product Name': 'Silk Embroidered Anarkali Set',
    'Category': 'Anarkali Sets',
    'Subcategory': '3-Piece Sets',
    'Price': 3499,
    'MRP': 4999,
    'Stock': 25,
    'Size Stock Breakdown': 'XS:2, S:5, M:8, L:5, XL:3, XXL:2',
    'Color': 'Royal Emerald',
    'Fabric': 'Chanderi Silk',
    'Fit': 'A-Line Silhouette',
    'Occasion': 'Festive Couture',
    'Design': 'Zari Threadwork',
    'Sleeves': '3/4 Sleeves',
    'Length': 'Calf Length',
    'Description': 'Handcrafted designer Anarkali suit set with gold foil accents.',
    'Images': 'https://res.cloudinary.com/demo/image/upload/sample1.jpg, https://res.cloudinary.com/demo/image/upload/sample2.jpg',
    'Is Active': 'TRUE',
    'Is Featured': 'FALSE',
    'Is New Arrival': 'TRUE'
  }

  const catalogSheet = XLSX.utils.json_to_sheet([sampleRow], { header: templateHeaders })

  // Adjust Column Widths for clean viewing in Excel
  catalogSheet['!cols'] = templateHeaders.map(h => ({ wch: Math.max(h.length + 5, 18) }))

  // Sheet 2: Detailed Instructions
  const instructionsData = [
    { 'Field Name': 'SKU', 'Required': 'Recommended', 'Format / Rules': 'Unique Product SKU code (e.g. SM-ANK-101). Used to match existing products for updates.' },
    { 'Field Name': 'Product Name', 'Required': 'YES', 'Format / Rules': 'Text string (e.g. Velvet Embroidered Kurti)' },
    { 'Field Name': 'Category', 'Required': 'YES', 'Format / Rules': 'Text string (e.g. 2-Piece Sets, Anarkali Sets, Sarees, Dupattas)' },
    { 'Field Name': 'Subcategory', 'Required': 'NO', 'Format / Rules': 'Text string (optional secondary classification)' },
    { 'Field Name': 'Price', 'Required': 'YES', 'Format / Rules': 'Numeric positive number (e.g. 2999)' },
    { 'Field Name': 'MRP', 'Required': 'NO', 'Format / Rules': 'Numeric number >= Price (Original list price for discounts)' },
    { 'Field Name': 'Stock', 'Required': 'NO', 'Format / Rules': 'Non-negative integer (e.g. 15). If Size Stock Breakdown is provided, total stock is auto-calculated.' },
    { 'Field Name': 'Size Stock Breakdown', 'Required': 'NO', 'Format / Rules': 'Format as "Size:Quantity" separated by commas (e.g. "XS:2, S:5, M:10, L:5"). Allowed sizes: XS, S, M, L, XL, XXL, 3XL, Free Size' },
    { 'Field Name': 'Color / Fabric / Fit', 'Required': 'NO', 'Format / Rules': 'Text strings describing product attributes' },
    { 'Field Name': 'Description', 'Required': 'NO', 'Format / Rules': 'Detailed text description' },
    { 'Field Name': 'Images', 'Required': 'NO', 'Format / Rules': 'Comma-separated Image URLs (http://... or https://...)' },
    { 'Field Name': 'Is Active / Is Featured', 'Required': 'NO', 'Format / Rules': 'TRUE or FALSE (Default Active = TRUE, Featured = FALSE)' }
  ]

  const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData)
  instructionsSheet['!cols'] = [
    { wch: 24 },
    { wch: 12 },
    { wch: 75 }
  ]

  XLSX.utils.book_append_sheet(workbook, catalogSheet, 'Catalog Template')
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="Seemee_Inventory_Import_Template.xlsx"')
  res.status(200).send(buffer)
})

// @desc    Parse, Validate and Preview Excel Product File
// @route   POST /api/admin/inventory/import/preview
// @access  Admin
export const previewImport = asyncHandler(async (req, res) => {
  let fileBuffer = null
  let fileName = ''

  if (req.file) {
    fileBuffer = req.file.buffer
    fileName = req.file.originalname || ''
  } else if (req.body && req.body.fileData) {
    const base64Str = String(req.body.fileData).replace(/^data:.*?;base64,/, '')
    fileBuffer = Buffer.from(base64Str, 'base64')
    fileName = req.body.fileName || 'import.xlsx'
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    res.status(400)
    throw new Error('Please select an Excel file (.xlsx or .xls) to upload.')
  }

  const cleanFileName = fileName.toLowerCase()
  const isExcelExt = cleanFileName.endsWith('.xlsx') || cleanFileName.endsWith('.xls') || cleanFileName === 'import.xlsx'
  if (!isExcelExt) {
    res.status(400)
    throw new Error('Unsupported file format. Please upload a valid .xlsx or .xls Excel document.')
  }

  let workbook
  try {
    workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  } catch (err) {
    res.status(400)
    throw new Error('Failed to parse Excel file. The document may be corrupted or password protected.')
  }

  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    res.status(400)
    throw new Error('The uploaded Excel workbook contains no visible sheets.')
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (!rawRows || rawRows.length === 0) {
    res.status(400)
    throw new Error('The uploaded Excel sheet contains no product rows.')
  }

  // Fetch existing SKUs from MongoDB to classify new vs update
  const existingProducts = await Product.find().select('sku _id name price stock').lean()
  const existingSkuMap = new Map()
  existingProducts.forEach(p => {
    if (p.sku) existingSkuMap.set(p.sku.toUpperCase().trim(), p)
  })

  const sheetSkuSet = new Set()
  const parsedRows = []
  const validItems = []

  let validCount = 0
  let invalidCount = 0
  let newCount = 0
  let updateCount = 0
  let duplicateSheetSkuCount = 0

  rawRows.forEach((rawRow, idx) => {
    const rowNum = idx + 2 // Row 1 is header
    const norm = normalizeRowKeys(rawRow)
    const errors = []

    // 1. Extract values
    const skuRaw = norm.sku || norm.skucode || norm.productsku || ''
    const sku = String(skuRaw).trim().toUpperCase()
    
    const name = String(norm.productname || norm.name || norm.title || '').trim()
    const category = String(norm.category || norm.cat || '').trim()
    const subcategory = String(norm.subcategory || norm.subcat || '').trim()

    const priceRaw = norm.price || norm.cost || norm.sellingprice
    const mrpRaw = norm.mrp || norm.originalprice || norm.listprice
    const stockRaw = norm.stock || norm.quantity || norm.qty || norm.totalstock

    const sizeStockRaw = norm.sizestockbreakdown || norm.sizestock || norm.sizes || norm.size
    const color = String(norm.color || norm.shade || '').trim()
    const fabric = String(norm.fabric || norm.material || '').trim()
    const fit = String(norm.fit || norm.silhouette || '').trim()
    const occasion = String(norm.occasion || '').trim()
    const design = String(norm.design || norm.pattern || '').trim()
    const sleeves = String(norm.sleeves || '').trim()
    const length = String(norm.length || '').trim()
    const description = String(norm.description || norm.desc || '').trim()
    const imagesRaw = norm.images || norm.image || norm.imageurls || ''

    const isActive = parseBooleanValue(norm.isactive, true)
    const isFeatured = parseBooleanValue(norm.isfeatured, false)
    const isNewArrival = parseBooleanValue(norm.isnewarrival, false)

    // 2. Validate Row Fields
    if (!name) {
      errors.push({ column: 'Product Name', value: name, reason: 'Product Name is required' })
    }

    if (!category) {
      errors.push({ column: 'Category', value: category, reason: 'Category is required' })
    }

    const price = parseFloat(priceRaw)
    if (priceRaw === '' || isNaN(price) || price <= 0) {
      errors.push({ column: 'Price', value: String(priceRaw), reason: 'Price must be a number greater than 0' })
    }

    let mrp = undefined
    if (mrpRaw !== undefined && mrpRaw !== '') {
      const parsedMrp = parseFloat(mrpRaw)
      if (isNaN(parsedMrp) || parsedMrp < 0) {
        errors.push({ column: 'MRP', value: String(mrpRaw), reason: 'MRP must be a valid positive number' })
      } else if (!isNaN(price) && parsedMrp < price) {
        errors.push({ column: 'MRP', value: String(mrpRaw), reason: 'MRP should be greater than or equal to Selling Price' })
      } else {
        mrp = parsedMrp
      }
    }

    let stock = 0
    if (stockRaw !== undefined && stockRaw !== '') {
      const parsedStock = parseInt(stockRaw)
      if (isNaN(parsedStock) || parsedStock < 0) {
        errors.push({ column: 'Stock', value: String(stockRaw), reason: 'Stock must be a non-negative integer' })
      } else {
        stock = parsedStock
      }
    }

    // Parse Size Stock
    const sizeStock = parseSizeStockString(sizeStockRaw)
    if (sizeStock.length > 0) {
      // Auto-sum stock from size breakdown
      stock = sizeStock.reduce((sum, item) => sum + item.quantity, 0)
    }

    // Duplicate SKU check within same Excel file
    let isDuplicateInSheet = false
    if (sku) {
      if (sheetSkuSet.has(sku)) {
        isDuplicateInSheet = true
        duplicateSheetSkuCount++
        errors.push({ column: 'SKU', value: sku, reason: `Duplicate SKU "${sku}" found within uploaded Excel sheet` })
      } else {
        sheetSkuSet.add(sku)
      }
    }

    // Determine Action Type (New Product vs Update Existing)
    const existingMatch = sku ? existingSkuMap.get(sku) : null
    const actionType = existingMatch ? 'UPDATE' : 'CREATE'

    const isValid = errors.length === 0

    if (isValid) {
      validCount++
      if (actionType === 'UPDATE') updateCount++
      else newCount++

      const itemPayload = {
        rowNum,
        sku: sku || undefined,
        name,
        category,
        subcategory: subcategory || undefined,
        price,
        mrp: mrp || undefined,
        stock,
        sizes: sizeStock.map(s => s.size),
        sizeStock: sizeStock.length > 0 ? sizeStock : undefined,
        color: color || undefined,
        fabric: fabric || undefined,
        fit: fit || undefined,
        occasion: occasion || undefined,
        design: design || undefined,
        sleeves: sleeves || undefined,
        length: length || undefined,
        description: description || undefined,
        images: parseImagesString(imagesRaw),
        isActive,
        featured: isFeatured,
        isNewArrival,
        actionType,
        existingId: existingMatch ? existingMatch._id : undefined
      }

      validItems.push(itemPayload)
    } else {
      invalidCount++
    }

    parsedRows.push({
      rowNum,
      sku: sku || 'N/A',
      name: name || 'Unnamed Product',
      category: category || 'Unassigned',
      price: !isNaN(price) ? price : String(priceRaw),
      stock,
      actionType,
      isValid,
      errors
    })
  })

  res.json({
    success: true,
    data: {
      fileName,
      totalRows: rawRows.length,
      validCount,
      invalidCount,
      newCount,
      updateCount,
      duplicateSheetSkuCount,
      rows: parsedRows,
      validItems
    }
  })
})

// @desc    Execute Bulk Import / Update of Validated Products
// @route   POST /api/admin/inventory/import/confirm
// @access  Admin
export const confirmImport = asyncHandler(async (req, res) => {
  const { items, mode = 'add_and_update' } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400)
    throw new Error('No valid product items provided for import.')
  }

  let importedCount = 0
  let updatedCount = 0
  let failedCount = 0
  const failedErrors = []

  // Process items in controlled batches or transaction safety
  for (const item of items) {
    try {
      const {
        sku,
        name,
        category,
        subcategory,
        price,
        mrp,
        stock,
        sizes,
        sizeStock,
        color,
        fabric,
        fit,
        occasion,
        design,
        sleeves,
        length,
        description,
        images,
        isActive,
        featured,
        isNewArrival,
        actionType,
        existingId
      } = item

      // Filter by mode
      if (mode === 'add_only' && actionType === 'UPDATE') continue
      if (mode === 'update_only' && actionType === 'CREATE') continue

      if (actionType === 'UPDATE' && (sku || existingId)) {
        // UPDATE EXISTING PRODUCT
        const filter = existingId ? { _id: existingId } : { sku: sku.toUpperCase().trim() }
        const updatePayload = {
          name,
          category,
          price,
          stock,
          isActive,
          updatedAt: new Date()
        }

        if (subcategory) updatePayload.subcategory = subcategory
        if (mrp !== undefined) updatePayload.mrp = mrp
        if (description) updatePayload.description = description
        if (color) updatePayload.color = color
        if (fabric) updatePayload.fabric = fabric
        if (fit) updatePayload.fit = fit
        if (occasion) updatePayload.occasion = occasion
        if (design) updatePayload.design = design
        if (sleeves) updatePayload.sleeves = sleeves
        if (length) updatePayload.length = length
        if (Array.isArray(images) && images.length > 0) updatePayload.images = images
        if (Array.isArray(sizeStock) && sizeStock.length > 0) {
          updatePayload.sizeStock = sizeStock
          updatePayload.sizes = sizeStock.map(s => s.size)
        }
        if (featured !== undefined) updatePayload.featured = featured
        if (isNewArrival !== undefined) updatePayload.isNewArrival = isNewArrival

        const updatedDoc = await Product.findOneAndUpdate(filter, { $set: updatePayload }, { new: true, runValidators: true })
        if (updatedDoc) {
          try {
            const { notifyRestockedSubscribers } = await import('../services/restockService.js')
            notifyRestockedSubscribers(updatedDoc._id, updatedDoc).catch(err => console.error('Excel import restock notify error:', err))
          } catch (e) {}
        }
        updatedCount++
      } else {
        // CREATE NEW PRODUCT
        const newDoc = new Product({
          sku: sku ? sku.toUpperCase().trim() : undefined,
          name,
          category,
          subcategory,
          price,
          mrp,
          stock: stock || 0,
          sizes: sizes || [],
          sizeStock: sizeStock || [],
          color,
          fabric,
          fit,
          occasion,
          design,
          sleeves,
          length,
          description,
          images: images || [],
          isActive: isActive !== false,
          featured: featured || false,
          isNewArrival: isNewArrival || false
        })

        await newDoc.save()
        importedCount++
      }
    } catch (err) {
      failedCount++
      failedErrors.push({
        rowNum: item.rowNum || 'N/A',
        sku: item.sku || 'N/A',
        name: item.name || 'Unknown',
        reason: err.message
      })
    }
  }

  res.json({
    success: true,
    message: 'Bulk inventory import completed.',
    data: {
      totalProcessed: items.length,
      importedCount,
      updatedCount,
      failedCount,
      errors: failedErrors
    }
  })
})
