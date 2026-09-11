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
  const [uploadProgress, setUploadProgress] = useState(0)
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
    setUploadProgress(0)
    showNotification('⚡ Starting fast video upload to Cloudinary...', 'info')

    try {
      let uploadedUrl = null

      // 1. Attempt Direct Browser-to-Cloudinary Fast Upload (Bypasses backend Node memory limits)
      try {
        const sigResponse = await apiRequest(`${API_ENDPOINTS.UPLOAD.SIGNATURE}?folder=seemee/videos&resource_type=video`, {
          method: 'GET',
          auth: true
        })

        if (sigResponse.success && sigResponse.data?.signature) {
          const { signature, timestamp, cloudName, apiKey, folder } = sigResponse.data

          const uploadData = new FormData()
          uploadData.append('file', file)
          uploadData.append('api_key', apiKey)
          uploadData.append('timestamp', timestamp)
          uploadData.append('signature', signature)
          uploadData.append('folder', folder)

          uploadedUrl = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, true)

            xhr.upload.onprogress = (evt) => {
              if (evt.lengthComputable) {
                const percent = Math.round((evt.loaded / evt.total) * 100)
                setUploadProgress(percent)
              }
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const resData = JSON.parse(xhr.responseText)
                  resolve(resData.secure_url)
                } catch (pErr) {
                  reject(pErr)
                }
              } else {
                reject(new Error(`Direct upload status ${xhr.status}`))
              }
            }

            xhr.onerror = () => reject(new Error('Direct upload network error'))
            xhr.send(uploadData)
          })
        }
      } catch (directErr) {
        console.warn('[Upload] Direct Cloudinary upload fallback to backend:', directErr.message)
      }

      // 2. Fallback to backend upload endpoint using XHR (No timeout limits + live progress tracking)
      if (!uploadedUrl) {
        showNotification('⚡ Uploading video via server stream...', 'info')
        const uploadData = new FormData()
        uploadData.append('video', file)

        const token = localStorage.getItem('adminToken')

        uploadedUrl = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', API_ENDPOINTS.UPLOAD.VIDEO, true)
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          }

          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const percent = Math.round((evt.loaded / evt.total) * 100)
              setUploadProgress(percent)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const resData = JSON.parse(xhr.responseText)
                if (resData.success) {
                  resolve(resData.data?.url || resData.data)
                } else {
                  reject(new Error(resData.message || 'Server upload failed'))
                }
              } catch (pErr) {
                reject(pErr)
              }
            } else {
              let errMsg = `Upload failed with status ${xhr.status}`
              try {
                const resData = JSON.parse(xhr.responseText)
                if (resData.message) errMsg = resData.message
              } catch (e) {}
              reject(new Error(errMsg))
            }
          }

          xhr.onerror = () => reject(new Error('Network error during video upload'))
          xhr.send(uploadData)
        })
      }

      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, videoUrl: uploadedUrl }))
        setUploadProgress(100)
        showNotification('⚡ Video uploaded & saved to Cloudinary successfully!')
      } else {
        throw new Error('Could not retrieve uploaded video URL')
      }
    } catch (err) {
      console.error('Video upload failed:', err)
      showNotification('Video upload failed: ' + (err.message || 'Error'), 'error')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1500)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      let uploadedUrl = null

      try {
        const sigResponse = await apiRequest(`${API_ENDPOINTS.UPLOAD.SIGNATURE}?folder=seemee/images&resource_type=image`, {
          method: 'GET',
          auth: true
        })

        if (sigResponse.success && sigResponse.data?.signature) {
          const { signature, timestamp, cloudName, apiKey, folder } = sigResponse.data

          const uploadData = new FormData()
          uploadData.append('file', file)
          uploadData.append('api_key', apiKey)
          uploadData.append('timestamp', timestamp)
          uploadData.append('signature', signature)
          uploadData.append('folder', folder)

          uploadedUrl = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true)

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const resData = JSON.parse(xhr.responseText)
                  resolve(resData.secure_url)
                } catch (pErr) {
                  reject(pErr)
                }
              } else {
                reject(new Error(`Direct image upload status ${xhr.status}`))
              }
            }

            xhr.onerror = () => reject(new Error('Direct image upload error'))
            xhr.send(uploadData)
          })
        }
      } catch (dErr) {
        console.warn('[Upload] Direct image upload fallback:', dErr.message)
      }

      if (!uploadedUrl) {
        const uploadData = new FormData()
        uploadData.append('image', file)

        const response = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
          method: 'POST',
          body: uploadData,
          isFormData: true,
          auth: true
        })

        if (response.success) {
          uploadedUrl = response.data?.url || response.data
        }
      }

      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, coverImage: uploadedUrl }))
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
                    <input type="file" accept="video/*" onChange={handleVideoUpload} id="video-upload-input" style={{ display: 'none' }} disabled={uploading} />
                    <label htmlFor="video-upload-input" className={`btn-upload-file ${uploading ? 'disabled' : ''}`} style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                      {uploading ? `⚡ Uploading Video (${uploadProgress}%)...` : '🎥 Upload Video File'}
                    </label>
                  </div>

                  {uploading && uploadProgress > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#B8860B', fontWeight: 'bold', marginBottom: '4px' }}>
                        <span>⚡ Uploading directly to Cloudinary...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #D4AF37 0%, #B8860B 100%)', transition: 'width 0.2s ease', borderRadius: '10px' }} />
                      </div>
                    </div>
                  )}
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
