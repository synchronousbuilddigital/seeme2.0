import dns from 'dns'
import mongoose from 'mongoose'

// Force Cloudflare and Google DNS to fix MongoDB Atlas SRV connection issues
dns.setServers(['1.1.1.1', '8.8.8.8'])

/**
 * Connect to MongoDB with retry logic and proper event handling.
 */
let isConnected = false

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing in .env')
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4
    })

    isConnected = true
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected')
      isConnected = false
    })

    return conn
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message)
    throw error // Let the caller handle retry or fail
  }
}

export default connectDB
