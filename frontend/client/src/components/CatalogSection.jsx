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
  const trackRef = useRef(null)

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
            setActiveIndex(Math.floor(reelItems.length / 2))
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

  const toggleMute = (itemId, e) => {
    e.stopPropagation()
    setMutedStates(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const orbitPrev = () => {
    if (items.length === 0) return
    setActiveIndex(prev => (prev > 0 ? prev - 1 : items.length - 1))
  }

  const orbitNext = () => {
    if (items.length === 0) return
    setActiveIndex(prev => (prev < items.length - 1 ? prev + 1 : 0))
  }

  if (loading && items.length === 0) {
    return null
  }

  return (
    <section className="catalog-orbit-section" id="catalog-reels">
      <div className="catalog-orbit-container">
        {/* Editorial Section Header matching user mockup */}
        <div className="catalog-section-header">
          <div className="catalog-header-top">
            <div className="catalog-header-left">
              <span className="catalog-eyebrow">THE SEEMEE SIGNATURES</span>
              <h2 className="catalog-heading">
                Catalog
              </h2>
            </div>
            <button
              type="button"
              className="catalog-explore-link"
              onClick={() => navigate('/catalog')}
            >
              <span>EXPLORE THE EDIT</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Orbit Stage Viewport */}
        <div className="catalog-orbit-stage">
          {/* Orbit Navigation Controls */}
          <button
            type="button"
            className="catalog-orbit-nav catalog-orbit-nav-prev"
            onClick={orbitPrev}
            aria-label="Orbit Left"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="catalog-orbit-nav catalog-orbit-nav-next"
            onClick={orbitNext}
            aria-label="Orbit Right"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Central Orbiting Cards Track */}
          <div className="catalog-orbit-track" ref={trackRef}>
            {items.map((item, idx) => {
              const diff = idx - activeIndex
              const isCenter = diff === 0
              const absDiff = Math.abs(diff)
              
              // Orbit Math: Angle steps around central pivot point
              const rotateDeg = diff * 12.5
              const cardScale = isCenter ? 1.08 : Math.max(0.78, 1 - absDiff * 0.08)
              const opacity = absDiff > 4 ? 0 : 1 - absDiff * 0.15
              const cardZIndex = 200 - absDiff * 10
              const isMuted = mutedStates[item.id] !== false

              return (
                <div
                  key={item.id || idx}
                  className={`catalog-orbit-card ${isCenter ? 'is-active-center' : ''}`}
                  style={{
                    '--orbit-rotate': `${rotateDeg}deg`,
                    '--orbit-scale': cardScale,
                    opacity: opacity,
                    zIndex: cardZIndex,
                    pointerEvents: opacity === 0 ? 'none' : 'auto'
                  }}
                  onClick={() => {
                    if (!isCenter) {
                      setActiveIndex(idx)
                    } else {
                      navigate(item.link || '/catalog')
                    }
                  }}
                >
                  <div className="catalog-card-media-wrap">
                    {item.videoUrl ? (
                      <video
                        ref={el => videoRefs.current[item.id] = el}
                        src={item.videoUrl}
                        poster={getOptimizedImageUrl(item.image, 'card')}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="catalog-card-media"
                      />
                    ) : (
                      <img
                        src={getOptimizedImageUrl(item.image, 'card')}
                        alt={item.title}
                        className="catalog-card-media"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                      />
                    )}

                    {item.videoUrl && (
                      <button
                        type="button"
                        className="catalog-mute-btn"
                        onClick={(e) => toggleMute(item.id, e)}
                      >
                        {isMuted ? '🔇' : '🔊'}
                      </button>
                    )}

                    <div className="catalog-card-overlay">
                      {item.product?.category && (
                        <span className="catalog-card-tag">
                          {item.product.category.toUpperCase()}
                        </span>
                      )}
                      <h3 className="catalog-card-title">{item.title}</h3>
                      {item.product?.price && (
                        <div className="catalog-card-price-badge">
                          ₹{Number(item.product.price).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CatalogSection
