import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './CategoryManager.css'

const CategoryManager = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [uploading, setUploading] = useState(false)
  const [audienceFilter, setAudienceFilter] = useState('all') // 'all', 'men', 'women'

  const normalizeAudience = (val) => {
    if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase())
    if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
    return ['all']
  }

  const emptySlide = {
    title: '',
    subtitle: '',
    slug: '',
    description: '',
    targetAudience: ['all'],
    features: [],
    image: '',
    order: 0
  }

  const handleCategoryAudienceToggle = (value) => {
    if (!editingSlide) return
    const current = normalizeAudience(editingSlide.targetAudience)
    let updated
    if (current.includes(value)) {
      updated = current.filter(v => v !== value)
      if (updated.length === 0) updated = ['all']
    } else {
      updated = [...current, value]
    }
    setEditingSlide({ ...editingSlide, targetAudience: updated })
  }

  useEffect(() => {
    // Load local cache immediately for 0ms render
    const cached = localStorage.getItem('seemee_admin_site_settings')
    if (cached) {
      try {
        setSettings(JSON.parse(cached))
        setLoading(false)
      } catch (e) { }
    }
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.SITE_SETTINGS)
      if (data.success) {
        setSettings(data.data)
        localStorage.setItem('seemee_admin_site_settings', JSON.stringify(data.data))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      showNotification('Failed to fetch settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleEdit = (slide, index) => {
    setEditingSlide({ ...slide, _index: index })
    setIsAdding(false)
  }

  const handleAddNew = () => {
    const initialAudience = audienceFilter === 'all' ? 'all' : audienceFilter
    setEditingSlide({ ...emptySlide, targetAudience: initialAudience, order: settings?.categorySlides?.length || 0 })
    setIsAdding(true)
  }

  const handleDelete = async (slideId, index) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return

    try {
      const updatedSlides = (settings?.categorySlides || []).filter((s, idx) => {
        if (slideId && s._id) return s._id !== slideId
        return idx !== index
      })
      const data = await apiRequest(API_ENDPOINTS.SITE_SETTINGS, {
        method: 'PUT',
        auth: true,
        body: { categorySlides: updatedSlides }
      })

      if (data.success) {
        setSettings(data.data)
        localStorage.setItem('seemee_admin_site_settings', JSON.stringify(data.data))
        showNotification('Category deleted successfully')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showNotification('Failed to delete category', 'error')
    }
  }

  const handleImageUpload = async (file) => {
    if (!file) return

    // Basic validation
    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification('Image must be smaller than 10MB', 'error')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('folder', 'seemee/categories')
      formData.append('images', file)

      const data = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGES, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: formData
      })

      if (data.success && data.data && data.data.length > 0) {
        const uploadedImage = data.data[0]
        const imageUrl = uploadedImage.url || uploadedImage.secure_url || getImageUrl(uploadedImage)

        setEditingSlide(prev => ({ ...prev, image: imageUrl }))
        showNotification('Image uploaded successfully')
      } else if (data.success && !Array.isArray(data.data)) {
        const imageUrl = data.data.url || data.data.secure_url || getImageUrl(data.data)
        setEditingSlide(prev => ({ ...prev, image: imageUrl }))
        showNotification('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showNotification(error.message || 'Failed to upload image', 'error')
    } finally {
      setUploading(false)
      const input = document.getElementById('cat-img-input')
      if (input) input.value = ''
    }
  }

  const handleSave = async () => {
    if (!editingSlide.title || !editingSlide.slug) {
      showNotification('Title and Slug are required', 'error')
      return
    }

    setIsSaving(true)
    try {
      const targetSlide = { ...editingSlide }
      delete targetSlide._index

      const cleanTargetSlide = {
        ...targetSlide,
        targetAudience: Array.isArray(targetSlide.targetAudience) && targetSlide.targetAudience.length > 0
          ? targetSlide.targetAudience
          : [targetSlide.targetAudience || 'all']
      }

      let updatedSlides
      if (isAdding) {
        updatedSlides = [...(settings?.categorySlides || []), cleanTargetSlide]
      } else {
        updatedSlides = (settings?.categorySlides || []).map((s, idx) => {
          if (cleanTargetSlide._id && s._id && s._id === cleanTargetSlide._id) {
            return cleanTargetSlide
          }
          if (editingSlide._index !== undefined && idx === editingSlide._index) {
            return cleanTargetSlide
          }
          return s
        })
      }

      // Ensure every slide in updatedSlides has normalized targetAudience array
      const normalizedSlides = updatedSlides.map(s => ({
        ...s,
        targetAudience: Array.isArray(s.targetAudience)
          ? s.targetAudience
          : (typeof s.targetAudience === 'string' && s.targetAudience.trim() ? [s.targetAudience] : ['all'])
      }))

      const data = await apiRequest(API_ENDPOINTS.SITE_SETTINGS, {
        method: 'PUT',
        auth: true,
        body: { categorySlides: normalizedSlides }
      })

      if (data.success) {
        setSettings(data.data)
        localStorage.setItem('seemee_admin_site_settings', JSON.stringify(data.data))
        setEditingSlide(null)
        showNotification(isAdding ? 'Category added successfully' : 'Category updated successfully')
      }
    } catch (error) {
      console.error('Save error:', error)
      showNotification('Failed to save category', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading categories...</p>
    </div>
  )

  const isCategoryForAudience = (slide, audience) => {
    if (!slide || !audience || audience === 'all') return true
    const target = audience.toLowerCase().trim()
    const arr = normalizeAudience(slide.targetAudience)

    const hasMen = arr.includes('men') || arr.includes('male') || arr.includes('gents')
    const hasWomen = arr.includes('women') || arr.includes('female') || arr.includes('ladies')
    const hasExplicitAll = arr.includes('all') || arr.includes('unisex')

    // 1. Explicit single gender tags set in Admin Panel
    if (hasWomen && !hasMen) return target === 'women'
    if (hasMen && !hasWomen) return target === 'men'

    // 2. Keyword fallback for title/subtitle/slug
    const text = `${slide.title || ''} ${slide.subtitle || ''} ${slide.slug || ''}`.toLowerCase()
    const womenKw = ['kurti', 'sharara', 'saree', 'sari', 'lehenga', 'anarkali', 'kaftan', 'gown', 'dupatta', 'suit', 'palazzo', 'women', 'female', 'ladies', 'dress', 'top']
    const menKw = ['sherwani', 'bandhgala', 'nehru jacket', 'waistcoat', 'pathani', 'men', 'male', 'gents', 'mens', 'tshirt', 'shirt', 'kurta pyjama']

    const isWomenTitle = womenKw.some(kw => text.includes(kw))
    const isMenTitle = menKw.some(kw => text.includes(kw))

    if (target === 'men') {
      if (isWomenTitle && !isMenTitle) return false
      if (hasMen || isMenTitle) return true
      return hasExplicitAll && !isWomenTitle
    }

    if (target === 'women') {
      if (isMenTitle && !isWomenTitle) return false
      if (hasWomen || isWomenTitle) return true
      return hasExplicitAll && !isMenTitle
    }

    return true
  }

  const allSlides = settings?.categorySlides || []
  const displayedCategorySlides = allSlides.filter(slide => isCategoryForAudience(slide, audienceFilter))

  const menCount = allSlides.filter(s => isCategoryForAudience(s, 'men')).length
  const womenCount = allSlides.filter(s => isCategoryForAudience(s, 'women')).length

  const formatAudienceBadge = (val) => {
    if (Array.isArray(val)) return val.map(v => (v || '').toUpperCase()).join(', ')
    if (typeof val === 'string' && val.trim()) return val.toUpperCase()
    return 'ALL'
  }

  return (
    <div className="category-manager">
      <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="audience-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '4px 6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', padding: '0 6px' }}>Filter:</span>
          <button
            type="button"
            style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none', background: audienceFilter === 'all' ? '#ffffff' : 'transparent', color: audienceFilter === 'all' ? '#0f172a' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', boxShadow: audienceFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}
            onClick={() => setAudienceFilter('all')}
          >
            ALL ({allSlides.length})
          </button>
          <button
            type="button"
            style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none', background: audienceFilter === 'men' ? '#2563eb' : 'transparent', color: audienceFilter === 'men' ? '#ffffff' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', boxShadow: audienceFilter === 'men' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}
            onClick={() => setAudienceFilter('men')}
          >
            MEN ({menCount})
          </button>
          <button
            type="button"
            style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none', background: audienceFilter === 'women' ? '#ec4899' : 'transparent', color: audienceFilter === 'women' ? '#ffffff' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', boxShadow: audienceFilter === 'women' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s ease' }}
            onClick={() => setAudienceFilter('women')}
          >
            WOMEN ({womenCount})
          </button>
        </div>

        <button className="add-btn" onClick={handleAddNew}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add {audienceFilter === 'all' ? 'Category' : `${audienceFilter.toUpperCase()} Category`}
        </button>
      </div>

      <div className="slides-grid">
        {displayedCategorySlides.length > 0 ? (
          displayedCategorySlides.map((slide, index) => (
            <motion.div
              key={slide._id || index}
              className="slide-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="slide-image">
                <img
                  src={getImageUrl(slide.image)}
                  alt={slide.title}
                  onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                />
                <div className="slide-actions">
                  <button className="icon-btn edit" onClick={() => handleEdit(slide, index)} title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button className="icon-btn delete" onClick={() => handleDelete(slide._id, index)} title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
              <div className="slide-info">
                <span className="category-label">{slide.subtitle} • 🎯 {formatAudienceBadge(slide.targetAudience)}</span>
                <h3>{slide.title}</h3>
                <p>{slide.description.substring(0, 80)}...</p>
                <div className="feature-tags">
                  {slide.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="tag">{f}</span>
                  ))}
                  {slide.features.length > 3 && <span className="tag-more">+{slide.features.length - 3}</span>}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-grid-state">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <h3>No Categories Found</h3>
            <p>Start by adding your first category slide for the home page.</p>
            <button className="add-btn-minimal" onClick={handleAddNew}>Add Category</button>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {editingSlide && (
          <div className="modal-overlay" onClick={() => setEditingSlide(null)}>
            <motion.div
              className="slide-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{isAdding ? 'Add New Category' : `Edit: ${editingSlide.title}`}</h3>
                <button className="close-x" onClick={() => setEditingSlide(null)}>&times;</button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Main Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Anarkali Suits"
                      value={editingSlide.title}
                      onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtitle / Mood</label>
                    <input
                      type="text"
                      placeholder="e.g. Timeless Elegance"
                      value={editingSlide.subtitle}
                      onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>URL Slug * (Unique Identifier)</label>
                  <input
                    type="text"
                    placeholder="e.g. anarkali"
                    value={editingSlide.slug}
                    onChange={(e) => setEditingSlide({ ...editingSlide, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  />
                  <small>This will be used in the URL: /category/{"{slug}"}</small>
                </div>

                <div className="form-group">
                  <label>Target Audiences (Select 1 or Multiple)</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={normalizeAudience(editingSlide.targetAudience).includes('all')}
                        onChange={() => handleCategoryAudienceToggle('all')}
                      />
                      ALL
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#2563eb' }}>
                      <input
                        type="checkbox"
                        checked={normalizeAudience(editingSlide.targetAudience).includes('men')}
                        onChange={() => handleCategoryAudienceToggle('men')}
                      />
                      MEN
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#ec4899' }}>
                      <input
                        type="checkbox"
                        checked={normalizeAudience(editingSlide.targetAudience).includes('women')}
                        onChange={() => handleCategoryAudienceToggle('women')}
                      />
                      WOMEN
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    placeholder="Enter a compelling description..."
                    value={editingSlide.description}
                    onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Features (One per line)</label>
                  <textarea
                    rows="3"
                    placeholder="Premium Fabrics&#10;Handmade Details"
                    value={editingSlide.features.join('\n')}
                    onChange={(e) => setEditingSlide({ ...editingSlide, features: e.target.value.split('\n').filter(line => line.trim() !== '') })}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Category Visual (Image)</label>
                  <div className="image-upload-wrapper">
                    <div className="image-preview-large">
                      <img
                        src={getImageUrl(editingSlide.image)}
                        alt="Preview"
                        onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                      />
                    </div>
                    <div className="upload-controls">
                      <input
                        type="file"
                        id="cat-img-input"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="cat-img-input" className="upload-btn-fancy">
                        {uploading ? 'Uploading...' : 'Upload New Image'}
                      </label>
                      <p className="upload-hint">Recommended size: 1200 x 1600px (Portrait)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setEditingSlide(null)}>Cancel</button>
                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={isSaving || uploading}
                >
                  {isSaving ? 'Saving...' : isAdding ? 'Add Category' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`toast ${notification.type}`}
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

export default CategoryManager
