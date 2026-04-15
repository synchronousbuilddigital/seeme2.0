import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seemee')
    
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@seemee.com' })
    
    if (adminExists) {
      console.log('❌ Admin user already exists')
      process.exit(0)
    }

    const admin = await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@seemee.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: 'Admin',
      role: 'admin'
    })

    console.log('✅ Admin user created successfully')
    console.log('Email:', admin.email)
    console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()
