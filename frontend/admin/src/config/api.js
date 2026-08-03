const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://seeme2-0.vercel.app' : 'http://localhost:5000')).replace(/\/$/, '')

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    ME: `${API_BASE_URL}/api/auth/me`
  },
  PRODUCTS: `${API_BASE_URL}/api/products`,
  GET_CATEGORIES: `${API_BASE_URL}/api/products/categories/all`,
  COLLECTION_COUNT: `${API_BASE_URL}/api/products/collection/count`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  NEW_ARRIVALS: `${API_BASE_URL}/api/new-arrivals`,
  ADMIN: {
    BASE: `${API_BASE_URL}/api/admin`,
    SEARCH: `${API_BASE_URL}/api/admin/search`,
    ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
    INVENTORY: `${API_BASE_URL}/api/admin/inventory`,
    CUSTOMERS: `${API_BASE_URL}/api/admin/customers`,
    DASHBOARD_SUMMARY: `${API_BASE_URL}/api/admin/dashboard-summary`,
    COUPONS: `${API_BASE_URL}/api/admin/coupons`
  },
  UPLOAD: {
    IMAGE: `${API_BASE_URL}/api/upload/image`,
    IMAGES: `${API_BASE_URL}/api/upload/images`,
    VIDEO: `${API_BASE_URL}/api/upload/video`,
    IMAGE_FROM_URL: `${API_BASE_URL}/api/upload/image-from-url`
  },
  SITE_SETTINGS: `${API_BASE_URL}/api/site-settings`,
  MAGAZINE: `${API_BASE_URL}/api/magazine`,
  MAGAZINE_ALL: `${API_BASE_URL}/api/magazine/all`,
  HERO_CAROUSEL: `${API_BASE_URL}/api/carousel`,
  HERO_CAROUSEL_ALL: `${API_BASE_URL}/api/carousel/all`,
  REELS: `${API_BASE_URL}/api/reels`,
  REELS_ALL: `${API_BASE_URL}/api/reels/all`
}
