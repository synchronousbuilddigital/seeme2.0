// ============================================
// Image Configuration for Client Frontend
// ============================================

/**
 * IMPORTANT: Image Path Strategy
 * 
 * ALL image paths should be ABSOLUTE from the public folder root
 * ✅ CORRECT: /images/logo.png
 * ✅ CORRECT: https://res.cloudinary.com/seemee/...
 * ❌ WRONG: ./images/logo.png (relative - breaks on nested routes)
 * ❌ WRONG: images/logo.png (relative - breaks on nested routes)
 */

// ============================================
// Static Asset Paths (from public/ folder)
// ============================================

export const STATIC_IMAGES = {
  // Logos
  LOGO: '/images/logo.png',
  LOGO_DARK: '/images/logo-dark.png',
  LOGO_SMALL: '/images/logo-small.png',
  
  // Icons
  FAVICON: '/images/favicon.png',
  
  // Placeholder & Loading
  PLACEHOLDER: '/images/placeholder.png',
  LOADING: '/images/loading.gif',
  
  // Hero & Banners
  HERO_DEFAULT: '/images/hero-default.jpg',
  BANNER_DEFAULT: '/images/banner-default.jpg',
  
  // Category Images (fallback)
  CATEGORIES: {
    anarkali: '/images/categories/anarkali.jpg',
    palazzo: '/images/categories/palazzo.jpg',
    straightCut: '/images/categories/straight-cut.jpg',
    sharara: '/images/categories/sharara.jpg',
    saree: '/images/categories/saree.jpg',
    lehenga: '/images/categories/lehenga.jpg'
  },
  
  // Default product image
  PRODUCT_DEFAULT: '/images/product-default.jpg'
}

// ============================================
// Image Dimensions for Responsive Layouts
// ============================================

export const IMAGE_DIMENSIONS = {
  // Product listing/grid
  PRODUCT_LIST: {
    width: 300,
    height: 400,
    aspectRatio: '3/4'
  },
  
  // Product detail page
  PRODUCT_DETAIL: {
    width: 600,
    height: 800,
    aspectRatio: '3/4'
  },
  
  // Hero carousel
  HERO: {
    desktop: { width: 1920, height: 600 },
    tablet: { width: 1024, height: 400 },
    mobile: { width: 768, height: 300 }
  },
  
  // Category cards
  CATEGORY: {
    width: 400,
    height: 300,
    aspectRatio: '4/3'
  },
  
  // Review images
  REVIEW: {
    width: 100,
    height: 100,
    aspectRatio: '1/1'
  }
}

// ============================================
// Responsive Image Sizes (for srcset)
// ============================================

export const RESPONSIVE_SIZES = {
  PRODUCT_LIST: [
    { size: '(max-width: 480px)', width: 200 },
    { size: '(max-width: 768px)', width: 300 },
    { size: '(max-width: 1024px)', width: 400 },
    { size: '(min-width: 1025px)', width: 500 }
  ],
  
  PRODUCT_DETAIL: [
    { size: '(max-width: 480px)', width: 400 },
    { size: '(max-width: 768px)', width: 600 },
    { size: '(min-width: 769px)', width: 800 }
  ],
  
  HERO: [
    { size: '(max-width: 480px)', width: 600 },
    { size: '(max-width: 768px)', width: 1024 },
    { size: '(min-width: 769px)', width: 1920 }
  ]
}

// ============================================
// Cloudinary Configuration
// ============================================

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'seemee',
  QUALITY: 'auto',      // Auto quality (best compression)
  FORMAT: 'auto',       // Auto format (webp/avif for modern browsers)
  FETCH_FORMAT: 'auto'  // Auto fetch format
}

// ============================================
// Generate Optimized Cloudinary URL
// ============================================

