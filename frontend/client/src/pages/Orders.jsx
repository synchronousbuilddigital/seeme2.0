import { useState, useEffect } from 'react'
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

  const [cancellingId, setCancellingId] = useState(null)

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
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o))
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

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      processing: '#9b59b6',
      printing: '#e67e22',
      packaging: '#16a085',
      shipped: '#2ecc71',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    }
    return colors[(status || '').toLowerCase()] || '#95a5a6'
  }

  const handlePrint = (order) => {
    const win = window.open('', '', 'height=800,width=950')
    win.document.write(`
      <html>
        <head>
          <title>SEE MEE - Order Receipt #${order.orderNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
            
            body {
              font-family: 'Outfit', sans-serif;
              padding: 50px;
              color: #111;
              background-color: #FFF;
              line-height: 1.6;
            }
            .invoice-wrapper {
              max-width: 850px;
              margin: 0 auto;
              border: 1.5px solid #F0F0F0;
              padding: 50px;
              position: relative;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
            }
            .invoice-wrapper::before {
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0;
              height: 4px;
              background: linear-gradient(90deg, #D4AF37 0%, #F3E5AB 50%, #C49A27 100%);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1.5px solid #F0F0F0;
              padding-bottom: 30px;
              margin-bottom: 35px;
            }
            .brand-logo h1 {
              font-family: 'Playfair Display', serif;
              font-size: 2.2rem;
              font-weight: 700;
              letter-spacing: 0.1em;
              margin: 0;
              color: #000;
              text-transform: uppercase;
            }
            .brand-logo p {
              font-family: 'Outfit', sans-serif;
              font-size: 0.72rem;
              text-transform: uppercase;
              letter-spacing: 0.25em;
              margin: 6px 0 0 0;
              color: #C49A27;
              font-weight: 600;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-meta h2 {
              font-family: 'Playfair Display', serif;
              font-size: 1.6rem;
              font-weight: 400;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0 0 8px 0;
            }
            .invoice-meta p {
              font-size: 0.85rem;
              color: #666;
              margin: 3px 0;
            }
            .grid-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
              margin-bottom: 40px;
            }
            .detail-block h3 {
              font-size: 0.75rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #888;
              border-bottom: 1.5px solid #F0F0F0;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .detail-block p {
              font-size: 0.88rem;
              color: #333;
              margin: 4px 0;
              line-height: 1.5;
            }
            .detail-block strong {
              color: #000;
              font-size: 0.95rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            th {
              font-size: 0.75rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #888;
              background-color: #FAFAFA;
              padding: 14px 16px;
              text-align: left;
              border-bottom: 1.5px solid #EAEAEA;
            }
            td {
              padding: 18px 16px;
              font-size: 0.88rem;
              color: #444;
              border-bottom: 1px solid #F0F0F0;
            }
            .item-name {
              font-weight: 600;
              color: #000;
            }
            .item-spec {
              font-size: 0.78rem;
              color: #666;
              margin-top: 4px;
            }
            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 25px;
            }
            .totals-table {
              width: 320px;
              border: none;
              margin-bottom: 0;
            }
            .totals-table td {
              padding: 8px 16px;
              border: none;
            }
            .totals-table tr.grand-total td {
              font-family: 'Playfair Display', serif;
              font-size: 1.4rem;
              font-weight: 700;
              color: #C49A27;
              padding-top: 15px;
              border-top: 1.5px solid #111;
            }
            .footer {
              margin-top: 70px;
              text-align: center;
              font-size: 0.8rem;
              color: #777;
              border-top: 1px solid #F0F0F0;
              padding-top: 35px;
            }
            .footer p {
              margin: 4px 0;
            }
            .footer-sig {
              font-family: 'Playfair Display', serif;
              font-style: italic;
              color: #C49A27;
              font-size: 1.15rem;
              margin-bottom: 12px !important;
            }
            
            @media print {
              body { padding: 0; background: none; }
              .invoice-wrapper { border: none; padding: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header">
              <div class="brand-logo">
                <h1>SEE MEE</h1>
                <p>Atelier of Heritage & Style</p>
              </div>
              <div class="invoice-meta">
                <h2>Invoice</h2>
                <p>Order #: <strong>${order.orderNumber}</strong></p>
                <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Status: ${order.status.toUpperCase()}</p>
              </div>
            </div>
            
            <div class="grid-details">
              <div class="detail-block">
                <h3>Delivery Address</h3>
                <p><strong>${order.customer.name}</strong></p>
                <p>${order.customer.address.street}</p>
                <p>${order.customer.address.city}, ${order.customer.address.state} - ${order.customer.address.pincode}</p>
                <p>T: ${order.customer.phone}</p>
              </div>
              <div class="detail-block" style="text-align: right;">
                <h3>Billing & Payment</h3>
                <p>Payment Method: <strong>${order.paymentMethod === 'online' ? 'Online Credit/Debit Card' : 'Cash on Delivery'}</strong></p>
                <p>Payment Status: <strong style="color: ${order.paymentStatus === 'paid' ? '#27AE60' : '#D97706'}">${order.paymentStatus.toUpperCase()}</strong></p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Items Ordered</th>
                  <th style="text-align: center;">Price</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">${item.name}</div>
                      <div class="item-spec">Size: ${item.size} • Color: ${item.color || 'Standard'}</div>
                    </td>
                    <td style="text-align: center;">₹${item.price.toLocaleString('en-IN')}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals-container">
              <table class="totals-table">
                <tr>
                  <td style="color: #666;">Subtotal</td>
                  <td style="text-align: right; font-weight: 600;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Shipping & Handling</td>
                  <td style="text-align: right; color: #27AE60; font-weight: 600;">Complimentary</td>
                </tr>
                <tr class="grand-total">
                  <td>Total</td>
                  <td style="text-align: right;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>
            
            <div class="footer">
              <p class="footer-sig">Thank you for your patronage</p>
              <p>Each piece is crafted with care at the Atelier of See Mee.</p>
              <p>© ${new Date().getFullYear()} See Mee. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  if (loading) {
    return (
      <div className="luxury-orders-loading">
        <div className="luxury-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    )
  }

  return (
    <div className="luxury-orders-page">
      {/* Elegant Back Navigation */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>
      <div className="orders-hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <span className="eyebrow">Your Orders</span>
          <h1>My Orders</h1>
          <p>View and track all your orders.</p>
        </motion.div>
      </div>

      <div className="orders-main-container">
        {orders.length === 0 ? (
          <motion.div 
            className="empty-orders-luxury"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="empty-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
            <h2>Your Archive is Empty</h2>
            <p>You haven't placed any orders yet. Start shopping!</p>
            <button className="start-shopping-btn" onClick={() => navigate('/collections')}>
              Browse Collections
            </button>
          </motion.div>
        ) : (
          <div className="orders-list-luxury">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                className={`order-card-luxury ${expandedOrder === order._id ? 'expanded' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div 
                  className="order-card-header"
                  onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                >
                  <div className="order-main-info">
                    <span className="order-number">#{order.orderNumber}</span>
                    <span className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  
                  <div className="order-status-group">
                    <div className="status-badge-luxury" style={{ backgroundColor: getStatusColor(order.status) + '15', color: getStatusColor(order.status) }}>
                      <span className="status-dot" style={{ backgroundColor: getStatusColor(order.status) }}></span>
                      {order.status.toUpperCase()}
                    </div>
                    <span className="order-total">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                    <div className="expand-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d={expandedOrder === order._id ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                      </svg>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedOrder === order._id && (
                    <motion.div 
                      className="order-card-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {(order.status || '').toLowerCase() === 'cancelled' ? (
                        <div className="timeline-cancelled-banner">
                          <span className="cancelled-icon-badge">🚫</span>
                          <span className="cancelled-text">This order is cancelled</span>
                        </div>
                      ) : (
                        <div className="tracking-timeline-horizontal">
                           {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, idx, arr) => {
                             const currentStepIdx = arr.indexOf((order.status || '').toLowerCase());
                             const isCompleted = idx <= currentStepIdx;
                             const isCurrent = idx === currentStepIdx;
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
                        <div className="items-section">
                          <h4>Items Ordered</h4>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="order-item-row">
                              <div className="item-thumb">
                                <img src={getOptimizedImageUrl(item.image, 'thumbnail')} alt={item.name} />
                              </div>
                              <div className="item-info">
                                <h5>{item.name}</h5>
                                <p>Qty: {item.quantity} • Size: {item.size || item.selectedSize || 'Standard'}</p>
                              </div>
                              <div className="item-price">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="delivery-section">
                          <h4>Delivery Address</h4>
                          <div className="address-block">
                            <p className="customer-name">{order.customer.name}</p>
                            <p>{order.customer.address.street}</p>
                            <p>{order.customer.address.city}, {order.customer.address.state}</p>
                            <p>{order.customer.address.pincode}</p>
                            <p className="customer-phone">T: {order.customer.phone}</p>
                          </div>
                          
                          <div className="payment-info">
                            <h4>Payment</h4>
                            <p>Method: {order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}</p>
                            <p className={`pay-status ${(order.status || '').toLowerCase() === 'cancelled' ? 'cancelled' : (order.paymentStatus || '').toLowerCase()}`}>
                              Status: {(order.status || '').toLowerCase() === 'cancelled' ? 'CANCELLED' : (order.paymentStatus || 'pending').toUpperCase()}
                            </p>
                          </div>

                          {order.trackingNumber && (
                            <div className="tracking-info-box">
                               <h4>Shipping Details</h4>
                               <p>Tracking #: <strong>{order.trackingNumber}</strong></p>
                               <p>Est. Arrival: {new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="order-footer-actions">
                        {!['cancelled', 'shipped', 'delivered'].includes((order.status || '').toLowerCase()) && (
                          <button 
                            className="cancel-order-action-btn" 
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={cancellingId === order._id}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                        <button className="invoice-btn" onClick={() => handlePrint(order)}>
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                           Print Receipt
                        </button>
                        <button className="support-btn" onClick={() => window.location.href='mailto:support@seemee.com'}>
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                           Contact Concierge
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
