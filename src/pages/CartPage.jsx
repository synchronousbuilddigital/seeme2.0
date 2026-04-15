import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './CartPage.css'

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useContext(CartContext)
  const navigate = useNavigate()

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      // Handle both string and number prices, with safety checks
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
      <div className="cart-page">
        <div className="cart-page-container">
          <div className="cart-empty-state">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h1>Your Cart is Empty</h1>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <motion.button
              className="continue-shopping-btn"
              onClick={handleContinueShopping}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue Shopping
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-page-container">
        <h1 className="cart-page-title">Shopping Cart</h1>
        
        <div className="cart-page-content">
          <div className="cart-items-section">
            <div className="cart-items-header">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span></span>
            </div>

            <div className="cart-items-list">
              {cart.map((item) => {
                // Normalize ID
                const itemId = item.id || item._id
                
                // Handle both string and number prices, with safety checks
                let itemPrice = 0
                if (item.price) {
                  if (typeof item.price === 'string') {
                    itemPrice = parseInt(item.price.replace(/[₹,]/g, '')) || 0
                  } else if (typeof item.price === 'number') {
                    itemPrice = item.price
                  }
                }
                const itemTotal = itemPrice * (item.quantity || 1)

                return (
                  <motion.div
                    key={itemId}
                    className="cart-page-item"
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <div className="cart-item-product">
                      <img 
                        src={getOptimizedImageUrl(item.images?.[0] || item.image, 'thumbnail')} 
                        alt={item.name} 
                      />
                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        {item.category && <p className="cart-item-category">{item.category}</p>}
                      </div>
                    </div>

                    <div className="cart-item-price">
                      ₹{itemPrice.toLocaleString('en-IN')}
                    </div>

                    <div className="cart-item-quantity">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(itemId, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(itemId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </div>

                    <button
                      className="cart-item-remove-btn"
                      onClick={() => removeFromCart(itemId)}
                      title="Remove item"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </motion.div>
                )
              })}
            </div>

            <div className="cart-actions">
              <motion.button
                className="continue-shopping-btn"
                onClick={handleContinueShopping}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Continue Shopping
              </motion.button>
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="cart-summary">
              <h2>Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row summary-total">
                <span>Total</span>
                <span>₹{getCartTotal()}</span>
              </div>

              <motion.button
                className="checkout-btn"
                onClick={handleCheckout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Proceed to Checkout
              </motion.button>

              <div className="secure-checkout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
