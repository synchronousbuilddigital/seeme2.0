// Helper function to get image URL from product image data
export const getImageUrl = (imageData) => {
  if (!imageData) return '/images/placeholder.jpg'
  
  // If it's a string URL (Cloudinary or old format), return it directly
  if (typeof imageData === 'string') {
    return imageData
  }
  
  // If it's an object with base64 data (legacy format), convert to data URL
  if (imageData.data && imageData.contentType) {
    return `data:${imageData.contentType};base64,${imageData.data}`
  }
  
  return '/images/placeholder.jpg'
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
