import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cachedFetch } from '../utils/cachedFetch'
import { API_ENDPOINTS } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { belongsToAudience } from '../utils/categoryHelper'
import './LatestTrendsSection.css'

const fallbackProducts = [
  {
    _id: 'trend-1',
    name: 'Chanderi Silk Drape Saree',
    price: 12999,
    category: 'Sarees',
    image: '/images/categories_straight.jpg',
    targetAudience: ['women', 'all'],
    description: 'Every saree carries a story woven into its silk.'
  },
  {
    _id: 'trend-2',
    name: 'Royal Heritage Anarkali Set',
    price: 15499,
    category: 'Anarkali',
    image: '/images/categories_straight.jpg',
    targetAudience: ['women', 'all'],
    description: 'Heritage craftsmanship tailored for royal celebrations.'
  },
  {
    _id: 'trend-3',
    name: 'Artisanal Handloom Kurta Set',
    price: 8999,
    category: 'Kurti Sets',
    image: '/images/categories_straight.jpg',
    targetAudience: ['men', 'all'],
    description: 'Contemporary grace meets traditional handloom weaves.'
  }
]

const LatestTrendsSection = ({ activeAudience = 'all' }) => {
  const navigate = useNavigate()
  const [currentAudience, setCurrentAudience] = useState(activeAudience || 'all')
  const [newArrivals, setNewArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeAudience) {
      setCurrentAudience(activeAudience)
    }
  }, [activeAudience])

  useEffect(() => {
    fetchNewArrivalProducts()
  }, [currentAudience])

  const fetchNewArrivalProducts = async () => {
    try {
      setLoading(true)
      const data = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=100`)
      const rawList = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.products) ? data.products : [])
      const activeProds = rawList.filter(p => p.isActive !== false)

      let filtered = activeProds
      if (currentAudience && currentAudience !== 'all') {
        filtered = activeProds.filter(p => belongsToAudience(p, currentAudience))
      }

      // Strict New Arrivals Filtering for selected audience
      let newItems = filtered.filter(p =>
        p.isNewArrival === true ||
        p.isFeatured === true ||
        (Array.isArray(p.tags) && p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes('new')))
      )

      if (newItems.length < 3) {
        newItems = [...filtered].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      } else {
        newItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      }

      if (newItems.length > 0) {
        setNewArrivals(newItems.slice(0, 10))
      } else {
        setNewArrivals(fallbackProducts.filter(p => belongsToAudience(p, currentAudience)))
      }
    } catch (err) {
      console.error('Error fetching latest trends products:', err)
      setNewArrivals(fallbackProducts)
    } finally {
      setLoading(false)
    }
  }

  const handleAudienceChange = (aud) => {
    setCurrentAudience(aud)
    setActiveIndex(0)
  }

  const productsList = newArrivals.length > 0 ? newArrivals : fallbackProducts
  const totalItems = productsList.length

  // Build current visible stack of 4 cards starting at activeIndex
  const visibleCards = useMemo(() => {
    if (!productsList || productsList.length === 0) return []
    const count = Math.min(4, productsList.length)
    const result = []
    for (let i = 0; i < count; i++) {
      const itemIndex = (activeIndex + i) % productsList.length
      result.push({
        product: productsList[itemIndex],
        stackOffset: i,
        itemIndex
      })
    }
    return result
  }, [productsList, activeIndex])

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % totalItems)
  }

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + totalItems) % totalItems)
  }

  return (
    <section className="latest-trends-section">
      <div className="latest-trends-container">
        {/* Left Editorial Content */}
        <div className="latest-trends-left">
          {/* Top Control Pills Row: ALL, MEN, WOMEN */}
          <div className="trends-top-controls-row">
            <div className="trends-audience-pills">
              <button
                type="button"
                className={`trends-audience-pill ${currentAudience === 'all' ? 'active' : ''}`}
                onClick={() => handleAudienceChange('all')}
              >
                ALL
              </button>
              <button
                type="button"
                className={`trends-audience-pill ${currentAudience === 'men' ? 'active' : ''}`}
                onClick={() => handleAudienceChange('men')}
              >
                MEN
              </button>
              <button
                type="button"
                className={`trends-audience-pill ${currentAudience === 'women' ? 'active' : ''}`}
                onClick={() => handleAudienceChange('women')}
              >
                WOMEN
              </button>
            </div>
          </div>

          <h2 className="trends-giant-heading">
            <span className="trends-word">LATEST</span>
            <span className="trends-word gold-accent">TRENDS</span>
          </h2>

          <button
            className="trends-discover-btn"
            onClick={() => navigate('/collections')}
          >
            DISCOVER NOW
          </button>
        </div>

        {/* Right Stacked Book / Card Slider Showcase */}
        <div className="latest-trends-right">
          <div className="trends-top-drag-hint">
            <span>DRAG TO BROWSE ({currentAudience.toUpperCase()})</span>
          </div>

          <div className="stacked-cards-wrapper">
            <div className="stacked-cards-deck">
              <AnimatePresence mode="popLayout">
                {visibleCards.map(({ product: prod, stackOffset, itemIndex }) => {
                  const isTop = stackOffset === 0
                  const zIndex = totalItems - stackOffset

                  const imgUrl = (prod.images && prod.images.length > 0)
                    ? prod.images[0]
                    : (prod.image || '/images/categories_straight.jpg')

                  return (
                    <motion.div
                      key={`${currentAudience}-${prod._id || prod.id || itemIndex}`}
                      className={`stacked-card-item ${isTop ? 'active-top' : ''}`}
                      style={{ zIndex }}
                      initial={{ scale: 0.9, opacity: 0, x: 40 }}
                      animate={{
                        scale: 1 - stackOffset * 0.05,
                        x: stackOffset * 14,
                        y: stackOffset * 8,
                        rotateY: stackOffset * -2,
                        opacity: 1 - stackOffset * 0.15
                      }}
                      exit={{ scale: 0.85, opacity: 0, x: -60 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      onClick={() => {
                        if (isTop) {
                          const pid = prod._id || prod.id
                          if (pid) navigate(`/product/${pid}`)
                        } else {
                          setActiveIndex(itemIndex)
                        }
                      }}
                    >
                      <div className="card-image-box">
                        <img
                          src={getOptimizedImageUrl(imgUrl, 'product')}
                          alt={prod.name}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = '/images/categories_straight.jpg' }}
                        />
                        <div className="card-hover-overlay">
                          <span className="overlay-badge">✦ NEW ARRIVAL • {currentAudience.toUpperCase()}</span>
                          <h4 className="overlay-prod-name">{prod.name}</h4>
                          <span className="overlay-prod-price">₹{Number(prod.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Pagination & Navigation Controls */}
          <div className="trends-deck-controls">
            <button className="deck-arrow-btn" onClick={handlePrev} title="Previous Product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span className="deck-page-counter">
              {(activeIndex % totalItems) + 1} / {totalItems}
            </span>
            <button className="deck-arrow-btn" onClick={handleNext} title="Next Product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LatestTrendsSection
