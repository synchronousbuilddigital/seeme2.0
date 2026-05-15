import cloudinary from 'cloudinary'
import fs from 'fs'
import path from 'path'
import '../config/cloudinary.js'

/**
 * Upload image to Cloudinary or keep as local/external URL
 * @param {string|Buffer} image - Image file path, URL, or Buffer
 * @param {string} folder - Cloudinary folder name (e.g., 'seemee/products')
 * @param {object} options - Additional upload options
 * @returns {Promise<string>} - Image URL
 */
export const uploadImage = async (image, folder = 'seemee', options = {}) => {
  try {
    // If it's already a URL, return it directly
    if (typeof image === 'string' && (image.startsWith('http') || image.startsWith('https'))) {
      return image
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('⚠️  Cloudinary not configured. Using image URL as-is.')
      return image
    }

    // If it's a local file path
    if (typeof image === 'string' && fs.existsSync(image)) {
      const uploadOptions = {
        folder,
        resource_type: 'auto',
        ...options
      }

      const result = await cloudinary.v2.uploader.upload(image, uploadOptions)
      return result.secure_url
    }

    // If it's a Buffer (from multer)
    if (Buffer.isBuffer(image)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder, resource_type: 'auto', ...options },
          (error, result) => {
            if (error) reject(error)
            else resolve(result.secure_url)
          }
        )
        uploadStream.end(image)
      })
    }

    console.warn('⚠️  Invalid image format. Expected URL, file path, or Buffer.')
    return null
  } catch (error) {
    console.error('❌ Image upload error:', error.message)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Upload multiple images
 * @param {Array} images - Array of image paths, URLs, or Buffers
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} - Array of image URLs
 */
export const uploadImages = async (images = [], folder = 'seemee') => {
  const uploadedUrls = []

  for (const image of images) {
    try {
      const url = await uploadImage(image, folder)
      if (url) uploadedUrls.push(url)
    } catch (err) {
      console.error('Error uploading image:', err.message)
    }
  }

  return uploadedUrls
}

/**
 * Delete image from Cloudinary
 * @param {string} url - Cloudinary image URL
 * @returns {Promise<boolean>} - Success status
 */
export const deleteImage = async (url) => {
  try {
    if (!url || !url.includes('cloudinary')) {
      console.warn('⚠️  URL is not a Cloudinary URL')
      return false
    }

    // Extract public_id from URL
    const parts = url.split('/')
    const filename = parts[parts.length - 1]
    const publicId = filename.split('.')[0]
    const folder = parts[parts.length - 2]
    const fullPublicId = `${folder}/${publicId}`

    const result = await cloudinary.v2.uploader.destroy(fullPublicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('❌ Error deleting image:', error.message)
    return false
  }
}

/**
 * Get image URL based on configuration
 * Returns Cloudinary URL if available, otherwise returns provided URL
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  // If already a URL, return as-is
  if (typeof imageUrl === 'string' && (imageUrl.startsWith('http') || imageUrl.startsWith('https'))) {
    return imageUrl
  }

  // If Cloudinary is available, try to upload
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('Image URL format not recognized for direct use')
    return null
  }

  return imageUrl
}

export default {
  uploadImage,
  uploadImages,
  deleteImage,
  getImageUrl
}
