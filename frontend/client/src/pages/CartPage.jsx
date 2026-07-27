import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './CartPage.css'

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useContext(CartContext)
  const navigate = useNavigate()

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

  const handleCheckout = () => {
    navigate('/checkout')
  }

  const handleContinueShopping = () => {
    navigate('/')
  }

  if (cart.length === 0) {
    return (
      <div className="editorial-cart-page empty">
        <motion.div 
          className="empty-cart-hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <span className="editorial-mini-label">Your Atelier</span>
          <h1 className="empty-title">The Bag is Empty</h1>
          <p className="empty-message">Your curated collection awaits its first masterpiece.</p>
          <button className="editorial-btn-gold" onClick={handleContinueShopping}>
            Explore Collections
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="editorial-cart-page">
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
      <header className="cart-header-luxury">
        <div className="header-container-luxury">
          <span className="editorial-mini-label">Shopping Bag</span>
          <h1 className="cart-main-title">Review Your Selection</h1>
          <div className="cart-count-luxury">{cart.length} Masterpieces</div>
        </div>
      </header>

      <div className="cart-grid-luxury">
        {/* Left: Items List */}
        <div className="cart-items-column">
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
              const itemTotal = itemPrice * (item.quantity || 1)

              const itemSize = item.selectedSize || item.size || 'S'
              const cartItemKey = `${itemId}-${itemSize}`

              return (
                <motion.div
                  key={cartItemKey}
                  className="editorial-cart-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                >
                  <div className="item-media-luxury" onClick={() => navigate(`/product/${itemId}`)}>
                    <img 
                      src={getOptimizedImageUrl(item.images?.[0] || item.image, 'product')} 
                      alt={item.name} 
                    />
                  </div>
                  
                  <div className="item-details-luxury">
                    <div className="item-top-row">
                      <div className="item-brand-info">
                        <div className="category-size-row">
                          <span className="item-category-luxury">{item.category}</span>
                          <span className="item-size-badge-luxury">Size: <strong>{itemSize}</strong></span>
                        </div>
                        <h3 className="item-name-luxury" onClick={() => navigate(`/product/${itemId}`)}>{item.name}</h3>
                      </div>
                      <button className="remove-luxury-btn" onClick={() => removeFromCart(itemId, itemSize)}>
                        Remove
                      </button>
                    </div>

                    <div className="item-mid-row">
                      <div className="quantity-luxury">
                        <button onClick={() => updateQuantity(itemId, item.quantity - 1, itemSize)}>—</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(itemId, item.quantity + 1, itemSize)}>+</button>
                      </div>
                      <div className="item-price-luxury">
                        ₹{itemPrice.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="item-bottom-row">
                      <div className="item-total-luxury">
                        <span className="total-label">Subtotal:</span>
                        <span className="total-value">₹{itemTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          
          <div className="cart-footer-actions">
            <button className="continue-shopping-luxury" onClick={handleContinueShopping}>
              ← Continue Exploring
            </button>
            <button className="clear-cart-luxury-btn" onClick={clearCart}>
              Clear Shopping Bag
            </button>
          </div>
        </div>

        {/* Right: Summary Sidebar */}
        <aside className="cart-summary-column">
          <div className="summary-card-luxury">
            <h2 className="summary-title-luxury">Order Summary</h2>
            
            <div className="summary-lines">
              <div className="summary-line">
                <span>Total Items</span>
                <span>{cart.length}</span>
              </div>
              <div className="summary-line">
                <span>Value</span>
                <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <span className="shipping-complimentary">Complimentary</span>
              </div>
            </div>

            <div className="summary-grand-total">
              <span className="grand-total-label">Total Investment</span>
              <span className="grand-total-value">₹{calculateSubtotal().toLocaleString('en-IN')}</span>
            </div>

            <motion.button
              className="checkout-btn-luxury"
              onClick={handleCheckout}
              whileHover={{ backgroundColor: '#1a1a1a', color: '#fff' }}
              whileTap={{ scale: 0.98 }}
            >
              Secure Checkout
            </motion.button>

            <div className="summary-guarantee">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Authenticity & Secure Payment Guaranteed</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CartPage
