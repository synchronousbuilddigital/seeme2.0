import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// ============================================
// MULTER CONFIGURATION (Memory Storage)
// ============================================
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  // Accept image files only
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// ============================================
// UPLOAD HELPER FUNCTIONS
// ============================================

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = (fileBuffer, filename, folder = 'seemee/products') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        public_id: filename,
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )
    
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw error
  }
}

/**
 * Generate optimized Cloudinary URL
 */
const getOptimizedCloudinaryUrl = (publicId, width = 800, quality = 80) => {
  return cloudinary.url(publicId, {
    width: width,
    crop: 'fill',
    quality: quality,
    fetch_format: 'auto'
  })
}

export {
  upload,
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedCloudinaryUrl
}
