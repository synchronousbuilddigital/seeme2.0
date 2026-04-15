import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './Hero.css'

const Hero = () => {
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
      // Start fetch immediately without delay
      const response = await fetch('/api/carousel')
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        // Transform API data to match component format
        const carouselData = data.data.map(item => ({
          img: item.image,
          category: item.title || 'Featured',
          desc: item.subtitle || 'Elegant Collection'
        }))
        setThumbnails(carouselData)
      }
    } catch (error) {
      console.error('Error fetching carousel images:', error)
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    { label: 'FABRICS', target: 'fabrics' },
    { label: 'CATEGORIES', target: 'categories' },
    { label: 'NEW ARRIVALS', target: 'new-arrivals' },
    { label: 'COLLECTIONS', target: 'featured-collection' },
    { label: 'MAGAZINE', target: 'magazine' },
    { label: 'ABOUT', target: 'about' }
  ]

  const scrollToSection = (targetId) => {
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Get position for each image relative to center
  const getImagePosition = (idx) => {
    let diff = idx - activeIndex
    if (diff > thumbnails.length / 2) diff -= thumbnails.length
    if (diff < -thumbnails.length / 2) diff += thumbnails.length
    return diff
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
              crossOrigin="anonymous"
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
                onClick={() => position !== 0 && setActiveIndex(idx)}
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
                    crossOrigin="anonymous"
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
              onClick={() => position !== 0 && setActiveIndex(idx)}
            >
              <div className="carousel-image-container">
                <motion.img 
                  src={getOptimizedImageUrl(item.img, 'hero')} 
                  alt={`${item.category} - ${item.desc}`}
                  fetchpriority={position === 0 ? "high" : "low"}
                  loading={Math.abs(position) <= 1 ? "eager" : "lazy"}
                  crossOrigin="anonymous"
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

      {/* Right Menu */}
      <div className="hero-menu">
        {menuItems.map((item, idx) => (
          <button 
            key={idx} 
            className="hero-menu-item"
            onClick={() => scrollToSection(item.target)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default Hero
