// Simple test endpoint to verify Vercel deployment
export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Vercel serverless function is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasCloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      nodeEnv: process.env.NODE_ENV
    }
  })
}
