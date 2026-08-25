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

// Helper: upload video to Cloudinary with video resource type or save locally
const saveVideoFile = async (file, folder = 'seemee/videos') => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'video',
          chunk_size: 6000000, // 6MB chunk streaming
          eager_async: true
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

  const ext = path.extname(file.originalname || '') || '.mp4'
  const filename = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
  const filePath = path.join(uploadsDir, filename)

  fs.writeFileSync(filePath, file.buffer)

  return {
    url: `/uploads/${filename}`,
    public_id: filename
  }
}

// @desc    Upload video
// @route   POST /api/upload/video
// @access  Admin
export const uploadVideo = asyncHandler(async (req, res) => {
  const file = req.file || (req.files && req.files[0])
  if (!file) {
    res.status(400)
    throw new Error('No video file provided for upload')
  }

  console.log(`[Upload] Starting fast video upload to Cloudinary: ${file.originalname || 'video'} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`)

  try {
    const folder = req.body.folder || 'seemee/videos'
    const result = await saveVideoFile(file, folder)

    console.log(`[Upload] Video saved to Cloudinary successfully: ${result.url}`)

    res.json({
      success: true,
      data: {
        url: result.url,
        public_id: result.public_id,
      },
    })
  } catch (error) {
    console.error('[Upload] Video upload error:', error)
    res.status(500)
    throw new Error(`Video upload failed: ${error.message}`)
  }
})

// @desc    Upload image from external URL to Cloudinary (no CORS: server-side fetch)
// @route   POST /api/upload/image-from-url
// @access  Admin
export const uploadImageFromUrl = asyncHandler(async (req, res) => {
  const { url, folder = 'seemee/images' } = req.body

  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400)
    throw new Error('Image URL is required for upload.')
  }

  const cleanUrl = url.trim()

  // Validate URL format
  try {
    const parsedUrl = new URL(cleanUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      res.status(400)
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS URLs are supported.')
    }
  } catch (err) {
    res.status(400)
    throw new Error(`Invalid URL format: ${err.message}`)
  }

  // 1. Cloudinary Direct URL Upload
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      console.log(`[Upload] Uploading external image URL to Cloudinary: ${cleanUrl}`)

      const result = await cloudinary.uploader.upload(cleanUrl, {
        folder,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto',
        fetch_format: 'webp'
      })

      console.log(`[Upload] Image from URL saved to Cloudinary: ${result.secure_url}`)

      return res.json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          source: 'cloudinary'
        }
      })
    } catch (error) {
      console.error('[Upload] Cloudinary URL upload error:', error)
      res.status(500)
      throw new Error(`Failed to upload image from URL to Cloudinary: ${error.message}`)
    }
  }

  // 2. Local Disk Storage Fallback
  try {
    console.log(`[Upload] Fetching external image URL for local saving: ${cleanUrl}`)
    const response = await fetch(cleanUrl)
    if (!response.ok) {
      res.status(400)
      throw new Error(`Failed to fetch image from URL. Server responded with status ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const filename = `url_img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`
    const filePath = path.join(uploadsDir, filename)

    fs.writeFileSync(filePath, buffer)

    return res.json({
      success: true,
      data: {
        url: `/uploads/${filename}`,
        public_id: filename,
        source: 'local'
      }
    })
  } catch (err) {
    console.error('[Upload] Local URL download error:', err)
    res.status(500)
    throw new Error(`Failed to download and save image locally from URL: ${err.message}`)
  }
})

// @desc    Delete media from Cloudinary or Local Storage
// @route   DELETE /api/upload/delete/:public_id or POST /api/upload/delete
// @access  Admin
export const deleteMedia = asyncHandler(async (req, res) => {
  const rawPublicId = req.params.public_id || req.params[0] || req.body.public_id

  if (!rawPublicId) {
    res.status(400)
    throw new Error('Public ID or filename is required for media deletion.')
  }

  // Clean public_id: decode URI components and strip leading slash / 'uploads/' prefix
  const decodedId = decodeURIComponent(rawPublicId)
  const cleanPublicId = decodedId.replace(/^\//, '').replace(/^uploads\//, '')

  // 1. Cloudinary Deletion
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const resourceType = req.body.resource_type || req.query.resource_type || 'image'

      // Attempt deletion with specified or default resource_type
      let result = await cloudinary.uploader.destroy(cleanPublicId, { resource_type: resourceType })

      // Fallback: If not found as image, attempt video resource_type
      if (result && result.result === 'not_found' && resourceType === 'image') {
        result = await cloudinary.uploader.destroy(cleanPublicId, { resource_type: 'video' })
      }

      if (result && (result.result === 'ok' || result.result === 'not_found')) {
        console.log(`[Upload] Cloudinary media deleted: ${cleanPublicId} (status: ${result.result})`)
        return res.json({
          success: true,
          message: 'Media deleted successfully',
          data: { public_id: cleanPublicId, result: result.result }
        })
      }

      res.status(400)
      throw new Error(`Cloudinary deletion failed: ${result?.result || 'Deletion error'}`)
    } catch (err) {
      console.error('[Upload] Cloudinary delete error:', err)
      res.status(500)
      throw new Error(`Cloudinary deletion failed: ${err.message}`)
    }
  }

  // 2. Local Disk Storage Deletion Fallback
  const filename = path.basename(cleanPublicId)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const filePath = path.join(uploadsDir, filename)

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
      console.log(`[Upload] Local media file deleted: ${filename}`)
      return res.json({
        success: true,
        message: 'Local media file deleted successfully',
        data: { filename }
      })
    } catch (err) {
      console.error('[Upload] Local file delete error:', err)
      res.status(500)
      throw new Error(`Failed to delete local media file: ${err.message}`)
    }
  }

  return res.json({
    success: true,
    message: 'Media file removed or not found on disk',
    data: { filename }
  })
})
