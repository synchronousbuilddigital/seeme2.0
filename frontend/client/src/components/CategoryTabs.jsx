import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { belongsToAudience, isProductInCategory, isCategoryForAudience } from '../utils/categoryHelper'
import './CategoryTabs.css'

const TABS_DATA = [
  {
    key: 'all',
    label: 'All',
    image: '/images/all_collection_tab.jpg'
  },
  {
    key: 'men',
    label: 'Men',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800'
  },
  {
    key: 'women',
    label: 'Women',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'
  }
]

const CategoryTabs = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('seemee_active_audience') || 'all'
  })
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
            targetAudience: getAudienceArray(slide.targetAudience),
            targetAudiences: getAudienceArray(slide.targetAudience),
            image: getOptimizedImageUrl(image, 'circle'),
            slideOrder: slide.order !== undefined ? slide.order : idx
          }
        }).filter(c => Boolean(c.image || c.title)).sort((a, b) => a.slideOrder - b.slideOrder)

        // Audience Segmentation: Strict segregation for MEN, WOMEN, and ALL matching Admin Panel
        const allList = categoriesList
        const menList = categoriesList.filter(c => isCategoryForAudience(c, 'men', activeProducts))
        const womenList = categoriesList.filter(c => isCategoryForAudience(c, 'women', activeProducts))

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
    localStorage.setItem('seemee_active_audience', tabKey)
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
            {TABS_DATA.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <motion.button
                  key={tab.key}
                  type="button"
                  className={`category-tab-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.key)}
                  whileHover={{ y: -3, scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                >
                  <div className="tab-pill-image-frame">
                    <img src={tab.image} alt={tab.label} className="tab-pill-img" />
                    {isActive && (
                      <motion.div
                        className="tab-pill-shimmer"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', repeatDelay: 0.8 }}
                      />
                    )}
                  </div>
                  <span className="tab-pill-label">
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="active-pill-underline"
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                      />
                    )}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
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
                  if (!currentItems || currentItems.length === 0) return null

                  // Repeat items to ensure group is wide enough for any screen resolution
                  const repeatCount = Math.max(4, Math.ceil(16 / currentItems.length))
                  const singleGroup = Array(repeatCount).fill(currentItems).flat()

                  const renderAvatarCard = (catItem, keyPrefix, idx) => (
                    <div
                      key={`${keyPrefix}-${catItem.id || idx}-${idx}`}
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
                  )

                  return (
                    <div className="category-marquee-track">
                      {/* Group 1 */}
                      <div className="category-marquee-group">
                        {singleGroup.map((catItem, idx) => renderAvatarCard(catItem, 'g1', idx))}
                      </div>
                      {/* Group 2 (Identical Clone for 100% Seamless Infinite Loop) */}
                      <div className="category-marquee-group" aria-hidden="true">
                        {singleGroup.map((catItem, idx) => renderAvatarCard(catItem, 'g2', idx))}
                      </div>
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
