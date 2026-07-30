import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import './ShopSection.css'

const ShopSection = () => {
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useContext(CartContext)
  
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_shop_products')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [hoveredProductId, setHoveredProductId] = useState(null)
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_shop_products')
      return cached ? false : true
    } catch {
      return true
    }
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=8&status=active`)
        if (data.success && data.data) {
          const activeProducts = data.data.slice(0, 8)
          setProducts(activeProducts)
          localStorage.setItem('seemee_shop_products', JSON.stringify(activeProducts))
        }
      } catch (error) {
        console.error('Error fetching shop products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="shop-loading-shell">
        <div className="shop-loading-spinner"></div>
      </div>
    )
  }

  if (products.length === 0) return null

  // Format category slugs to human readable labels
  const formatCategoryName = (slug) => {
    if (!slug) return 'Collection'
    if (slug.toLowerCase() === '2-piece-sets') return '2-Piece Sets'
    if (slug.toLowerCase() === '3-piece-sets') return '3-Piece Sets'
    if (slug.toLowerCase() === 'co-ord-sets') return 'Co-ord Sets'
    return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
  }

  return (
    <section className="homepage-shop-section" id="shop">
      {/* Background Subtle Lighting */}
      <div className="shop-bg-glow glow-top"></div>
      <div className="shop-bg-glow glow-bottom"></div>

      <div className="shop-container">
        {/* Editorial Section Header */}
        <motion.header 
          className="shop-header"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-badge">
            <span className="star">✦</span>
            <span className="label">READY-TO-WEAR SILHOUETTES</span>
            <span className="star">✦</span>
          </div>

          <h2 className="shop-title">
            SHOP THE <span>ATELIER</span>
          </h2>
          <div className="shop-gold-divider"></div>
          
          <p className="shop-subtitle">
            Curated luxury drapes, tunics, and coordinates crafted with ancestral precision for timeless grace.
          </p>
        </motion.header>

        {/* Product Grid */}
        <div className="shop-products-grid">
          {products.map((product, idx) => {
            const primaryImg = product.images?.[0] || product.image
            const secondaryImg = product.images?.[1] || primaryImg
            const isHovered = hoveredProductId === product._id

            return (
              <motion.div 
                key={product._id}
                className="shop-product-card"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                onMouseEnter={() => setHoveredProductId(product._id)}
                onMouseLeave={() => setHoveredProductId(null)}
              >
                {/* Clean Product Media (ZERO text overlays on photo) */}
                <div 
                  className="product-media-wrapper"
                  onClick={() => navigate(`/product/${product._id}`, { state: { product } })}
                >
                  <div className="image-flip-container">
                    <img 
                      src={getOptimizedImageUrl(isHovered ? secondaryImg : primaryImg, 'catalog')} 
                      alt={product.name}
                      className="product-main-img"
                    />
                  </div>

                  {/* Wishlist Button */}
                  <button 
                    className={`product-wishlist-btn ${isInWishlist(product._id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleWishlist(product)
                    }}
                    aria-label="Add to Wishlist"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  {/* Quick Add Overlay */}
                  <div className="quick-add-overlay">
                    <button 
                      className="quick-add-btn" 
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(product)
                      }}
                    >
                      + ADD TO BAG
                    </button>
                  </div>
                </div>

                {/* Compact Details Content (Category Tag, Title & Price + Mobile Add to Bag) */}
                <div className="product-details-content">
                  <span className="product-category-tag">
                    {formatCategoryName(product.category)}
                  </span>

                  <div className="title-price-row">
                    <h3 
                      className="product-card-title"
                      onClick={() => navigate(`/product/${product._id}`, { state: { product } })}
                    >
                      {product.name}
                    </h3>

                    <div className="card-price-group">
                      <span className="price-val">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                      {(product.mrp || product.discountPrice) && Number(product.mrp || product.discountPrice) > Number(product.price) && (
                        <span className="mrp-val">₹{Number(product.mrp || product.discountPrice).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>

                  {/* Dedicated Mobile Add to Bag Option */}
                  <button 
                    className="mobile-add-cart-btn" 
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(product)
                    }}
                    aria-label="Add to Bag"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                    </svg>
                    <span>+ ADD TO BAG</span>
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* View All CTA Footer */}
        <div className="shop-explore-footer">
          <motion.button 
            className="shop-view-all-btn" 
            onClick={() => navigate('/collections')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>EXPLORE FULL ATELIER COLLECTION</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </motion.button>
        </div>
      </div>
    </section>
  )
}

export default ShopSection
