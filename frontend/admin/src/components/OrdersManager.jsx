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
    const listToExport = exportRange === 'filtered' ? visibleOrders : orders
    
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

  // Executive KPI summary calculations
  const totalOrdersCount = orders.length
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const shippedCount = orders.filter(o => o.status === 'shipped').length
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)

  return (
    <div className="orders-manager">
      {/* Header & KPI Summary Cards */}
      <div className="manager-header">
        <div>
          <span className="executive-badge">✦ ATELIER ORDER REGISTRY</span>
          <h1>Orders & Logistics</h1>
          <p>Real-time order tracking, fulfillment lifecycle & ledger analytics</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={openExportModal}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Ledger
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="orders-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL ORDERS</span>
            <h3 className="kpi-value">{totalOrdersCount}</h3>
            <span className="kpi-subtext">Lifetime register</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">PENDING / TAILORING</span>
            <h3 className="kpi-value">{pendingCount}</h3>
            <span className="kpi-subtext">Requires fulfillment</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">IN TRANSIT</span>
            <h3 className="kpi-value">{shippedCount}</h3>
            <span className="kpi-subtext">Dispatched shipments</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">GROSS REVENUE</span>
            <h3 className="kpi-value">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <span className="kpi-subtext">Active orders volume</span>
          </div>
        </div>
      </div>

      <div className="orders-toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            className="orders-search"
            type="search"
            placeholder="Search by Order #, Customer name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        
        <div className="filters-row">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              <span className={`status-dot ${status}`} />
              <span className="tab-name">{status}</span>
              <span className="count">
                {status === 'all' ? orders.length : orders.filter(o => o.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="orders-table-container premium-card desktop-only-table">
        {visibleOrders.length === 0 ? (
          <div className="no-orders-state">
            <div className="empty-icon">📦</div>
            <h3>No matching orders found</h3>
            <p>Try adjusting your search criteria or status filter</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Items Preview</th>
                <th>Customer</th>
                <th>Placement Date</th>
                <th>Payment</th>
                <th>Fulfillment Status</th>
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
                      <span className="item-count">{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="order-items-thumb-stack">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="mini-thumb-wrap" title={`${item.name} (${item.size})`}>
                          <img src={getImageUrl(item.image)} alt={item.name} />
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <span className="thumb-more-count">+{order.items.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar-circle">
                        {order.customer?.name ? order.customer.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="customer-text-meta">
                        <h4>{order.customer?.name || 'Guest Customer'}</h4>
                        <p>{order.customer?.email || order.customer?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <strong>{new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}</strong>
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`payment-badge ${order.paymentMethod === 'cod' ? 'cod' : 'paid'}`}>
                      <span className="pay-dot" />
                      {order.paymentMethod === 'cod' ? 'COD' : 'ONLINE PAID'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${order.status}`}>
                      <span className="status-indicator-dot" />
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span className="amount-cell">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </td>
                  <td>
                    <button className="manage-btn" onClick={() => setSelectedOrder(order)}>
                      <span>Manage</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Touch Order Card Feed */}
      <div className="mobile-order-card-feed">
        {visibleOrders.map((order) => (
          <div key={order._id} className="mobile-order-card" onClick={() => setSelectedOrder(order)}>
            <div className="mobile-order-card-top">
              <div className="mobile-order-id-group">
                <span className="mobile-order-num">#{order.orderNumber}</span>
                <span className="mobile-order-date">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short'
                  })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className={`status-pill ${order.status}`}>
                {order.status}
              </span>
            </div>

            <div className="mobile-order-card-body">
              <div className="mobile-customer-info">
                <div className="mobile-customer-avatar">
                  {order.customer?.name ? order.customer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="mobile-customer-text">
                  <h4>{order.customer?.name || 'Customer'}</h4>
                  <p>{order.customer?.email || order.customer?.phone || 'No contact details'}</p>
                </div>
              </div>
              
              <div className="mobile-order-financials">
                <div className="mobile-order-items-badge">
                  📦 {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                </div>
                <div className="mobile-order-total">
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="mobile-order-card-footer">
              <span className={`payment-badge ${order.paymentStatus || 'unpaid'}`}>
                {order.paymentMethod === 'cod' ? 'COD' : 'ONLINE PAID'}
              </span>
              <button className="mobile-manage-btn" onClick={(e) => {
                e.stopPropagation()
                setSelectedOrder(order)
              }}>
                <span>Manage Order</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        ))}
        {visibleOrders.length === 0 && (
          <div className="no-orders-state">
            <div className="empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
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
                          <h4>Filtered View ({visibleOrders.length} Orders)</h4>
                          <p>Current search & state status filters</p>
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
