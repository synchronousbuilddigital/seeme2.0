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
    subtitle: 'Fashion is a form of self-expression and autonomy.',
    description: 'Crafted with ancestral wisdom, our luxury designs tell stories of slow fashion, using pure silk, tilla-gold embroidery and regal velvet that celebrate the royal legacy of Indian couture.',
    category: 'Signature'
  },
  {
    image: '/images/hero/sharara_festive.png',
    title: 'Everyday Occasion Edit Elegance',
    subtitle: 'Clean lines, rich fabrics, and a highly polished contemporary finish.',
    description: 'Tailored for the modern woman, this collection merges casual ease with luxury aesthetics, showcasing handloom cotton and minimal gold detailing for a timeless elegance.',
    category: 'Curated'
  },
  {
    image: '/images/ruby_bridal_sharara.png',
    title: 'Wedding Season Highlights Grandeur',
    subtitle: 'Premium hand-crafted luxury dressing with a refined royal feel.',
    description: 'Celebrate your grand milestones with our signature bridal shararas and lehengas, embellished with intricate hand-embroidered tilla and zardozi that define exquisite royalty.',
    category: 'Featured'
  },
  {
    image: '/images/magazine/banarasi_silk_loom.png',
    title: 'Woven Tales of Ancient Loom',
    subtitle: 'Authentic handloom Banarasi silk crafted by seventh-generation master weavers.',
    description: 'Every thread holds a centuries-old story of craftsmanship, intricately interlaced with pure gold zari and raw mulberry silk to create heirlooms for generations to come.',
    category: 'Handloom'
  },
  {
    image: '/images/magazine/weight_of_velvet.png',
    title: 'Regal Weight of Velvet Majesty',
    subtitle: 'Luxurious thick velvets adorned with delicate micro-pearl embellishments.',
    description: 'Designed to drape like liquid gold, this collection features deep gemstone colors paired with traditional dabka hand-embroidery, ideal for royal winter soirées.',
    category: 'Prestige'
  }
]

const CATEGORY_IMAGES = {
  'anarkali': '/images/hero/sharara_festive.png',
  'palazzo': '/images/home-hero.png',
  'straight-cut': '/images/ruby_bridal_sharara.png',
  'sharara': '/images/hero/sharara_festive.png',
  'co-ord-sets': '/images/magazine/weight_of_velvet.png',
  '3-piece-sets': '/images/home-hero.png',
  '2-piece-sets': '/images/ruby_bridal_sharara.png',
  'bandhani': '/images/ruby_bridal_sharara.png',
  'georgette': '/images/categories_straight.jpg',
  'jaipuri': '/images/hero/sharara_festive.png',
}

