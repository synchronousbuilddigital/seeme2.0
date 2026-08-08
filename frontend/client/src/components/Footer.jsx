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
                  svg: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  )
                },
                { 
                  name: 'Pinterest', 
                  svg: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.27 2.68 7.91 6.46 9.32-.09-.79-.17-2 .03-2.87.19-.79 1.22-5.17 1.22-5.17s-.31-.62-.31-1.54c0-1.44.83-2.52 1.88-2.52.88 0 1.31.67 1.31 1.47 0 .89-.57 2.22-.86 3.45-.24 1.03.52 1.87 1.54 1.87 1.85 0 3.27-1.95 3.27-4.77 0-2.49-1.79-4.23-4.34-4.23-2.95 0-4.69 2.22-4.69 4.5 0 .89.34 1.85.77 2.37.08.1.1.17.07.28l-.29 1.18c-.05.18-.16.22-.36.13-1.34-.62-2.18-2.58-2.18-4.15 0-3.38 2.45-6.49 7.08-6.49 3.72 0 6.61 2.65 6.61 6.19 0 3.7-2.33 6.68-5.57 6.68-1.09 0-2.11-.56-2.46-1.23 0 0-.54 2.05-.67 2.56-.24.93-.89 2.09-1.33 2.81C10.03 21.84 11 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"></path>
                    </svg>
                  )
                },
                { 
                  name: 'Twitter', 
                  svg: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                    </svg>
                  )
                }
              ].map((social) => (
                <motion.a 
                  key={social.name}
                  href={`#${social.name.toLowerCase()}`}
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
