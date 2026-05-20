import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../../../utils/imageHelper'
import './OrdersManager.css'

const OrdersManager = () => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportStep, setExportStep] = useState('options')
  const [exportRange, setExportRange] = useState('filtered')
  const [exportFormat, setExportFormat] = useState('csv')
  const [exportProgressText, setExportProgressText] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        fetchOrders()
        showNotification('Order status updated!')
      }
    } catch (error) {
      showNotification('Failed to update order status', 'error')
    }
  }

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const openExportModal = () => {
    setExportStep('options')
    setExportRange('filtered')
    setExportFormat('csv')
    setIsExportModalOpen(true)
  }

  const triggerExportGeneration = () => {
    setExportStep('generating')
    
    const steps = [
      'Establishing secure ledger synthesis sequence...',
      'Serializing customer purchase metrics...',
      'Compiling cryptographic archive metadata...',
      'Ledger payload fully structured and sealed.'
    ]
    
    let currentStep = 0
    setExportProgressText(steps[0])
    
    const interval = setInterval(() => {
      currentStep++
      if (currentStep < steps.length) {
        setExportProgressText(steps[currentStep])
      } else {
        clearInterval(interval)
        performLedgerDownload()
        setExportStep('success')
        showNotification('Ledger compiled successfully!')
      }
    }, 600)
  }

  const performLedgerDownload = () => {
    const listToExport = exportRange === 'filtered' ? filteredOrders : orders
    
    if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(listToExport, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders_ledger_${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Amount', 'Status', 'Payment Method']
      const rows = listToExport.map(o => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString(),
        o.customer?.name || '',
        o.customer?.email || '',
        o.totalAmount,
        o.status,
        o.paymentMethod
      ])

      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444'
    }
    return colors[status] || '#64748b'
  }

  return (
    <div className="orders-manager">
      <div className="manager-header">
        <div>
          <h1>Orders Management</h1>
          <p>Track and manage customer orders in real-time</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={openExportModal}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="filters">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'all' && ` (${orders.length})`}
            {status !== 'all' && ` (${orders.filter(o => o.status === status).length})`}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              className="order-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="order-header">
                <div>
                  <h3>Order #{order.orderNumber}</h3>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <span 
                  className="status-badge"
                  style={{ background: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-customer">
                <div className="customer-info">
                  <strong>{order.customer.name}</strong>
                  <span>{order.customer.email}</span>
                  <span>{order.customer.phone}</span>
                </div>
              </div>

              <div className="order-items">
                <span className="items-count">{order.items.length} item(s)</span>
                <span className="order-total">₹{order.totalAmount.toLocaleString()}</span>
              </div>

              <div className="order-actions">
                <select
                  value={order.status}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateOrderStatus(order._id, e.target.value)
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedOrder && (
        <div className="order-modal" onClick={() => setSelectedOrder(null)}>
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Order Details</h2>
              <button onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> {selectedOrder.orderNumber}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedOrder.status) }}>{selectedOrder.status}</span></p>
                <p><strong>Payment:</strong> {selectedOrder.paymentMethod.toUpperCase()}</p>
              </div>

              <div className="detail-section">
                <h3>Customer Details</h3>
                <p><strong>Name:</strong> {selectedOrder.customer.name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                {selectedOrder.customer.address && (
                  <p><strong>Address:</strong> {selectedOrder.customer.address.street}, {selectedOrder.customer.address.city}, {selectedOrder.customer.address.state} - {selectedOrder.customer.address.pincode}</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Order Items</h3>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="order-item-detail">
                    <div className="item-image">
                      {item.image && <img src={getImageUrl(item.image)} alt={item.name} />}
                    </div>
                    <div className="item-info">
                      <p><strong>{item.name}</strong></p>
                      <p>Quantity: {item.quantity}</p>
                      {item.size && <p>Size: {item.size}</p>}
                      {item.color && <p>Color: {item.color}</p>}
                      <p className="item-price">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="detail-section total-section">
                <h3>Total Amount: ₹{selectedOrder.totalAmount.toLocaleString()}</h3>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Premium Export Dialog */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="modal-overlay" onClick={() => setIsExportModalOpen(false)}>
            <motion.div 
              className="premium-export-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-topbar">
                <h3>Atelier Ledger Export</h3>
                <button className="close-btn" onClick={() => setIsExportModalOpen(false)}>&times;</button>
              </div>

              {exportStep === 'options' && (
                <div className="export-modal-body">
                  <p className="subtitle">Compile and serialize your orders metadata into a clean ledger document.</p>
                  
                  <div className="export-option-group">
                    <label>Export Range</label>
                    <div className="custom-radio-group">
                      <div 
                        className={`radio-card ${exportRange === 'filtered' ? 'active' : ''}`}
                        onClick={() => setExportRange('filtered')}
                      >
                        <div className="radio-dot" />
                        <div className="radio-label">
                          <h4>Filtered View ({filteredOrders.length} Orders)</h4>
                          <p>Current state status filters</p>
                        </div>
                      </div>
                      <div 
                        className={`radio-card ${exportRange === 'all' ? 'active' : ''}`}
                        onClick={() => setExportRange('all')}
                      >
                        <div className="radio-dot" />
                        <div className="radio-label">
                          <h4>Entire Registry ({orders.length} Orders)</h4>
                          <p>Export all historical records</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="export-option-group">
                    <label>Serialization Format</label>
                    <div className="format-grid">
                      <button 
                        className={`format-tile ${exportFormat === 'csv' ? 'active' : ''}`}
                        onClick={() => setExportFormat('csv')}
                      >
                        <div className="tile-icon">📄</div>
                        <span>CSV Spreadsheet</span>
                      </button>
                      <button 
                        className={`format-tile ${exportFormat === 'json' ? 'active' : ''}`}
                        onClick={() => setExportFormat('json')}
                      >
                        <div className="tile-icon">{"{ }"}</div>
                        <span>JSON Payload</span>
                      </button>
                    </div>
                  </div>

                  <button className="primary-action-btn" onClick={triggerExportGeneration}>
                    <span>Initiate Ledger Synthesis</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              )}

              {exportStep === 'generating' && (
                <div className="export-modal-body loading-state">
                  <div className="luxury-spinner">
                    <div className="spinner-inner" />
                  </div>
                  <h3>Synthesizing Document</h3>
                  <p className="progress-text">{exportProgressText}</p>
                </div>
              )}

              {exportStep === 'success' && (
                <div className="export-modal-body success-state">
                  <div className="success-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3>Synthesis Complete</h3>
                  <p className="success-message">Ledger document compiled and dispatched successfully.</p>
                  <button className="done-btn" onClick={() => setIsExportModalOpen(false)}>Done</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            className={`toast-notification ${notification.type}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OrdersManager
