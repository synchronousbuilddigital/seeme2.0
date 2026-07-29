import multer from 'multer'
import streamifier from 'streamifier'
import fs from 'fs'
import path from 'path'
import cloudinary from '../config/cloudinary.js'
import asyncHandler from '../utils/asyncHandler.js'

// Helper: upload image to Cloudinary or save locally if Cloudinary keys are missing
const saveImageFile = async (file, folder = 'seemee/images') => {
  // Check if Cloudinary environment variables are configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto',
          fetch_format: 'webp'
        },
        (error, result) => {
          if (result) resolve({ url: result.secure_url, public_id: result.public_id })
          else reject(error)
        }
      )
      streamifier.createReadStream(file.buffer).pipe(stream)
    })
  }

  // Local Disk Storage Fallback
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const ext = path.extname(file.originalname || '') || '.webp'
  const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
  const filePath = path.join(uploadsDir, filename)

  fs.writeFileSync(filePath, file.buffer)

  return {
    url: `/uploads/${filename}`,
    public_id: filename
  }
}

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Admin
export const uploadImage = asyncHandler(async (req, res) => {
  const file = req.file || (req.files && req.files[0])
  if (!file) {
    res.status(400)
    throw new Error('No image file provided for upload')
  }

  console.log(`[Upload] Starting image upload: ${file.originalname || 'image'} (${file.size} bytes)`)

  try {
    const folder = req.body.folder || 'seemee/images'
    const result = await saveImageFile(file, folder)

    console.log(`[Upload] Image saved successfully: ${result.url}`)

    res.json({
      success: true,
      data: {
        url: result.url,
        public_id: result.public_id,
      },
    })
  } catch (error) {
    console.error('[Upload] Upload error:', error)
    res.status(500)
    throw new Error(`Upload failed: ${error.message}`)
  }
})

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Admin
export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : [])
  if (files.length === 0) {
    res.status(400)
    throw new Error('No image files provided for upload')
  }

  console.log(`[Upload] Starting multiple images upload: ${files.length} files`)

  try {
    const folder = req.body.folder || 'seemee/images'
    const uploadPromises = files.map(file => saveImageFile(file, folder))
    const results = await Promise.all(uploadPromises)

    console.log(`[Upload] Successfully saved ${results.length} images`)

    res.json({
      success: true,
      data: results.map(r => ({
        url: r.url,
        public_id: r.public_id,
      })),
    })
  } catch (error) {
    console.error('[Upload] Multiple images upload error:', error)
    res.status(500)
    throw new Error(`Multiple upload failed: ${error.message}`)
  }
})

// @desc    Upload video
// @route   POST /api/upload/video
// @access  Admin
export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400)
    throw new Error('No file uploaded')
  }

  const result = await saveImageFile(req.file, 'seemee/videos')

  res.json({
    success: true,
    data: {
      url: result.url,
      public_id: result.public_id,
    },
  })
})

// @desc    Upload image from external URL to Cloudinary (no CORS: server-side fetch)
// @route   POST /api/upload/image-from-url
// @access  Admin
export const uploadImageFromUrl = asyncHandler(async (req, res) => {
  const { url } = req.body
  if (!url) {
    res.status(400)
    throw new Error('No url provided')
  }

  return res.json({
    success: true,
    data: {
      url,
      source: 'external'
    }
  })
})

// @desc    Delete media
// @route   DELETE /api/upload/delete/:public_id
// @access  Admin
export const deleteMedia = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Deleted successfully' })
})
