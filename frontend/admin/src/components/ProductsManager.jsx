import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './ProductsManager.css'

const ProductsManager = ({ onPromoteToHero }) => {
  const MAX_IMAGE_SIZE_MB = 10
  const MAX_VIDEO_SIZE_MB = 100
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [collectionNotifications, setCollectionNotifications] = useState([])
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [productToDelete, setProductToDelete] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [imageUrlInput, setImageUrlInput] = useState('')
  const pageSize = 8
  const [formTab, setFormTab] = useState('general')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    slug: '',
    category: '3-piece-sets',
    subcategory: '',
    sku: '',
    price: '',
    discountPrice: '',
    stock: '',
    sizeStock: [
      { size: 'XS', quantity: 0 },
      { size: 'S', quantity: 0 },
      { size: 'M', quantity: 0 },
      { size: 'L', quantity: 0 },
      { size: 'XL', quantity: 0 },
      { size: 'XXL', quantity: 0 },
      { size: '3XL', quantity: 0 },
      { size: 'Free Size', quantity: 0 },
      { size: 'Custom', quantity: 0 }
    ],
    sizes: [],
    colors: [],
    featured: false,
    inCollection: false,
    images: [],
    preview3dImages: [],
    gallery: [],
    video: '',
    dimensions: { length: '', width: '', height: '' },
    materials: [],
    seo: { title: '', description: '' },
    isNewArrival: false
  })
  const [availableCategories, setAvailableCategories] = useState(['2-piece-sets', '3-piece-sets', 'co-ord-sets'])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    const interval = setInterval(() => {
      fetchProducts()
      fetchCategories()
    }, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    checkCollectionNotifications()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, collectionFilter, stockFilter])

  const normalizeMediaUrl = (media) => {
    if (!media) return ''
    if (typeof media === 'string') return media
    return media.url || media.secure_url || getImageUrl(media)
  }

  const checkCollectionNotifications = async () => {
    try {
      const data = await apiRequest(`${API_ENDPOINTS.PRODUCTS}?inCollection=true`, {
        auth: true
      })

      if (data.success) {
        // Check if there are collection products that might need attention
        const collectionProducts = data.products || []
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
      const data = await apiRequest(API_ENDPOINTS.PRODUCTS)
      if (data.success) {
        setProducts(data.data || []) // API returns .data
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.GET_CATEGORIES)
      if (data.success && data.data.length > 0) {
        setAvailableCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const [uploadProgress, setUploadProgress] = useState(0)

  const handleMediaUpload = async (files, field = 'images') => {
    const selectedFiles = Array.from(files || [])
    if (selectedFiles.length === 0) return

    // Validation
    for (const file of selectedFiles) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`)
        return
      }
    }

    setUploading(true)
    setUploadProgress(10) // Start

    // Progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 5 : prev))
    }, 500)

    try {
      const uploadFormData = new FormData()
      selectedFiles.forEach(file => uploadFormData.append('images', file))

      const data = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGES, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: uploadFormData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (data.success) {
        const imageUrls = data.data.map((img) => normalizeMediaUrl(img)).filter(Boolean)
        setFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), ...imageUrls]
        }))
        showNotification(`${selectedFiles.length} images uploaded successfully`)
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Upload error:', error)
      showNotification(error.message || 'Failed to upload images', 'error')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const handleAddImageUrl = (e) => {
    e?.preventDefault()
    const trimmed = imageUrlInput.trim()
    if (!trimmed) {
      showNotification('Please enter an image URL', 'error')
      return
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      showNotification('Please enter a valid URL starting with http:// or https://', 'error')
      return
    }

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), trimmed]
    }))
    setImageUrlInput('')
    showNotification('Image URL added successfully')
  }

  const handleVideoUpload = async (file) => {
    if (!file) return

    if (!file.type.startsWith('video/')) {
      showNotification('Please choose a valid video file', 'error')
      return
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      showNotification(`Video must be smaller than ${MAX_VIDEO_SIZE_MB}MB`, 'error')
      return
    }

    setUploading(true)
    setUploadProgress(20)

    try {
      const formDataVideo = new FormData()
      formDataVideo.append('video', file)

      const data = await apiRequest(API_ENDPOINTS.UPLOAD.VIDEO, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: formDataVideo
      })

      setUploadProgress(100)
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          video: normalizeMediaUrl(data.data)
        }))
        showNotification('Video uploaded successfully')
      }
    } catch (error) {
      showNotification('Failed to upload video: ' + error.message, 'error')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.images || formData.images.length === 0) {
      showNotification('Please upload at least one image', 'error')
      return
    }

    const totalStock = formData.sizeStock.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    const wasEditing = Boolean(editingProduct)

    try {
      const url = editingProduct
        ? `${API_ENDPOINTS.PRODUCTS}/${editingProduct._id}`
        : API_ENDPOINTS.PRODUCTS

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category,
        subcategory: formData.subcategory,
        sku: formData.sku ? formData.sku.trim() : undefined,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        stock: totalStock,
        images: formData.images.map(normalizeMediaUrl).filter(Boolean),
        preview3dImages: (formData.preview3dImages || []).map(normalizeMediaUrl).filter(Boolean),
        video: normalizeMediaUrl(formData.video),
        sizeStock: formData.sizeStock,
        dimensions: formData.dimensions,
        weight: formData.weight,
        materials: formData.materials,
        seo: formData.seo,
        featured: formData.featured,
        inCollection: formData.inCollection,
        isNewArrival: formData.isNewArrival,
        isActive: true
      }

      const data = await apiRequest(url, {
        method: editingProduct ? 'PUT' : 'POST',
        auth: true,
        body: payload
      })

      if (data.success) {
        fetchProducts()
        resetForm()
        showNotification(wasEditing ? 'Product updated successfully!' : 'Product created successfully!')
      } else {
        showNotification(data.message || 'Failed to save product', 'error')
      }
    } catch (error) {
      console.error('Submit error:', error)
      showNotification('Failed to save product: ' + error.message, 'error')
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      const data = await apiRequest(`${API_ENDPOINTS.PRODUCTS}/${productToDelete._id}`, {
        method: 'DELETE',
        auth: true
      })

      if (data.success) {
        fetchProducts()
        showNotification('Product deleted successfully!')
      } else {
        showNotification('Failed to delete product', 'error')
      }
    } catch (error) {
      showNotification('Failed to delete product', 'error')
    } finally {
      setProductToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '3-piece-sets',
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
      isNewArrival: false,
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
      shortDescription: product.shortDescription || '',
      slug: product.slug || '',
      category: product.category,
      subcategory: product.subcategory || '',
      sku: product.sku || '',
      price: product.price.toString(),
      discountPrice: product.discountPrice ? product.discountPrice.toString() : '',
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
      isNewArrival: product.isNewArrival || false,
      images: (product.images || []).map(normalizeMediaUrl),
      preview3dImages: (product.preview3dImages || []).map(normalizeMediaUrl),
      gallery: (product.gallery || []).map(normalizeMediaUrl),
      video: normalizeMediaUrl(product.video),
      dimensions: product.dimensions || { length: '', width: '', height: '' },
      weight: product.weight || { value: '' },
      materials: product.materials || [],
      seo: product.seo || { title: '', description: '' }
    })
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDuplicate = (product) => {
    setFormData({
      name: `${product.name} (Copy)`,
      description: product.description,
      shortDescription: product.shortDescription || '',
      slug: `${product.slug || ''}-copy`,
      category: product.category,
      subcategory: product.subcategory || '',
      sku: `${product.sku || ''}-copy`,
      price: product.price.toString(),
      discountPrice: product.discountPrice ? product.discountPrice.toString() : '',
      stock: product.stock.toString(),
      sizeStock: product.sizeStock && product.sizeStock.length > 0
        ? JSON.parse(JSON.stringify(product.sizeStock))
        : [
          { size: 'XS', quantity: 0 },
          { size: 'S', quantity: 0 },
          { size: 'M', quantity: 0 },
          { size: 'L', quantity: 0 },
          { size: 'XL', quantity: 0 },
          { size: 'XXL', quantity: 0 }
        ],
      sizes: [...(product.sizes || [])],
      colors: [...(product.colors || [])],
      featured: false,
      inCollection: false,
      isNewArrival: false,
      images: [...(product.images || [])].map(normalizeMediaUrl),
      preview3dImages: [...(product.preview3dImages || [])].map(normalizeMediaUrl),
      gallery: [...(product.gallery || [])].map(normalizeMediaUrl),
      video: normalizeMediaUrl(product.video),
      dimensions: product.dimensions ? { ...product.dimensions } : { length: '', width: '', height: '' },
      weight: product.weight ? { ...product.weight } : { value: '' },
      materials: [...(product.materials || [])],
      seo: product.seo ? { ...product.seo, title: `${product.seo.title || ''} (Copy)` } : { title: '', description: '' }
    })
    setEditingProduct(null)
    setShowForm(true)
    showNotification('Product details copied!')
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.description, product.category]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesCollection = collectionFilter === 'all'
      || (collectionFilter === 'collection' && product.inCollection)
      || (collectionFilter === 'regular' && !product.inCollection)
    const matchesStock = stockFilter === 'all'
      || (stockFilter === 'in-stock' && product.stock > 0)
      || (stockFilter === 'out-of-stock' && product.stock === 0)

    return matchesSearch && matchesCategory && matchesCollection && matchesStock
  })

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="products-manager">
      {/* Collection Notification Modal */}
      {showNotificationModal && collectionNotifications.length > 0 && (
        <motion.div
          className="notification-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowNotificationModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Collection products available notification"
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
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3>Collection Products Available!</h3>
              <button className="close-notification-btn" onClick={() => setShowNotificationModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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
                        <polyline points="20 6 9 17 4 12" />
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
                    setCollectionFilter('collection')
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
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notification-count">{collectionNotifications.length}</span>
            </button>
          )}
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            className="toolbar-input"
            type="search"
            placeholder="Search products by name, category, description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="toolbar-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>

        <select className="toolbar-select" value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)}>
          <option value="all">All products</option>
          <option value="collection">In collection</option>
          <option value="regular">Not in collection</option>
        </select>

        <select className="toolbar-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <option value="all">All stock levels</option>
          <option value="in-stock">In stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
      </div>

      <div className="toolbar-summary">
        Showing <strong>{filteredProducts.length}</strong> of {products.length} products
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <motion.div
              className="product-form-drawer"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <h2>{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                <button className="close-drawer-btn" onClick={resetForm}>&times;</button>
              </div>
              <div className="form-header-tabs">
                <button className={formTab === 'general' ? 'active' : ''} onClick={() => setFormTab('general')}>General</button>
                <button className={formTab === 'media' ? 'active' : ''} onClick={() => setFormTab('media')}>Media</button>
                <button className={formTab === 'inventory' ? 'active' : ''} onClick={() => setFormTab('inventory')}>Inventory</button>
                <button className={formTab === 'advanced' ? 'active' : ''} onClick={() => setFormTab('advanced')}>Advanced</button>
                <button className={formTab === 'seo' ? 'active' : ''} onClick={() => setFormTab('seo')}>SEO</button>
              </div>

              <form onSubmit={handleSubmit} className="tabbed-form">
                {formTab === 'general' && (
                  <div className="form-tab-content">
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Vintage Silk Anarkali" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Category *</label>
                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                          ))}
                          <option value="new">+ Add New Category</option>
                        </select>
                        {formData.category === 'new' && (
                          <input
                            type="text"
                            placeholder="Type new category name"
                            className="mt-2"
                            onBlur={(e) => {
                              if (e.target.value) {
                                setAvailableCategories(prev => [...new Set([...prev, e.target.value.toLowerCase()])])
                                setFormData({ ...formData, category: e.target.value.toLowerCase() })
                              }
                            }}
                          />
                        )}
                      </div>
                      <div className="form-group">
                        <label>Subcategory</label>
                        <input type="text" value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} placeholder="e.g. Wedding Wear" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Short Description</label>
                      <input type="text" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} placeholder="Brief highlight for product cards" />
                    </div>
                    <div className="form-group">
                      <label>Full Description *</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="4" required placeholder="Detailed product storytelling..." />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Price (₹) *</label>
                        <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required min="0" />
                      </div>
                      <div className="form-group">
                        <label>Discount Price (₹)</label>
                        <input type="number" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })} min="0" />
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'media' && (
                  <div className="form-tab-content">
                    <div className="form-group">
                      <label>Main Product Images (Max 10)</label>
                      <div
                        className={`media-upload-zone ${uploading ? 'uploading' : ''}`}
                        onClick={() => !uploading && document.getElementById('image-upload').click()}
                      >
                        {uploading ? (
                          <div className="upload-loader">
                            <div className="spinner-luxury"></div>
                            <p>Uploading high-resolution assets...</p>
                            <div className="progress-bar-container">
                              <motion.div
                                className="progress-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <span className="progress-text">{uploadProgress}% Complete</span>
                          </div>
                        ) : (
                          <>
                            <div className="upload-icon-container">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                              </svg>
                            </div>
                            <div className="upload-text">
                              <p className="main-text">Drop Masterpiece Images Here</p>
                              <p className="sub-text">Recommended: 1200x1600px | WEBP or JPG</p>
                            </div>
                          </>
                        )}
                        <input id="image-upload" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMediaUpload(e.target.files, 'images')} />
                      </div>

                      {/* Add Image by Web URL Input */}
                      <div className="url-upload-container">
                        <label className="url-upload-label">Or Add Image by Web URL</label>
                        <div className="url-upload-row">
                          <input
                            type="url"
                            className="url-upload-input"
                            placeholder="Paste image URL (e.g. https://example.com/image.jpg)"
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddImageUrl()
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="url-upload-btn"
                            onClick={handleAddImageUrl}
                          >
                            + Add URL
                          </button>
                        </div>
                      </div>

                      <div className="media-previews-grid">
                        {formData.images.map((img, i) => (
                          <motion.div
                            key={i}
                            className={`media-thumb-premium ${i === 0 ? 'is-cover' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <img src={getImageUrl(img)} alt="" />
                            <div className="thumb-actions">
                              <button type="button" className="action-btn delete" onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                              </button>
                            </div>
                            {i === 0 && <span className="cover-label">COVER IMAGE</span>}
                          </motion.div>
                        ))}
                        {formData.images.length === 0 && !uploading && (
                          <div className="empty-media-placeholder">
                            <p>No images uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>3D Preview Assets</label>
                        <input type="file" multiple accept="image/*" onChange={(e) => handleMediaUpload(e.target.files, 'preview3dImages')} />
                      </div>
                      <div className="form-group">
                        <label>Video Showcase</label>
                        <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files[0])} />
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'inventory' && (
                  <div className="form-tab-content">
                    <div className="form-row">
                      <div className="form-group">
                        <label>SKU (Stock Keeping Unit)</label>
                        <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. SM-ANK-001" />
                      </div>
                      <div className="form-group">
                        <label>Total Available Stock</label>
                        <input type="number" value={formData.sizeStock.reduce((s, i) => s + i.quantity, 0)} disabled className="disabled-input" />
                      </div>
                    </div>
                    <div className="inventory-grid">
                      <h3>Size-wise Stock Distribution</h3>
                      <div className="size-stock-grid">
                        {formData.sizeStock.map((item, index) => (
                          <div key={item.size} className="size-stock-item">
                            <label>{item.size}</label>
                            <input type="number" value={item.quantity} min="0" onChange={(e) => {
                              const newStock = [...formData.sizeStock];
                              newStock[index].quantity = parseInt(e.target.value) || 0;
                              setFormData({ ...formData, sizeStock: newStock });
                            }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'advanced' && (
                  <div className="form-tab-content">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Dimensions (LxWxH in cm)</label>
                        <div className="triple-input">
                          <input type="number" placeholder="L" value={formData.dimensions?.length} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })} />
                          <input type="number" placeholder="W" value={formData.dimensions?.width} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: e.target.value } })} />
                          <input type="number" placeholder="H" value={formData.dimensions?.height} onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: e.target.value } })} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Weight (kg)</label>
                        <input type="number" value={formData.weight?.value} onChange={(e) => setFormData({ ...formData, weight: { ...formData.weight, value: e.target.value } })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Materials (e.g. Silk, Cotton)</label>
                      <input type="text" value={Array.isArray(formData.materials) ? formData.materials.join(', ') : ''} onChange={(e) => setFormData({ ...formData, materials: e.target.value.split(',').map(m => m.trim()) })} placeholder="Comma separated" />
                    </div>
                    <div className="checkbox-row-premium">
                      <label className="checkbox-container">
                        <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                        <span className="checkmark"></span>
                        Featured Product
                      </label>
                      <label className="checkbox-container">
                        <input type="checkbox" checked={formData.inCollection} onChange={(e) => setFormData({ ...formData, inCollection: e.target.checked })} />
                        <span className="checkmark"></span>
                        Add to Collection
                      </label>
                      <label className="checkbox-container">
                        <input type="checkbox" checked={formData.isNewArrival} onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })} />
                        <span className="checkmark"></span>
                        Set as New Arrival
                      </label>
                    </div>
                  </div>
                )}

                {formTab === 'seo' && (
                  <div className="form-tab-content">
                    <div className="form-group">
                      <label>SEO Title</label>
                      <input type="text" value={formData.seo?.title} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })} placeholder="Google search title" />
                    </div>
                    <div className="form-group">
                      <label>SEO Description</label>
                      <textarea value={formData.seo?.description} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })} rows="3" placeholder="Meta description for search engines" />
                    </div>
                    <div className="seo-preview">
                      <span className="preview-label">Search Engine Preview</span>
                      <div className="preview-content">
                        <p className="p-title">{formData.seo?.title || formData.name}</p>
                        <p className="p-url">seemee.com/products/{formData.slug || 'product-slug'}</p>
                        <p className="p-desc">{formData.seo?.description || formData.shortDescription || 'Search results preview...'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-actions-sticky">
                  <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="save-btn">{editingProduct ? 'Update Product' : 'Create Product'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="products-list">
        <h2>All Products ({products.length})</h2>
        <div className="products-table-container premium-card desktop-only-table">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product._id} className="product-row">
                  <td>
                    <div className="table-product-cell">
                      <div className="table-product-img">
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <img src={getImageUrl(product.images[0])} alt={product.name} />
                        ) : (
                          <div className="no-image-mini">No Img</div>
                        )}
                      </div>
                      <div className="table-product-details">
                        <h4>{product.name}</h4>
                        <span className="sku">{product.sku || 'No SKU'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-pill">{product.category}</span>
                  </td>
                  <td>
                    <span className="table-price">₹{product.price.toLocaleString()}</span>
                  </td>
                  <td className="stock-column">
                    <div className="table-stock-cell">
                      <span className={`stock-dot ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}></span>
                      <span>{product.stock} Units</span>
                    </div>
                    <div className="stock-health-bar">
                      <div
                        className={`health-fill ${product.stock < 5 ? 'critical' : product.stock < 15 ? 'low' : 'healthy'}`}
                        style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    <div className="status-badges">
                      {product.featured && <span className="mini-badge featured">Featured</span>}
                      {product.inCollection && <span className="mini-badge collection">Collection</span>}
                      {!product.featured && !product.inCollection && <span className="mini-badge regular">Regular</span>}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        onClick={() => typeof onPromoteToHero === 'function' && onPromoteToHero(product)} 
                        className="action-icon-btn hero" 
                        title="Promote to Hero"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                      </button>
                      <button onClick={() => startEdit(product)} className="action-icon-btn edit" title="Edit Product">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => handleDuplicate(product)} className="action-icon-btn duplicate" title="Duplicate Product">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      </button>
                      <button onClick={() => setProductToDelete(product)} className="action-icon-btn delete" title="Delete Product">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Touch Product Card Feed */}
        <div className="mobile-product-card-feed">
          {paginatedProducts.map((product) => (
            <div key={product._id} className="mobile-product-card">
              <div className="mobile-card-top">
                <div className="mobile-card-img-wrapper">
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <img src={getImageUrl(product.images[0])} alt={product.name} />
                  ) : (
                    <div className="no-image-mini">No Img</div>
                  )}
                </div>
                <div className="mobile-card-meta">
                  <div className="mobile-card-category-row">
                    <span className="category-pill">{product.category}</span>
                    <span className="sku">{product.sku || 'No SKU'}</span>
                  </div>
                  <h4 className="mobile-card-title">{product.name}</h4>
                  <div className="mobile-card-price-row">
                    <span className="mobile-price">₹{product.price?.toLocaleString('en-IN')}</span>
                    {product.discountPrice > 0 && (
                      <span className="mobile-discount-price">₹{product.discountPrice?.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mobile-card-body">
                <div className="mobile-card-stock">
                  <span className={`stock-dot ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}></span>
                  <span className="stock-label">Stock: <strong>{product.stock} Units</strong></span>
                </div>
                <div className="status-badges">
                  {product.featured && <span className="mini-badge featured">Featured</span>}
                  {product.inCollection && <span className="mini-badge collection">Collection</span>}
                  {!product.featured && !product.inCollection && <span className="mini-badge regular">Regular</span>}
                </div>
              </div>

              <div className="mobile-card-actions">
                <button 
                  onClick={() => typeof onPromoteToHero === 'function' && onPromoteToHero(product)} 
                  className="mobile-action-btn hero"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                  <span>Hero</span>
                </button>
                <button onClick={() => startEdit(product)} className="mobile-action-btn edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  <span>Edit</span>
                </button>
                <button onClick={() => handleDuplicate(product)} className="mobile-action-btn duplicate">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  <span>Copy</span>
                </button>
                <button onClick={() => setProductToDelete(product)} className="mobile-action-btn delete">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="mobile-no-products">No products found matching your filter criteria.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-bar">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page <strong>{currentPage}</strong> of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="modal-overlay" onClick={() => setProductToDelete(null)}>
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon warning">!</div>
              <h3>Are you sure?</h3>
              <p>You are about to delete <strong>{productToDelete.name}</strong>. This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="confirm-btn" onClick={handleDelete}>Yes, Delete it</button>
                <button className="cancel-btn" onClick={() => setProductToDelete(null)}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`toast-notification ${notification.type}`}
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

export default ProductsManager
