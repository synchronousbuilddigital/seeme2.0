# Image URL Database Fix Guide

## Overview
Your database may contain image URLs in different formats:
- **Relative paths** (e.g., `product.jpg`) → need to be converted to full URLs
- **External URLs** (e.g., Dropbox, broken links) → can be re-uploaded to Cloudinary
- **Cloudinary URLs** (already good) → left as-is

## The Migration Script

The `fixImageUrls.js` script automatically:
1. Scans all Products and HeroCarousel records
2. Detects relative paths and converts them to absolute URLs using your API base
3. Detects external image URLs and uploads them to Cloudinary (server-side, no CORS)
4. Skips Cloudinary URLs (already optimal)
5. Writes fixed URLs back to MongoDB

## How to Run

### 1. Ensure your `.env` file has:
```env
MONGODB_URI=mongodb://...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VITE_API_URL=http://localhost:5000/api
```

### 2. Run the migration script:
```bash
cd backend
node scripts/fixImageUrls.js
```

### 3. Monitor the output:
```
🔄 Database Image URL Migration
================================
API URL: http://localhost:5000/api
Cloudinary Cloud: your_cloud_name
✅ Connected to MongoDB

📦 Fixing Product images...
Found 45 products
  Product "Anarkali Dress": converted relative path to http://localhost:5000/api/uploads/anarkali.jpg
  Product "Palazzo Set": attempting to upload external image...
  ✅ Uploaded to Cloudinary: seemee/images/migrated/xyz123
  ✅ Updated product: Palazzo Set
✅ Fixed 12/45 products

🎠 Fixing HeroCarousel images...
Found 5 carousel slides
  ✅ Updated carousel slide order 1
✅ Fixed 3/5 carousel slides

✨ Migration complete!
```

## What It Does to Each Image Type

### Relative Paths (e.g., `product.jpg`)
```
Before: product.jpg
After:  http://localhost:5000/api/uploads/product.jpg
```

### External URLs (e.g., Dropbox with CORS issues)
```
Before: https://dl.dropboxusercontent.com/s/...image.jpg
After:  https://res.cloudinary.com/YOUR_CLOUD/image/upload/.../seemee/images/migrated/xyz.jpg
```

### Already Cloudinary URLs
```
Before: https://res.cloudinary.com/YOUR_CLOUD/image/upload/.../product.jpg
After:  (unchanged - left as-is)
```

## Rollback / Undo

If you need to revert:
1. The script shows you the changes being made before saving
2. To revert: restore MongoDB from backup, OR manually edit the documents to restore old URLs

## Troubleshooting

### Script fails to connect to MongoDB
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB server is running

### Script fails to upload to Cloudinary
- Check `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are correct
- Check internet connection can reach Cloudinary API
- Script will keep original URL as fallback if upload fails

### Some external images fail to upload
- This is normal (broken links, CORS-blocked, timeout)
- The script keeps the original URL; you can manually fix it in the admin panel later

## After Migration

Your database now has:
1. ✅ All relative paths converted to absolute URLs
2. ✅ External images re-hosted on Cloudinary (no CORS errors)
3. ✅ Frontend can display images without cross-origin issues

You can now use the admin panel to:
- Upload new images via `/api/upload/image` (multipart) — saved to Cloudinary
- Upload images from URL via `/api/upload/image-from-url` (JSON) — fetched server-side, uploaded to Cloudinary
- Edit products/carousel without worrying about CORS blocking external images
