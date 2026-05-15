import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './OrdersManager.css'

const OrdersManager = () => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ORDERS, { auth: true })
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, note = '') => {
    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        auth: true,
        body: { status: newStatus, note }
      })

      if (data.success) {
        fetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data)
        }
        showNotification('Order status updated!')
      }
    } catch (error) {
      showNotification(error.message || 'Failed to update status', 'error')
    }
  }

  const updateTracking = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const trackingData = {
      trackingNumber: formData.get('trackingNumber'),
      estimatedDelivery: formData.get('estimatedDelivery'),
      status: selectedOrder.status,
      note: `Tracking information updated: ${formData.get('trackingNumber')}`
    }

    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.BASE}/orders/${selectedOrder._id}/status`, {
        method: 'PUT',
        auth: true,
        body: trackingData
      })

      if (data.success) {
        fetchOrders()
        setSelectedOrder(data.data)
        showNotification('Tracking info updated!')
      }
    } catch (error) {
      showNotification('Failed to update tracking', 'error')
    }
  }

  const printInvoice = () => {
    const printContent = document.getElementById('invoice-printable').innerHTML
    const win = window.open('', '', 'height=700,width=900')
    win.document.write('<html><head><title>Invoice - SeeMee</title>')
    win.document.write('<style>body{font-family:sans-serif;padding:40px;} .header{display:flex;justify-content:space-between;margin-bottom:40px;} .table{width:100%;border-collapse:collapse;} .table th,.table td{border:1px solid #eee;padding:12px;text-align:left;} .total-box{margin-top:30px;text-align:right;} .badge{padding:4px 8px;border-radius:4px;font-size:12px;text-transform:uppercase;}</style>')
    win.document.write('</head><body>')
    win.document.write(printContent)
    win.document.write('</body></html>')
    win.document.close()
    win.print()
  }

  const exportCsv = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Amount', 'Status', 'Payment Method']
    const rows = visibleOrders.map(o => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      o.customer.name,
      o.customer.email,
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
    showNotification('Orders exported to CSV!')
  }

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const visibleOrders = filteredOrders.filter((order) => {
    const haystack = [
      order.orderNumber,
      order.customer?.name,
      order.customer?.email,
      order.customer?.phone
    ].join(' ').toLowerCase()
    return haystack.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="orders-manager">
      <div className="manager-header">
        <div>
          <h1>Orders Management</h1>
          <p>Track and manage customer orders in real-time</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={exportCsv}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="orders-toolbar">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            className="orders-search"
            type="search"
            placeholder="Search by ID, Customer name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters-row">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status}
              <span className="count">
                {status === 'all' ? orders.length : orders.filter(o => o.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="orders-table-container premium-card">
        {visibleOrders.length === 0 ? (
          <div className="no-orders-state">
            <div className="empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Details</th>
                <th>Customer</th>
                <th>Placement Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className="order-id-cell">
                      <span className="order-num">#{order.orderNumber}</span>
                      <span className="item-count">{order.items?.length || 0} items</span>
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <h4>{order.customer.name}</h4>
                      <p>{order.customer.email}</p>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`payment-badge ${order.paymentStatus || 'unpaid'}`}>
                      {order.paymentMethod === 'cod' ? 'COD' : 'ONLINE'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span className="amount-cell">₹{order.totalAmount.toLocaleString()}</span>
                  </td>
                  <td>
                    <button className="manage-btn" onClick={() => setSelectedOrder(order)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <motion.div 
              className="order-detail-modal"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-sidebar-header">
                <div className="header-main">
                  <h2>Order #{selectedOrder.orderNumber}</h2>
                  <span className={`status-pill ${selectedOrder.status}`}>{selectedOrder.status}</span>
                </div>
                <div className="header-actions">
                  <button className="print-btn" onClick={printInvoice}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print Invoice
                  </button>
                  <button className="close-side-modal" onClick={() => setSelectedOrder(null)}>&times;</button>
                </div>
              </div>

              <div className="modal-scroll-area">
                {/* Hidden Printable Invoice */}
                <div id="invoice-printable" style={{ display: 'none' }}>
                  <div className="header">
                    <div>
                      <h1>SEEMEE</h1>
                      <p>Order #{selectedOrder.orderNumber}</p>
                      <p>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3>Customer</h3>
                      <p>{selectedOrder.customer.name}</p>
                      <p>{selectedOrder.customer.email}</p>
                      <p>{selectedOrder.customer.phone}</p>
                    </div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name} (Size: {item.size})</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price}</td>
                          <td>₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="total-box">
                    <h3>Grand Total: ₹{selectedOrder.totalAmount}</h3>
                    <p>Status: <span className="badge">{selectedOrder.status}</span></p>
                  </div>
                </div>

                <div className="modal-sections">
                  <section className="info-section">
                    <h3>Customer Details</h3>
                    <div className="info-card">
                      <div className="user-profile-mini">
                        <div className="avatar">{selectedOrder.customer.name.charAt(0)}</div>
                        <div className="user-text">
                          <h4>{selectedOrder.customer.name}</h4>
                          <p>{selectedOrder.customer.email}</p>
                          <p>{selectedOrder.customer.phone}</p>
                        </div>
                      </div>
                      <div className="address-box">
                        <label>Shipping Address</label>
                        <p>{selectedOrder.customer.address?.street}</p>
                        <p>{selectedOrder.customer.address?.city}, {selectedOrder.customer.address?.state}</p>
                        <p>{selectedOrder.customer.address?.pincode}</p>
                      </div>
                    </div>
                  </section>

                  <section className="tracking-section">
                    <h3>Logistics & Status</h3>
                    <div className="status-control-card">
                      <div className="control-group">
                        <label>Current Stage</label>
                        <select 
                          value={selectedOrder.status} 
                          onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                        >
                          <option value="pending">Pending Receipt</option>
                          <option value="confirmed">Order Confirmed</option>
                          <option value="processing">Processing & Tailoring</option>
                          <option value="shipped">Dispatched</option>
                          <option value="delivered">Delivered Successfully</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <form className="tracking-form" onSubmit={updateTracking}>
                        <div className="input-row">
                          <div className="control-group">
                            <label>Tracking Number</label>
                            <input name="trackingNumber" defaultValue={selectedOrder.trackingNumber} placeholder="e.g. SF12345678" />
                          </div>
                          <div className="control-group">
                            <label>Est. Delivery</label>
                            <input type="date" name="estimatedDelivery" defaultValue={selectedOrder.estimatedDelivery?.split('T')[0]} />
                          </div>
                        </div>
                        <button type="submit" className="update-track-btn">Update Tracking</button>
                      </form>
                    </div>
                  </section>

                  <section className="timeline-section">
                    <h3>Order Journey</h3>
                    <div className="journey-timeline">
                      {selectedOrder.timeline?.map((entry, idx) => (
                        <div key={idx} className="timeline-step">
                          <div className="step-marker" />
                          <div className="step-content">
                            <span className="step-status">{entry.status}</span>
                            <p className="step-note">{entry.note}</p>
                            <span className="step-time">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      <div className="timeline-step active">
                        <div className="step-marker pulse" />
                        <div className="step-content">
                          <span className="step-status">Order Placed</span>
                          <p className="step-note">System received the order request</p>
                          <span className="step-time">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="items-section">
                    <h3>Package Contents</h3>
                    <div className="package-list">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="pkg-item">
                          <img src={getImageUrl(item.image)} alt={item.name} />
                          <div className="pkg-info">
                            <h4>{item.name}</h4>
                            <p>Size: {item.size} • Qty: {item.quantity}</p>
                          </div>
                          <div className="pkg-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    <div className="order-summary-box">
                      <div className="sum-row"><span>Subtotal</span><span>₹{selectedOrder.totalAmount.toLocaleString()}</span></div>
                      <div className="sum-row"><span>Shipping</span><span>Free</span></div>
                      <div className="sum-row total"><span>Total</span><span>₹{selectedOrder.totalAmount.toLocaleString()}</span></div>
                    </div>
                  </section>
                </div>
              </div>
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
