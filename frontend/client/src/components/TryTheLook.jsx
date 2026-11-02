import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LOOKS_DATA } from '../data/tryTheLookData'
import { cachedFetch } from '../utils/cachedFetch'
import { useCart } from '../context/CartContext'
import { API_ENDPOINTS } from '../config/api'
import { belongsToAudience, interleaveAudiences } from '../utils/categoryHelper'
import './TryTheLook.css'

const AUTOPLAY_DURATION = 5000 // 5 seconds per look
const TRANSITION_DURATION = 1000 // 1s coordinated motion

// Helper to convert backend Cloudinary product URLs into transparent cutout model images
export const getCutoutImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url
  if (url.includes('e_background_removal') || url.includes('/images/looks/')) return url
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    return url
      .replace('/image/upload/', '/image/upload/e_background_removal/')
      .replace(/\.(webp|jpg|jpeg)$/i, '.png')
  }
  return url
}

const TryTheLook = ({ activeAudience = 'all' }) => {
  const navigate = useNavigate()
  let cartContext = null
  try {
    cartContext = useCart()
  } catch (err) {
    // Graceful fallback if rendered outside CartProvider
  }

  const [looks, setLooks] = useState(LOOKS_DATA)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isAutoplay, setIsAutoplay] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [localCartCount, setLocalCartCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const sectionRef = useRef(null)
  const autoplayTimerRef = useRef(null)

  // ─── DYNAMICALLY FETCH MODEL IMAGES & PRODUCTS FROM BACKEND ───────────────
  useEffect(() => {
    let isCancelled = false

    const fetchBackendLooks = async () => {
      try {
        setLoading(true)

        // Helper to check if a product qualifies for Try The Look
        const checkIsTryLook = (p) => {
          if (!p || p.isActive === false) return false
          const isTry = p.isTryTheLook === true || p.isTryTheLook === 'true' || p.tryTheLook === true || p.tryTheLook === 'true'
          const hasImage = (Array.isArray(p.images) && p.images.length > 0 && Boolean(p.images[0])) || Boolean(p.image)
          return Boolean(isTry && hasImage)
        }

        // Fetch products: try fresh query with forceRefresh, fallback to cached
        let rawProducts = []
        try {
          const res = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}?isTryTheLook=true&limit=100&_t=${Date.now()}`, {
            forceRefresh: true,
            ttlMs: 0
          })
          rawProducts = Array.isArray(res?.data)
            ? res.data
            : (Array.isArray(res?.products) ? res.products : [])
        } catch (e) {
          const fallbackRes = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=100`, { ttlMs: 300000 }).catch(() => null)
          rawProducts = Array.isArray(fallbackRes?.data)
            ? fallbackRes.data
            : (Array.isArray(fallbackRes?.products) ? fallbackRes.products : [])
        }

        // Filter products with isTryTheLook
        let tryTheLookProducts = rawProducts.filter(checkIsTryLook)

        // If no products found via query, fetch full catalog and filter in JS
        if (tryTheLookProducts.length === 0) {
          try {
            const allRes = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=250&_t=${Date.now()}`, {
              forceRefresh: true,
              ttlMs: 0
            })
            const allProds = Array.isArray(allRes?.data) ? allRes.data : (Array.isArray(allRes?.products) ? allRes.products : [])
            tryTheLookProducts = allProds.filter(checkIsTryLook)
          } catch (e) {
            console.warn('Fallback catalog fetch error:', e)
          }
        }

        // If admin has selected Try The Look products, map and display ONLY those!
        if (tryTheLookProducts.length > 0) {
          let audienceMatched = tryTheLookProducts
          if (activeAudience && activeAudience !== 'all') {
            const filtered = tryTheLookProducts.filter((p) => belongsToAudience(p, activeAudience))
            if (filtered.length > 0) {
              audienceMatched = filtered
            }
          }

          const targetProducts = audienceMatched

          const dynamicLooks = targetProducts.map((prod, idx) => {
            const prodImages = Array.isArray(prod.images) && prod.images.length > 0
              ? prod.images.filter(Boolean)
              : (prod.image ? [prod.image] : [])
            const primaryImg = prodImages[0] || prod.image || ''
            const cutoutImg = getCutoutImageUrl(primaryImg)
            const secondaryImg = prodImages[1] || primaryImg
            const detailImg = prodImages[2] || secondaryImg || primaryImg

            const price = typeof prod.price === 'number' && prod.price > 0 ? prod.price : 1499
            const originalPrice = typeof prod.originalPrice === 'number' && prod.originalPrice > price
              ? prod.originalPrice
              : Math.round(price * 1.25)
            const discountPercent = prod.discount || Math.max(10, Math.round(((originalPrice - price) / originalPrice) * 100))

            const cleanName = prod.name || 'Artisanal Ensemble'
            const shortName = cleanName.length > 38 ? cleanName.slice(0, 35) + '...' : cleanName
            const catName = prod.category ? prod.category.replace(/[-_]/g, ' ') : 'Atelier'
            const isSuitOrSet = /set|suit|kurta|cord/i.test(cleanName) || /set|suit/i.test(catName)

            return {
              id: prod._id || `backend-look-${idx}`,
              productId: prod._id,
              name: shortName,
              fullName: cleanName,
              subtitle: `${catName.toUpperCase()} • Try The Look`,
              modelImage: cutoutImg,
              originalImage: primaryImg,
              images: prodImages.length > 0 ? prodImages : [primaryImg, secondaryImg, detailImg].filter(Boolean),
              price: price,
              originalPrice: originalPrice,
              discountPercent: discountPercent,
              category: catName,
              brand: prod.brand || 'SEEMEE',
              fabric: prod.fabric || '100% Pure Artisan Cotton',
              sizes: Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes : ['XS', 'S', 'M', 'L', 'XL'],
              description: prod.description || 'Complete head-to-toe coordinated ensemble crafted with premium artisanal tailoring.',
              isSuitOrSet: isSuitOrSet,
              isTrending: false
            }
          })

          if (!isCancelled && dynamicLooks.length > 0) {
            setLooks(dynamicLooks)
            setActiveIndex(0)
          }
        } else {
          // If no products marked yet, fallback to curated looks so homepage is never blank
          if (!isCancelled) {
            setLooks(LOOKS_DATA)
          }
        }
      } catch (err) {
        console.error('Error fetching backend products for TryTheLook:', err)
        if (!isCancelled) setLooks(LOOKS_DATA)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchBackendLooks()

    const handleStorage = (e) => {
      if (e.key === 'seemee_product_updated') {
        fetchBackendLooks()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      isCancelled = true
      window.removeEventListener('storage', handleStorage)
    }
  }, [activeAudience])

  // Preload all look images into browser cache to ensure instant smooth display
  useEffect(() => {
    if (!looks || looks.length === 0) return
    looks.forEach((item) => {
      if (item.modelImage) {
        const img = new Image()
        img.src = item.modelImage
      }
      if (item.originalImage) {
        const img = new Image()
        img.src = item.originalImage
      }
    })
  }, [looks])

  const totalLooks = looks.length
  const activeLook = looks[activeIndex] || looks[0] || LOOKS_DATA[0]

  // Reset image view & select default size on active look change
  useEffect(() => {
    setSelectedImageIndex(0)
    const currentLook = looks[activeIndex] || looks[0]
    if (currentLook?.sizes && Array.isArray(currentLook.sizes) && currentLook.sizes.length > 0) {
      setSelectedSize(currentLook.sizes.includes('M') ? 'M' : currentLook.sizes[0])
    } else {
      setSelectedSize('M')
    }
  }, [activeIndex, looks])

  // Move to Next Look with instantaneous 60fps CSS transition
  const handleNext = useCallback(() => {
    if (isTransitioning || totalLooks <= 1) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev + 1) % totalLooks)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 650)
  }, [isTransitioning, totalLooks])

  // Move to Previous Look
  const handlePrev = useCallback(() => {
    if (isTransitioning || totalLooks <= 1) return
    setIsTransitioning(true)
    setActiveIndex((prev) => (prev - 1 + totalLooks) % totalLooks)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 650)
  }, [isTransitioning, totalLooks])

  // Jump to specific index from progress bar segment
  const handleSelectLook = (targetIdx) => {
    if (targetIdx === activeIndex || isTransitioning || targetIdx >= totalLooks) return
    setIsTransitioning(true)
    setActiveIndex(targetIdx)
    setTimeout(() => {
      setIsTransitioning(false)
    }, 650)
  }

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const inView = rect.top < window.innerHeight && rect.bottom > 0
      if (!inView) return

      if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev])

  // Autoplay progression timer — pure single timeout per look, no 20/sec re-renders!
  useEffect(() => {
    if (!isAutoplay || isHovered) {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
      return
    }

    autoplayTimerRef.current = setTimeout(() => {
      handleNext()
    }, AUTOPLAY_DURATION)

    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    }
  }, [isAutoplay, isHovered, activeIndex, handleNext])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current)
    }
  }, [])

  // If no products are marked for Try The Look by Admin, do not render this section
  if (!looks || looks.length === 0 || !activeLook) {
    return null
  }

  // Calculations for active look pricing & display
  const activePrice = typeof activeLook?.price === 'number' && activeLook.price > 0
    ? activeLook.price
    : (activeLook?.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 1124)

  const activeOriginalPrice = typeof activeLook?.originalPrice === 'number' && activeLook.originalPrice > activePrice
    ? activeLook.originalPrice
    : (activeLook?.items?.reduce((sum, item) => sum + (item.oldPrice || Math.round(item.price * 1.25) || 0), 0) || Math.round(activePrice * 1.25))

  const activeDiscount = activeLook?.discountPercent || Math.max(10, Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100))

  const lookImages = Array.isArray(activeLook?.images) && activeLook.images.length > 0
    ? activeLook.images
    : (activeLook?.items && activeLook.items.length > 0
        ? activeLook.items.map((it) => it.image).filter(Boolean)
        : [activeLook?.originalImage || activeLook?.modelImage].filter(Boolean))

  const currentDisplayImage = lookImages[selectedImageIndex] || activeLook?.originalImage || activeLook?.modelImage

  const availableSizes = Array.isArray(activeLook?.sizes) && activeLook.sizes.length > 0
    ? activeLook.sizes
    : ['XS', 'S', 'M', 'L', 'XL']

  // Single Add to Cart handler: Adds the complete overall product ensemble to bag
  const handleAddToCart = () => {
    if (!activeLook) return

    const productData = {
      _id: activeLook.productId || activeLook.id,
      id: activeLook.productId || activeLook.id,
      name: activeLook.fullName || activeLook.name,
      price: activePrice,
      originalPrice: activeOriginalPrice,
      images: lookImages,
      category: activeLook.category || 'Suit Set',
      sizes: availableSizes,
      size: selectedSize || 'M',
      selectedSize: selectedSize || 'M',
      quantity: 1
    }

    if (cartContext?.addToCart) {
      cartContext.addToCart(productData, navigate)
    } else {
      setLocalCartCount((prev) => prev + 1)
    }

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2400)
  }

  // Quick Add handler for individual piece
  const handleAddSingleItem = (item) => {
    if (!item) return
    const productData = {
      _id: item.id || activeLook.productId || activeLook.id,
      id: item.id || activeLook.productId || activeLook.id,
      name: item.name || activeLook.fullName || activeLook.name,
      price: item.price || activePrice,
      originalPrice: item.oldPrice || activeOriginalPrice,
      images: [item.image || currentDisplayImage],
      category: item.category || activeLook.category || 'Atelier',
      sizes: availableSizes,
      size: selectedSize || 'M',
      selectedSize: selectedSize || 'M',
      quantity: 1
    }

    if (cartContext?.addToCart) {
      cartContext.addToCart(productData, navigate)
    } else {
      setLocalCartCount((prev) => prev + 1)
    }

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2400)
  }

  // Items to display in mobile UI (either broken down pieces or overall ensemble)
  const displayItems = (Array.isArray(activeLook?.items) && activeLook.items.length > 0)
    ? activeLook.items
    : [{
        id: activeLook?.productId || activeLook?.id,
        name: activeLook?.fullName || activeLook?.name,
        price: activePrice,
        oldPrice: activeOriginalPrice,
        discountPercent: activeDiscount,
        image: currentDisplayImage,
        brand: activeLook?.brand || 'SEEMEE'
      }]

  return (
    <section
      id="try-the-look"
      className="try-the-look-section"
      aria-label="Try the Look Interactive Fashion Lineup"
      ref={sectionRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="try-the-look-container">
        <div className="try-the-look-grid">
          {/* ============================================================ */}
          {/* LEFT: MAIN STAGE & DEPTH QUEUED MODEL LINEUP                 */}
          {/* ============================================================ */}
          <div className="try-stage-column">
            {/* Stage Header */}
            <div className="stage-header">
              <h2 className="stage-heading">
                Try the <span className="gold-accent-text">Look.</span>
              </h2>
            </div>

            {/* Lineup Presentation Stage — Persistent 60FPS Hardware-Accelerated Lineup */}
            <div className="lineup-stage-viewport">
              <div className="lineup-stage-track">
                {looks.map((look, idx) => {
                  const offset = (idx - activeIndex + totalLooks) % totalLooks
                  let slotClass = 'lineup-slot-hidden'
                  if (offset === 0) slotClass = 'lineup-slot-active'
                  else if (offset === 1) slotClass = 'lineup-slot-right-1'
                  else if (offset === 2) slotClass = 'lineup-slot-right-2'
                  else if (offset === totalLooks - 1) slotClass = 'lineup-slot-left-1'
                  else if (offset === totalLooks - 2) slotClass = 'lineup-slot-left-2'

                  const isActive = offset === 0
                  const isClickable = offset === 1 || offset === totalLooks - 1

                  return (
                    <div
                      key={look.id || idx}
                      className={`lineup-model-card ${slotClass} ${isClickable ? 'is-clickable' : ''}`}
                      aria-hidden={!isActive}
                      onClick={() => {
                        if (!isActive) handleSelectLook(idx)
                      }}
                      title={!isActive ? `Switch to ${look.name}` : undefined}
                    >
                      <div className="model-img-wrapper">
                        <img
                          src={look.modelImage}
                          alt={isActive ? look.name : ''}
                          className="lineup-model-img"
                          loading={offset <= 2 ? 'eager' : 'lazy'}
                          decoding="async"
                          onError={(e) => {
                            if (look.originalImage && e.target.src !== look.originalImage) {
                              e.target.src = look.originalImage
                            }
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stage Ambient Floor Glow */}
              <div className="stage-floor-glow" aria-hidden="true" />
            </div>

            {/* ============================================================ */}
            {/* BOTTOM CONTROLS & SEGMENTED PROGRESS BAR                     */}
            {/* ============================================================ */}
            <div className="lineup-controls-bar">
              {/* Previous & Next Buttons */}
              <div className="lineup-nav-group">
                <button
                  type="button"
                  className="lineup-arrow-btn"
                  onClick={handlePrev}
                  disabled={isTransitioning}
                  aria-label="Previous look"
                  id="try-look-prev-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="lineup-arrow-btn"
                  onClick={handleNext}
                  disabled={isTransitioning}
                  aria-label="Next look"
                  id="try-look-next-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Segmented Progress Bar with Active Look Name */}
              <div className="lineup-progress-cluster">
                <div className="progress-segments-track" role="tablist" aria-label="Look selector">
                  {looks.map((look, idx) => {
                    const isActive = idx === activeIndex
                    const isPassed = idx < activeIndex
                    const isPaused = !isAutoplay || isHovered
                    return (
                      <button
                        key={look.id || idx}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Jump to look ${idx + 1}: ${look.name}`}
                        className={`progress-segment-btn ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''} ${isPaused ? 'paused' : ''}`}
                        onClick={() => handleSelectLook(idx)}
                      >
                        <div className="progress-segment-bar">
                          <div
                            className="progress-segment-fill"
                            key={`fill-${idx}-${isActive}`}
                          />
                        </div>
                        {looks.length <= 10 && (
                          <span className="progress-segment-number">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="active-look-title-indicator">
                  <span className="indicator-counter">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(totalLooks).padStart(2, '0')}
                  </span>
                  <span className="indicator-dash">—</span>
                  <strong className="indicator-name">{activeLook?.name}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT: "IN THIS LOOK" SIDEBAR                                */}
          {/* ============================================================ */}
          <div className="try-sidebar-column">
            {/* DESKTOP VIEW CARD (Hidden on mobile via CSS) */}
            <div className="sidebar-card-shell desktop-only-card">
              {/* Single Unified Product Showcase Card */}
              <div className="single-look-showcase">
                {/* Hero Media Preview & Gallery Strip */}
                <div className="single-look-media-card">
                  <div className="single-look-image-container">
                    <img
                      src={currentDisplayImage}
                      alt={activeLook?.fullName || activeLook?.name}
                      className="single-look-hero-img"
                      loading="lazy"
                    />
                    <div className="single-look-ensemble-badge">
                      <span className="badge-sparkle">✦</span>
                      <span>{activeLook?.isTrending ? 'LATEST TREND' : 'COMPLETE ENSEMBLE'}</span>
                    </div>
                  </div>

                  {/* Multi-angle Gallery Thumbnails */}
                  {lookImages.length > 1 && (
                    <div className="single-look-gallery-thumbs" role="group" aria-label="Product angles">
                      {lookImages.slice(0, 4).map((imgUrl, thumbIdx) => (
                        <button
                          key={thumbIdx}
                          type="button"
                          className={`gallery-thumb-btn ${selectedImageIndex === thumbIdx ? 'is-active' : ''}`}
                          onClick={() => setSelectedImageIndex(thumbIdx)}
                          aria-label={`View angle ${thumbIdx + 1}`}
                        >
                          <img src={imgUrl} alt="" className="gallery-thumb-img" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Information */}
                <div className="single-look-info-panel">
                  <div className="single-look-brand-header">
                    <span className="single-look-brand-tag">{activeLook?.brand || 'SEEMEE'}</span>
                    <span className="single-look-cat-tag">{activeLook?.category || 'Atelier Set'}</span>
                  </div>

                  <h4 className="single-look-product-title">
                    {activeLook?.fullName || activeLook?.name}
                  </h4>

                  {/* Size Selection */}
                  <div className="single-look-size-block">
                    <div className="size-header-line">
                      <span className="size-title-text">SELECT SIZE</span>
                      <span className="size-value-indicator">Size: <strong>{selectedSize}</strong></span>
                    </div>
                    <div className="size-pills-row" role="radiogroup" aria-label="Select size">
                      {availableSizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          role="radio"
                          aria-checked={selectedSize === sz}
                          className={`size-pill-btn ${selectedSize === sz ? 'is-active' : ''}`}
                          onClick={() => setSelectedSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="single-look-price-card">
                    <div className="price-primary-row">
                      <span className="price-main-val">₹{activePrice.toLocaleString('en-IN')}</span>
                      {activeOriginalPrice > activePrice && (
                        <span className="price-old-val">₹{activeOriginalPrice.toLocaleString('en-IN')}</span>
                      )}
                      {activeDiscount > 0 && (
                        <span className="price-discount-tag">{activeDiscount}% OFF</span>
                      )}
                    </div>
                    <span className="price-tax-note">Inclusive of all taxes • Ready to ship</span>
                  </div>

                  {/* Single Primary Action: ADD TO BAG */}
                  <button
                    type="button"
                    className={`single-look-add-bag-btn ${addedToCart ? 'is-added' : ''}`}
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    id="try-look-add-to-bag-btn"
                    aria-label="Add complete look to bag"
                  >
                    {addedToCart ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>ADDED TO BAG!</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span>ADD TO BAG</span>
                      </>
                    )}
                  </button>

                  {/* Link to Product Page */}
                  {activeLook?.productId && (
                    <button
                      type="button"
                      className="single-look-view-product-btn"
                      onClick={() => navigate(`/product/${activeLook.productId}`)}
                    >
                      <span>View Full Product Details &amp; Size Guide</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* MOBILE VIEW: SLEEK BOTTOM ITEM ROW & FULL LOOK ACTION (MATCHING USER MOCKUP) */}
            <div className="try-mobile-look-card">
              <div className="try-mobile-items-slider">
                {displayItems.map((item, itemIdx) => (
                  <div key={item.id || itemIdx} className="try-mobile-item-card">
                    {/* Left: Thumbnail with circle badge 1 */}
                    <div className="try-mobile-thumb-box">
                      <img
                        src={item.image || currentDisplayImage}
                        alt={item.name}
                        className="try-mobile-thumb-img"
                        loading="lazy"
                        onError={(e) => {
                          if (activeLook?.originalImage && e.target.src !== activeLook.originalImage) {
                            e.target.src = activeLook.originalImage
                          }
                        }}
                      />
                      <span className="try-mobile-pin-tag">{itemIdx + 1}</span>
                    </div>

                    {/* Middle: Brand, Title, Inline Size Selector, Price */}
                    <div className="try-mobile-item-details">
                      <span className="try-mobile-brand-name">{item.brand || activeLook?.brand || 'SEEMEE'}</span>
                      <h4 className="try-mobile-item-heading" title={item.name}>{item.name}</h4>

                      {/* Compact Size Selector */}
                      <div className="try-mobile-size-row">
                        <span className="try-mobile-size-label">Size:</span>
                        <div className="try-mobile-size-pills">
                          {availableSizes.map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              className={`try-mobile-size-btn ${selectedSize === sz ? 'is-active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSize(sz)
                              }}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Line */}
                      <div className="try-mobile-item-pricing">
                        <span className="try-mobile-price-cur">₹{Number(item.price || activePrice).toLocaleString('en-IN')}</span>
                        {(item.oldPrice || activeOriginalPrice) > (item.price || activePrice) && (
                          <span className="try-mobile-price-mrp">₹{Number(item.oldPrice || activeOriginalPrice).toLocaleString('en-IN')}</span>
                        )}
                        {(item.discountPercent || activeDiscount) > 0 && (
                          <span className="try-mobile-badge-off">{item.discountPercent || activeDiscount}% OFF</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Add + button */}
                    <button
                      type="button"
                      className={`try-mobile-add-single-btn ${addedToCart ? 'is-added' : ''}`}
                      onClick={() => handleAddSingleItem(item)}
                      aria-label="Add item to bag"
                      title="Add to bag"
                    >
                      {addedToCart ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Full Width Action Bar matching User Screenshot: "Add full look — ₹2,099" */}
              <button
                type="button"
                className={`try-mobile-full-look-bar ${addedToCart ? 'is-added' : ''}`}
                onClick={handleAddToCart}
                disabled={addedToCart}
              >
                {addedToCart ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>ADDED TO BAG!</span>
                  </>
                ) : (
                  <span>Add full look — ₹{activePrice.toLocaleString('en-IN')}</span>
                )}
              </button>

              {/* Link to Product Page */}
              {activeLook?.productId && (
                <button
                  type="button"
                  className="try-mobile-details-link"
                  onClick={() => navigate(`/product/${activeLook.productId}`)}
                >
                  <span>View Full Product Details &amp; Size Guide</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TryTheLook
