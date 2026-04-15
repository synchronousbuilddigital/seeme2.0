import { useContext, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useInView } from '../hooks/useInView'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './FeaturedCollection.css'

const FeaturedCollection = () => {
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useContext(CartContext)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)
  
  const [headerRef, headerInView] = useInView({ once: true, threshold: 0.3 })

  // Fetch featured products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?inCollection=true')
        const data = await response.json()
        
        if (data.success) {
          setProducts(data.data.filter(p => p.isActive && p.stock > 0))
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Auto-rotate slideshow
  useEffect(() => {
    if (products.length <= itemsPerView) return

    const interval = setInterval(() => {
      paginate(1)
    }, 2000)

    return () => clearInterval(interval)
  }, [currentIndex, products.length, itemsPerView])

  // Handle responsive items per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1)
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2)
      } else {
        setItemsPerView(3)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleAddToCart = (product) => {
    addToCart(product)
  }

  const handleToggleWishlist = (product) => {
    toggleWishlist(product)
  }

  const paginate = (newDirection) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => {
      const maxIndex = Math.max(0, products.length - itemsPerView)
      let newIndex = prevIndex + newDirection
      
      if (newIndex < 0) newIndex = maxIndex
      if (newIndex > maxIndex) newIndex = 0
      
      return newIndex
    })
  }

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  }

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20
    },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView)
  const canGoPrev = products.length > itemsPerView
  const canGoNext = products.length > itemsPerView

  return (
    <section className="featured-collection" id="featured-collection">
      <div className="featured-collection-container">
        <motion.div 
          ref={headerRef}
          className="collection-header"
          initial={{ opacity: 0, y: 40 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
        >
          <span className="collection-subtitle">Handpicked For You</span>
          <h2 className="collection-title">Featured Collection</h2>
          <div className="title-underline"></div>
          <p className="collection-description">
            Discover our most coveted designs, crafted with love and attention to detail
          </p>
        </motion.div>

        {loading ? (
          <div className="loading-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No collection products available</div>
        ) : (
          <div className="collection-slider-wrapper">
            {/* Navigation Buttons */}
            {canGoPrev && (
              <motion.button
                className="slider-nav prev"
                onClick={() => paginate(-1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Previous products"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </motion.button>
            )}

            <div className="collection-showcase-slider">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "tween", duration: 0.5, ease: "easeInOut" },
                    opacity: { duration: 0.3 }
                  }}
                  className="collection-showcase"
                >
                  {visibleProducts.map((product, index) => (
                    <motion.div
                      key={product._id}
                      className="showcase-item"
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div 
                        className="item-card"
                        whileHover={{ 
                          y: -10,
                          transition: { duration: 0.3 }
                        }}
                      >
                        <div className="card-background">
                          <div className="bg-circle"></div>
                        </div>
                        
                        <div className="card-image-container">
                          <motion.img 
                            src={getOptimizedImageUrl(product.images && product.images[0], 'product')}
                            alt={product.name}
                            className="product-img"
                            crossOrigin="anonymous"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.5 }}
                          />
                          <span className="item-tag">Collection</span>
                          {product.category && (
                            <span className="category-tag">
                              {product.category === 'anarkali' && 'Anarkali'}
                              {product.category === 'palazzo' && 'Palazzo'}
                              {product.category === 'straight-cut' && 'Straight Cut'}
                              {product.category === 'sharara' && 'Sharara'}
                            </span>
                          )}
                          <motion.button 
                            className={`like-btn ${isInWishlist(product._id) ? 'liked' : ''}`}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleWishlist(product)}
                            title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                            animate={isInWishlist(product._id) ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <motion.svg 
                              width="20" 
                              height="20" 
                              viewBox="0 0 24 24" 
                              fill={isInWishlist(product._id) ? "currentColor" : "none"} 
                              stroke="currentColor"
                              animate={isInWishlist(product._id) ? { 
                                fill: ["none", "currentColor"],
                                scale: [1, 1.2, 1]
                              } : {}}
                              transition={{ duration: 0.4 }}
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </motion.svg>
                          </motion.button>
                        </div>

                        <div className="card-details">
                          <h3 className="item-name">{product.name}</h3>
                          <div className="item-meta">
                            <span className="item-price">₹{product.price?.toLocaleString('en-IN')}</span>
                            <motion.button 
                              className="quick-add"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleAddToCart(product)}
                              title="Add to Cart"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {canGoNext && (
              <motion.button
                className="slider-nav next"
                onClick={() => paginate(1)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Next products"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </motion.button>
            )}

            {/* Pagination Dots */}
            {products.length > itemsPerView && (
              <div className="slider-dots">
                {Array.from({ length: Math.ceil(products.length / itemsPerView) }).map((_, index) => (
                  <motion.button
                    key={index}
                    className={`dot ${Math.floor(currentIndex / itemsPerView) === index ? 'active' : ''}`}
                    onClick={() => {
                      setDirection(index * itemsPerView > currentIndex ? 1 : -1)
                      setCurrentIndex(index * itemsPerView)
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Progress Bar */}
            {products.length > itemsPerView && (
              <motion.div 
                className="progress-bar"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 2, ease: "linear" }}
                key={currentIndex}
              />
            )}
          </div>
        )}

        <motion.div 
          className="collection-cta"
        >
          <motion.button 
            className="explore-btn"
            onClick={() => navigate('/collections')}
            whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(249, 102, 53, 0.3)" }}
            whileTap={{ scale: 0.98 }}
          >
            Explore Full Collection
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedCollection
