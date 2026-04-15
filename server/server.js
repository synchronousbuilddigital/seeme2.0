import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import uploadRoutes from './routes/upload.js'
import newArrivalRoutes from './routes/newArrivals.js'
import magazineRoutes from './routes/magazine.js'
import carouselRoutes from './routes/carousel.js'
import siteSettingsRoutes from './routes/siteSettings.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../public/images')))
app.use('/videos', express.static(path.join(__dirname, '../public/videos')))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/new-arrivals', newArrivalRoutes)
app.use('/api/magazine', magazineRoutes)
app.use('/api/carousel', carouselRoutes)
app.use('/api/site-settings', siteSettingsRoutes)

// MongoDB Connection (only for local development)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seemee')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err))
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

const PORT = process.env.PORT || 5000

// For Vercel serverless, export the app
export default app

// Only listen if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
}
