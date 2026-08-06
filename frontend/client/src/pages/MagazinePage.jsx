import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import './MagazinePage.css'

const fallbackStories = [
  {
    _id: 'story1',
    title: 'Silk and the River City',
    subtitle: 'The Banaras Loom as a Living Chronicle',
    description: 'The Banarasi loom turns repetition into ritual. Every shuttle movement carries a tempo that has outlived trends, and every finished textile becomes a reminder that cloth can contain geography, labor, and inheritance at once. This chapter follows the loom room from daylight to dusk, moving past dye vats, thread books, and folded lengths of silk waiting for their last inspection.',
    image: '',
    category: 'Craftsmanship',
    author: 'Julian Thorne',
    quote: 'A woven fabric can be read the way a city is read: slowly, by layers.',
    readTime: '7 MIN READ',
    date: 'MAY 2026',
    chapter: 'CHAPTER 01',
    sections: [
      'The first paragraph introduces the loom room and the steady rhythm that shapes the cloth before it even leaves the frame.',
      'The second section studies the pattern books, where traditional references are reworked into a modern sequence of color and texture.',
      'The final section follows the garment into the wardrobe, where the textile becomes part of a contemporary silhouette.'
    ],
    highlights: ['Banarasi pattern books', 'Textile density and drape', 'Heritage weave reinterpreted for today'],
    marginalia: 'Reading cue: Notice how the story moves from architecture to intimacy, as if the weave were drawing a floor plan.'
  },
  {
    _id: 'story2',
    title: 'The Banarasi Weaving Legacy',
    subtitle: 'A Symphony of Gold and Pure Silk Threads',
    description: 'From the looms of Varanasi to the modern wardrobe. Discover how we preserve the intricate patterns of traditional Banarasi silk while adapting them for the contemporary woman. A celebration of texture, heritage, and the dedicated hands that guide every metallic thread through the loom to form legendary motifs.',
    image: '',
    category: 'Heritage',
    author: 'Elena Rossi',
    quote: 'We do not just weave silk; we weave the stories of generations.',
    readTime: '8 MIN READ',
    date: 'APRIL 2026',
    chapter: 'CHAPTER 02',
    sections: [
      'The opening spread traces the first sketch, where the motif is scaled, softened, and translated into thread.',
      'The middle pages move through the handwork itself, where gold tones are layered, pressed, and secured by eye.',
      'The closing note records the finishing stage, when the garment is inspected, stored, and prepared like an archive piece.'
    ],
    highlights: ['Intricate floral patterns', 'Pure mulberry silk threads', 'Traditional metallic borders'],
    marginalia: 'Library note: This story reads like a conservator\'s log, preserving process as carefully as the garment itself.'
  },
  {
    _id: 'story3',
    title: 'Atelier of Grandeur',
    subtitle: 'Step Inside the World of Precision Tailoring',
    description: 'Step inside the SEEMEE design studio where royal grandeur meets modern ease. Every cut is measured with spatial precision, every embroidery pattern is placed to silhouette the form, and every seam is hand-finished. We balance ancestral skills with contemporary tailoring, ensuring every single dress carries the human soul inside.',
    image: '',
    category: 'Atelier',
    author: 'Aria Varma',
    quote: 'The best craftsmanship never shouts. It is felt in the weight and drape of the fabric.',
    readTime: '6 MIN READ',
    date: 'MARCH 2026',
    chapter: 'CHAPTER 03',
    sections: [
      'The opening spread explains the silhouette, showing how a classic frame is widened, refined, and made easier to wear.',
      'The middle section focuses on surface treatment, where embroidery and seams are placed to guide the eye rather than overwhelm it.',
      'The closing note speaks to wearability, reminding the reader that beauty must still live in the body that carries it.'
    ],
    highlights: ['Comfort-led bespoke tailoring', 'Hand-guided embroidery', 'Architectural pattern-cutting'],
    marginalia: 'Workshop note: The pattern reads like a diagram, but the garment reads like a gesture.'
  },
  {
    _id: 'story4',
    title: 'The Architecture of the Loom',
    subtitle: 'Where Handloom Mechanics Meet Artistic Vision',
    description: 'A study of the mechanical elegance of hand-operated looms. The warp holds the tension of history while the weft introduces the variable paths of human touch. Here, we analyze how jacquard cards translate complex botanical drawings into textile relief, showing that the loom is both a machine and an extension of the weaver\'s imagination.',
    image: '',
    category: 'Mechanics',
    author: 'Kavya Singh',
    quote: 'Every thread is a choice, and every pick is a second in the weaver\'s day.',
    readTime: '7 MIN READ',
    date: 'FEBRUARY 2026',
    chapter: 'CHAPTER 04',
    sections: [
      'The first passage explains warp preparation, where hundreds of silk threads are combed and aligned.',
      'The second section details the weft insertions and the rhythmic click-clack of the shuttle in motion.',
      'The final spread shows how the pattern emerges, row by row, as a physical archive of patience.'
    ],
    highlights: ['Hand-crafted wooden frames', 'Botanical card systems', 'Precision warp alignment'],
    marginalia: 'Studio note: The physical setup of the warp takes three weeks, before a single inch of silk is woven.'
  },
  {
    _id: 'story5',
    title: 'The Weight of Velvet',
    subtitle: 'Nocturnal Elegance and the Draped Silhouette',
    description: 'As the sun sets, the richness of royal velvet takes center stage. Our nocturnal collection features deep emeralds and midnight tones, hand-embroidered with tilla work that captures the moon\'s reflection. Here, we explore the physical weight and drape of velvet, showing how it falls in heavy, majestic drapes while remaining incredibly soft and fluid.',
    image: '',
    category: 'Nocturnal',
    author: 'Mira Kapoor',
    quote: 'Velvet absorbs light and holds shadow, creating a deep dimension that silk cannot match.',
    readTime: '5 MIN READ',
    date: 'JANUARY 2026',
    chapter: 'CHAPTER 05',
    sections: [
      'The opening note describes the pile of velvet, explaining how it feels against the skin.',
      'The second passage details the hand-applied tilla embroidery, where silver threads are locked into the velvet fabric.',
      'The final page reads like an invitation to slow luxury, celebrating velvet\'s timeless, majestic presence.'
    ],
    highlights: ['Deep jewel tones', 'Hand-stitched silver tilla', 'Nocturnal design aesthetic'],
    marginalia: 'Archive note: A well-made garment should be readable years later, not just memorable on the day it is worn.'
  }
]

