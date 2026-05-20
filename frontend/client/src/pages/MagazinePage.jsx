import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './MagazinePage.css'

const fallbackStories = [
  {
    _id: 'story1',
    title: 'The Gold Thread Archive',
    subtitle: 'Reading a Stitch Like a Sentence',
    description: 'Zardozi is not only embroidery. It is a written record of care, restraint, and ceremony. In this chapter, the atelier opens its ledgers, showing how metallic thread is softened by hand, how motifs are aligned with almost architectural precision, and how a single panel can hold the memory of dozens of decisions. The result feels less like ornament and more like a page preserved in silk and light.',
    image: '/images/magazine/gold_thread_archive.png',
    category: 'Heritage',
    author: 'Elena Rossi',
    quote: 'Every stitch is a line of memory, and every finish is a mark of patience.',
    readTime: '8 MIN READ',
    date: 'MAY 2026',
    chapter: 'CHAPTER 01',
    sections: [
      'The opening spread traces the first sketch, where the motif is scaled, softened, and translated into thread.',
      'The middle pages move through the handwork itself, where gold tones are layered, pressed, and secured by eye.',
      'The closing note records the finishing stage, when the garment is inspected, stored, and prepared like an archive piece.'
    ],
    highlights: ['Hand-guided metallic embroidery', 'Royal-inspired borders', 'Low-volume atelier production'],
    marginalia: 'Library note: This story reads like a conservator\'s log, preserving process as carefully as the garment itself.'
  },
  {
    _id: 'story2',
    title: 'Silk and the River City',
    subtitle: 'The Banaras Loom as a Living Chronicle',
    description: 'The Banarasi loom turns repetition into ritual. Every shuttle movement carries a tempo that has outlived trends, and every finished textile becomes a reminder that cloth can contain geography, labor, and inheritance at once. This chapter follows the loom room from daylight to dusk, moving past dye vats, thread books, and folded lengths of silk waiting for their last inspection.',
    image: '/images/magazine/silk_river_city.png',
    category: 'Craftsmanship',
    author: 'Julian Thorne',
    quote: 'A woven fabric can be read the way a city is read: slowly, by layers.',
    readTime: '7 MIN READ',
    date: 'APRIL 2026',
    chapter: 'CHAPTER 02',
    sections: [
      'The first paragraph introduces the loom room and the steady rhythm that shapes the cloth before it even leaves the frame.',
      'The second section studies the pattern books, where traditional references are reworked into a modern sequence of color and texture.',
      'The final section follows the garment into the wardrobe, where the textile becomes part of a contemporary silhouette.'
    ],
    highlights: ['Banarasi pattern books', 'Textile density and drape', 'Heritage weave reinterpreted for today'],
    marginalia: 'Reading cue: Notice how the story moves from architecture to intimacy, as if the weave were drawing a floor plan.'
  },
  {
    _id: 'story3',
    title: 'Anarkali, Recut',
    subtitle: 'A Silhouette Built for Movement',
    description: 'Some garments begin as references and end as statements. The modern Anarkali in this spread is cut with more air, less rigidity, and a sharper sense of line, proving that volume can still feel light. The studio notes capture the balance between ceremonial presence and daily ease, while the images document how shape changes when fabric is allowed to move instead of merely stand still.',
    image: '/images/magazine/anarkali_recut.png',
    category: 'Collections',
    author: 'Aria Varma',
    quote: 'The best volume never shouts. It simply arrives with confidence.',
    readTime: '6 MIN READ',
    date: 'MARCH 2026',
    chapter: 'CHAPTER 03',
    sections: [
      'The opening spread explains the silhouette, showing how a classic frame is widened, refined, and made easier to wear.',
      'The middle section focuses on surface treatment, where embroidery and seams are placed to guide the eye rather than overwhelm it.',
      'The closing note speaks to wearability, reminding the reader that beauty must still live in the body that carries it.'
    ],
    highlights: ['Refined volume', 'Studio-tested drape', 'Comfort-led tailoring'],
    marginalia: 'Workshop note: The pattern reads like a diagram, but the garment reads like a gesture.'
  },
  {
    _id: 'story4',
    title: 'The Wardrobe Afterlife',
    subtitle: 'How a Garment Becomes an Object of Care',
    description: 'The last chapter is about life after the fitting room. A garment becomes a keepsake when it is stored, repaired, and returned to with intention. Here the magazine changes tempo and becomes a practical guide, listing the rituals that keep fabric beautiful: steaming, folding, brushing, and the quiet habit of checking seams before the next occasion arrives.',
    image: '/images/magazine/wardrobe_afterlife.png',
    category: 'Archive',
    author: 'Mira Kapoor',
    quote: 'Care is the final craft, and often the one that gives a garment its longest life.',
    readTime: '5 MIN READ',
    date: 'FEBRUARY 2026',
    chapter: 'CHAPTER 04',
    sections: [
      'The opening note is a checklist for preservation, turning the wardrobe into a small archive of living objects.',
      'The second passage details how finishing decisions affect longevity, from linings to closures to storage habits.',
      'The final page reads like an instruction card, inviting the reader to treat luxury as stewardship rather than display.'
    ],
    highlights: ['Storage and care routines', 'Repair-first thinking', 'Long-term garment stewardship'],
    marginalia: 'Archive note: A well-made garment should be readable years later, not just memorable on the day it is worn.'
  },
  {
    _id: 'story5',
    title: 'The Architecture of Drape',
    subtitle: 'How Fabric Learns to Fall',
    description: 'Drape is not merely the absence of structure; it is structure in motion. A well-draped garment understands gravity better than a tailored one. In this study, we observe how heavy silks collapse into liquid folds and how sheer organza holds air like a second skin. It is a dialogue between the weaver\'s tension and the wearer\'s walk.',
    image: '/images/magazine/architecture_of_drape.png',
    category: 'Design',
    author: 'Kavya Singh',
    quote: 'The true shape of a garment is only revealed when it moves.',
    readTime: '6 MIN READ',
    date: 'JANUARY 2026',
    chapter: 'CHAPTER 05',
    sections: [
      'The opening spread analyzes the bias cut, showing how fabric relaxes when cut off-grain.',
      'The middle pages document the pleating process, where heat and pressure create permanent rhythm in the cloth.',
      'The closing note reflects on the final silhouette, capturing the dress in motion.'
    ],
    highlights: ['Bias draping techniques', 'Fluid organza layers', 'Dynamic movement'],
    marginalia: 'Studio note: Pinning the drape on the form takes longer than the stitching itself.'
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
        loadedStories = data.data.map((story, index) => normalizeStory(story, index))
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
    if (activeIdx < stories.length - 1 && !isFlipping) {
      setFlipDirection('next')
      setIsFlipping(true)
      playPageTurnSound()
      setTimeout(() => {
        setActiveIdx(prev => prev + 1)
        setIsFlipping(false)
      }, 900)
    }
  }

  const handlePrev = () => {
    if (activeIdx > 0 && !isFlipping) {
      setFlipDirection('prev')
      setIsFlipping(true)
      playPageTurnSound()
      setTimeout(() => {
        setActiveIdx(prev => prev - 1)
        setIsFlipping(false)
      }, 900)
    }
  }

  const handleOpenBook = () => {
    if (isFlipping) return
    setIsFlipping(true)
    setFlipDirection('open')
    setBookState('opening')
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
      setIsFlipping(false)
    }, 900)
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
        
        {story.marginalia && (
          <div className="curator-handwritten-marginalia">
            <p>{story.marginalia}</p>
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
        
        {/* MOBILE LAYOUT (STORYBOARD COLUMN VIEW) */}
        {isMobile ? (
          <div className="magazine-mobile-column">
            
            {/* Mobile Cover Plaque */}
            <div className="mobile-cover-plaque">
              <div className="cover-leather-texture"></div>
              <div className="mobile-cover-inside">
                <span className="edition-badge">LIMITED ARCHIVE EDITION</span>
                <h1 className="mobile-title">SEEMEE JOURNAL</h1>
                <p className="mobile-subtitle">A Digital Anthology of Couture Craft & Living Chronicles</p>
                <div className="gold-seal-crest">SM</div>
                <div className="explore-nudge">
                  <span className="scroll-arrow">↓</span>
                  <span className="scroll-label">Scroll to Explore</span>
                </div>
              </div>
            </div>

            {/* Mobile Story Blocks */}
            <div className="mobile-stories-list">
              {stories.map((story, idx) => (
                <article key={story._id} className="mobile-story-card">
                  <div className="mobile-card-paper"></div>
                  
                  <div className="mobile-card-header">
                    <span className="mobile-story-chapter">{story.chapter}</span>
                    <span className="mobile-story-category">{story.category}</span>
                  </div>

                  <div className="mobile-photo-box">
                    <img src={getOptimizedImageUrl(story.image, 'large')} alt={story.title} className="mobile-photo-img" />
                    <div className="mobile-caption">Plate No. 0{idx + 1}</div>
                  </div>

                  <div className="mobile-story-body">
                    <h2 className="mobile-story-title">{story.title}</h2>
                    <h3 className="mobile-story-subtitle">{story.subtitle}</h3>
                    <p className="mobile-story-description">
                      <span className="mobile-drop-cap">{story.description.charAt(0)}</span>
                      {story.description.slice(1)}
                    </p>
                    
                    {story.quote && (
                      <blockquote className="mobile-quote">
                        “{story.quote}”
                        <cite className="mobile-quote-author">— {story.author}</cite>
                      </blockquote>
                    )}

                    {story.highlights && (
                      <div className="mobile-highlights">
                        {story.highlights.map((h, hIdx) => (
                          <div key={hIdx} className="mobile-highlight-tag">
                            <span className="tag-bullet">✦</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="mobile-card-footer">
                    <span>{story.readTime}</span>
                    <span>Page {idx * 2 + 1}-{idx * 2 + 2}</span>
                  </div>
                </article>
              ))}
            </div>

          </div>
        ) : (
          /* 3D BOOKLET SPREAD VIEW */
          <div className="booklet-perspective-frame">
            
            {/* BOOK CASE WRAPPER */}
            <div className={`book-hardcase-shell ${bookState}`}>
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
                <div className="book-spread-overlay">
                  {/* Underlay Left (inside book backing) */}
                  <div className="book-page left-page blank-page">
                    <div className="inside-cover-backing"></div>
                  </div>
                  {/* Underlay Right (First story left page) */}
                  {renderRightPageContent(stories[0], 0)}

                  {/* Flipping page (the cover itself swinging left) */}
                  <motion.div
                    className="3d-flipping-page-container"
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
                </div>
              )}

              {/* COVER FLIPPING CLOSED TRANSITION */}
              {bookState === 'closing' && (
                <div className="book-spread-overlay">
                  {/* Underlay Left (blank) */}
                  <div className="book-page left-page blank-page">
                    <div className="inside-cover-backing"></div>
                  </div>
                  {/* Underlay Right (story 0 right page) */}
                  {renderRightPageContent(stories[0], 0)}

                  {/* Flipping page (cover swinging back right) */}
                  <motion.div
                    className="3d-flipping-page-container"
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
                </div>
              )}

              {/* BOOK IS OPEN - RENDER SPHERE SPREADS */}
              {bookState === 'open' && (
                <div className="book-spread-overlay">
                  
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
                      className="3d-flipping-page-container"
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
                      className="3d-flipping-page-container"
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
                </div>
              )}

            </div>
          </div>
        )}

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

      {/* ─── TABLE OF CONTENTS SLIDE-UP DRAWER ─── */}
      <AnimatePresence>
        {showTOC && !isMobile && (
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