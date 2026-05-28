import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './FabricsPage.css'

const FabricsPage = () => {
  const navigate = useNavigate()
  const [fabrics, setFabrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFabric, setSelectedFabric] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchFabrics()
  }, [])

  const fetchFabrics = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SITE_SETTINGS)
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
      {/* Cinematic Hero */}
      <section className="fabrics-hero-editorial">
        <motion.div 
          className="hero-media-wrapper"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <img 
            src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Fabrics" 
            className="hero-media"
          />
          <div className="hero-scrim"></div>
        </motion.div>
        
        <div className="hero-editorial-content">
          <motion.span 
            className="editorial-kicker"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            THE TACTILE COLLECTION
          </motion.span>
          <motion.h1 
            className="editorial-title"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Art of the <br/> <span className="italic">Weave</span>
          </motion.h1>
          <motion.div 
            className="hero-scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="scroll-line"></div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Narrative */}
      <section className="fabrics-narrative">
        <div className="editorial-container">
          <div className="narrative-grid">
            <div className="narrative-left">
              <h2 className="narrative-heading">Foundation of <br/> Excellence</h2>
            </div>
            <div className="narrative-right">
              <p className="narrative-body">
                At SEEMEE, we believe that the soul of a garment is its fabric. Our selection process is an obsessive pursuit of the perfect drape, the softest touch, and the most enduring luster. From the whispering silks of Varanasi to the structured elegance of hand-loomed cottons, each thread is chosen to tell a story of luxury that you can feel against your skin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fabric Journal (The Collection) */}
      <section className="fabric-journal">
        <div className="editorial-container">
          <div className="journal-header">
            <span className="journal-count">{fabrics.length} COLLECTIONS</span>
            <h2 className="journal-title">The Textile Gallery</h2>
          </div>

          <div className="journal-grid">
            {fabrics.map((fabric, index) => (
              <motion.div
                key={fabric._id || index}
                className="journal-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: (index % 3) * 0.1 }}
                onClick={() => openModal(fabric)}
              >
                <div className="card-image-wrapper">
                  <img 
                    src={getOptimizedImageUrl(fabric.image, 'hero')} 
                    alt={fabric.title}
                    className="card-image"
                  />
                  <div className="card-hover-info">
                    <span>EXPLORE DETAILS</span>
                  </div>
                </div>
                <div className="card-content">
                  <span className="card-category">PREMIUM SELECTION</span>
                  <h3 className="card-title">{fabric.title}</h3>
                  <div className="card-line"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Excellence (Benefits) */}
      <section className="fabrics-technical">
        <div className="editorial-container">
          <div className="technical-grid">
            <div className="tech-item">
              <span className="tech-num">01</span>
              <h3 className="tech-title">Sustainably Sourced</h3>
              <p className="tech-desc">We partner only with weaving clusters that practice ethical harvesting and fair wages.</p>
            </div>
            <div className="tech-item">
              <span className="tech-num">02</span>
              <h3 className="tech-title">Breathable Luxury</h3>
              <p className="tech-desc">Our natural fibers ensure all-day comfort, designed for the dynamic climate of the modern world.</p>
            </div>
            <div className="tech-item">
              <span className="tech-num">03</span>
              <h3 className="tech-title">Everlasting Color</h3>
              <p className="tech-desc">Using deep-saturation dyeing techniques that maintain their vibrancy for a lifetime of wear.</p>
            </div>
          </div>
        </div>
      </section>


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
