import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { getJwtSecret } from '../config/jwt.js'

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }

    const secret = getJwtSecret()
    const decoded = jwt.verify(token, secret)
    req.user = await User.findById(decoded.id).select('-password')

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    next()
  } catch (error) {
    console.warn('⚠️ [AUTH PROTECT 401]:', error.message)
    res.status(401).json({ success: false, message: 'Not authorized: ' + error.message })
  }
}

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (token) {
      const secret = getJwtSecret()
      const decoded = jwt.verify(token, secret)
      req.user = await User.findById(decoded.id).select('-password')
    }
  } catch (error) {
    req.user = null
  }
  next()
}

