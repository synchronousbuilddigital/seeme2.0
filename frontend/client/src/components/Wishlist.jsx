import { useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './Wishlist.css'

const Wishlist = ({ isOpen, onClose }) => {
  const { wishlist, toggleWishlist, addToCart } = useContext(CartContext)

  const handleAddToCart = (product) => {
    addToCart(product)
  }

  const handleRemoveFromWishlist = (product) => {
    toggleWishlist(product)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="wishlist-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Wishlist Sidebar */}
            <motion.div
              className="wishlist-sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="wishlist-header">
                <div className="wishlist-title-section">
                  <h2 className="wishlist-title">My Wishlist</h2>
                  <span className="wishlist-count-badge">{wishlist.length} items</span>
                </div>
                <motion.button
                  className="close-btn"
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              </div>

              <div className="wishlist-content">
                {wishlist.length === 0 ? (
                  <div className="empty-wishlist">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                    >
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </motion.div>
                    <h3>Your wishlist is empty</h3>
                    <p>Start adding items you love!</p>
                  </div>
                ) : (
                  <div className="wishlist-items">
                    <AnimatePresence>
                      {wishlist.map((item) => {
                        // Normalize ID
                        const itemId = item.id || item._id
                        
                        return (
                          <motion.div
                            key={itemId}
                            className="wishlist-item"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            layout
                          >
                            <div className="item-image-container">
                              <img 
                                src={getOptimizedImageUrl(item.images?.[0] || item.image, 'thumbnail')} 
                                alt={item.name} 
                              />
                            </div>
                            
                            <div className="item-details">
                              <h3 className="item-name">{item.name}</h3>
                              <p className="item-price">{item.price}</p>
                              
                              <div className="item-actions">
                                <motion.button
                                  className="add-to-cart-btn"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAddToCart(item)}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="9" cy="21" r="1"/>
                                    <circle cx="20" cy="21" r="1"/>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                                  </svg>
                                  Add to Cart
                                </motion.button>
                                
                                <motion.button
                                  className="remove-btn"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveFromWishlist(item)}
                                  title="Remove from wishlist"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {wishlist.length > 0 && (
                <div className="wishlist-footer">
                  <motion.button
                    className="continue-shopping-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                  >
                    Continue Shopping
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Wishlist
