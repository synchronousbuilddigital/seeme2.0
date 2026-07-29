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
  const [statusFilter, setStatusFilter] = useState('all')
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
    category: '',
    subcategory: '',
    sku: '',
    price: '',
    mrp: '',
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
    isNewArrival: false,
    isActive: true
  })
  const [availableCategories, setAvailableCategories] = useState([])

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
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, collectionFilter, stockFilter, statusFilter])

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
      const data = await apiRequest(`${API_ENDPOINTS.PRODUCTS}?includeInactive=true&limit=1000`, { auth: true })
      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleToggleActive = async (product) => {
    const newStatus = !(product.isActive !== false)

    // Optimistically update local admin products state instantly
    setProducts(prevProducts =>
      prevProducts.map(p => (p._id === product._id ? { ...p, isActive: newStatus } : p))
    )

    try {
      const data = await apiRequest(`${API_ENDPOINTS.PRODUCTS}/${product._id}`, {
        method: 'PUT',
        auth: true,
        body: { isActive: newStatus }
      })

      if (data.success) {
        showNotification(newStatus ? 'Product is now Active (Visible on storefront)' : 'Product is now Inactive (Hidden from storefront)')
        fetchProducts()
      } else {
        // Revert local state if server request fails
        setProducts(prevProducts =>
          prevProducts.map(p => (p._id === product._id ? { ...p, isActive: !newStatus } : p))
        )
        showNotification(data.message || 'Failed to update product status', 'error')
      }
    } catch (error) {
      // Revert local state if server request fails
      setProducts(prevProducts =>
        prevProducts.map(p => (p._id === product._id ? { ...p, isActive: !newStatus } : p))
      )
      showNotification('Failed to update product status: ' + error.message, 'error')
    }
  }

  const fetchCategories = async () => {
    try {
      let catList = []

      // 1. Fetch categories configured in Category Section (SITE_SETTINGS)
      const settingsData = await apiRequest(API_ENDPOINTS.SITE_SETTINGS)
      if (settingsData.success && settingsData.data && settingsData.data.categorySlides && settingsData.data.categorySlides.length > 0) {
        catList = settingsData.data.categorySlides.map(c => ({
          slug: c.slug || c.title.toLowerCase().replace(/\s+/g, '-'),
          title: c.title || c.slug
        }))
      }

      // 2. Fetch categories existing across products
      const prodCatData = await apiRequest(API_ENDPOINTS.GET_CATEGORIES)
      if (prodCatData.success && Array.isArray(prodCatData.data)) {
        prodCatData.data.forEach(c => {
          const slug = typeof c === 'string' ? c : (c.slug || c.title || '')
          if (slug && !catList.some(existing => existing.slug === slug || existing.title === slug)) {
            catList.push({
              slug: slug,
              title: typeof c === 'string' ? (c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ')) : (c.title || slug)
            })
          }
        })
      }

      if (catList.length === 0) {
        catList = [
          { slug: '2-piece-sets', title: '2-Piece Sets' },
          { slug: '3-piece-sets', title: '3-Piece Sets' },
          { slug: 'co-ord-sets', title: 'Co-ord Sets' }
        ]
      }

      setAvailableCategories(catList)
      if (catList.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: prev.category && catList.some(c => (c.slug || c.title) === prev.category) ? prev.category : (catList[0].slug || catList[0].title)
        }))
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

  const handleAddImageUrl = async (e) => {
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

    setUploading(true)
    try {
      // Send URL to Cloudinary endpoint so it gets uploaded & converted to WebP on Cloudinary
      const data = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE_FROM_URL, {
        method: 'POST',
        auth: true,
        body: { url: trimmed }
      })

      if (data.success && data.data && data.data.url) {
        const cloudinaryUrl = data.data.url
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), cloudinaryUrl]
        }))
        setImageUrlInput('')
        showNotification('Image uploaded to Cloudinary as WebP successfully!')
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), trimmed]
        }))
        setImageUrlInput('')
        showNotification('Image URL added')
      }
    } catch (error) {
      console.error('Cloudinary URL upload error:', error)
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), trimmed]
      }))
      setImageUrlInput('')
      showNotification('Image URL added', 'success')
    } finally {
      setUploading(false)
    }
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

    if (!formData.name || !formData.name.trim()) {
      showNotification('Please enter a product name', 'error')
      return
    }

    const parsedPrice = parseFloat(formData.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showNotification('Please enter a valid price greater than 0', 'error')
      return
    }

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
        name: formData.name.trim(),
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category,
        subcategory: formData.subcategory,
        sku: formData.sku ? formData.sku.trim() : undefined,
        price: parsedPrice,
        mrp: (formData.mrp && !isNaN(parseFloat(formData.mrp))) ? parseFloat(formData.mrp) : (formData.discountPrice && !isNaN(parseFloat(formData.discountPrice)) ? parseFloat(formData.discountPrice) : undefined),
        discountPrice: (formData.mrp && !isNaN(parseFloat(formData.mrp))) ? parseFloat(formData.mrp) : (formData.discountPrice && !isNaN(parseFloat(formData.discountPrice)) ? parseFloat(formData.discountPrice) : undefined),
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
        isActive: formData.isActive !== false
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
    const defaultCat = availableCategories[0]?.slug || availableCategories[0]?.title || ''
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      slug: '',
      category: defaultCat,
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
        { size: 'XXL', quantity: 0 }
      ],
      sizes: [],
      colors: [],
      featured: false,
      inCollection: false,
      isNewArrival: false,
      isActive: true,
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
      price: product.price ? product.price.toString() : '',
      mrp: (product.mrp || product.discountPrice) ? (product.mrp || product.discountPrice).toString() : '',
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
      isActive: product.isActive !== false,
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
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' && product.isActive !== false)
      || (statusFilter === 'inactive' && product.isActive === false)

    return matchesSearch && matchesCategory && matchesCollection && matchesStock && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="products-manager">
      <div className="manager-header">
        <div>
          <h1>Products Management</h1>
          <p>Manage your product inventory and stock</p>
        </div>
        <div className="header-actions">
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
          {availableCategories.map(cat => {
            const slug = typeof cat === 'string' ? cat : (cat.slug || cat.title)
            const title = typeof cat === 'string' ? (cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')) : (cat.title || cat.slug)
            return <option key={slug} value={slug}>{title}</option>
          })}
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

        <select className="toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses (Active & Inactive)</option>
          <option value="active">Active Only (Live on Storefront)</option>
          <option value="inactive">Inactive Only (Hidden on Storefront)</option>
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
                          {availableCategories.map(cat => {
                            const slug = typeof cat === 'string' ? cat : (cat.slug || cat.title)
                            const title = typeof cat === 'string' ? (cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')) : (cat.title || cat.slug)
                            return <option key={slug} value={slug}>{title}</option>
                          })}
                          <option value="new">+ Add New Category</option>
                        </select>
                        {formData.category === 'new' && (
                          <input
                            type="text"
                            placeholder="Type new category name"
                            className="mt-2"
                            onBlur={(e) => {
                              if (e.target.value) {
                                const newSlug = e.target.value.toLowerCase().replace(/\s+/g, '-')
                                const newTitle = e.target.value
                                setAvailableCategories(prev => [...prev, { slug: newSlug, title: newTitle }])
                                setFormData({ ...formData, category: newSlug })
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
                        <label>Selling Price (₹) *</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          min="0"
                          placeholder="e.g. 2999"
                        />
                      </div>
                      <div className="form-group">
                        <label>MRP / Original Price (₹)</label>
                        <input
                          type="number"
                          value={formData.mrp || formData.discountPrice}
                          onChange={(e) => setFormData({ ...formData, mrp: e.target.value, discountPrice: e.target.value })}
                          min="0"
                          placeholder="e.g. 4999"
                        />
                      </div>
                    </div>
                    {formData.price && (formData.mrp || formData.discountPrice) && Number(formData.mrp || formData.discountPrice) > Number(formData.price) && (
                      <div className="price-calc-hint" style={{ fontSize: '13px', color: '#2E7D32', fontWeight: '600', marginBottom: '14px', background: '#E8F5E9', padding: '8px 14px', borderRadius: '6px' }}>
                        ✓ Customer saves ₹{(Number(formData.mrp || formData.discountPrice) - Number(formData.price)).toLocaleString()} ({Math.round(((Number(formData.mrp || formData.discountPrice) - Number(formData.price)) / Number(formData.mrp || formData.discountPrice)) * 100)}% OFF)
                      </div>
                    )}

                    {/* Dedicated Separate Row for Product Active / Inactive Status */}
                    <div className="form-group status-row-separate">
                      <label className="status-section-label">Product Storefront Visibility & Image Status</label>
                      <div className="status-radio-group-row">
                        <label className={`status-radio-btn ${formData.isActive !== false ? 'selected-active' : ''}`}>
                          <input
                            type="radio"
                            name="productStatus"
                            checked={formData.isActive !== false}
                            onChange={() => setFormData({ ...formData, isActive: true })}
                          />
                          <span className="status-radio-dot active-dot"></span>
                          <div className="status-radio-info">
                            <strong>Active</strong>
                            <p>Product & images are live on frontend</p>
                          </div>
                        </label>
                        <label className={`status-radio-btn ${formData.isActive === false ? 'selected-inactive' : ''}`}>
                          <input
                            type="radio"
                            name="productStatus"
                            checked={formData.isActive === false}
                            onChange={() => setFormData({ ...formData, isActive: false })}
                          />
                          <span className="status-radio-dot inactive-dot"></span>
                          <div className="status-radio-info">
                            <strong>Inactive</strong>
                            <p>Product & images are hidden from frontend</p>
                          </div>
                        </label>
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
                <th>Tags</th>
                <th>Active / Storefront</th>
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
                  <td className="active-toggle-column">
                    <button
                      type="button"
                      className={`inline-status-toggle ${product.isActive !== false ? 'is-active' : 'is-inactive'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleActive(product)
                      }}
                      title={product.isActive !== false ? "Click to set Inactive (Hide from Storefront)" : "Click to set Active (Show on Storefront)"}
                    >
                      <span className="toggle-switch-track">
                        <span className="toggle-switch-thumb"></span>
                      </span>
                      <span className="toggle-status-label">
                        {product.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </button>
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
                    <button
                      type="button"
                      className={`inline-status-toggle ${product.isActive !== false ? 'is-active' : 'is-inactive'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleActive(product)
                      }}
                    >
                      <span className="toggle-switch-track">
                        <span className="toggle-switch-thumb"></span>
                      </span>
                      <span className="toggle-status-label">
                        {product.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </button>
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