const normalizeStory = (rawStory, index = 0) => {
  const story = rawStory || {}
  const fallback = fallbackStories[index % fallbackStories.length]

  return {
    ...fallback,
    ...story,
    _id: story._id || fallback._id || `story-${index}`,
    title: (typeof story.title === 'string' && story.title.trim()) ? story.title : fallback.title,
    subtitle: (typeof story.subtitle === 'string' && story.subtitle.trim()) ? story.subtitle : fallback.subtitle,
    description: (typeof story.description === 'string' && story.description.trim()) ? story.description : fallback.description,
    image: (story.image !== undefined && story.image !== null) ? story.image : (fallback.image || ''),
    category: (typeof story.category === 'string' && story.category.trim()) ? story.category : fallback.category,
    author: (typeof story.author === 'string' && story.author.trim()) ? story.author : fallback.author,
    quote: (typeof story.quote === 'string' && story.quote.trim()) ? story.quote : fallback.quote,
    readTime: (typeof story.readTime === 'string' && story.readTime.trim()) ? story.readTime : fallback.readTime,
    date: (typeof story.date === 'string' && story.date.trim()) ? story.date : fallback.date,
    chapter: (typeof story.chapter === 'string' && story.chapter.trim()) ? story.chapter : fallback.chapter,
    sections: Array.isArray(story.sections) && story.sections.length > 0 ? story.sections : fallback.sections,
    highlights: Array.isArray(story.highlights) && story.highlights.length > 0 ? story.highlights : fallback.highlights,
    marginalia: story.marginalia || fallback.marginalia
  }
}

const MOTE_COUNT = 15
const ambientMotes = Array.from({ length: MOTE_COUNT }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 4 + 2,
  delay: Math.random() * -15,
  duration: Math.random() * 10 + 15,
}))

