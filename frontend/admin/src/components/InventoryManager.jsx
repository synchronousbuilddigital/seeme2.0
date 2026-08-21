import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest, withAuthHeader } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './InventoryManager.css'

const ALL_AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']

const InventoryManager = () => {
  const [inventory, setInventory] = useState({
    allProducts: [],
    lowStockProducts: [],
    outOfStockProducts: [],
    healthyProducts: [],
    totalProducts: 0,
    totalLowStock: 0,
    totalOutOfStock: 0,
    totalHealthy: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'out' | 'low' | 'healthy'
  const [sortBy, setSortBy] = useState('stock-asc') // 'stock-asc' | 'stock-desc' | 'name'

  const [restockProduct, setRestockProduct] = useState(null)
  const [customQty, setCustomQty] = useState('')
  const [restockTab, setRestockTab] = useState('sizes') // 'sizes' | 'total'
  const [sizeStockState, setSizeStockState] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)

  // Bulk Excel Import Modal State
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState('upload') // 'upload' | 'preview' | 'result'
  const [importFile, setImportFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [importMode, setImportMode] = useState('add_and_update') // 'add_and_update' | 'add_only' | 'update_only'
  const [previewTab, setPreviewTab] = useState('valid') // 'valid' | 'errors'
  const [importResult, setImportResult] = useState(null)
  const [isExecutingImport, setIsExecutingImport] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    fetchInventory()
    const interval = setInterval(fetchInventory, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchInventory = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.INVENTORY, { auth: true })
      if (data.success) {
        setInventory(data.data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProductStockOptimistically = (productId, newStockVal, newSizeStock) => {
    const updatedStock = Math.max(0, parseInt(newStockVal) || 0)

    setInventory(prev => {
      const updateList = (list) => (list || []).map(p => {
        if (p._id === productId) {
          const updatedProd = { ...p, stock: updatedStock }
          if (newSizeStock) {
            updatedProd.sizeStock = newSizeStock
            updatedProd.sizes = newSizeStock.filter(s => Number(s.quantity) > 0).map(s => s.size)
          }
          return updatedProd
        }
        return p
      })

      const all = updateList(prev.allProducts)
      const low = all.filter(p => p.stock > 0 && p.stock <= 10)
      const out = all.filter(p => p.stock <= 0)
      const healthy = all.filter(p => p.stock > 10)

      return {
        ...prev,
        allProducts: all,
        lowStockProducts: low,
        outOfStockProducts: out,
        healthyProducts: healthy,
        totalProducts: all.length,
        totalLowStock: low.length,
        totalOutOfStock: out.length,
        totalHealthy: healthy.length
      }
    })
  }

  const handleUpdateStock = async (productId, newStock, newSizeStock) => {
    const targetStock = Math.max(0, parseInt(newStock) || 0)
    const currentProd = inventory.allProducts?.find(p => p._id === productId)
    const prevStock = currentProd ? currentProd.stock : 0
    const prevSizeStock = currentProd ? currentProd.sizeStock : []

    // ⚡ Instant Optimistic Local Update (0ms delay)
    updateProductStockOptimistically(productId, targetStock, newSizeStock)

    // ⚡ Background Async API Sync (Non-blocking)
    try {
      const bodyPayload = { stock: targetStock }
      if (newSizeStock) {
        bodyPayload.sizeStock = newSizeStock
        bodyPayload.sizes = newSizeStock.filter(s => Number(s.quantity) > 0).map(s => s.size)
      }

      const data = await apiRequest(`${API_ENDPOINTS.PRODUCTS}/${productId}`, {
        method: 'PUT',
        auth: true,
        body: bodyPayload
      })
      if (!data.success) {
        // Rollback if request fails
        updateProductStockOptimistically(productId, prevStock, prevSizeStock)
      }
    } catch (error) {
      console.error('Failed to update stock:', error)
      updateProductStockOptimistically(productId, prevStock, prevSizeStock)
    }
  }

  const openRestockModal = (product) => {
    setRestockProduct(product)
    setCustomQty(product.stock ? product.stock.toString() : '0')
    setRestockTab('sizes')

    const sizeMap = {}
    if (Array.isArray(product.sizeStock)) {
      product.sizeStock.forEach(item => {
        if (item && item.size) {
          sizeMap[item.size] = Number(item.quantity) || 0
        }
      })
    }

    const currentSizes = Array.isArray(product.sizes) ? product.sizes : []
    const isSizeStockEmpty = Object.keys(sizeMap).length === 0

    // Initialize all standard sizes
    const initialSizes = ALL_AVAILABLE_SIZES.map(sz => {
      let qty = 0
      if (sizeMap[sz] !== undefined) {
        qty = sizeMap[sz]
      } else if (isSizeStockEmpty && currentSizes.includes(sz)) {
        qty = Math.max(1, Math.floor((product.stock || 0) / (currentSizes.length || 1)))
      }
      return { size: sz, quantity: qty }
    })

    setSizeStockState(initialSizes)
  }

  const handleSizeQtyChange = (sizeName, newQty) => {
    const parsedQty = Math.max(0, parseInt(newQty) || 0)
    setSizeStockState(prev => prev.map(s => s.size === sizeName ? { ...s, quantity: parsedQty } : s))
  }

  const handleBulkAddAllSizes = (increment) => {
    setSizeStockState(prev => prev.map(s => ({ ...s, quantity: Math.max(0, (Number(s.quantity) || 0) + increment) })))
  }

  const handleSetAllSizesTo = (targetVal) => {
    setSizeStockState(prev => prev.map(s => ({ ...s, quantity: Math.max(0, targetVal) })))
  }

  const totalCalculatedFromSizes = useMemo(() => {
    return sizeStockState.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  }, [sizeStockState])

  const submitSizeRestock = () => {
    if (!restockProduct) return
    const activeSizeStock = sizeStockState.map(s => ({
      size: s.size,
      quantity: Math.max(0, parseInt(s.quantity) || 0)
    }))
    handleUpdateStock(restockProduct._id, totalCalculatedFromSizes, activeSizeStock)
    setRestockProduct(null)
  }

  const submitRestock = (newStock) => {
    if (restockProduct && !isNaN(newStock)) {
      handleUpdateStock(restockProduct._id, Math.max(0, parseInt(newStock)))
      setRestockProduct(null)
    }
  }

  // Filtered and Sorted Products list
  const filteredProducts = useMemo(() => {
    let list = []
    if (activeFilter === 'out') {
      list = inventory.outOfStockProducts || []
    } else if (activeFilter === 'low') {
      list = inventory.lowStockProducts || []
    } else if (activeFilter === 'healthy') {
      list = inventory.healthyProducts || []
    } else {
      list = inventory.allProducts || []
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'stock-asc') return a.stock - b.stock
      if (sortBy === 'stock-desc') return b.stock - a.stock
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })
  }, [inventory, activeFilter, searchQuery, sortBy])

  const exportInventoryToExcel = () => {
    const productsToExport = inventory.allProducts || []
    if (productsToExport.length === 0) {
      alert('No inventory items found to export.')
      return
    }

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Stock Status',
      'Total Units Available',
      'Price (INR)',
      'MRP / Discount Price (INR)',
      'Size Stock Breakdown'
    ]

    const rows = productsToExport.map(p => {
      const isOut = p.stock <= 0
      const isLow = p.stock > 0 && p.stock <= 10
      const status = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'

      let sizeBreakdownStr = 'N/A'
      if (Array.isArray(p.sizeStock) && p.sizeStock.length > 0) {
        const activeSizes = p.sizeStock
          .filter(s => s && s.size && Number(s.quantity) > 0)
          .map(s => `${s.size}: ${s.quantity}`)
        sizeBreakdownStr = activeSizes.length > 0 ? activeSizes.join(' | ') : 'All sizes out of stock'
      } else if (Array.isArray(p.sizes) && p.sizes.length > 0) {
        sizeBreakdownStr = p.sizes.join(', ')
      }

      return [
        escapeCsv(p.name),
        escapeCsv(p.sku || 'N/A'),
        escapeCsv(p.category || 'General'),
        escapeCsv(status),
        escapeCsv(p.stock ?? 0),
        escapeCsv(p.price || 0),
        escapeCsv(p.mrp || p.discountPrice || ''),
        escapeCsv(sizeBreakdownStr)
      ]
    })

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map(r => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const dateStr = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory_export_${dateStr}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Download Catalog Excel Template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN.INVENTORY_IMPORT_TEMPLATE, {
        headers: withAuthHeader()
      })
      if (!response.ok) throw new Error('Failed to download template file')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Seemee_Inventory_Import_Template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error downloading template: ' + err.message)
    }
  }

  // Validate Excel File & Fetch Preview Data
  const handleValidateExcel = async () => {
    if (!importFile) return
    setIsUploading(true)
    setImportError('')
    try {
      let data
      try {
        const formData = new FormData()
        formData.append('file', importFile)

        data = await apiRequest(API_ENDPOINTS.ADMIN.INVENTORY_IMPORT_PREVIEW, {
          method: 'POST',
          auth: true,
          isFormData: true,
          body: formData
        })
      } catch (formDataErr) {
        // Fallback to base64 JSON payload if multipart upload fails
        console.warn('⚠️ FormData upload failed, retrying with base64 payload:', formDataErr.message)
        const base64Str = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(importFile)
        })

        data = await apiRequest(API_ENDPOINTS.ADMIN.INVENTORY_IMPORT_PREVIEW, {
          method: 'POST',
          auth: true,
          body: {
            fileName: importFile.name,
            fileData: base64Str
          }
        })
      }

      if (data && data.success && data.data) {
        setPreviewData(data.data)
        setImportStep('preview')
        setPreviewTab(data.data.invalidCount > 0 ? 'errors' : 'valid')
      } else {
        setImportError((data && data.message) || 'Failed to parse Excel file')
      }
    } catch (err) {
      setImportError(err.message || 'Failed to validate Excel file')
    } finally {
      setIsUploading(false)
    }
  }

  // Confirm Import Execution
  const handleConfirmImport = async () => {
    if (!previewData || !previewData.validItems || previewData.validItems.length === 0) return
    setIsExecutingImport(true)
    setImportError('')

    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.INVENTORY_IMPORT_CONFIRM, {
        method: 'POST',
        auth: true,
        body: {
          items: previewData.validItems,
          mode: importMode
        }
      })

      if (data.success && data.data) {
        setImportResult(data.data)
        setImportStep('result')
        fetchInventory()
      } else {
        setImportError(data.message || 'Failed to complete import process')
      }
    } catch (err) {
      setImportError(err.message || 'Error during inventory import execution')
    } finally {
      setIsExecutingImport(false)
    }
  }

  // Download Error Report CSV
  const handleDownloadErrorReport = () => {
    const errorRows = previewData?.rows?.filter(r => !r.isValid) || []
    const resultErrors = importResult?.errors || []

    let csvContent = '\uFEFFRow Number,SKU,Product Name,Column / Field,Failed Value,Error Reason\r\n'

    if (errorRows.length > 0) {
      errorRows.forEach(r => {
        (r.errors || []).forEach(e => {
          csvContent += `"${r.rowNum}","${(r.sku || '').replace(/"/g, '""')}","${(r.name || '').replace(/"/g, '""')}","${(e.column || '').replace(/"/g, '""')}","${String(e.value || '').replace(/"/g, '""')}","${(e.reason || '').replace(/"/g, '""')}"\r\n`
        })
      })
    } else if (resultErrors.length > 0) {
      resultErrors.forEach(e => {
        csvContent += `"${e.rowNum || 'N/A'}","${(e.sku || '').replace(/"/g, '""')}","${(e.name || '').replace(/"/g, '""')}","Database Write","N/A","${(e.reason || '').replace(/"/g, '""')}"\r\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_import_error_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const closeImportModal = () => {
    setShowImportModal(false)
    setImportStep('upload')
    setImportFile(null)
    setPreviewData(null)
    setImportResult(null)
    setImportError('')
  }

  if (loading) {
    return (
      <div className="inventory-loading-state">
        <div className="spinner"></div>
        <p>Loading Inventory Control Center...</p>
      </div>
    )
  }

  return (
    <div className="inventory-manager-redesign">
      {/* Header Bar */}
      <div className="inventory-header">
        <div className="live-sync-badge">
          <span className="pulse-dot"></span>
          Live Inventory Sync
        </div>
        <div className="header-action-buttons">
          <button 
            className="export-excel-btn import-btn" 
            onClick={() => setShowImportModal(true)}
            title="Bulk import products from Excel spreadsheet (.xlsx / .xls)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            📥 Import Excel
          </button>
          <button 
            className="export-excel-btn" 
            onClick={exportInventoryToExcel}
            title="Download complete inventory Excel/CSV report"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            📊 Export Inventory (Excel)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="inventory-kpi-grid">
        <motion.div 
          className={`kpi-card out-of-stock ${activeFilter === 'out' ? 'active' : ''}`}
          whileHover={{ y: -4 }}
          onClick={() => setActiveFilter(activeFilter === 'out' ? 'all' : 'out')}
        >
          <div className="kpi-icon red">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Out of Stock</span>
            <span className="kpi-value text-red">{inventory.totalOutOfStock}</span>
            <span className="kpi-sub">Immediate Action Needed</span>
          </div>
        </motion.div>

        <motion.div 
          className={`kpi-card low-stock ${activeFilter === 'low' ? 'active' : ''}`}
          whileHover={{ y: -4 }}
          onClick={() => setActiveFilter(activeFilter === 'low' ? 'all' : 'low')}
        >
          <div className="kpi-icon gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Low Stock Warning</span>
            <span className="kpi-value text-gold">{inventory.totalLowStock}</span>
            <span className="kpi-sub">≤ 10 Units Remaining</span>
          </div>
        </motion.div>

        <motion.div 
          className={`kpi-card healthy ${activeFilter === 'healthy' ? 'active' : ''}`}
          whileHover={{ y: -4 }}
          onClick={() => setActiveFilter(activeFilter === 'healthy' ? 'all' : 'healthy')}
        >
          <div className="kpi-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Optimal Stock</span>
            <span className="kpi-value text-green">{inventory.totalHealthy || 0}</span>
            <span className="kpi-sub">Healthy Inventory</span>
          </div>
        </motion.div>

        <motion.div 
          className={`kpi-card total ${activeFilter === 'all' ? 'active' : ''}`}
          whileHover={{ y: -4 }}
          onClick={() => setActiveFilter('all')}
        >
          <div className="kpi-icon dark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total SKUs Tracked</span>
            <span className="kpi-value">{inventory.totalProducts || 0}</span>
            <span className="kpi-sub">All Active Catalog Items</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content Card */}
      <div className="inventory-content-card">
        {/* Toolbar: Search, Filters & Sorting */}
        <div className="inventory-toolbar">
          <div className="search-box-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              className="inventory-search-input"
              placeholder="Search by product name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>&times;</button>
            )}
          </div>

          <div className="toolbar-controls">
            <div className="filter-pills">
              <button 
                className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All ({inventory.totalProducts || 0})
              </button>
              <button 
                className={`filter-pill red ${activeFilter === 'out' ? 'active' : ''}`}
                onClick={() => setActiveFilter('out')}
              >
                Out of Stock ({inventory.totalOutOfStock})
              </button>
              <button 
                className={`filter-pill gold ${activeFilter === 'low' ? 'active' : ''}`}
                onClick={() => setActiveFilter('low')}
              >
                Low Stock ({inventory.totalLowStock})
              </button>
              <button 
                className={`filter-pill green ${activeFilter === 'healthy' ? 'active' : ''}`}
                onClick={() => setActiveFilter('healthy')}
              >
                Healthy ({inventory.totalHealthy || 0})
              </button>
            </div>

            <div className="sort-wrapper">
              <label>Sort:</label>
              <select 
                className="inventory-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="stock-asc">Stock: Low to High</option>
                <option value="stock-desc">Stock: High to Low</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="desktop-only-table">
          {filteredProducts.length === 0 ? (
            <div className="empty-inventory-state">
              <div className="empty-icon">📦</div>
              <h4>No inventory items found</h4>
              <p>No products match your current search query or filter selection.</p>
              {(searchQuery || activeFilter !== 'all') && (
                <button className="reset-filters-btn" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
                  Reset Filters & Search
                </button>
              )}
            </div>
          ) : (
            <table className="lux-inventory-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Status & Stock Meter</th>
                  <th>Available Quantity</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isOut = product.stock <= 0
                  const isLow = product.stock > 0 && product.stock <= 10
                  const maxDisplayStock = 50
                  const meterPct = isOut ? 0 : Math.min(100, (product.stock / maxDisplayStock) * 100)

                  return (
                    <tr key={product._id} className={isOut ? 'row-critical' : isLow ? 'row-warning' : 'row-healthy'}>
                      <td>
                        <div className="table-product-info">
                          <img src={getImageUrl(product.images?.[0])} alt={product.name} className="product-thumb" />
                          <div>
                            <span className="product-title">{product.name}</span>
                            <span className="product-cat">{product.category || 'Luxury Collection'}</span>
                            {Array.isArray(product.sizeStock) && product.sizeStock.filter(st => st.quantity > 0 && st.size !== 'Custom').length > 0 && (
                              <div className="table-size-pills-row">
                                {product.sizeStock.filter(st => st.quantity > 0 && st.size !== 'Custom').map((st, idx) => (
                                  <span key={idx} className="size-pill-tag in">
                                    {st.size}: {st.quantity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="sku-badge">{product.sku || 'N/A'}</span>
                      </td>
                      <td>
                        <div className="stock-health-cell">
                          <div className="status-badge-wrapper">
                            {isOut && <span className="status-badge red">Out of Stock</span>}
                            {isLow && <span className="status-badge gold">Low Stock ({product.stock} left)</span>}
                            {!isOut && !isLow && <span className="status-badge green">In Stock</span>}
                          </div>
                          <div className="stock-progress-track">
                            <div 
                              className={`stock-progress-bar ${isOut ? 'red' : isLow ? 'gold' : 'green'}`}
                              style={{ width: `${meterPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="quantity-count-display">
                          <span className={`count-number ${isOut ? 'text-red' : isLow ? 'text-gold' : ''}`}>
                            {product.stock}
                          </span>
                          <span className="unit-label">Units</span>
                        </div>
                      </td>

                      <td className="text-right">
                        <button 
                          className="restock-action-btn"
                          onClick={() => openRestockModal(product)}
                        >
                          Restock / Adjust
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Responsive Feed */}
        <div className="mobile-inventory-feed">
          {filteredProducts.length === 0 ? (
            <div className="empty-inventory-state">
              <div className="empty-icon">📦</div>
              <h4>No products found</h4>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isOut = product.stock <= 0
              const isLow = product.stock > 0 && product.stock <= 10

              return (
                <div key={product._id} className={`mobile-lux-inv-card ${isOut ? 'critical' : isLow ? 'warning' : 'healthy'}`}>
                  <div className="mobile-card-header">
                    <img src={getImageUrl(product.images?.[0])} alt={product.name} className="mobile-thumb" />
                    <div className="mobile-info">
                      <div className="mobile-status-row">
                        {isOut && <span className="status-badge red">Out of Stock</span>}
                        {isLow && <span className="status-badge gold">Low Stock</span>}
                        {!isOut && !isLow && <span className="status-badge green">In Stock</span>}
                        <span className="sku-tag">SKU: {product.sku || 'N/A'}</span>
                      </div>
                      <h4>{product.name}</h4>
                      <span className="cat-tag">{product.category || 'Luxury'}</span>
                      {Array.isArray(product.sizeStock) && product.sizeStock.filter(st => st.quantity > 0 && st.size !== 'Custom').length > 0 && (
                        <div className="table-size-pills-row" style={{ marginTop: '6px' }}>
                          {product.sizeStock.filter(st => st.quantity > 0 && st.size !== 'Custom').map((st, idx) => (
                            <span key={idx} className="size-pill-tag in">
                              {st.size}: {st.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mobile-card-footer">
                    <div className="mobile-stock-display">
                      <span className="box-label">Stock:</span> <strong>{product.stock} Units</strong>
                    </div>

                    <button 
                      className={`mobile-restock-trigger ${isOut ? 'red-btn' : ''}`}
                      onClick={() => openRestockModal(product)}
                    >
                      Restock
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Restock & Quantity Adjustment Modal */}
      <AnimatePresence>
        {restockProduct && (
          <div className="lux-modal-overlay" onClick={() => setRestockProduct(null)}>
            <motion.div 
              className="lux-restock-modal"
              style={{ maxWidth: '650px' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-top-bar">
                <div>
                  <h3>Update Product Inventory</h3>
                  <span className="modal-sub">Restock individual sizes (S, M, L, XL...) or total units</span>
                </div>
                <button className="modal-close-icon" onClick={() => setRestockProduct(null)}>&times;</button>
              </div>

              <div className="modal-body-content">
                <div className="modal-product-summary">
                  <img src={getImageUrl(restockProduct.images?.[0])} alt={restockProduct.name} className="summary-thumb" />
                  <div className="summary-details">
                    <h4>{restockProduct.name}</h4>
                    <span className="summary-sku">SKU: {restockProduct.sku || 'N/A'}</span>
                    <div className="summary-current-stock">
                      Current Total Stock: <strong>{restockProduct.stock} Units</strong>
                    </div>
                  </div>
                </div>

                {/* Restock Mode Switcher Tabs */}
                <div className="restock-tab-header">
                  <button 
                    type="button" 
                    className={`restock-tab-btn ${restockTab === 'sizes' ? 'active' : ''}`}
                    onClick={() => setRestockTab('sizes')}
                  >
                    📏 Restock By Size (XS, S, M, L, XL...)
                  </button>
                  <button 
                    type="button" 
                    className={`restock-tab-btn ${restockTab === 'total' ? 'active' : ''}`}
                    onClick={() => setRestockTab('total')}
                  >
                    📦 Total Units Quick Add
                  </button>
                </div>

                {restockTab === 'sizes' ? (
                  <div className="size-restock-section">
                    <label className="section-label">Quick Add To All Sizes:</label>
                    <div className="size-stock-bulk-actions">
                      <button type="button" className="bulk-btn-chip" onClick={() => handleBulkAddAllSizes(5)}>+5 To All</button>
                      <button type="button" className="bulk-btn-chip" onClick={() => handleBulkAddAllSizes(10)}>+10 To All</button>
                      <button type="button" className="bulk-btn-chip" onClick={() => handleBulkAddAllSizes(25)}>+25 To All</button>
                      <button type="button" className="bulk-btn-chip" onClick={() => handleSetAllSizesTo(10)}>Set All = 10</button>
                      <button type="button" className="bulk-btn-chip" onClick={() => handleSetAllSizesTo(20)}>Set All = 20</button>
                      <button type="button" className="bulk-btn-chip clear" onClick={() => handleSetAllSizesTo(0)}>Clear All (0)</button>
                    </div>

                    <label className="section-label">Individual Size Stock Quantities:</label>
                    <div className="size-stock-grid-container">
                      {sizeStockState.map((stItem) => {
                        const qty = Number(stItem.quantity) || 0
                        return (
                          <div key={stItem.size} className={`size-stock-card ${qty > 0 ? 'active-stock' : ''}`}>
                            <div className="size-card-top">
                              <span className="size-name-badge">{stItem.size}</span>
                              <span className={`status-tag ${qty > 0 ? '' : 'out'}`}>
                                {qty > 0 ? `${qty} in stock` : 'OUT'}
                              </span>
                            </div>

                            <div className="size-stepper-box">
                              <button 
                                type="button" 
                                disabled={qty <= 0}
                                onClick={() => handleSizeQtyChange(stItem.size, qty - 1)}
                              >-</button>
                              <input 
                                type="number" 
                                min="0" 
                                value={stItem.quantity}
                                onChange={(e) => handleSizeQtyChange(stItem.size, e.target.value)}
                              />
                              <button 
                                type="button" 
                                onClick={() => handleSizeQtyChange(stItem.size, qty + 1)}
                              >+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="total-calculated-summary">
                      <span>Total Calculated Inventory:</span>
                      <strong>{totalCalculatedFromSizes} Units Total</strong>
                    </div>

                    <div className="modal-footer-actions">
                      <button className="confirm-save-btn" onClick={submitSizeRestock}>
                        💾 Save Size Stock Breakdown ({totalCalculatedFromSizes} Units)
                      </button>
                      <button className="cancel-btn" onClick={() => setRestockProduct(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="total-restock-section">
                    <div className="preset-section">
                      <label className="section-label">Quick Add Units to Current Stock ({restockProduct.stock}):</label>
                      <div className="preset-grid">
                        <button type="button" onClick={() => submitRestock(restockProduct.stock + 5)}>+5 Units</button>
                        <button type="button" onClick={() => submitRestock(restockProduct.stock + 10)}>+10 Units</button>
                        <button type="button" onClick={() => submitRestock(restockProduct.stock + 25)}>+25 Units</button>
                        <button type="button" onClick={() => submitRestock(restockProduct.stock + 50)}>+50 Units</button>
                        <button type="button" onClick={() => submitRestock(restockProduct.stock + 100)}>+100 Units</button>
                      </div>
                    </div>

                    <div className="exact-input-section" style={{ marginTop: '16px' }}>
                      <label className="section-label">Or Enter Exact Total Quantity:</label>
                      <div className="exact-input-wrapper">
                        <input 
                          type="number" 
                          min="0" 
                          className="exact-qty-input"
                          value={customQty} 
                          onChange={(e) => setCustomQty(e.target.value)}
                          placeholder="Enter new stock count"
                        />
                        <span className="input-unit">Units</span>
                      </div>
                    </div>

                    <div className="modal-footer-actions" style={{ marginTop: '18px' }}>
                      <button className="confirm-save-btn" onClick={() => submitRestock(customQty)}>
                        Save Total Stock Quantity
                      </button>
                      <button className="cancel-btn" onClick={() => setRestockProduct(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excel Bulk Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="lux-modal-overlay" onClick={closeImportModal}>
            <motion.div 
              className="lux-restock-modal import-modal-wide"
              style={{ maxWidth: '880px', width: '94%' }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-top-bar">
                <div>
                  <h3>Bulk Product Excel Import</h3>
                  <span className="modal-sub">Upload product catalog via Excel spreadsheet (.xlsx / .xls)</span>
                </div>
                <button className="modal-close-icon" onClick={closeImportModal}>&times;</button>
              </div>

              <div className="modal-body-content">
                {importError && (
                  <div className="import-error-banner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>{importError}</span>
                  </div>
                )}

                {/* STEP 1: FILE UPLOAD */}
                {importStep === 'upload' && (
                  <div className="import-upload-step">
                    <div className="template-download-box">
                      <div className="template-info">
                        <div className="excel-icon-chip">📊</div>
                        <div>
                          <h4>Need the Catalog Excel Format?</h4>
                          <p>Download our official pre-formatted Excel template with sample row & instructions.</p>
                        </div>
                      </div>
                      <button type="button" className="download-template-btn" onClick={handleDownloadTemplate}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Download Excel Template
                      </button>
                    </div>

                    <div className="drag-drop-zone">
                      <input 
                        type="file" 
                        accept=".xlsx, .xls"
                        id="excelFileInput"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setImportFile(e.target.files[0])
                            setImportError('')
                          }
                        }}
                      />
                      <label htmlFor="excelFileInput" className="dropzone-label">
                        <div className="dropzone-icon">📁</div>
                        <h4>{importFile ? importFile.name : 'Click or Drag & Drop Excel File (.xlsx / .xls)'}</h4>
                        <p>{importFile ? `${(importFile.size / 1024).toFixed(1)} KB — Ready to Parse` : 'Maximum file size: 10MB'}</p>
                        <span className="browse-file-btn">{importFile ? 'Change Selected File' : 'Browse Computer'}</span>
                      </label>
                    </div>

                    <div className="modal-footer-actions" style={{ marginTop: '20px' }}>
                      <button 
                        type="button"
                        className="confirm-save-btn"
                        disabled={!importFile || isUploading}
                        onClick={handleValidateExcel}
                      >
                        {isUploading ? '⏳ Parsing & Validating Excel...' : '🔍 Validate & Preview Excel'}
                      </button>
                      <button type="button" className="cancel-btn" onClick={closeImportModal}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PREVIEW & VALIDATION */}
                {importStep === 'preview' && previewData && (
                  <div className="import-preview-step">
                    {/* KPI Summary Grid */}
                    <div className="import-preview-kpi-grid">
                      <div className="preview-kpi-card total">
                        <span className="kpi-num">{previewData.totalRows}</span>
                        <span className="kpi-lbl">Total Rows</span>
                      </div>
                      <div className="preview-kpi-card valid">
                        <span className="kpi-num text-green">{previewData.validCount}</span>
                        <span className="kpi-lbl">Valid Items</span>
                      </div>
                      <div className="preview-kpi-card new">
                        <span className="kpi-num text-blue">{previewData.newCount}</span>
                        <span className="kpi-lbl">New Products</span>
                      </div>
                      <div className="preview-kpi-card updates">
                        <span className="kpi-num text-gold">{previewData.updateCount}</span>
                        <span className="kpi-lbl">Updates to Existing</span>
                      </div>
                      <div className="preview-kpi-card invalid">
                        <span className="kpi-num text-red">{previewData.invalidCount}</span>
                        <span className="kpi-lbl">Errors / Skipped</span>
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="import-mode-selector">
                      <label className="section-label">Import Mode:</label>
                      <div className="mode-options-row">
                        <label className={`mode-option-chip ${importMode === 'add_and_update' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="importMode" 
                            value="add_and_update" 
                            checked={importMode === 'add_and_update'} 
                            onChange={(e) => setImportMode(e.target.value)}
                          />
                          <span>✨ Add New & Update Existing</span>
                        </label>
                        <label className={`mode-option-chip ${importMode === 'add_only' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="importMode" 
                            value="add_only" 
                            checked={importMode === 'add_only'} 
                            onChange={(e) => setImportMode(e.target.value)}
                          />
                          <span>➕ Add New Products Only</span>
                        </label>
                        <label className={`mode-option-chip ${importMode === 'update_only' ? 'selected' : ''}`}>
                          <input 
                            type="radio" 
                            name="importMode" 
                            value="update_only" 
                            checked={importMode === 'update_only'} 
                            onChange={(e) => setImportMode(e.target.value)}
                          />
                          <span>🔄 Update Existing Products Only</span>
                        </label>
                      </div>
                    </div>

                    {/* Preview Tabs Header */}
                    <div className="preview-tab-header">
                      <button 
                        type="button" 
                        className={`tab-btn ${previewTab === 'valid' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('valid')}
                      >
                        ✅ Valid Items ({previewData.validCount})
                      </button>
                      <button 
                        type="button" 
                        className={`tab-btn ${previewTab === 'errors' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('errors')}
                      >
                        ❌ Errors & Skipped Rows ({previewData.invalidCount})
                      </button>
                    </div>

                    {/* Valid Products List Table */}
                    {previewTab === 'valid' && (
                      <div className="preview-table-wrapper">
                        {previewData.validCount === 0 ? (
                          <div className="empty-preview-msg">
                            <p>No valid items found in this Excel sheet.</p>
                          </div>
                        ) : (
                          <table className="preview-data-table">
                            <thead>
                              <tr>
                                <th>Row #</th>
                                <th>Action</th>
                                <th>SKU</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.rows.filter(r => r.isValid).map((row) => (
                                <tr key={row.rowNum}>
                                  <td>#{row.rowNum}</td>
                                  <td>
                                    <span className={`action-badge ${row.actionType === 'UPDATE' ? 'gold' : 'blue'}`}>
                                      {row.actionType === 'UPDATE' ? 'UPDATE' : 'CREATE'}
                                    </span>
                                  </td>
                                  <td><code>{row.sku}</code></td>
                                  <td><strong>{row.name}</strong></td>
                                  <td>{row.category}</td>
                                  <td>₹{Number(row.price).toLocaleString()}</td>
                                  <td>{row.stock} Units</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {/* Errors List Table */}
                    {previewTab === 'errors' && (
                      <div className="preview-table-wrapper">
                        {previewData.invalidCount === 0 ? (
                          <div className="empty-preview-msg">
                            <p>🎉 Excellent! No error rows found in your Excel file.</p>
                          </div>
                        ) : (
                          <table className="preview-data-table error-table">
                            <thead>
                              <tr>
                                <th>Row #</th>
                                <th>SKU / Name</th>
                                <th>Column</th>
                                <th>Value</th>
                                <th>Error Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.rows.filter(r => !r.isValid).map((row) => (
                                (row.errors || []).map((err, errIdx) => (
                                  <tr key={`${row.rowNum}-${errIdx}`}>
                                    <td>#{row.rowNum}</td>
                                    <td>{row.name !== 'Unnamed Product' ? row.name : row.sku}</td>
                                    <td><strong>{err.column}</strong></td>
                                    <td><code>{String(err.value || 'Empty')}</code></td>
                                    <td><span className="error-reason-tag">{err.reason}</span></td>
                                  </tr>
                                ))
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    <div className="modal-footer-actions" style={{ marginTop: '18px' }}>
                      <button 
                        type="button" 
                        className="confirm-save-btn"
                        disabled={previewData.validCount === 0 || isExecutingImport}
                        onClick={handleConfirmImport}
                      >
                        {isExecutingImport ? '⏳ Importing Products...' : `🚀 Confirm & Import (${previewData.validCount} Valid Items)`}
                      </button>

                      {previewData.invalidCount > 0 && (
                        <button type="button" className="bulk-btn-chip error-log-btn" onClick={handleDownloadErrorReport}>
                          📥 Download Error Report (CSV)
                        </button>
                      )}

                      <button type="button" className="cancel-btn" onClick={() => setImportStep('upload')}>
                        ⬅ Back / Re-select File
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: RESULT SUMMARY */}
                {importStep === 'result' && importResult && (
                  <div className="import-result-step">
                    <div className="result-success-banner">
                      <div className="success-icon">🎉</div>
                      <div>
                        <h3>Bulk Inventory Import Completed!</h3>
                        <p>Your database has been safely updated with the validated Excel catalog data.</p>
                      </div>
                    </div>

                    <div className="import-result-grid">
                      <div className="result-card">
                        <span className="result-num">{importResult.totalProcessed}</span>
                        <span className="result-lbl">Items Processed</span>
                      </div>
                      <div className="result-card green">
                        <span className="result-num">{importResult.importedCount}</span>
                        <span className="result-lbl">New Products Added</span>
                      </div>
                      <div className="result-card gold">
                        <span className="result-num">{importResult.updatedCount}</span>
                        <span className="result-lbl">Existing Products Updated</span>
                      </div>
                      <div className="result-card red">
                        <span className="result-num">{importResult.failedCount}</span>
                        <span className="result-lbl">Failed Write Operations</span>
                      </div>
                    </div>

                    <div className="modal-footer-actions" style={{ marginTop: '24px' }}>
                      {importResult.failedCount > 0 && (
                        <button type="button" className="bulk-btn-chip error-log-btn" onClick={handleDownloadErrorReport}>
                          📥 Download Failed Write Log
                        </button>
                      )}
                      <button type="button" className="confirm-save-btn" onClick={closeImportModal}>
                        ✓ Done & Refresh Inventory
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InventoryManager
