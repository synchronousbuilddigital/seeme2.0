import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './CategoryPage.css'

const CategoryPage = () => {
  const { categoryName } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useContext(CartContext)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  // Format category name for display (e.g., "palazzo" -> "Palazzo Suits")
  const displayName = categoryName ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) : ''
  const fullDisplayName = `${displayName} ${categoryName === 'fabrics' ? '' : 'Collection'}`

  useEffect(() => {
    fetchProducts()
    window.scrollTo(0, 0)
  }, [categoryName])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}?category=${categoryName}`)
      const data = await response.json()
      
      if (data.success) {
        const activeProducts = data.data.filter(p => p.isActive)
        setProducts(activeProducts)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="editorial-category-page">
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
      {/* Editorial Header */}
      <header className="category-header">
        <div className="header-bg-text">{categoryName?.toUpperCase()}</div>
        <div className="header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="category-label">The Collection</span>
            <h1 className="category-title">{fullDisplayName}</h1>
            <p className="category-desc">
              Experience the grace of {displayName} silhouettes, blending traditional craftsmanship with contemporary luxury.
            </p>
          </motion.div>
        </div>
      </header>

      {/* Filter & Info Bar */}
      <div className="category-info-bar">
        <div className="bar-left">
          <span className="product-count-luxury">{products.length} Pieces found</span>
        </div>
      </div>

      {/* Product Grid Area */}
      <section className="category-main">
        <div className="category-grid-container">
          {loading ? (
            <div className="category-loading">
              <div className="luxury-spinner"></div>
              <p>Curating your collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="category-empty">
              <h3>Awaiting New Arrivals</h3>
              <p>Our {displayName} collection is currently being curated. Check back soon for the latest pieces.</p>
              <button className="return-btn" onClick={() => navigate('/')}>Return to Atelier</button>
            </div>
          ) : (
            <div className="luxury-product-grid">
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  className="luxury-product-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  onClick={() => {
                    const productId = product._id || product.id;
                    if (productId) navigate(`/product/${productId}`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-media">
                    <img 
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name}
                      className="card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/categories_straight.jpg'
                      }}
                    />
                    <div className="card-actions">
                      <button 
                        className={`action-wishlist ${isInWishlist(product._id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                    </div>
                    {product.stock < 5 && <div className="card-badge-limited">Limited Edition</div>}
                  </div>
                  
                  <div className="card-info">
                    <div className="card-header">
                      <h3 className="product-name-luxury">{product.name}</h3>
                      <span className="product-price-luxury">₹{product.price?.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="product-excerpt">{product.description}</p>
                    <div className="card-footer-luxury">
                      <div className="available-sizes">
                        {product.sizes?.map(size => (
                          <span key={size} className="size-pill">{size}</span>
                        ))}
                      </div>
                      <motion.button 
                        className="add-to-bag-btn"
                        whileHover={{ backgroundColor: '#1a1a1a', color: '#fff' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        Add to Bag
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Optional: About the Category Section */}
      <section className="category-footer-editorial">
        <div className="editorial-content-centered">
          <span className="editorial-mini-label">Modern Heritage</span>
          <h2 className="editorial-heading-small">Tradition, Tailored for Today</h2>
          <p className="editorial-text-centered">
            Our {displayName} collection celebrates the richness of Indian textiles through clean,
            contemporary silhouettes. Every piece is crafted for effortless elegance, blending cultural
            artistry with modern confidence.
          </p>
          <div className="editorial-pill-row" aria-hidden="true">
            <span className="editorial-pill">Handpicked Fabrics</span>
            <span className="editorial-pill">Refined Silhouettes</span>
            <span className="editorial-pill">Modern Craft</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CategoryPage