const MagazinePage = () => {
  const navigate = useNavigate()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Booklet state variables
  const [bookState, setBookState] = useState('closed') // 'closed' | 'open'
  const [activeIdx, setActiveIdx] = useState(0)
  const [previousIdx, setPreviousIdx] = useState(0)
  const [mobilePageSide, setMobilePageSide] = useState('left')
  const [previousSide, setPreviousSide] = useState('left')
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState('next')
  const [showTOC, setShowTOC] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  const isManualTurningRef = useRef(false)
  const lastFlipTimeRef = useRef(0)
  const FLIP_THROTTLE_MS = 950

  const fetchStories = async () => {
    try {
      setLoading(true)
      let fetched = null

      const magRes = await cachedFetch(`${API_ENDPOINTS.MAGAZINE}?_t=${Date.now()}`, { forceRefresh: true })
      if (magRes?.success && Array.isArray(magRes.data) && magRes.data.length > 0) {
        fetched = magRes.data.map((story, idx) => normalizeStory(story, idx))
      } else {
        const settingsRes = await cachedFetch(`${API_ENDPOINTS.SITE_SETTINGS}?_t=${Date.now()}`, { forceRefresh: true })
        if (settingsRes?.success && Array.isArray(settingsRes.data?.magazineStories) && settingsRes.data.magazineStories.length > 0) {
          fetched = settingsRes.data.magazineStories.map((story, idx) => normalizeStory(story, idx))
        }
      }

      if (fetched && fetched.length > 0) {
        setStories(fetched)
      } else {
        setStories(fallbackStories.map((story, idx) => normalizeStory(story, idx)))
      }
    } catch (err) {
      console.error('Error fetching magazine stories:', err)
      setStories(fallbackStories.map((story, idx) => normalizeStory(story, idx)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)

    const handleFocus = () => {
      fetchStories()
    }
    window.addEventListener('focus', handleFocus)

    fetchStories()
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Synthesize realistic paper rustling sound using Web Audio API
  const playPageTurnSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      
      const bufferSize = ctx.sampleRate * 0.45
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        b6 = white * 0.115926
        data[i] = pink * 0.07
      }
      
      const source = ctx.createBufferSource()
      source.buffer = buffer
      
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 0.4
      
      const gain = ctx.createGain()
      
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42)
      
      filter.frequency.setValueAtTime(900, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.4)
      
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      source.start()
      setTimeout(() => ctx.close(), 600)
    } catch (err) {
      console.warn('Audio Context restricted:', err)
    }
  }

  // Handle manual next turn strictly in-place (Absolutely zero screen scrolling!)
  const handleNext = () => {
    if (isFlipping) return
    
    isManualTurningRef.current = true
    setIsFlipping(true)
    playPageTurnSound()
    setPreviousIdx(activeIdx)
    setPreviousSide(mobilePageSide)
    
    if (bookState === 'closed') {
      setBookState('open')
      setActiveIdx(0)
      setFlipDirection('open')
      setTimeout(() => {
        setIsFlipping(false)
        isManualTurningRef.current = false
      }, 750)
    } else {
      if (isMobile) {
        if (mobilePageSide === 'left') {
          setMobilePageSide('right')
          setFlipDirection('next')
          setTimeout(() => {
            setIsFlipping(false)
            isManualTurningRef.current = false
          }, 500)
        } else {
          const nextIdx = Math.min(activeIdx + 1, stories.length)
          setActiveIdx(nextIdx)
          setMobilePageSide('left')
          setFlipDirection('next')
          setTimeout(() => {
            setIsFlipping(false)
            isManualTurningRef.current = false
          }, 500)
        }
      } else {
        const nextIdx = Math.min(activeIdx + 1, stories.length)
        setFlipDirection('next')
        setActiveIdx(nextIdx)
        setTimeout(() => {
          setIsFlipping(false)
          isManualTurningRef.current = false
        }, 750)
      }
    }
  }

  // Handle manual prev turn strictly in-place (Absolutely zero screen scrolling!)
  const handlePrev = () => {
    if (isFlipping) return
    
    isManualTurningRef.current = true
    setIsFlipping(true)
    playPageTurnSound()
    setPreviousIdx(activeIdx)
    setPreviousSide(mobilePageSide)
    
    if (activeIdx === 0 && bookState === 'open' && (!isMobile || mobilePageSide === 'left')) {
      setBookState('closed')
      setFlipDirection('close')
      setTimeout(() => {
        setIsFlipping(false)
        isManualTurningRef.current = false
      }, 750)
    } else if (bookState === 'open') {
      if (isMobile) {
        if (mobilePageSide === 'right') {
          setMobilePageSide('left')
          setFlipDirection('prev')
          setTimeout(() => {
            setIsFlipping(false)
            isManualTurningRef.current = false
          }, 500)
        } else {
          const prevIdx = Math.max(activeIdx - 1, 0)
          setActiveIdx(prevIdx)
          setMobilePageSide('right')
          setFlipDirection('prev')
          setTimeout(() => {
            setIsFlipping(false)
            isManualTurningRef.current = false
          }, 500)
        }
      } else {
        const prevIdx = Math.max(activeIdx - 1, 0)
        setFlipDirection('prev')
        setActiveIdx(prevIdx)
        setTimeout(() => {
          setIsFlipping(false)
          isManualTurningRef.current = false
        }, 750)
      }
    }
  }

  // Handle TOC jump strictly in-place (Absolutely zero screen scrolling!)
  const handleTOCJump = (idx) => {
    if (isFlipping) return
    
    isManualTurningRef.current = true
    setPreviousIdx(activeIdx)
    setPreviousSide(mobilePageSide)

    setFlipDirection(bookState === 'closed' ? 'open' : (idx > activeIdx ? 'next' : 'prev'))
    setIsFlipping(true)
    playPageTurnSound()
    setShowTOC(false)
    
    setBookState('open')
    setActiveIdx(idx)
    setMobilePageSide('left')

    setTimeout(() => {
      setIsFlipping(false)
      isManualTurningRef.current = false
    }, 750)
  }

  // Capture wheel/scroll events on window and map them directly to manual page turns or natural scrolling
  useEffect(() => {
    if (loading || stories.length === 0) return

    const handleWheel = (e) => {
      const now = Date.now()
      const isScrolled = window.scrollY > 5

      // 1. If we are already scrolled down, let standard scrolling work naturally
      if (isScrolled) return

      // 2. If the user is scrolling DOWN
      if (e.deltaY > 10) {
        const isAtLastPage = isMobile 
          ? (activeIdx === stories.length && bookState === 'open' && mobilePageSide === 'right')
          : (activeIdx === stories.length && bookState === 'open')

        if (!isAtLastPage) {
          e.preventDefault()
          if (now - lastFlipTimeRef.current >= FLIP_THROTTLE_MS) {
            lastFlipTimeRef.current = now
            handleNext()
          }
        }
      } 
      // 3. If the user is scrolling UP
      else if (e.deltaY < -10) {
        if (bookState === 'open') {
          e.preventDefault()
          if (now - lastFlipTimeRef.current >= FLIP_THROTTLE_MS) {
            lastFlipTimeRef.current = now
            handlePrev()
          }
        }
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [loading, stories, bookState, activeIdx, mobilePageSide, isFlipping, isMobile])

  // Capture swipe touch gestures on mobile and map them to manual page turns or natural scrolling
  useEffect(() => {
    if (loading || stories.length === 0) return

    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e) => {
      const isScrolled = window.scrollY > 5
      if (isScrolled) return

      const touchY = e.touches[0].clientY
      const diffY = touchY - touchStartY

      if (diffY < -10) { // Swiping up to scroll down
        const isAtLastPage = activeIdx === stories.length && bookState === 'open' && mobilePageSide === 'right'
        if (!isAtLastPage) {
          if (e.cancelable) e.preventDefault()
        }
      } else if (diffY > 10 && bookState === 'open') { // Swiping down to scroll up
        if (e.cancelable) e.preventDefault()
      }
    }

    const handleTouchEnd = (e) => {
      const isScrolled = window.scrollY > 5
      if (isScrolled) return

      const diffX = e.changedTouches[0].clientX - touchStartX
      const diffY = e.changedTouches[0].clientY - touchStartY
      
      const now = Date.now()
      if (now - lastFlipTimeRef.current < FLIP_THROTTLE_MS) return

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 40) {
          lastFlipTimeRef.current = now
          if (diffX < 0) {
            handleNext()
          } else {
            handlePrev()
          }
        }
      } else {
        if (Math.abs(diffY) > 40) {
          const isAtLastPage = activeIdx === stories.length && bookState === 'open' && mobilePageSide === 'right'
          
          if (diffY < 0) {
            if (!isAtLastPage) {
              lastFlipTimeRef.current = now
              handleNext()
            }
          } else {
            if (bookState === 'open') {
              lastFlipTimeRef.current = now
              handlePrev()
            }
          }
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [loading, stories, bookState, activeIdx, mobilePageSide, isFlipping, isMobile])

  if (loading) {
    return (
      <div className="magazine-page-loading">
        <div className="spinner-orbit">
          <div className="orbit-dot"></div>
          <div className="orbit-text">SM</div>
        </div>
        <p className="loading-tagline">Preparing the Journal Archive...</p>
      </div>
    )
  }

  const renderLeftPageContent = (story, idx) => {
    if (idx === stories.length) {
      return (
        <div className="book-page left-page newsletter-left-page">
          <div className="paper-grain-overlay"></div>
          <div className="page-header">
            <span className="page-chapter">EPILOGUE</span>
            <span className="header-dot">✦</span>
            <span className="page-category">THE RITUAL</span>
          </div>
          
          {stories[0]?.image ? (
            <div className="tipped-photo-frame">
              <div className="photo-matting">
                <img
                  src={getOptimizedImageUrl(stories[0].image, 'large')}
                  alt="Seemee Couture Correspondence"
                  className="photo-asset"
                />
                <div className="photo-plate-tint"></div>
              </div>
              <div className="photo-caption-tag">PLATE NO. 06 // THE CREED</div>
            </div>
          ) : null}
          
          <div className="curated-quote-block">
            <span className="quote-serif-mark">“</span>
            <p className="quote-text">We believe in clothes that contain geography, labor, and inheritance at once.</p>
            <cite className="quote-author">— SEEMEE COUTURE</cite>
          </div>
          
          <div className="page-footer">
            <span className="page-num-serif">I // XI</span>
          </div>
        </div>
      )
    }
    if (!story) return null
    return (
      <div className="book-page left-page">
        <div className="paper-grain-overlay"></div>
        <div className="page-header">
          <span className="page-chapter">{story.chapter}</span>
          <span className="header-dot">✦</span>
          <span className="page-category">{story.category}</span>
        </div>
        
        {story.image ? (
          <div className="tipped-photo-frame">
            <div className="photo-matting">
              <img
                src={getOptimizedImageUrl(story.image, 'large')}
                alt={story.title}
                className="photo-asset"
              />
              <div className="photo-plate-tint"></div>
            </div>
            <div className="photo-caption-tag">PLATE NO. 0{idx + 1} // STUDIO REF</div>
          </div>
        ) : (
          <div className="no-photo-plate">
            <span className="monogram-symbol">✦ SM ✦</span>
            <p className="monogram-label">{story.chapter} // ATELIER ARCHIVE</p>
          </div>
        )}
        
        {story.quote && !isMobile && (
          <div className="curated-quote-block">
            <span className="quote-serif-mark">“</span>
            <p className="quote-text">{story.quote}</p>
            <cite className="quote-author">— {story.author}</cite>
          </div>
        )}
        
        <div className="page-footer">
          <span className="page-num-serif">I // {String(idx * 2 + 1).padStart(2, '0')}</span>
        </div>
      </div>
    )
  }

  const renderRightPageContent = (story, idx) => {
    if (idx === stories.length) {
      return (
        <div className="book-page right-page newsletter-right-page">
          <div className="paper-grain-overlay"></div>
          <div className="page-header">
            <span className="page-date">EST. 2024</span>
            <span className="header-dot">✦</span>
            <span className="page-author">SEEMEE MONOGRAPHS</span>
          </div>
          
          <div className="editorial-title-cluster" style={{ marginBottom: '10px' }}>
            <h2 className="editorial-gold-title">THE SEEMEE CORRESPONDENCE</h2>
            <h3 className="editorial-italic-subtitle">We publish slowly, with intent.</h3>
            <div className="hand-drawn-accent-bar"></div>
          </div>
          
          <div className="editorial-narrative" style={{ marginBottom: '15px' }}>
            <p className="narrative-paragraph" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
              Subscribe to receive our seasonal letters, designer monographs, and early access to curated collections. Every letter is a choicest leaf from our atelier's daily journal.
            </p>
          </div>
          
          <div className="newsletter-submission-box" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            margin: '15px 0',
            width: '100%'
          }}>
            <input 
              type="email" 
              placeholder="ENTER YOUR EMAIL FOR THE ARCHIVES" 
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#faf9f5',
                border: '1px solid rgba(78, 70, 61, 0.15)',
                borderRadius: '4px',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                color: 'var(--j-ink)',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
            <button className="btn-subscribe" style={{
              width: '100%',
              padding: '12px',
              background: 'var(--j-ink)',
              color: '#faf9f5',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              JOIN THE RITUAL
            </button>
          </div>
          
          <div className="newsletter-legal" style={{ 
            fontSize: '0.52rem', 
            letterSpacing: '0.15em', 
            color: 'var(--j-charcoal)', 
            opacity: 0.6,
            textAlign: 'center',
            marginTop: '10px'
          }}>
            © 2026 SEEMEE COUTURE. ALL LOGS PRESERVED.
          </div>
          
          <div className="page-footer">
            <span className="page-num-serif">II // XII</span>
          </div>
        </div>
      )
    }
    if (!story) return null
    return (
      <div className="book-page right-page">
        <div className="paper-grain-overlay"></div>
        <div className="page-header">
          <span className="page-date">{story.date}</span>
          <span className="header-dot">✦</span>
          <span className="page-author">BY {story.author}</span>
        </div>
        
        <div className="editorial-title-cluster">
          <h2 className="editorial-gold-title">{story.title}</h2>
          <h3 className="editorial-italic-subtitle">{story.subtitle}</h3>
          <div className="hand-drawn-accent-bar"></div>
        </div>
        
        <div className="editorial-narrative">
          <p className="narrative-paragraph">
            <span className="vintage-drop-cap">{story.description.charAt(0)}</span>
            {story.description.slice(1)}
          </p>
        </div>
        
        {story.highlights && !isMobile && (
          <div className="atelier-metadata-box">
            <h4 className="meta-box-title">ATELIER LOGS</h4>
            <div className="meta-box-list">
              {story.highlights.map((highlight, hIdx) => (
                <div key={hIdx} className="meta-bullet-item">
                  <span className="meta-bullet">✦</span>
                  <span className="meta-text">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="page-footer">
          <span className="page-num-serif">II // {String(idx * 2 + 2).padStart(2, '0')}</span>
        </div>
      </div>
    )
  }

  const current = stories[activeIdx]

  // Helper for mobile progress indicator
  const getMobileIndicatorText = () => {
    if (bookState === 'closed') return 'COVER'
    if (activeIdx === stories.length) return `EPILOGUE // ${mobilePageSide === 'left' ? 'P.1' : 'P.2'}`
    return `CH. 0${activeIdx + 1} // ${mobilePageSide === 'left' ? 'P.1' : 'P.2'}`
  }

  const isScrollUnlocked = activeIdx === stories.length && bookState === 'open' && (!isMobile || mobilePageSide === 'right')

  return (
    <div 
      className="magazine-page-wrapper" 
      style={{ 
        height: isScrollUnlocked ? 'auto' : '100dvh', 
        minHeight: '100dvh',
        overflowY: isScrollUnlocked ? 'auto' : 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Elegant Back Navigation */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>
      <div className="ambient-spotlight"></div>
      <div className="atmospheric-grid"></div>
      
      <div className="ambient-particles">
        {ambientMotes.map((mote) => (
          <span
            key={mote.id}
            className="particle-mote"
            style={{
              left: mote.left,
              width: mote.size,
              height: mote.size,
              animationDelay: `${mote.delay}s`,
              animationDuration: `${mote.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Brand header overlay absolute positioned beautifully in the background */}
      <header className="brand-overlay-header" style={{ position: 'absolute', top: isMobile ? '70px' : '95px', padding: '0 4.5vw', zIndex: 10, pointerEvents: 'none' }}>
        <div className="brand-crest">SM</div>
        <div className="brand-masthead">SEEMEE JOURNAL</div>
        <div className="brand-edition">VOL. IV // EST. 2024</div>
      </header>

      {/* ─── BOOK STAGE CONTAINER ─── */}
      <div 
        className="magazine-scroll-container" 
        style={{ 
          minHeight: isScrollUnlocked ? 'calc(100vh - 100px)' : '100vh',
          height: isScrollUnlocked ? 'auto' : '100vh',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'relative', 
          width: '100%', 
          paddingTop: isMobile ? '55px' : '110px',
          boxSizing: 'border-box'
        }}
      >
        
        {/* Main Booklet Stage */}
        <div className="magazine-immersive-stage" style={{ padding: 0, margin: 0, height: 'auto', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'visible' }}>
          <div className="booklet-perspective-frame" style={{ height: 'auto', overflow: 'visible' }}>
            <div className={`book-hardcase-shell ${bookState} ${isMobile ? 'mobile-shell' : ''}`} style={{ overflow: 'visible' }}>
              <div className="shell-shadow"></div>
              
              {/* STATIC CLOSED COVER */}
              {bookState === 'closed' && (
                <div className="closed-cover-stage" onClick={handleNext}>
                  <div className="hardcover-leather"></div>
                  <div className="hardcover-gold-border"></div>
                  <div className="hardcover-content">
                    <div className="crest-seal">
                      <span className="seal-monogram">SM</span>
                    </div>
                    <h1 className="cover-journal-title">SEEMEE</h1>
                    <h2 className="cover-journal-subtitle">J O U R N A L</h2>
                    <div className="gold-foil-line"></div>
                    <div className="cover-volume-tag">{stories[0]?.chapter || 'VOLUME IV'} // {stories[0]?.title || 'SPRING 2026'}</div>
                    <p className="cover-read-prompt" style={{ border: '1px solid rgba(197, 168, 128, 0.4)', background: 'rgba(28,24,21,0.7)', cursor: 'pointer' }}>
                      CLICK OR SCROLL TO UNFOLD
                    </p>
                    <div className="cover-ribbon-tag"></div>
                  </div>
                </div>
              )}

              {/* SPREAD PAGES RENDERING */}
              {bookState === 'open' && (
                <div className={`book-spread-overlay ${isMobile ? 'mobile-spread' : ''} ${mobilePageSide === 'left' ? 'show-left' : 'show-right'}`} style={{ overflow: 'hidden', position: 'relative' }}>
                  {isMobile ? (
                    // ─── PURE CSS ADAPTIVE SINGLE PAGE ───
                    <>
                      {renderLeftPageContent(stories[activeIdx], activeIdx)}
                      {renderRightPageContent(stories[activeIdx], activeIdx)}
                      <div className="book-spine-crease mobile-spine"></div>
                    </>
                  ) : (
                    // ─── DESKTOP GORGEOUS 3D REAL PAGE TURN ANIMATION SPREAD ───
                    <>
                      {isFlipping && (flipDirection === 'next' || flipDirection === 'prev') ? (
                        <>
                          {flipDirection === 'next' ? (
                            <>
                              {/* Underlayer Left page: shows previous chapter left page */}
                              {renderLeftPageContent(stories[previousIdx], previousIdx)}

                              {/* Underlayer Right page: shows new chapter right page */}
                              {renderRightPageContent(stories[activeIdx], activeIdx)}

                              {/* The 3D turning sheet, pivoting from center to the left */}
                              <div className="flipping-page-3d flip-next">
                                {/* Front side of turning page: shows previous chapter right content */}
                                <div className="flipping-side side-front">
                                  {renderRightPageContent(stories[previousIdx], previousIdx)}
                                </div>
                                {/* Back side of turning page: shows new chapter left content */}
                                <div className="flipping-side side-back">
                                  {renderLeftPageContent(stories[activeIdx], activeIdx)}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Underlayer Left page: shows new chapter left page */}
                              {renderLeftPageContent(stories[activeIdx], activeIdx)}

                              {/* Underlayer Right page: shows previous chapter right page */}
                              {renderRightPageContent(stories[previousIdx], previousIdx)}

                              {/* The 3D turning sheet, pivoting from center to the right */}
                              <div className="flipping-page-3d flip-prev">
                                {/* Front side of turning page: shows previous chapter left content */}
                                <div className="flipping-side side-front">
                                  {renderLeftPageContent(stories[previousIdx], previousIdx)}
                                </div>
                                {/* Back side of turning page: shows new chapter right content */}
                                <div className="flipping-side side-back">
                                  {renderRightPageContent(stories[activeIdx], activeIdx)}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {renderLeftPageContent(stories[activeIdx], activeIdx)}
                          {renderRightPageContent(stories[activeIdx], activeIdx)}
                        </>
                      )}
                      <div className="book-spine-crease"></div>
                      <div className="book-crease-highlight"></div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* CURATED BOOKLET CONTROLS */}
          {!isMobile && (
            <div className="booklet-under-controls" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '25px',
              zIndex: 20,
              position: 'relative'
            }}>
              <button
                onClick={handlePrev}
                disabled={bookState === 'closed'}
                className="dock-arrow-btn"
                style={{
                  background: 'rgba(24, 21, 19, 0.65)',
                  border: '1px solid rgba(197, 168, 128, 0.2)',
                  color: '#fff',
                  fontSize: '1.2rem',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  opacity: bookState === 'closed' ? 0.3 : 1
                }}
              >
                ←
              </button>

              <div className="dock-progress-pills" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {Array.from({ length: stories.length + 1 }).map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleTOCJump(idx)}
                    className={`progress-pill-segment ${idx === activeIdx && bookState === 'open' ? 'active' : ''}`}
                    title={idx === stories.length ? "Epilogue" : (stories[idx]?.chapter || `Chapter 0${idx + 1}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="pill-fill-bar"></div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={activeIdx === stories.length && bookState === 'open'}
                className="dock-arrow-btn"
                style={{
                  background: 'rgba(24, 21, 19, 0.65)',
                  border: '1px solid rgba(197, 168, 128, 0.2)',
                  color: '#fff',
                  fontSize: '1.2rem',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  opacity: (activeIdx === stories.length && bookState === 'open') ? 0.3 : 1
                }}
              >
                →
              </button>
              
              <button 
                className="dock-btn toc-btn" 
                onClick={() => setShowTOC(true)} 
                title="Table of Contents" 
                style={{ 
                  padding: '8px 18px', 
                  borderRadius: '100px', 
                  border: '1px solid rgba(197, 168, 128, 0.2)',
                  background: 'rgba(24, 21, 19, 0.65)',
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📜 INDEX
              </button>
            </div>
          )}

        </div>

      </div>

      {/* MOBILE FLOATING GLASS CONTROL DOCK */}
      {isMobile && (
        <div className="mobile-glass-control-dock">
          <button 
            className="mobile-dock-arrow" 
            onClick={handlePrev} 
            disabled={bookState === 'closed'}
          >
            ←
          </button>
          
          <span className="mobile-page-indicator">
            {getMobileIndicatorText()}
          </span>

          <button 
            className="mobile-dock-btn" 
            onClick={() => setShowTOC(true)}
          >
            📜 INDEX
          </button>

          <button 
            className="mobile-dock-arrow" 
            onClick={handleNext} 
            disabled={activeIdx === stories.length && bookState === 'open' && mobilePageSide === 'right'}
          >
            →
          </button>
        </div>
      )}

      {/* TABLE OF CONTENTS SLIDE-UP DRAWER */}
      <AnimatePresence>
        {showTOC && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="toc-overlay-blur"
            onClick={() => setShowTOC(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 120 }}
              className="toc-drawer-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="toc-drawer-header">
                <h2>THE JOURNAL INDEX</h2>
                <button className="close-toc-x" onClick={() => setShowTOC(false)}>✕</button>
              </div>

              <div className="toc-chapters-grid">
                {stories.map((story, idx) => (
                  <div
                    key={story._id || `story-${idx}`}
                    className={`toc-chapter-card ${idx === activeIdx && bookState === 'open' ? 'viewing' : ''}`}
                    onClick={() => handleTOCJump(idx)}
                  >
                    <div className="toc-card-thumbnail">
                      <img src={getOptimizedImageUrl(story.image, 'thumbnail')} alt={story.title} />
                      <div className="toc-thumbnail-tint"></div>
                      <span className="toc-number-tag">{story.chapter}</span>
                    </div>
                    <div className="toc-card-info">
                      <span className="toc-card-category">{story.category}</span>
                      <h3 className="toc-card-title">{story.title}</h3>
                      <p className="toc-card-author">By {story.author} // {story.readTime}</p>
                    </div>
                  </div>
                ))}
                
                {/* Epilogue Chapter Card inside TOC */}
                <div
                  className={`toc-chapter-card ${activeIdx === stories.length && bookState === 'open' ? 'viewing' : ''}`}
                  onClick={() => handleTOCJump(stories.length)}
                >
                  <div className="toc-card-thumbnail">
                    <img src={getOptimizedImageUrl(stories[0]?.image, 'thumbnail')} alt="Correspondence" style={{ filter: 'grayscale(1) sepia(0.2)' }} />
                    <div className="toc-thumbnail-tint"></div>
                    <span className="toc-number-tag">EPILOGUE</span>
                  </div>
                  <div className="toc-card-info">
                    <span className="toc-card-category">THE RITUAL</span>
                    <h3 className="toc-card-title">THE SEEMEE CORRESPONDENCE</h3>
                    <p className="toc-card-author">Monographs & Archive Letters</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <section className="magazine-footer-newsletter" style={{ position: 'relative', width: '100%', marginTop: '80px', zIndex: 100 }}>
        <div className="newsletter-cottons-wrap">
          <div className="newsletter-creed">
            <span className="creed-bullet">✦</span>
            <h2>THE SEEMEE CORRESPONDENCE</h2>
            <p className="creed-desc">We publish slowly, with intent. Subscribe to receive our seasonal letters, designer monographs, and early access to curated collections.</p>
          </div>
          <div className="newsletter-submission">
            <input type="email" placeholder="ENTER YOUR EMAIL FOR THE ARCHIVES" />
            <button className="btn-subscribe">JOIN THE RITUAL</button>
          </div>
          <div className="newsletter-legal">
            © 2026 SEEMEE COUTURE. ALL LOGS PRESERVED. HANDMADE WITH PATIENCE.
          </div>
        </div>
      </section>
    </div>
  )
}

export default MagazinePage