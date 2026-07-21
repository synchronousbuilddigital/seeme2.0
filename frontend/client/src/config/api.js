/**
 * API Configuration — Central endpoint registry for the See Mee client.
 * In development, Vite proxy handles /api → http://localhost:5000
 * In production, VITE_API_URL points to the deployed backend.
 */
export const getAdminUrl = () => {
  const url = import.meta.env.VITE_ADMIN_URL || (import.meta.env.PROD ? 'https://seeme2-0-inue.vercel.app' : 'http://localhost:3001')
  return url.replace(/\/$/, '').replace(/\/dashboard$/, '')
}

const getApiBaseUrl = () => {
  // Use VITE_API_URL from env
  // Fallback to the main backend URL in production if env is missing
  if (import.meta.env.PROD) {
    return (import.meta.env.VITE_API_URL || 'https://seeme2-0.vercel.app').replace(/\/$/, '')
  }
  
  // Local development fallback
  return (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')
}

const API_BASE_URL = getApiBaseUrl()

export const API_ENDPOINTS = {
  // ─── Auth ──────────────────────────────────────
  LOGIN:    `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  SIGNUP:   `${API_BASE_URL}/api/auth/signup`,
  ME:       `${API_BASE_URL}/api/auth/me`,
  AUTH_FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  AUTH_RESET_PASSWORD:  `${API_BASE_URL}/api/auth/reset-password`,

  // ─── Products ──────────────────────────────────
  PRODUCTS:         `${API_BASE_URL}/api/products`,
  COLLECTION_PRODUCTS: `${API_BASE_URL}/api/products?inCollection=true`,
  TOP_PRODUCTS:      `${API_BASE_URL}/api/products/top-three`,
  FEATURED_PRODUCTS: `${API_BASE_URL}/api/products?featured=true`,
  GET_CATEGORIES: `${API_BASE_URL}/api/products/categories/all`,
  COLLECTION_COUNT: `${API_BASE_URL}/api/products/collection/count`,

  // ─── Orders ────────────────────────────────────
  ORDERS:              `${API_BASE_URL}/api/orders`,
  ORDERS_MY:           `${API_BASE_URL}/api/orders/myorders`,
  CREATE_RAZORPAY_ORDER: `${API_BASE_URL}/api/orders/create-razorpay-order`,
  VERIFY_PAYMENT:      `${API_BASE_URL}/api/orders/verify-payment`,

  // ─── Users ─────────────────────────────────────
  USERS_PROFILE:   `${API_BASE_URL}/api/users/profile`,
  USERS_ADDRESSES: `${API_BASE_URL}/api/users/addresses`,
  USERS_WISHLIST:  `${API_BASE_URL}/api/users/wishlist`,
  USERS_CART:      `${API_BASE_URL}/api/users/cart`,

  // ─── Carousel ──────────────────────────────────
  CAROUSEL:     `${API_BASE_URL}/api/carousel`,
  CAROUSEL_ALL: `${API_BASE_URL}/api/carousel/all`,

  // ─── Magazine ──────────────────────────────────
  MAGAZINE:     `${API_BASE_URL}/api/magazine`,
  MAGAZINE_ALL: `${API_BASE_URL}/api/magazine/all`,

  // ─── New Arrivals ──────────────────────────────
  NEW_ARRIVALS: `${API_BASE_URL}/api/new-arrivals`,

  // ─── Site Settings ─────────────────────────────
  SITE_SETTINGS: `${API_BASE_URL}/api/site-settings`,

  // ─── Upload ────────────────────────────────────
  UPLOAD_IMAGE:  `${API_BASE_URL}/api/upload/image`,
  UPLOAD_IMAGES: `${API_BASE_URL}/api/upload/images`,
  UPLOAD_VIDEO:  `${API_BASE_URL}/api/upload/video`,
  UPLOAD_DELETE: `${API_BASE_URL}/api/upload/delete`,

  // ─── Health ────────────────────────────────────
  HEALTH: `${API_BASE_URL}/api/health`,
}

// Razorpay Key (use environment variable in production)
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_id'

export default API_BASE_URL
