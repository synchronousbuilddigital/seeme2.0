import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { getImageUrl } from '../utils/imageHelper'
import './CategoriesSlider.css'

const CategoriesSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [categories, setCategories] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_mapped_categories')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_mapped_categories')
      return cached ? false : true
    } catch {
      return true
    }
  })
 
  const categoryDefaults = {
    '2-piece-sets': {
      title: '2-Piece Sets',
      subtitle: 'Effortless Modernity',
      description: 'Stunning tunic and trouser duos that redefine casual luxury with absolute ease.',
      image: '/images/categories_straight.jpg',
      features: ['Tailored Tunic', 'Fluid Trousers', 'Premium Comfort']
    },
    '3-piece-sets': {
      title: '3-Piece Sets',
      subtitle: 'Complete Regal Grace',
      description: 'Harmonious kurta, pants, and matching dupatta sets, crafted with ancestral weaves.',
      image: '/images/ruby_bridal_sharara.png',
      features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta']
    },
    'co-ord-sets': {
      title: 'Co-ord Sets',
      subtitle: 'Contemporary Sleekness',
      description: 'Monochromatic, luxury structured matching co-ords engineered to silhouette your form.',
      image: '/images/categories_straight.jpg',
      features: ['Avant-garde Structure', 'Symmetric Drapes', 'Modern Aesthetic']
    }
  }
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    const loadCategories = async () => {
      try {
        // 1. Fetch products from backend to extract live images
        const prodRes = await fetch(API_ENDPOINTS.PRODUCTS)
        const prodData = await prodRes.json()
        const activeProducts = prodData.success && prodData.data 
          ? prodData.data.filter(p => p.isActive) 
          : []

        // 2. Fetch categories from site settings
        const settingsRes = await fetch(API_ENDPOINTS.SITE_SETTINGS)
        const settingsData = await settingsRes.json()

        let categoryList = []

        if (settingsData.success && settingsData.data && settingsData.data.categorySlides && settingsData.data.categorySlides.length > 0) {
          categoryList = settingsData.data.categorySlides
        } else {
          // Fallback to static category slider array using default mappings
          categoryList = [
            { slug: '2-piece-sets', title: '2-Piece Sets', subtitle: 'Effortless Modernity', description: 'Stunning tunic and trouser duos that redefine casual luxury with absolute ease.', features: ['Tailored Tunic', 'Fluid Trousers', 'Premium Comfort'], image: '/images/categories_straight.jpg', order: 0 },
            { slug: '3-piece-sets', title: '3-Piece Sets', subtitle: 'Complete Regal Grace', description: 'Harmonious kurta, pants, and matching dupatta sets, crafted with ancestral weaves.', features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta'], image: '/images/ruby_bridal_sharara.png', order: 1 },
            { slug: 'co-ord-sets', title: 'Co-ord Sets', subtitle: 'Contemporary Sleekness', description: 'Monochromatic, luxury structured matching co-ords engineered to silhouette your form.', features: ['Avant-garde Structure', 'Symmetric Drapes', 'Modern Aesthetic'], image: '/images/categories_straight.jpg', order: 2 }
          ]
        }

        // 3. Match each category with the first product found belonging to it in the backend
        const mappedCategories = categoryList.map(cat => {
          const matchedProduct = activeProducts.find(
            p => p.category?.toLowerCase() === cat.slug?.toLowerCase()
          )
          
          if (matchedProduct && matchedProduct.images && matchedProduct.images.length > 0) {
            return {
              ...cat,
              image: matchedProduct.images[0] // Set real product image from backend!
            }
          }
          
          // Use fallback image if no active product exists for this category yet
          const fallback = categoryDefaults[cat.slug?.toLowerCase()]
          return {
            ...cat,
            image: cat.image || fallback?.image || '/images/categories_straight.jpg'
          }
        })

        setCategories(mappedCategories)
        localStorage.setItem('seemee_mapped_categories', JSON.stringify(mappedCategories))
      } catch (err) {
        console.error('Error fetching live category assets:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()

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

