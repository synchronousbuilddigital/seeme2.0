import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './Hero.css'

const FALLBACK_SLIDES = [
  {
    image: '/images/home-hero.png',
    title: 'Timeless Festive Wear',
    subtitle: 'Elegant silhouettes shaped for everyday celebrations.',
    category: 'Signature'
  },
  {
    image: '/images/categories_straight.jpg',
    title: 'Everyday Occasion Edit',
    subtitle: 'Clean lines, rich fabrics, and a polished finish.',
    category: 'Curated'
  },
  {
    image: '/images/ruby_bridal_sharara.png',
    title: 'Wedding Season Highlights',
    subtitle: 'Premium dressing with a modern, refined feel.',
    category: 'Featured'
  }
]

const Hero = () => {
  const navigate = useNavigate()
  const [slides, setSlides] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth <= 960)
    }

    updateMobileState()
    window.addEventListener('resize', updateMobileState)
    return () => window.removeEventListener('resize', updateMobileState)
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchCarouselImages = async () => {
      try {
        setLoading(true)
        const response = await fetch(API_ENDPOINTS.CAROUSEL)
        const data = await response.json()

        const backendSlides = data.success
          ? data.data
              .filter((slide) => (slide.isActive !== false && slide.active !== false) && slide.image)
              .map((slide) => ({
                image: slide.image,
                title: slide.title || slide.productName || slide.productCategory || 'Featured collection',
                subtitle: slide.subtitle || slide.productCategory || slide.productName || 'Curated for the new season',
                category: (slide.productCategory || slide.title || 'Featured').toString(),
                productId: slide.productId || null
              }))
          : []

        const nextSlides = backendSlides.length > 0 ? backendSlides : FALLBACK_SLIDES

        if (isMounted) {
          setSlides(nextSlides)
          setActiveIndex(0)
        }
      } catch (error) {
        console.error('Error fetching carousel:', error)
        if (isMounted) {
          setSlides(FALLBACK_SLIDES)
          setActiveIndex(0)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCarouselImages()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 12000)

    return () => clearInterval(interval)
  }, [slides.length])

  const currentSlide = slides[activeIndex] || FALLBACK_SLIDES[0]
  const titleWords = (currentSlide.title || 'Stylish Female Clothes').split(' ')
  const firstLine = titleWords.slice(0, 1).join(' ') || 'Stylish'
  const secondLine = titleWords.slice(1).join(' ') || 'Female Clothes'

  const handlePrimaryAction = () => {
    if (currentSlide.productId) {
      navigate(`/product/${currentSlide.productId}`)
      return
    }

    navigate('/collections')
  }

  if (loading || slides.length === 0) {
    return (
      <section className="hero-banner hero-banner-loading" id="home">
        <div className="hero-shell">
          <div className="hero-copy skeleton-copy">
            <div className="skeleton-pill" />
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-md" />
            <div className="skeleton-actions">
              <div className="skeleton-button" />
              <div className="skeleton-button ghost" />
            </div>
          </div>
          <div className="hero-visual skeleton-visual" />
        </div>
      </section>
    )
  }

  return (
    <section className="hero-banner" id="home">
      <div className="hero-bg-orb hero-bg-orb-left" />
      <div className="hero-bg-orb hero-bg-orb-right" />
      <div className="hero-bg-grid" />

      <div className="hero-shell">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="hero-title">
            <span>{firstLine}</span>
            <span>{secondLine}</span>
          </h1>

          <p className="hero-description">
            Made from soft, durable, premium fabrics with the warm, elegant feel of the SeeMee brand.
          </p>

          <div className="hero-cta-row">
            <motion.button
              className="hero-chip hero-chip-secondary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/collections')}
            >
              Select Category
            </motion.button>

            <motion.button
              className="hero-chip hero-chip-primary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrimaryAction}
            >
              <span>Shop Now</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          <div className="hero-social-card">
            <div className="hero-avatar-stack" aria-hidden="true">
              <span className="hero-avatar avatar-1">A</span>
              <span className="hero-avatar avatar-2">S</span>
              <span className="hero-avatar avatar-3">M</span>
            </div>
            <div className="hero-social-copy">
              <span>Our Happy Customers</span>
              <strong>4.8 / 5 Stars Review</strong>
              <div className="hero-rating" aria-hidden="true">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
            </div>
          </div>

          <div className="hero-member-row">
            <span>Not yet member?</span>
            <motion.button
              className="hero-member-btn"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
            >
              Sign Up Now
            </motion.button>
          </div>
        </motion.div>

        <div className="hero-visual-wrap">
          <motion.div
            className="hero-visual-frame"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hero-visual-tag">
              <span>Curated</span>
              <strong>Lookbook</strong>
            </div>

            <div className="hero-visual-backdrop" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.image}
                className="hero-visual-image-wrap"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  src={getOptimizedImageUrl(currentSlide.image, isMobile ? 'mobile-hero' : 'hero')}
                  alt={currentSlide.title || 'Hero banner'}
                  className="hero-main-image"
                  loading="eager"
                />
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="hero-floating-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
            >
              <span className="hero-floating-label">New Drop</span>
              <strong>{currentSlide.title}</strong>
              <p>{currentSlide.subtitle}</p>
            </motion.div>

            <button
              type="button"
              className="hero-visual-next"
              onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
              aria-label="Show next banner"
            >
              <span>Next</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        </div>
      </div>

      <div className="hero-controls">
        {slides.map((slide, index) => (
          <button
            key={`${slide.title}-${index}`}
            type="button"
            className={`hero-dot ${activeIndex === index ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to banner ${index + 1}`}
          >
            <span className="hero-dot-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="hero-dot-line">
              {activeIndex === index && <span className="hero-dot-progress" />}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default Hero
