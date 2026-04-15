import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './NewArrivalsPage.css'

const NewArrivalsPage = () => {
  const navigate = useNavigate()
  const [arrivals, setArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArrival, setSelectedArrival] = useState(null)

  const categoryLabels = {
    'anarkali': 'Anarkali Suit',
    'palazzo': 'Palazzo Suit',
    'straight-cut': 'Straight Cut Suit'
  }

  const categoryDescriptions = {
    'anarkali': 'Timeless elegance meets contemporary design in our latest Anarkali collection. Perfect for special occasions and celebrations.',
    'palazzo': 'Experience comfort and style with our new Palazzo suits. Flowing silhouettes that make a statement.',
    'straight-cut': 'Classic sophistication redefined. Our Straight Cut suits blend tradition with modern aesthetics.'
  }

  useEffect(() => {
    fetchArrivals()
  }, [])

  const fetchArrivals = async () => {
    try {
      const response = await fetch('/api/new-arrivals')
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        const transformedArrivals = data.data.map(item => ({
          id: item._id,
          category: item.category,
          image: item.image,
          title: categoryLabels[item.category] || item.category,
          description: categoryDescriptions[item.category] || 'Discover our latest collection'
        }))
        setArrivals(transformedArrivals)
      }
    } catch (error) {
      console.error('Error fetching arrivals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    navigate(`/category/${category}`)
  }

  const openModal = (arrival) => {
    setSelectedArrival(arrival)
  }

  const closeModal = () => {
    setSelectedArrival(null)
  }

  if (loading) {
    return (
      <div className="new-arrivals-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading New Arrivals...</p>
      </div>
    )
  }

  if (arrivals.length === 0) {
    return (
      <div className="new-arrivals-page-empty">
        <h2>No New Arrivals Yet</h2>
        <p>Check back soon for our latest collections!</p>
      </div>
    )
  }

  return (
    <div className="new-arrivals-page">
      {/* Hero Header */}
      <motion.div 
        className="arrivals-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="hero-overlay"></div>
        <motion.div 
          className="hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="hero-badge">Just Arrived</span>
          <h1 className="hero-title">New Arrivals</h1>
          <p className="hero-subtitle">Fresh Styles, Timeless Elegance</p>
          <div className="hero-divider"></div>
        </motion.div>
      </motion.div>

      {/* Arrivals Grid */}
      <div className="arrivals-content">
        <motion.div 
          className="arrivals-intro"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Discover What's New</h2>
          <p>Explore our latest additions, carefully curated to bring you the finest in ethnic fashion</p>
        </motion.div>

        <div className="arrivals-grid">
          {arrivals.map((arrival, index) => (
            <motion.div
              key={arrival.id}
              className="arrival-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -15 }}
            >
              <div className="arrival-card-inner">
                {/* Front Side */}
                <div className="arrival-card-front">
                  <div className="card-image-wrapper">
                    <img 
                      src={getOptimizedImageUrl(arrival.image, 'hero')} 
                      alt={arrival.title}
                      className="card-image"
                    />
                    <div className="card-gradient"></div>
                  </div>
                  
                  <div className="card-content">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
                      <h3 className="card-title">{arrival.title}</h3>
                      <p className="card-description">{arrival.description}</p>
                      
                      <div className="card-actions">
                        <motion.button
                          className="view-details-btn"
                          onClick={() => openModal(arrival)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          View Details
                        </motion.button>
                        <motion.button
                          className="shop-now-btn"
                          onClick={() => handleCategoryClick(arrival.category)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Shop Now
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div 
          className="arrivals-cta"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h3>Can't Decide?</h3>
          <p>Browse our complete collection to find your perfect match</p>
          <motion.button
            className="browse-all-btn"
            onClick={() => navigate('/collections')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Browse All Collections
          </motion.button>
        </motion.div>
      </div>

      {/* Detail Modal */}
      {selectedArrival && (
        <motion.div 
          className="arrival-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div 
            className="arrival-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-layout">
              <div className="modal-image-section">
                <img 
                  src={getOptimizedImageUrl(selectedArrival.image, 'hero')} 
                  alt={selectedArrival.title}
                />
              </div>

              <div className="modal-info-section">
                <span className="modal-badge">New Arrival</span>
                <h2 className="modal-title">{selectedArrival.title}</h2>
                <p className="modal-description">{selectedArrival.description}</p>
                
                <div className="modal-features">
                  <h4>Features:</h4>
                  <ul>
                    <li>Premium quality fabric</li>
                    <li>Intricate embroidery and detailing</li>
                    <li>Perfect for special occasions</li>
                    <li>Available in multiple sizes</li>
                  </ul>
                </div>

                <motion.button
                  className="modal-shop-btn"
                  onClick={() => {
                    handleCategoryClick(selectedArrival.category)
                    closeModal()
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explore {selectedArrival.title}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default NewArrivalsPage
