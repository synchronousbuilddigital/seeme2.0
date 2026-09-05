import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { belongsToAudience } from '../utils/categoryHelper'
import './Hero.css'

// Module-level eager fetch promises to optimize first-paint load speed
let carouselPromise = null
let categoriesPromise = null
let productsPromise = null

const startEagerFetches = () => {
  if (typeof window === 'undefined') return

  if (!carouselPromise) {
    carouselPromise = cachedFetch(API_ENDPOINTS.CAROUSEL).catch(err => {
      console.error('Eager fetch carousel error:', err)
      return null
    })
  }

  if (!categoriesPromise) {
    categoriesPromise = cachedFetch(API_ENDPOINTS.GET_CATEGORIES).catch(err => {
      console.error('Eager fetch categories error:', err)
      return null
    })
  }

  if (!productsPromise) {
    productsPromise = cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=12`).catch(err => {
      console.error('Eager fetch products error:', err)
      return null
    })
  }
}

// Start prefetching immediately upon JS loading
startEagerFetches()

const getCategorySlugStr = (cat) => {
  if (!cat) return ''
  if (typeof cat === 'string') return cat
  if (typeof cat === 'object') {
    return cat.slug || cat.name || cat.title || cat.category || String(cat)
  }
  return String(cat)
}

const normalizeCategoryKey = (slug) => {
  const str = getCategorySlugStr(slug)
  if (!str) return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/sets?$/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const formatCategoryName = (slug) => {
  const str = getCategorySlugStr(slug)
  if (!str) return ''
  const s = str.toLowerCase().trim()
  if (s === '2-piece-sets' || s === '2-piece' || s === '2-pieces') return '2-Piece'
  if (s === '3-piece-sets' || s === '3-piece' || s === '3-pieces') return '3-Piece'
  if (s === 'co-ord-sets' || s === 'cord-set' || s === 'co-ord' || s === 'co-ord-set') return 'Cord Set'

  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

const getCategoryType = (slug) => {
  const str = getCategorySlugStr(slug)
  if (!str) return 'COUTURE'
  const s = str.toLowerCase().trim()
  if (s.includes('saree')) return 'SAREE'
  if (s.includes('lehenga')) return 'LEHENGA'
  if (s.includes('set') || s.includes('co-ord') || s.includes('piece')) return 'SETS'
  if (s.includes('palazzo') || s.includes('sharara') || s.includes('anarkali') || s.includes('kurti') || s.includes('straight') || s.includes('jalpuri') || s.includes('georgette') || s.includes('bandhani') || s.includes('jaipuri')) return 'KURTI'
  return 'COUTURE'
}

const Hero = ({ activeAudience = 'all' }) => {
  const navigate = useNavigate()

  const [rawSlides, setRawSlides] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_carousel_slides')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(item => item.image && !item.image.startsWith('/images/'))
          if (filtered.length > 0) return filtered
        }
      }
    } catch (e) {
      console.error('Error parsing cached slides:', e)
    }
    return []
  })

  const [activeIndex, setActiveIndex] = useState(0)

  // Multi-audience section matching:
  // Allows slides assigned to multiple audiences (e.g. ['men', 'women']) to show in all checked panels!
  const getAudienceArray = (val) => {
    if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase())
    if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
    return ['all']
  }

  const filteredSlides = rawSlides.filter(slide => {
    const slideAudiences = getAudienceArray(slide.targetAudience || slide.gender)
    const cleanAudiences = slideAudiences.length > 0 ? slideAudiences : ['all']
    const current = (activeAudience || 'all').toLowerCase().trim()

    const hasStrict = rawSlides.some(s => {
      const a = getAudienceArray(s.targetAudience || s.gender)
      return a.includes(current)
    })

    if (hasStrict) {
      return cleanAudiences.includes(current)
    }

    if (current === 'all') return true

    return cleanAudiences.includes(current) || cleanAudiences.includes('all') || cleanAudiences.includes('unisex')
  })

  const slides = filteredSlides

  useEffect(() => {
    setActiveIndex(0)
  }, [activeAudience])

  const [loading, setLoading] = useState(slides.length === 0)
  const [isMobile, setIsMobile] = useState(false)
  // Initialize categories state from local storage cache to avoid blank states/flashing
  const [categories, setCategories] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_category_slides')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error parsing cached category slides:', e)
    }
    return []
  })

  // Initialize category images from cache
  const [categoryImages, setCategoryImages] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_category_images')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && typeof parsed === 'object') {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error parsing cached category images:', e)
    }
    return {}
  })

  const [typedTitle, setTypedTitle] = useState('')

  // Seamless Infinite Loop Drag/Scroll Track Refs & Handlers
  const marqueeContainerRef = useRef(null)
  const marqueeTrackRef = useRef(null)
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const animFrameIdRef = useRef(null)
  const isHoveredRef = useRef(false)

  useEffect(() => {
    if (!categories.length) return

    const track = marqueeTrackRef.current
    if (!track) return

    let lastTime = performance.now()

    const animate = (now) => {
      const delta = Math.min(now - lastTime, 32)
      lastTime = now

      if (!isDraggingRef.current && !isHoveredRef.current) {
        currentXRef.current -= 0.04 * delta
      }

      const halfWidth = track.scrollWidth / 2
      if (halfWidth > 0) {
        if (currentXRef.current <= -halfWidth) {
          currentXRef.current += halfWidth
        } else if (currentXRef.current > 0) {
          currentXRef.current -= halfWidth
        }
        track.style.transform = `translate3d(${currentXRef.current}px, 0, 0)`
      }

      animFrameIdRef.current = requestAnimationFrame(animate)
    }

    animFrameIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
    }
  }, [categories])

  const handlePointerDown = (e) => {
    isDraggingRef.current = true
    hasDraggedRef.current = false
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    startXRef.current = clientX - currentXRef.current
  }

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const newX = clientX - startXRef.current
    if (Math.abs(newX - currentXRef.current) > 4) {
      hasDraggedRef.current = true
    }
    currentXRef.current = newX
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
  }

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || Math.abs(e.deltaY) < 50) {
      currentXRef.current -= (e.deltaX || e.deltaY) * 0.8
    }
  }

  const getCategoryDisplayImage = (catInput) => {
    if (!catInput) return ''

    // 1. If catInput is a Category Slide object with an image, prioritize it!
    if (typeof catInput === 'object' && catInput.image) {
      return getOptimizedImageUrl(catInput.image, 'circle')
    }

    const slug = getCategorySlugStr(catInput)
    if (!slug) return ''
    const s = slug.toLowerCase().trim()
    const norm = normalizeCategoryKey(slug)

    // 2. Check exact key match from mapped product images
    if (categoryImages[s]) return getOptimizedImageUrl(categoryImages[s], 'circle')
    if (categoryImages[norm]) return getOptimizedImageUrl(categoryImages[norm], 'circle')

    // 3. Check partial key match from mapped product images
    const partialKey = Object.keys(categoryImages).find(k => k !== '_allImages' && (k.includes(norm) || norm.includes(k)))
    if (partialKey && categoryImages[partialKey]) {
      return getOptimizedImageUrl(categoryImages[partialKey], 'circle')
    }

    // 4. Fallback to product images pool from DB
    const pool = (Array.isArray(categoryImages._allImages) && categoryImages._allImages.length > 0)
      ? categoryImages._allImages
      : []

    if (pool.length === 0) return ''

    let hash = 0
    for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i)
    const idx = Math.abs(hash) % pool.length
    const fallbackRaw = pool[idx] || pool[0]
    return getOptimizedImageUrl(fallbackRaw, 'circle')
  }

  const getCategoryTitle = (catItem) => {
    if (!catItem) return ''
    if (typeof catItem === 'object' && catItem.title) return catItem.title
    return formatCategoryName(getCategorySlugStr(catItem))
  }

  const getCategoryTag = (catItem) => {
    if (!catItem) return 'SETS'
    if (typeof catItem === 'object' && catItem.subtitle) return catItem.subtitle
    return getCategoryType(getCategorySlugStr(catItem))
  }

  const getCategorySlug = (catItem) => {
    if (!catItem) return ''
    if (typeof catItem === 'object' && catItem.slug) return catItem.slug
    return getCategorySlugStr(catItem)
  }

  useEffect(() => {
    let isMounted = true

    const fetchCategoriesAndProducts = async () => {
      // 1. Fetch category slides from Admin Site Settings
      try {
        const settingsData = await cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { ttlMs: 300000 })
        if (isMounted && settingsData?.success && Array.isArray(settingsData.data?.categorySlides) && settingsData.data.categorySlides.length > 0) {
          const adminSlides = settingsData.data.categorySlides
            .filter(Boolean)
            .sort((a, b) => ((a?.order || 0) - (b?.order || 0)))
            .map(slide => {
              const title = slide?.title || slide?.label || slide?.name || ''
              return {
                title,
                subtitle: slide?.subtitle || 'SETS',
                slug: slide?.slug || title.toLowerCase().replace(/\s+/g, '-'),
                image: slide?.image || '',
                id: slide?._id || slide?.slug
              }
            })

          setCategories(adminSlides)
          try {
            localStorage.setItem('seemee_category_slides', JSON.stringify(adminSlides))
          } catch (e) {
            console.error('Error caching category slides:', e)
          }
        } else {
          // Fallback to distinct product categories if no Admin slides are defined
          let catPromise = categoriesPromise || cachedFetch(API_ENDPOINTS.GET_CATEGORIES)
          categoriesPromise = null
          const catData = await catPromise
          if (isMounted && catData?.success && Array.isArray(catData.data) && catData.data.length > 0) {
            const fallbackSlides = catData.data.map(cat => {
              const strSlug = getCategorySlugStr(cat)
              return {
                title: formatCategoryName(strSlug),
                subtitle: getCategoryType(strSlug),
                slug: strSlug,
                image: '',
                id: strSlug
              }
            })
            setCategories(fallbackSlides)
            try {
              localStorage.setItem('seemee_category_slides', JSON.stringify(fallbackSlides))
            } catch (e) {
              console.error('Error caching category slides:', e)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching categories in Hero:', err)
      }

      try {
        let prodPromise = productsPromise
        if (prodPromise) {
          productsPromise = null // Consume module eager promise
        } else {
          prodPromise = cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=1000`)
        }

        const prodData = await prodPromise
        if (isMounted && prodData && prodData.success && prodData.data) {
          const products = prodData.data
          const imageMap = {}
          const allProductImgs = []

          products.forEach(p => {
            const img = (p.images && p.images[0]) || p.image
            if (img && p.isActive !== false) {
              allProductImgs.push(img)
              if (p.category) {
                const rawKey = p.category.toLowerCase().trim()
                const normKey = normalizeCategoryKey(p.category)
                if (!imageMap[rawKey]) imageMap[rawKey] = img
                if (!imageMap[normKey]) imageMap[normKey] = img
              }
            }
          })

          // Also pull from SiteSettings categorySlides if available
          try {
            const settingsData = await cachedFetch(API_ENDPOINTS.SITE_SETTINGS)
            if (settingsData && settingsData.success && Array.isArray(settingsData.data?.categorySlides)) {
              settingsData.data.categorySlides.filter(Boolean).forEach(slide => {
                if (slide?.image) {
                  const rawSlug = (slide.slug || slide.title || '').toLowerCase().trim()
                  const normSlug = normalizeCategoryKey(slide.slug || slide.title)
                  if (rawSlug && !imageMap[rawSlug]) imageMap[rawSlug] = slide.image
                  if (normSlug && !imageMap[normSlug]) imageMap[normSlug] = slide.image
                  allProductImgs.push(slide.image)
                }
              })
            }
          } catch (e) {
            console.error('Error fetching site settings for category images:', e)
          }

          imageMap._allImages = allProductImgs
          setCategoryImages(imageMap)
          try {
            localStorage.setItem('seemee_category_images', JSON.stringify(imageMap))
          } catch (e) {
            console.error('Error caching category images:', e)
          }
        }
      } catch (err) {
        console.error('Error fetching category images:', err)
      }
    }

    fetchCategoriesAndProducts()

    return () => {
      isMounted = false
    }
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
        const currentAud = (activeAudience || 'all').toLowerCase().trim()
        const [data, prodData] = await Promise.all([
          cachedFetch(API_ENDPOINTS.CAROUSEL, { ttlMs: 300000 }).catch(() => null),
          cachedFetch(API_ENDPOINTS.PRODUCTS, { ttlMs: 300000 }).catch(() => null)
        ])

        const EDITORIAL_DESCRIPTIONS = [
          'Tailored for the modern ensemble, this collection merges casual ease with luxury aesthetics, showcasing handloom cotton and minimal gold detailing for a timeless elegance.',
          'Crafted with ancestral wisdom, our luxury designs tell stories of slow fashion, using pure silk, tilla-gold embroidery and regal velvet that celebrate royal heritage.',
          'Celebrate your grand milestones with our signature shararas, suits, and jackets, embellished with intricate hand embroidery.',
          'Every thread holds a centuries-old story of craftsmanship, intricately interlaced with pure gold zari and raw mulberry silk.',
          'Designed to drape like liquid gold, this collection features deep gemstone colors paired with traditional dabka hand-embroidery.'
        ]

        const backendSlides = data && data.success && Array.isArray(data.data)
          ? data.data
            .filter((slide) => slide && (slide.isActive !== false && slide.active !== false) && slide.image)
            .map((slide, index) => ({
              image: slide.image,
              title: slide.title || slide.productName || 'SeeMee Atelier Collection',
              subtitle: slide.subtitle || 'Premium Edit',
              targetAudience: slide.targetAudience || slide.gender || 'all',
              description: slide.description || EDITORIAL_DESCRIPTIONS[index % EDITORIAL_DESCRIPTIONS.length],
              category: (slide.productCategory || 'Featured').toString(),
              productId: slide.productId || null
            }))
          : []

        let nextSlides = []

        // 1. Strict filter for slides configured in Admin Panel matching target audience ('all', 'men', or 'women')
        const strictCarousel = backendSlides.filter(s => {
          const auds = getAudienceArray(s.targetAudience)
          return auds.includes(currentAud)
        })

        if (strictCarousel.length > 0) {
          nextSlides = strictCarousel
        } else if (currentAud === 'all') {
          nextSlides = backendSlides
        } else {
          // 2. Check for slides marked 'all' or 'unisex'
          const fallbackCarousel = backendSlides.filter(s => {
            const auds = getAudienceArray(s.targetAudience)
            return auds.includes('all') || auds.includes('unisex')
          })
          if (fallbackCarousel.length > 0) {
            nextSlides = fallbackCarousel
          }
        }

        // 3. Fallback to active products for currentAudience if no matching carousel slides exist
        if (nextSlides.length === 0 && prodData && prodData.success && Array.isArray(prodData.data)) {
          const activeProds = prodData.data.filter(p => p && p.isActive !== false && (p.image || p.images?.[0]))
          const audienceProds = currentAud !== 'all'
            ? activeProds.filter(p => belongsToAudience(p, currentAud))
            : activeProds
          const finalProds = audienceProds.length > 0 ? audienceProds : activeProds

          nextSlides = finalProds.slice(0, 5).map((p, index) => ({
            image: (p.images && p.images[0]) || p.image,
            title: p.name || 'SeeMee Haute Couture',
            subtitle: p.category ? `Premium Edit • ${p.category}` : 'Premium Edit',
            targetAudience: currentAud,
            description: p.description && p.description.length > 20
              ? p.description.replace(/<[^>]*>/g, '').slice(0, 160)
              : EDITORIAL_DESCRIPTIONS[index % EDITORIAL_DESCRIPTIONS.length],
            category: p.category || 'Featured',
            productId: p._id || p.id
          }))
        }

        if (isMounted) {
          setRawSlides(nextSlides)
          setActiveIndex(0)
          setLoading(false)
          try {
            localStorage.setItem('seemee_carousel_slides', JSON.stringify(nextSlides))
          } catch (e) {
            console.error('Error caching carousel slides:', e)
          }
        }
      } catch (error) {
        console.error('Error fetching carousel:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCarouselImages()

    return () => {
      isMounted = false
    }
  }, [activeAudience])

  useEffect(() => {
    if (slides.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 12000)

    return () => clearInterval(interval)
  }, [slides.length])

  const defaultFallbackSlide = {
    title: 'Dressing is nothing but a Choice',
    subtitle: 'Handcrafted Atelier',
    description: 'Heritage creations blending traditional weaves with contemporary grace.',
    image: 'https://res.cloudinary.com/dnuucbhwa/image/upload/v1779637240/seemee/categories/hws0gj5ey5hwxrbamgfu.png',
    slug: 'all'
  }

  const currentSlide = slides[activeIndex] || slides[0] || defaultFallbackSlide
  const nextSlideIndex = slides.length > 0 ? (activeIndex + 1) % slides.length : 0
  const nextSlide = slides[nextSlideIndex] || slides[0] || defaultFallbackSlide

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
  const stableTitle = currentSlide?.title || 'Dressing is nothing but a Choice'
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
    if (currentSlide?.productId) {
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
                {currentSlide?.subtitle || 'Handcrafted Atelier'}
                {currentSlide?.description && (
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
                  key={currentSlide?.image || 'hero-img'}
                  className="capsule-image-wrap"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <img
                    src={getOptimizedImageUrl(currentSlide?.image, isMobile ? 'mobile-hero' : 'hero')}
                    alt={currentSlide?.title || 'SeeMee Luxury'}
                    className="capsule-image"
                    loading="eager"
                    fetchpriority="high"
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
                  key={nextSlide?.image || 'next-hero-img'}
                  className="secondary-capsule-image-wrap"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <img
                    src={getOptimizedImageUrl(nextSlide?.image, 'card')}
                    alt="Next Sneak Peek"
                    className="secondary-capsule-image"
                    loading="lazy"
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
                  key={`${slide?.title || 'slide'}-${index}`}
                  type="button"
                  className={`hero-thumbnail-btn ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className="thumbnail-img-wrap">
                    <img
                      src={getOptimizedImageUrl(slide?.image, 'thumbnail')}
                      alt={slide?.title || 'Slide Preview'}
                      loading="lazy"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

export default Hero
