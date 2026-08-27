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
  const [mutedStates, setMutedStates] = useState({})
  const videoRefs = useRef({})

  useEffect(() => {
    const fetchAdminReels = async () => {
      try {
        setLoading(true)
        const reelsRes = await cachedFetch(API_ENDPOINTS.REELS, { forceRefresh: true })
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

        setItems(reelItems)
        if (reelItems.length > 0) {
          setActiveIndex(Math.floor(reelItems.length / 2))
        }
      } catch (err) {
        console.error('Error fetching admin reels:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminReels()
  }, [])

  const handlePrev = () => {
    setActiveIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
  }

  const toggleMute = (itemId, e) => {
    e.stopPropagation()
    setMutedStates(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  if (loading || items.length === 0) {
    return null
  }

  return (
    <section className="catalog-coverflow-section" id="catalog-reels">
      <div className="catalog-coverflow-container">
        {/* Editorial Section Header */}
        <div className="catalog-section-header">
          <span className="catalog-eyebrow">EXCLUSIVE LOOKBOOK</span>
          <h2 className="catalog-heading">CATALOG SHOWCASE</h2>
          <div className="catalog-title-underline" />
        </div>

        {/* 3D Cover Flow Carousel Viewport */}
        <div className="coverflow-viewport">
          {/* Navigation Button Left */}
          <button
            type="button"
            className="coverflow-nav-btn prev"
            onClick={handlePrev}
            aria-label="Previous Slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* 3D Cards Track */}
          <div className="coverflow-track">
            {items.map((item, idx) => {
              // Calculate offset relative to activeIndex (with circular loop calculation)
              let offset = idx - activeIndex
              const count = items.length

              // Adjust offset for seamless loop
              if (offset > count / 2) offset -= count
              if (offset < -count / 2) offset += count

              const isActive = offset === 0
              const absOffset = Math.abs(offset)

              // Determine 3D transform metrics based on distance from center
              let translateX = offset * 185
              let scale = 1 - absOffset * 0.14
              let zIndex = 30 - absOffset * 5
              let opacity = absOffset > 2 ? 0 : (1 - absOffset * 0.22)
              let rotateY = offset > 0 ? -12 : offset < 0 ? 12 : 0

              if (isActive) {
                scale = 1.16
                zIndex = 40
                opacity = 1
                rotateY = 0
              }

              const isMuted = mutedStates[item.id] !== false

              return (
                <motion.div
                  key={item.id || idx}
                  className={`coverflow-card ${isActive ? 'active' : ''}`}
                  style={{
                    zIndex,
                    opacity: opacity <= 0 ? 0 : opacity,
                    pointerEvents: absOffset > 2 ? 'none' : 'auto'
                  }}
                  animate={{
                    x: translateX,
                    scale: Math.max(0.7, scale),
                    rotateY,
                    opacity: opacity <= 0 ? 0 : opacity
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  onClick={() => {
                    if (!isActive) {
                      setActiveIndex(idx)
                    }
                  }}
                >
                  <div className="coverflow-media-box">
                    {item.videoUrl ? (
                      <video
                        ref={el => videoRefs.current[item.id] = el}
                        src={item.videoUrl}
                        poster={getOptimizedImageUrl(item.image, 'card')}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="coverflow-video"
                      />
                    ) : (
                      <img
                        src={getOptimizedImageUrl(item.image, 'card')}
                        alt={item.title}
                        className="coverflow-img"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                      />
                    )}

                    {/* Top Mute Control if video */}
                    {item.videoUrl && (
                      <button
                        type="button"
                        className="coverflow-mute-btn"
                        onClick={(e) => toggleMute(item.id, e)}
                      >
                        {isMuted ? '🔇' : '🔊'}
                      </button>
                    )}

                    {/* Gradient Overlay & Bottom Content for Active Item */}
                    <div className="coverflow-card-overlay">
                      {isActive && (
                        <div className="coverflow-content">
                          <h3 className="coverflow-item-title">{item.title}</h3>
                          <button
                            type="button"
                            className="coverflow-view-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(item.link || '/catalog')
                            }}
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Navigation Button Right */}
          <button
            type="button"
            className="coverflow-nav-btn next"
            onClick={handleNext}
            aria-label="Next Slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default CatalogSection
