import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { getImageUrl } from '../utils/imageHelper'
import { cachedFetch } from '../utils/cachedFetch'
import { belongsToAudience, isCategoryForAudience } from '../utils/categoryHelper'
import './CategoriesSlider.css'

const normalizeAudience = (val) => {
  if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase().trim())
  if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
  return ['all']
}

const ARCH_BG_COLORS = [
  '#F4EBE1', // Warm Sand Cream
  '#E8DFD8', // Soft Greige
  '#EFE8DE', // Soft Almond
  '#F5E6D3', // Warm Gold Tint
  '#EAE0D5', // Taupe Cream
  '#F0E5DB'  // Pure Warm Cream
]

const CategoriesSlider = ({ activeAudience = 'all' }) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAudience, setSelectedAudience] = useState(activeAudience)

  const navigate = useNavigate()

  useEffect(() => {
    setSelectedAudience(activeAudience)
  }, [activeAudience])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [prodData, settingsData] = await Promise.all([
          cachedFetch(API_ENDPOINTS.PRODUCTS, { ttlMs: 300000 }),
          cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { ttlMs: 300000 })
        ])
        const activeProducts = prodData?.success && Array.isArray(prodData.data)
          ? prodData.data
          : []

        let categoryList = []

        if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides) && settingsData.data.categorySlides.length > 0) {
          // Filter strictly by selectedAudience matching Admin Panel configuration
          categoryList = settingsData.data.categorySlides
            .filter(Boolean)
            .filter(cat => isCategoryForAudience(cat, selectedAudience, activeProducts))
            .sort((a, b) => ((a?.order || 0) - (b?.order || 0)))
        } else {
          // Fallback dynamically from active products uploaded in Admin Panel
          const existingSlugs = new Set()
          const audienceProducts = selectedAudience !== 'all'
            ? activeProducts.filter(p => belongsToAudience(p, selectedAudience))
            : activeProducts

          audienceProducts.forEach(p => {
            if (!p || !p.category) return
            const pCatSlug = p.category.toLowerCase().trim()
            if (!existingSlugs.has(pCatSlug)) {
              const titleFormatted = p.category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
              categoryList.push({
                slug: pCatSlug,
                title: titleFormatted,
                subtitle: 'Admin Collection',
                description: `Curated designs in ${titleFormatted}.`,
                features: ['Haute Couture', 'Pure Fabric', 'Editorial Cut'],
                image: p.images?.[0] || p.image || ''
              })
              existingSlugs.add(pCatSlug)
            }
          })
        }

        const mappedCategories = categoryList.filter(Boolean).map((cat, index) => {
          const catSlug = (cat?.slug || cat?.title || '').toLowerCase()
          const normCatSlug = catSlug.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
          const matchingProds = activeProducts.filter(p => {
            if (!p || !p.category) return false
            if (!belongsToAudience(p, selectedAudience)) return false
            const normPCat = p.category.toLowerCase().replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
            return normPCat === normCatSlug || p.category.toLowerCase() === catSlug
          })
          const matchedProduct = matchingProds[0]

          const prodImg = matchedProduct && (matchedProduct.images?.[0] || matchedProduct.image)
          const poolImg = activeProducts[index % activeProducts.length]?.images?.[0] || activeProducts[index % activeProducts.length]?.image

          // Strictly use Admin uploaded category slide image or Admin product image
          const finalImage = cat?.image || prodImg || poolImg || ''

          return {
            ...cat,
            indexCode: String(index + 1).padStart(2, '0'),
            productCount: matchingProds.length,
            title: cat?.title || cat?.name || 'Collection',
            features: cat?.features && cat.features.length ? cat.features : ['Luxury Tailoring', 'Pure Fabrics', 'Editorial Cut'],
            subtitle: cat?.subtitle || 'Atelier Collection',
            description: cat?.description || `Curated designs in ${cat?.title || 'collection'}.`,
            image: finalImage
          }
        }).filter(c => Boolean(c.image) && isCategoryForAudience(c, selectedAudience, activeProducts))

        setCategories(mappedCategories)
      } catch (err) {
        console.error('Error fetching category assets:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [selectedAudience])

  if (loading || categories.length === 0) return null

  const dynamicSubtitle = categories.length > 0
    ? `Explore ${categories.slice(0, 3).map(c => c?.title || 'Collection').join(', ')}${categories.length > 3 ? ' & more curated luxury ensembles.' : '.'}`
    : 'Explore curated luxury ensembles.'

  return (
    <section className="categories-runway-section" id="categories">
      {/* Background Ambient Glows */}
      <div className="categories-glow-gold" />
      <div className="categories-glow-cream" />

      <div className="categories-container">
        {/* Header Section */}
        <motion.div
          className="categories-header"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="categories-title">
            Signature <span>Categories</span>
          </h2>
          <div className="categories-header-line">
            <span className="line-diamond">✦</span>
          </div>

          {/* Interactive Audience Filter Pills */}
          <div className="categories-filter-pills">
            <button
              type="button"
              className={`cat-pill-btn ${selectedAudience === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedAudience('all')}
            >
              <span className="pill-text-desktop">ALL SILHOUETTES</span>
              <span className="pill-text-mobile">ALL</span>
            </button>
            <button
              type="button"
              className={`cat-pill-btn ${selectedAudience === 'men' ? 'active' : ''}`}
              onClick={() => setSelectedAudience('men')}
            >
              <span className="pill-text-desktop">MEN'S COUTURE</span>
              <span className="pill-text-mobile">MEN</span>
            </button>
            <button
              type="button"
              className={`cat-pill-btn ${selectedAudience === 'women' ? 'active' : ''}`}
              onClick={() => setSelectedAudience('women')}
            >
              <span className="pill-text-desktop">WOMEN'S COUTURE</span>
              <span className="pill-text-mobile">WOMEN</span>
            </button>
          </div>
        </motion.div>

        {/* Arch Category Cards Grid (5-Column Vaulted Arch Window Cards with alternating uper-nitche wave rhythm) */}
        <motion.div className="categories-arch-grid" layout>
          <AnimatePresence mode="popLayout">
            {categories.map((cat, idx) => {
              const fallbackBg = ARCH_BG_COLORS[idx % ARCH_BG_COLORS.length]
              const isStaggered = idx % 2 === 1
              const rawDesc = cat.description || cat.subtitle || `Curated designs in ${cat.title}.`
              const cleanDesc = rawDesc.replace(/\*\*/g, '').replace(/__/g, '').trim()

              return (
                <motion.div
                  key={cat._id || cat.slug || idx}
                  className={`arch-category-card ${isStaggered ? 'staggered-down' : ''}`}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={{ duration: 0.45, delay: idx * 0.06, ease: [0.25, 1, 0.5, 1] }}
                  whileHover={{ y: isStaggered ? -4 : -12 }}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                >
                  {/* Vaulted Dome Arch Top Photo Frame */}
                  <div className="arch-card-media-box" style={{ backgroundColor: fallbackBg }}>
                    {cat.image ? (
                      <img
                        src={getImageUrl(cat.image)}
                        alt={cat.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="arch-placeholder-text">
                        <span>{cat.title}</span>
                      </div>
                    )}
                    {/* Subtle sheen overlay */}
                    <div className="arch-card-sheen" />
                  </div>

                  {/* Bottom Content Section - Title + Count Row & Description */}
                  <div className="arch-card-info">
                    <div className="arch-info-header">
                      <h3 className="arch-card-title">{cat.title}</h3>
                      {cat.productCount > 0 && (
                        <span className="arch-card-count">{cat.productCount} designs</span>
                      )}
                    </div>
                    <p className="arch-card-desc">
                      {cleanDesc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Explore More Categories Button CTA */}
        <div className="explore-collections-cta">
          <motion.button
            className="explore-collections-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/categories')}
          >
            <span className="btn-sparkle">✦</span>
            <span className="btn-text">EXPLORE ALL CATEGORIES</span>
            <div className="btn-arrow-circle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </motion.button>
        </div>
      </div>
    </section>
  )
}

export default CategoriesSlider
