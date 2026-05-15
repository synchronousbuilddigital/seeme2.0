import multer from 'multer'
import streamifier from 'streamifier'
import cloudinary from '../config/cloudinary.js'
import asyncHandler from '../utils/asyncHandler.js'

// Helper: stream buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const error = new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the backend.')
    error.statusCode = 503
    throw error
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (result) resolve(result)
        else reject(error)
      }
    )
    streamifier.createReadStream(buffer).pipe(stream)
  })
}

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Admin
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400)
    throw new Error('No file provided for upload')
  }

  console.log(`[Upload] Starting image upload: ${req.file.originalname} (${req.file.size} bytes)`)

  try {
    const folder = req.body.folder || 'seemee/images'
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: folder,
      resource_type: 'auto'
    })

    if (!result || !result.secure_url) {
      throw new Error('Cloudinary failed to return a secure URL')
    }

    console.log(`[Upload] Successfully uploaded to Cloudinary: ${result.public_id}`)

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    })
  } catch (error) {
    console.error('[Upload] Cloudinary upload error:', error)
    res.status(500)
    throw new Error(`Upload failed: ${error.message}`)
  }
})

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Admin
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400)
    throw new Error('No files provided for upload')
  }

  console.log(`[Upload] Starting multiple images upload: ${req.files.length} files`)

  try {
    const folder = req.body.folder || 'seemee/images'
    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, { 
        folder: folder,
        resource_type: 'auto'
      })
    )

    const results = await Promise.all(uploadPromises)

    console.log(`[Upload] Successfully uploaded ${results.length} images to Cloudinary`)

    res.json({
      success: true,
      data: results.map(r => ({
        url: r.secure_url,
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

  const result = await uploadToCloudinary(req.file.buffer, {
    resource_type: 'video',
    folder: 'seemee/videos',
  })

  res.json({
    success: true,
    data: {
      url: result.secure_url,
      public_id: result.public_id,
      duration: result.duration,
      format: result.format,
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

  // If URL already points to Cloudinary account, skip re-upload
  if (url.includes('res.cloudinary.com') && url.includes(process.env.CLOUDINARY_CLOUD_NAME)) {
    // Best-effort extract public_id from Cloudinary URL
    let public_id = null
    try {
      const m = url.match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)/)
      if (m && m[1]) {
        public_id = m[1].split(/[.?]/)[0] // remove extension/params
      }
    } catch (e) {
      // ignore extraction errors
    }

    return res.json({
      success: true,
      data: {
        url,
        public_id,
        source: 'cloudinary'
      }
    })
  }

  // Server-side fetch to avoid CORS errors
  const resp = await fetch(url)
  if (!resp.ok) {
    res.status(400)
    throw new Error('Failed to fetch external image')
  }

  // Validate content-type
  const contentType = resp.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) {
    res.status(400)
    throw new Error('URL does not point to an image')
  }

  // Enforce size limit (5MB)
  const maxBytes = 5 * 1024 * 1024
  const contentLength = resp.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    res.status(400)
    throw new Error('Image exceeds 5MB limit')
  }

  // Convert to buffer and upload to Cloudinary
  const arrayBuffer = await resp.arrayBuffer()
  if (arrayBuffer.byteLength > maxBytes) {
    res.status(400)
    throw new Error('Image exceeds 5MB limit')
  }

  const buffer = Buffer.from(arrayBuffer)
  const result = await uploadToCloudinary(buffer, {
    folder: 'seemee/images'
  })

  res.json({
    success: true,
    data: {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      source: 'uploaded'
    }
  })
})

// @desc    Delete media from Cloudinary
// @route   DELETE /api/upload/delete/:public_id
// @access  Admin
export const deleteMedia = asyncHandler(async (req, res) => {
  const { public_id } = req.params

  await cloudinary.uploader.destroy(public_id, {
    resource_type: 'auto',
  })

  res.json({ success: true, message: 'Deleted successfully' })
})
