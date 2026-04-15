// Helper function to get optimized image URL from Cloudinary
export const getImageUrl = (imageData, options = {}) => {
  if (!imageData) return '/images/categories_anarkali.jpg'
  
  // If it's a string URL
  if (typeof imageData === 'string') {
    // Check if it's a Cloudinary URL
    if (imageData.includes('cloudinary.com')) {
      return optimizeCloudinaryUrl(imageData, options)
    }
    return imageData
  }
  
  // If it's an object with base64 data (legacy format)
  if (imageData.data && imageData.contentType) {
    return `data:${imageData.contentType};base64,${imageData.data}`
  }
  
  return '/images/categories_anarkali.jpg'
}

// Optimize Cloudinary URLs with transformations
const optimizeCloudinaryUrl = (url, options = {}) => {
  // Default options for optimization
  const {
    width = 'auto',
    quality = 'auto:good',
    format = 'auto',
    crop = 'scale',
    fetchFormat = 'auto',
    blur = null
  } = options

  // Check if URL already has transformations
  if (url.includes('/upload/')) {
    // Insert transformations after /upload/
    const transformations = [
      `w_${width}`,
      `q_${quality}`,
      `f_${format}`,
      `c_${crop}`,
      'dpr_auto'
    ]
    
    // Add blur if specified
    if (blur) {
      transformations.push(`e_blur:${blur}`)
    }
    
    return url.replace('/upload/', `/upload/${transformations.join(',')}/`)
  }
  
  return url
}

// Specific optimization presets
export const getOptimizedImageUrl = (imageData, preset = 'default', customOptions = {}) => {
  const presets = {
    // Hero/Carousel images - Optimized for actual display size
    hero: {
      width: 800,
      quality: 'auto:good',
      format: 'auto',
      crop: 'fill'
    },
    // Mobile Hero - Smaller for mobile devices
    'mobile-hero': {
      width: 400,
      quality: 'auto:eco',
      format: 'auto',
      crop: 'fill'
    },
    // Product images - Medium size
    product: {
      width: 800,
      quality: 'auto:good',
      format: 'auto',
      crop: 'fill'
    },
    // Card images - Medium size
    card: {
      width: 800,
      quality: 'auto:good',
      format: 'auto',
      crop: 'fill'
    },
    // Mobile Card - Smaller for mobile
    'mobile-card': {
      width: 400,
      quality: 'auto:eco',
      format: 'auto',
      crop: 'fill'
    },
    // Thumbnails - Small, optimized
    thumbnail: {
      width: 200,
      quality: 'auto:eco',
      format: 'auto',
      crop: 'fill'
    },
    // Category/Fabric circles
    circle: {
      width: 300,
      quality: 'auto:good',
      format: 'auto',
      crop: 'fill'
    },
    // Default - Auto optimization
    default: {
      width: 'auto',
      quality: 'auto:good',
      format: 'auto',
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
