import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { getImageUrl } from '../utils/imageHelper'
import { cachedFetch } from '../utils/cachedFetch'
import './FestiveBanner.css'

const LOCAL_STORAGE_KEY = 'seemee_promo_banners'

const parsePromoBanners = (data) => {
  if (!data) return []
  const rawList = Array.isArray(data.promoBanners) && data.promoBanners.length > 0
    ? data.promoBanners
    : data.festiveBanner?.image
      ? [data.festiveBanner]
      : []

  return rawList
    .filter(b => b && b.isActive !== false && b.image && String(b.image).trim().length > 0)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

const FestiveBanner = () => {
  // Initialize from persistent localStorage for instantaneous 0ms first render
  const [banners, setBanners] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error reading cached festive banners:', e)
    }
    return []
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [loaded, setLoaded] = useState(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return true
        }
      }
    } catch (e) {}
    return false
  })
  const [isPaused, setIsPaused] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)
  const navigate = useNavigate()
  const timerRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const fetchBanners = async () => {
      try {
        const response = await cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { ttlMs: 300000 })
        if (isMounted && response?.success && response.data) {
          const activeList = parsePromoBanners(response.data)

          setBanners(activeList)
          try {
            if (activeList.length > 0) {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activeList))
            } else {
              localStorage.removeItem(LOCAL_STORAGE_KEY)
            }
          } catch (e) {
            console.error('Error saving festive banners to storage:', e)
          }
        }
      } catch (err) {
        console.error('Promo banners fetch error:', err)
      } finally {
        if (isMounted) setLoaded(true)
      }
    }

    fetchBanners()

    return () => {
      isMounted = false
    }
  }, [])

  // Preload banner images for instantaneous rendering without visual flicker
  useEffect(() => {
    if (banners.length > 0) {
      banners.forEach(b => {
        if (b?.image) {
          const img = new Image()
          img.src = getImageUrl(b.image)
        }
      })
    }
  }, [banners])

  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return
    setCurrentIndex(prev => (prev + 1) % banners.length)
  }, [banners.length])

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  // Auto-play interval
  useEffect(() => {
    if (banners.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      nextSlide()
    }, 5500)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [banners.length, isPaused, nextSlide])

  // Handle Touch Swiping
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    const diff = touchStartX - touchEndX
    if (diff > 50) {
      nextSlide()
    } else if (diff < -50) {
      prevSlide()
    }
    setTouchStartX(0)
    setTouchEndX(0)
  }

  // If not loaded or no active banners: RENDER NOTHING
  if (!loaded || banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex] || banners[0]
  if (!currentBanner || !currentBanner.image) return null

  const imageUrl = getImageUrl(currentBanner.image)
  const targetLink = currentBanner.buttonLink || currentBanner.link || '/collections'

  const handleBannerClick = (e) => {
    // Prevent click if arrow or dot was clicked
    if (e.target.closest('.festive-nav-arrow') || e.target.closest('.festive-dots-wrapper')) {
      return
    }

    if (targetLink.startsWith('http://') || targetLink.startsWith('https://')) {
      window.location.href = targetLink
    } else {
      navigate(targetLink)
    }
  }

  const showOverlay = Boolean(
    currentBanner.showOverlay ||
    (currentBanner.title && currentBanner.title.trim().length > 0) ||
    (currentBanner.tagline && currentBanner.tagline.trim().length > 0)
  )

  return (
    <section
      className="festive-promo-banner"
      aria-label="Promotional Banners"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="festive-banner-link-wrapper"
        onClick={handleBannerClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleBannerClick(e)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentBanner._id || currentIndex}
            className="festive-slide-frame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <img
              src={imageUrl}
              alt={currentBanner.title || 'Promotional Banner'}
              className="festive-banner-img"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />

            {showOverlay && (
              <div className="festive-banner-overlay-content">
                <div className="festive-banner-inner">
                  <motion.div
                    className="festive-banner-content"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                  >
                    {/* Top Bow Motif */}
                    <div className="festive-bow-motif" aria-hidden="true">
                      <svg width="34" height="24" viewBox="0 0 34 24" fill="none">
                        <path
                          d="M17 12C13.5 5.5 6 4.5 2.5 8C-1 11.5 1 17.5 6.5 16.5C11.5 15.5 15 12.8 17 12Z"
                          stroke="#C5A059"
                          strokeWidth="1.3"
                        />
                        <path
                          d="M17 12C20.5 5.5 28 4.5 31.5 8C35 11.5 33 17.5 27.5 16.5C22.5 15.5 19 12.8 17 12Z"
                          stroke="#C5A059"
                          strokeWidth="1.3"
                        />
                        <circle cx="17" cy="12" r="2.2" fill="#D4AF37" stroke="#C5A059" strokeWidth="0.8" />
                        <path d="M14.5 13C12.5 16.5 10 20.5 8.5 22.5" stroke="#C5A059" strokeWidth="1.2" strokeLinecap="round" />
                        <path d="M19.5 13C21.5 16.5 24 20.5 25.5 22.5" stroke="#C5A059" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Tagline */}
                    {currentBanner.tagline && (
                      <div className="festive-tagline-wrapper">
                        <span className="festive-gold-rule left" aria-hidden="true" />
                        <span className="festive-tagline-text">{currentBanner.tagline}</span>
                        <span className="festive-gold-rule right" aria-hidden="true" />
                      </div>
                    )}

                    {/* Main Title & Highlight */}
                    {(currentBanner.title || currentBanner.titleHighlight) && (
                      <h2 className="festive-main-title">
                        {currentBanner.title}{' '}
                        {currentBanner.titleHighlight && (
                          <span className="festive-italic-highlight">{currentBanner.titleHighlight}</span>
                        )}
                      </h2>
                    )}

                    {/* Subtitle */}
                    {currentBanner.subtitle && (
                      <p className="festive-subtext">{currentBanner.subtitle}</p>
                    )}

                    {/* CTA Button */}
                    {currentBanner.buttonText && (
                      <div className="festive-cta-wrapper">
                        <span className="festive-cta-button">
                          <span>{currentBanner.buttonText}</span>
                          <span className="festive-btn-arrow" aria-hidden="true">→</span>
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows & Dots */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              className="festive-nav-arrow prev"
              onClick={(e) => {
                e.stopPropagation()
                prevSlide()
              }}
              aria-label="Previous Banner"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <button
              type="button"
              className="festive-nav-arrow next"
              onClick={(e) => {
                e.stopPropagation()
                nextSlide()
              }}
              aria-label="Next Banner"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Pagination Dots */}
            <div className="festive-dots-wrapper" onClick={(e) => e.stopPropagation()}>
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`festive-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default FestiveBanner
