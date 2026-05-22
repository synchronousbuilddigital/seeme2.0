import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { getImageUrl } from '../utils/imageHelper'
import './CategoriesSlider.css'

const CategoriesSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
 
  const categoryDefaults = {
    anarkali: {
      title: 'Anarkali Suits',
      subtitle: 'Timeless Elegance',
      description: 'Experience the grace of flowing silhouettes with our exquisite Anarkali collection.',
      image: '/images/ruby_bridal_sharara.png',
      features: ['Flowing Silhouette', 'Embroidery', 'Premium Fabrics']
    },
    palazzo: {
      title: 'Palazzo Suits',
      subtitle: 'Modern Comfort',
      description: 'Chic and contemporary, our Palazzo suits offer the perfect blend of style and ease.',
      image: '/images/categories_straight.jpg',
      features: ['Wide-Leg Elegance', 'Versatile Style', 'Breathable Fabrics']
    },
    'straight-cut': {
      title: 'Straight Cut Suits',
      subtitle: 'Classic Sophistication',
      description: 'Defined by clean lines and understated luxury, our Straight Cut suits are a testament to timeless fashion.',
      image: '/images/categories_straight.jpg',
      features: ['Tailored Fit', 'Minimalist Design', 'Everyday Luxury']
    },
    sharara: {
      title: 'Sharara Sets',
      subtitle: 'Artisan Heritage',
      description: 'Discover the royal charm of our Sharara collection, featuring intricate handwork and premium fabrics.',
      image: '/images/ruby_bridal_sharara.png',
      features: ['Intricate Handwork', 'Royal Flare', 'Heritage Designs']
    }
  }
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Fetch categories from site settings
    fetch(API_ENDPOINTS.SITE_SETTINGS)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.categorySlides && data.data.categorySlides.length > 0) {
          setCategories(data.data.categorySlides)
        } else {
          // Fallback to product-based categories if no slides defined
          fetch(API_ENDPOINTS.GET_CATEGORIES)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data.length > 0) {
                const mapped = data.data.map((cat, idx) => {
                  const defaults = categoryDefaults[cat.toLowerCase()] || {
                    title: cat.charAt(0).toUpperCase() + cat.slice(1),
                    subtitle: 'Heritage Collection',
                    description: `Explore our ${cat} collection, crafted with artisan precision and timeless design.`,
                    image: '/images/categories_straight.jpg',
                    features: ['Premium Quality', 'Artisan Crafted', 'Timeless Style']
                  }
                  return {
                    _id: idx,
                    slug: cat.toLowerCase(),
                    ...defaults
                  }
                })
                setCategories(mapped)
              }
            })
        }
      })
      .catch(err => console.error('Error fetching categories:', err))
      .finally(() => setLoading(false))

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % categories.length)
    }, 9000)
    return () => clearInterval(interval)
  }, [categories.length])

  if (loading || categories.length === 0) return null

  const activeCategory = categories[activeIndex]
  const totalCategories = categories.length

  const goToNext = () => setActiveIndex((prev) => (prev + 1) % categories.length)
  const goToPrev = () => setActiveIndex((prev) => (prev - 1 + categories.length) % categories.length)

  return (
    <section className="categories-slider-luxury" id="categories">
      <div className="luxury-slider-container">
        <motion.div 
          className="slider-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="header-copy">
            <span className="subtitle">Explore Our</span>
            <h2 className="title">Categories</h2>
            <p className="slider-intro">
              Curated silhouettes and fabrics for every mood, crafted to feel editorial and easy to browse.
            </p>
          </div>

          <div className="header-actions">
            <div className="category-count">
              <strong>{String(totalCategories).padStart(2, '0')}</strong>
              <span>Curated categories</span>
            </div>
          </div>
        </motion.div>

        {/* Luxury Category Tabs Navigation */}
        <div className="slider-tabs-row">
          {categories.map((cat, idx) => (
            <button
              key={cat._id || idx}
              className={`slider-tab-item ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
            >
              <span className="tab-dot"></span>
              <span className="tab-title">{cat.title}</span>
            </button>
          ))}
        </div>

        <div className="slider-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              className="slider-content-grid"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="slider-visual">
                <div className="luxury-frame-accent"></div>
                <div className="image-frame">
                  <img 
                    src={getImageUrl(activeCategory.image)} 
                    alt={activeCategory.title} 
                    onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                  />
                </div>
                <div className="floating-badge">
                  <span>{activeCategory.subtitle}</span>
                </div>
              </div>

              <div className="slider-details">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="category-name">{activeCategory.title}</h3>
                  <p className="category-desc">{activeCategory.description}</p>
                  
                  <div className="feature-list">
                    {activeCategory.features.map((feature, idx) => (
                      <div key={idx} className="feature-pill">
                        <span className="dot"></span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="action-row">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/category/${activeCategory.slug}`)}
                    >
                      View {activeCategory.title}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>

                    <motion.button
                      className="explore-more-btn"
                      onClick={() => navigate('/collections')}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Explore More
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="slider-controls">
            <button onClick={goToPrev} className="ctrl-btn prev">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div className="dots">
              {categories.map((_, i) => (
                <button 
                  key={i} 
                  className={`dot ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
            <button onClick={goToNext} className="ctrl-btn next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoriesSlider

