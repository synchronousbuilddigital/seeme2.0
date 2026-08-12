# Catalog Import Guide

## Overview
The catalog import system allows you to:
- **Preserve Admin Account** - All admin users are kept during import
- **Clear All Other Data** - Products, orders, magazines, etc. are cleared
- **Import from Excel** - New product data from Excel file

## Setup Instructions

### 1. Place Excel File
Copy your `SeeMee_Catlog.xlsx` file to the backend root directory:
```
backend/
├── SeeMee_Catlog.xlsx  ← Place file here
├── scripts/
│   ├── importCatalog.js
│   └── ...
└── package.json
```

### 2. Excel File Format
Your Excel file should have the following columns (headers in first row):

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `name` | String | ✅ | Product name |
| `description` | String | ✅ | Product description |
| `category` | String | ✅ | Category name (e.g., "Saree", "Suit") |
| `price` | Number | ✅ | Selling price |
| `stock` | Number | ⚠️ | Total available stock |
| `images` | String | ❌ | Comma-separated image URLs |
| `isNewArrival` | Boolean | ❌ | true/false or 1/0 |
| `stock_XS` | Number | ❌ | Stock for XS size |
| `stock_S` | Number | ❌ | Stock for S size |
| `stock_M` | Number | ❌ | Stock for M size |
| `stock_L` | Number | ❌ | Stock for L size |
| `stock_XL` | Number | ❌ | Stock for XL size |
| `stock_XXL` | Number | ❌ | Stock for XXL size |

### 3. Example Row
```
name: "Silk Saree Red"
description: "Beautiful red silk saree with traditional patterns"
category: "Saree"
price: 2500
stock: 15
images: "https://example.com/image1.jpg,https://example.com/image2.jpg"
isNewArrival: true
stock_M: 5
stock_L: 7
stock_XL: 3
```

### 4. Image URLs
- **Currently**: Use direct image URLs (HTTP/HTTPS links)
- **Example**: `https://example.com/product.jpg`
- **Format**: Comma-separated for multiple images

### 5. Run Import
```bash
# From backend directory
npm run import:catalog

# Or directly
node scripts/importCatalog.js
```

## Expected Output
```
🚀 Starting Database Reset & Catalog Import...
==================================================
✅ Connected to MongoDB
🔄 Preserving admin and purging other data...
✅ Admin preserved: your_admin_email@example.com
🗑️  Removed 0 non-admin users
🗑️  Cleared products: 5 documents
📦 Importing 10 products...
✅ Imported: Silk Saree Red
✅ Imported: Cotton Suit Blue
📊 Product Import Summary:
   ✅ Successful: 10
   ❌ Failed: 0
   📈 Total: 10
==================================================
✅ Database reset and import completed successfully!
```

## Future: Cloudinary Integration

### Enable Cloudinary Upload
1. Set environment variables in `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. Convert image URLs to Cloudinary:
   - Images will be automatically uploaded to Cloudinary
   - Original URLs will be replaced with Cloudinary URLs
   - Images stored in `seemee/products` folder

### Configuration
Edit `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Image Upload Methods

**A. From Frontend (Direct Upload)**
```javascript
import { uploadImage } from '../utils/imageUpload.js'

const file = event.target.files[0]
const url = await uploadImage(file, 'seemee/products')
```

**B. From Backend (Multer)**
```javascript
import { uploadImages } from '../utils/imageUpload.js'

app.post('/upload', multer().single('image'), async (req, res) => {
  const imageUrl = await uploadImage(req.file.buffer, 'seemee/products')
  res.json({ url: imageUrl })
})
```

## Troubleshooting

### Excel File Not Found
- ✅ Check file is in backend root: `backend/SeeMee_Catlog.xlsx`
- ✅ Verify filename spelling (case-sensitive on Linux)
- ✅ Place file before running import

### Import Fails
- ✅ Check MongoDB connection: `npm run dev` should connect successfully
- ✅ Verify Excel format matches specifications
- ✅ Check required fields are filled (name, description, category, price)

### Admin Not Preserved
- This shouldn't happen - import process specifically preserves admin
- If issue occurs, check MongoDB logs

## Database Schema

### Product Document
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  stock: Number,
  images: [String],           // URLs
  isNewArrival: Boolean,
  sizeStock: [{
    size: String,             // XS, S, M, L, XL, XXL
    quantity: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints for Images

### Upload Image
```
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  "url": "https://cloudinary.com/..."
}
```

### Product with Images
```
GET /api/products
POST /api/products

Product Response:
{
  "_id": "...",
  "name": "...",
  "images": [
    "https://...",
    "https://..."
  ]
}
```

## Notes
- ✅ All image URLs are validated before storage
- ✅ Admin email and password are preserved from `.env`
- ✅ Import is idempotent (can run multiple times)
- ✅ Failed imports can be retried safely
- ✅ Cloudinary integration is optional and can be added later
