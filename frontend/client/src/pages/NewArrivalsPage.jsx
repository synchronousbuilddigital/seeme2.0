import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './NewArrivalsPage.css'

const NewArrivalsPage = () => {
  const navigate = useNavigate()
  const [arrivals, setArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArrival, setSelectedArrival] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

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
      const response = await fetch(API_ENDPOINTS.NEW_ARRIVALS)
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        const transformedArrivals = data.data.map(item => ({
          id: item._id,
          category: item.category,
          image: item.image,
          title: item.name || categoryLabels[item.category] || item.category,
          description: item.description || categoryDescriptions[item.category] || 'Discover our latest collection',
          price: item.price,
          mrp: item.mrp || item.discountPrice || item.originalPrice
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

  const categories = ['all', ...new Set(arrivals.map((arrival) => arrival.category).filter(Boolean))]

  const filteredArrivals = activeCategory === 'all'
    ? arrivals
    : arrivals.filter((arrival) => arrival.category === activeCategory)

  const featuredArrival = filteredArrivals[0] || arrivals[0]
  const arrivalCount = filteredArrivals.length
  const totalCount = arrivals.length

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
      <section className="arrivals-hero">
        <div className="hero-copy">
          <span className="eyebrow">Fresh from the atelier</span>
          <h1>New Arrivals</h1>
          <p>
            A cleaner, more editorial view of the latest pieces, with a spotlight on the season's standout silhouette.
          </p>

          <div className="hero-actions">
            <button className="hero-primary-btn" onClick={() => navigate('/collections')} type="button">
              Explore Collections
            </button>
            <button className="hero-secondary-btn" onClick={() => featuredArrival && openModal(featuredArrival)} type="button">
              View Spotlight
            </button>
          </div>

          <div className="hero-metrics">
            <div>
              <strong>{String(totalCount).padStart(2, '0')}</strong>
              <span>Total arrivals</span>
            </div>
            <div>
              <strong>{String(arrivalCount).padStart(2, '0')}</strong>
              <span>Showing now</span>
            </div>
            <div>
              <strong>{categories.length - 1}</strong>
              <span>Categories</span>
            </div>
          </div>
        </div>

        <motion.div
          className="hero-spotlight"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={featuredArrival ? getOptimizedImageUrl(featuredArrival.image, 'hero') : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200'}
            alt={featuredArrival?.title || 'Featured arrival'}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=1200'
            }}
          />
          <div className="spotlight-card">
            <span className="spotlight-label">Featured piece</span>
            <h2>{featuredArrival?.title || 'Seasonal debut'}</h2>
            <p>{featuredArrival?.description || "Discover the season's most refined silhouette."}</p>
            <button type="button" onClick={() => featuredArrival && openModal(featuredArrival)}>
              Open lookbook
            </button>
          </div>
        </motion.div>
      </section>

      <section className="arrivals-page-body">
        <div className="arrivals-toolbar">
          <div className="toolbar-copy">
            <span className="toolbar-kicker">Curated this week</span>
            <h2>The Latest Masterpieces</h2>
            <p>Refined silhouettes with handcrafted details, arranged as a visual edit for effortless browsing.</p>
          </div>

          <div className="toolbar-meta">
            <span>{String(arrivalCount).padStart(2, '0')} Looks</span>
            <span>{String(categories.length - 1).padStart(2, '0')} Categories</span>
            <span>Luxury Pret</span>
          </div>
        </div>

        <div className="category-chips" role="tablist" aria-label="Filter arrivals by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? 'All pieces' : categoryLabels[category] || category}
            </button>
          ))}
        </div>

        <div className="arrivals-grid">
          {filteredArrivals.map((arrival, index) => (
            <motion.article
              key={arrival.id}
              className={`arrival-card ${index === 0 ? 'featured-card' : ''}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: index * 0.05 }}
            >
              <button type="button" className="arrival-card-media" onClick={() => openModal(arrival)}>
                <img 
                  src={getOptimizedImageUrl(arrival.image, 'hero')} 
                  alt={arrival.title} 
                  className="card-image" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800'
                  }}
                />
                <div className="card-overlay">
                  <span>Open details</span>
                </div>
              </button>

              <div className="arrival-card-content">
                <div className="arrival-card-topline">
                  <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="card-category">{categoryLabels[arrival.category] || arrival.category}</span>
                </div>
                <h3 className="card-title">{arrival.title}</h3>
                <p className="card-description">{arrival.description}</p>
                {(arrival.price || arrival.mrp) && (
                  <div className="card-price-group" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                    {arrival.price && (
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--charcoal, #2b2b2b)' }}>
                        ₹{Number(arrival.price).toLocaleString('en-IN')}
                      </span>
                    )}
                    {arrival.mrp && Number(arrival.mrp) > Number(arrival.price || 0) && (
                      <span style={{ fontSize: '0.88rem', color: '#999', textDecoration: 'line-through' }}>
                        ₹{Number(arrival.mrp).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}
                <span className="card-tag">New season edit</span>

                <div className="card-actions">
                  <motion.button
                    className="view-details-btn"
                    onClick={() => openModal(arrival)}
                    whileHover={{ y: -2 }}
                    type="button"
                  >
                    View details
                  </motion.button>
                  <button className="shop-now-btn" onClick={() => handleCategoryClick(arrival.category)} type="button">
                    Shop now
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.section
          className="arrivals-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="cta-kicker">More to explore</span>
          <h3>Beyond the arrival edit</h3>
          <p>Move into the full collection for coordinated looks, seasonal staples, and deeper editorial selections.</p>
          <motion.button
            className="browse-all-btn"
            onClick={() => navigate('/collections')}
            whileHover={{ y: -2 }}
            type="button"
          >
            Full collection
          </motion.button>
        </motion.section>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
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
                  <span className="modal-badge">Limited Edition</span>
                  <h2 className="modal-title">{selectedArrival.title}</h2>
                  <p className="modal-description">{selectedArrival.description}</p>
                  {(selectedArrival.price || selectedArrival.mrp) && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '12px 0' }}>
                      {selectedArrival.price && (
                        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--charcoal, #2b2b2b)' }}>
                          ₹{Number(selectedArrival.price).toLocaleString('en-IN')}
                        </span>
                      )}
                      {selectedArrival.mrp && Number(selectedArrival.mrp) > Number(selectedArrival.price || 0) && (
                        <span style={{ fontSize: '1.0rem', color: '#999', textDecoration: 'line-through' }}>
                          ₹{Number(selectedArrival.mrp).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="modal-features">
                    <h4>Artisan Details</h4>
                    <ul>
                      <li>Hand-woven premium silk and cotton blends</li>
                      <li>Traditional zardozi and thread-work embroidery</li>
                      <li>Custom tailored for a perfect silhouette</li>
                      <li>Ethically sourced and crafted</li>
                    </ul>
                  </div>

                  <button
                    className="modal-shop-btn"
                    onClick={() => {
                      handleCategoryClick(selectedArrival.category)
                      closeModal()
                    }}
                  >
                    Experience {selectedArrival.title}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NewArrivalsPage
