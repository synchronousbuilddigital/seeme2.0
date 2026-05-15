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
      const carouselResponse = await fetch(API_ENDPOINTS.CAROUSEL)
      const carouselData = await carouselResponse.json()

      const heroSlides = carouselData.success
        ? carouselData.data.filter(slide => slide.isActive && slide.image)
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

      const [featuredResponse, collectionResponse] = await Promise.all([
        fetch(API_ENDPOINTS.FEATURED_PRODUCTS),
        fetch(API_ENDPOINTS.COLLECTION_PRODUCTS)
      ])

      const [featuredData, collectionData] = await Promise.all([
        featuredResponse.json(),
        collectionResponse.json()
      ])

      const featuredProducts = featuredData.success
        ? featuredData.data.filter(product => Array.isArray(product.images) && product.images.length > 0)
        : []

      const collectionProducts = collectionData.success
        ? collectionData.data.filter(product => Array.isArray(product.images) && product.images.length > 0)
        : []

      const sourceProducts = [...featuredProducts, ...collectionProducts]

      if (sourceProducts.length > 0) {
        const uniqueProducts = sourceProducts.filter(
          (product, index, list) => index === list.findIndex(item => item._id === product._id)
        )

        const carouselData = uniqueProducts.map(product => ({
          img: product.images[0],
          category: product.category.toUpperCase(),
          desc: product.name,
          id: product._id
        }))

        setThumbnails(carouselData.slice(0, 5))
      } else {
        setThumbnails([
          { img: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=800', category: 'ANARKALI', desc: 'Royal Collection' },
          { img: 'https://images.unsplash.com/photo-1595776613215-fe04b78de7d0?q=80&w=800', category: 'SHARARA', desc: 'Festive Edit' }
        ])
      }
    } catch (error) {
      console.error('Error fetching collection products:', error)
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


    </section>
  )
}

export default Hero
