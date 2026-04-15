import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getImageUrl } from '../utils/imageHelper'
import './ProductsManager.css'

const ProductsManager = () => {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [collectionNotifications, setCollectionNotifications] = useState([])
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'anarkali',
    price: '',
    stock: '',
    sizeStock: [
      { size: 'XS', quantity: 0 },
      { size: 'S', quantity: 0 },
      { size: 'M', quantity: 0 },
      { size: 'L', quantity: 0 },
      { size: 'XL', quantity: 0 },
      { size: 'XXL', quantity: 0 }
    ],
    sizes: [],
    colors: [],
    featured: false,
    inCollection: false,
    images: [],
    video: ''
  })

  useEffect(() => {
    fetchProducts()
    checkCollectionNotifications()
  }, [])

  const checkCollectionNotifications = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/products?inCollection=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        // Check if there are collection products that might need attention
        const collectionProducts = data.data
        if (collectionProducts.length > 0) {
          setCollectionNotifications(collectionProducts)
          // Show notification if there are collection products
          const hasNewNotifications = localStorage.getItem('lastCollectionCheck')
          const currentCount = collectionProducts.length
          const lastCount = parseInt(hasNewNotifications || '0')
          
          if (currentCount > lastCount) {
            setShowNotificationModal(true)
            localStorage.setItem('lastCollectionCheck', currentCount.toString())
          }
        }
      }
    } catch (error) {
      console.error('Error checking collection:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
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

      console.log('Uploading images...') // Debug log

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Upload response:', data) // Debug log
      
      if (data.success) {
        // Store the complete image objects with base64 data
        const imageObjects = data.data.map(img => ({
          data: img.data,
          contentType: img.contentType,
          filename: img.filename
        }))
        console.log('Image objects:', imageObjects) // Debug log
        
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
      if (error.message.includes('Failed to fetch')) {
        alert('❌ SERVER NOT RUNNING!\n\nPlease start the backend server:\n\n1. Open terminal\n2. Run: cd server\n3. Run: npm start\n\nThen try uploading again.')
      } else {
        alert('Failed to upload images: ' + error.message)
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate images
    if (!formData.images || formData.images.length === 0) {
      alert('Please upload at least one image')
      return
    }
    
    try {
      const token = localStorage.getItem('adminToken')
      const url = editingProduct 
        ? `/api/products/${editingProduct._id}`
        : '/api/products'
      
      // Calculate total stock from sizeStock
      const totalStock = formData.sizeStock.reduce((sum, item) => sum + item.quantity, 0)
      
      // Prepare payload - don't send stock field, let backend calculate it
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        images: formData.images,
        video: formData.video,
        sizeStock: formData.sizeStock,
        featured: formData.featured,
        inCollection: formData.inCollection,
        isActive: true
      }
      
      console.log('Submitting product:', payload) // Debug log
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('Server response:', data) // Debug log
      
      if (data.success) {
        fetchProducts()
        resetForm()
        alert(editingProduct ? 'Product updated!' : 'Product created!')
      } else {
        // Show error message (e.g., collection limit reached)
        alert(data.message || 'Failed to save product')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to save product: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        fetchProducts()
        alert('Product deleted!')
      }
    } catch (error) {
      alert('Failed to delete product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'anarkali',
      price: '',
      stock: '',
      sizeStock: [
        { size: 'XS', quantity: 0 },
        { size: 'S', quantity: 0 },
        { size: 'M', quantity: 0 },
        { size: 'L', quantity: 0 },
        { size: 'XL', quantity: 0 },
        { size: 'XXL', quantity: 0 }
      ],
      sizes: [],
      colors: [],
      featured: false,
      inCollection: false,
      images: [],
      video: ''
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const startEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      sizeStock: product.sizeStock && product.sizeStock.length > 0 
        ? product.sizeStock 
        : [
            { size: 'XS', quantity: 0 },
            { size: 'S', quantity: 0 },
            { size: 'M', quantity: 0 },
            { size: 'L', quantity: 0 },
            { size: 'XL', quantity: 0 },
            { size: 'XXL', quantity: 0 }
          ],
      sizes: product.sizes || [],
      colors: product.colors || [],
      featured: product.featured,
      inCollection: product.inCollection || false,
      images: product.images,
      video: product.video || ''
    })
    setEditingProduct(product)
    setShowForm(true)
  }

  return (
    <div className="products-manager">
      {/* Collection Notification Modal */}
      {showNotificationModal && collectionNotifications.length > 0 && (
        <motion.div 
          className="notification-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowNotificationModal(false)}
        >
          <motion.div 
            className="notification-modal"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-header">
              <div className="notification-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <h3>Collection Products Available!</h3>
              <button className="close-notification-btn" onClick={() => setShowNotificationModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="notification-body">
              <p className="notification-message">
                You have <strong>{collectionNotifications.length} product(s)</strong> in your collection. 
                These products are already added to your product list and visible on the website.
              </p>
              
              <div className="notification-products">
                {collectionNotifications.slice(0, 5).map((product) => (
                  <div key={product._id} className="notification-product-item">
                    <img 
                      src={getImageUrl(product.images?.[0])} 
                      alt={product.name}
                      className="notification-product-thumb"
                    />
                    <div className="notification-product-info">
                      <h4>{product.name}</h4>
                      <p>₹{product.price?.toLocaleString('en-IN')} • {product.category}</p>
                      <span className="stock-badge">Stock: {product.stock}</span>
                    </div>
                    <div className="notification-product-status">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Active</span>
                    </div>
                  </div>
                ))}
                {collectionNotifications.length > 5 && (
                  <p className="more-products">
                    + {collectionNotifications.length - 5} more products in collection
                  </p>
                )}
              </div>
              
              <div className="notification-actions">
                <button 
                  className="view-collection-btn"
                  onClick={() => {
                    setShowNotificationModal(false)
                    // You can add navigation to collection tab here if needed
                  }}
                >
                  View Collection
                </button>
                <button 
                  className="dismiss-btn"
                  onClick={() => setShowNotificationModal(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="manager-header">
        <div>
          <h1>Products Management</h1>
          <p>Manage your product inventory and stock</p>
        </div>
        <div className="header-actions">
          {collectionNotifications.length > 0 && (
            <button 
              className="notification-badge-btn"
              onClick={() => setShowNotificationModal(true)}
              title="Collection products notification"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="notification-count">{collectionNotifications.length}</span>
            </button>
          )}
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div 
          className="product-form-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit}>
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

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.inCollection}
                  onChange={(e) => setFormData({...formData, inCollection: e.target.checked})}
                />
                Add to Collection (Max 15 products)
              </label>
              <small className="form-hint collection-hint">
                Products in collection will appear on both Products and Collection pages
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={uploading}>
                {uploading ? 'Uploading...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="products-list">
        <h2>All Products ({products.length})</h2>
        <div className="products-grid">
          {products.map((product) => (
            <motion.div 
              key={product._id}
              className="product-card"
              whileHover={{ y: -5 }}
            >
              <div className="product-image">
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <img src={getImageUrl(product.images[0])} alt={product.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                {product.featured && <span className="featured-badge">Featured</span>}
                {product.inCollection && <span className="featured-badge" style={{top: '45px'}}>Collection</span>}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="category">{product.category}</p>
                <div className="product-meta">
                  <span className="price">₹{product.price}</span>
                  <span className={`stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                {product.sizeStock && product.sizeStock.length > 0 && (
                  <div className="size-info">
                    {product.sizeStock.filter(s => s.quantity > 0).map(s => (
                      <span key={s.size} className="size-badge">{s.size}: {s.quantity}</span>
                    ))}
                  </div>
                )}
                <div className="product-actions">
                  <button onClick={() => startEdit(product)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(product._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductsManager
