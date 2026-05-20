import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './Hero.css'

const Hero = () => {
  const navigate = useNavigate()
  // Start with empty array - will load from API
  const [thumbnails, setThumbnails] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchCarouselImages()
  }, [])

  const fetchCarouselImages = async () => {
    try {
      setLoading(true)
      const carouselResponse = await fetch(API_ENDPOINTS.CAROUSEL)
      const carouselData = await carouselResponse.json()

      // Handle both 'isActive' and 'active' field naming variations
      let heroSlides = carouselData.success
        ? carouselData.data.filter(slide => (slide.isActive !== false && slide.active !== false) && slide.image)
        : []

      if (heroSlides.length > 0) {
        setThumbnails(heroSlides.map(slide => ({
          img: slide.image,
          category: (slide.title || slide.productName || slide.productCategory || 'FEATURED').toUpperCase(),
          desc: slide.subtitle || slide.productCategory || slide.productName || 'Curated edit',
          id: slide.productId || null
        })))
        return
      }

      // If carousel is empty, fallback to featured/collection products
      console.log('Hero: Carousel empty, falling back to featured products')
      const [featuredResponse, collectionResponse] = await Promise.all([
        fetch(API_ENDPOINTS.FEATURED_PRODUCTS).catch(() => null),
        fetch(API_ENDPOINTS.COLLECTION_PRODUCTS).catch(() => null)
      ])

      let featuredData = featuredResponse ? await featuredResponse.json() : { success: false }
      let collectionData = collectionResponse ? await collectionResponse.json() : { success: false }

      const combined = [
        ...(featuredData.success ? featuredData.data : []),
        ...(collectionData.success ? collectionData.data : [])
      ]

      if (combined.length > 0) {
        // Filter out duplicate IDs
        const uniqueProducts = combined.filter(
          (p, idx, self) => self.findIndex(t => t._id === p._id) === idx
        )

        setThumbnails(uniqueProducts.slice(0, 5).map(p => ({
          img: p.images?.[0] || '/images/home-hero.png',
          category: (p.category || 'FEATURED').toUpperCase(),
          desc: p.name || 'Premium Collection',
          id: p._id
        })))
      } else {
        // Ultimate fallback to local high-quality images
        setThumbnails([
          { img: '/images/home-hero.png', category: 'ANARKALI', desc: 'Timeless Grace' },
          { img: '/images/categories_straight.jpg', category: 'PALAZZO', desc: 'Contemporary Comfort' },
          { img: '/images/ruby_bridal_sharara.png', category: 'STRAIGHT CUT', desc: 'Classic Sophistication' },
          { img: '/images/home-hero.png', category: 'SHARARA', desc: 'Regal Charm' },
          { img: '/images/categories_straight.jpg', category: 'NEW ARRIVALS', desc: 'Fresh Edit' }
        ])
      }
    } catch (err) {
      console.error('Error fetching carousel:', err)
      // Fallback on error - use local images
      setThumbnails([
        { img: '/images/home-hero.png', category: 'ANARKALI', desc: 'Timeless Grace' },
        { img: '/images/categories_straight.jpg', category: 'PALAZZO', desc: 'Contemporary Comfort' },
        { img: '/images/ruby_bridal_sharara.png', category: 'STRAIGHT CUT', desc: 'Classic Sophistication' }
      ])
    } finally {
      setLoading(false)
    }
  }


  // Get position for each image relative to center
  const getImagePosition = (idx) => {
    let diff = idx - activeIndex
    if (diff > thumbnails.length / 2) diff -= thumbnails.length
    if (diff < -thumbnails.length / 2) diff += thumbnails.length
    return diff
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + thumbnails.length) % thumbnails.length)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % thumbnails.length)
  }

  // Auto-slideshow every 5 seconds
  useEffect(() => {
    if (thumbnails.length === 0) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % thumbnails.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [thumbnails.length])

  if (loading || thumbnails.length === 0) {
    return (
      <section className="hero-jewelry" id="home">
        {/* Skeleton loader for better perceived performance */}
        <div className="hero-text-left">SEE</div>
        <div className="hero-text-right">MEE</div>
        <div className="hero-carousel">
          <div className="carousel-skeleton"></div>
        </div>
      </section>
    )
  }

  return (
    <section className="hero-jewelry" id="home">
      {/* Background Atmosphere */}
      <div className="hero-atmosphere"></div>

      {/* Large Text - Left: SEE */}
      <div className="hero-text-left">SEE</div>

      {/* Large Text - Right: MEE */}
      <div className="hero-text-right">MEE</div>

      {/* Logo between SEE and MEE (mobile/tablet only) */}
      {isMobile && (
        <img
          src="/images/logoSEEMEE1.png"
          alt="See Mee Logo"
          className="hero-logo-mobile"
        />
      )}

      {/* Top Left - Small Circular Thumbnails */}
      <div className="hero-thumbnails">
        {thumbnails.map((item, idx) => (
          <button
            key={idx}
            className={`hero-thumb ${activeIndex === idx ? 'active' : ''}`}
            style={{ left: `${idx * 35}px` }}
            onClick={() => setActiveIndex(idx)}
            aria-label={`View ${item.category} collection`}
          >
            <img
              src={getOptimizedImageUrl(item.img, 'thumbnail')}
              alt={item.category}
            />
          </button>
        ))}
      </div>

      {/* Center - 5 Arch Carousel with Flowing Animation */}
      <div className="hero-carousel">
        {thumbnails.map((item, idx) => {
          const position = getImagePosition(idx)

          // On mobile/tablet, show 3 images at once (left, center, right)
          if (isMobile) {
            // Only render the 3 visible images
            if (Math.abs(position) > 1) return null;

            // Calculate horizontal offset for 3-image layout
            const getXOffset = (pos) => {
              if (pos === 0) return 0;        // Center
              if (pos === 1) return 75;       // Right side
              if (pos === -1) return -75;     // Left side
              return 0;
            };

            return (
              <motion.div
                key={idx}
                className={`carousel-arch mobile-arch position-${position}`}
                onClick={() => {
                  if (position === 0 && item.id) {
                    navigate(`/product/${item.id}`);
                  } else {
                    setActiveIndex(idx);
                  }
                }}
                animate={{
                  x: `${getXOffset(position)}%`,
                  scale: position === 0 ? 1 : 0.7,
                  opacity: position === 0 ? 1 : 0.6,
                  zIndex: position === 0 ? 3 : 2
                }}
                transition={{
                  duration: 2,
                  ease: [0.22, 0.61, 0.36, 1]
                }}
              >
                <div className="carousel-image-container">
                  <img
                    src={getOptimizedImageUrl(item.img, 'mobile-hero')}
                    alt={`${item.category} - ${item.desc}`}
                    fetchpriority={position === 0 ? "high" : "low"}
                    loading={Math.abs(position) <= 1 ? "eager" : "lazy"}
                  />
                </div>
                <motion.div
                  className="carousel-label"
                  animate={{
                    opacity: position === 0 ? 1 : 0.7
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="label-category">{item.category}</span>
                  <span className="label-desc">{item.desc}</span>
                </motion.div>
              </motion.div>
            )
          }

          // Desktop: use Framer Motion animations
          const centerWidth = 380
          const sideWidth = centerWidth * 0.72
          const outerWidth = centerWidth * 0.52
          const baseGap = centerWidth * 0.063

          const getGap = (pos) => {
            if (pos === 0) return 0
            if (pos === 1) return (centerWidth / 2) + baseGap + (sideWidth / 2)
            if (pos === -1) return -((centerWidth / 2) + baseGap + (sideWidth / 2))
            if (pos === 2) return (centerWidth / 2) + baseGap + sideWidth + baseGap + (outerWidth / 2)
            if (pos === -2) return -((centerWidth / 2) + baseGap + sideWidth + baseGap + (outerWidth / 2))
            return 0
          }

          return (
            <motion.div
              key={idx}
              className={`carousel-arch position-${position}`}
              animate={{
                x: getGap(position),
                scale: position === 0 ? 1 : position === -1 || position === 1 ? 0.75 : 0.55,
                zIndex: position === 0 ? 5 : position === -1 || position === 1 ? 4 : 3,
                opacity: Math.abs(position) > 2 ? 0 : 1
              }}
              transition={{
                duration: 1.2,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              onClick={() => {
                if (position === 0 && item.id) {
                  navigate(`/product/${item.id}`);
                } else {
                  setActiveIndex(idx);
                }
              }}
            >
              <div className="carousel-image-container">
                <motion.img
                  src={getOptimizedImageUrl(item.img, 'hero')}
                  alt={`${item.category} - ${item.desc}`}
                  fetchpriority={position === 0 ? "high" : "low"}
                  loading={Math.abs(position) <= 1 ? "eager" : "lazy"}
                  style={{ objectPosition: 'center 20%' }}
                  animate={Math.abs(position) > 0 ? {} : { scale: [1, 1.01] }}
                  transition={Math.abs(position) > 0 ? {} : {
                    duration: 4,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              </div>
              <motion.div
                className="carousel-label"
                animate={{
                  opacity: position === 0 ? 1 : 0.7
                }}
                transition={{ duration: 0.5 }}
              >
                <span className="label-category">{item.category}</span>
                <span className="label-desc">{item.desc}</span>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Luxury Navigation Arrows */}
      {!isMobile && (
        <div className="hero-navigation-arrows">
          <button 
            className="hero-arrow-btn prev" 
            onClick={handlePrev} 
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            className="hero-arrow-btn next" 
            onClick={handleNext} 
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Looping Scroll Down Indicator */}
      <div className="hero-scroll-indicator">
        <span className="scroll-text">Explore Atelier</span>
        <div className="scroll-line-container">
          <motion.div 
            className="scroll-line-dot"
            animate={{ 
              y: [0, 28, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 2.2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>
      </div>

      {/* Horizontal Progress Timeline */}
      <div className="hero-progress-timeline">
        {thumbnails.map((item, idx) => (
          <div 
            key={idx} 
            className={`timeline-segment ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => setActiveIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          >
            <div className="timeline-line-bg">
              {activeIndex === idx && (
                <motion.div
                  className="timeline-line-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  key={activeIndex}
                />
              )}
            </div>
            <span className="timeline-number">{String(idx + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Hero
