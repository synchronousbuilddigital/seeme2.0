import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './NewArrivalsManager.css'

const NewArrivalsManager = () => {
  const MAX_IMAGE_SIZE_MB = 10
  const [arrivals, setArrivals] = useState({
    anarkali: null,
    palazzo: null,
    'straight-cut': null
  })
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    fetchArrivals()
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const fetchArrivals = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.NEW_ARRIVALS)
      if (data.success) {
        const arrivalsMap = {}
        data.data.forEach(item => {
          arrivalsMap[item.category] = item.image
        })
        setArrivals(prev => ({ ...prev, ...arrivalsMap }))
      }
    } catch (error) {
      console.error('Error fetching arrivals:', error)
      showNotification('Failed to load current arrivals', 'error')
    }
  }

  const handleImageUpload = async (category, file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification('Please choose a valid image file', 'error')
      return
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      showNotification(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`, 'error')
      return
    }

    setUploading(true)
    console.log(`🚀 Starting upload for category: ${category}...`)

    try {
      const formData = new FormData()
      formData.append('image', file)

      console.log('📤 Uploading to Cloudinary...')
      const uploadData = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: formData
      })

      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Image upload failed')
      }

      const imageUrl = uploadData.data.url || uploadData.data.secure_url || uploadData.data
      console.log('✅ Cloudinary Upload Success:', imageUrl)

      console.log(`💾 Updating database for ${category}...`)
      const updateData = await apiRequest(`${API_ENDPOINTS.NEW_ARRIVALS}/${category}`, {
        method: 'PUT',
        auth: true,
        body: { image: imageUrl }
      })

      if (updateData.success) {
        setArrivals(prev => ({ ...prev, [category]: imageUrl }))
        showNotification(`${category.replace('-', ' ')} updated successfully!`)
      } else {
        throw new Error(updateData.message || 'Failed to update database')
      }
    } catch (error) {
      console.error('❌ Upload Error:', error)
      showNotification(error.message || 'Failed to upload image', 'error')
    } finally {
      setUploading(false)
    }
  }

  const categories = [
    { key: 'anarkali', label: 'Anarkali Suits' },
    { key: 'palazzo', label: 'Palazzo Suits' },
    { key: 'straight-cut', label: 'Straight Cut Suits' }
  ]

  return (
    <div className="new-arrivals-manager">
      <div className="manager-header">
        <h1>New Arrivals</h1>
        <p>Manage the hero section categories for your store</p>
      </div>

      <div className="arrivals-grid">
        {categories.map((cat, index) => (
          <motion.div 
            key={cat.key}
            className="arrival-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="card-header">
              <h3>{cat.label}</h3>
              {arrivals[cat.key] && <span className="status-badge active">Live</span>}
            </div>

            <div className="image-preview">
              {arrivals[cat.key] ? (
                <img 
                  src={arrivals[cat.key]} 
                  alt={cat.label}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x800?text=Image+Not+Found'
                  }}
                />
              ) : (
                <div className="no-image-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p>No image uploaded yet</p>
                </div>
              )}
              {uploading && (
                <div className="upload-overlay">
                  <div className="loader"></div>
                  <span>Uploading...</span>
                </div>
              )}
            </div>

            <div className="upload-controls">
              <input
                type="file"
                id={`upload-${cat.key}`}
                accept="image/*"
                onChange={(e) => handleImageUpload(cat.key, e.target.files[0])}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label htmlFor={`upload-${cat.key}`} className={`upload-btn ${uploading ? 'disabled' : ''}`}>
                {arrivals[cat.key] ? 'Change Image' : 'Upload Image'}
              </label>
              <p className="upload-hint">Recommended: 600x800px • Max 10MB</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {notification.show && (
          <motion.div 
            className={`toast-notification ${notification.type}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NewArrivalsManager
