# SeeMee Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

#### Admin Frontend
```bash
cd frontend/admin
npm install
```

#### Client Frontend
```bash
cd frontend/client
npm install
```

### 2. Environment Configuration

Create `.env.local` files in both frontend directories:

#### Admin Frontend (frontend/admin/.env.local)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Cloudinary (for image upload)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Development
VITE_NODE_ENV=development
```

#### Client Frontend (frontend/client/.env.local)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Cloudinary (for image display optimization)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Development
VITE_NODE_ENV=development
```

### 3. Start Development Servers

#### Admin Frontend
```bash
cd frontend/admin
npm run dev
```
Runs on: `http://localhost:5173` (or next available port)

#### Client Frontend
```bash
cd frontend/client
npm run dev
```
Runs on: `http://localhost:5174` (or next available port)

---

## Image Handling

### Critical: Image Path Strategy

**✅ ALWAYS use absolute paths for static images:**
```jsx
<img src="/images/logo.png" alt="Logo" />
```

**❌ NEVER use relative paths (they break on nested routes):**
```jsx
<img src="./images/logo.png" alt="Logo" />     // ❌ WRONG
<img src="images/logo.png" alt="Logo" />       // ❌ WRONG
```

### Static Images Setup

Place all static images in the `public/images` folder:

```
frontend/
├── admin/
│   └── public/
│       └── images/
│           ├── logo.png
│           ├── logo-dark.png
│           ├── placeholder.png
│           ├── categories/
│           │   ├── anarkali.jpg
│           │   ├── palazzo.jpg
│           │   └── ...
│           └── hero/
│               └── ...
│
└── client/
    └── public/
        └── images/
            ├── logo.png
            ├── logo-dark.png
            ├── placeholder.png
            ├── categories/
            │   └── ...
            └── icons/
                └── ...
```

### Product Image Configuration

#### Using Image Config (Recommended)

```javascript
import { STATIC_IMAGES, PRODUCT_IMAGE_PRESETS, getSafeImageUrl } from '@/config/imageConfig'

// Static assets
<img src={STATIC_IMAGES.LOGO} alt="Logo" />
<img src={STATIC_IMAGES.PLACEHOLDER} alt="Product" />

// Product images (with optimization)
<img 
  src={PRODUCT_IMAGE_PRESETS.thumbnail(product.images[0])}
  alt={product.name}
/>

// Safe URL with fallback
<img 
  src={getSafeImageUrl(product.image, STATIC_IMAGES.PRODUCT_DEFAULT)}
  alt={product.name}
/>
```

#### For Admin Uploads

```javascript
import { uploadMultipleImages, validateImageFile } from '@/config/imageConfig'

const handleImageUpload = async (files) => {
  // Validate files
  for (const file of files) {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.error(validation.errors)
      return
    }
  }
  
  // Upload to Cloudinary
  const uploadedImages = await uploadMultipleImages(files, (progress) => {
    console.log(`Upload progress: ${progress}%`)
  })
  
  return uploadedImages
}
```

---

## Admin Frontend Structure

### Key Pages
- **Dashboard**: Analytics and quick stats
- **Products**: Product management (CRUD)
- **Orders**: Order tracking and management
- **Customers**: Customer database and profiles
- **Payments**: Payment tracking
- **Inventory**: Stock management
- **Collections**: Product collections
- **New Arrivals**: Feature management
- **Activity**: User activity logs
- **Global Search**: Site-wide search

### Product Upload Workflow
1. Fill product details (name, description, price, etc.)
2. Select images from computer
3. Images upload to Cloudinary automatically
4. Cloudinary URLs are stored in database
5. Product goes to published status

---

## Client Frontend Structure

### Key Pages
- **Home**: Hero carousel, featured products, categories
- **Products**: Product listing with filters
- **Product Detail**: Full product view with gallery
- **Cart**: Shopping cart management
- **Checkout**: Order creation and payment
- **Account**: User profile and orders
- **Search**: Product search functionality
- **Categories**: Category-based browsing

### Image Display Strategy

All product images display through Unsplash/Cloudinary URLs:
```jsx
// Current (Unsplash/Pexels URLs)
product.images[0] = 'https://images.unsplash.com/...'

// Future (Cloudinary)
product.images[0] = 'https://res.cloudinary.com/seemee/image/upload/...'
```

Both are handled by the same image configuration.

---

## API Integration

### Authentication
```javascript
import api from '@/config/api'

// Login
const response = await api.post('/auth/login', {
  email: 'admin@seemee.com',
  password: 'admin123'
})

// Token stored in localStorage as 'token'
// Automatically included in all API requests
```

### Product Operations
```javascript
import api from '@/config/api'

// Get all products
const products = await api.get('/products')

// Get single product
const product = await api.get(`/products/${id}`)

// Create product (admin)
const newProduct = await api.post('/products', productData)

// Update product (admin)
const updated = await api.put(`/products/${id}`, updateData)

// Delete product (admin)
await api.delete(`/products/${id}`)
```

### Image Upload
```javascript
import api from '@/config/api'

// Upload single image
const formData = new FormData()
formData.append('image', file)

const response = await api.post('/upload/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

const imageUrl = response.data.data.url
```

---

## Component Examples

