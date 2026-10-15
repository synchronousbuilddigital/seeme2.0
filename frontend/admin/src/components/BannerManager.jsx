import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './BannerManager.css'

const EMPTY_BANNER = {
  _id: '',
  image: '',
  link: '/collections',
  showOverlay: false,
  tagline: '',
  title: '',
  titleHighlight: '',
  subtitle: '',
  buttonText: '',
  buttonLink: '/collections',
  isActive: true,
  order: 0
}

const BannerManager = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(`${API_ENDPOINTS.SITE_SETTINGS}?_t=${Date.now()}`)
      if (data.success && data.data) {
        let list = []
        if (Array.isArray(data.data.promoBanners) && data.data.promoBanners.length > 0) {
          list = data.data.promoBanners
        } else if (data.data.festiveBanner && data.data.festiveBanner.image) {
          list = [{
            ...EMPTY_BANNER,
            ...data.data.festiveBanner,
            _id: 'default_1',
            order: 0
          }]
        }
        setBanners(list)
      }
    } catch (err) {
      console.error('Failed to load promo banners:', err)
      showNotification('Failed to load promo banners', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' })
    }, 3500)
  }

  const saveBannersToBackend = async (updatedList) => {
    setSaving(true)
    try {
      // Clean and ensure orders
      const payloadBanners = updatedList.map((b, idx) => ({
        _id: b._id || undefined,
        image: (b.image || '').trim(),
        link: (b.buttonLink || b.link || '/collections').trim(),
        buttonLink: (b.buttonLink || b.link || '/collections').trim(),
        showOverlay: Boolean(b.showOverlay),
        tagline: (b.tagline || '').trim(),
        title: (b.title || '').trim(),
        titleHighlight: (b.titleHighlight || '').trim(),
        subtitle: (b.subtitle || '').trim(),
        buttonText: (b.buttonText || '').trim(),
        isActive: b.isActive !== false,
        order: idx
      }))

      const res = await apiRequest(API_ENDPOINTS.SITE_SETTINGS, {
        method: 'PUT',
        auth: true,
        body: { promoBanners: payloadBanners }
      })

      if (res.success) {
        if (Array.isArray(res.data?.promoBanners)) {
          setBanners(res.data.promoBanners)
        } else {
          setBanners(updatedList)
        }
        showNotification('Banners saved and published successfully!')
      } else {
        showNotification(res.message || 'Failed to save banners', 'error')
      }
    } catch (err) {
      console.error('Error saving banners:', err)
      showNotification(err.message || 'Failed to save banners', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNew = () => {
    setEditingBanner({
      ...EMPTY_BANNER,
      _id: `temp_${Date.now()}`,
      order: banners.length
    })
    setIsAdding(true)
    setUrlInput('')
  }

  const handleEdit = (bannerItem) => {
    setEditingBanner({ ...bannerItem })
    setIsAdding(false)
    setUrlInput(bannerItem.image || '')
  }

  const handleDelete = async (indexToDelete) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return
    const updated = banners.filter((_, idx) => idx !== indexToDelete)
    setBanners(updated)
    await saveBannersToBackend(updated)
  }

  const handleToggleActive = async (indexToToggle) => {
    const updated = banners.map((b, idx) => {
      if (idx === indexToToggle) {
        return { ...b, isActive: !b.isActive }
      }
      return b
    })
    setBanners(updated)
    await saveBannersToBackend(updated)
  }

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= banners.length) return

    const updated = [...banners]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    setBanners(updated)
    await saveBannersToBackend(updated)
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file (JPG, PNG, WebP)', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification('Image size must be under 10MB', 'error')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: formData
      })

      if (response.success && response.data) {
        const uploadedUrl = response.data.url || response.data.secure_url || getImageUrl(response.data)
        setEditingBanner(prev => ({ ...prev, image: uploadedUrl }))
        setUrlInput(uploadedUrl)
        showNotification('Banner image uploaded successfully!')
      } else {
        showNotification(response.message || 'Image upload failed', 'error')
      }
    } catch (err) {
      console.error('Banner upload error:', err)
      showNotification(err.message || 'Error uploading banner image', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      showNotification('Please enter a valid image URL', 'error')
      return
    }
    setEditingBanner(prev => ({ ...prev, image: urlInput.trim() }))
    showNotification('Image URL applied')
  }

  const handleModalSave = async () => {
    if (!editingBanner.image || !editingBanner.image.trim()) {
      showNotification('Please upload or provide an image for the banner', 'error')
      return
    }

    let updated
    if (isAdding) {
      updated = [...banners, editingBanner]
    } else {
      updated = banners.map(b => (b._id === editingBanner._id ? editingBanner : b))
    }

    setEditingBanner(null)
    setBanners(updated)
    await saveBannersToBackend(updated)
  }

  if (loading) {
    return (
      <div className="banner-manager-loading">
        <div className="bm-spinner" />
        <p>Loading Promo Banners...</p>
      </div>
    )
  }

  const activeCount = banners.filter(b => b.isActive && b.image).length

  return (
    <div className="banner-manager-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`bm-notification ${notification.type}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
          >
            <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="bm-header">
        <div className="bm-header-title">
          <h2>Promo Banners Manager</h2>
          <p>
            Upload and control multiple banners below the Hero section. Multiple active banners will automatically turn into a luxury sliding carousel on the storefront.
          </p>
        </div>

        <div className="bm-header-actions">
          <span className="bm-badge-counter">
            {banners.length} {banners.length === 1 ? 'Banner' : 'Banners'} ({activeCount} Active)
          </span>

          <button
            type="button"
            className="bm-add-btn"
            onClick={handleAddNew}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add New Banner</span>
          </button>
        </div>
      </div>

      {/* Banners List / Grid */}
      {banners.length === 0 ? (
        <div className="bm-empty-state-card">
          <div className="bm-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="7" cy="12" r="1.5" />
              <path d="M11 15h7M11 9h4" />
            </svg>
          </div>
          <h3>No Promo Banners Added Yet</h3>
          <p>Add your first promotional banner (e.g. Diwali Collection, Summer Edit, Festival Offers) to display below the hero section.</p>
          <button type="button" className="bm-empty-add-btn" onClick={handleAddNew}>
            + Add Your First Banner
          </button>
        </div>
      ) : (
        <div className="bm-banners-grid">
          {banners.map((item, idx) => (
            <motion.div
              key={item._id || idx}
              className={`bm-banner-card ${!item.isActive ? 'inactive' : ''}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="bm-card-top-row">
                <span className="bm-card-order-tag">Slide #{idx + 1}</span>
                <div className="bm-card-status-wrapper">
                  <button
                    type="button"
                    className={`bm-status-btn ${item.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleActive(idx)}
                    title={item.isActive ? 'Click to hide banner' : 'Click to make live'}
                  >
                    {item.isActive ? '● Live' : '○ Draft'}
                  </button>
                </div>
              </div>

              {/* Banner Image Preview */}
              <div className="bm-card-media-wrap">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.title || `Banner #${idx + 1}`}
                  className="bm-card-thumbnail"
                />
                {item.showOverlay && (item.title || item.tagline) && (
                  <div className="bm-card-overlay-indicator">
                    <span>✍️ Overlay Active</span>
                  </div>
                )}
              </div>

              {/* Banner Metadata Info */}
              <div className="bm-card-details">
                <div className="bm-card-text-preview">
                  <h4>{item.title ? `${item.title} ${item.titleHighlight || ''}` : (item.tagline || 'Custom Banner')}</h4>
                  <p className="bm-card-link-text">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>{item.buttonLink || item.link || '/collections'}</span>
                  </p>
                </div>

                <div className="bm-card-footer-actions">
                  <div className="bm-order-btns">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, -1)}
                      title="Move slide left / up"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1}
                      onClick={() => handleMoveOrder(idx, 1)}
                      title="Move slide right / down"
                    >
                      →
                    </button>
                  </div>

                  <div className="bm-action-buttons">
                    <button
                      type="button"
                      className="bm-action-btn edit"
                      onClick={() => handleEdit(item)}
                      title="Edit banner content and image"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="bm-action-btn delete"
                      onClick={() => handleDelete(idx)}
                      title="Delete banner"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editingBanner && (
          <div className="bm-modal-backdrop" onClick={() => setEditingBanner(null)}>
            <motion.div
              className="bm-modal-container"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bm-modal-header">
                <div>
                  <h3>{isAdding ? 'Add New Promo Banner' : 'Edit Promo Banner'}</h3>
                  <p>Recommended size: 1920×450px panoramic banner image</p>
                </div>
                <button
                  type="button"
                  className="bm-modal-close"
                  onClick={() => setEditingBanner(null)}
                >
                  ✕
                </button>
              </div>

              <div className="bm-modal-body">
                {/* Upload Section */}
                <div className="bm-modal-section">
                  <label className="bm-section-label">Banner Image *</label>
                  <div
                    className={`bm-dropzone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0])
                      }}
                    />

                    {uploading ? (
                      <div className="bm-dropzone-uploading">
                        <div className="bm-spinner" />
                        <p>Uploading to cloud storage...</p>
                      </div>
                    ) : (
                      <div className="bm-dropzone-content">
                        <div className="bm-upload-icon-circle">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <h4>Click to choose image or drag & drop here</h4>
                        <p>PNG, JPG, WEBP (under 10MB)</p>
                      </div>
                    )}
                  </div>

                  {/* URL Input */}
                  <div className="bm-url-input-wrap" style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://res.cloudinary.com/...)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <button type="button" className="bm-apply-url-btn" onClick={handleApplyUrl}>
                      Apply URL
                    </button>
                  </div>
                </div>

                {/* Destination Link */}
                <div className="bm-modal-section">
                  <label className="bm-section-label">Click Destination Link</label>
                  <input
                    type="text"
                    className="bm-modal-input"
                    placeholder="e.g. /collections or /category/suits"
                    value={editingBanner.buttonLink || editingBanner.link || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, buttonLink: e.target.value, link: e.target.value })}
                  />
                </div>

                {/* Active Toggle */}
                <div className="bm-modal-section">
                  <div className="bm-toggle-row">
                    <div>
                      <strong>Banner Visibility</strong>
                      <p>Publish live on storefront</p>
                    </div>
                    <label className="bm-status-toggle">
                      <span className="bm-toggle-label">{editingBanner.isActive ? 'Active' : 'Hidden'}</span>
                      <input
                        type="checkbox"
                        checked={editingBanner.isActive}
                        onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                      />
                      <span className="bm-toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* Optional Text Overlay */}
                <div className="bm-modal-section">
                  <div className="bm-toggle-row">
                    <div>
                      <strong>Optional: Text Overlay on Banner</strong>
                      <p>Enable only if your image does not already contain designed text</p>
                    </div>
                    <label className="bm-status-toggle">
                      <span className="bm-toggle-label">{editingBanner.showOverlay ? 'Enabled' : 'Disabled'}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(editingBanner.showOverlay)}
                        onChange={(e) => setEditingBanner({ ...editingBanner, showOverlay: e.target.checked })}
                      />
                      <span className="bm-toggle-slider" />
                    </label>
                  </div>

                  {editingBanner.showOverlay && (
                    <div className="bm-overlay-fields">
                      <div className="bm-field">
                        <label>Tagline Badge</label>
                        <input
                          type="text"
                          placeholder="e.g. DIWALI EDIT"
                          value={editingBanner.tagline || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, tagline: e.target.value })}
                        />
                      </div>

                      <div className="bm-field-row">
                        <div className="bm-field">
                          <label>Title Prefix</label>
                          <input
                            type="text"
                            placeholder="e.g. Celebrate in"
                            value={editingBanner.title || ''}
                            onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                          />
                        </div>
                        <div className="bm-field">
                          <label>Title Highlight (Italic Script)</label>
                          <input
                            type="text"
                            placeholder="e.g. Royal Elegance"
                            value={editingBanner.titleHighlight || ''}
                            onChange={(e) => setEditingBanner({ ...editingBanner, titleHighlight: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="bm-field">
                        <label>Subtitle</label>
                        <input
                          type="text"
                          placeholder="e.g. Festive silhouettes crafted for luminous celebrations"
                          value={editingBanner.subtitle || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                        />
                      </div>

                      <div className="bm-field">
                        <label>Button Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Shop Collection"
                          value={editingBanner.buttonText || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Preview Box */}
                {editingBanner.image && (
                  <div className="bm-modal-preview">
                    <label className="bm-section-label">Live Preview</label>
                    <div className="bm-modal-preview-box">
                      <img
                        src={getImageUrl(editingBanner.image)}
                        alt="Preview"
                        className="bm-modal-preview-img"
                      />
                      {editingBanner.showOverlay && (
                        <div className="bm-preview-overlay-content">
                          {editingBanner.tagline && (
                            <div className="bm-preview-tagline">
                              <span className="bm-gold-line" />
                              <span className="bm-tagline-text">{editingBanner.tagline}</span>
                              <span className="bm-gold-line" />
                            </div>
                          )}

                          {(editingBanner.title || editingBanner.titleHighlight) && (
                            <h3 className="bm-preview-title">
                              {editingBanner.title} <span className="bm-title-highlight">{editingBanner.titleHighlight}</span>
                            </h3>
                          )}

                          {editingBanner.subtitle && (
                            <p className="bm-preview-subtext">{editingBanner.subtitle}</p>
                          )}

                          {editingBanner.buttonText && (
                            <div className="bm-preview-btn-wrap">
                              <span className="bm-preview-cta">
                                <span>{editingBanner.buttonText}</span>
                                <span className="bm-preview-arrow">→</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bm-modal-footer">
                <button
                  type="button"
                  className="bm-modal-cancel-btn"
                  onClick={() => setEditingBanner(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bm-modal-save-btn"
                  onClick={handleModalSave}
                  disabled={saving || uploading}
                >
                  {saving ? 'Saving...' : isAdding ? 'Add Banner' : 'Update Banner'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BannerManager
