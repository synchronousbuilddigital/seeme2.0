import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { isCategoryForAudience } from '../utils/categoryHelper'
import './CategoryTabs.css'

const BLOB_TABS_DATA = [
  {
    key: 'all',
    title: 'All',
    image: '/images/category_card_all.jpg',
  },
  {
    key: 'men',
    title: 'Men',
    image: '/images/category_card_men.jpg',
  },
  {
    key: 'women',
    title: 'Women',
    image: '/images/category_card_women.jpg',
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
        if (adminCategories.all.length === 0) setLoading(true)
        const [settingsRes, prodRes] = await Promise.all([
          cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { ttlMs: 300000 }).catch(() => null),
          cachedFetch(API_ENDPOINTS.PRODUCTS, { ttlMs: 300000 }).catch(() => null)
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
      {/* Organic Blob Category Cards Nav (Matching Reference Image) */}
      <div className="blob-tabs-nav-wrapper">
        <div className="blob-tabs-bar-container">
          <div className="blob-cards-grid">
            {BLOB_TABS_DATA.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <motion.div
                  key={tab.key}
                  className={`blob-category-card blob-card-${tab.key} ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.key)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >


                  {/* Left Circular Avatar Photo Frame */}
                  <div className="blob-avatar-frame">
                    <img src={tab.image} alt={tab.title} className="blob-avatar-img" />
                  </div>

                  {/* Right Content: Serif Title + Circle Arrow Button */}
                  <div className="blob-card-content">
                    <h3 className="blob-card-title">{tab.title}</h3>
                    <button
                      type="button"
                      className="blob-arrow-btn"
                      aria-label={`Explore ${tab.title}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTabClick(tab.key)
                        navigate(`/collections?gender=${tab.key}`)
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
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
              <motion.div
                key={activeTab}
                className="category-avatars-track"
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
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
          )}
        </div>
      </div>
    </section>
  )
}

export default CategoryTabs

