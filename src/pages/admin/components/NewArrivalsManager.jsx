import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './NewArrivalsManager.css'

const NewArrivalsManager = () => {
  const [arrivals, setArrivals] = useState({
    anarkali: null,
    palazzo: null,
    'straight-cut': null
  })
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchArrivals()
  }, [])

  const fetchArrivals = async () => {
    try {
      const response = await fetch('/api/new-arrivals')
      const data = await response.json()
      
      if (data.success) {
        const arrivalsMap = {}
        data.data.forEach(item => {
          arrivalsMap[item.category] = item.image
        })
        setArrivals(prev => ({ ...prev, ...arrivalsMap }))
      }
    } catch (error) {
      console.error('Error fetching arrivals:', error)
    }
  }

  const handleImageUpload = async (category, file) => {
    if (!file) return

    setUploading(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('adminToken')
      
      // Upload image
      const formData = new FormData()
      formData.append('image', file)

      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const uploadData = await uploadRes.json()

      if (!uploadData.success) {
        throw new Error('Upload failed')
      }

      // Update new arrival with Cloudinary URL
      const updateRes = await fetch(`/api/new-arrivals/${category}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: uploadData.data.url })
      })

      const updateData = await updateRes.json()

      if (updateData.success) {
        setArrivals(prev => ({ ...prev, [category]: uploadData.data.url }))
        setMessage({ type: 'success', text: `${category} image updated successfully!` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image' })
    } finally {
      setUploading(false)
    }
  }

  const categories = [
    { key: 'anarkali', label: 'Anarkali Suit', current: 'ANARKALI.png' },
    { key: 'palazzo', label: 'Palazzo Suit', current: 'Plazzo_suit.jpg' },
    { key: 'straight-cut', label: 'Straight Cut Suit', current: 'Straightcut.jpg' }
  ]

  return (
    <div className="new-arrivals-manager">
      <div className="manager-header">
        <h1>New Arrivals Management</h1>
        <p>Upload one image per category to showcase in the New Arrivals banner</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="arrivals-grid">
        {categories.map((cat) => (
          <motion.div 
            key={cat.key}
            className="arrival-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card-header">
              <h3>{cat.label}</h3>
              <span className="current-badge">Current: {cat.current}</span>
            </div>

            <div className="image-preview">
              {arrivals[cat.key] ? (
                <img 
                  src={arrivals[cat.key]} 
                  alt={cat.label}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x400?text=Upload+Image'
                  }}
                />
              ) : (
                <div className="no-image">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>No image uploaded</span>
                </div>
              )}
            </div>

            <div className="upload-section">
              <input
                type="file"
                id={`upload-${cat.key}`}
                name={`new-arrival-${cat.key}`}
                accept="image/*"
                onChange={(e) => handleImageUpload(cat.key, e.target.files[0])}
                disabled={uploading}
              />
              <label htmlFor={`upload-${cat.key}`} className="upload-btn">
                {uploading ? 'Uploading...' : 'Upload New Image'}
              </label>
              <span className="file-info">Max 5MB • JPG, PNG</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default NewArrivalsManager
