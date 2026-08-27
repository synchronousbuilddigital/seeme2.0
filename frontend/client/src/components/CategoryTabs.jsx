import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './CategoryTabs.css'

const CategoryTabs = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [adminCategories, setAdminCategories] = useState({
    all: [],
    men: [],
    women: []
  })
  const navigate = useNavigate()
  const scrollContainerRef = useRef(null)

  // Fetch categories strictly and exclusively from Admin Panel API (Site Settings & Admin Products)
  useEffect(() => {
    const fetchAdminCategories = async () => {
      try {
        setLoading(true)
        const [settingsRes, prodRes] = await Promise.all([
          cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true }).catch(() => null),
          cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=100&status=active`, { forceRefresh: true }).catch(() => null)
        ])

        const activeProducts = (prodRes?.success && Array.isArray(prodRes.data)) ? prodRes.data : []
        const adminSlides = (settingsRes?.success && Array.isArray(settingsRes.data?.categorySlides))
          ? settingsRes.data.categorySlides.filter(Boolean)
          : []

        const getAudienceArray = (val) => {
          if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase())
          if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
          return ['all']
        }

        // Map categories EXCLUSIVELY from Admin Panel Category Manager (SITE_SETTINGS)
        const categoriesList = adminSlides.map((slide, idx) => {
          const rawSlug = slide.slug || slide.title || ''
          const normSlug = rawSlug.toLowerCase().trim()

          // Match uploaded Admin product for image fallback ONLY if slide.image is missing
          const matchedProd = activeProducts.find(p => {
            if (!p || !p.category) return false
            const pNorm = p.category.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
            const sNorm = normSlug.replace(/[^a-z0-9]/g, '')
            return pNorm === sNorm
          })

          const image = slide.image || matchedProd?.images?.[0] || matchedProd?.image || ''

          return {
            id: slide._id || `admin-${normSlug || idx}`,
            title: slide.title || slide.name || rawSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            slug: normSlug,
            targetAudiences: getAudienceArray(slide.targetAudience),
            image: getOptimizedImageUrl(image, 'category'),
            slideOrder: slide.order !== undefined ? slide.order : idx
          }
        }).filter(c => Boolean(c.image || c.title)).sort((a, b) => a.slideOrder - b.slideOrder)

        // Audience Segmentation: Allow categories to appear in multiple panels if checked (e.g. MEN and WOMEN)
        const allList = categoriesList.filter(c => c.targetAudiences.includes('all'))
        const menList = categoriesList.filter(c => c.targetAudiences.includes('men'))
        const womenList = categoriesList.filter(c => c.targetAudiences.includes('women'))

        setAdminCategories({
          all: allList,
          men: menList,
          women: womenList
        })
      } catch (err) {
        console.error('Error loading admin categories:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminCategories()
  }, [])

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey)
    if (onTabChange) {
      onTabChange(tabKey)
    }
  }

  const currentItems = adminCategories[activeTab] || adminCategories.all

  if (!loading && currentItems.length === 0) {
    return null
  }

  return (
    <section className={`category-tabs-section theme-${activeTab}`} id="category-navigation">
      {/* Full Bleed Tab Navigation Header Bar */}
      <div className="category-tabs-nav-wrapper">
        <div className="category-tabs-bar-container">
          <div className="category-tabs-bar">
            {['all', 'men', 'women'].map((tabKey) => {
              const isActive = activeTab === tabKey
              return (
                <button
                  key={tabKey}
                  type="button"
                  className={`category-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(tabKey)}
                >
                  <span>{tabKey.toUpperCase()}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabNotch"
                      className="category-tab-active-notch"
                      transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
        {/* Full Screen End-to-End Baseline */}
        <div className="category-tabs-baseline" />
      </div>

      <div className="category-tabs-container">
        {/* Circular Avatar Category Row below tabs */}
        <div className="category-avatars-viewport" ref={scrollContainerRef}>
          {loading ? (
            <div className="category-avatars-skeleton-track">
              {Array(6).fill(0).map((_, idx) => (
                <div key={idx} className="avatar-circle-skeleton">
                  <div className="skeleton-ring" />
                  <div className="skeleton-line" />
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="category-avatars-track"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {(() => {
                  const loopItems = currentItems.length > 0
                    ? [
                      ...currentItems, ...currentItems, ...currentItems, ...currentItems,
                      ...currentItems, ...currentItems, ...currentItems, ...currentItems
                    ]
                    : []
                  return (
                    <div className="category-avatars-track infinite-loop">
                      {loopItems.map((catItem, idx) => (
                        <div
                          key={`${catItem.id}-loop-${idx}`}
                          className="avatar-circle-card"
                          onClick={() => {
                            if (catItem.slug) {
                              navigate(`/collections?category=${catItem.slug}&gender=${activeTab}`)
                            } else {
                              navigate('/collections')
                            }
                          }}
                        >
                          <div className="avatar-circle-ring">
                            <div className="avatar-circle-image-wrapper">
                              <img
                                src={catItem.image}
                                alt={catItem.title}
                                className="avatar-circle-img"
                                loading="lazy"
                              />
                            </div>
                          </div>
                          <span className="avatar-circle-label">{catItem.title}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}

export default CategoryTabs
