import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './OrderPlacedPage.css'

const OrderPlacedPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { orderId } = useParams()

  const [order, setOrder] = useState(() => {
    if (location.state?.order) return location.state.order
    try {
      const cached = sessionStorage.getItem('seemee_last_placed_order')
      if (cached) return JSON.parse(cached)
    } catch (e) {
      // ignore
    }
    return null
  })

  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // If no state order but orderId is present in URL, fetch from backend API
  useEffect(() => {
    if (order || !orderId) return

    let isMounted = true
    const fetchOrderById = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_ENDPOINTS.ORDERS}/${orderId}`, { headers })
        const json = await res.json()
        if (isMounted && json.success && json.data) {
          setOrder(json.data)
        }
      } catch (err) {
        console.error('Error fetching placed order:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchOrderById()
    return () => { isMounted = false }
  }, [orderId, order])

  // Cache order in session storage
  useEffect(() => {
    if (order) {
      try {
        sessionStorage.setItem('seemee_last_placed_order', JSON.stringify(order))
      } catch (e) {
        // ignore
      }
    }
  }, [order])

  const handleCopyOrderId = (idToCopy) => {
    if (!idToCopy) return
    navigator.clipboard.writeText(idToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="order-placed-page">
        <div className="order-placed-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="placed-icon-wrap cod-pending" style={{ margin: '0 auto 1.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#1C1917' }}>
            Retrieving Your Order Details...
          </h2>
        </div>
      </div>
    )
  }

  // Graceful empty state
  if (!order) {
    return (
      <div className="order-placed-page">
        <div className="order-placed-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="placed-hero-card">
            <div className="placed-icon-wrap success" style={{ margin: '0 auto 1rem' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="placed-kicker success">✦ ORDER PROCESSED</span>
            <h1 className="placed-main-title">Thank You for Your Order</h1>
            <p className="placed-main-subtitle">
              Your order has been recorded successfully. You can review all your purchases and live courier tracking anytime in your account.
            </p>
            <div className="placed-actions-strip">
              <Link to="/orders" className="btn-placed-primary">
                View My Orders →
              </Link>
              <Link to="/" className="btn-placed-secondary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Data helpers
  const isOffline = String(order.orderType || '').toUpperCase() === 'OFFLINE'
  const isCod = String(order.paymentMethod || '').toLowerCase() === 'cod'
  const isPaid = String(order.paymentStatus || '').toLowerCase() === 'paid'
  const orderRefNumber = order.orderNumber || (order._id ? `#${String(order._id).slice(-8).toUpperCase()}` : '#SEEMEE')
  const customerName = order.customer?.name || 'Valued Customer'
  const customerEmail = order.customer?.email || ''
  const customerPhone = order.customer?.phone || ''
  const customerAddress = order.customer?.address || {}
  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0)
  const discount = order.couponDiscount || 0
  const grandTotal = order.totalAmount || (subtotal - discount)
  const placedDateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })

  return (
    <div className="order-placed-page">
      <div className="order-placed-container">
        {/* ============================================================ */}
        {/* HERO CONFIRMATION BANNER                                      */}
        {/* ============================================================ */}
        <motion.div
          className="placed-hero-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`placed-icon-wrap ${isOffline ? 'offline' : (isCod && !isPaid ? 'cod-pending' : 'success')}`}>
            {isOffline ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ) : isCod && !isPaid ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          <span className={`placed-kicker ${isOffline ? 'offline' : (isCod && !isPaid ? 'cod' : 'success')}`}>
            {isOffline
              ? (isCod && !isPaid ? '🏬 OFFLINE STORE • COD ORDER RECEIVED' : '🏬 OFFLINE STORE ORDER • CONFIRMED')
              : (isCod && !isPaid ? '⏳ ONLINE STORE • COD ORDER RECEIVED' : '✦ ONLINE STORE ORDER • CONFIRMED & SECURED')}
          </span>

          <h1 className="placed-main-title">
            {isOffline
              ? (isCod && !isPaid ? 'Your Offline Store Order Has Been Placed!' : 'Your Offline Store Order Is Confirmed!')
              : (isCod && !isPaid ? 'Thank You, Your Order Has Been Received!' : 'Thank You for Shopping with SEEMEE!')}
          </h1>

          {/* Reference Bar */}
          <div className="placed-ref-bar">
            <span className="placed-ref-label">Order Reference ID:</span>
            <span className="placed-ref-id">{orderRefNumber}</span>
            <button
              type="button"
              className="btn-copy-order-id"
              onClick={() => handleCopyOrderId(orderRefNumber)}
            >
              {copied ? '✓ Copied' : 'Copy ID'}
            </button>
            <span style={{ color: '#D4AF37', margin: '0 0.25rem' }}>•</span>
            <span className="placed-channel-badge">
              {isOffline ? '🏬 Offline Store (122103)' : '🌐 Online Store (Pan-India)'}
            </span>
            <span style={{ color: '#D4AF37', margin: '0 0.25rem' }}>•</span>
            <span className="placed-ref-label">Placed On: <strong>{placedDateStr}</strong></span>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* STEPPER / ORDER LIFECYCLE TRACKER                             */}
        {/* ============================================================ */}
        <motion.div
          className="placed-stepper-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="stepper-header-row">
            <h3 className="stepper-title">Order Status &amp; Timeline</h3>
            <span className="stepper-estimate-badge">
              <span>{isOffline ? '🏬' : '🚚'}</span>
              <span>
                {isOffline
                  ? 'Store Fulfillment: Local Service Area (Pincode: 122103)'
                  : 'Estimated Delivery: Within 3 to 5 Business Days'}
              </span>
            </span>
          </div>

          <div className="order-steps-track">
            {/* Step 1: Order Placed */}
            <div className="order-step-node completed">
              <div className="step-node-dot">✓</div>
              <span className="step-node-label">Order Placed</span>
              <span className="step-node-desc">
                {isOffline ? 'Recorded for Offline Store' : 'Received into atelier'}
              </span>
            </div>

            {/* Step 2: Quality Check / Verification */}
            <div className="order-step-node active">
              <div className="step-node-dot">02</div>
              <span className="step-node-label">
                {isOffline
                  ? (isCod && !isPaid ? 'Store Verification' : 'Store Preparation')
                  : (isCod && !isPaid ? 'Admin Verification' : 'Artisan Handcraft')}
              </span>
              <span className="step-node-desc">
                {isOffline
                  ? (isCod && !isPaid ? 'Store confirmation call' : 'Inspecting & packing outfit')
                  : (isCod && !isPaid ? 'Verifying for dispatch' : 'Pre-shipment inspection')}
              </span>
            </div>

            {/* Step 3: Courier Dispatch / Store Fulfillment */}
            <div className="order-step-node">
              <div className="step-node-dot">03</div>
              <span className="step-node-label">
                {isOffline ? 'Ready for Pickup / Delivery' : 'Dispatched'}
              </span>
              <span className="step-node-desc">
                {isOffline ? 'Local store fulfillment (122103)' : 'Insured express delivery'}
              </span>
            </div>

            {/* Step 4: Doorstep Delivery / Fulfilled */}
            <div className="order-step-node">
              <div className="step-node-dot">04</div>
              <span className="step-node-label">
                {isOffline ? 'Completed' : 'Delivered'}
              </span>
              <span className="step-node-desc">
                {isCod && !isPaid ? 'Pay cash on handoff' : 'Delivered to recipient'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* 2-COLUMN DETAILS GRID: ITEMS & SUMMARY + DELIVERY & PAYMENT   */}
        {/* ============================================================ */}
        <div className="placed-content-grid">
          {/* Left Column: Items Purchased & Price Breakdown */}
          <div className="placed-card-block">
            <h3 className="card-block-title">
              <span>🛍️</span>
              <span>Items in this Order ({items.length})</span>
            </h3>

            <div className="placed-items-list">
              {items.map((it, idx) => {
                const itemImg = it.image || it.images?.[0] || it.product?.images?.[0] || '/images/categories_straight.jpg'
                const optImg = getOptimizedImageUrl(itemImg, 'thumbnail')
                const itName = it.name || it.product?.name || 'Artisan Couture Outfit'
                const itPrice = it.price || it.product?.price || 0
                const itQty = it.quantity || 1
                const itSize = it.size || 'M'
                const itColor = it.color && it.color.toLowerCase() !== 'standard' ? it.color : null

                return (
                  <div key={it._id || idx} className="placed-item-row">
                    <img
                      src={optImg}
                      alt={itName}
                      className="placed-item-thumb"
                      onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                    />
                    <div className="placed-item-info">
                      <h4 className="placed-item-name">{itName}</h4>
                      <div className="placed-item-meta">
                        <span className="meta-pill">Size: {itSize}</span>
                        {itColor && <span className="meta-pill">Color: {itColor}</span>}
                        <span className="meta-pill">Qty: {itQty}</span>
                      </div>
                    </div>
                    <div className="placed-item-price">
                      ₹{(itPrice * itQty).toLocaleString('en-IN')}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Price Breakdown */}
            <div className="placed-price-breakdown">
              <div className="price-line">
                <span>Items Subtotal:</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="price-line discount">
                  <span>Coupon Savings ({order.couponCode || 'PROMO'}):</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="price-line free-shipping">
                <span>Priority Insured Shipping:</span>
                <span>FREE</span>
              </div>

              <div className="price-line total-line">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery Details & Payment Method */}
          <div className="placed-card-block">
            <h3 className="card-block-title">
              <span>📍</span>
              <span>Delivery &amp; Payment Details</span>
            </h3>

            {/* Store Channel / Order Type */}
            <div className="info-sub-box">
              <span className="info-sub-label">Store Channel / Order Type</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                {isOffline ? (
                  <>
                    <span className="channel-tag offline">🏬 Offline Store Order</span>
                    <span style={{ fontSize: '0.82rem', color: '#78716C' }}>Local Fulfillment (Pincode: <strong>122103</strong>)</span>
                  </>
                ) : (
                  <>
                    <span className="channel-tag online">🌐 Online Store Order</span>
                    <span style={{ fontSize: '0.82rem', color: '#78716C' }}>Pan-India Express Doorstep Delivery</span>
                  </>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="info-sub-box">
              <span className="info-sub-label">{isOffline ? 'Store Destination / Recipient' : 'Shipping Destination'}</span>
              <p className="info-sub-val">
                <strong>{customerName}</strong><br />
                {customerAddress.street && `${customerAddress.street}, `}
                {customerAddress.city && `${customerAddress.city}, `}
                {customerAddress.state && `${customerAddress.state} - `}
                <strong>{customerAddress.pincode}</strong><br />
                {customerPhone && <span>Phone: {customerPhone}</span>}
              </p>
            </div>

            {/* Payment Method */}
            <div className="info-sub-box">
              <span className="info-sub-label">Payment Method</span>
              <p className="info-sub-val">
                <strong>{isCod ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay / UPI / Card)'}</strong>
              </p>
              <div>
                {isPaid ? (
                  <span className="badge-payment-status paid">
                    ✓ Payment Completed
                  </span>
                ) : isCod ? (
                  <span className="badge-payment-status cod-pending">
                    ⏳ Pay ₹{grandTotal.toLocaleString('en-IN')} Cash on Delivery
                  </span>
                ) : (
                  <span className="badge-payment-status cod-pending">
                    ⏳ Pending Verification
                  </span>
                )}
              </div>
            </div>

            {/* Notification Confirmation Email */}
            {customerEmail && (
              <p className="email-notification-notice">
                ✉️ A detailed confirmation receipt has been sent to <strong>{customerEmail}</strong>.
              </p>
            )}

            {/* Direct Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-placed-ghost"
                onClick={handlePrint}
              >
                🖨️ Print / Download Order Receipt
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM PRIMARY ACTION BUTTONS                                 */}
        {/* ============================================================ */}
        <div className="placed-actions-strip">
          <Link to="/orders" className="btn-placed-primary">
            <span>📦 View in My Orders</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>

          <Link to="/" className="btn-placed-secondary">
            <span>🛍️ Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderPlacedPage
