import { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { trackViewCart, trackBeginCheckout } from '../utils/gtmEcommerce'
import './CartPage.css'

const CartPage = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    isInWishlist,
    appliedCoupon,
    couponDiscount,
    isFreeShippingFromCoupon,
    couponLoading,
    applyCoupon,
    removeCoupon
  } = useContext(CartContext)

  const navigate = useNavigate()

  const [includeGiftWrap, setIncludeGiftWrap] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [toastMessage, setToastMessage] = useState(null)
  const [couponError, setCouponError] = useState(null)

  const FREE_SHIPPING_THRESHOLD = 5000
  const GIFT_WRAP_FEE = 250

  useEffect(() => {
    fetchAvailableCoupons()
  }, [])

  const fetchAvailableCoupons = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.COUPON_AVAILABLE)
      const contentType = res.headers.get('content-type') || ''
      if (!res.ok || !contentType.includes('application/json')) return
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setAvailableCoupons(data.data)
      }
    } catch (err) {
      console.error('Error fetching available coupons:', err)
    }
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      let price = 0
      if (item.price) {
        if (typeof item.price === 'string') {
          price = parseInt(item.price.replace(/[₹,]/g, '')) || 0
        } else if (typeof item.price === 'number') {
          price = item.price
        }
      }
      return total + (price * (item.quantity || 1))
    }, 0)
  }

  const subtotal = calculateSubtotal()
  const isFreeShipping = true
  const shippingFee = 0
  const giftWrapFee = includeGiftWrap ? GIFT_WRAP_FEE : 0
  const grandTotal = Math.max(0, subtotal + shippingFee + giftWrapFee - couponDiscount)

  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleApplyCouponCode = async (e, codeOverride) => {
    if (e) e.preventDefault()
    const targetCode = codeOverride || promoCode
    setCouponError(null)

    try {
      const res = await applyCoupon(targetCode)
      showToast(res.message || `✦ Coupon "${targetCode}" applied successfully! 🎉`)
      setPromoCode('')
    } catch (err) {
      setCouponError(err.message || 'Failed to apply coupon')
      showToast(`❌ ${err.message || 'Invalid Coupon'}`)
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    setCouponError(null)
    showToast('Coupon removed from shopping bag.')
  }

  useEffect(() => {
    if (cart && cart.length > 0) {
      try {
        trackViewCart(cart)
      } catch (e) {
        console.error('GTM error in trackViewCart:', e)
      }
    }
  }, [cart?.length])

  const handleMoveToWishlist = (item) => {
    const itemId = item.id || item._id
    toggleWishlist(item)
    removeFromCart(itemId, item.selectedSize || item.size)
    showToast(`✦ Moved "${item.name}" to your Wishlist ❤️`)
  }

  const handleCheckout = () => {
    try {
      trackBeginCheckout(cart, appliedCoupon?.code || '')
    } catch (e) {
      console.error('GTM error in trackBeginCheckout:', e)
    }
    navigate('/checkout', {
      state: {
        giftWrap: includeGiftWrap,
        promoCode: appliedCoupon?.code || '',
        discountAmount: couponDiscount || 0
      }
    })
  }

  const handleContinueShopping = () => {
    navigate('/collections')
  }

  // ── EMPTY SHOPPING BAG STATE ──────────────────────────
  if (cart.length === 0) {
    return (
      <div className="cart-page-wrapper empty-state">
        <div className="cart-editorial-back">
          <button onClick={() => navigate(-1)} className="editorial-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>
        </div>

        <motion.div 
          className="empty-cart-hero-box"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="empty-bag-icon-badge">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>

          <span className="editorial-gold-tag">✦ SEEMEE ATELIER</span>
          <h1 className="empty-cart-title">Your Shopping Bag is Empty</h1>
          <p className="empty-cart-subtitle">
            Explore our heritage drapes, velvet kurtis, and royal sharara sets to begin your couture journey.
          </p>

          <div className="empty-cart-actions">
            <button className="btn-explore-gold" onClick={handleContinueShopping}>
              Explore Shop Collections
            </button>
            <button className="btn-explore-dark" onClick={() => navigate('/catalog')}>
              Watch Catalog Reels ✦
            </button>
          </div>

          <div className="empty-cart-quick-links">
            <span className="quick-label">Popular Categories:</span>
            <div className="quick-chips">
              <Link to="/category/2-piece-sets">2-Piece Sets</Link>
              <Link to="/category/3-piece-sets">3-Piece Sets</Link>
              <Link to="/category/co-ord-sets">Co-ord Sets</Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── ACTIVE SHOPPING BAG STATE ─────────────────────────
  return (
    <div className="cart-page-wrapper">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="cart-toast-banner"
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Editorial Breadcrumb Bar */}
      <div className="cart-editorial-back">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>

        <nav className="cart-breadcrumbs">
          <Link to="/">Home</Link>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">Shopping Bag</span>
        </nav>
      </div>

      {/* Hero Title Header */}
      <header className="cart-hero-header">
        <div className="cart-header-left">
          <span className="cart-atelier-tag">✦ SEEMEE SHOPPING BAG</span>
          <h1 className="cart-page-title">Review Your Selections</h1>
        </div>
        <div className="cart-header-right">
          <span className="cart-items-badge">
            {cart.reduce((total, i) => total + (i.quantity || 1), 0)} Items Selected
          </span>
        </div>
      </header>



      {/* Main 2-Column Grid */}
      <div className="cart-main-grid">
        {/* Left Column: Cart Items List */}
        <div className="cart-items-column">
          <div className="cart-items-list">
            <AnimatePresence>
              {cart.map((item, index) => {
                const itemId = item.id || item._id
                let itemPrice = 0
                if (item.price) {
                  if (typeof item.price === 'string') {
                    itemPrice = parseInt(item.price.replace(/[₹,]/g, '')) || 0
                  } else if (typeof item.price === 'number') {
                    itemPrice = item.price
                  }
                }
                const itemQuantity = item.quantity || 1
                const itemLineTotal = itemPrice * itemQuantity
                const itemSize = item.selectedSize || item.size || 'M'
                const itemKey = `${itemId}-${itemSize}`
                const inWish = isInWishlist(itemId)

                return (
                  <motion.div
                    key={itemKey}
                    className="cart-item-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    {/* Item Thumbnail */}
                    <div className="item-media-box" onClick={() => navigate(`/product/${itemId}`)}>
                      <img
                        src={getOptimizedImageUrl(item.images?.[0] || item.image, 'product')}
                        alt={item.name}
                        className="item-media-img"
                      />
                    </div>

                    {/* Item Information */}
                    <div className="item-content-box">
                      <div className="item-header-row">
                        <div>
                          <div className="item-category-size-meta">
                            <span className="cat-chip">{item.category || 'Atelier Collection'}</span>
                            <span className="size-chip">Size: <strong>{itemSize}</strong></span>
                          </div>
                          <h3 
                            className="item-name-title" 
                            onClick={() => navigate(`/product/${itemId}`)}
                          >
                            {item.name}
                          </h3>
                        </div>
                        
                        <button 
                          className="item-remove-btn"
                          onClick={() => removeFromCart(itemId, itemSize)}
                          title="Remove from Bag"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="item-controls-price-row">
                        {/* Quantity Stepper */}
                        <div className="item-quantity-stepper">
                          <button 
                            onClick={() => updateQuantity(itemId, itemQuantity - 1, itemSize)}
                            disabled={itemQuantity <= 1}
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="quantity-val">{itemQuantity}</span>
                          <button 
                            onClick={() => updateQuantity(itemId, itemQuantity + 1, itemSize)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Price Display */}
                        <div className="item-price-block">
                          <span className="unit-price-label">₹{itemPrice.toLocaleString('en-IN')} each</span>
                          <span className="line-total-price">₹{itemLineTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Card Footer Quick Actions */}
                      <div className="item-card-actions">
                        <button 
                          className={`btn-wishlist-action ${inWish ? 'in-wish' : ''}`}
                          onClick={() => handleMoveToWishlist(item)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill={inWish ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          <span>{inWish ? 'In Wishlist' : 'Move to Wishlist'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Available Coupon Suggestions Widget */}
          {availableCoupons.length > 0 && (
            <div className="coupon-suggestions-widget">
              <div className="suggestions-header">
                <span className="sparkle-icon">🎁</span>
                <h4>AVAILABLE ATELIER COUPONS</h4>
              </div>
              <div className="suggestions-list">
                {availableCoupons.map(c => {
                  const isApplied = appliedCoupon?.code === c.code
                  return (
                    <div key={c._id || c.code} className={`coupon-suggestion-card ${isApplied ? 'applied' : ''}`}>
                      <div className="coupon-card-left">
                        <span className="coupon-code-badge">✦ {c.code}</span>
                        <p className="coupon-card-desc">{c.description || `${c.percentage ? `${c.percentage}% OFF` : `₹${c.fixedAmount} OFF`}`}</p>
                      </div>
                      <button 
                        className={`btn-apply-suggestion ${isApplied ? 'btn-applied' : ''}`}
                        onClick={() => handleApplyCouponCode(null, c.code)}
                        disabled={couponLoading || isApplied}
                      >
                        {isApplied ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bottom Actions Row */}
          <div className="cart-bottom-actions-row">
            <button className="btn-continue-exploring" onClick={handleContinueShopping}>
              ← Continue Exploring Collections
            </button>
            <button className="btn-clear-entire-bag" onClick={clearCart}>
              Clear Bag
            </button>
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <aside className="cart-summary-column">
          <div className="summary-glass-card">
            <h2 className="summary-card-title">Order Summary</h2>
            <div className="summary-gold-divider" />

            {/* Financial Rows */}
            <div className="summary-financial-rows">
              <div className="financial-row">
                <span>Items Subtotal ({cart.reduce((t, i) => t + (i.quantity || 1), 0)})</span>
                <span className="row-val">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="financial-row">
                <span>White-Glove Express Shipping</span>
                <span className={`row-val ${isFreeShipping ? 'free-tag' : ''}`}>
                  {isFreeShipping ? 'COMPLIMENTARY' : `₹${shippingFee.toLocaleString('en-IN')}`}
                </span>
              </div>

              {/* Royal Gift Wrapping Option Toggle */}
              <div className="gift-wrap-toggle-box">
                <label className="gift-wrap-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeGiftWrap}
                    onChange={(e) => setIncludeGiftWrap(e.target.checked)}
                  />
                  <div className="gift-wrap-text">
                    <span className="gift-title">👑 Royal Presentation Gift Box</span>
                    <span className="gift-sub">Embossed gold box, satin ribbon & handwritten note (+ ₹250)</span>
                  </div>
                </label>
              </div>

              {/* Coupon Code Input & Applied State Box */}
              <div className="promo-code-box">
                {appliedCoupon ? (
                  <div className="applied-coupon-card">
                    <div className="applied-coupon-info">
                      <span className="applied-coupon-title">✦ {appliedCoupon.code} APPLIED</span>
                      <span className="applied-coupon-savings">Savings: ₹{couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                    <button className="btn-remove-coupon-x" onClick={handleRemoveCoupon} title="Remove Coupon">
                      ✕
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCouponCode} className="promo-input-row">
                    <input
                      type="text"
                      placeholder="Enter Coupon Code (e.g. WELCOME10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={couponLoading}
                    />
                    <button 
                      type="submit" 
                      className="btn-apply-promo"
                      disabled={couponLoading || !promoCode.trim()}
                    >
                      {couponLoading ? 'Validating...' : 'Apply'}
                    </button>
                  </form>
                )}

                {couponError && (
                  <div className="coupon-error-banner">
                    <span>⚠️ {couponError}</span>
                  </div>
                )}
              </div>

              {couponDiscount > 0 && (
                <div className="financial-row discount-row">
                  <span>Coupon Savings ({appliedCoupon?.code})</span>
                  <span className="row-val discount-val">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="summary-grand-total-box">
              <div className="grand-total-label-wrap">
                <span className="total-title">Total Investment</span>
                <span className="total-taxes-note">Inclusive of all taxes & duties</span>
              </div>
              <span className="grand-total-amount">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            {/* Checkout Button */}
            <motion.button
              className="btn-proceed-checkout"
              onClick={handleCheckout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>PROCEED TO SECURE CHECKOUT</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </motion.button>

            {/* Trust Badges List */}
            <div className="summary-trust-badges">
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>100% Authentic Handloom & Couture</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <span>Insured Express Royal Delivery</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                <span>Complimentary 7-Day Fit & Size Exchange</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Mobile Action Bar (<= 768px) */}
      <div className="mobile-sticky-cart-bar">
        <div className="mobile-bar-info">
          <span className="mobile-bar-label">Total Payable</span>
          <span className="mobile-bar-price">₹{grandTotal.toLocaleString('en-IN')}</span>
        </div>
        <button className="mobile-bar-checkout-btn" onClick={handleCheckout}>
          Checkout ({cart.length})
        </button>
      </div>
    </div>
  )
}

export default CartPage
