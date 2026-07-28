// Helper function to get image URL from product image data
export const getImageUrl = (imageData, options = {}) => {
  if (!imageData) return '/images/placeholder.jpg'
  
  let url = ''

  // If it's a string URL
  if (typeof imageData === 'string') {
    url = imageData
  } else if (imageData.secure_url) {
    url = imageData.secure_url
  } else if (imageData.url) {
    url = imageData.url
  } else if (imageData.data && imageData.contentType) {
    url = `data:${imageData.contentType};base64,${imageData.data}`
  } else {
    return '/images/placeholder.jpg'
  }

  // Optimize Cloudinary URLs if applicable
  if (url.includes('cloudinary.com')) {
    return optimizeCloudinaryUrl(url, options)
  }

  return url
}

// Optimize Cloudinary URLs with transformations
const optimizeCloudinaryUrl = (url, options = {}) => {
  const {
    width = 800,
    quality = 'auto',
    format = 'webp',
    crop = 'fill',
    blur = null
  } = options

  if (url.includes('/upload/')) {
    // Avoid double transformation if already present
    const hasTransformations = /\/upload\/[^/]+,/.test(url)
    if (hasTransformations) return url

    const transformations = [
      `w_${width}`,
      `q_${quality}`,
      `f_${format}`,
      `c_${crop}`,
      'dpr_auto'
    ]
    
    if (blur) {
      transformations.push(`e_blur:${blur}`)
    }
    
    return url.replace('/upload/', `/upload/${transformations.join(',')}/`)
  }
  
  return url
}

// Helper function to get video URL from product video data
export const getVideoUrl = (videoData) => {
  if (!videoData) return null
  
  if (typeof videoData === 'string') {
    return videoData
  }

  if (videoData.secure_url) {
    return videoData.secure_url
  }

  if (videoData.url) {
    return videoData.url
  }
  
  if (videoData.data && videoData.contentType) {
    return `data:${videoData.contentType};base64,${videoData.data}`
  }
  
  return null
}