const formatCategoryName = (slug) => {
  if (!slug) return ''
  const s = slug.toLowerCase().trim()
  if (s === '2-piece-sets' || s === '2-piece' || s === '2-pieces') return '2-Piece'
  if (s === '3-piece-sets' || s === '3-piece' || s === '3-pieces') return '3-Piece'
  if (s === 'co-ord-sets' || s === 'cord-set' || s === 'co-ord' || s === 'co-ord-set') return 'Cord Set'

  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

const getCategoryType = (slug) => {
  if (!slug) return 'COUTURE'
  const s = slug.toLowerCase().trim()
  if (s.includes('saree')) return 'SAREE'
  if (s.includes('lehenga')) return 'LEHENGA'
  if (s.includes('set') || s.includes('co-ord') || s.includes('piece')) return 'SETS'
  if (s.includes('palazzo') || s.includes('sharara') || s.includes('anarkali') || s.includes('kurti') || s.includes('straight') || s.includes('jalpuri') || s.includes('georgette') || s.includes('bandhani') || s.includes('jaipuri')) return 'KURTI'
  return 'COUTURE'
}

const Hero = () => {
  const navigate = useNavigate()
  const [slides, setSlides] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [categories, setCategories] = useState(['anarkali', 'palazzo', 'straight-cut', 'sharara', 'bandhani', 'georgette', 'jaipuri'])
  const [categoryImages, setCategoryImages] = useState({})
  const [typedTitle, setTypedTitle] = useState('')

  const getCategoryDisplayImage = (slug) => {
    const s = slug.toLowerCase().trim()
    const rawImage = categoryImages[s] || CATEGORY_IMAGES[s] || '/images/home-hero.png'
    return getOptimizedImageUrl(rawImage, 'circle')
  }

  useEffect(() => {
    // Fetch unique categories
    fetch(API_ENDPOINTS.GET_CATEGORIES)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setCategories(data.data)
        }
      })
      .catch(err => console.error('Error fetching categories in Hero:', err))

    // Fetch active products to extract real category images from database
    fetch(API_ENDPOINTS.PRODUCTS)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const products = data.data
          const imageMap = {}
          products.forEach(p => {
            if (p.category && p.images && p.images.length > 0) {
              const catKey = p.category.toLowerCase().trim()
              if (!imageMap[catKey]) {
                imageMap[catKey] = p.images[0]
              }
            }
          })
          setCategoryImages(imageMap)
        }
      })
      .catch(err => console.error('Error fetching category images:', err))
  }, [])

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
            .map((slide, index) => {
              // Generate a unique descriptive text matching the category or index to guarantee diverse premium content
              let desc = 'Discover our latest curated collection of premium royal Indian wear.';
              const category = (slide.productCategory || '').toLowerCase();
              const titleText = (slide.title || slide.productName || '').toLowerCase();

              if (category.includes('anarkali') || titleText.includes('anarkali')) {
                desc = 'Flared silhouettes designed with flowy premium fabrics, perfect for grand entrances and formal festivities.';
              } else if (category.includes('palazzo') || titleText.includes('palazzo')) {
                desc = 'Comfort meets luxury in our wide-leg palazzo sets, featuring detailed block prints and soft pastel hues.';
              } else if (category.includes('straight') || titleText.includes('straight')) {
                desc = 'Sleek, tailored cuts made from fine chanderi silk and high-quality thread work, perfect for everyday contemporary elegance.';
              } else if (category.includes('sharara') || titleText.includes('sharara')) {
                desc = 'Intricate hand-crafted sharara sets, layered with rich embroidery and regal borders for classic festive grandeur.';
              } else {
                // Fallback alternating majestic copy
                const alternateDescriptions = [
                  'Crafted with ancestral wisdom, our luxury designs tell stories of slow fashion, using pure silk, tilla-gold embroidery and regal velvet that celebrate the royal legacy of Indian couture.',
                  'Tailored for the modern woman, this collection merges casual ease with luxury aesthetics, showcasing handloom cotton and minimal gold detailing for a timeless elegance.',
                  'Celebrate your grand milestones with our signature bridal shararas and lehengas, embellished with intricate hand-embroidered tilla and zardozi that define exquisite royalty.'
                ];
                desc = alternateDescriptions[index % alternateDescriptions.length];
              }

              // Generate a unique title if not configured in the database
              let slideTitle = slide.title || slide.productName;
              if (!slideTitle || slideTitle === 'Dressing is nothing but a Choice') {
                if (category.includes('anarkali')) {
                  slideTitle = 'Royal Anarkali Couture Elegance';
                } else if (category.includes('palazzo')) {
                  slideTitle = 'Modern Palazzo Luxe Grace';
                } else if (category.includes('straight')) {
                  slideTitle = 'Tailored Straight Cut Splendor';
                } else if (category.includes('sharara')) {
                  slideTitle = 'Festive Sharara Heritage Splendor';
                } else {
                  const alternateTitles = [
                    'Dressing is nothing but a Choice',
                    'Everyday Occasion Edit Elegance',
                    'Wedding Season Highlights Grandeur',
                    'Woven Tales of Ancient Loom',
                    'Regal Weight of Velvet Majesty',
                    'True Heritage Artisan Mastery'
                  ];
                  slideTitle = alternateTitles[index % alternateTitles.length];
                }
              }

              // Generate a unique subtitle if not configured in the database
              let slideSubtitle = slide.subtitle;
              if (!slideSubtitle || slideSubtitle === 'Fashion is on form of self-expression and autonomy.' || slideSubtitle === 'Fashion is a form of self-expression and autonomy.') {
                if (category.includes('anarkali')) {
                  slideSubtitle = 'Exquisite flared flowy silk sets designed for royal prestige.';
                } else if (category.includes('palazzo')) {
                  slideSubtitle = 'Chic contemporary style detailed with intricate handblock prints.';
                } else if (category.includes('straight')) {
                  slideSubtitle = 'Sleek premium threadwork and elegant gold tilla on chanderi.';
                } else if (category.includes('sharara')) {
                  slideSubtitle = 'Traditional hand-embroidered borders celebrating Indian heritage.';
                } else {
                  const alternateSubtitles = [
                    'Fashion is a form of self-expression and autonomy.',
                    'Clean lines, rich fabrics, and highly polished finish.',
                    'Premium hand-crafted luxury dressing with refined royal feel.',
                    'Authentic handloom Banarasi silk by master weavers.',
                    'Luxurious thick velvets adorned with micro-pearls.',
                    'Preserving the craft of hand-guided gold zari embroidery.'
                  ];
                  slideSubtitle = alternateSubtitles[index % alternateSubtitles.length];
                }
              }

              return {
                image: slide.image,
                title: slideTitle,
                subtitle: slideSubtitle,
                description: desc,
                category: (slide.productCategory || 'Featured').toString(),
                productId: slide.productId || null
              };
            })
          : []

        // Safeguard: Check if backend slides contain duplicate images or are too repetitive
        const uniqueImages = new Set(backendSlides.map((s) => s.image));
        const hasDuplicates = uniqueImages.size < backendSlides.length;

        let nextSlides;
        if (backendSlides.length > 0 && !hasDuplicates) {
          nextSlides = [...backendSlides];
          if (nextSlides.length < 5) {
            const remainingCount = 5 - nextSlides.length;
            const fillerSlides = FALLBACK_SLIDES.filter(
              (fSlide) => !nextSlides.some((bSlide) => bSlide.image === fSlide.image)
            ).slice(0, remainingCount);
            nextSlides = [...nextSlides, ...fillerSlides];
          }
          nextSlides = nextSlides.slice(0, 5);
        } else {
          // If database is empty or has duplicates (e.g. dummy seeds), load our premium handcrafted lookbook directly
          nextSlides = FALLBACK_SLIDES.slice(0, 5);
        }

        if (isMounted) {
          setSlides(nextSlides)
          setActiveIndex(0)
        }
      } catch (error) {
        console.error('Error fetching carousel:', error)
        if (isMounted) {
          setSlides(FALLBACK_SLIDES.slice(0, 5))
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

  useEffect(() => {
    const fullTitle = currentSlide?.title || 'Dressing is nothing but a Choice'
    setTypedTitle('')
    
    let titleInterval;
    
    const delayTimeout = setTimeout(() => {
      let i = 0
      titleInterval = setInterval(() => {
        if (i < fullTitle.length) {
          setTypedTitle(fullTitle.substring(0, i + 1))
          i++
        } else {
          clearInterval(titleInterval)
        }
      }, 45)
    }, 600) // perfectly synced with AnimatePresence exit duration
    
    return () => {
      clearTimeout(delayTimeout)
      if (titleInterval) {
        clearInterval(titleInterval)
      }
    }
  }, [activeIndex, currentSlide?.title, slides.length])

  // Parse Title into segments dynamically
  const stableTitle = currentSlide.title || 'Dressing is nothing but a Choice'
  const stableWords = stableTitle.split(' ')
  
  let targetLine1 = ''
  let targetLine2 = ''
  let targetCircleWord = ''

  if (stableWords.length === 1) {
    targetCircleWord = stableWords[0]
  } else if (stableWords.length === 2) {
    targetLine1 = stableWords[0]
    targetCircleWord = stableWords[1]
  } else {
    const middleIndex = Math.ceil(stableWords.length / 2)
    targetLine1 = stableWords.slice(0, middleIndex).join(' ')
    targetLine2 = stableWords.slice(middleIndex, stableWords.length - 1).join(' ')
    targetCircleWord = stableWords[stableWords.length - 1]
  }

  const len1 = targetLine1.length
  const len2 = targetLine2.length
  const currentLength = typedTitle.length
  
  let line1 = ''
  let line2 = ''
  let circleWord = ''

  if (currentLength >= stableTitle.length) {
    line1 = targetLine1
    line2 = targetLine2
    circleWord = targetCircleWord
  } else {
    if (currentLength <= len1) {
      line1 = targetLine1.substring(0, currentLength)
    } else {
      line1 = targetLine1
      const remainingLength = currentLength - len1 - (targetLine1 && targetLine2 ? 1 : 0)
      if (remainingLength <= len2) {
        line2 = targetLine2.substring(0, Math.max(0, remainingLength))
      } else {
        line2 = targetLine2
        const circleLength = remainingLength - len2 - (targetLine2 && targetCircleWord ? 1 : 0)
        circleWord = targetCircleWord.substring(0, Math.max(0, circleLength))
      }
    }
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
        <div className="hero-copy">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'inherit', textAlign: 'inherit' }}
            >
              <div className="hero-title-group">
                <h1 className="hero-title">
                  <span className="title-line-1">
                    {line1}
                    {currentLength > 0 && currentLength <= len1 && <span className="typing-cursor">|</span>}
                  </span>
                  <span className="title-line-2">
                    {line2}{' '}
                    {currentLength > len1 && currentLength <= (len1 + 1 + len2) && <span className="typing-cursor">|</span>}
                    <span className="circled-word">
                      {circleWord}
                      {currentLength > (len1 + 1 + len2) && currentLength < stableTitle.length && <span className="typing-cursor">|</span>}
                    </span>
                  </span>
                </h1>
              </div>

              <p className="hero-description">
                {currentSlide.subtitle}
                {currentSlide.description && (
                  <span className="hero-description-heritage">
                    {' '}{currentSlide.description}
                  </span>
                )}
              </p>

              <div className="hero-navigation-links">
                <motion.button
                  className="read-more-link"
                  onClick={handlePrimaryAction}
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <span>View design</span>
                  <svg width="22" height="14" viewBox="0 0 30 14" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M2,7 L28,7 M22,1 L28,7 L22,13" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

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

            <div className="main-visual-capsule" style={{ position: 'relative' }}>
              <AnimatePresence>
                <motion.div
                  key={currentSlide.image}
                  className="capsule-image-wrap"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  style={{ position: 'absolute', inset: 0 }}
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

            <div className="secondary-visual-capsule" style={{ position: 'relative' }}>
              <AnimatePresence>
                <motion.div
                  key={nextSlide.image}
                  className="secondary-capsule-image-wrap"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  style={{ position: 'absolute', inset: 0 }}
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

          {/* Premium Circular Thumbnail Navigation floating on the side of the photo */}
          <div className="hero-thumbnails-container">
            <span className="thumbnail-nav-label">Next</span>
            <div className="hero-thumbnail-list">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.title}-${index}`}
                  type="button"
                  className={`hero-thumbnail-btn ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className="thumbnail-img-wrap">
                    <img src={getOptimizedImageUrl(slide.image, 'thumbnail')} alt={slide.title || 'Slide Preview'} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Looping Category Circles Section */}
      {categories.length > 0 && (
        <div className="category-marquee-container">
          <div className="category-marquee-track">
            {/* Repeat the list 10 times for a mathematically seamless infinite loop on any screen width */}
            {Array(10).fill(categories).flat().map((cat, idx) => (
              <div
                key={`${cat}-${idx}`}
                className="category-circle-item"
                onClick={() => navigate(`/category/${cat}`)}
              >
                <div className="category-circle-visual">
                  <div className="category-circle-img-wrap">
                    <img src={getCategoryDisplayImage(cat)} alt={cat} className="category-circle-img" />
                    <div className="category-circle-overlay" />
                  </div>
                </div>
                <span className="category-circle-name">{formatCategoryName(cat)}</span>
                <span className="category-circle-tag">{getCategoryType(cat)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default Hero
