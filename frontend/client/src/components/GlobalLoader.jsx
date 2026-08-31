import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import './GlobalLoader.css'

const GlobalLoader = () => {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [logo, setLogo] = useState(null)

  useEffect(() => {
    fetch(API_ENDPOINTS.SITE_SETTINGS)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.logo) {
          setLogo(data.data.logo)
        }
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        const increment = Math.floor(Math.random() * 12) + 8
        const nextVal = prev + increment
        return nextVal > 100 ? 100 : nextVal
      })
    }, 40)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress === 100) {
      const exitTimer = setTimeout(() => {
        setVisible(false)
      }, 350)
      return () => clearTimeout(exitTimer)
    }
  }, [progress])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="seemee-global-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] }
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="loader-ambient-glow" />

          <div className="loader-content-box">
            {/* Minimal Luxury Hanger / Couture SVG Emblem */}
            <div className="loader-emblem-wrap">
              <svg className="loader-hanger-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Hanger Hook */}
                <path d="M32 14C32 9.58172 35.5817 6 40 6C42.2091 6 44 7.79086 44 10C44 12.2091 42.2091 14 40 14" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round"/>
                {/* Hanger Body */}
                <path d="M32 14L10 32C8 33.6 8 36 10 36H54C56 36 56 33.6 54 32L32 14Z" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Bottom Accent Line */}
                <line x1="18" y1="36" x2="46" y2="36" stroke="#F4E4C1" strokeWidth="1.5" strokeDasharray="3 3"/>
              </svg>
              <div className="emblem-pulse-ring" />
            </div>

            {/* Brand Logo / Header */}
            <div className="loader-brand-header">
              {logo ? (
                <img src={logo} alt="SEEMEE" className="loader-logo-img" />
              ) : (
                <h1 className="loader-brand-title">SEEMEE</h1>
              )}
              <span className="loader-brand-subtitle">HAUTE COUTURE • ATELIER</span>
            </div>

            {/* Minimal Gold Progress Bar */}
            <div className="loader-progress-container">
              <div className="loader-progress-track">
                <div
                  className="loader-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="loader-progress-meta">
                <span className="loader-status-text">CURATING ATELIER</span>
                <span className="loader-percent-num">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GlobalLoader
