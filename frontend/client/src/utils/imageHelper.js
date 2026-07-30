// Helper function to get optimized image URL from Cloudinary
export const getImageUrl = (imageData, options = {}) => {
  // Use a reliable local fallback image
  const defaultFallback = '/images/home-hero.png'
  
  if (!imageData) return defaultFallback
  
  // If it's a string URL
  if (typeof imageData === 'string') {
    // INTERCEPT BROKEN PLACEHOLDERS - Use local assets instead of Unsplash
    const isPlaceholder = 
      imageData.includes('placeholder') || 
      imageData.includes('via.placeholder.com') ||
      imageData.match(/^\d+x\d+/) || 
      imageData.includes('?text=')

    if (isPlaceholder) {
      if (imageData.toLowerCase().includes('anarkali')) return '/images/ruby_bridal_sharara.png'
      if (imageData.toLowerCase().includes('palazzo')) return '/images/categories_straight.jpg'
      if (imageData.toLowerCase().includes('sharara')) return '/images/ruby_bridal_sharara.png'
      return defaultFallback
    }

    // Determine API Base
    const apiBase = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://seeme2-0.vercel.app' : 'http://localhost:5000')).replace(/\/$/, '')
    
    // Check if it's already an absolute URL
    if (imageData.includes('://') || imageData.startsWith('data:')) {
      return (options && Object.keys(options).length > 0) ? optimizeCloudinaryUrl(imageData, options) : imageData
    }

    // It's a relative path. If it starts with '/', we still need to prepend the API base 
    // because the images are served from the backend, not the frontend public folder.
    // Except for a few known local assets like logos if they are in the public folder.
    const isLocalPublicAsset = imageData.startsWith('/images/') || imageData.startsWith('/favicon')
    
    if (isLocalPublicAsset) {
      return imageData
    }

    const cleanPath = imageData.startsWith('/') ? imageData.slice(1) : imageData
    return `${apiBase}/${cleanPath}`
  }
  
  // If it's an object with base64 data (legacy format)
  if (imageData.data && imageData.contentType) {
    return `data:${imageData.contentType};base64,${imageData.data}`
  }
  
  return defaultFallback
}

// Optimize Cloudinary URLs with transformations
const optimizeCloudinaryUrl = (url, options = {}) => {
  // Default options for optimization
  const {
    width = 1000,
    quality = 'auto',
    format = 'webp',
    crop = 'fill',
    fetchFormat = 'webp',
    blur = null
  } = options

  // Check if URL already has transformations
  if (url.includes('/upload/')) {
    // If it already has transformations (contains comma between /upload/ and /v123/), skip adding more to avoid breaking
    const hasExistingTransformations = /\/upload\/[^/]+,/.test(url);
    if (hasExistingTransformations) return url;

    // Insert transformations after /upload/
    const transformations = []
    if (width) transformations.push(`w_${width}`)
    if (quality) transformations.push(`q_${quality}`)
    if (format) transformations.push(`f_${format}`)
    if (crop) transformations.push(`c_${crop}`)
    
    // Add blur if specified
    if (blur) {
      transformations.push(`e_blur:${blur}`)
    }
    
    // Safety check: only replace the FIRST occurrence of /upload/
    return url.replace('/upload/', `/upload/${transformations.join(',')}/`)
  }
  
  return url
}

// Specific optimization presets
export const getOptimizedImageUrl = (imageData, preset = 'default', customOptions = {}) => {
  const presets = {
    // Hero/Carousel images - Optimized for actual display size
    hero: {
      width: 1200,
      quality: 'auto:good',
      format: 'webp',
      crop: 'fill'
    },
    // Mobile Hero - Smaller for mobile devices
    'mobile-hero': {
      width: 600,
      quality: 'auto:eco',
      format: 'webp',
      crop: 'fill'
    },
    // Product images - Medium size
    product: {
      width: 800,
      quality: 'auto:good',
      format: 'webp',
      crop: 'fill'
    },
    // Card images - Medium size
    card: {
      width: 600,
      quality: 'auto:good',
      format: 'webp',
      crop: 'fill'
    },
    // Mobile Card - Smaller for mobile
    'mobile-card': {
      width: 400,
      quality: 'auto:eco',
      format: 'webp',
      crop: 'fill'
    },
    // Thumbnails - Small, optimized
    thumbnail: {
      width: 200,
      quality: 'auto:eco',
      format: 'webp',
      crop: 'fill'
    },
    // Category/Fabric circles
    circle: {
      width: 300,
      quality: 'auto:good',
      format: 'webp',
      crop: 'fill'
    },
    // Default - Sensible optimization
    default: {
      width: 1000,
      quality: 'auto:good',
      format: 'webp',
      crop: 'scale'
    }
  }

  // Merge preset with custom options
  const options = { ...(presets[preset] || presets.default), ...customOptions }
  
  return getImageUrl(imageData, options)
}

// Helper function to get video URL from product video data
export const getVideoUrl = (videoData) => {
  if (!videoData) return null
  
  // If it's a string URL (Cloudinary or old format), return it directly
  if (typeof videoData === 'string') {
    return videoData
  }
  
  // If it's an object with base64 data (legacy format), convert to data URL
  if (videoData.data && videoData.contentType) {
    return `data:${videoData.contentType};base64,${videoData.data}`
  }
  
  return null
}
