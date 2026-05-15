# Catalog Import with Image Upload

## Overview

This script:
1. Reads your `SeeMee_Catlog.xlsx` Excel file
2. Extracts product details and image URLs
3. **Downloads each image one-by-one** from the URL
4. **Uploads each image to Cloudinary** (server-side, no CORS)
5. Saves products to MongoDB with Cloudinary image URLs

## Prerequisites

✅ `.env` configured with:
```env
MONGODB_URI=mongodb://...
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

✅ `xlsx` package already installed (`package.json` has it)

## Excel File Format

Your Excel file should have columns like:
```
| name           | category      | price | image_url                    |
|----------------|---------------|-------|------------------------------|
| Anarkali Dress | anarkali      | 1500  | https://example.com/img1.jpg |
| Palazzo Set    | palazzo       | 2000  | https://example.com/img2.jpg |
```

**Supported column names (case-insensitive):**
- Name: `name`, `Name`, `product_name`, `Product Name`
- Category: `category`, `Category`
- Price: `price`, `Price`
- Image: `image_url`, `imageUrl`, `Image`, `image`, `url`, `URL`
- MRP: `mrp`, `MRP`
- Stock: `stock`, `Stock`
- Description: `description`, `Description`
- SKU: `sku`, `SKU`

## How to Run

### Step 1: Place your Excel file
Copy `SeeMee_Catlog.xlsx` to: `backend/SeeMee_Catlog.xlsx`

### Step 2: Run the import script
```bash
cd backend
node scripts/importCatalogImages.js
```

Or with a custom file path:
```bash
node scripts/importCatalogImages.js /path/to/your/catalog.xlsx
```

### Step 3: Monitor progress
```
🚀 Catalog Import with Image Upload to Cloudinary
================================================
File: backend/SeeMee_Catlog.xlsx

✅ Parsed 45 rows from Excel

[1/45] Processing: Anarkali Dress
  📥 Downloading from: https://example.com/img1...
  ✅ Downloaded 245632 bytes
  📤 Uploading to Cloudinary...
  ✅ Uploaded: https://res.cloudinary.com/YOUR_CLOUD/image/upload/...
  ➕ Created new product in DB

[2/45] Processing: Palazzo Set
  ⏭️  No image URL found, skipping

...

📊 Import Summary
================
✅ Imported: 42
⏭️  Skipped: 3
📦 Total: 45

✨ Complete!
```

## What Happens to Each Product

### Successfully Imported ✅
- Image URL downloaded from Excel
- Image uploaded to Cloudinary
- Product created/updated in MongoDB
- Cloudinary URL stored in product.images array

### Skipped ⏭️
- No image URL found in row
- Image download failed (broken link, timeout)
- Image upload to Cloudinary failed
- Row will be logged and skipped; try again or fix manually

## Speed & Performance

- Each image is downloaded **one-by-one** (sequential, not parallel)
- Download timeout: 15 seconds per image
- Upload timeout: depends on file size
- For 45 products with 2MB images: ~3-5 minutes expected

**Why sequential?** Prevents overwhelming your server/network and makes progress tracking clear

## Troubleshooting

### "Excel file not found"
```
❌ Excel file not found: backend/SeeMee_Catlog.xlsx

Usage: node scripts/importCatalogImages.js [path/to/file.xlsx]
```
**Fix:** Copy your Excel file to `backend/SeeMee_Catlog.xlsx` or provide the full path

### "Download failed"
- Check the image URL in your Excel file is valid
- Try the URL in a browser to verify it works
- If external hosting has CORS or requires auth, script will skip

### "Upload failed"
- Check Cloudinary credentials in `.env`
- Check internet connection
- Check file size (> 100MB will fail)

### "No products created"
- Verify column names match (case-insensitive, but check spelling)
- Run with verbose: the script logs which columns it finds

## After Import

✅ All products are in MongoDB  
✅ All images are on Cloudinary  
✅ Frontend can fetch products via `/api/products`  
✅ Admin can edit/add more images via admin panel  

## To Add More Products Later

You can:
1. Edit your Excel file
2. Re-run the import script (existing products by SKU will be updated)
3. Or manually upload via admin panel

## Update npm scripts

You can add this to `backend/package.json` for convenience:
```json
{
  "scripts": {
    "import:catalog": "node scripts/importCatalogImages.js"
  }
}
```

Then run:
```bash
npm run import:catalog
```
