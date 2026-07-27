import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './GlobalLoader.css'

const GlobalLoader = () => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Quick fade out as soon as initial load is ready (300ms)
    const timer = setTimeout(() => {
      setVisible(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          className="global-site-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
        >
          <div className="loader-center-panel">
            <div className="spinner-orbit">
              <div className="orbit-dot"></div>
              <div className="orbit-text">SM</div>
            </div>
            <motion.p 
              className="loading-tagline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Preparing the Atelier Archive...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GlobalLoader
