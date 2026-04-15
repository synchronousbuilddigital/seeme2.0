import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getImageUrl } from '../utils/imageHelper'
import './CategoryPages.css'

const PalazzoPage = () => {
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useContext(CartContext)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
    window.scrollTo(0, 0)
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products?category=palazzo')
      const data = await response.json()
      
      if (data.success) {
        const activeProducts = data.data.filter(p => p.stock > 0 && p.isActive)
        setProducts(activeProducts)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="category-page">
      <div className="category-hero" style={{ background: 'linear-gradient(135deg, var(--primary-gold) 0%, var(--dark-gold) 100%)' }}>
        <div className="category-hero-overlay">
          <motion.div 
            className="category-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <button className="back-btn" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
            <h1>Palazzo Suits</h1>
            <p>Comfortable and stylish palazzo suits for modern elegance</p>
            <div className="product-count">{products.length} Products Available</div>
          </motion.div>
        </div>
      </div>

      <div className="category-container">
        {loading ? (
          <div className="loading-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h3>No products available</h3>
            <p>Check back soon for new arrivals</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                className="product-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="product-image-container">
                  <img 
                    src={getImageUrl(product.images?.[0])}
                    alt={product.name}
                    className="product-image"
                  />
                  
                  <motion.button 
                    className={`wishlist-btn ${isInWishlist(product._id) ? 'active' : ''}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleWishlist(product)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </motion.button>

                  {product.stock < 10 && (
                    <div className="stock-badge">Only {product.stock} left</div>
                  )}
                </div>

                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  
                  <div className="product-meta">
                    <span className="product-price">₹{product.price?.toLocaleString('en-IN')}</span>
                    
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="product-sizes">
                        {product.sizes.slice(0, 3).map(size => (
                          <span key={size} className="size-badge">{size}</span>
                        ))}
                        {product.sizes.length > 3 && <span className="size-badge">+{product.sizes.length - 3}</span>}
                      </div>
                    )}
                  </div>

                  <motion.button
                    className="add-to-cart-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PalazzoPage
