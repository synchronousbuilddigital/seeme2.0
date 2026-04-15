import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ================= MULTER CONFIG =================
const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  }
});

// ================= HELPER FUNCTION =================
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ================= ROUTES =================

// 🔹 Upload Single Image
router.post(
  '/image',
  protect,
  admin,
  imageUpload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'my_app/images',
      });

      res.json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        },
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 🔹 Upload Multiple Images
router.post(
  '/images',
  protect,
  admin,
  imageUpload.array('images', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, { folder: 'my_app/images' })
      );

      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        data: results.map(r => ({
          url: r.secure_url,
          public_id: r.public_id,
        })),
      });
    } catch (error) {
      console.error('Multiple images upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 🔹 Upload Video
router.post(
  '/video',
  protect,
  admin,
  videoUpload.single('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        resource_type: 'video',
        folder: 'my_app/videos',
      });

      res.json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          duration: result.duration,
          format: result.format,
        },
      });
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 🔹 Delete Media (IMPORTANT)
router.delete('/delete/:public_id', protect, admin, async (req, res) => {
  try {
    const { public_id } = req.params;

    await cloudinary.uploader.destroy(public_id, {
      resource_type: 'auto', // works for image + video
    });

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;