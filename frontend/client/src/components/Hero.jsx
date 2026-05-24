import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './Hero.css'

const FALLBACK_SLIDES = [
  {
    image: '/images/home-hero.png',
    title: 'Dressing is nothing but a Choice',
    subtitle: 'Fashion is on form of self-expression and autonomy.',
    category: 'Signature'
  },
  {
    image: '/images/categories_straight.jpg',
    title: 'Everyday Occasion Edit Elegance',
    subtitle: 'Clean lines, rich fabrics, and a highly polished contemporary finish.',
    category: 'Curated'
  },
  {
    image: '/images/ruby_bridal_sharara.png',
    title: 'Wedding Season Highlights Grandeur',
    subtitle: 'Premium hand-crafted luxury dressing with a refined royal feel.',
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
      setIsMobile(window.innerWidth <= 1024)
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
                title: slide.title || slide.productName || 'Dressing is nothing but a Choice',
                subtitle: slide.subtitle || 'Fashion is on form of self-expression and autonomy.',
                category: (slide.productCategory || 'Featured').toString(),
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
  const nextSlideIndex = (activeIndex + 1) % slides.length
  const nextSlide = slides[nextSlideIndex] || FALLBACK_SLIDES[0]

  // Parse Title into styled components dynamically
  const title = currentSlide.title || 'Dressing is nothing but a Choice'
  const words = title.split(' ')
  let line1 = 'Dressing is'
  let line2 = 'nothing but a'
  let circleWord = 'Choice'

  if (words.length >= 3) {
    line1 = words.slice(0, 2).join(' ')
    line2 = words.slice(2, words.length - 1).join(' ')
    circleWord = words[words.length - 1]
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }

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
            </div>
          </div>
          <div className="hero-visual skeleton-visual" />
        </div>
      </section>
    )
  }

  return (
    <section className="hero-banner" id="home">
      {/* Light atmospheric glowing backdrops */}
      <div className="ambient-spotlight center-bottom"></div>
      <div className="ambient-spotlight top-right"></div>
      <div className="hero-bg-grid" />

      {/* Decorative Hand-Drawn Squiggles dotted around (from mockup) */}
      <div className="squiggle-decor pos-top-left" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
          <path d="M20,40 Q40,10 60,40 T100,40" stroke="rgba(43,43,43,0.12)" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div className="squiggle-decor pos-mid-right" aria-hidden="true">
        <svg width="45" height="45" viewBox="0 0 100 100" fill="none">
          <path d="M10,20 C30,40 40,0 60,30 S80,70 100,50" stroke="rgba(43,43,43,0.1)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <div className="squiggle-decor pos-bottom-right" aria-hidden="true">
        <svg width="55" height="55" viewBox="0 0 100 100" fill="none">
          <path d="M10,80 Q40,40 60,80 T100,80" stroke="rgba(43,43,43,0.14)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      <div className="hero-shell">
        {/* Left Side: Creative Typography */}
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-title-group">
            <h1 className="hero-title">
              <span className="title-line-1">
                {line1}
                {/* Underline pink squiggle SVG */}
                <svg className="pink-underline-squiggle" viewBox="0 0 300 20" fill="none" preserveAspectRatio="none">
                  <path d="M5,12 Q45,2 85,12 T165,12 T245,12 T325,12" stroke="#ff8ba7" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <span className="title-line-2">
                {line2}{' '}
                <span className="circled-word-container">
                  <span className="circled-word">{circleWord}</span>
                  {/* Gold organic ellipse loop SVG */}
                  <svg className="gold-organic-loop" viewBox="0 0 180 80" fill="none" preserveAspectRatio="none">
                    <path
                      d="M10,40 C10,15 80,8 150,15 C178,18 175,45 150,60 C90,80 20,70 12,45 C9,30 65,18 130,22"
                      stroke="#d4af37"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <span className="organic-pink-dot" />
                </span>
              </span>
            </h1>
          </div>

          <p className="hero-description">
            {currentSlide.subtitle || 'Fashion is on form of self-expression and autonomy.'}
            <span className="hero-description-heritage">
              {' '}Crafted with ancestral wisdom, our luxury designs tell stories of slow fashion, using pure silk, tilla-gold embroidery and regal velvet that celebrate the royal legacy of Indian couture.
            </span>
          </p>

          <div className="hero-navigation-links">
            <motion.button
              className="read-more-link"
              onClick={handlePrimaryAction}
              whileHover={{ x: 6 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <span>Read more</span>
              <svg width="22" height="14" viewBox="0 0 30 14" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2,7 L28,7 M22,1 L28,7 L22,13" />
              </svg>
            </motion.button>
          </div>

          {/* Bottom Left Circular Golden Button */}
          <div className="circular-btn-wrapper">
            <motion.button
              className="circular-outline-btn"
              onClick={() => navigate('/collections')}
              whileHover={{ scale: 1.06, rotate: 15 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="circular-btn-content">
                <span>View</span>
                <span>the design</span>
                <svg width="18" height="12" viewBox="0 0 24 12" fill="none" stroke="#d4af37" strokeWidth="2.8" strokeLinecap="round">
                  <path d="M2,6 L22,6 M16,1 L22,6 L16,11" />
                </svg>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Right Side: Creative Capsule Visual Frames */}
        <div className="hero-visual-container-premium">
          {/* Main Large Visual Capsule */}
          <motion.div
            className="main-visual-capsule-wrapper"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Soft pink glow behind main capsule */}
            <div className="capsule-glow pink-glow" />

            {/* White Bounding Corner Markers framing the capsule from outside (Mockup Exact Detail) */}
            <div className="capsule-corner marker-tl" />
            <div className="capsule-corner marker-tr" />
            <div className="capsule-corner marker-bl" />
            <div className="capsule-corner marker-br" />

            <div className="main-visual-capsule">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.image}
                  className="capsule-image-wrap"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.7 }}
                >
                  <img
                    src={getOptimizedImageUrl(currentSlide.image, isMobile ? 'mobile-hero' : 'hero')}
                    alt={currentSlide.title || 'SeeMee Luxury'}
                    className="capsule-image"
                    loading="eager"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Secondary Overlapping Small Visual Capsule */}
          <motion.div
            className="secondary-visual-capsule-wrapper"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleNext}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            aria-label="View next slide"
          >
            {/* Soft purple glow behind secondary capsule */}
            <div className="capsule-glow purple-glow" />

            <div className="secondary-visual-capsule">
              <AnimatePresence mode="wait">
                <motion.div
                  key={nextSlide.image}
                  className="secondary-capsule-image-wrap"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.6 }}
                >
                  <img
                    src={getOptimizedImageUrl(nextSlide.image, 'thumbnail')}
                    alt="Next Sneak Peek"
                    className="secondary-capsule-image"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Hand-drawn curved arrow pointing to small capsule */}
          <div className="curved-arrow-decor" aria-hidden="true">
            <svg width="45" height="45" viewBox="0 0 100 100" fill="none">
              <path d="M10,80 Q40,70 60,30" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M50,30 L60,30 L60,40" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Slide Index Dot Controls */}
      <div className="hero-controls-premium">
        {slides.map((slide, index) => (
          <button
            key={`${slide.title}-${index}`}
            type="button"
            className={`premium-dot ${activeIndex === index ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          >
            <span className="premium-dot-line">
              {activeIndex === index && <span className="premium-dot-progress" />}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default Hero
