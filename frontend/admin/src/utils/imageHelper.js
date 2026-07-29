// Helper function to get image URL from product image data
export const getImageUrl = (imageData, options = {}) => {
  if (!imageData) return '/images/placeholder.jpg'
  
  if (typeof imageData === 'string') {
    if (imageData.startsWith('http://') || imageData.startsWith('https://') || imageData.startsWith('data:')) {
      return imageData
    }
    const apiBase = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://seeme2-0.vercel.app' : 'http://localhost:5000')).replace(/\/$/, '')
    const cleanPath = imageData.startsWith('/') ? imageData : `/${imageData}`
    return `${apiBase}${cleanPath}`
  }

  if (imageData.url) return getImageUrl(imageData.url, options)
  if (imageData.secure_url) return getImageUrl(imageData.secure_url, options)
  return '/images/placeholder.jpg'
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
      `c_${crop}`
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
