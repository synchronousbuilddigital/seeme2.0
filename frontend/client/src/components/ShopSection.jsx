import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
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
        const response = await fetch(API_ENDPOINTS.PRODUCTS)
        const data = await response.json()
        if (data.success && data.data) {
          // Display up to 8 active products on the homepage
          const activeProducts = data.data.filter(p => p.isActive).slice(0, 8)
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
      <div className="shop-loading">
        <div className="shop-spinner"></div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <section className="homepage-shop-section" id="shop">
      <div className="shop-container">
        {/* Section Header */}
        <header className="shop-header">
          <div className="header-label">Aesthetic Curation</div>
          <h2 className="shop-title">SHOP THE ATELIER</h2>
          <div className="shop-accent-line"></div>
          <p className="shop-subtitle">
            Explore our ready-to-wear luxury silhouettes designed for effortless style and exceptional grace.
          </p>
        </header>

        {/* Product Grid */}
        <div className="shop-products-grid">
          {products.map((product, idx) => (
            <motion.div 
              key={product._id}
              className="shop-product-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
            >
              {/* Product Media */}
              <div className="product-media-wrapper">
                <img 
                  src={getOptimizedImageUrl(product.images?.[0], 'catalog')} 
                  alt={product.name}
                  className="product-main-img"
                  onClick={() => navigate(`/product/${product._id}`)}
                />
                
                {/* Wishlist Button */}
                <button 
                  className={`product-wishlist-btn ${isInWishlist(product._id) ? 'active' : ''}`}
                  onClick={() => toggleWishlist(product)}
                  aria-label="Add to Wishlist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>

                {/* Quick Add Overlay */}
                <div className="quick-add-overlay">
                  <button className="quick-add-btn" onClick={() => addToCart(product)}>
                    ADD TO BAG
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="product-details-content">
                <div className="product-category-tag">{product.category}</div>
                <h3 
                  className="product-card-title"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.name}
                </h3>
                <div className="product-price-row">
                  <span className="price-val">₹{product.price?.toLocaleString()}</span>
                  <button className="shop-bag-btn-mini" onClick={() => addToCart(product)}>
                    ADD
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="shop-explore-footer">
          <button className="shop-view-all-btn" onClick={() => navigate('/collections')}>
            EXPLORE MORE
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ShopSection
