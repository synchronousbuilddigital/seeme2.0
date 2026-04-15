import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './NewArrivals.css'

const NewArrivals = () => {
  const navigate = useNavigate()
  const [arrivals, setArrivals] = useState([])
  const [imageErrors, setImageErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Category display names
  const categoryLabels = {
    'anarkali': 'Anarkali Suit',
    'palazzo': 'Palazzo Suit',
    'straight-cut': 'Straight Cut Suit'
  }

  useEffect(() => {
    fetchArrivals()
  }, [])

  const fetchArrivals = async () => {
    try {
      const response = await fetch('/api/new-arrivals')
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        // Transform data to include display properties
        const transformedArrivals = data.data.map(item => ({
          id: item._id,
          category: item.category,
          image: item.image,
          alt: categoryLabels[item.category] || item.category,
          fallbackText: categoryLabels[item.category] || item.category
        }))
        setArrivals(transformedArrivals)
      }
    } catch (error) {
      console.error('Error fetching arrivals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  const handleCategoryClick = () => {
    const element = document.getElementById('categories')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  if (loading) {
    return null
  }
  
  if (arrivals.length === 0) {
    return null
  }

  return (
    <section className="new-arrivals" id="new-arrivals">
      <div className="new-arrivals-container">
        <motion.div 
          className="arrivals-banner"
          initial={isMobile ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
          whileInView={isMobile ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: isMobile ? 0.4 : 0.8, ease: "easeOut" }}
        >
          {/* Decorative Border Frame */}
          <div className="banner-frame">
            <div className="frame-corner top-left"></div>
            <div className="frame-corner top-right"></div>
            <div className="frame-corner bottom-left"></div>
            <div className="frame-corner bottom-right"></div>
            
            {/* Floral Decorations */}
            <div className="floral-decoration left-top"></div>
            <div className="floral-decoration right-top"></div>
            <div className="floral-decoration left-bottom"></div>
            <div className="floral-decoration right-bottom"></div>
          </div>

          {/* Content Area */}
          <div className="banner-content">
            {/* Left Side - Images */}
            <div className="arrivals-images">
              {arrivals.map((arrival, index) => (
                <motion.div
                  key={arrival.id}
                  className="arrival-image-wrapper"
                  initial={isMobile ? { opacity: 0 } : { x: -50, opacity: 0 }}
                  whileInView={isMobile ? { opacity: 1 } : { x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: isMobile ? 0.3 : 0.6, delay: isMobile ? 0 : index * 0.1 }}
                  whileHover={isMobile ? {} : { scale: 1.05, y: -10 }}
                  onClick={() => handleCategoryClick(arrival.category)}
                >
                  <div className="arrival-image-placeholder">
                    {arrival.image && !imageErrors[arrival.id] ? (
                      <img 
                        src={getOptimizedImageUrl(arrival.image, isMobile ? 'mobile-card' : 'product')} 
                        alt={arrival.alt}
                        loading="lazy"
                        onError={() => handleImageError(arrival.id)}
                      />
                    ) : (
                      <div className="image-upload-hint">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span>{arrival.fallbackText}</span>
                        <span className="upload-instruction">Upload Image in Admin Panel</span>
                      </div>
                    )}
                  </div>
                  <div className="arrival-overlay">
                    <span>View {arrival.alt}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right Side - Text & CTA */}
            <motion.div 
              className="arrivals-text"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="text-content">
                <h2 className="arrivals-title">NEW ARRIVALS</h2>
                <motion.button 
                  className="shop-arrivals-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/new-arrivals')}
                >
                  Explore New Arrivals
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="decorative-leaves">
            <div className="leaf leaf-1"></div>
            <div className="leaf leaf-2"></div>
            <div className="leaf leaf-3"></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default NewArrivals
