import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './NotFoundPage.css'

const NotFoundPage = () => {
  return (
    <div className="notfound-container">
      <motion.div 
        className="notfound-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="notfound-badge">✦ 404 Error</span>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-subtitle">
          The page or luxury item you are looking for does not exist or has been moved.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn-primary">
            Return to Homepage
          </Link>
          <Link to="/collections" className="notfound-btn-secondary">
            Explore Collections
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFoundPage
