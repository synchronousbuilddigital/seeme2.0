import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../utils/imageHelper'
import './CollectionManager.css'

const CollectionManager = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [collectionCount, setCollectionCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableProducts, setAvailableProducts] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'anarkali',
    price: '',
    sizeStock: [
      { size: 'XS', quantity: 0 },
      { size: 'S', quantity: 0 },
      { size: 'M', quantity: 0 },
      { size: 'L', quantity: 0 },
      { size: 'XL', quantity: 0 },
      { size: 'XXL', quantity: 0 }
    ],
    featured: false,
    images: [],
    video: ''
  })

  useEffect(() => {
    fetchCollectionProducts()
    fetchCollectionCount()
    fetchAvailableProducts()
  }, [])

  const fetchCollectionProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('http://localhost:5000/api/products?inCollection=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCollectionCount = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/collection/count')
      const data = await response.json()
      if (data.success) {
        setCollectionCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching count:', error)
    }
  }

  const fetchAvailableProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        // Filter out products already in collection
        const available = data.data.filter(p => !p.inCollection && p.isActive && p.stock > 0)
        setAvailableProducts(available)
      }
    } catch (error) {
      console.error('Error fetching available products:', error)
    }
  }

  const handleAddToCollection = async (productId) => {
    if (collectionCount >= 15) {
      alert('Collection is full! Maximum 15 products allowed.')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inCollection: true })
      })

      const data = await response.json()
      if (data.success) {
        fetchCollectionProducts()
        fetchCollectionCount()
        fetchAvailableProducts()
        alert('Product added to collection!')
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error adding to collection:', error)
      alert('Failed to add to collection')
    }
  }

  const handleRemoveFromCollection = async (productId) => {
    if (!confirm('Remove this product from collection?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inCollection: false })
      })

      const data = await response.json()
      if (data.success) {
        fetchCollectionProducts()
        fetchCollectionCount()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error removing from collection:', error)
      alert('Failed to remove from collection')
    }
  }

  const handleImageUpload = async (files) => {
    if (files.length === 0 || files.length > 10) {
      alert('Please select 1-10 images')
      return
    }

    setUploading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const uploadFormData = new FormData()
      
      Array.from(files).forEach(file => {
        uploadFormData.append('images', file)
      })

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Store the complete image objects with base64 data
        const imageObjects = data.data.map(img => ({
          data: img.data,
          contentType: img.contentType,
          filename: img.filename
        }))
        setFormData(prev => ({
          ...prev,
          images: imageObjects
        }))
        alert(`${imageObjects.length} image(s) uploaded successfully!`)
      } else {
        alert('Failed to upload images: ' + (data.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload images: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleVideoUpload = async (file) => {
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const formDataVideo = new FormData()
      formDataVideo.append('video', file)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataVideo
      })

      const data = await response.json()
      if (data.success) {
        // Store the complete video object with base64 data
        setFormData(prev => ({ 
          ...prev, 
          video: {
            data: data.data.data,
            contentType: data.data.contentType,
            filename: data.data.filename
          }
        }))
      }
    } catch (error) {
      alert('Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    
    if (collectionCount >= 15) {
      alert('Collection is full! Maximum 15 products allowed.')
      return
    }

    if (!formData.images || formData.images.length === 0) {
      alert('Please upload at least one image')
      return
    }
    
    try {
      const token = localStorage.getItem('adminToken')
      
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        images: formData.images,
        video: formData.video,
        sizeStock: formData.sizeStock,
        featured: formData.featured,
        inCollection: true, // Always true for collection products
        isActive: true
      }
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        // Increment the collection notification counter
        const currentCount = parseInt(localStorage.getItem('lastCollectionCheck') || '0')
        localStorage.setItem('lastCollectionCheck', (currentCount + 1).toString())
        
        fetchCollectionProducts()
        fetchCollectionCount()
        resetForm()
        alert('Product created and added to collection!')
      } else {
        alert(data.message || 'Failed to create product')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to create product: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'anarkali',
      price: '',
      sizeStock: [
        { size: 'XS', quantity: 0 },
        { size: 'S', quantity: 0 },
        { size: 'M', quantity: 0 },
        { size: 'L', quantity: 0 },
        { size: 'XL', quantity: 0 },
        { size: 'XXL', quantity: 0 }
      ],
      featured: false,
      images: [],
      video: ''
    })
    setShowCreateForm(false)
  }

  return (
    <div className="collection-manager">
      <div className="manager-header">
        <div>
          <h2>Collection Manager</h2>
          <p className="collection-info">
            {collectionCount} / 15 products in collection
          </p>
        </div>
        <div className="header-actions">
          {collectionCount < 15 && (
            <button 
              className="add-product-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Collection Product
            </button>
          )}
          {collectionCount >= 15 && (
            <div className="collection-full-badge">
              Collection Full
            </div>
          )}
        </div>
      </div>

      {/* Create Product Form */}
      {showCreateForm && (
        <motion.div 
          className="product-form-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Create New Collection Product</h2>
          <form onSubmit={handleCreateProduct}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="anarkali">Anarkali</option>
                  <option value="palazzo">Palazzo</option>
                  <option value="straight-cut">Straight Cut</option>
                  <option value="sharara">Sharara</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Total Stock (Auto-calculated)</label>
                <input
                  type="number"
                  value={formData.sizeStock.reduce((sum, item) => sum + item.quantity, 0)}
                  disabled
                  className="disabled-input"
                />
                <small className="form-hint">Calculated from size-wise quantities below</small>
              </div>
            </div>

            <div className="form-group">
              <label>Images (Max 10) *</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                disabled={uploading}
              />
              {formData.images.length > 0 && (
                <div className="uploaded-images">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="thumb">
                      <img src={getImageUrl(img)} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Video (Optional)</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(e.target.files[0])}
                disabled={uploading}
              />
              {formData.video && <span className="file-name">Video uploaded</span>}
            </div>

            <div className="form-group">
              <label>Size-wise Stock Quantity</label>
              <div className="size-stock-grid">
                {formData.sizeStock.map((item, index) => (
                  <div key={item.size} className="size-stock-item">
                    <label>{item.size}</label>
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => {
                        const newSizeStock = [...formData.sizeStock]
                        newSizeStock[index].quantity = parseInt(e.target.value) || 0
                        setFormData({...formData, sizeStock: newSizeStock})
                      }}
                      placeholder="Qty"
                    />
                  </div>
                ))}
              </div>
              <small className="form-hint">Total stock will be calculated automatically</small>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                />
                Featured Product
              </label>
            </div>

            <div className="collection-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>This product will be automatically added to the collection</span>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Create Collection Product'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="loading-state">Loading collection...</div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <h3>No products in collection</h3>
          <p>Add products to collection from the Products section</p>
        </div>
      ) : (
        <>
          <div className="collection-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(collectionCount / 15) * 100}%` }}
              />
            </div>
            <span className="progress-text">
              {15 - collectionCount} slots remaining
            </span>
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <motion.div
                key={product._id}
                className="product-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="collection-badge">In Collection</div>
                
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <img 
                    src={getImageUrl(product.images[0])} 
                    alt={product.name}
                    className="product-image"
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">₹{product.price?.toLocaleString('en-IN')}</p>
                  
                  <div className="product-meta">
                    <span className="product-badge category">
                      {product.category}
                    </span>
                    <span className="product-badge stock">
                      Stock: {product.stock}
                    </span>
                  </div>

                  {product.sizeStock && product.sizeStock.length > 0 && (
                    <div className="size-stock-info">
                      {product.sizeStock.map((item, idx) => (
                        <span key={idx} className="size-stock-badge">
                          {item.size}: {item.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveFromCollection(product._id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Remove from Collection
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CollectionManager
