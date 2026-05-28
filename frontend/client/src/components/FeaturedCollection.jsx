import { useContext, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useInView } from '../hooks/useInView'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './FeaturedCollection.css'

const FeaturedCollection = () => {
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useContext(CartContext)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [ref, inView] = useInView({ once: true, threshold: 0.1 })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.FEATURED_PRODUCTS)
        const data = await response.json()
        if (data.success && data.data.length > 0) {
          setProducts(data.data.filter(p => p.isActive))
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const nextProduct = () => setCurrentIndex((prev) => (prev + 1) % products.length)
  const prevProduct = () => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)

  if (loading || products.length === 0) return null

  const currentProduct = products[currentIndex]
  if (!currentProduct) return null

  return (
    <section className="classic-featured" id="featured-collection" ref={ref}>
      <div className="container">
        {/* Section Title */}
        <motion.div
          className="cf-header"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="cf-subtitle">Curated by See Mee</span>
          <h2 className="cf-main-title">FEATURED COLLECTION</h2>
          <div className="cf-divider"></div>
        </motion.div>

        {/* Showcase Area */}
        <div className="cf-showcase">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="cf-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Image Container */}
              <div
                className="cf-image-wrapper"
                onClick={() => navigate(`/product/${currentProduct._id}`)}
              >
                <img
                  src={getOptimizedImageUrl(currentProduct.images?.[0], 'hero')}
                  alt={currentProduct.name}
                  className="cf-image"
                />
                <div className="cf-badge">{currentProduct.category}</div>
              </div>

              {/* Product Info */}
              <div className="cf-info">
                <div className="cf-info-header">
                  <span className="cf-counter">0{currentIndex + 1} / 0{products.length}</span>
                  <button
                    className={`cf-wishlist ${isInWishlist(currentProduct._id) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(currentProduct)}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isInWishlist(currentProduct._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>

                <h3 className="cf-product-title">{currentProduct.name}</h3>
                <p className="cf-product-desc">
                  {currentProduct.description || "A masterpiece of heritage craftsmanship, designed for timeless grace. Elevate your ensemble with this meticulously crafted piece."}
                </p>

                <div className="cf-price">₹{currentProduct.price?.toLocaleString()}</div>

                <div className="cf-actions">
                  <button className="cf-btn-add" onClick={() => addToCart(currentProduct)}>
                    Add to Bag
                  </button>
                  <button className="cf-btn-view" onClick={() => navigate(`/product/${currentProduct._id}`)}>
                    View Details
                  </button>
                </div>

                {/* Navigation */}
                <div className="cf-nav">
                  <button onClick={prevProduct} className="cf-nav-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="cf-progress">
                    <div className="cf-progress-bar" style={{ width: `${((currentIndex + 1) / products.length) * 100}%` }}></div>
                  </div>
                  <button onClick={nextProduct} className="cf-nav-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="cf-footer">
          <button className="cf-explore" onClick={() => navigate('/collections')}>
            Explore Full Collections <span className="cf-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedCollection
