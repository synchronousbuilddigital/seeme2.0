import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView'
import { API_ENDPOINTS } from '../config/api'
import './About.css'

const About = () => {
  const navigate = useNavigate()
  const [aboutImage, setAboutImage] = useState('https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=1200')
  
  const [ref, inView] = useInView({ once: true, threshold: 0.2 })

  useEffect(() => {
    fetch(API_ENDPOINTS.SITE_SETTINGS)
      .then(res => res.json())
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
            <img src={aboutImage} alt="See Mee Heritage" />
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
            <span className="editorial-label">See Mee Heritage</span>
            <h2 className="editorial-main-title">
              Where Heritage <br/>
              <span className="accent-italic">Meets Modernity</span>
            </h2>
          </div>

          <div className="editorial-narrative">
            <p>
              At See Mee, we celebrate the artistry of Indian ethnic fashion. Every stitch tells a story — 
              of skilled artisans preserving techniques passed down through generations.
            </p>
            <p>
              Crafted for the woman who wears her heritage with pride, our collections 
              balance royal grandeur with contemporary ease.
            </p>
          </div>

          <div className="editorial-values-row">
            {[
              { title: "Curated Quality", desc: "Handpicked fabrics" },
              { title: "Artisan Heritage", desc: "Generations of craft" },
              { title: "Crafted with Soul", desc: "A labour of love" }
            ].map((item, i) => (
              <div key={i} className="value-item">
                <span className="value-title">{item.title}</span>
                <span className="value-desc">{item.desc}</span>
              </div>
            ))}
          </div>

          <div className="editorial-footer">
            <blockquote className="footer-quote">
              "Every stitch tells a story of heritage and soul."
            </blockquote>
            
            <motion.button 
              className="split-cta-btn"
              onClick={() => navigate('/magazine')}
              whileHover={{ x: 10 }}
            >
              Explore Our Magazine
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About

