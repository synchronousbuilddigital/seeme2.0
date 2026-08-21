import express from 'express'
import multer from 'multer'
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
import * as refundController from '../controllers/refundController.js'
import {
  downloadImportTemplate,
  previewImport,
  confirmImport
} from '../controllers/inventoryImportController.js'

const router = express.Router()

// Multer memory storage for Excel files (10MB limit)
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

router.use(protect)
router.use(admin)

router.get('/search', globalSearch)
router.get('/analytics', getAnalytics)
router.get('/inventory', getInventoryStats)
router.get('/customers', getCustomers)
router.put('/orders/:id/status', updateOrderStatus)
router.put('/products/bulk', bulkUpdateProducts)
router.get('/dashboard-summary', getDashboardSummary)

// Admin Inventory Excel Import Endpoints
router.get('/inventory/import/template', downloadImportTemplate)
router.post('/inventory/import/preview', (req, res, next) => {
  excelUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('⚠️ Excel upload error:', err.message)
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` })
    }
    next()
  })
}, previewImport)
router.post('/inventory/import/confirm', confirmImport)

// Admin Refund endpoints
router.get('/refunds', refundController.getAllRefunds)
router.post('/refunds/:refundId/approve', refundController.approveRefund)
router.post('/refunds/:refundId/reject', refundController.rejectRefund)

export default router


