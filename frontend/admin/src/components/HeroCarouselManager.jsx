import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './HeroCarouselManager.css'

const HeroCarouselManager = () => {
  const [heroSlides, setHeroSlides] = useState([])
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    fetchHeroSlides()
    fetchProducts()
  }, [])

  const fetchHeroSlides = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`${API_ENDPOINTS.HERO_CAROUSEL}`, { auth: true })
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

  const handleAddSlide = () => {
    setEditingSlide(null)
    setSelectedProductId('')
    setSelectedImageIndex(0)
    setShowForm(true)
  }

  const handleEditSlide = (slide) => {
    setEditingSlide(slide)
    setSelectedProductId(slide.productId || '')
    setSelectedImageIndex(slide.imageIndex || 0)
    setShowForm(true)
  }

  const handleSaveSlide = async () => {
    if (!selectedProductId) {
      showNotification('Please select a product', 'error')
      return
    }

    const selectedProduct = products.find(p => p._id === selectedProductId)
    if (!selectedProduct || !selectedProduct.images || selectedProduct.images.length === 0) {
      showNotification('Selected product has no images', 'error')
      return
    }

    const imageUrl = selectedProduct.images[selectedImageIndex]
    
    try {
      setLoading(true)
      
      const slideData = {
        image: imageUrl,
        productId: selectedProductId,
        imageIndex: selectedImageIndex,
        product: {
          name: selectedProduct.name,
          category: selectedProduct.category,
          price: selectedProduct.price
        }
      }

      let response
      if (editingSlide) {
        response = await apiRequest(
          `${API_ENDPOINTS.HERO_CAROUSEL}/${editingSlide._id}`,
          {
            method: 'PUT',
            body: JSON.stringify(slideData),
            auth: true
          }
        )
      } else {
        response = await apiRequest(
          API_ENDPOINTS.HERO_CAROUSEL,
          {
            method: 'POST',
            body: JSON.stringify(slideData),
            auth: true
          }
        )
      }

      if (response.success) {
        showNotification(editingSlide ? 'Slide updated successfully' : 'Slide added successfully')
        setShowForm(false)
        fetchHeroSlides()
      } else {
        showNotification(response.message || 'Failed to save slide', 'error')
      }
    } catch (error) {
      console.error('Error saving slide:', error)
      showNotification('Error saving slide', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return

    try {
      setLoading(true)
      const response = await apiRequest(
        `${API_ENDPOINTS.HERO_CAROUSEL}/${slideId}`,
        {
          method: 'DELETE',
          auth: true
        }
      )

      if (response.success) {
        showNotification('Slide deleted successfully')
        fetchHeroSlides()
      } else {
        showNotification('Failed to delete slide', 'error')
      }
    } catch (error) {
      console.error('Error deleting slide:', error)
      showNotification('Error deleting slide', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find(p => p._id === selectedProductId)
  const selectedImages = selectedProduct?.images || []

  return (
    <div className="hero-carousel-manager">
      <div className="manager-header">
        <h2>🎨 Hero Section Carousel</h2>
        <button className="btn-primary" onClick={handleAddSlide}>
          + Add New Slide
        </button>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`notification notification-${notification.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}</h3>

              {/* Product Selection */}
              <div className="form-group">
                <label>Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value)
                    setSelectedImageIndex(0)
                  }}
                  className="form-select"
                >
                  <option value="">-- Choose a Product --</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.images?.length || 0} images)
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Selection */}
              {selectedImages.length > 0 && (
                <div className="form-group">
                  <label>Select Image from Product ({selectedImages.length} available)</label>
                  <div className="image-selector">
                    {selectedImages.map((image, index) => (
                      <motion.div
                        key={index}
                        className={`image-option ${selectedImageIndex === index ? 'selected' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img src={image} alt={`Product image ${index + 1}`} />
                        <div className="image-index">{index + 1}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {selectedImages[selectedImageIndex] && (
                <div className="form-group">
                  <label>Preview</label>
                  <div className="preview-container">
                    <img src={selectedImages[selectedImageIndex]} alt="Preview" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSaveSlide}
                  disabled={loading || !selectedProductId}
                >
                  {loading ? 'Saving...' : editingSlide ? 'Update Slide' : 'Add Slide'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Slides Display */}
      <div className="hero-slides-grid">
        {heroSlides.length === 0 ? (
          <div className="empty-state">
            <p>No hero slides yet. Create one to get started!</p>
          </div>
        ) : (
          heroSlides.map((slide, index) => (
            <motion.div
              key={slide._id}
              className="hero-slide-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="slide-image">
                <img src={slide.image} alt={`Hero slide ${index + 1}`} />
                <div className="slide-index">{index + 1}</div>
              </div>

              <div className="slide-info">
                <h4>{slide.product?.name || 'Product'}</h4>
                <p className="slide-category">{slide.product?.category}</p>
                {slide.product?.price && (
                  <p className="slide-price">₹{slide.product.price}</p>
                )}
              </div>

              <div className="slide-actions">
                <button
                  className="btn-icon edit"
                  onClick={() => handleEditSlide(slide)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon delete"
                  onClick={() => handleDeleteSlide(slide._id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default HeroCarouselManager
