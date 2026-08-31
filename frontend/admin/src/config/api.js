const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (import.meta.env.PROD) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/$/, '')
    }
    return 'https://seeme2-0.vercel.app'
  }
  return (envUrl || 'http://localhost:5000').replace(/\/$/, '')
}

const API_BASE_URL = getApiBaseUrl()

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
  APPROVE_COD: (id) => `${API_BASE_URL}/api/orders/${id}/approve-cod`,
  REJECT_COD: (id) => `${API_BASE_URL}/api/orders/${id}/reject-cod`,
  SHIPPING: {
    RATE: `${API_BASE_URL}/api/shipping/rate`,
    CREATE: `${API_BASE_URL}/api/shipping/create`,
    SHIP: `${API_BASE_URL}/api/shipping/ship`,
    MANIFEST: `${API_BASE_URL}/api/shipping/manifest`,
    LABEL: `${API_BASE_URL}/api/shipping/label`,
    INVOICE: `${API_BASE_URL}/api/shipping/invoice`,
    TRACK: `${API_BASE_URL}/api/shipping/track`,
    TRACK_BY_ID: `${API_BASE_URL}/api/shipping/track-by-id`,
    CANCEL: `${API_BASE_URL}/api/shipping/cancel`
  },
  NEW_ARRIVALS: `${API_BASE_URL}/api/new-arrivals`,
  ADMIN: {
    BASE: `${API_BASE_URL}/api/admin`,
    SEARCH: `${API_BASE_URL}/api/admin/search`,
    ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
    INVENTORY: `${API_BASE_URL}/api/admin/inventory`,
    INVENTORY_IMPORT_TEMPLATE: `${API_BASE_URL}/api/admin/inventory/import/template`,
    INVENTORY_IMPORT_PREVIEW: `${API_BASE_URL}/api/admin/inventory/import/preview`,
    INVENTORY_IMPORT_CONFIRM: `${API_BASE_URL}/api/admin/inventory/import/confirm`,
    CUSTOMERS: `${API_BASE_URL}/api/admin/customers`,
    DASHBOARD_SUMMARY: `${API_BASE_URL}/api/admin/dashboard-summary`,
    COUPONS: `${API_BASE_URL}/api/admin/coupons`,
    REFUNDS: `${API_BASE_URL}/api/admin/refunds`,
    REFUND_APPROVE: (id) => `${API_BASE_URL}/api/admin/refunds/${id}/approve`,
    REFUND_REJECT: (id) => `${API_BASE_URL}/api/admin/refunds/${id}/reject`
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
  BRANDS: `${API_BASE_URL}/api/brands`,
  REELS: `${API_BASE_URL}/api/reels`,
  REELS_ALL: `${API_BASE_URL}/api/reels/all`,
  PUSH: {
    VAPID_KEY: `${API_BASE_URL}/api/notifications/vapid-key`,
    SUBSCRIBE: `${API_BASE_URL}/api/notifications/subscribe`,
    UNSUBSCRIBE: `${API_BASE_URL}/api/notifications/unsubscribe`,
    STATUS: `${API_BASE_URL}/api/notifications/status`,
    SEND_TEST: `${API_BASE_URL}/api/notifications/send-test`
  },
  NOTIFICATIONS: {
    BASE: `${API_BASE_URL}/api/notifications`,
    UNREAD_COUNT: `${API_BASE_URL}/api/notifications/unread-count`,
    MARK_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/api/notifications/read-all`,
    DELETE: (id) => `${API_BASE_URL}/api/notifications/${id}`,
    CLEAR_ALL: `${API_BASE_URL}/api/notifications/clear-all`
  }
}
