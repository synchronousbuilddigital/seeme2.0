import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './Orders.css'

const Orders = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Ad2Ship Tracking modal state
  const [activeTrackingData, setActiveTrackingData] = useState(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    if (!token) {
      navigate('/auth')
      return
    }
    fetchOrders()
    
    // Real-time sync: Poll every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [token, navigate])

  const fetchOrders = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ORDERS_MY, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchTracking = async (order) => {
    const awb = order.shipping?.awbNumber || order.trackingNumber
    setTrackingLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.SHIPPING_TRACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awbNumber: awb, orderId: order._id })
      })
      const data = await response.json()
      if (data.success) {
        setActiveTrackingData(data.data)
      } else {
        alert(data.message || 'Tracking information unavailable at the moment.')
      }
    } catch (err) {
      console.error('Tracking fetch error:', err)
      alert('Failed to retrieve live tracking.')
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Item stock will be restored.')) {
      return
    }
    setCancellingId(orderId)
    try {
      const response = await fetch(API_ENDPOINTS.ORDERS_CANCEL(orderId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        alert('Order cancelled successfully.')
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Cancelled', refundStatus: o.paymentMethod === 'online' ? 'refund_requested' : o.refundStatus } : o))
      } else {
        alert(data.message || 'Failed to cancel order.')
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      alert('Failed to cancel order.')
    } finally {
      setCancellingId(null)
    }
  }

  const handlePrint = (order) => {
    const win = window.open('', '', 'height=800,width=950')
    win.document.write(`
      <html>
        <head>
          <title>SEE MEE - Order Receipt #${order.orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #111; background-color: #FFF; line-height: 1.6; }
            .invoice-wrapper { max-width: 850px; margin: 0 auto; border: 1.5px solid #F0F0F0; padding: 45px; position: relative; }
            .invoice-wrapper::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #D4AF37 0%, #F3E5AB 50%, #C49A27 100%); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #F0F0F0; padding-bottom: 25px; margin-bottom: 30px; }
            .brand-logo h1 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; letter-spacing: 0.1em; margin: 0; color: #000; text-transform: uppercase; }
            .brand-logo p { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.25em; margin: 4px 0 0 0; color: #C49A27; font-weight: 600; }
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 400; margin: 0 0 6px 0; }
            .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 35px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th { background: #FAF9F6; text-align: left; padding: 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #555; }
            .table td { padding: 14px 12px; border-bottom: 1px solid #F5F5F5; font-size: 0.88rem; }
            .totals-row { text-align: right; margin-top: 20px; font-size: 1.1rem; font-weight: 700; color: #111; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header">
              <div class="brand-logo">
                <h1>SEEMEE</h1>
                <p>HAUTE COUTURE ATELIER</p>
              </div>
              <div class="invoice-meta">
                <h2>INVOICE RECEIPT</h2>
                <p>Order #: <strong>#${order.orderNumber}</strong></p>
                <p>Date: <strong>${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></p>
              </div>
            </div>
            <div class="grid-details">
              <div>
                <h4 style="margin:0 0 8px 0; font-size:0.8rem; text-transform:uppercase; color:#888;">Billed & Delivered To:</h4>
                <p style="margin:0; font-weight:700;">${order.customer?.name}</p>
                <p style="margin:2px 0;">${order.customer?.address?.street}</p>
                <p style="margin:2px 0;">${order.customer?.address?.city}, ${order.customer?.address?.state} - ${order.customer?.address?.pincode}</p>
                <p style="margin:2px 0;">Phone: ${order.customer?.phone}</p>
              </div>
              <div>
                <h4 style="margin:0 0 8px 0; font-size:0.8rem; text-transform:uppercase; color:#888;">Payment Info:</h4>
                <p style="margin:0;">Method: <strong>${(order.paymentMethod || 'online').toUpperCase()}</strong></p>
                <p style="margin:2px 0;">Status: <strong>${(order.paymentStatus || 'pending').toUpperCase()}</strong></p>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map(i => `
                  <tr>
                    <td><strong>${i.name}</strong></td>
                    <td>${i.size || i.selectedSize || 'Standard'}</td>
                    <td>${i.quantity}</td>
                    <td style="text-align: right;">₹${(i.price * i.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals-row">
              Grand Total: <span style="color: #D4AF37;">₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  // Filter & KPI calculations
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const status = (order.status || '').toLowerCase()
      
      let matchesStatus = true
      if (statusFilter === 'active') {
        matchesStatus = ['pending', 'confirmed', 'processing', 'printing', 'packaging', 'shipped', 'in_transit'].includes(status)
      } else if (statusFilter === 'delivered') {
        matchesStatus = status === 'delivered'
      } else if (statusFilter === 'cancelled') {
        matchesStatus = status === 'cancelled'
      }

      const haystack = [
        order.orderNumber,
        order.shipping?.courierName,
        order.shipping?.awbNumber,
        ...(order.items || []).map(i => i.name)
      ].join(' ').toLowerCase()

      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase())

      return matchesStatus && matchesSearch
    })
  }, [orders, statusFilter, searchTerm])

  const kpis = useMemo(() => {
    const total = orders.length
    const active = orders.filter(o => ['pending', 'confirmed', 'processing', 'printing', 'packaging', 'shipped', 'in_transit'].includes((o.status || '').toLowerCase())).length
    const delivered = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length
    const investment = orders
      .filter(o => (o.status || '').toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)

    return { total, active, delivered, investment }
  }, [orders])

  if (loading) {
    return (
      <div className="luxury-orders-loading">
        <div className="luxury-spinner" />
        <p className="loading-text">Loading Your  Register...</p>
      </div>
    )
  }

  return (
    <div className="luxury-orders-page">
      {/* Luxury Hero Banner */}
      <section className="orders-hero">
        <div className="hero-content">
          
          <h1>My  Orders</h1>
          <p>Real-time order tracking,  tailoring status & invoice history</p>
        </div>
      </section>

      <div className="orders-main-container">
        {/* Filters & Search Toolbar */}
        <div className="orders-filter-toolbar">
          <div className="filter-tabs">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'active', label: 'In Progress', count: kpis.active },
              { id: 'delivered', label: 'Delivered', count: kpis.delivered },
              { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length }
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="tab-badge">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Search by Order #, Item, or Courier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="empty-orders-luxury">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </div>
            <h2>No Orders Found</h2>
            <p>{searchTerm ? 'No orders match your search term.' : 'You have not placed any couture orders yet.'}</p>
            <button className="start-shopping-btn" onClick={() => navigate('/collections')}>
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          /* Luxury Orders Grid */
          <div className="orders-list-luxury">
            {filteredOrders.map((order) => {
              const statusLower = (order.status || 'pending').toLowerCase()
              const isCancelled = statusLower === 'cancelled'
              const isExpanded = expandedOrder === order._id
              const isCodOrder = String(order.paymentMethod || '').toLowerCase() === 'cod'
              const isOfflineStore = String(order.orderType || '').toUpperCase() === 'OFFLINE'
              const isCodApproved = (order.paymentStatus || '').toLowerCase() === 'paid' || statusLower === 'confirmed' || statusLower === 'approved' || statusLower === 'processing' || statusLower === 'cod approved'

              return (
                <div key={order._id} className={`order-card-luxury ${isCancelled ? 'cancelled-card' : ''}`}>
                  {/* Card Header Header Strip */}
                  <div 
                    className="order-card-header"
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  >
                    <div className="order-main-info">
                      <div className="order-num-row">
                        <span className="order-number">ORDER #{order.orderNumber}</span>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {/* Items Preview Strip */}
                      <div className="items-preview-strip">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <div key={idx} className="preview-item">
                            <img src={getOptimizedImageUrl(item.image, 'thumbnail')} alt={item.name} />
                            <span className="preview-title">{item.name}</span>
                          </div>
                        ))}
                        {(order.items || []).length > 3 && (
                          <span className="more-count">+{(order.items || []).length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="order-status-group">
                      <div className="status-badges">
                        <span className={`status-pill ${statusLower}`}>
                          <span className="status-dot" />
                          {(isCodOrder || isOfflineStore) && isCodApproved ? 'ORDER HANDOVER' : (isCodOrder || isOfflineStore) ? 'COD PENDING APPROVAL' : statusLower.toUpperCase()}
                        </span>
                        <span className={`payment-pill ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                          {(order.paymentMethod || 'online').toUpperCase()} • {isCodApproved ? 'PAID / APPROVED' : (order.paymentStatus || 'pending').toUpperCase()}
                        </span>
                      </div>

                      <div className="order-total-block">
                        <span className="total-label">Total Amount</span>
                        <span className="total-val">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
                      </div>

                      <button className="expand-toggle-btn">
                        {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Card Body */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        className="order-card-details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Horizontal Tracking Timeline or COD Handover Banner */}
                        {isCancelled ? (
                          <div className="timeline-cancelled-banner">
                            <span className="cancelled-icon-badge">🚫</span>
                            <div className="cancelled-text">
                              <strong>This Order Has Been Cancelled</strong>
                              <p>Cancelled prior to warehouse dispatch & pickup.</p>
                            </div>
                          </div>
                        ) : (isCodOrder || isOfflineStore) ? (
                          <div className="cod-handover-banner-box">
                            {isCodApproved ? (
                              <div className="cod-approved-handover">
                                <div className="handover-icon-circle green">🛍️</div>
                                <div className="handover-text">
                                  <span className="handover-mini-tag">✦ ADMIN APPROVED</span>
                                  <strong className="handover-main-title">ORDER HANDOVER</strong>
                                  <p className="handover-sub">COD Payment verified & approved by Admin. Item handed over to customer.</p>
                                </div>
                              </div>
                            ) : (
                              <div className="cod-pending-approval">
                                <div className="handover-icon-circle amber">⏳</div>
                                <div className="handover-text">
                                  <span className="handover-mini-tag amber">⏳ PENDING VERIFICATION</span>
                                  <strong className="handover-main-title amber">AWAITING ADMIN COD APPROVAL</strong>
                                  <p className="handover-sub">Your Cash on Delivery order is currently awaiting Admin approval. Order Handover will be confirmed upon Admin verification.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="tracking-timeline-horizontal">
                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, idx, arr) => {
                              const currentStepIdx = arr.indexOf(statusLower)
                              const isCompleted = idx <= currentStepIdx
                              const isCurrent = idx === currentStepIdx
                              return (
                                <div key={step} className={`timeline-step ${isCompleted ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                                  <div className="step-dot" />
                                  <span className="step-label">{step}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div className="details-grid">
                          {/* Items Section */}
                          <div className="items-section">
                            <h4>Ordered Atelier Items</h4>
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="order-item-row">
                                <div className="item-thumb">
                                  <img src={getOptimizedImageUrl(item.image, 'thumbnail')} alt={item.name} />
                                </div>
                                <div className="item-info">
                                  <h5>{item.name}</h5>
                                  <p>Size: <strong>{item.size || item.selectedSize || 'Standard'}</strong> | Qty: <strong>{item.quantity}</strong></p>
                                </div>
                                <div className="item-price">
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Delivery & Payment Info */}
                          <div className="delivery-section">
                            <h4>Delivery Address</h4>
                            <div className="address-block">
                              <p className="customer-name">📍 {order.customer?.name}</p>
                              <p>{order.customer?.address?.street}</p>
                              <p>{order.customer?.address?.city}, {order.customer?.address?.state} - {order.customer?.address?.pincode}</p>
                              <p className="customer-phone">📞 T: {order.customer?.phone}</p>
                            </div>

                            <div className="payment-info">
                              <h4>Payment & Financial Notice</h4>
                              <p>Method: <strong>{(order.paymentMethod || 'online').toUpperCase()}</strong></p>
                              <p>Payment Status: <strong className={`pay-status ${(order.paymentStatus || 'pending').toLowerCase()}`}>{(order.paymentStatus || 'pending').toUpperCase()}</strong></p>

                              {/* Refund Notice Banner */}
                              {order.paymentMethod === 'online' && (
                                <div className="refund-status-box">
                                  {order.refundStatus === 'refunded' ? (
                                    <div className="refund-text success">
                                      ✓ Refund Status: <strong>Refunded</strong> (₹{Number(order.refundedAmount || order.totalAmount).toLocaleString('en-IN')})
                                    </div>
                                  ) : order.refundStatus === 'refund_rejected' ? (
                                    <div className="refund-text danger">
                                      ✕ Refund Status: <strong>Refund Rejected</strong>
                                    </div>
                                  ) : (isCancelled || ['refund_requested', 'refund_processing', 'refund_approved'].includes(order.refundStatus)) ? (
                                    <div className="refund-text warning">
                                      <div className="refund-title">💳 Refund Status: <strong>Refund Initiated</strong></div>
                                      <div className="refund-sub">
                                        Your refund of <strong>₹{Number(order.totalAmount).toLocaleString('en-IN')}</strong> will be credited to your original payment method within <strong>5-7 working days</strong>.
                                      </div>
                                    </div>
                                  ) : (['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(statusLower) || Boolean(order.shipping?.awbNumber)) ? (
                                    <p className="refund-sub info">
                                      <em>Refund is not available because this order has already been shipped from the warehouse.</em>
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {/* Logistics & Live Tracking Card */}
                            {(order.shipping?.awbNumber || order.trackingNumber || order.shipping?.ad2shipOrderId) && (
                              <div className="tracking-info-box">
                                <h4>🚚 Logistics Checkpoint</h4>
                                {order.shipping?.courierName && <p>Courier: <strong>{order.shipping.courierName}</strong></p>}
                                {(order.shipping?.awbNumber || order.trackingNumber) && (
                                  <p>AWB Tracking #: <strong>{order.shipping?.awbNumber || order.trackingNumber}</strong></p>
                                )}
                                {order.estimatedDelivery && <p>Est. Arrival: <strong>{new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></p>}

                                <button 
                                  type="button"
                                  className="track-live-btn"
                                  onClick={() => handleFetchTracking(order)}
                                  disabled={trackingLoading}
                                >
                                  {trackingLoading ? 'Retrieving Checkpoints...' : 'View Live Tracking Logs'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="order-footer-actions">
                          {(() => {
                            const isShippedOrDispatched = ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(statusLower) || 
                              ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(String(order.shipping?.status || '').toLowerCase()) || 
                              Boolean(order.shipping?.awbNumber || order.trackingNumber) || 
                              Boolean(order.shipping?.pickupAt)

                            if (isCancelled || isShippedOrDispatched) return null

                            return (
                              <button 
                                className="cancel-order-action-btn" 
                                onClick={() => handleCancelOrder(order._id)}
                                disabled={cancellingId === order._id}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                              </button>
                            )
                          })()}
                          <button className="invoice-btn" onClick={() => handlePrint(order)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                            Print Invoice
                          </button>
                          <button className="support-btn" onClick={() => window.location.href='mailto:bizseemee@gmail.com?subject=SEEMEE%20Customer%20Support%20Inquiry'}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Contact Support (bizseemee@gmail.com)
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Customer Live Tracking Checkpoints Modal */}
      <AnimatePresence>
        {activeTrackingData && (
          <div className="modal-overlay" onClick={() => setActiveTrackingData(null)}>
            <motion.div 
              className="tracking-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Live Courier Checkpoints</h3>
                <button className="close-btn" onClick={() => setActiveTrackingData(null)}>&times;</button>
              </div>

              <div className="tracking-summary-strip">
                <div>AWB #: <strong>{activeTrackingData.awbNumber || activeTrackingData.awb}</strong></div>
                <div>Courier: <strong>{activeTrackingData.courier || 'Ad2Ship Express'}</strong></div>
                <div>Status: <strong className="gold-text">{activeTrackingData.status || 'In Transit'}</strong></div>
              </div>

              <div className="checkpoint-list">
                {(activeTrackingData.OrderHistory || activeTrackingData.history || []).map((cp, idx) => (
                  <div key={idx} className="checkpoint-item">
                    <div className="cp-dot" />
                    <div className="cp-info">
                      <div className="cp-status">{cp.status || cp.location || 'Checkpoint Scanned'}</div>
                      <div className="cp-location">{cp.message || cp.detail || cp.location || ''}</div>
                      <div className="cp-time">{cp.date || cp.timestamp || ''}</div>
                    </div>
                  </div>
                ))}
                {(!activeTrackingData.OrderHistory || activeTrackingData.OrderHistory.length === 0) && (
                  <p className="no-logs">No checkpoint logs available yet.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Orders
