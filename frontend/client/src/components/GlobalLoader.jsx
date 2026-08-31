import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import './GlobalLoader.css'

const CLOTHING_PHRASES = [
  'WEAVING HERITAGE FABRICS...',
  'STITCHING GOLDEN EMBROIDERY...',
  'TAILORING YOUR ROYAL ATELIER...',
  'UNVEILING ETHNIC COUTURE...',
  'YOUR OUTFIT IS READY'
]

const GlobalLoader = () => {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
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
        const increment = Math.floor(Math.random() * 7) + 5
        const nextVal = prev + increment
        return nextVal > 100 ? 100 : nextVal
      })
    }, 40)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 25) setPhraseIndex(0)
    else if (progress < 55) setPhraseIndex(1)
    else if (progress < 75) setPhraseIndex(2)
    else if (progress < 95) setPhraseIndex(3)
    else setPhraseIndex(4)
  }, [progress])

  useEffect(() => {
    if (progress === 100) {
      const exitTimer = setTimeout(() => {
        setVisible(false)
      }, 450)
      return () => clearTimeout(exitTimer)
    }
  }, [progress])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="global-site-loader real-clothing-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] }
          }}
        >
          {/* Ambient Glow Spotlight */}
          <div className="loader-ambient-glow" />

          {/* Loom Background Pattern */}
          <div className="loader-bg-weave" />

          <div className="loader-center-panel">
            {/* Real Clothing Showcase Frame */}
            <div className="garment-showcase-frame">
              <div className="garment-ring-glow" />
              <div className="garment-img-wrapper">
                <img
                  src="/images/loader_clothing_garment.jpg"
                  alt="SEEMEE Ethnic Garment"
                  className="garment-img"
                />
                <div className="garment-overlay-shimmer" />
              </div>
              <div className="garment-hanger-badge">
                <span>🪡</span>
              </div>
            </div>

            {/* Brand Title / Logo */}
            <div className="loader-brand-box">
              {logo ? (
                <img src={logo} alt="SEEMEE" className="loader-logo-img" />
              ) : (
                <span className="clothing-brand-title">SEEMEE</span>
              )}
              <span className="clothing-brand-sub">ETHNIC &amp; LUXURY COUTURE</span>
            </div>

            {/* Tailor's Measuring Tape Progress Bar */}
            <div className="measuring-tape-wrapper">
              <div className="tape-ticks-bar">
                {Array(11).fill(0).map((_, i) => (
                  <span key={i} className="tape-tick-mark" />
                ))}
              </div>

              <div className="tape-progress-track">
                <div
                  className="tape-progress-fill"
                  style={{ width: `${progress}%` }}
                >
                  <div className="tape-needle-pointer">
                    <span className="needle-head">✂️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Percentage Display */}
            <div className="clothing-percentage-text">
              <span>{progress}</span>
              <span className="percent-unit">% TAILORED</span>
            </div>

            {/* Dynamic Status Phrase */}
            <motion.p
              key={phraseIndex}
              className="clothing-tagline"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {CLOTHING_PHRASES[phraseIndex]}
            </motion.p>
          </div>

          {/* Footer Signature */}
          <div className="loader-footer-signature">
            <span>CURATING FINE ETHNIC WEAR • SEEMEE</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GlobalLoader
