import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import './Footer.css'

const Footer = () => {
  const [ref, inView] = useInView({ once: true, threshold: 0.02 })
  const navigate = useNavigate()
  
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let isMounted = true
    const fetchAdminCategories = async () => {
      try {
        const [categoriesData, settingsData] = await Promise.all([
          cachedFetch(API_ENDPOINTS.GET_CATEGORIES).catch(() => null),
          cachedFetch(API_ENDPOINTS.SITE_SETTINGS).catch(() => null)
        ])

        let categoryList = []

        if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides) && settingsData.data.categorySlides.length > 0) {
          categoryList = settingsData.data.categorySlides
            .filter(Boolean)
            .map(cat => {
              const title = cat?.title || cat?.label || cat?.name || ''
              const slug = (cat?.slug || title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              return { title, slug }
            })
            .filter(c => c.title)
        }

        if (categoryList.length === 0 && categoriesData?.success && Array.isArray(categoriesData.data)) {
          categoryList = categoriesData.data.filter(Boolean).map(cat => {
            const name = typeof cat === 'string' ? cat : (cat?.name || cat?.title || '')
            const slug = (typeof cat === 'object' && cat !== null && cat.slug) ? cat.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            return { title: name, slug }
          }).filter(c => c.title)
        }

        if (isMounted && categoryList.length > 0) {
          const seen = new Set()
          const uniqueList = []
          for (const item of categoryList) {
            if (item.title && item.slug && !seen.has(item.slug)) {
              seen.add(item.slug)
              uniqueList.push(item)
            }
          }
          setCategories(uniqueList)
        }
      } catch (err) {
        console.error('Error fetching categories in Footer:', err)
      }
    }

    fetchAdminCategories()
    return () => { isMounted = false }
  }, [])
  
  return (
    <footer className="footer-editorial" id="contact" ref={ref}>
      {/* Ambient background glows */}
      <div className="footer-glow footer-glow-gold"></div>
      <div className="footer-glow footer-glow-pink"></div>

      {/* Massive Accent Background Logo */}
      <div className="footer-bg-text">SEE MEE</div>
      
      <div className="footer-luxury-container">
        {/* Top Section: Navigation Columns */}
        <div className="footer-main-grid">
          <motion.div 
            className="footer-brand-column"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
              {[
                { 
                  name: 'Instagram', 
                  url: 'https://www.instagram.com/seemee.fashions/',
                  svg: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  )
                },
                { 
                  name: 'Facebook', 
                  url: 'https://www.facebook.com/people/SeeMee/61594145674784/',
                  svg: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  )
                }
              ].map((social) => (
                <motion.a 
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-btn"
                  whileHover={{ y: -3 }}
                  aria-label={`Follow us on ${social.name}`}
                >
                  {social.svg}
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="footer-nav-column"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <h4 className="column-title">Categories</h4>
            <ul className="column-links">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <button onClick={() => navigate(`/category/${cat.slug}`)}>{cat.title}</button>
                </li>
              ))}
              <li><button onClick={() => navigate('/categories')}>All Categories</button></li>
            </ul>
          </motion.div>

          <motion.div 
            className="footer-nav-column"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <h4 className="column-title">Experience</h4>
            <ul className="column-links">
              <li><button onClick={() => navigate('/about')}>Our Story</button></li>
              <li><button onClick={() => navigate('/craft')}>Artisan Heritage</button></li>
              <li><button onClick={() => navigate('/fabrics')}>Fabrics & Crafts</button></li>
              <li><button onClick={() => navigate('/magazine')}>Magazine</button></li>
              <li><button onClick={() => navigate('/contact')}>Contact Us</button></li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section: Legal & Credits */}
        <div className="footer-bottom-bar">
          <div className="legal-links">
            <button onClick={() => navigate('/privacy')}>Privacy Policy</button>
            <button onClick={() => navigate('/terms')}>Terms & Conditions</button>
            <button onClick={() => navigate('/return-policy')}>Return & Exchange Policy</button>
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
