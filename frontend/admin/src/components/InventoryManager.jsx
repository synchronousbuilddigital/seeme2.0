import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './InventoryManager.css'

const InventoryManager = () => {
  const [inventory, setInventory] = useState({
    lowStockProducts: [],
    outOfStockProducts: [],
    totalLowStock: 0,
    totalOutOfStock: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
    const interval = setInterval(fetchInventory, 30000) // Poll every 30s
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
      const data = await apiRequest(`${API_ENDPOINTS.PRODUCTS}/${productId}`, {
        method: 'PUT',
        auth: true,
        body: { stock: newStock }
      })
      if (data.success) {
        fetchInventory()
      }
    } catch (error) {
      alert('Failed to update stock')
    }
  }

  const [restockProduct, setRestockProduct] = useState(null)
  const [customQty, setCustomQty] = useState('')

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

  if (loading) return <div className="loading">Loading Inventory...</div>

  return (
    <div className="inventory-manager">
      <div className="inventory-stats">
        <div className="stat-pill low">
          <span className="label">Low Stock Warning</span>
          <span className="count">{inventory.totalLowStock}</span>
        </div>
        <div className="stat-pill out">
          <span className="label">Critical (Out of Stock)</span>
          <span className="count">{inventory.totalOutOfStock}</span>
        </div>
      </div>

      <section className="inventory-section">
        <h3>Critical Alerts (Out of Stock)</h3>
        {inventory.outOfStockProducts.length === 0 ? (
          <p className="empty-msg">No products out of stock. All items in stock!</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="inventory-table-container desktop-only-table">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Status</th>
                    <th>Stock Level</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.outOfStockProducts.map(product => (
                    <tr key={product._id} className="row-out">
                      <td className="product-cell">
                        <img src={getImageUrl(product.images?.[0])} alt={product.name} className="table-img" />
                        <span className="table-name">{product.name}</span>
                      </td>
                      <td className="sku-cell">{product.sku || 'N/A'}</td>
                      <td><span className="status-badge out">Out of Stock</span></td>
                      <td className="stock-cell">{product.stock}</td>
                      <td className="action-cell">
                        <button className="restock-btn" onClick={() => openRestockModal(product)}>Restock</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Card Feed */}
            <div className="mobile-inventory-feed">
              {inventory.outOfStockProducts.map(product => (
                <div key={product._id} className="mobile-inventory-card critical">
                  <div className="mobile-inv-top">
                    <img src={getImageUrl(product.images?.[0])} alt={product.name} className="mobile-inv-img" />
                    <div className="mobile-inv-info">
                      <span className="status-badge out">Out of Stock</span>
                      <h4>{product.name}</h4>
                      <span className="sku-tag">SKU: {product.sku || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mobile-inv-actions">
                    <div className="current-stock-info">
                      <span>Stock: <strong>{product.stock} Units</strong></span>
                    </div>
                    <button className="mobile-restock-btn critical" onClick={() => openRestockModal(product)}>
                      ⚡ Quick Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="inventory-section">
        <h3>Low Stock Warning</h3>
        {inventory.lowStockProducts.filter(p => p.stock > 0).length === 0 ? (
          <p className="empty-msg">No low stock warnings.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="inventory-table-container desktop-only-table">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Status</th>
                    <th>Stock Level</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.lowStockProducts.filter(p => p.stock > 0).map(product => (
                    <tr key={product._id} className="row-low">
                      <td className="product-cell">
                        <img src={getImageUrl(product.images?.[0])} alt={product.name} className="table-img" />
                        <span className="table-name">{product.name}</span>
                      </td>
                      <td className="sku-cell">{product.sku || 'N/A'}</td>
                      <td><span className="status-badge low">Low Stock</span></td>
                      <td className="stock-cell">{product.stock}</td>
                      <td className="action-cell">
                        <button className="restock-btn" onClick={() => openRestockModal(product)}>Update</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Card Feed */}
            <div className="mobile-inventory-feed">
              {inventory.lowStockProducts.filter(p => p.stock > 0).map(product => (
                <div key={product._id} className="mobile-inventory-card low-warning">
                  <div className="mobile-inv-top">
                    <img src={getImageUrl(product.images?.[0])} alt={product.name} className="mobile-inv-img" />
                    <div className="mobile-inv-info">
                      <span className="status-badge low">Low Stock ({product.stock} left)</span>
                      <h4>{product.name}</h4>
                      <span className="sku-tag">SKU: {product.sku || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mobile-inv-actions">
                    <div className="mobile-qty-quick-buttons">
                      <button 
                        className="qty-step-btn" 
                        onClick={() => handleUpdateStock(product._id, Math.max(0, product.stock - 1))}
                      >-</button>
                      <span className="qty-val">{product.stock}</span>
                      <button 
                        className="qty-step-btn" 
                        onClick={() => handleUpdateStock(product._id, product.stock + 1)}
                      >+</button>
                    </div>
                    <button className="mobile-restock-btn" onClick={() => openRestockModal(product)}>
                      Set Quantity
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Custom Touch Restock Modal for Mobile & Desktop */}
      {restockProduct && (
        <div className="modal-overlay" onClick={() => setRestockProduct(null)}>
          <motion.div 
            className="restock-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="restock-modal-header">
              <h3>Restock Inventory</h3>
              <button className="close-btn" onClick={() => setRestockProduct(null)}>&times;</button>
            </div>
            <div className="restock-modal-body">
              <div className="product-summary-mini">
                <img src={getImageUrl(restockProduct.images?.[0])} alt={restockProduct.name} />
                <div>
                  <h4>{restockProduct.name}</h4>
                  <p>Current Stock: <strong>{restockProduct.stock} Units</strong></p>
                </div>
              </div>

              <div className="quick-add-presets">
                <label>Quick Add Units:</label>
                <div className="preset-buttons">
                  <button type="button" onClick={() => submitRestock(restockProduct.stock + 5)}>+5</button>
                  <button type="button" onClick={() => submitRestock(restockProduct.stock + 10)}>+10</button>
                  <button type="button" onClick={() => submitRestock(restockProduct.stock + 25)}>+25</button>
                  <button type="button" onClick={() => submitRestock(restockProduct.stock + 50)}>+50</button>
                </div>
              </div>

              <div className="custom-input-group">
                <label>Set Exact Stock Quantity:</label>
                <input 
                  type="number" 
                  min="0" 
                  value={customQty} 
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder="Enter target quantity"
                />
              </div>

              <div className="modal-actions-bar">
                <button className="save-stock-btn" onClick={() => submitRestock(customQty)}>
                  Save Stock Quantity
                </button>
                <button className="cancel-stock-btn" onClick={() => setRestockProduct(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default InventoryManager
