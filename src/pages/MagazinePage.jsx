import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './MagazinePage.css'

const MagazinePage = () => {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/magazine')
      const data = await response.json()
      if (data.success && data.data.length > 0) {
        setStories(data.data)
      }
    } catch (error) {
      console.error('Error fetching magazine stories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="magazine-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading Magazine...</p>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="magazine-page-empty">
        <h2>No Stories Available</h2>
        <p>Check back soon for our latest stories and culture insights.</p>
      </div>
    )
  }

  return (
    <div className="magazine-page">
      {/* Header */}
      <motion.div 
        className="magazine-page-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="magazine-page-title">Magazine</h1>
        <p className="magazine-page-subtitle">Discover Our Culture, Heritage & Stories</p>
      </motion.div>

      {/* Scroll-Driven Gallery */}
      <ScrollGallery stories={stories} />
    </div>
  )
}

// Scroll-Driven Gallery Component
const ScrollGallery = ({ stories }) => {
  const containerRef = useRef(null)
  
  // Track scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  return (
    <div ref={containerRef} className="scroll-gallery-container" style={{ position: 'relative' }}>
      <div className="scroll-gallery-sticky">
        {stories.map((story, index) => {
          const totalImages = stories.length
          const segmentSize = 1 / totalImages
          const start = index * segmentSize
          const end = start + segmentSize

          // Continuous zoom in only (1 → 1.5)
          const scale = useTransform(
            scrollYProgress,
            [start, end],
            [1, 1.5]
          )

          // Smooth fade in and out with overlap
          const opacity = useTransform(
            scrollYProgress,
            [
              start - segmentSize * 0.1,  // Start fading in slightly before segment
              start + segmentSize * 0.1,  // Fully visible
              end - segmentSize * 0.2,    // Stay visible
              end + segmentSize * 0.1     // Fade out as next comes in
            ],
            [0, 1, 1, 0]
          )

          return (
            <motion.div
              key={story._id}
              className="scroll-gallery-image"
              style={{
                scale,
                opacity,
                zIndex: totalImages - index
              }}
            >
              <img 
                src={getOptimizedImageUrl(story.image, 'hero')} 
                alt={story.title}
              />
              <div className="scroll-gallery-overlay"></div>
              
              {/* Story Content */}
              <motion.div 
                className="scroll-gallery-content"
                style={{ opacity }}
              >
                <h2 className="story-title">{story.title}</h2>
                <p className="story-description">{story.description}</p>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default MagazinePage