/**
 * Generate responsive Cloudinary URL with optimizations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Customization options
 * @returns {string} Optimized URL
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  if (!publicId) return STATIC_IMAGES.PRODUCT_DEFAULT
  
  const {
    width = 800,
    height = null,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'auto'
  } = options
  
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload/`
  
  // Build transformation string
  const transforms = []
  
  if (width) transforms.push(`w_${width}`)
  if (height) transforms.push(`h_${height}`)
  transforms.push(`c_${crop}`)
  if (gravity !== 'auto') transforms.push(`g_${gravity}`)
  transforms.push(`q_${quality}`)
  transforms.push(`f_${format}`)
  
  return baseUrl + transforms.join(',') + '/' + publicId
}

// ============================================
// Product Image Presets
// ============================================

export const PRODUCT_IMAGE_PRESETS = {
  // Thumbnail for listing
  thumbnail: (publicId) => getCloudinaryUrl(publicId, {
    width: 300,
    height: 400,
    crop: 'fill',
    gravity: 'face'
  }),
  
  // Detail page main image
  detail: (publicId) => getCloudinaryUrl(publicId, {
    width: 600,
    height: 800,
    crop: 'fill',
    gravity: 'face'
  }),
  
  // Mobile view
  mobile: (publicId) => getCloudinaryUrl(publicId, {
    width: 400,
    height: 500,
    crop: 'fill',
    gravity: 'face'
  }),
  
  // Gallery/lightbox
  gallery: (publicId) => getCloudinaryUrl(publicId, {
    width: 1000,
    height: 1200,
    crop: 'fill',
    gravity: 'face'
  })
}

// ============================================
// Hero Image URLs
// ============================================

export const HERO_IMAGES = [
  {
    title: 'Premium Ethnic Collection',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1920',
    mobileImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=768'
  },
  {
    title: 'Summer Palazzo Collection',
    image: 'https://images.unsplash.com/photo-1595614595-c1a97f7e5c8e?auto=format&fit=crop&q=80&w=1920',
    mobileImage: 'https://images.unsplash.com/photo-1595614595-c1a97f7e5c8e?auto=format&fit=crop&q=80&w=768'
  },
  {
    title: 'Wedding Season Specials',
    image: 'https://images.unsplash.com/photo-1590080876-e8b1925c1e58?auto=format&fit=crop&q=80&w=1920',
    mobileImage: 'https://images.unsplash.com/photo-1590080876-e8b1925c1e58?auto=format&fit=crop&q=80&w=768'
  }
]

// ============================================
// Category Default Images
// ============================================

export const CATEGORY_IMAGES = {
  anarkali: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
  palazzo: 'https://images.unsplash.com/photo-1610173826014-9336df76906a?auto=format&fit=crop&q=80&w=800',
  straightCut: 'https://images.unsplash.com/photo-1589156206699-bc21e38c8a7d?auto=format&fit=crop&q=80&w=800',
  sharara: 'https://images.unsplash.com/photo-1617627143750-d86bc21e44bb?auto=format&fit=crop&q=80&w=800',
  saree: 'https://images.unsplash.com/photo-1563857671-127f341e4e3c?auto=format&fit=crop&q=80&w=800',
  lehenga: 'https://images.unsplash.com/photo-1552053831-71594a27c62d?auto=format&fit=crop&q=80&w=800'
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get safe image URL with fallback
 * @param {string} url - Image URL
 * @param {string} fallback - Fallback URL
 * @returns {string} Safe URL
 */
export const getSafeImageUrl = (url, fallback = STATIC_IMAGES.PRODUCT_DEFAULT) => {
  return (url && url.trim()) ? url : fallback
}

/**
 * Get category image or fallback
 * @param {string} category - Category name
 * @returns {string} Category image URL
 */
export const getCategoryImage = (category) => {
  return CATEGORY_IMAGES[category] || STATIC_IMAGES.CATEGORIES[category] || STATIC_IMAGES.PRODUCT_DEFAULT
}

/**
 * Check if URL is Cloudinary URL
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export const isCloudinaryUrl = (url) => {
  return url && url.includes('res.cloudinary.com')
}

/**
 * Check if URL is external
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export const isExternalUrl = (url) => {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
}

/**
 * Generate srcset for responsive images
 * @param {string} publicId - Cloudinary public ID
 * @param {array} sizes - Array of size objects
 * @returns {string} srcset attribute value
 */
export const generateSrcSet = (publicId, sizes = RESPONSIVE_SIZES.PRODUCT_LIST) => {
  return sizes
    .map(({ width }) => `${getCloudinaryUrl(publicId, { width })} ${width}w`)
    .join(', ')
}

/**
 * Get responsive image object for picture element
 * @param {string} publicId - Cloudinary public ID
 * @returns {object} Picture element configuration
 */
export const getResponsivePicture = (publicId) => {
  return {
    sources: [
      {
        media: '(max-width: 480px)',
        srcSet: generateSrcSet(publicId, RESPONSIVE_SIZES.PRODUCT_LIST.slice(0, 1))
      },
      {
        media: '(max-width: 768px)',
        srcSet: generateSrcSet(publicId, RESPONSIVE_SIZES.PRODUCT_LIST.slice(1, 2))
      },
      {
        media: '(max-width: 1024px)',
        srcSet: generateSrcSet(publicId, RESPONSIVE_SIZES.PRODUCT_LIST.slice(2, 3))
      }
    ],
    fallback: getCloudinaryUrl(publicId, { width: 500 })
  }
}

// ============================================
// Export all
// ============================================

export default {
  STATIC_IMAGES,
  IMAGE_DIMENSIONS,
  RESPONSIVE_SIZES,
  CLOUDINARY_CONFIG,
  HERO_IMAGES,
  CATEGORY_IMAGES,
  PRODUCT_IMAGE_PRESETS,
  getCloudinaryUrl,
  getSafeImageUrl,
  getCategoryImage,
  isCloudinaryUrl,
  isExternalUrl,
  generateSrcSet,
  getResponsivePicture
}