### Product Card Component
```jsx
import { PRODUCT_IMAGE_PRESETS, STATIC_IMAGES } from '@/config/imageConfig'

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img
        src={PRODUCT_IMAGE_PRESETS.thumbnail(product.images[0])}
        alt={product.name}
        onError={(e) => {
          e.target.src = STATIC_IMAGES.PRODUCT_DEFAULT
        }}
      />
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>
    </div>
  )
}
```

### Product Gallery (Detail Page)
```jsx
import { PRODUCT_IMAGE_PRESETS } from '@/config/imageConfig'
import { useState } from 'react'

function ProductGallery({ images }) {
  const [selected, setSelected] = useState(0)
  
  return (
    <div className="gallery">
      <div className="main-image">
        <img
          src={PRODUCT_IMAGE_PRESETS.detail(images[selected])}
          alt="Product"
        />
      </div>
      <div className="thumbnails">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={PRODUCT_IMAGE_PRESETS.thumbnail(img)}
            onClick={() => setSelected(idx)}
            className={selected === idx ? 'active' : ''}
          />
        ))}
      </div>
    </div>
  )
}
```

### Image Upload Component (Admin)
```jsx
import { validateImageFile, uploadMultipleImages, STATIC_IMAGES } from '@/config/imageConfig'
import { useState } from 'react'

function ImageUpload({ onUpload }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  
  const handleChange = async (e) => {
    const files = Array.from(e.target.files)
    
    // Validate
    for (const file of files) {
      const { valid, errors } = validateImageFile(file)
      if (!valid) {
        alert(errors.join('\n'))
        return
      }
    }
    
    // Show preview
    const base64 = await fileToBase64(files[0])
    setPreview(base64)
    
    // Upload
    setLoading(true)
    try {
      const uploaded = await uploadMultipleImages(files)
      onUpload(uploaded)
    } catch (error) {
      alert('Upload failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="upload">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
      />
      {preview && <img src={preview} alt="Preview" />}
      {loading && <p>Uploading...</p>}
    </div>
  )
}
```

---

## Vite Configuration

Both frontends use Vite for fast development builds.

### Commands
```bash
# Development
npm run dev       # Start dev server with HMR

# Production
npm run build     # Production build
npm run preview   # Preview production build locally
```

### Environment Variables
- Development: `.env.local`
- Production: `.env.production`

---

## Build & Deployment

### Admin Frontend Build
```bash
cd frontend/admin
npm run build
# Output in: dist/
```

### Client Frontend Build
```bash
cd frontend/client
npm run build
# Output in: dist/
```

### Deploy to Vercel

The `vercel.json` at project root configures builds for both frontends.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## Common Issues

### Images Not Loading
**Problem**: `<img>` shows broken image icon

**Solution**: 
1. Check image path starts with `/` (absolute)
2. Verify file exists in `public/images/`
3. Check browser DevTools for 404 errors
4. Use fallback in image config

### API Not Connected
**Problem**: "Cannot reach backend" error

**Solution**:
1. Ensure backend server running (`npm run dev` in backend/)
2. Check `VITE_API_BASE_URL` in `.env.local`
3. Verify CORS enabled in backend
4. Check backend port (default 5000)

### Upload Fails
**Problem**: Image upload fails with error

**Solution**:
1. Check Cloudinary credentials in `.env`
2. Verify file size < 10MB
3. Ensure file format is supported (JPEG, PNG, WebP, GIF)
4. Check network/internet connection

### Build Fails
**Problem**: `npm run build` shows errors

**Solution**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Check for TypeScript errors: `npm run build -- --verbose`

---

## Performance Optimization

### Image Optimization
All product images use Cloudinary for:
- Automatic format selection (WebP, AVIF for modern browsers)
- Quality optimization (auto quality settings)
- Responsive resizing (device-specific dimensions)
- CDN delivery (fast global distribution)

### Lazy Loading
Use native lazy loading for better performance:
```jsx
<img 
  src={imageUrl}
  alt="Product"
  loading="lazy"
/>
```

### Code Splitting
Vite automatically handles code splitting for faster initial loads.

---

## Security

### Tokens
- JWT token stored in `localStorage`
- Token sent in `Authorization: Bearer {token}` header
- Automatic token refresh on expiration
- Logout clears token from storage

### HTTPS
- Always use HTTPS in production
- Configure CORS properly
- Validate all user input

---

## Development Workflow

### Create New Product
1. Go to Admin → Products
2. Fill form (name, description, price, etc.)
3. Upload images via upload component
4. Set sizes, colors, categories
5. Click "Save" → Product created in database
6. Images stored in Cloudinary
7. URLs saved in product document

### View Product on Frontend
1. Go to Client → Products
2. Product appears in listing
3. Click product → Detail page shows images
4. Images load from Cloudinary URLs
5. All variations display correctly

---

## Useful Links

- **Vite Docs**: https://vitejs.dev/
- **React Docs**: https://react.dev/
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **MongoDB Docs**: https://docs.mongodb.com/
- **Express Docs**: https://expressjs.com/

---

## Support

Check the following for debugging:
1. Browser console (F12 → Console tab)
2. Network tab (see API requests/responses)
3. Backend logs (`npm run dev` output)
4. Environment variables (`.env.local` files)

---

Generated: May 2026
Last Updated: May 2026
