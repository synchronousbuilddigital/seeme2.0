import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './MagazinePage.css'

const fallbackStories = [
  {
    _id: 'story1',
    title: 'Silk and the River City',
    subtitle: 'The Banaras Loom as a Living Chronicle',
    description: 'The Banarasi loom turns repetition into ritual. Every shuttle movement carries a tempo that has outlived trends, and every finished textile becomes a reminder that cloth can contain geography, labor, and inheritance at once. This chapter follows the loom room from daylight to dusk, moving past dye vats, thread books, and folded lengths of silk waiting for their last inspection.',
    image: '/images/magazine/silk_river_city.png',
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
    image: '/images/magazine/banarasi_weaving.png',
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
    title: 'Mastery in the Atelier',
    subtitle: 'The Silent Dedication Behind the Seams',
    description: 'Step inside the SEEMEE design studio where royal grandeur meets modern ease. Every cut is measured with spatial precision, every embroidery pattern is placed to silhouette the form, and every seam is hand-finished. We balance ancestral skills with contemporary tailoring, ensuring every single dress carries the human soul inside.',
    image: '/images/magazine/artisan_craftsmanship.png',
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
    image: '/images/magazine/banarasi_silk_loom.png',
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
    image: '/images/magazine/weight_of_velvet.png',
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

const normalizeStory = (story = {}, index = 0) => {
  const fallback = fallbackStories[index % fallbackStories.length]

  return {
    ...fallback,
    ...story,
    _id: story._id || fallback._id || `story-${index}`,
    title: (typeof story.title === 'string' && story.title.trim()) ? story.title : fallback.title,
    subtitle: (typeof story.subtitle === 'string' && story.subtitle.trim()) ? story.subtitle : fallback.subtitle,
    description: (typeof story.description === 'string' && story.description.trim()) ? story.description : fallback.description,
    image: story.image || fallback.image,
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

// Generate background dust particles programmatically
const MOTE_COUNT = 15
const ambientMotes = Array.from({ length: MOTE_COUNT }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 4 + 2,
  delay: Math.random() * -15, // Negative delay to start immediately
  duration: Math.random() * 10 + 15,
}))

const MagazinePage = () => {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  
  // 3D Booklet state variables
  const [bookState, setBookState] = useState('closed') // 'closed' | 'opening' | 'open' | 'closing'
  const isCoverOpen = bookState !== 'closed'
  const [activeIdx, setActiveIdx] = useState(0)
  const [mobilePageSide, setMobilePageSide] = useState('left') // 'left' | 'right' (single-page booklet on mobile)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState('next') // 'next' | 'prev' | 'open' | 'close'
  const [isAutoplay, setIsAutoplay] = useState(false)
  const [showTOC, setShowTOC] = useState(false)
  
  // Responsive check
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    fetchStories()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Autoplay handler
  useEffect(() => {
    let intervalId
    if (isAutoplay && isCoverOpen && !isFlipping) {
      intervalId = setInterval(() => {
        if (activeIdx < stories.length - 1) {
          handleNext()
        } else {
          // Wrap around to closed book or first chapter
          setIsAutoplay(false)
        }
      }, 8000)
    }
    return () => clearInterval(intervalId)
  }, [isAutoplay, isCoverOpen, activeIdx, isFlipping, stories])

  const fetchStories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MAGAZINE)
      const data = await response.json()

      let loadedStories = []
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Map database stories first
        const dbStories = data.data.map((story, index) => normalizeStory(story, index))
        loadedStories = [...dbStories]
        
        // Pad with fallback stories up to exactly 5
        if (loadedStories.length < 5) {
          const remainingCount = 5 - loadedStories.length
          const paddings = fallbackStories.slice(loadedStories.length, 5).map((story, index) => 
            normalizeStory(story, loadedStories.length + index)
          )
          loadedStories = [...loadedStories, ...paddings]
        }
      } else {
        loadedStories = fallbackStories.map((story, index) => normalizeStory(story, index))
      }

      setStories(loadedStories.slice(0, 5))
    } catch (error) {
      console.error('Error fetching magazine stories:', error)
      setStories(fallbackStories.slice(0, 5).map((story, index) => normalizeStory(story, index)))
    } finally {
      setLoading(false)
    }
  }

  // Synthesize realistic paper rustling sound using Web Audio API
  const playPageTurnSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      
      const bufferSize = ctx.sampleRate * 0.45 // 0.45s length
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      
      // Fill buffer with soft pink/brown-ish noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        // Pink filter approximation
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        b6 = white * 0.115926
        data[i] = pink * 0.07 // Scale volume
      }
      
      const source = ctx.createBufferSource()
      source.buffer = buffer
      
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 0.4
      
      const gain = ctx.createGain()
      
      // Volume envelope for the turn
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42)
      
      // Filter frequency sweep
      filter.frequency.setValueAtTime(900, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.4)
      
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      source.start()
      setTimeout(() => ctx.close(), 600)
    } catch (err) {
      console.warn('Audio Context restricted or unsupported:', err)
    }
  }

  const handleNext = () => {
    if (isFlipping) return

    if (isMobile) {
      if (mobilePageSide === 'left') {
        setFlipDirection('next')
        setIsFlipping(true)
        playPageTurnSound()
        setTimeout(() => {
          setMobilePageSide('right')
          setIsFlipping(false)
        }, 900)
      } else if (activeIdx < stories.length - 1) {
        setFlipDirection('next')
        setIsFlipping(true)
        playPageTurnSound()
        setTimeout(() => {
          setActiveIdx(prev => prev + 1)
          setMobilePageSide('left')
          setIsFlipping(false)
        }, 900)
      }
    } else {
      if (activeIdx < stories.length - 1) {
        setFlipDirection('next')
        setIsFlipping(true)
        playPageTurnSound()
        setTimeout(() => {
          setActiveIdx(prev => prev + 1)
          setIsFlipping(false)
        }, 900)
      }
    }
  }

  const handlePrev = () => {
    if (isFlipping) return

    if (isMobile) {
      if (mobilePageSide === 'right') {
        setFlipDirection('prev')
        setIsFlipping(true)
        playPageTurnSound()
        setTimeout(() => {
          setMobilePageSide('left')
          setIsFlipping(false)
        }, 900)
      } else if (activeIdx > 0) {
        setFlipDirection('prev')
        setIsFlipping(true)
        playPageTurnSound()
        setTimeout(() => {
          setActiveIdx(prev => prev - 1)
          setMobilePageSide('right')
          setIsFlipping(false)
        }, 900)
      }
    } else {
      if (activeIdx > 0) {
        setFlipDirection('prev')
        setIsFlipping(true)
        playPageTurnSound()
        setTimeout(() => {
          setActiveIdx(prev => prev - 1)
          setIsFlipping(false)
        }, 900)
      }
    }
  }

  const handleOpenBook = () => {
    if (isFlipping) return
    setIsFlipping(true)
    setFlipDirection('open')
    setBookState('opening')
    setMobilePageSide('left')
    playPageTurnSound()
    setTimeout(() => {
      setBookState('open')
      setIsFlipping(false)
    }, 1200)
  }

  const handleCloseBook = () => {
    if (isFlipping) return
    setIsFlipping(true)
    setFlipDirection('close')
    setBookState('closing')
    setIsAutoplay(false)
    playPageTurnSound()
    setTimeout(() => {
      setBookState('closed')
      setIsFlipping(false)
      setActiveIdx(0)
      setMobilePageSide('left')
    }, 1200)
  }

  const handleTOCJump = (idx) => {
    if (idx === activeIdx || isFlipping) return
    setFlipDirection(idx > activeIdx ? 'next' : 'prev')
    setIsFlipping(true)
    playPageTurnSound()
    setShowTOC(false)
    setTimeout(() => {
      setActiveIdx(idx)
      setMobilePageSide('left')
      setIsFlipping(false)
    }, 900)
  }

  // Mobile Booklet Rendering Helpers
  const renderMobileUnderlayerPage = () => {
    if (isFlipping) {
      if (flipDirection === 'next') {
        if (mobilePageSide === 'left') {
          return renderRightPageContent(stories[activeIdx], activeIdx)
        } else {
          return renderLeftPageContent(stories[activeIdx + 1], activeIdx + 1)
        }
      } else if (flipDirection === 'prev') {
        if (mobilePageSide === 'right') {
          return renderLeftPageContent(stories[activeIdx], activeIdx)
        } else {
          return renderRightPageContent(stories[activeIdx - 1], activeIdx - 1)
        }
      }
    }
    
    return mobilePageSide === 'left'
      ? renderLeftPageContent(stories[activeIdx], activeIdx)
      : renderRightPageContent(stories[activeIdx], activeIdx)
  }

  const renderMobileFlippingPage = () => {
    if (!isFlipping) return null

    if (flipDirection === 'next') {
      const frontContent = mobilePageSide === 'left'
        ? renderLeftPageContent(stories[activeIdx], activeIdx)
        : renderRightPageContent(stories[activeIdx], activeIdx)

      const backContent = mobilePageSide === 'left'
        ? renderRightPageContent(stories[activeIdx], activeIdx)
        : renderLeftPageContent(stories[activeIdx + 1], activeIdx + 1)

      return (
        <motion.div
          className="flipping-page-container-3d mobile-flipping"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: -180 }}
          transition={{ duration: 0.9, ease: [0.645, 0.045, 0.355, 1.0] }}
          style={{ transformOrigin: "left center", transformStyle: "preserve-3d", position: "absolute", left: 0, width: "100%", height: "100%", zIndex: 50 }}
        >
          <div className="page-face front-page-face" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
            {frontContent}
            <div className="page-turn-shadow-overlay right-shadow"></div>
          </div>
          
          <div className="page-face back-page-face" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
            {backContent}
            <div className="page-turn-shadow-overlay left-shadow"></div>
          </div>
        </motion.div>
      )
    } else if (flipDirection === 'prev') {
      const frontContent = mobilePageSide === 'right'
        ? renderLeftPageContent(stories[activeIdx], activeIdx)
        : renderRightPageContent(stories[activeIdx - 1], activeIdx - 1)

      const backContent = mobilePageSide === 'right'
        ? renderRightPageContent(stories[activeIdx], activeIdx)
        : renderLeftPageContent(stories[activeIdx], activeIdx)

      return (
        <motion.div
          className="flipping-page-container-3d mobile-flipping"
          initial={{ rotateY: -180 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: 0.9, ease: [0.645, 0.045, 0.355, 1.0] }}
          style={{ transformOrigin: "left center", transformStyle: "preserve-3d", position: "absolute", left: 0, width: "100%", height: "100%", zIndex: 50 }}
        >
          <div className="page-face front-page-face" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
            {frontContent}
            <div className="page-turn-shadow-overlay right-shadow"></div>
          </div>
          
          <div className="page-face back-page-face" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
            {backContent}
            <div className="page-turn-shadow-overlay left-shadow"></div>
          </div>
        </motion.div>
      )
    }
    
    return null
  }

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

  // ─── BOOK PAGES RENDER HELPERS ───
  const renderLeftPageContent = (story, idx) => {
    return (
      <div className="book-page left-page">
        <div className="paper-grain-overlay"></div>
        <div className="page-header">
          <span className="page-chapter">{story.chapter}</span>
          <span className="header-dot">✦</span>
          <span className="page-category">{story.category}</span>
        </div>
        
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
        
        {story.quote && (
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
        
        {story.highlights && (
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

  return (
    <div className="magazine-page-wrapper">
      {/* Dynamic atmospheric ambient backdrop */}
      <div className="ambient-spotlight"></div>
      <div className="atmospheric-grid"></div>
      
      {/* Floating Dust Particle motes */}
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

      {/* Brand Header overlay */}
      <header className="brand-overlay-header">
        <div className="brand-crest">SM</div>
        <div className="brand-masthead">SEEMEE JOURNAL</div>
        <div className="brand-edition">VOL. IV // EST. 2024</div>
      </header>

      {/* ─── MAIN STAGE ─── */}
      <div className="magazine-immersive-stage">
        
        {/* RESPONSIVE 3D BOOKLET STAGE */}
        <div className="booklet-perspective-frame">
          
          {/* BOOK CASE WRAPPER */}
          <div className={`book-hardcase-shell ${bookState} ${isMobile ? 'mobile-shell' : ''}`}>
            <div className="shell-shadow"></div>
            
            {/* STATIC CLOSED COVER */}
            {bookState === 'closed' && (
              <div className="closed-cover-stage" onClick={handleOpenBook}>
                <div className="hardcover-leather"></div>
                <div className="hardcover-gold-border"></div>
                <div className="hardcover-content">
                  <div className="crest-seal">
                    <span className="seal-monogram">SM</span>
                  </div>
                  <h1 className="cover-journal-title">SEEMEE</h1>
                  <h2 className="cover-journal-subtitle">J O U R N A L</h2>
                  <div className="gold-foil-line"></div>
                  <div className="cover-volume-tag">VOLUME IV // SPRING 2026</div>
                  
                  <p className="cover-read-prompt">BEGIN THE READING RITUAL</p>
                  
                  <div className="cover-ribbon-tag"></div>
                </div>
              </div>
            )}

            {/* COVER FLIPPING OPEN TRANSITION */}
            {bookState === 'opening' && (
              <div className={`book-spread-overlay ${isMobile ? 'mobile-spread' : ''}`}>
                {isMobile ? (
                  <>
                    {/* Underlay (First story left page) */}
                    {renderLeftPageContent(stories[0], 0)}

                    {/* Flipping page (the cover itself swinging left) */}
                    <motion.div
                      className="flipping-page-container-3d mobile-cover-flipping"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: -180 }}
                      transition={{ duration: 1.2, ease: [0.645, 0.045, 0.355, 1.0] }}
                      style={{ transformOrigin: "left center", transformStyle: "preserve-3d", position: "absolute", left: 0, width: "100%", height: "100%", zIndex: 100 }}
                    >
                      {/* Front Face: The outer cover */}
                      <div className="page-face front-face-cover" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
                        <div className="closed-cover-stage inline-cover">
                          <div className="hardcover-leather"></div>
                          <div className="hardcover-gold-border"></div>
                          <div className="hardcover-content">
                            <div className="crest-seal mini">
                              <span className="seal-monogram">SM</span>
                            </div>
                            <h1 className="cover-journal-title mini">SEEMEE</h1>
                            <div className="gold-foil-line"></div>
                            <p className="reading-active-text">OPENING JOURNAL...</p>
                          </div>
                        </div>
                      </div>
                      {/* Back Face: inside cover backing */}
                      <div className="page-face back-face-cover" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                        <div className="inside-cover-backing"></div>
                      </div>
                    </motion.div>

                    <div className="book-spine-crease mobile-spine"></div>
                  </>
                ) : (
                  <>
                    {/* Underlay Left (inside book backing) */}
                    <div className="book-page left-page blank-page">
                      <div className="inside-cover-backing"></div>
                    </div>
                    {/* Underlay Right (First story left page) */}
                    {renderRightPageContent(stories[0], 0)}

                    {/* Flipping page (the cover itself swinging left) */}
                    <motion.div
                      className="flipping-page-container-3d"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: -180 }}
                      transition={{ duration: 1.2, ease: [0.645, 0.045, 0.355, 1.0] }}
                      style={{ transformOrigin: "left center", transformStyle: "preserve-3d", position: "absolute", left: "50%", width: "50%", height: "100%", zIndex: 100 }}
                    >
                      {/* Front Face: The outer cover */}
                      <div className="page-face front-face-cover" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
                        <div className="closed-cover-stage inline-cover">
                          <div className="hardcover-leather"></div>
                          <div className="hardcover-gold-border"></div>
                          <div className="hardcover-content">
                            <div className="crest-seal mini">
                              <span className="seal-monogram">SM</span>
                            </div>
                            <h1 className="cover-journal-title mini">SEEMEE</h1>
                            <div className="gold-foil-line"></div>
                            <p className="reading-active-text">OPENING JOURNAL...</p>
                          </div>
                        </div>
                      </div>
                      {/* Back Face: Inside first page (visual spread) */}
                      <div className="page-face back-face-cover" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                        {renderLeftPageContent(stories[0], 0)}
                      </div>
                    </motion.div>

                    <div className="book-spine-crease"></div>
                  </>
                )}
              </div>
            )}

            {/* COVER FLIPPING CLOSED TRANSITION */}
            {bookState === 'closing' && (
              <div className={`book-spread-overlay ${isMobile ? 'mobile-spread' : ''}`}>
                {isMobile ? (
                  <>
                    {/* Underlay (First page) */}
                    {renderLeftPageContent(stories[0], 0)}

                    {/* Flipping page (cover swinging back right) */}
                    <motion.div
                      className="flipping-page-container-3d mobile-cover-flipping"
                      initial={{ rotateY: -180 }}
                      animate={{ rotateY: 0 }}
                      transition={{ duration: 1.2, ease: [0.645, 0.045, 0.355, 1.0] }}
                      style={{ transformOrigin: "left center", transformStyle: "preserve-3d", position: "absolute", left: 0, width: "100%", height: "100%", zIndex: 100 }}
                    >
                      {/* Front Face: The outer cover */}
                      <div className="page-face front-face-cover" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
                        <div className="closed-cover-stage inline-cover">
                          <div className="hardcover-leather"></div>
                          <div className="hardcover-gold-border"></div>
                          <div className="hardcover-content">
                            <div className="crest-seal mini">
                              <span className="seal-monogram">SM</span>
                            </div>
                            <h1 className="cover-journal-title mini">SEEMEE</h1>
                            <div className="gold-foil-line"></div>
                            <p className="reading-active-text">CLOSING JOURNAL...</p>
                          </div>
                        </div>
                      </div>
                      {/* Back Face: inside cover */}
                      <div className="page-face back-face-cover" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                        <div className="inside-cover-backing"></div>
                      </div>
                    </motion.div>

                    <div className="book-spine-crease mobile-spine"></div>
                  </>
                ) : (
                  <>
                    {/* Underlay Left (blank) */}
                    <div className="book-page left-page blank-page">
                      <div className="inside-cover-backing"></div>
                    </div>
                    {/* Underlay Right (story 0 right page) */}
                    {renderRightPageContent(stories[0], 0)}

                    {/* Flipping page (cover swinging back right) */}
                    <motion.div
                      className="flipping-page-container-3d"
                      initial={{ rotateY: -180 }}
                      animate={{ rotateY: 0 }}
                      transition={{ duration: 1.2, ease: [0.645, 0.045, 0.355, 1.0] }}
                      style={{ transformOrigin: "left center", transformStyle: "preserve-3d", position: "absolute", left: "50%", width: "50%", height: "100%", zIndex: 100 }}
                    >
                      {/* Front Face: The outer cover */}
                      <div className="page-face front-face-cover" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
                        <div className="closed-cover-stage inline-cover">
                          <div className="hardcover-leather"></div>
                          <div className="hardcover-gold-border"></div>
                          <div className="hardcover-content">
                            <div className="crest-seal mini">
                              <span className="seal-monogram">SM</span>
                            </div>
                            <h1 className="cover-journal-title mini">SEEMEE</h1>
                            <div className="gold-foil-line"></div>
                            <p className="reading-active-text">CLOSING JOURNAL...</p>
                          </div>
                        </div>
                      </div>
                      {/* Back Face: Inside first page (visual spread) */}
                      <div className="page-face back-face-cover" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                        {renderLeftPageContent(stories[0], 0)}
                      </div>
                    </motion.div>

                    <div className="book-spine-crease"></div>
                  </>
                )}
              </div>
            )}

            {/* BOOK IS OPEN - RENDER SPREADS */}
            {bookState === 'open' && (
              <div className={`book-spread-overlay ${isMobile ? 'mobile-spread' : ''}`}>
                {isMobile ? (
                  <>
                    {/* STATIC UNDERLAYER PAGE (MOBILE) */}
                    {renderMobileUnderlayerPage()}

                    {/* FLIPPING PAGE TRANSITION (MOBILE) */}
                    {renderMobileFlippingPage()}

                    {/* Spine crease placed at the left edge for single page booklet */}
                    <div className="book-spine-crease mobile-spine"></div>
                  </>
                ) : (
                  <>
                    {/* LEFT PAGE (STATIC UNDERLAYER) */}
                    {isFlipping && flipDirection === 'next' 
                      ? renderLeftPageContent(stories[activeIdx], activeIdx)
                      : isFlipping && flipDirection === 'prev'
                        ? renderLeftPageContent(stories[activeIdx - 1], activeIdx - 1)
                        : renderLeftPageContent(stories[activeIdx], activeIdx)
                    }

                    {/* RIGHT PAGE (STATIC UNDERLAYER) */}
                    {isFlipping && flipDirection === 'next'
                      ? renderRightPageContent(stories[activeIdx + 1], activeIdx + 1)
                      : isFlipping && flipDirection === 'prev'
                        ? renderRightPageContent(stories[activeIdx], activeIdx)
                        : renderRightPageContent(stories[activeIdx], activeIdx)
                    }

                    {/* NEXT PAGE FLIPPING TRANSITION */}
                    {isFlipping && flipDirection === 'next' && (
                      <motion.div
                        className="flipping-page-container-3d"
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: -180 }}
                        transition={{ duration: 0.9, ease: [0.645, 0.045, 0.355, 1.0] }}
                        style={{ transformOrigin: "left center", transformStyle: "preserve-3d", position: "absolute", left: "50%", width: "50%", height: "100%", zIndex: 50 }}
                      >
                        {/* Front Face: current right page flipping away */}
                        <div className="page-face front-page-face" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
                          {renderRightPageContent(stories[activeIdx], activeIdx)}
                          <div className="page-turn-shadow-overlay right-shadow"></div>
                        </div>
                        
                        {/* Back Face: target left page coming in */}
                        <div className="page-face back-page-face" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                          {renderLeftPageContent(stories[activeIdx + 1], activeIdx + 1)}
                          <div className="page-turn-shadow-overlay left-shadow"></div>
                        </div>
                      </motion.div>
                    )}

                    {/* PREV PAGE FLIPPING TRANSITION */}
                    {isFlipping && flipDirection === 'prev' && (
                      <motion.div
                        className="flipping-page-container-3d"
                        initial={{ rotateY: -180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.9, ease: [0.645, 0.045, 0.355, 1.0] }}
                        style={{ transformOrigin: "right center", transformStyle: "preserve-3d", position: "absolute", left: "0", width: "50%", height: "100%", zIndex: 50 }}
                      >
                        {/* Front Face: target right page coming in */}
                        <div className="page-face front-page-face" style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}>
                          {renderRightPageContent(stories[activeIdx - 1], activeIdx - 1)}
                          <div className="page-turn-shadow-overlay right-shadow"></div>
                        </div>
                        
                        {/* Back Face: current left page flipping away */}
                        <div className="page-face back-page-face" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}>
                          {renderLeftPageContent(stories[activeIdx], activeIdx)}
                          <div className="page-turn-shadow-overlay left-shadow"></div>
                        </div>
                      </motion.div>
                    )}

                    {/* 3D BOOK CENTRAL SPINE CREASE */}
                    <div className="book-spine-crease"></div>
                    <div className="book-crease-highlight"></div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ─── GLASS DOCK CONTROL CENTER (ONLY DESKTOP/TABLET) ─── */}
      {bookState === 'open' && !isMobile && (
        <nav className="glass-control-dock">
          <div className="dock-left-actions">
            <button className="dock-btn close-btn" onClick={handleCloseBook} title="Close Journal and Return to Cover">
              <span className="btn-icon">📁</span>
              <span className="btn-label">Close Archive</span>
            </button>
          </div>

          <div className="dock-center-pages">
            <button
              onClick={handlePrev}
              disabled={activeIdx === 0 || isFlipping}
              className="dock-arrow-btn"
              title="Previous Chapter"
            >
              ←
            </button>
            
            <div className="dock-progress-pills">
              {stories.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => handleTOCJump(idx)}
                  className={`progress-pill-segment ${idx === activeIdx ? 'active' : ''}`}
                  title={`Chapter 0${idx + 1}`}
                >
                  <div className="pill-fill-bar"></div>
                </div>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={activeIdx === stories.length - 1 || isFlipping}
              className="dock-arrow-btn"
              title="Next Chapter"
            >
              →
            </button>
          </div>

          <div className="dock-right-actions">
            <button className="dock-btn toc-btn" onClick={() => setShowTOC(true)} title="Table of Contents">
              <span className="btn-icon">📜</span>
              <span className="btn-label">Index</span>
            </button>

            <button 
              className={`dock-btn autoplay-btn ${isAutoplay ? 'active' : ''}`} 
              onClick={() => setIsAutoplay(!isAutoplay)}
              title={isAutoplay ? "Pause Autoplay" : "Start Autoplay"}
            >
              <svg className="autoplay-ring" width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" stroke="rgba(197, 168, 128, 0.2)" strokeWidth="2" fill="none" />
                {isAutoplay && (
                  <motion.circle
                    cx="10" cy="10" r="8"
                    stroke="#c5a880" strokeWidth="2" fill="none"
                    strokeDasharray="50.26"
                    initial={{ strokeDashoffset: 50.26 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                  />
                )}
              </svg>
              <span className="btn-label">{isAutoplay ? 'Pause' : 'Autoplay'}</span>
            </button>
          </div>
        </nav>
      )}

      {/* ─── MOBILE GLASS DOCK CONTROL CENTER ─── */}
      {bookState === 'open' && isMobile && (
        <nav className="mobile-glass-control-dock">
          <button className="mobile-dock-btn" onClick={handleCloseBook} title="Close Journal">
            📁
          </button>
          
          <div className="mobile-dock-nav">
            <button
              onClick={handlePrev}
              disabled={(activeIdx === 0 && mobilePageSide === 'left') || isFlipping}
              className="mobile-dock-arrow"
            >
              ←
            </button>
            <span className="mobile-page-indicator">
              CH. {activeIdx + 1} // {mobilePageSide === 'left' ? 'I' : 'II'}
            </span>
            <button
              onClick={handleNext}
              disabled={(activeIdx === stories.length - 1 && mobilePageSide === 'right') || isFlipping}
              className="mobile-dock-arrow"
            >
              →
            </button>
          </div>

          <button className="mobile-dock-btn" onClick={() => setShowTOC(true)} title="Index">
            📜
          </button>
        </nav>
      )}

      {/* ─── TABLE OF CONTENTS SLIDE-UP DRAWER ─── */}
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
                    key={story._id}
                    className={`toc-chapter-card ${idx === activeIdx ? 'viewing' : ''}`}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM FOOTER: Newsletter Subscription */}
      <section className="magazine-footer-newsletter">
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