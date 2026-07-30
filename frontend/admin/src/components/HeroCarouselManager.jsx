import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './HeroCarouselManager.css'

const HeroCarouselManager = ({ preSelectedProduct, onClearPreSelected }) => {
  const [heroSlides, setHeroSlides] = useState([])
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState('storyboard') // 'storyboard' or 'list'
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [customImage, setCustomImage] = useState('')
  const [order, setOrder] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')

  useEffect(() => {
    fetchHeroSlides()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (preSelectedProduct) {
      setEditingSlide(null)
      setSelectedProductId(preSelectedProduct._id)
      setSelectedImageIndex(0)
      setCustomImage('')
      setTitle(preSelectedProduct.name)
      setSubtitle(preSelectedProduct.category)
      
      const maxOrder = heroSlides.length > 0 
        ? Math.max(...heroSlides.map(s => s.order || 0)) 
        : 0
      setOrder(maxOrder + 1)
      setIsActive(true)
      setShowForm(true)
      
      if (typeof onClearPreSelected === 'function') {
        onClearPreSelected()
      }
    }
  }, [preSelectedProduct, heroSlides, onClearPreSelected])

  useEffect(() => {
    if (editingSlide) {
      setOrder(editingSlide.order || 1)
      setIsActive(editingSlide.isActive !== false)
      setTitle(editingSlide.title || editingSlide.productName || '')
      setSubtitle(editingSlide.subtitle || editingSlide.productCategory || '')
      setSelectedProductId(editingSlide.productId || '')
      
      const product = products.find(p => p._id === editingSlide.productId)
      if (product && product.images && product.images.includes(editingSlide.image)) {
        const idx = product.images.indexOf(editingSlide.image)
        setSelectedImageIndex(idx)
        setCustomImage('')
      } else {
        setCustomImage(editingSlide.image)
        setSelectedImageIndex(-1)
      }
    } else if (!preSelectedProduct) {
      const maxOrder = heroSlides.length > 0 
        ? Math.max(...heroSlides.map(s => s.order || 0)) 
        : 0
      setOrder(maxOrder + 1)
      setTitle('')
      setSubtitle('')
      setSelectedProductId('')
      setSelectedImageIndex(0)
      setCustomImage('')
      setIsActive(true)
    }
  }, [editingSlide, heroSlides, products, preSelectedProduct])

  const fetchHeroSlides = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`${API_ENDPOINTS.HERO_CAROUSEL_ALL}`, { auth: true })
      if (response.success) {
        setHeroSlides(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching hero slides:', error)
      showNotification('Failed to load hero slides', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await apiRequest(`${API_ENDPOINTS.PRODUCTS}?limit=100`, { auth: true })
      if (response.success) {
        setProducts(response.products || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleCustomImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        body: formData,
        isFormData: true,
        auth: true
      })

      if (response.success) {
        setCustomImage(response.data.url || response.data)
        setSelectedImageIndex(-1)
        showNotification('High-res visual connected successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showNotification('Upload failed. Check your connection.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveSlide = async () => {
    let imageUrl = ''
    if (customImage) {
      imageUrl = customImage
    } else if (selectedProductId) {
      const p = products.find(prod => prod._id === selectedProductId)
      if (p && p.images && p.images[selectedImageIndex]) {
        imageUrl = p.images[selectedImageIndex]
      }
    }

    if (!imageUrl) {
      showNotification('An image is required to publish', 'error')
      return
    }

    try {
      setLoading(true)
      const selectedProduct = products.find(p => p._id === selectedProductId)
      
      const slideData = {
        image: imageUrl,
        productId: selectedProductId || null,
        productName: selectedProduct?.name || '',
        productCategory: selectedProduct?.category || '',
        title: title || selectedProduct?.name || 'New Collection',
        subtitle: subtitle || selectedProduct?.category || 'Premium Edit',
        order: Number(order),
        isActive
      }

      const method = editingSlide ? 'PUT' : 'POST'
      const url = editingSlide 
        ? `${API_ENDPOINTS.HERO_CAROUSEL}/${editingSlide._id}`
        : API_ENDPOINTS.HERO_CAROUSEL

      const response = await apiRequest(url, {
        method,
        body: slideData,
        auth: true
      })

      if (response.success) {
        showNotification(editingSlide ? 'Slide updated' : 'New slide published to storefront')
        setShowForm(false)
        fetchHeroSlides()
      } else {
        showNotification(response.message || 'Save failed', 'error')
      }
    } catch (error) {
      console.error('Error saving slide:', error)
      showNotification('Connection error during save', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm('Delete this hero slide?')) return

    try {
      setLoading(true)
      const response = await apiRequest(`${API_ENDPOINTS.HERO_CAROUSEL}/${slideId}`, {
        method: 'DELETE',
        auth: true
      })

      if (response.success) {
        showNotification('Slide removed')
        fetchHeroSlides()
      }
    } catch (error) {
      showNotification('Error deleting slide', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (slide, direction) => {
    const newOrder = direction === 'up' ? slide.order - 1 : slide.order + 1
    if (newOrder < 1) return

    try {
      setLoading(true)
      const response = await apiRequest(`${API_ENDPOINTS.HERO_CAROUSEL}/${slide._id}`, {
        method: 'PUT',
        body: { order: newOrder },
        auth: true
      })

      if (response.success) {
        fetchHeroSlides()
      }
    } catch (error) {
      console.error('Error reordering:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p._id === selectedProductId)
  const selectedImages = selectedProduct?.images || []

  return (
    <div className="hero-carousel-manager">
      <div className="manager-header-lux">
        <div className="header-info">
          <h2> Homepage Hero Editor</h2>
          <p className="subtitle">Design the first moment of the customer journey</p>
        </div>
        
        <div className="header-actions">
          <div className="view-switcher">
            <button 
              className={viewMode === 'storyboard' ? 'active' : ''} 
              onClick={() => setViewMode('storyboard')}
            >
              Storyboard
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
            >
              Detailed List
            </button>
          </div>
          <button className="btn-add-hero" onClick={() => { setEditingSlide(null); setShowForm(true); }}>
            <span>+</span> Create Slide
          </button>
        </div>
      </div>

      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`lux-toast toast-${notification.type}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="lux-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="lux-modal-body"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-top">
                <h3>{editingSlide ? '🖋️ Edit Masterpiece' : '✨ New Hero Visual'}</h3>
                <button className="btn-close-lux" onClick={() => setShowForm(false)}>&times;</button>
              </div>

              <div className="lux-form-grid">
                <div className="lux-form-left">
                  <div className="form-section">
                    <label>🖼️ Visual Asset</label>
                    <div 
                      className={`lux-upload-zone ${uploading ? 'uploading' : ''} ${customImage || (selectedImages[selectedImageIndex]) ? 'active' : ''}`}
                      onClick={() => !uploading && document.getElementById('hero-file').click()}
                    >
                      {uploading ? (
                        <div className="upload-loader-lux">
                          <div className="spin-lux"></div>
                          <span>Optimizing asset...</span>
                        </div>
                      ) : customImage || (selectedImages[selectedImageIndex]) ? (
                        <div className="upload-preview-lux">
                          <img src={getImageUrl(customImage || selectedImages[selectedImageIndex])} alt="Preview" />
                          <div className="upload-change-overlay">Change Image</div>
                        </div>
                      ) : (
                        <div className="upload-prompt-lux">
                          <div className="icon">📸</div>
                          <p>Drop hi-res photo here</p>
                          <span>or click to browse files</span>
                        </div>
                      )}
                      <input id="hero-file" type="file" hidden accept="image/*" onChange={handleCustomImageUpload} />
                    </div>
                  </div>

                  <div className="form-section">
                    <label>🔗 Product Link (Optional)</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        const pid = e.target.value
                        setSelectedProductId(pid)
                        setSelectedImageIndex(0)
                        const p = products.find(prod => prod._id === pid)
                        if (p) {
                          if (!title) setTitle(p.name)
                          if (!subtitle) setSubtitle(p.category)
                        }
                      }}
                      className="lux-input"
                    >
                      <option value="">No Link</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="lux-form-right">
                  <div className="story-preview-container">
                    <label>Storyboard Preview</label>
                    <div className="story-preview">
                      <img 
                        src={getImageUrl(customImage || selectedImages[selectedImageIndex])} 
                        alt="Hero Preview" 
                        onError={(e) => e.target.src = '/images/placeholder.png'}
                      />
                      <div className="story-overlay">
                        <div className="story-text">
                          <span className="story-cat">{title || 'HEADLINE'}</span>
                          <span className="story-sub">{subtitle || 'Sub-headline text'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lux-meta-controls">
                    <div className="lux-group">
                      <label>Headline</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="lux-input" placeholder="e.g. SUMMER 24" />
                    </div>
                    <div className="lux-group">
                      <label>Subtitle</label>
                      <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="lux-input" placeholder="e.g. High Silk" />
                    </div>
                    <div className="lux-row">
                      <div className="lux-group">
                        <label>Order</label>
                        <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="lux-input" min="1" />
                      </div>
                      <div className="lux-group checkbox-lux">
                        <label className="toggle-lux">
                          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                          <span className="slider-lux"></span>
                          <span>Visible</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions-lux">
                <button className="btn-lux-text" onClick={() => setShowForm(false)}>Discard</button>
                <button className="btn-lux-primary" onClick={handleSaveSlide} disabled={loading}>
                  {loading ? 'Connecting...' : editingSlide ? 'Update Masterpiece' : 'Publish to Store'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hero-content-view">
        {loading && heroSlides.length === 0 ? (
          <div className="lux-loading-state">
            <div className="spin-lux large"></div>
            <p>Gathering your visual story...</p>
          </div>
        ) : heroSlides.length === 0 ? (
          <div className="lux-empty-state">
            <div className="empty-visual">🎨</div>
            <h3>Your Story Starts Here</h3>
            <p>Create your first hero slide to welcome visitors with style.</p>
            <button className="btn-lux-primary" onClick={() => setShowForm(true)}>Begin Creating</button>
          </div>
        ) : viewMode === 'storyboard' ? (
          <div className="storyboard-grid">
            {heroSlides.map((slide, index) => (
              <motion.div 
                key={slide._id} 
                className={`story-card ${!slide.isActive ? 'inactive' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="card-media">
                  <img src={getImageUrl(slide.image)} alt={slide.title} />
                  <div className="card-badge">#{slide.order}</div>
                  {!slide.isActive && <div className="card-status-label">HIDDEN</div>}
                </div>
                <div className="card-info">
                  <h4>{slide.title}</h4>
                  <p>{slide.subtitle}</p>
                </div>
                <div className="card-footer">
                  <div className="reorder-mini">
                    <button onClick={() => handleMove(slide, 'up')} disabled={index === 0}>▲</button>
                    <button onClick={() => handleMove(slide, 'down')} disabled={index === heroSlides.length - 1}>▼</button>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => { setEditingSlide(slide); setShowForm(true); }}>Edit</button>
                    <button className="delete" onClick={() => handleDeleteSlide(slide._id)}>Remove</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="lux-table-wrap">
            <table className="lux-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Visual</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Controls</th>
                </tr>
              </thead>
              <tbody>
                {heroSlides.map((slide, index) => (
                  <tr key={slide._id}>
                    <td>#{slide.order}</td>
                    <td><div className="table-img-lux"><img src={getImageUrl(slide.image)} alt="" /></div></td>
                    <td>
                      <div className="table-meta">
                        <strong>{slide.title}</strong>
                        <span>{slide.subtitle}</span>
                      </div>
                    </td>
                    <td><span className={`status-lux ${slide.isActive ? 'active' : 'hidden'}`}>{slide.isActive ? 'Live' : 'Hidden'}</span></td>
                    <td>
                      <div className="table-actions-lux">
                        <button onClick={() => handleMove(slide, 'up')} disabled={index === 0}>▲</button>
                        <button onClick={() => handleMove(slide, 'down')} disabled={index === heroSlides.length - 1}>▼</button>
                        <button className="edit" onClick={() => { setEditingSlide(slide); setShowForm(true); }}>Edit</button>
                        <button className="del" onClick={() => handleDeleteSlide(slide._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeroCarouselManager
