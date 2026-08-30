import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { getJwtSecret, getJwtRefreshSecret } from '../config/jwt.js'

export const generateToken = (id) => {
  const secret = getJwtSecret()
  return jwt.sign({ id }, secret, { expiresIn: '30d' })
}

export const generateRefreshToken = (id) => {
  const refreshSecret = getJwtRefreshSecret()
  return jwt.sign({ id }, refreshSecret, { expiresIn: '7d' })
}

export const verifyRefreshToken = (token) => {
  try {
    const refreshSecret = getJwtRefreshSecret()
    return jwt.verify(token, refreshSecret)
  } catch (error) {
    return null
  }
}

export const registerUser = async (userData) => {
  const { email, password, name, phone } = userData

  const cleanEmail = String(email || '').toLowerCase().trim()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Please enter a valid email address (e.g., user@example.com).')
  }

  const userExists = await User.findOne({ email: cleanEmail })
  if (userExists) {
    throw new Error('An account with this email address already exists.')
  }

  const user = await User.create({ email: cleanEmail, password, name, phone, role: 'customer' })
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
