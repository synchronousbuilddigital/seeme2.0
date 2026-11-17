import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView'
import { API_ENDPOINTS } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { cachedFetch } from '../utils/cachedFetch'
import './About.css'

const About = () => {
  const navigate = useNavigate()
  const [aboutImage, setAboutImage] = useState('/images/about.jpg')

  const [ref, inView] = useInView({ once: true, threshold: 0.02 })

  useEffect(() => {
    cachedFetch(API_ENDPOINTS.SITE_SETTINGS)
      .then(data => {
        if (data.success && data.data.aboutImage) {
          setAboutImage(data.data.aboutImage)
        }
      })
      .catch(err => console.error('Error fetching about image:', err))
  }, [])

  return (
    <section className="about-editorial-split" id="about">
      <div className="split-container" ref={ref}>
        {/* Left Side: Visuals */}
        <motion.div
          className="split-visuals"
          initial={{ opacity: 0, x: -60 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="main-image-frame">
            <img src={getOptimizedImageUrl(aboutImage, 'hero')} alt="See Mee Heritage" loading="lazy" />
            <div className="frame-accent-line"></div>
          </div>
          <div className="est-box">
            <span className="est-text">SINCE</span>
            <span className="year-text">2024</span>
          </div>
        </motion.div>

        {/* Right Side: Content */}
        <motion.div
          className="split-content"
          initial={{ opacity: 0, x: 60 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <div className="content-header">
            <span className="editorial-label">About See Mee</span>
            <h2 className="editorial-main-title">Tradition, <span className="accent-italic">made for today.</span></h2>
          </div>

          <div className="editorial-narrative">
            <p>
              We make Indian clothing that feels comfortable, modern, and easy to wear.
              Each piece is thoughtfully made for everyday life and special moments.
            </p>
          </div>

          <motion.button
            className="split-cta-btn"
            onClick={() => navigate('/about')}
            whileHover={{ x: 6 }}
          >
            Read Our Story
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.button>
        </motion.div>
      </div>

    </section>
  )
}

export default About

