import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './Hero.css'

const Hero = () => {
  const navigate = useNavigate()
  const [thumbnails, setThumbnails] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 968)
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

      // Fallback on empty carousel - fetch featured products
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
        // Fallback to local images
        setThumbnails([
          { img: '/images/home-hero.png', category: 'ANARKALI', desc: 'Timeless Grace' },
          { img: '/images/categories_straight.jpg', category: 'PALAZZO', desc: 'Contemporary Comfort' },
          { img: '/images/ruby_bridal_sharara.png', category: 'STRAIGHT CUT', desc: 'Classic Sophistication' },
          { img: '/images/home-hero.png', category: 'SHARARA', desc: 'Regal Charm' }
        ])
      }
    } catch (err) {
      console.error('Error fetching carousel:', err)
      setThumbnails([
        { img: '/images/home-hero.png', category: 'ANARKALI', desc: 'Timeless Grace' },
        { img: '/images/categories_straight.jpg', category: 'PALAZZO', desc: 'Contemporary Comfort' },
        { img: '/images/ruby_bridal_sharara.png', category: 'STRAIGHT CUT', desc: 'Classic Sophistication' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + thumbnails.length) % thumbnails.length)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % thumbnails.length)
  }

  // Auto-slideshow every 6 seconds
  useEffect(() => {
    if (thumbnails.length === 0) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % thumbnails.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [thumbnails.length])

  if (loading || thumbnails.length === 0) {
    return (
      <section className="hero-jewelry skeleton-view" id="home">
        <div className="hero-reference-container">
          <div className="hero-ref-left">
            <div className="skeleton-tag"></div>
            <div className="skeleton-title-1"></div>
            <div className="skeleton-title-2"></div>
            <div className="skeleton-text"></div>
          </div>
          <div className="hero-ref-right">
            <div className="skeleton-arch"></div>
          </div>
        </div>
      </section>
    )
  }

  const currentSlide = thumbnails[activeIndex]
  const nextSlide = thumbnails[(activeIndex + 1) % thumbnails.length]

  const getCleanFirstWord = (text) => {
    if (!text) return 'Elegance'
    const words = text.split(' ')
    return words[0].length > 12 ? 'Couture' : words[0]
  }

  return (
    <section className="hero-jewelry" id="home">
      {/* Background Atmosphere */}
      <div className="hero-atmosphere"></div>

      {/* Subtle luxury sparkle layer */}
      <div className="hero-sparkles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`sparkle sparkle-${i + 1}`}></div>
        ))}
      </div>

      <div className="hero-reference-container">
        {/* Left Content Column */}
        <div className="hero-ref-left">
          <motion.div 
            className="hero-ref-category-tag"
            key={`cat-${activeIndex}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span>{currentSlide.category}</span>
          </motion.div>

          <h1 className="hero-ref-title">
            <span className="title-row-1">
              {getCleanFirstWord(currentSlide.desc)} is
              <span className="wavy-decor-wrapper">
                <svg className="wavy-underline" viewBox="0 0 120 10" preserveAspectRatio="none">
                  <path d="M0,5 C15,2 30,8 45,5 C60,2 75,8 90,5 C105,2 115,5 120,5" fill="none" stroke="var(--primary-gold)" strokeWidth="3" />
                </svg>
              </span>
            </span>
            <span className="title-row-2">
              nothing but a 
              <span className="choice-circle-wrapper">
                <span className="choice-text">Choice</span>
                {/* Gold hand-drawn circle outline */}
                <svg className="gold-circle-svg" viewBox="0 0 200 80" preserveAspectRatio="none">
                  <path 
                    d="M10,40 C10,18 90,12 185,25 C195,38 180,62 100,68 C20,68 8,48 25,32" 
                    fill="none" 
                    stroke="var(--primary-gold)" 
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Pink decorative dot */}
                <span className="pink-circle-dot"></span>
              </span>
            </span>
          </h1>

          <p className="hero-ref-description">
            Fashion is a form of self-expression and autonomy. Our bespoke couture collections balance royal grandeur with contemporary ease, tailored for your premium lifestyle.
          </p>

          <div className="hero-ref-actions">
            <button 
              className="hero-ref-readmore"
              onClick={() => currentSlide.id ? navigate(`/product/${currentSlide.id}`) : navigate('/collections')}
            >
              Read more 
              <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Bottom Circular Outline Badge */}
          <button 
            className="hero-ref-view-badge"
            onClick={() => currentSlide.id ? navigate(`/product/${currentSlide.id}`) : navigate('/collections')}
          >
            <div className="badge-inner">
              <span className="badge-text-line-1">View the</span>
              <span className="badge-text-line-2">design</span>
              <div className="badge-arrow-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Right Media Column */}
        <div className="hero-ref-right">
          
          {/* Main Large Capsule Arch Wrapper */}
          <div className="main-arch-wrapper">
            {/* White photo corners */}
            <div className="corner-accent tl"></div>
            <div className="corner-accent tr"></div>
            <div className="corner-accent bl"></div>
            <div className="corner-accent br"></div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={`main-img-${activeIndex}`}
                className="main-arch-frame"
                initial={{ scale: 1.05, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.05, opacity: 0 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => currentSlide.id && navigate(`/product/${currentSlide.id}`)}
              >
                <img 
                  src={getOptimizedImageUrl(currentSlide.img, 'hero')} 
                  alt={currentSlide.category} 
                />
                <div className="frame-glow-overlay"></div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Secondary Smaller Offset Arch Frame */}
          {nextSlide && (
            <div className="secondary-arch-wrapper">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`sub-img-${activeIndex}`}
                  className="secondary-arch-frame"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  onClick={handleNext}
                  title="View next design"
                >
                  <img 
                    src={getOptimizedImageUrl(nextSlide.img, 'hero')} 
                    alt={nextSlide.category} 
                  />
                  <div className="secondary-overlay">
                    <span className="sec-label">Next Design</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Cursive vector swirl shapes for Lookbook luxury vibe */}
          <div className="decor-swirl swirl-1">
            <svg width="70" height="70" viewBox="0 0 100 100" fill="none" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1.5">
              <path d="M10,40 C30,10 60,80 90,40" strokeLinecap="round" />
            </svg>
          </div>
          <div className="decor-swirl swirl-2">
            <svg width="45" height="45" viewBox="0 0 100 100" fill="none" stroke="var(--primary-gold)" strokeWidth="1.5" strokeDasharray="3 3">
              <path d="M80,20 C50,60 20,40 10,80" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Slide Navigation Pagination */}
      <div className="hero-ref-controls">
        <div className="timeline-segment-group">
          {thumbnails.map((item, idx) => (
            <button 
              key={idx}
              className={`timeline-dot-btn ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            >
              <span className="dot-number">{String(idx + 1).padStart(2, '0')}</span>
              <span className="dot-bar"></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
