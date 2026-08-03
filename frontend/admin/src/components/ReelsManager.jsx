import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './ReelsManager.css'

const ReelsManager = () => {
  const [reels, setReels] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingReel, setEditingReel] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    videoUrl: '',
    coverImage: '',
    product: '',
    order: 1,
    isActive: true
  })

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    fetchReels()
    fetchProducts()
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const fetchReels = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(API_ENDPOINTS.REELS_ALL, { auth: true })
      if (response.success) {
        setReels(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching reels:', err)
      showNotification('Failed to load reels', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.PRODUCTS)
      if (response.success) {
        setProducts(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const handleOpenAddModal = () => {
    setEditingReel(null)
    const maxOrder = reels.length > 0 ? Math.max(...reels.map(r => r.order || 0)) : 0
    setFormData({
      title: '',
      caption: '',
      videoUrl: '',
      coverImage: '',
      product: '',
      order: maxOrder + 1,
      isActive: true
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (reel) => {
    setEditingReel(reel)
    setFormData({
      title: reel.title || '',
      caption: reel.caption || '',
      videoUrl: reel.videoUrl || '',
      coverImage: reel.coverImage || '',
      product: reel.product?._id || reel.product || '',
      order: reel.order || 1,
      isActive: reel.isActive !== false
    })
    setShowModal(true)
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    showNotification('⚡ Uploading video to Cloudinary...', 'info')
    try {
      const uploadData = new FormData()
      uploadData.append('video', file)

      const endpoint = API_ENDPOINTS.UPLOAD.VIDEO
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: uploadData,
        isFormData: true,
        auth: true
      })

      if (response.success) {
        const url = response.data?.url || response.data
        setFormData(prev => ({ ...prev, videoUrl: url }))
        showNotification('⚡ Video saved to Cloudinary successfully!')
      }
    } catch (err) {
      console.error('Video upload failed:', err)
      showNotification('Video upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('image', file)

      const response = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        body: uploadData,
        isFormData: true,
        auth: true
      })

      if (response.success) {
        const url = response.data?.url || response.data
        setFormData(prev => ({ ...prev, coverImage: url }))
        showNotification('Poster image uploaded successfully!')
      }
    } catch (err) {
      console.error('Cover upload failed:', err)
      showNotification('Image upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.videoUrl) {
      showNotification('Title and Video URL are required', 'error')
      return
    }

    try {
      setLoading(true)
      const url = editingReel
        ? `${API_ENDPOINTS.REELS}/${editingReel._id}`
        : API_ENDPOINTS.REELS
      const method = editingReel ? 'PUT' : 'POST'

      const response = await apiRequest(url, {
        method,
        body: formData,
        auth: true
      })

      if (response.success) {
        showNotification(editingReel ? 'Reel updated successfully!' : 'Reel created successfully!')
        setShowModal(false)
        fetchReels()
      }
    } catch (err) {
      console.error('Error saving reel:', err)
      showNotification('Failed to save reel', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reelId) => {
    if (!window.confirm('Are you sure you want to delete this Reel?')) return

    try {
      setLoading(true)
      const response = await apiRequest(`${API_ENDPOINTS.REELS}/${reelId}`, {
        method: 'DELETE',
        auth: true
      })

      if (response.success) {
        showNotification('Reel deleted successfully!')
        fetchReels()
      }
    } catch (err) {
      console.error('Error deleting reel:', err)
      showNotification('Failed to delete reel', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (reel) => {
    try {
      const response = await apiRequest(`${API_ENDPOINTS.REELS}/${reel._id}`, {
        method: 'PUT',
        body: { isActive: !reel.isActive },
        auth: true
      })

      if (response.success) {
        showNotification(`Reel ${!reel.isActive ? 'activated' : 'deactivated'}`)
        fetchReels()
      }
    } catch (err) {
      console.error('Error toggling reel status:', err)
    }
  }

  return (
    <div className="reels-manager-container">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`admin-notification ${notification.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="reels-header">
        <div>
          <h1 className="reels-title">✦ Catalog Reels Studio</h1>
          <p className="reels-subtitle">Manage Instagram-style video reels linked with store products</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn-add-reel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create New Reel</span>
        </button>
      </header>

      {/* Reels Grid List */}
      {loading && reels.length === 0 ? (
        <div className="reels-loading">Loading Catalog Reels...</div>
      ) : reels.length === 0 ? (
        <div className="reels-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          <h3>No Catalog Reels Yet</h3>
          <p>Create your first Instagram-style video reel to feature products in the catalog.</p>
          <button onClick={handleOpenAddModal} className="btn-add-reel">Add First Reel</button>
        </div>
      ) : (
        <div className="reels-grid">
          {reels.map((reel) => {
            const linkedProd = reel.product
            return (
              <motion.div key={reel._id} className="reel-card" layout>
                <div className="reel-media-preview">
                  {reel.videoUrl ? (
                    <video
                      src={getImageUrl(reel.videoUrl)}
                      poster={reel.coverImage ? getImageUrl(reel.coverImage) : undefined}
                      muted
                      loop
                      onMouseOver={(e) => e.target.play().catch(() => {})}
                      onMouseOut={(e) => e.target.pause()}
                      className="reel-video"
                    />
                  ) : (
                    <div className="no-video">No Video</div>
                  )}
                  <span className={`status-badge ${reel.isActive !== false ? 'active' : 'inactive'}`}>
                    {reel.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                  <span className="order-badge">#{reel.order || 1}</span>
                </div>

                <div className="reel-info">
                  <h3 className="reel-card-title">{reel.title}</h3>
                  {reel.caption && <p className="reel-card-caption">{reel.caption}</p>}
                  
                  {linkedProd ? (
                    <div className="reel-linked-product">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                      <span>{linkedProd.name} (₹{linkedProd.price})</span>
                    </div>
                  ) : (
                    <div className="reel-no-product">No Linked Product</div>
                  )}

                  <div className="reel-stats">
                    <span>❤️ {reel.likesCount || 0} Likes</span>
                  </div>

                  <div className="reel-actions">
                    <button 
                      onClick={() => handleToggleActive(reel)} 
                      className={`btn-toggle ${reel.isActive !== false ? 'active' : ''}`}
                    >
                      {reel.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleOpenEditModal(reel)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(reel._id)} className="btn-delete">Delete</button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal Form for Add / Edit Reel */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h2>{editingReel ? 'Edit Catalog Reel' : 'Add New Catalog Reel'}</h2>
                <button onClick={() => setShowModal(false)} className="btn-close">×</button>
              </div>

              <form onSubmit={handleSubmit} className="reel-form">
                <div className="form-group">
                  <label>Reel Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Royal Silk Lehenga Reel"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Caption / Story Description</label>
                  <textarea
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="e.g. Handcrafted gold zardozi work in action..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Video URL or Upload *</label>
                  <input
                    type="text"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="Paste Video URL (MP4 / Cloudinary link)"
                    required
                  />
                  <div className="upload-row">
                    <input type="file" accept="video/*" onChange={handleVideoUpload} id="video-upload-input" style={{ display: 'none' }} />
                    <label htmlFor="video-upload-input" className="btn-upload-file">
                      {uploading ? 'Uploading Video...' : '🎥 Upload Video File'}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Poster / Cover Image URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="Thumbnail image URL"
                  />
                  <div className="upload-row">
                    <input type="file" accept="image/*" onChange={handleCoverUpload} id="cover-upload-input" style={{ display: 'none' }} />
                    <label htmlFor="cover-upload-input" className="btn-upload-file">
                      {uploading ? 'Uploading Cover...' : '🖼️ Upload Cover Image'}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Link to Store Product (Adds to Wishlist on Reel Like)</label>
                  <select
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Order Number</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span>Is Active</span>
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" disabled={loading || uploading} className="btn-save">
                    {loading ? 'Saving...' : editingReel ? 'Update Reel' : 'Publish Reel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReelsManager
