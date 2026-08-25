import express from 'express'
import multer from 'multer'
import * as uploadController from '../controllers/uploadController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// ─── Multer Config ─────────────────────────────────────
const storage = multer.memoryStorage()

const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  }
})

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true)
    else cb(new Error('Only video files are allowed'))
  }
})

// ─── Routes ────────────────────────────────────────────

// Upload single image (admin)
router.post('/image', protect, admin, imageUpload.any(), uploadController.uploadImage)

// Upload multiple images (admin)
router.post('/images', protect, admin, imageUpload.any(), uploadController.uploadImages)

// Upload video (admin)
router.post('/video', protect, admin, videoUpload.any(), uploadController.uploadVideo)
// Upload image by providing external URL in JSON body: { url: 'https://...' }
router.post('/image-from-url', protect, admin, uploadController.uploadImageFromUrl)

// Delete media (admin — supports /delete/:public_id, /delete/*, and POST /delete)
router.delete('/delete/*', protect, admin, uploadController.deleteMedia)
router.delete('/delete/:public_id', protect, admin, uploadController.deleteMedia)
router.post('/delete', protect, admin, uploadController.deleteMedia)

export default router