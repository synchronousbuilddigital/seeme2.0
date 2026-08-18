import { useState, useContext, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { API_ENDPOINTS } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { trackViewCart, trackBeginCheckout } from '../utils/gtmEcommerce'
import './Cart.css'

const Cart = ({ isOpen, onClose }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    appliedCoupon,
    couponDiscount,
    couponLoading,
    applyCoupon,
    removeCoupon,
    availableCoupons
  } = useContext(CartContext)
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [cartCouponInput, setCartCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    if (isOpen && cart.length > 0) {
      try {
        trackViewCart(cart)
      } catch (e) {
        console.error('GTM error in trackViewCart:', e)
      }
    }
  }, [isOpen, cart.length])

  const handleApplyCoupon = async (e, codeOverride) => {
    if (e) e.preventDefault()
    const targetCode = codeOverride || cartCouponInput
    if (!targetCode || !targetCode.trim()) return
    setCouponError('')
    try {
      await applyCoupon(targetCode)
      setCartCouponInput('')
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code')
    }
  }

  const handleCheckout = () => {
    try {
      trackBeginCheckout(cart)
    } catch (e) { }
    onClose()
    navigate('/checkout')
  }

  const handleViewCart = () => {
    onClose()
    navigate('/cart')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="cart-sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="cart-header">
              <h2>Your Cart</h2>
              <button className="cart-close" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <p>Your cart is empty</p>
                  <button className="continue-shopping" onClick={onClose}>
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {cart.map((item) => {
                    const itemId = item.id || item._id
                    const itemSize = item.selectedSize || item.size || 'S'
                    const itemKey = `${itemId}-${itemSize}`
                    const itemPrice = typeof item.price === 'number'
                      ? item.price
                      : parseInt(String(item.price || 0).replace(/[₹,]/g, '')) || 0

                    return (
                      <motion.div
                        key={itemKey}
                        className="cart-item"
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                      >
                        <div className="cart-item-image">
                          <img
                            src={getOptimizedImageUrl(item.images?.[0] || item.image, 'thumbnail')}
                            alt={item.name}
                          />
                        </div>

                        <div className="cart-item-details">
                          <h3>{item.name}</h3>
                          <div className="cart-item-meta">
                            <span className="cart-item-price">₹{itemPrice.toLocaleString('en-IN')}</span>
                            <span className="cart-item-size-tag">Size: <strong>{itemSize}</strong></span>
                          </div>

                          <div className="cart-item-quantity">
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity - 1, itemSize)}
                              className="qty-btn"
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity + 1, itemSize)}
                              className="qty-btn"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          className="cart-item-remove"
                          onClick={() => removeFromCart(itemId, itemSize)}
                          title="Remove item"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </motion.div>
                    )
                  })}
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                {/* Side Cart Coupon Section */}
                <div className="side-cart-coupon-wrap">
                  {appliedCoupon ? (
                    <div className="side-cart-applied-coupon">
                      <div className="applied-info">
                        <span className="gold-code">✦ {appliedCoupon.code}</span>
                        <span className="sub-savings">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                      </div>
                      <button type="button" className="btn-remove-side-coupon" onClick={() => removeCoupon()} title="Remove Coupon">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="side-cart-coupon-controls">
                      {availableCoupons.length > 0 && (
                        <div className="side-cart-custom-coupons">
                          <span className="side-cart-coupon-title">AVAILABLE OFFERS</span>
                          <div className="side-cart-chips-grid">
                            {availableCoupons.map(c => {
                              const isSelected = cartCouponInput === c.code
                              return (
                                <button
                                  type="button"
                                  key={c._id || c.code}
                                  className={`side-cart-chip ${isSelected ? 'active' : ''}`}
                                  onClick={() => {
                                    setCartCouponInput(c.code)
                                    handleApplyCoupon(null, c.code)
                                  }}
                                  disabled={couponLoading}
                                >
                                  <span className="chip-code">✦ {c.code}</span>
                                  <span className="chip-tag">{c.percentage ? `${c.percentage}% OFF` : `₹${c.fixedAmount} OFF`}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleApplyCoupon} className="side-cart-coupon-form">
                        <input
                          type="text"
                          placeholder="Or enter promo code"
                          value={cartCouponInput}
                          onChange={(e) => setCartCouponInput(e.target.value.toUpperCase())}
                          disabled={couponLoading}
                        />
                        <button type="submit" disabled={couponLoading || !cartCouponInput.trim()}>
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </form>
                    </div>
                  )}
                  {couponError && <span className="side-cart-coupon-err">⚠️ {couponError}</span>}
                </div>

                <div className="cart-total">
                  <span>Total</span>
                  <span className="total-amount">₹{getCartTotal()}</span>
                </div>
                <motion.button
                  className="view-cart-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewCart}
                >
                  View Cart
                </motion.button>
                <motion.button
                  className="checkout-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Cart
