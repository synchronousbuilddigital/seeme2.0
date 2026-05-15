// ============================================
// Image Configuration for Admin Frontend
// ============================================

/**
 * IMPORTANT: Image Path Strategy
 * 
 * 1. STATIC ASSETS: Use absolute paths from public folder
 *    Example: /images/logo.png
 * 
 * 2. PRODUCT IMAGES (Current): Web URLs (Unsplash, Pexels)
 *    Example: https://images.unsplash.com/...
 * 
 * 3. PRODUCT IMAGES (Future): Cloudinary URLs
 *    Example: https://res.cloudinary.com/seemee/image/upload/...
 * 
 * 4. USER UPLOADS: Cloudinary only
 *    Upload via API endpoint: POST /api/upload/image
 */

// ============================================
// Image Endpoints
// ============================================

export const IMAGE_UPLOAD_ENDPOINTS = {
  SINGLE: '/api/upload/image',        // Upload single image
  MULTIPLE: '/api/upload/images',     // Upload multiple images
  VIDEO: '/api/upload/video',         // Upload video
  DELETE: '/api/upload/delete'        // Delete media
}

// ============================================
// Image Configuration
// ============================================

export const IMAGE_CONFIG = {
  // Maximum file sizes (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024,    // 10MB for images
  MAX_VIDEO_SIZE: 100 * 1024 * 1024,  // 100MB for videos
  
  // Allowed MIME types
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  
  // Image dimensions
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_HEIGHT: 300,
  GALLERY_WIDTH: 800,
  GALLERY_HEIGHT: 600,
  HERO_WIDTH: 1200,
  HERO_HEIGHT: 400,
  
  // Cloudinary optimization
  CLOUDINARY_QUALITY: 'auto',          // Auto quality (best compression)
  CLOUDINARY_FORMAT: 'auto',           // Auto format (webp for modern browsers)
  CLOUDINARY_FETCH_FORMAT: 'auto'      // Auto fetch format
}

// ============================================
// Cloudinary URL Generator
// ============================================

/**
 * Generate optimized Cloudinary URL
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Customization options
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = null,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options

  // Base Cloudinary URL
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'seemee'
  
  let url = `https://res.cloudinary.com/${cloudName}/image/upload/`
  
  // Add transformations
  const transformations = []
  
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  transformations.push(`c_${crop}`)
  transformations.push(`q_${quality}`)
  transformations.push(`f_${format}`)
  
  url += transformations.join(',') + '/'
  url += publicId
  
  return url
}

// ============================================
// Product Image Templates
// ============================================

export const PRODUCT_IMAGE_TEMPLATES = {
  // For listing/grid view
  THUMBNAIL: {
    width: 300,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  
  // For product detail page main image
  DETAIL: {
    width: 800,
    height: 900,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  
  // For gallery/lightbox
  GALLERY: {
    width: 1200,
    height: 1200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  },
  
  // For mobile view
  MOBILE: {
    width: 500,
    height: 600,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  }
}

// ============================================
// Default Product Images
// ============================================

export const DEFAULT_PRODUCT_IMAGES = {
  anarkali: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800',
  palazzo: 'https://images.unsplash.com/photo-1610173826014-9336df76906a?auto=format&fit=crop&q=80&w=800',
  straightCut: 'https://images.unsplash.com/photo-1589156206699-bc21e38c8a7d?auto=format&fit=crop&q=80&w=800',
  sharara: 'https://images.unsplash.com/photo-1617627143750-d86bc21e44bb?auto=format&fit=crop&q=80&w=800',
  saree: 'https://images.unsplash.com/photo-1563857671-127f341e4e3c?auto=format&fit=crop&q=80&w=800',
  lehenga: 'https://images.unsplash.com/photo-1552053831-71594a27c62d?auto=format&fit=crop&q=80&w=800',
  placeholder: 'https://images.unsplash.com/photo-1595776613215-fe04b78de7d0?auto=format&fit=crop&q=80&w=800'
}

// ============================================
// Static Asset Paths
// ============================================

export const STATIC_IMAGES = {
  LOGO: '/images/logo.png',
  LOGO_DARK: '/images/logo-dark.png',
  FAVICON: '/images/favicon.png',
  PLACEHOLDER: '/images/placeholder.png',
  HERO_DEFAULT: '/images/hero-default.jpg',
  LOADING: '/images/loading.gif'
}

// ============================================
// Image Upload Helper Functions
// ============================================

/**
 * Validate image file before upload
 * @param {File} file - File object
 * @returns {object} Validation result
 */
export const validateImageFile = (file) => {
  const errors = []
  
  // Check file type
  if (!IMAGE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push(`Invalid file type. Allowed: ${IMAGE_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')}`)
  }
  
  // Check file size
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size exceeds ${IMAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Convert file to base64 (for preview)
 * @param {File} file - File object
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

/**
 * Get image dimensions
 * @param {string} src - Image URL
 * @returns {Promise<object>} Width and height
 */
export const getImageDimensions = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

// ============================================
// Batch Image Upload Helper
// ============================================

/**
 * Upload multiple images at once
 * @param {File[]} files - Array of files
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<object[]>} Upload results
 */
export const uploadMultipleImages = async (files, onProgress = null) => {
  const formData = new FormData()
  
  files.forEach(file => {
    formData.append('images', file)
  })
  
  try {
    const response = await fetch(IMAGE_UPLOAD_ENDPOINTS.MULTIPLE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })
    
    if (!response.ok) throw new Error('Upload failed')
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Batch upload error:', error)
    throw error
  }
}

// ============================================
// Export all for use in components
// ============================================

export default {
  IMAGE_UPLOAD_ENDPOINTS,
  IMAGE_CONFIG,
  PRODUCT_IMAGE_TEMPLATES,
  DEFAULT_PRODUCT_IMAGES,
  STATIC_IMAGES,
  getOptimizedImageUrl,
  validateImageFile,
  fileToBase64,
  getImageDimensions,
  uploadMultipleImages
}
