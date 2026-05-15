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

  if (loading) return <div className="loading">Loading Inventory...</div>

  return (
    <div className="inventory-manager">
      <div className="inventory-stats">
        <div className="stat-pill low">
          <span className="label">Low Stock</span>
          <span className="count">{inventory.totalLowStock}</span>
        </div>
        <div className="stat-pill out">
          <span className="label">Out of Stock</span>
          <span className="count">{inventory.totalOutOfStock}</span>
        </div>
      </div>

      <section className="inventory-section">
        <h3>Critical Alerts (Out of Stock)</h3>
        {inventory.outOfStockProducts.length === 0 ? (
          <p className="empty-msg">No products out of stock. Good job!</p>
        ) : (
          <div className="inventory-table-container">
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
                      <button className="restock-btn" onClick={() => {
                        const qty = prompt(`Enter new stock quantity for ${product.name}:`)
                        if (qty) handleUpdateStock(product._id, parseInt(qty))
                      }}>Restock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="inventory-section">
        <h3>Low Stock Warning</h3>
        {inventory.lowStockProducts.filter(p => p.stock > 0).length === 0 ? (
          <p className="empty-msg">No low stock warnings.</p>
        ) : (
          <div className="inventory-table-container">
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
                      <button className="restock-btn" onClick={() => {
                        const qty = prompt(`Enter new stock quantity for ${product.name}:`)
                        if (qty) handleUpdateStock(product._id, parseInt(qty))
                      }}>Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default InventoryManager
