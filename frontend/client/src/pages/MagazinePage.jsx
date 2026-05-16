import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
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
    image: '/images/magazine/banarasi_silk_loom.png',
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
    image: '/images/magazine/artisan_craftsmanship.png',
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
    image: '/images/magazine/anarkali_editorial.png',
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
    image: fallback.image,
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

const MagazinePage = () => {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    fetchStories()
  }, [])

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

  const handleNext = () => {
    if (currentPage < stories.length - 1) {
      setDirection(1)
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentPage > 0) {
      setDirection(-1)
      setCurrentPage(prev => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="magazine-page-loading">
        <div className="spinner"></div>
        <p>Preparing the Journal...</p>
      </div>
    )
  }

  const currentStory = stories[currentPage]
  const progressWidth = `${((currentPage + 1) / stories.length) * 100}%`

  const variants = {
    enter: (direction) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
      filter: "brightness(0.8)"
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      filter: "brightness(1)",
      transition: {
        rotateY: { duration: 0.9, ease: [0.645, 0.045, 0.355, 1] },
        opacity: { duration: 0.5 }
      }
    },
    exit: (direction) => ({
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
      filter: "brightness(0.8)",
      transition: {
        rotateY: { duration: 0.9, ease: [0.645, 0.045, 0.355, 1] },
        opacity: { duration: 0.5 }
      }
    })
  }

  return (
    <div className="magazine-page">
      <div className="magazine-grain"></div>
      <div className="magazine-halo"></div>

      <header className="magazine-nav">
        <div className="nav-brand">SEEMEE JOURNAL</div>
        <div className="issue-info">Volume 04 // Spring 2026</div>
      </header>

      <div className="booklet-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              rotateY: { duration: 0.8, ease: "easeInOut" },
              opacity: { duration: 0.4 }
            }}
            className="book-spread"
          >
            {/* Left Page: Visual */}
            <div className="book-page left" onClick={handlePrev} style={{ cursor: currentPage > 0 ? 'pointer' : 'default' }}>
              <div className="page-spine"></div>
              <div className="visual-side">
                <img
                  src={getOptimizedImageUrl(currentStory.image, 'large')}
                  alt={currentStory.title}
                />
                <div className="visual-overlay"></div>
                <div className="visual-caption">
                  <span className="caption-label">{currentStory.category}</span>
                  <p className="caption-text">{currentStory.marginalia}</p>
                </div>
              </div>
            </div>

            {/* Right Page: Narrative */}
            <div className="book-page right" onClick={handleNext} style={{ cursor: currentPage < stories.length - 1 ? 'pointer' : 'default' }}>
              <div className="page-spine"></div>
              <div className="narrative-side">
                <div className="narrative-meta">
                  <span>{currentStory.readTime}</span>
                  <span>{currentStory.date}</span>
                </div>

                <h2 className="narrative-title">{currentStory.title}</h2>
                <p className="narrative-subtitle">{currentStory.subtitle}</p>

                <div className="narrative-body">
                  <p>{currentStory.description}</p>
                </div>

                {currentStory.quote && (
                  <div className="narrative-quote">
                    <blockquote>{currentStory.quote}</blockquote>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="booklet-nav">
        <button
          className="nav-btn"
          onClick={handlePrev}
          disabled={currentPage === 0}
        >
          ←
        </button>

        <div className="page-indicator">
          <span>{String(currentPage + 1).padStart(2, '0')}</span> / {String(stories.length).padStart(2, '0')}
        </div>

        <button
          className="nav-btn"
          onClick={handleNext}
          disabled={currentPage === stories.length - 1}
        >
          →
        </button>
      </nav>

      <div className="booklet-progress">
        <div className="progress-fill" style={{ width: progressWidth }}></div>
      </div>

      <section className="magazine-newsletter">
        <div className="newsletter-wrap">
          <h2>The SEEMEE Letters</h2>
          <p>Exclusive atelier notes, seasonal mood boards, and early access to digital archives.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Your Email Address" />
            <button>Join the Archive</button>
          </div>
        </div>
      </section>
    </div>
  )
}


export default MagazinePage