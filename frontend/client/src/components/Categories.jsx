import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getImageUrl } from '../utils/imageHelper'
import './Categories.css'

const Fabrics = () => {
  const navigate = useNavigate()
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [fabrics, setFabrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAdminCategories = async () => {
      try {
        const [settingsData, prodData] = await Promise.all([
          cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true }),
          cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=12&status=active`)
        ])

        const activeProducts = prodData?.success && Array.isArray(prodData.data) ? prodData.data : []
        let categoryList = []

        if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides) && settingsData.data.categorySlides.length > 0) {
          // Strictly use categories created and managed in Admin Panel
          categoryList = settingsData.data.categorySlides.filter(Boolean)
        } else {
          // Fallback dynamically to distinct product categories uploaded in Admin Panel
          const existingSlugs = new Set()
          activeProducts.forEach(p => {
            if (!p || !p.category) return
            const slug = p.category.toLowerCase().trim()
            if (!existingSlugs.has(slug)) {
              const titleFormatted = p.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              categoryList.push({
                slug,
                title: titleFormatted,
                subtitle: 'Admin Collection',
                description: `Curated designs in ${titleFormatted}.`,
                image: p.images?.[0] || p.image || ''
              })
              existingSlugs.add(slug)
            }
          })
        }

        const mapped = categoryList.filter(Boolean).map((cat, idx) => {
          const catSlug = (cat.slug || cat.title || '').toLowerCase()
          const matchedProd = activeProducts.find(p => p.category && p.category.toLowerCase().includes(catSlug))

          return {
            id: cat._id || cat.slug || idx,
            slug: cat.slug || catSlug.replace(/\s+/g, '-'),
            title: cat.title || cat.name || 'Category',
            label: cat.subtitle || 'Atelier Collection',
            description: cat.description || `Explore our curated ${cat.title || 'collection'}.`,
            image: getImageUrl(cat.image || matchedProd?.images?.[0] || matchedProd?.image || '')
          }
        }).filter(c => Boolean(c.image))

        setFabrics(mapped)
      } catch (err) {
        console.error('Error loading dynamic admin categories:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAdminCategories()
  }, [])

  if (loading || fabrics.length === 0) return null

  return (
    <section className="fabrics-theme-section" id="fabrics">
      <div className="theme-container">
        <header className="theme-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="header-content"
          >
            <span className="theme-eyebrow">Artisanal Materials</span>
            <h2 className="theme-title">Our <span>Category</span> Showcase</h2>
            <div className="theme-divider"></div>
          </motion.div>
        </header>

        <div className="theme-grid">
          {fabrics.map((fabric, index) => (
            <motion.div
              key={fabric.id}
              className="theme-card"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/category/${fabric.slug}`)}
            >
              <div className="theme-media">
                <img src={fabric.image} alt={fabric.title} loading="lazy" />
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div 
                      className="theme-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="overlay-content">
                        <span className="overlay-label">{fabric.label}</span>
                        <h3 className="overlay-title">{fabric.title}</h3>
                        <p className="overlay-desc">{fabric.description}</p>
                        <div className="overlay-btn">Explore Category</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="theme-footer">
                <span className="card-num">0{index + 1}</span>
                <span className="card-name">{fabric.title}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="theme-explore">
          <motion.button 
            className="theme-btn"
            whileHover={{ gap: '2rem' }}
            onClick={() => navigate('/categories')}
          >
            View All Categories
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </motion.button>
        </footer>
      </div>
    </section>
  )
}

export default Fabrics
