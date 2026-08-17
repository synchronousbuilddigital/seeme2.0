import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { trackViewItemList, trackSelectItem } from '../utils/gtmEcommerce'
import AddToCartButton from '../components/AddToCartButton'
import './CatalogPage.css'

const CatalogPage = () => {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('feed') // 'feed' | 'grid'
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [likedReels, setLikedReels] = useState({})
  const [isMuted, setIsMuted] = useState(true)
  const [toastMessage, setToastMessage] = useState(null)
  
  const videoRefs = useRef({})
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { toggleWishlist, isInWishlist, addToCart } = useCart()

  useEffect(() => {
    fetchReels()
  }, [])

  const fetchReels = async () => {
    try {
      setLoading(true)
      const data = await cachedFetch(API_ENDPOINTS.REELS, { forceRefresh: true })
      if (data && data.success && Array.isArray(data.data)) {
        setReels(data.data)
        try {
          const productsFromReels = data.data.map(r => r.product).filter(Boolean)
          if (productsFromReels.length > 0) {
            trackViewItemList(productsFromReels, 'Reels Catalog Lookbook', 'reels_catalog')
          }
        } catch (e) {}
      } else {
        setReels([])
      }
    } catch (err) {
      console.error('Error fetching reels catalog:', err)
      setReels([])
    } finally {
      setLoading(false)
    }
  }

  // Handle Video Autoplay / Pause based on IntersectionObserver on page scroll
  useEffect(() => {
    if (viewMode !== 'feed' || reels.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index'), 10)
          const vid = videoRefs.current[index]
          if (entry.isIntersecting) {
            setCurrentReelIndex(index)
            if (vid) vid.play().catch(() => {})
          } else {
            if (vid) {
              vid.pause()
              vid.currentTime = 0
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    const slides = document.querySelectorAll('.reel-slide')
    slides.forEach((slide) => observer.observe(slide))

    return () => observer.disconnect()
  }, [reels, viewMode])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleLikeReel = async (reel) => {
    const product = reel.product
    const productId = product ? (product._id || product.id) : null
    const currentlyInWishlist = productId ? isInWishlist(productId) : false

    const isLiked = likedReels[reel._id] !== undefined ? likedReels[reel._id] : currentlyInWishlist
    const newLikedState = !isLiked

    setLikedReels(prev => ({ ...prev, [reel._id]: newLikedState }))
    
    // Update likes count locally
    setReels(prev => prev.map(r => r._id === reel._id 
      ? { ...r, likesCount: (r.likesCount || 0) + (newLikedState ? 1 : -1) } 
      : r
    ))

    // 1. Send like API request to backend
    try {
      fetch(`${API_ENDPOINTS.REELS}/${reel._id}/like`, { method: 'POST' }).catch(() => {})
    } catch (e) {
      console.error(e)
    }

    // 2. TOGGLE LINKED PRODUCT IN WISHLIST
    if (product) {
      toggleWishlist({
        id: productId,
        _id: productId,
        name: product.name || reel.title,
        price: product.price || 0,
        image: product.images?.[0] || product.image || reel.coverImage,
        category: product.category || 'Atelier Collection'
      })

      if (newLikedState) {
        showToast(`✦ Added "${product.name || reel.title}" to your Wishlist! ❤️`)
      } else {
        showToast(`Removed "${product.name || reel.title}" from Wishlist`)
      }
    } else {
      showToast(newLikedState ? '❤️ Liked Reel' : 'Unliked Reel')
    }
  }

  const handleAddToCart = (product, e) => {
    e.stopPropagation()
    if (!product) return
    addToCart({
      id: product._id || product.id,
      _id: product._id || product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.image,
      size: 'M',
      quantity: 1
    })
    showToast(`✦ Added "${product.name}" to Shopping Bag! 🛍️`)
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast('✦ Catalog link copied to clipboard!')
    }
  }

  const toggleVideoPlay = (index) => {
    const vid = videoRefs.current[index]
    if (vid) {
      if (vid.paused) vid.play().catch(() => {})
      else vid.pause()
    }
  }

  const openReelInFeed = (index) => {
    setCurrentReelIndex(index)
    setViewMode('feed')
  }

  if (loading) {
    return (
      <div className="catalog-reels-loading">
        <div className="loading-spinner-gold" />
        <p>Loading SeeMee Catalog Reels...</p>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="catalog-reels-empty-screen">
        <motion.div 
          className="coming-soon-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="coming-soon-tag">✦ SEEMEE ATELIER</span>
          <h1 className="coming-soon-title">Catalog Reels Coming Soon</h1>
          <p className="coming-soon-subtitle">
            Our video reel catalog is currently being curated in the atelier. High-definition video stories, craft showcases, and couture reels will be published soon from the admin studio.
          </p>
          <button onClick={() => navigate('/collections')} className="btn-explore-shop">
            Explore Collections
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="catalog-reels-page">
      {/* Floating Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="catalog-toast"
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Mode Toggle (Reel Feed vs Grid Lookbook) */}
      <div className="catalog-top-bar">
        <div className="catalog-brand-badge">✦ SEEMEE CATALOG</div>
        <div className="view-mode-toggle">
          <button 
            className={`mode-btn ${viewMode === 'feed' ? 'active' : ''}`}
            onClick={() => setViewMode('feed')}
            title="Reels Feed View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            <span>Reels</span>
          </button>
          <button 
            className={`mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid Gallery View"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* 1. Feed Mode: Instagram Reels Snap-Scroll View */}
      {viewMode === 'feed' && (
        <div className="reels-feed-container" ref={containerRef}>
          {reels.map((reel, index) => {
            const product = reel.product
            const isLiked = likedReels[reel._id] !== undefined 
              ? likedReels[reel._id] 
              : (product && isInWishlist(product._id || product.id))
            const mediaImage = reel.coverImage || product?.images?.[0] || product?.image

            return (
              <div key={reel._id || index} className="reel-slide" data-index={index}>
                {/* Media Player (Video or Full Image) */}
                <div className="reel-media-wrapper" onClick={() => toggleVideoPlay(index)}>
                  {reel.videoUrl ? (
                    <video
                      ref={el => videoRefs.current[index] = el}
                      src={reel.videoUrl}
                      poster={mediaImage ? getOptimizedImageUrl(mediaImage, 'hero') : undefined}
                      loop
                      playsInline
                      muted={isMuted}
                      className="reel-video-element"
                    />
                  ) : (
                    <div className="reel-image-container">
                      <img
                        src={getOptimizedImageUrl(mediaImage || '/images/ruby_bridal_sharara.png', 'hero')}
                        alt={reel.title}
                        className="reel-img-element"
                      />
                    </div>
                  )}
                  <div className="reel-gradient-overlay" />
                </div>

                {/* Sound Toggle Button (If video present) */}
                {reel.videoUrl && (
                  <button 
                    type="button" 
                    className="reel-audio-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMuted(!isMuted)
                    }}
                    title={isMuted ? "Unmute sound" : "Mute sound"}
                  >
                    {isMuted ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M9 9l10.5 10.5M15.54 8.46A5 5 0 0 1 19 12M6 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3l5-4v5.58"></path>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    )}
                  </button>
                )}

                {/* Bottom Left Product Card & Caption Info */}
                <div className="reel-details-box">
                  <div className="reel-header-tag">✦ SEEMEE ATELIER CATALOG</div>
                  <h2 className="reel-title">{reel.title}</h2>
                  {reel.caption && <p className="reel-caption">{reel.caption}</p>}

                  {product && (
                    <motion.div 
                      className="reel-product-card"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="prod-thumb">
                        <img 
                          src={getOptimizedImageUrl(product.images?.[0] || product.image || mediaImage, 'thumbnail')} 
                          alt={product.name} 
                        />
                      </div>
                      <div className="prod-info">
                        <h4>{product.name}</h4>
                        <span className="prod-price">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="prod-btn-group">
                        <AddToCartButton
                          product={product}
                          variant="mini"
                          label="+ Bag"
                        />
                        <button 
                          onClick={() => navigate(`/product/${product._id || product.id}`)} 
                          className="btn-view"
                        >
                          View
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Floating Actions (Like / Wishlist, Bag, Share) */}
                <div className="reel-right-actions">
                  <button 
                    type="button" 
                    className={`action-btn-circle like-btn ${isLiked ? 'liked' : ''}`}
                    onClick={() => handleLikeReel(reel)}
                    title={isLiked ? "In your Wishlist" : "Like & Add to Wishlist"}
                  >
                    <svg 
                      width="26" 
                      height="26" 
                      viewBox="0 0 24 24" 
                      fill={isLiked ? "#D4AF37" : "none"} 
                      stroke={isLiked ? "#D4AF37" : "#FFFFFF"} 
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span className="action-count">{reel.likesCount || 0}</span>
                  </button>

                  {product && (
                    <AddToCartButton
                      product={product}
                      variant="mini"
                      label="Bag"
                    />
                  )}

                  <button 
                    type="button" 
                    className="action-btn-circle share-btn"
                    onClick={handleShare}
                    title="Share Reel"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    <span className="action-label">Share</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. Grid Mode: Instagram Lookbook Gallery View */}
      {viewMode === 'grid' && (
        <div className="catalog-grid-wrapper">
          <div className="catalog-grid-header">
            <h2>✦ Catalog Products</h2>
            <p>Explore high-resolution visual stories and tap any reel card to play</p>
          </div>

          <div className="reels-grid-container">
            {reels.map((reel, index) => {
              const product = reel.product
              const isLiked = likedReels[reel._id] !== undefined 
                ? likedReels[reel._id] 
                : (product && isInWishlist(product._id || product.id))
              const mediaImage = reel.coverImage || product?.images?.[0] || product?.image

              return (
                <motion.div 
                  key={reel._id || index}
                  className="grid-reel-card"
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => openReelInFeed(index)}
                >
                  <div className="grid-media-box">
                    <img
                      src={getOptimizedImageUrl(mediaImage || '/images/ruby_bridal_sharara.png', 'card')}
                      alt={reel.title}
                      className="grid-reel-img"
                    />
                    <div className="grid-overlay" />
                    
                    {reel.videoUrl && (
                      <span className="video-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        REEL
                      </span>
                    )}

                    <button 
                      className={`grid-like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLikeReel(reel)
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "#D4AF37" : "none"} stroke={isLiked ? "#D4AF37" : "#FFFFFF"} strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid-reel-info">
                    <h3 className="grid-reel-title">{reel.title}</h3>
                    {product && (
                      <div className="grid-product-tag">
                        <span>{product.name}</span>
                        <span className="grid-price">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogPage
