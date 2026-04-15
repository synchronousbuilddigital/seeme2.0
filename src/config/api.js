// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  // Orders
  CREATE_RAZORPAY_ORDER: `${API_BASE_URL}/api/orders/create-razorpay-order`,
  VERIFY_PAYMENT: `${API_BASE_URL}/api/orders/verify-payment`,
  GET_ORDERS: `${API_BASE_URL}/api/orders`,
  
  // Products
  GET_PRODUCTS: `${API_BASE_URL}/api/products`,
  
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
}

// Razorpay Key (use environment variable in production)
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_id'

export default API_BASE_URL
