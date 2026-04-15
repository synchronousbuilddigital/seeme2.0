import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './FabricsPage.css'

const FabricsPage = () => {
  const [fabrics, setFabrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFabric, setSelectedFabric] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchFabrics()
  }, [])

  const fetchFabrics = async () => {
    try {
      const response = await fetch('/api/site-settings')
      const data = await response.json()
      
      if (data.success && data.data.fabrics) {
        setFabrics(data.data.fabrics.sort((a, b) => a.order - b.order))
      }
    } catch (error) {
      console.error('Error fetching fabrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (fabric) => {
    setSelectedFabric(fabric)
  }

  const closeModal = () => {
    setSelectedFabric(null)
  }

  if (loading) {
    return (
      <div className="fabrics-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading Fabrics...</p>
      </div>
    )
  }

  if (fabrics.length === 0) {
    return (
      <div className="fabrics-page-empty">
        <h2>No Fabrics Available</h2>
        <p>Check back soon for our fabric collection!</p>
      </div>
    )
  }

  return (
    <div className="fabrics-page">
      {/* Hero Section */}
      <motion.div 
        className="fabrics-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="fabrics-hero-overlay"></div>
        <motion.div 
          className="fabrics-hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="fabrics-hero-badge">Premium Quality</span>
          <h1 className="fabrics-hero-title">Our Fabrics</h1>
          <p className="fabrics-hero-subtitle">Discover the Finest Materials for Your Perfect Outfit</p>
          <div className="fabrics-hero-divider"></div>
        </motion.div>
      </motion.div>

      {/* Introduction */}
      <motion.div 
        className="fabrics-intro"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2>The Art of Fabric Selection</h2>
        <p>
          At See Mee, we believe that the foundation of every beautiful garment lies in the quality of its fabric. 
          Each material is carefully selected for its texture, drape, and ability to bring our designs to life. 
          Explore our collection of premium fabrics, each with its own unique character and charm.
        </p>
      </motion.div>

      {/* Fabrics Magazine Layout */}
      <div className="fabrics-magazine-section">
        {fabrics.map((fabric, index) => (
          <motion.div
            key={fabric._id || index}
            className={`fabric-magazine-item ${index % 2 === 0 ? 'image-right' : 'image-left'}`}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="fabric-magazine-content">
              <motion.div 
                className="fabric-text-side"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.div 
                  className="fabric-details"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <h4>Characteristics:</h4>
                  <ul>
                    {['Luxurious texture and feel', 'Excellent drape and flow', 'Easy to maintain and care for', 'Perfect for ethnic wear', 'Available in various colors'].map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6 + (idx * 0.1) }}
                      >
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div 
                  className="fabric-care"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  <h4>Care Instructions:</h4>
                  <p>Dry clean recommended for best results. Hand wash in cold water if needed. Iron on low heat.</p>
                </motion.div>
              </motion.div>

              <motion.div 
                className="fabric-image-side"
                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.div 
                  className="fabric-image-container"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                >
                  <img 
                    src={getOptimizedImageUrl(fabric.image, 'hero')} 
                    alt={fabric.title}
                    className="fabric-magazine-image"
                  />
                  <motion.div 
                    className="fabric-image-overlay"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <motion.span 
                      className="fabric-overlay-kicker"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.8 }}
                    >
                      Premium Fabric
                    </motion.span>
                    <motion.h3 
                      className="fabric-overlay-title"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                    >
                      {fabric.title}
                    </motion.h3>
                    <motion.div 
                      className="fabric-overlay-divider"
                      initial={{ width: 0 }}
                      whileInView={{ width: 60 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 1.0 }}
                    />
                    <motion.p 
                      className="fabric-overlay-description"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 1.1 }}
                    >
                      {fabric.description}
                    </motion.p>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Why Choose Our Fabrics */}
      <motion.div 
        className="fabrics-benefits"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2>Why Choose Our Fabrics?</h2>
        <div className="benefits-grid">
          <motion.div 
            className="benefit-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="benefit-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3>Premium Quality</h3>
            <p>Only the finest materials sourced from trusted suppliers</p>
          </motion.div>

          <motion.div 
            className="benefit-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="benefit-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>Long-Lasting</h3>
            <p>Durable fabrics that maintain their beauty over time</p>
          </motion.div>

          <motion.div 
            className="benefit-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="benefit-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3>Comfort First</h3>
            <p>Breathable and comfortable for all-day wear</p>
          </motion.div>

          <motion.div 
            className="benefit-card"
            whileHover={{ scale: 1.05 }}
          >
            <div className="benefit-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h3>Value for Money</h3>
            <p>Premium quality at competitive prices</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Fabric Detail Modal */}
      <AnimatePresence>
        {selectedFabric && (
          <motion.div 
            className="fabric-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div 
              className="fabric-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="fabric-modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="fabric-modal-layout">
                <div className="fabric-modal-image">
                  <img 
                    src={getOptimizedImageUrl(selectedFabric.image, 'hero')} 
                    alt={selectedFabric.title}
                  />
                </div>

                <div className="fabric-modal-info">
                  <span className="fabric-modal-badge">Premium Fabric</span>
                  <h2 className="fabric-modal-title">{selectedFabric.title}</h2>
                  <p className="fabric-modal-description">{selectedFabric.description}</p>
                  
                  <div className="fabric-modal-features">
                    <h4>Characteristics:</h4>
                    <ul>
                      <li>Luxurious texture and feel</li>
                      <li>Excellent drape and flow</li>
                      <li>Easy to maintain and care for</li>
                      <li>Perfect for ethnic wear</li>
                      <li>Available in various colors</li>
                    </ul>
                  </div>

                  <div className="fabric-modal-care">
                    <h4>Care Instructions:</h4>
                    <p>Dry clean recommended for best results. Hand wash in cold water if needed. Iron on low heat.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FabricsPage
