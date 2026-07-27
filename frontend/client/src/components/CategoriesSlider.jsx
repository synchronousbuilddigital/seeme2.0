import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { getImageUrl } from '../utils/imageHelper'
import { cachedFetch } from '../utils/cachedFetch'
import './CategoriesSlider.css'

const CategoriesSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredPanel, setHoveredPanel] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

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
      description: 'Stunning tunic and trouser duos that redefine casual luxury with absolute ease and fluid tailored drapes.',
      image: '/images/categories_straight.jpg',
      features: ['Tailored Silhouette', 'Fluid Trousers', 'Premium Comfort']
    },
    '3-piece-sets': {
      title: '3-Piece Sets',
      subtitle: 'Complete Regal Grace',
      description: 'Harmonious kurta, pants, and matching dupatta sets, hand-crafted with ancestral weaves and delicate motifs.',
      image: '/images/ruby_bridal_sharara.png',
      features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta']
    },
    'co-ord-sets': {
      title: 'Co-ord Sets',
      subtitle: 'Contemporary Sleekness',
      description: 'Monochromatic, luxury structured matching co-ords engineered to silhouette your signature look.',
      image: '/images/categories_straight.jpg',
      features: ['Avant-garde Cut', 'Symmetric Drapes', 'Modern Aesthetic']
    }
  }

  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const prodData = await cachedFetch(API_ENDPOINTS.PRODUCTS)
        const activeProducts = prodData.success && prodData.data
          ? prodData.data.filter(p => p.isActive)
          : []

        const settingsData = await cachedFetch(API_ENDPOINTS.SITE_SETTINGS)

        let categoryList = []

        if (settingsData.success && settingsData.data && settingsData.data.categorySlides && settingsData.data.categorySlides.length > 0) {
          categoryList = settingsData.data.categorySlides
        } else {
          categoryList = [
            {
              slug: '2-piece-sets',
              title: '2-Piece Sets',
              subtitle: 'Effortless Modernity',
              description: 'Stunning tunic and trouser duos that redefine casual luxury with absolute ease.',
              features: ['Tailored Tunic', 'Fluid Trousers', 'Premium Comfort'],
              image: '/images/categories_straight.jpg',
              order: 0
            },
            {
              slug: '3-piece-sets',
              title: '3-Piece Sets',
              subtitle: 'Complete Regal Grace',
              description: 'Harmonious kurta, pants, and matching dupatta sets, crafted with ancestral weaves.',
              features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta'],
              image: '/images/ruby_bridal_sharara.png',
              order: 1
            },
            {
              slug: 'co-ord-sets',
              title: 'Co-ord Sets',
              subtitle: 'Contemporary Sleekness',
              description: 'Monochromatic, luxury structured matching co-ords engineered to silhouette your form.',
              features: ['Avant-garde Structure', 'Symmetric Drapes', 'Modern Aesthetic'],
              image: '/images/categories_straight.jpg',
              order: 2
            }
          ]
        }

        const mappedCategories = categoryList.map((cat, index) => {
          const normCatSlug = cat.slug ? cat.slug.toLowerCase().replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '') : ''
          const matchingProds = activeProducts.filter(p => {
            if (!p.category) return false
            const normPCat = p.category.toLowerCase().replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
            return normPCat === normCatSlug || p.category.toLowerCase() === cat.slug?.toLowerCase()
          })
          const matchedProduct = matchingProds[0]
          const fallback = categoryDefaults[cat.slug?.toLowerCase()]

          const prodImg = matchedProduct && (matchedProduct.images?.[0] || matchedProduct.image)
          const poolImg = activeProducts[index % activeProducts.length]?.images?.[0] || activeProducts[index % activeProducts.length]?.image

          return {
            ...cat,
            indexCode: `0${index + 1}`,
            productCount: matchingProds.length || (cat.slug === '2-piece-sets' ? 14 : cat.slug === '3-piece-sets' ? 18 : 12),
            features: cat.features && cat.features.length ? cat.features : (fallback?.features || ['Luxury Tailoring', 'Pure Fabrics', 'Editorial Cut']),
            subtitle: cat.subtitle || fallback?.subtitle || 'Atelier Collection',
            description: cat.description || fallback?.description || 'Exquisite artisanal creations.',
            image: prodImg || cat.image || poolImg || 'https://res.cloudinary.com/dnuucbhwa/image/upload/v1779637240/seemee/categories/hws0gj5ey5hwxrbamgfu.png'
          }
        })

        setCategories(mappedCategories)
        localStorage.setItem('seemee_mapped_categories', JSON.stringify(mappedCategories))
      } catch (err) {
        console.error('Error fetching category assets:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  if (loading || categories.length === 0) return null

  return (
    <section className="categories-runway-section" id="categories">
      {/* Ambient Radial Lighting */}
      <div className="runway-bg-glow glow-gold-top"></div>
      <div className="runway-bg-glow glow-rose-bottom"></div>

      {/* Floating Gold Filigree Stars */}
      <div className="runway-star star-1">✦</div>
      <div className="runway-star star-2">✦</div>
      <div className="runway-star star-3">✦</div>

      <div className="runway-container">
        {/* Editorial Section Header */}
        <motion.div
          className="runway-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="header-left">
            <div className="atelier-tag">
              <span className="star-icon">✦</span>
              <span className="tag-text">ATELIER RUNWAY EXHIBITION</span>
              <span className="star-icon">✦</span>
            </div>
            <h2 className="runway-title">
              Signature <span>Categories</span>
            </h2>
            <p className="runway-subtitle">
              Curated discovery of ready-to-wear drapes, tunics & heritage weaves.
            </p>
          </div>
        </motion.div>

        {/* ACCORDION RUNWAY CANVAS (DESKTOP & MOBILE RESPONSIVE) */}
        <motion.div
          className="accordion-canvas-wrapper"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={`accordion-canvas ${isMobile ? 'mobile-grid-2col' : ''}`}>
            {categories.map((cat, idx) => {
              const isExpanded = isMobile ? true : (hoveredPanel !== null ? hoveredPanel === idx : activeIndex === idx)
              
              return (
                <motion.div
                  key={cat._id || idx}
                  className={`accordion-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
                  onMouseEnter={() => {
                    if (!isMobile) {
                      setHoveredPanel(idx)
                      setActiveIndex(idx)
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isMobile) setHoveredPanel(null)
                  }}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  transition={{ layout: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } }}
                >
                  {/* Background Panel Image with Ken Burns Zoom */}
                  <div className="panel-bg">
                    <img
                      src={getImageUrl(cat.image)}
                      alt={cat.title}
                      onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                    />
                    <div className="panel-gradient-overlay"></div>
                  </div>

                  {/* Architectural Panel Index Code */}
                  <div className="panel-index">
                    <span>{cat.indexCode}</span>
                  </div>

                  {/* Vertical Label (Visible when collapsed on Desktop) */}
                  {!isMobile && (
                    <div className="panel-vertical-label">
                      <span className="v-subtitle">{cat.subtitle}</span>
                      <span className="v-title">{cat.title}</span>
                    </div>
                  )}

                  {/* Expanded Content Card */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="panel-expanded-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      >
                        <div className="panel-badge-pill">
                          <span className="gold-sparkle">✦</span>
                          <span>{cat.productCount} Designs</span>
                        </div>

                        <h3 className="panel-category-title">{cat.title}</h3>
                        <p className="panel-category-subtitle">{cat.subtitle}</p>
                        
                        {!isMobile && (
                          <>
                            <p className="panel-category-desc">{cat.description}</p>
                            <div className="panel-features-wrap">
                              {cat.features.map((ft, fIdx) => (
                                <span key={fIdx} className="panel-feature-chip">
                                  <span className="chip-dot"></span>
                                  {ft}
                                </span>
                              ))}
                            </div>
                          </>
                        )}

                        <button
                          className="panel-cta-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/category/${cat.slug}`)
                          }}
                        >
                          <span>Explore</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CategoriesSlider
