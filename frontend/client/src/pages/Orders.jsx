import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { printOrderInvoice } from '../utils/invoiceHelper'
import { API_ENDPOINTS } from '../config/api'
import './Orders.css'

const RETURN_REASONS = [
  'Size / Fit does not suit me',
  'Garment damaged or defective',
  'Received wrong item or color',
  'Fabric / Quality not as expected',
  'Product differs from images on site',
  'Changed mind / Other'
]

const Orders = () => {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
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

  // 4-Day Return Modal states
  const [returnModalOrder, setReturnModalOrder] = useState(null)
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0])
  const [returnNotes, setReturnNotes] = useState('')
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [returnError, setReturnError] = useState('')

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
      if (response.status === 401) {
        logout()
        window.location.href = '/auth?expired=true'
        return
      }
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
        if (data.order) {
          setOrders(prev => prev.map(o => (o._id === data.order._id ? data.order : o)))
        }
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
      if (response.status === 401) {
        logout()
        window.location.href = '/auth?expired=true'
        return
      }
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
    printOrderInvoice(order)
  }

  // 4-Day Return Eligibility Calculator
  const getReturnEligibility = (order) => {
    const statusLower = (order.status || '').toLowerCase()
    if (statusLower !== 'delivered') {
      return { isEligible: false, notDelivered: true }
    }

    if (order.returnStatus && order.returnStatus !== 'not_requested') {
      return {
        isEligible: false,
        alreadyRequested: true,
        returnStatus: order.returnStatus,
        returnReason: order.returnReason,
        returnAdminComment: order.returnAdminComment
      }
    }

    let deliveryDate = order.deliveredAt
    if (!deliveryDate && order.timeline && order.timeline.length > 0) {
      const deliveredEntry = order.timeline.slice().reverse().find(t => (t.status || '').toLowerCase() === 'delivered')
      if (deliveredEntry) deliveryDate = deliveredEntry.timestamp
    }
    if (!deliveryDate) {
      deliveryDate = order.updatedAt || order.createdAt
    }

    const RETURN_WINDOW_MS = 4 * 24 * 60 * 60 * 1000 // Strictly 4 days
    const deliveredTime = new Date(deliveryDate).getTime()
    const expiresAt = new Date(deliveredTime + RETURN_WINDOW_MS)
    const diffMs = expiresAt.getTime() - Date.now()

    if (diffMs <= 0) {
      return {
        isEligible: false,
        expired: true,
        deliveredAt: new Date(deliveredTime),
        expiresAt
      }
    }

    const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
    const hoursLeft = Math.ceil(diffMs / (60 * 60 * 1000))

    return {
      isEligible: true,
      deliveredAt: new Date(deliveredTime),
      expiresAt,
      daysLeft,
      hoursLeft
    }
  }

  // Handle Submit Return Request
  const handleSubmitReturn = async (e) => {
    if (e) e.preventDefault()
    if (!returnModalOrder) return
    if (!returnReason || !returnReason.trim()) {
      setReturnError('Please select a reason for return.')
      return
    }

    setSubmittingReturn(true)
    setReturnError('')

    try {
      const response = await fetch(API_ENDPOINTS.ORDERS_RETURN_REQUEST(returnModalOrder._id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: returnReason,
          notes: returnNotes
        })
      })

      if (response.status === 401) {
        logout()
        window.location.href = '/auth?expired=true'
        return
      }

      const data = await response.json()
      if (data.success) {
        alert('Return request submitted successfully. Our team will review within 24-48 hours.')
        setOrders(prev => prev.map(o => o._id === returnModalOrder._id ? {
          ...o,
          returnStatus: 'return_requested',
          returnReason,
          returnNotes,
          returnRequestedAt: new Date()
        } : o))
        setReturnModalOrder(null)
      } else {
        setReturnError(data.message || 'Failed to submit return request.')
      }
    } catch (err) {
      console.error('Error requesting return:', err)
      setReturnError('Network error while requesting return. Please try again.')
    } finally {
      setSubmittingReturn(false)
    }
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

  const orderTimelineSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

  const renderOrderCard = (order) => {
    const statusLower = (order.status || 'pending').toLowerCase()
    const isCancelled = statusLower === 'cancelled'
    const isExpanded = expandedOrder === order._id
    const isCodOrder = String(order.paymentMethod || '').toLowerCase() === 'cod'
    const isOfflineStore = String(order.orderType || '').toUpperCase() === 'OFFLINE'
    const isCodApproved = (order.paymentStatus || '').toLowerCase() === 'paid' || statusLower === 'confirmed' || statusLower === 'approved' || statusLower === 'processing' || statusLower === 'cod approved'
    const currentStepIdx = orderTimelineSteps.indexOf(statusLower)
    const isShippedOrDispatched = ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(statusLower) ||
      ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(String(order.shipping?.status || '').toLowerCase()) ||
      Boolean(order.shipping?.awbNumber || order.trackingNumber) ||
      Boolean(order.shipping?.pickupAt)

    const returnEligibility = getReturnEligibility(order)

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
                {isOfflineStore && isCodOrder ? (isCodApproved ? 'ORDER HANDOVER' : 'COD PENDING APPROVAL') : statusLower.toUpperCase()}
              </span>
              {order.returnStatus && order.returnStatus !== 'not_requested' && (
                <span className={`status-pill return-pill ${order.returnStatus}`}>
                  <span className="status-dot" />
                  {order.returnStatus === 'return_requested' ? 'RETURN REQUESTED' : order.returnStatus === 'return_approved' ? 'RETURN APPROVED' : order.returnStatus === 'return_rejected' ? 'RETURN REJECTED' : 'RETURN COMPLETED'}
                </span>
              )}
              <span className={`payment-pill ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                {isOfflineStore && isCodOrder
                  ? `COD • ${isCodApproved ? 'PAID / APPROVED' : (order.paymentStatus || 'PENDING').toUpperCase()}`
                  : (isCodOrder ? 'ONLINE (COD)' : `${(order.paymentMethod || 'online').toUpperCase()} • ${(order.paymentStatus || 'pending').toUpperCase()}`)
                }
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
                  <span className="cancelled-icon-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  </span>
                  <div className="cancelled-text">
                    <strong>This Order Has Been Cancelled</strong>
                    {order.cancellationReason ? (
                      <p style={{ marginTop: '2px', color: '#991B1B' }}>
                        <strong>Reason:</strong> {order.cancellationReason}
                      </p>
                    ) : (
                      <p>Cancelled prior to warehouse dispatch & pickup.</p>
                    )}
                  </div>
                </div>
              ) : (isOfflineStore && isCodOrder) ? (
                <div className="cod-handover-banner-box">
                  {isCodApproved ? (
                    <div className="cod-approved-handover">
                      <div className="handover-icon-circle green">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                      </div>
                      <div className="handover-text">
                        <span className="handover-mini-tag">✦ ADMIN APPROVED</span>
                        <strong className="handover-main-title">ORDER HANDOVER</strong>
                        <p className="handover-sub">COD Payment verified & approved by Admin. Item handed over to customer.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="cod-pending-approval">
                      <div className="handover-icon-circle amber">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                      </div>
                      <div className="handover-text">
                        <span className="handover-mini-tag amber">PROCESSING</span>
                        <strong className="handover-main-title amber">ORDER PROCESSING</strong>
                        <p className="handover-sub">Your Cash on Delivery order is currently processing. Order Handover will be confirmed shortly.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="tracking-timeline-horizontal">
                  {orderTimelineSteps.map((step, idx) => (
                    <div key={step} className={`timeline-step ${idx <= currentStepIdx ? 'active' : ''} ${idx === currentStepIdx ? 'current' : ''}`}>
                      <div className="step-dot" />
                      <span className="step-label">{step}</span>
                    </div>
                  ))}
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
                        <p>
                          {item.color ? <>Color: <strong>{item.color}</strong> | </> : null}
                          Size: <strong>{item.size || item.selectedSize || 'Standard'}</strong> | Qty: <strong>{item.quantity}</strong>
                        </p>
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
                    <p className="customer-name" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{order.customer?.name}</span>
                    </p>
                    <p>{order.customer?.address?.street}</p>
                    <p>{order.customer?.address?.city}, {order.customer?.address?.state} - {order.customer?.address?.pincode}</p>
                    <p className="customer-phone" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span>T: {order.customer?.phone}</span>
                    </p>
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
                            <div className="refund-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                <line x1="1" y1="10" x2="23" y2="10"/>
                              </svg>
                              <span>Refund Status: <strong>Refund Initiated</strong></span>
                            </div>
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

                    {/* 4-Day Return Status & Notice for Delivered Orders */}
                    {statusLower === 'delivered' && (
                      <div className="return-status-container">
                        {order.returnStatus === 'return_requested' ? (
                          <div className="return-status-banner requested">
                            <div className="return-banner-title">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                              <span>Return Requested (Under Review)</span>
                            </div>
                            <p className="return-banner-desc">Reason: <strong>{order.returnReason || 'Requested by customer'}</strong></p>
                            {order.returnNotes && <p className="return-banner-notes">Notes: {order.returnNotes}</p>}
                            <small>Submitted on {new Date(order.returnRequestedAt || order.updatedAt).toLocaleDateString('en-IN')}. Our concierge team is reviewing your request.</small>
                          </div>
                        ) : order.returnStatus === 'return_approved' ? (
                          <div className="return-status-banner approved">
                            <div className="return-banner-title">✓ Return Request Approved</div>
                            <p className="return-banner-desc">Our courier partner will schedule reverse pickup from your address. Please keep original tags and box ready.</p>
                            {order.returnAdminComment && <small>Note from Atelier: {order.returnAdminComment}</small>}
                          </div>
                        ) : order.returnStatus === 'return_rejected' ? (
                          <div className="return-status-banner rejected">
                            <div className="return-banner-title">✕ Return Request Rejected</div>
                            <p className="return-banner-desc">Reason: {order.returnAdminComment || 'Does not satisfy 4-day return policy conditions.'}</p>
                          </div>
                        ) : order.returnStatus === 'return_completed' ? (
                          <div className="return-status-banner approved">
                            <div className="return-banner-title">✓ Return Completed</div>
                            <p className="return-banner-desc">Return package has been received and inspected by our atelier.</p>
                          </div>
                        ) : returnEligibility.isEligible ? (
                          <div className="return-status-banner eligible">
                            <div className="return-banner-title">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              <span>4-Day Return Window Active</span>
                            </div>
                            <p className="return-banner-desc">
                              Delivered on {returnEligibility.deliveredAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. You have <strong>{returnEligibility.daysLeft} {returnEligibility.daysLeft === 1 ? 'day' : 'days'}</strong> left to request a return (until {returnEligibility.expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}).
                            </p>
                          </div>
                        ) : (
                          <div className="return-status-banner expired">
                            <div className="return-banner-title">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              <span>Return Window Closed</span>
                            </div>
                            <p className="return-banner-desc">
                              Returns are applicable for 4 days only after delivery. The return window for this order closed on {returnEligibility.expiresAt?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Logistics & Live Tracking Card */}
                  {(order.shipping?.awbNumber || order.trackingNumber || order.shipping?.ad2shipOrderId) && (
                    <div className="tracking-info-box">
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"/>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                          <circle cx="5.5" cy="18.5" r="2.5"/>
                          <circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                        <span>Logistics Checkpoint</span>
                      </h4>
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
                {!isCancelled && !isShippedOrDispatched && (
                  <button
                    className="cancel-order-action-btn"
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={cancellingId === order._id}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
                {statusLower === 'delivered' && returnEligibility.isEligible && (
                  <button
                    className="return-order-action-btn"
                    onClick={() => {
                      setReturnModalOrder(order)
                      setReturnReason(RETURN_REASONS[0])
                      setReturnNotes('')
                      setReturnError('')
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                    Request Return ({returnEligibility.daysLeft}d left)
                  </button>
                )}
                <button className="invoice-btn" onClick={() => handlePrint(order)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                  Print Invoice
                </button>
                <button className="support-btn" onClick={() => window.location.href = 'mailto:bizseemee@gmail.com?subject=SEEMEE%20Customer%20Support%20Inquiry'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Contact Support (bizseemee@gmail.com)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

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
            {filteredOrders.map((order) => renderOrderCard(order))}
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

        {/* 4-Day Return Request Modal */}
        {returnModalOrder && (
          <div className="modal-overlay" onClick={() => !submittingReturn && setReturnModalOrder(null)}>
            <motion.div
              className="premium-return-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="return-modal-header">
                <div className="return-modal-title-group">
                  <span className="return-modal-badge">4-DAY RETURN POLICY</span>
                  <h3>Request Return for #{returnModalOrder.orderNumber}</h3>
                </div>
                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => setReturnModalOrder(null)}
                  disabled={submittingReturn}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="return-modal-body">
                <div className="return-policy-notice-box">
                  <div className="notice-icon">⏱️</div>
                  <div className="notice-text">
                    <strong>4-Day Delivery Return Window</strong>
                    <p>Returns must be requested strictly within 4 days of delivery. All garments must be unworn, undamaged, with original SEEMEE tags attached.</p>
                  </div>
                </div>

                <div className="return-form-group">
                  <label className="return-field-label">Reason for Return <span className="req-star">*</span></label>
                  <select
                    className="return-select-input"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    disabled={submittingReturn}
                  >
                    {RETURN_REASONS.map((r, idx) => (
                      <option key={idx} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="return-form-group">
                  <label className="return-field-label">Additional Comments / Notes (Optional)</label>
                  <textarea
                    className="return-textarea-input"
                    rows="3"
                    placeholder="Provide details about fit, sizing, or defect to assist our reverse logistics..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    disabled={submittingReturn}
                  />
                </div>

                {returnError && (
                  <div className="return-error-banner">
                    ⚠️ {returnError}
                  </div>
                )}

                <div className="return-modal-actions">
                  <button
                    type="button"
                    className="return-btn-cancel"
                    onClick={() => setReturnModalOrder(null)}
                    disabled={submittingReturn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="return-btn-submit"
                    disabled={submittingReturn || !returnReason}
                  >
                    {submittingReturn ? 'Submitting Request...' : 'Submit Return Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Orders
