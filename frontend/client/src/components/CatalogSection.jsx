import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './CatalogSection.css'

const CatalogSection = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const activeVideoRef = useRef(null)
  const progressAnimRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const fetchAdminReels = async () => {
      try {
        if (items.length === 0) setLoading(true)
        const reelsRes = await cachedFetch(API_ENDPOINTS.REELS, { ttlMs: 300000 })
        const reelsData = (reelsRes?.success && Array.isArray(reelsRes.data)) ? reelsRes.data : []

        // Map strictly and exclusively reels published in Admin Panel Catalog Reels
        const reelItems = reelsData.map(r => ({
          id: r._id,
          title: r.title || r.product?.name || 'Catalog Reel',
          caption: r.caption || '',
          videoUrl: r.videoUrl,
          image: r.coverImage || r.product?.images?.[0] || r.product?.image,
          link: r.product ? `/product/${r.product._id || r.product.id}` : '/catalog',
          product: r.product
        })).filter(r => Boolean(r.videoUrl || r.image))

        if (isMounted) {
          setItems(reelItems)
          if (reelItems.length > 0) {
            setActiveIndex(0)
          }
        }
      } catch (err) {
        console.error('Error fetching admin reels:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAdminReels()
    return () => { isMounted = false }
  }, [])

  // Progress animation for current story reel
  useEffect(() => {
    if (items.length === 0) return
    setProgress(0)

    const currentItem = items[activeIndex]
    let intervalId

    if (!currentItem?.videoUrl) {
      // Image story progress timer (5 seconds)
      const startTime = Date.now()
      const duration = 5000

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime
        const pct = Math.min(100, (elapsed / duration) * 100)
        setProgress(pct)

        if (pct >= 100) {
          clearInterval(intervalId)
          nextStory()
        }
      }, 50)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [activeIndex, items])

  const handleVideoTimeUpdate = () => {
    const vid = activeVideoRef.current
    if (vid && vid.duration) {
      const pct = (vid.currentTime / vid.duration) * 100
      setProgress(pct)
    }
  }

  const handleVideoEnd = () => {
    nextStory()
  }

  const nextStory = () => {
    setActiveIndex(prev => (prev + 1) % items.length)
  }

  const prevStory = () => {
    setActiveIndex(prev => (prev - 1 + items.length) % items.length)
  }

  const currentItem = items[activeIndex] || null

  if (loading && items.length === 0) {
    return null
  }

  return (
    <section className="catalog-showcase-section" id="catalog-reels">
      <div className="catalog-showcase-container">
        {/* Main 2-Column Layout matching Reference Screenshot */}
        <div className="catalog-showcase-grid">
          
          {/* Left Column: Phone Mockup Frame Playing Reels */}
          <div className="catalog-phone-column">
            <div className="phone-mockup-frame">
              {/* Phone Speaker Notch */}
              <div className="phone-top-notch" />

              {/* Instagram Story Progress Segment Bars */}
              <div className="story-progress-bar-group">
                {items.map((_, idx) => {
                  let barWidth = '0%'
                  if (idx < activeIndex) barWidth = '100%'
                  else if (idx === activeIndex) barWidth = `${progress}%`

                  return (
                    <div key={idx} className="story-progress-segment">
                      <div
                        className="story-progress-fill"
                        style={{ width: barWidth }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Story Video / Image Content */}
              <div className="phone-screen-content">
                <AnimatePresence mode="wait">
                  {currentItem && (
                    <motion.div
                      key={currentItem.id || activeIndex}
                      className="phone-media-wrapper"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentItem.videoUrl ? (
                        <video
                          ref={activeVideoRef}
                          src={currentItem.videoUrl}
                          poster={getOptimizedImageUrl(currentItem.image, 'hero')}
                          autoPlay
                          playsInline
                          muted={isMuted}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onEnded={handleVideoEnd}
                          className="phone-video-element"
                        />
                      ) : (
                        <img
                          src={getOptimizedImageUrl(currentItem.image, 'hero')}
                          alt={currentItem.title}
                          className="phone-image-element"
                          onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                        />
                      )}

                      {/* Video Sound Toggle Button */}
                      {currentItem.videoUrl && (
                        <button
                          type="button"
                          className="phone-mute-btn"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? '🔇' : '🔊'}
                        </button>
                      )}

                      {/* Center Instagram Brand Watermark Badge matching screenshot */}
                      <div className="phone-brand-watermark">
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="url(#insta-grad-overlay)" strokeWidth="2">
                          <defs>
                            <linearGradient id="insta-grad-overlay" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f09433" />
                              <stop offset="25%" stopColor="#e6683c" />
                              <stop offset="50%" stopColor="#dc2743" />
                              <stop offset="75%" stopColor="#cc2366" />
                              <stop offset="100%" stopColor="#bc1888" />
                            </linearGradient>
                          </defs>
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                        <span>@SEEMEE.FASHIONS</span>
                      </div>

                      {/* Screen Navigation Tap Areas (Left/Right) */}
                      <div className="phone-tap-area phone-tap-left" onClick={prevStory} />
                      <div className="phone-tap-area phone-tap-right" onClick={nextStory} />

                      {/* Bottom Product Overlay Info */}
                      <div className="phone-bottom-overlay">
                        {currentItem.product?.category && (
                          <span className="phone-card-tag">
                            {currentItem.product.category.toUpperCase()}
                          </span>
                        )}
                        <h3 className="phone-card-title">{currentItem.title}</h3>
                        
                        <div className="phone-card-action-row">
                          {currentItem.product?.price && (
                            <span className="phone-price-badge">
                              ₹{Number(currentItem.product.price).toLocaleString('en-IN')}
                            </span>
                          )}
                          <button
                            type="button"
                            className="phone-buy-btn"
                            onClick={() => navigate(currentItem.link || '/catalog')}
                          >
                            <span>VIEW</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Showcase Info Text */}
          <div className="catalog-text-column">
            <div className="showcase-header-content">
              <span className="showcase-eyebrow">EXCLUSIVE LOOKBOOK</span>
              <h2 className="showcase-title">
                Catalog <br /><span className="showcase-title-gold">Showcase</span>
              </h2>
              <div className="showcase-underline" />
              <p className="showcase-description">
                Reel-style stories of every new look. Tap a ring to jump, or let it play.
              </p>
            </div>
            
            <div className="showcase-action-content">
              <button
                type="button"
                className="showcase-explore-btn"
                onClick={() => navigate('/catalog')}
              >
                <span>EXPLORE ALL REELS</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default CatalogSection
