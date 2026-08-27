import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './BrandManager.css'

const BrandManager = () => {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [audienceFilter, setAudienceFilter] = useState('men')
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  // Form State
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [image, setImage] = useState('')
  const [bgImage, setBgImage] = useState('')
  const [bgColor, setBgColor] = useState('#D1F2EE')
  const [targetAudience, setTargetAudience] = useState(['men'])
  const [buttonText, setButtonText] = useState('Products ↗')
  const [link, setLink] = useState('')
  const [order, setOrder] = useState(1)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(`${API_ENDPOINTS.BRANDS}?admin=true`)
      if (data.success && Array.isArray(data.data)) {
        setBrands(data.data)
      }
    } catch (err) {
      console.error('Error fetching brands:', err)
      showNotification('Failed to load brands', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const normalizeAudience = (val) => {
    if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase())
    if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
    return ['men']
  }

  const handleAudienceToggle = (val) => {
    setTargetAudience(prev => {
      const arr = Array.isArray(prev) ? prev : [prev]
      if (arr.includes(val)) {
        const next = arr.filter(v => v !== val)
        return next.length > 0 ? next : ['men']
      } else {
        return [...arr, val]
      }
    })
  }

  const handleOpenForm = (brand = null) => {
    if (brand) {
      setEditingBrand(brand)
      setName(brand.name || '')
      setTagline(brand.tagline || '')
      setImage(brand.image || '')
      setBgImage(brand.bgImage || '')
      setBgColor(brand.bgColor || '#D1F2EE')
      setTargetAudience(normalizeAudience(brand.targetAudience))
      setButtonText(brand.buttonText || 'Products ↗')
      setLink(brand.link || '')
      setOrder(brand.order !== undefined ? brand.order : 1)
      setIsActive(brand.isActive !== false)
    } else {
      setEditingBrand(null)
      setName('')
      setTagline('')
      setImage('')
      setBgImage('')
      setBgColor('#D1F2EE')
      setTargetAudience([audienceFilter === 'all' ? 'men' : audienceFilter])
      setButtonText('Products ↗')
      setLink('')
      setOrder(brands.length + 1)
      setIsActive(true)
    }
    setShowForm(true)
  }

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      if (type === 'avatar') setUploadingAvatar(true)
      else setUploadingBg(true)

      const data = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: formData
      })

      if (data.success) {
        const uploadedUrl = data.data.url || data.data.secure_url || getImageUrl(data.data)
        if (type === 'avatar') {
          setImage(uploadedUrl)
          showNotification('Brand Avatar uploaded successfully')
        } else {
          setBgImage(uploadedUrl)
          showNotification('Brand Background uploaded successfully')
        }
      } else {
        showNotification(data.message || 'Upload failed', 'error')
      }
    } catch (err) {
      console.error('Upload error:', err)
      showNotification(err.message || 'Failed to upload image', 'error')
    } finally {
      if (type === 'avatar') setUploadingAvatar(false)
      else setUploadingBg(false)
    }
  }

  const handleSaveBrand = async () => {
    if (!name.trim()) {
      showNotification('Brand Name is required', 'error')
      return
    }
    if (!image.trim()) {
      showNotification('Brand Avatar Image is required', 'error')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: name.trim(),
        tagline: tagline.trim(),
        image: image.trim(),
        bgImage: bgImage.trim(),
        bgColor: bgColor.trim() || '#D1F2EE',
        targetAudience: targetAudience.length > 0 ? targetAudience : ['men'],
        buttonText: buttonText.trim() || 'Products ↗',
        link: link.trim(),
        order: Number(order),
        isActive
      }

      let res
      if (editingBrand) {
        res = await apiRequest(`${API_ENDPOINTS.BRANDS}/${editingBrand._id}`, {
          method: 'PUT',
          auth: true,
          body: payload
        })
      } else {
        res = await apiRequest(API_ENDPOINTS.BRANDS, {
          method: 'POST',
          auth: true,
          body: payload
        })
      }

      if (res.success) {
        showNotification(editingBrand ? 'Brand updated successfully' : 'Brand created successfully')
        setShowForm(false)
        fetchBrands()
      } else {
        showNotification(res.message || 'Failed to save brand', 'error')
      }
    } catch (err) {
      console.error('Save brand error:', err)
      showNotification(err.message || 'Error saving brand', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return

    try {
      const res = await apiRequest(`${API_ENDPOINTS.BRANDS}/${id}`, {
        method: 'DELETE',
        auth: true
      })
      if (res.success) {
        showNotification('Brand deleted successfully')
        fetchBrands()
      }
    } catch (err) {
      console.error('Delete brand error:', err)
      showNotification(err.message || 'Error deleting brand', 'error')
    }
  }

  const displayedBrands = brands.filter(b => {
    const arr = normalizeAudience(b.targetAudience)
    return arr.includes(audienceFilter.toLowerCase())
  })

  const formatAudienceBadge = (val) => {
    if (Array.isArray(val)) return val.map(v => (v || '').toUpperCase()).join(', ')
    if (typeof val === 'string' && val.trim()) return val.toUpperCase()
    return 'MEN'
  }

  return (
    <div className="brand-manager-container">
      {/* Header Bar */}
      <div className="brand-manager-header">
        <div>
          <h2>🏢 Brands Manager</h2>
          <p>Manage "BRANDS THAT LEAD" showcase cards displayed on the storefront.</p>
        </div>

        <div className="header-controls">
          <div className="audience-filter-bar">
            <span className="filter-label">Filter:</span>
            <button
              className={`filter-btn ${audienceFilter === 'all' ? 'active' : ''}`}
              onClick={() => setAudienceFilter('all')}
            >
              🌐 ALL ({brands.filter(b => normalizeAudience(b.targetAudience).includes('all')).length})
            </button>
            <button
              className={`filter-btn men ${audienceFilter === 'men' ? 'active' : ''}`}
              onClick={() => setAudienceFilter('men')}
            >
              👨 MEN ({brands.filter(b => normalizeAudience(b.targetAudience).includes('men')).length})
            </button>
            <button
              className={`filter-btn women ${audienceFilter === 'women' ? 'active' : ''}`}
              onClick={() => setAudienceFilter('women')}
            >
              👩 WOMEN ({brands.filter(b => normalizeAudience(b.targetAudience).includes('women')).length})
            </button>
          </div>

          <button className="btn-add-brand" onClick={() => handleOpenForm(null)}>
            <span>+</span> Create Brand
          </button>
        </div>
      </div>

      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`brand-toast toast-${notification.type}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="brand-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="brand-modal-body"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{editingBrand ? '✏️ Edit Brand' : '✨ Add New Brand'}</h3>
                <button className="close-btn" onClick={() => setShowForm(false)}>&times;</button>
              </div>

              <div className="modal-form-grid">
                {/* Form Inputs */}
                <div className="form-column">
                  <div className="form-group">
                    <label>Brand Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. BARE ANATOMY"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Subtitle / Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. Science-Backed Hair Care"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Audiences</label>
                    <div className="checkbox-row">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={targetAudience.includes('all')}
                          onChange={() => handleAudienceToggle('all')}
                        />
                        <span>🌐 ALL</span>
                      </label>
                      <label className="checkbox-item men">
                        <input
                          type="checkbox"
                          checked={targetAudience.includes('men')}
                          onChange={() => handleAudienceToggle('men')}
                        />
                        <span>👨 MEN</span>
                      </label>
                      <label className="checkbox-item women">
                        <input
                          type="checkbox"
                          checked={targetAudience.includes('women')}
                          onChange={() => handleAudienceToggle('women')}
                        />
                        <span>👩 WOMEN</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Background Color</label>
                      <div className="color-picker-group">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="color-input"
                        />
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="form-input hex-input"
                        />
                      </div>
                    </div>

                    <div className="form-group flex-1">
                      <label>Button Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Products ↗"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Category / Collection Slug Link</label>
                    <input
                      type="text"
                      placeholder="e.g. hair-care or men-grooming"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Display Order</label>
                      <input
                        type="number"
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                        className="form-input"
                        min="0"
                      />
                    </div>
                    <div className="form-group flex-1 toggle-group">
                      <label>Visibility</label>
                      <label className="switch-toggle">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <span className="slider"></span>
                        <span className="switch-label">{isActive ? 'Active' : 'Hidden'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Image Uploads & Visual Live Preview */}
                <div className="preview-column">
                  <div className="form-group">
                    <label>Circular Avatar Image *</label>
                    <div className="file-upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                        disabled={uploadingAvatar}
                      />
                      <span>{uploadingAvatar ? 'Uploading Avatar...' : 'Click to Upload Avatar Image'}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Background Banner Image (Optional)</label>
                    <div className="file-upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'bg')}
                        disabled={uploadingBg}
                      />
                      <span>{uploadingBg ? 'Uploading Banner...' : 'Click to Upload Background Image'}</span>
                    </div>
                  </div>

                  {/* Live UI Mockup Preview matching user's design */}
                  <div className="live-preview-section">
                    <label>Live Card Preview</label>
                    <div
                      className="preview-brand-card"
                      style={{
                        backgroundColor: bgColor || '#D1F2EE',
                        backgroundImage: bgImage ? `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${getImageUrl(bgImage)})` : 'none'
                      }}
                    >
                      <div className="preview-avatar-circle">
                        <img
                          src={getImageUrl(image) || '/images/placeholder.jpg'}
                          alt="Brand Avatar"
                          onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                        />
                      </div>

                      <div className="preview-card-content">
                        <h4 className="preview-title">{name || 'BRAND NAME'}</h4>
                        <p className="preview-subtitle">{tagline || 'Tagline / Subtitle'}</p>
                        <button type="button" className="preview-pill-btn">
                          {buttonText || 'Products ↗'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-save" onClick={handleSaveBrand} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brands Grid */}
      <div className="brands-grid-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading brand showcases...</p>
          </div>
        ) : displayedBrands.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No Brands Found for {audienceFilter.toUpperCase()}</h3>
            <p>Click "Create Brand" to publish a new brand showcase card.</p>
            <button className="btn-add-brand" onClick={() => handleOpenForm(null)}>+ Create Brand</button>
          </div>
        ) : (
          <div className="brands-cards-grid">
            {displayedBrands.map((brand) => (
              <div key={brand._id} className={`brand-item-card ${!brand.isActive ? 'inactive' : ''}`}>
                <div
                  className="brand-card-top"
                  style={{
                    backgroundColor: brand.bgColor || '#D1F2EE',
                    backgroundImage: brand.bgImage ? `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${getImageUrl(brand.bgImage)})` : 'none'
                  }}
                >
                  <div className="card-avatar-wrap">
                    <img
                      src={getImageUrl(brand.image)}
                      alt={brand.name}
                      onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                    />
                  </div>

                  <div className="card-content-area">
                    <span className="card-audience-badge">🎯 {formatAudienceBadge(brand.targetAudience)}</span>
                    <h3 className="card-brand-name">{brand.name}</h3>
                    <p className="card-brand-tagline">{brand.tagline}</p>
                    <div className="card-pill-action">
                      <span className="card-btn-pill">{brand.buttonText || 'Products ↗'}</span>
                    </div>
                  </div>

                  {!brand.isActive && <div className="hidden-badge">HIDDEN</div>}
                </div>

                <div className="brand-card-footer">
                  <div className="card-order-tag">Order: #{brand.order || 0}</div>
                  <div className="card-action-btns">
                    <button className="btn-edit" onClick={() => handleOpenForm(brand)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeleteBrand(brand._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrandManager
