import User from '../models/User.js'
import jwt from 'jsonwebtoken'

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' })
}

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback', { expiresIn: '7d' })
}

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback')
  } catch (error) {
    return null
  }
}

export const registerUser = async (userData) => {
  const { email, password, name } = userData
  
  const userExists = await User.findOne({ email })
  if (userExists) {
    throw new Error('User already exists')
  }

  const user = await User.create({ email, password, name, role: 'customer' })
  return user
}

export const loginUser = async (credentials) => {
  const { email, password } = credentials
  
  const user = await User.findOne({ email })
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid credentials')
  }
  
  return user
}

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password')
  if (!user) {
    throw new Error('User not found')
  }
  return user
}
