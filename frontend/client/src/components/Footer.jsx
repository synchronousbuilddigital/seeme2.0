import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView'
import { useNavigate } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const [ref, inView] = useInView({ once: true, threshold: 0.1 })
  const navigate = useNavigate()
  
  return (
    <footer className="footer-editorial" id="contact" ref={ref}>
      {/* Massive Background Logo */}
      <div className="footer-bg-text">SEE MEE</div>
      
      <div className="footer-luxury-container">
        {/* Top Section: Navigation Columns */}
        <div className="footer-main-grid">
          <motion.div 
            className="footer-brand-column"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="footer-logo-premium" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <span className="logo-main">See Mee</span>
              <span className="logo-sub">EST. 2024</span>
            </div>
            <p className="brand-statement">
              Preserving Indian craftsmanship through a modern lens. 
              Our curated collections celebrate the timeless elegance of heritage silhouettes.
            </p>
            <div className="editorial-socials">
              {['instagram', 'facebook', 'twitter', 'pinterest'].map((platform) => (
                <motion.a 
                  key={platform}
                  href={`#${platform}`}
                  className="social-icon-link"
                  whileHover={{ y: -5, color: '#D4AF37' }}
                >
                  {platform}
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="footer-nav-column"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h4 className="column-title">Collections</h4>
            <ul className="column-links">
              <li><button onClick={() => navigate('/category/anarkali')}>Anarkali Suits</button></li>
              <li><button onClick={() => navigate('/category/palazzo')}>Palazzo Sets</button></li>
              <li><button onClick={() => navigate('/category/straight-cut')}>Straight Cut</button></li>
              <li><button onClick={() => navigate('/collections')}>Featured Pieces</button></li>
            </ul>
          </motion.div>

          <motion.div 
            className="footer-nav-column"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h4 className="column-title">Experience</h4>
            <ul className="column-links">
              <li><button onClick={() => navigate('/about')}>Our Story</button></li>
              <li><button onClick={() => navigate('/craft')}>Artisan Heritage</button></li>
              <li><button onClick={() => navigate('/magazine')}>Magazine</button></li>
              <li><button onClick={() => navigate('/contact')}>Contact Us</button></li>
            </ul>
          </motion.div>

          <motion.div 
            className="footer-newsletter-column"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h4 className="column-title">Newsletter</h4>
            <p className="newsletter-description">
              Join our list for exclusive access to new arrivals and heritage stories.
            </p>
            <div className="editorial-input-group">
              <input type="email" placeholder="email@example.com" />
              <button className="input-submit">Join</button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: Legal & Credits */}
        <div className="footer-bottom-bar">
          <div className="legal-links">
            <button onClick={() => navigate('/privacy')}>Privacy</button>
            <button onClick={() => navigate('/terms')}>Terms</button>
            <button onClick={() => navigate('/shipping')}>Shipping</button>
          </div>
          <div className="copyright-text">
            &copy; {new Date().getFullYear()} See Mee Heritage. All Rights Reserved.
          </div>
          <div className="brand-signature">
            Crafted with Soul
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
