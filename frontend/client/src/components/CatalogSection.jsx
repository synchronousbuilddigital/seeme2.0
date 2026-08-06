import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { useCart } from '../context/CartContext'
import './CatalogSection.css'

const CatalogSection = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [mutedStates, setMutedStates] = useState({})
  const videoRefs = useRef({})

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const data = await cachedFetch(API_ENDPOINTS.REELS, { forceRefresh: true })
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setReels(data.data.slice(0, 6))
        } else {
          setReels([])
        }
      } catch (err) {
        console.error('Error fetching reels for homepage catalog section:', err)
        setReels([])
      } finally {
        setLoading(false)
      }
    }

    fetchReels()
  }, [])

  const toggleMute = (reelId, e) => {
    e.stopPropagation()
    setMutedStates(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }))
  }

  const handleProductClick = (product, e) => {
    e.stopPropagation()
    if (product?._id || product?.id) {
      navigate(`/product/${product._id || product.id}`)
    } else {
      navigate('/catalog')
    }
  }

  if (loading) return null

  // If no active reels have been added in the Admin Panel, do not render this section
  if (reels.length === 0) return null

  return (
    <section className="homepage-catalog-section" id="catalog-reels">
      {/* Background Ambient Glows */}
      <div className="catalog-glow-gold" />
      <div className="catalog-glow-rose" />

      <div className="catalog-section-container">
        {/* Editorial Section Header */}
        <div className="catalog-section-header">
          <span className="catalog-kicker">✦ Atelier Lookbook & Reels</span>
          <h2 className="catalog-heading">
            Couture in <span className="italic">Motion</span>
          </h2>
          <div className="catalog-header-line" />
          <p className="catalog-section-intro">
            Experience the fluid grace of SeeMee silhouettes. Watch high-definition video reels, explore ancestral embroidery in motion, and discover featured pieces directly from the atelier.
          </p>
        </div>

        {/* Video Reels Grid Container */}
        <div className="catalog-reels-slider-grid">
          {reels.map((reel, index) => {
            const product = reel.product
            const isMuted = mutedStates[reel._id] !== false // Muted by default
            const posterImg = reel.coverImage || product?.images?.[0] || product?.image

            return (
              <motion.div
                key={reel._id || index}
                className="catalog-reel-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => navigate('/catalog')}
              >
                {/* Media Container with Autoplay Loop Video */}
                <div className="catalog-reel-media-wrapper">
                  {reel.videoUrl ? (
                    <video
                      ref={el => videoRefs.current[reel._id] = el}
                      src={reel.videoUrl}
                      poster={posterImg ? getOptimizedImageUrl(posterImg, 'card') : undefined}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="catalog-reel-video"
                    />
                  ) : (
                    <img
                      src={getOptimizedImageUrl(posterImg || '/images/ruby_bridal_sharara.png', 'card')}
                      alt={reel?.title || ''}
                      className="catalog-reel-poster"
                    />
                  )}

                  <div className="catalog-reel-gradient-overlay" />

                  {/* Top Live Badge & Audio Control */}
                  <div className="catalog-card-top-bar">
                    <span className="reel-live-badge">
                      <span className="live-dot" />
                      REEL
                    </span>

                    {reel?.videoUrl && (
                      <button
                        type="button"
                        className="catalog-mute-btn"
                        onClick={(e) => toggleMute(reel?._id, e)}
                        title={isMuted ? "Unmute audio" : "Mute audio"}
                      >
                        {isMuted ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="1" y1="1" x2="23" y2="23" />
                            <path d="M9 9l10.5 10.5M15.54 8.46A5 5 0 0 1 19 12M6 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3l5-4v5.58" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Reel Info & Linked Product Pill */}
                  <div className="catalog-reel-info-overlay">
                    <h3 className="catalog-reel-title">{reel?.title || ''}</h3>
                    {reel?.caption && <p className="catalog-reel-caption">{reel.caption}</p>}

                    {product && (
                      <div
                        className="catalog-linked-product-pill"
                        onClick={(e) => handleProductClick(product, e)}
                      >
                        <div className="product-pill-left">
                          <img
                            src={getOptimizedImageUrl(product.images?.[0] || product.image || posterImg, 'thumbnail')}
                            alt={product.name}
                            className="product-pill-thumb"
                          />
                          <div className="product-pill-text">
                            <span className="product-pill-name">{product.name}</span>
                            <span className="product-pill-price">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <span className="product-pill-action">Shop →</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Explore More Button Footer */}
        <div className="catalog-section-action">
          <motion.button
            className="explore-catalog-btn"
            onClick={() => navigate('/catalog')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Explore Full Catalog Reels</span>
            <svg width="22" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2,6 L22,6 M16,1 L22,6 L16,11" />
            </svg>
          </motion.button>
        </div>
      </div>
    </section>
  )
}

export default CatalogSection
