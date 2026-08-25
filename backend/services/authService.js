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

  const userExists = await User.findOne({ email })
  if (userExists) {
    throw new Error('User already exists')
  }

  const user = await User.create({ email, password, name, phone, role: 'customer' })
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
