import express from 'express'
import { protect, admin } from '../middleware/auth.js'
import { globalSearch } from '../controllers/searchController.js'
import { 
  getAnalytics, 
  getInventoryStats, 
  updateOrderStatus, 
  bulkUpdateProducts, 
  getCustomers,
  getDashboardSummary
} from '../controllers/adminController.js'

const router = express.Router()

router.use(protect)
router.use(admin)

router.get('/search', globalSearch)
router.get('/analytics', getAnalytics)
router.get('/inventory', getInventoryStats)
router.get('/customers', getCustomers)
router.put('/orders/:id/status', updateOrderStatus)
router.put('/products/bulk', bulkUpdateProducts)
router.get('/dashboard-summary', getDashboardSummary)

export default router
