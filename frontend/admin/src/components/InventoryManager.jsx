import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './InventoryManager.css'

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
  const [isUpdating, setIsUpdating] = useState(false)

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

  const handleUpdateStock = async (productId, newStock) => {
    try {
      setIsUpdating(true)
      const data = await apiRequest(`${API_ENDPOINTS.PRODUCTS}/${productId}`, {
        method: 'PUT',
        auth: true,
        body: { stock: Math.max(0, parseInt(newStock) || 0) }
      })
      if (data.success) {
        await fetchInventory()
      }
    } catch (error) {
      alert('Failed to update stock')
    } finally {
      setIsUpdating(false)
    }
  }

  const openRestockModal = (product) => {
    setRestockProduct(product)
    setCustomQty(product.stock.toString())
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
        <div>
          <h2>Inventory Command Center</h2>
          <p className="subtitle">Real-time stock monitoring, automated low-stock alerts, and fast restock control.</p>
        </div>
        <div className="live-sync-badge">
          <span className="pulse-dot"></span>
          Live Inventory Sync
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
                  <th className="text-center">Quick Adjustment</th>
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
                      <td className="text-center">
                        <div className="inline-stepper">
                          <button 
                            className="step-btn"
                            disabled={isUpdating || product.stock <= 0}
                            onClick={() => handleUpdateStock(product._id, Math.max(0, product.stock - 1))}
                            title="Decrease quantity by 1"
                          >-</button>
                          <span className="stepper-val">{product.stock}</span>
                          <button 
                            className="step-btn"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStock(product._id, product.stock + 1)}
                            title="Increase quantity by 1"
                          >+</button>
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
                    </div>
                  </div>

                  <div className="mobile-card-footer">
                    <div className="mobile-stepper-box">
                      <span className="box-label">Stock:</span>
                      <div className="inline-stepper">
                        <button 
                          className="step-btn"
                          disabled={isUpdating || product.stock <= 0}
                          onClick={() => handleUpdateStock(product._id, Math.max(0, product.stock - 1))}
                        >-</button>
                        <span className="stepper-val">{product.stock}</span>
                        <button 
                          className="step-btn"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStock(product._id, product.stock + 1)}
                        >+</button>
                      </div>
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-top-bar">
                <div>
                  <h3>Update Inventory Stock</h3>
                  <span className="modal-sub">Set target units or quick add bulk stock</span>
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
                      Current Stock: <strong>{restockProduct.stock} Units</strong>
                    </div>
                  </div>
                </div>

                <div className="preset-section">
                  <label className="section-label">Quick Add Units to Current Stock:</label>
                  <div className="preset-grid">
                    <button type="button" onClick={() => submitRestock(restockProduct.stock + 5)}>+5 Units</button>
                    <button type="button" onClick={() => submitRestock(restockProduct.stock + 10)}>+10 Units</button>
                    <button type="button" onClick={() => submitRestock(restockProduct.stock + 25)}>+25 Units</button>
                    <button type="button" onClick={() => submitRestock(restockProduct.stock + 50)}>+50 Units</button>
                    <button type="button" onClick={() => submitRestock(restockProduct.stock + 100)}>+100 Units</button>
                  </div>
                </div>

                <div className="exact-input-section">
                  <label className="section-label">Or Enter Exact New Quantity:</label>
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

                <div className="modal-footer-actions">
                  <button className="confirm-save-btn" onClick={() => submitRestock(customQty)}>
                    Save Stock Quantity
                  </button>
                  <button className="cancel-btn" onClick={() => setRestockProduct(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InventoryManager
