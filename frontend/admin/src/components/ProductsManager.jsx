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
  const [audienceFilter, setAudienceFilter] = useState('all') // 'all', 'women', 'men'
  const [brandFilter, setBrandFilter] = useState('all')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [productToDelete, setProductToDelete] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const pageSize = 8
  const [formTab, setFormTab] = useState('general')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    slug: '',
    category: '',
    brand: 'SeeMee',
    targetAudience: ['women'],
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
      { size: 'Free Size', quantity: 0 }
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
    fabric: '',
    fit: '',
    occasion: '',
    design: '',
    sleeves: '',
    length: '',
    careInstructions: '',
    tags: [],
    seo: { title: '', description: '' },
    isNewArrival: false,
    isActive: true
  })
  const [availableCategories, setAvailableCategories] = useState([])
  const [availableBrands, setAvailableBrands] = useState([])

  const fetchBrands = async () => {
    try {
      const res = await apiRequest(`${API_ENDPOINTS.BRANDS}?admin=true`)
      if (res?.success && Array.isArray(res.data)) {
        const brandList = res.data.map(b => b.name?.trim()).filter(Boolean)
        setAvailableBrands(Array.from(new Set(brandList)))
      }
    } catch (err) {
      console.error('Error fetching admin brands:', err)
    }
  }

  const handleAddTag = (tagToAdd) => {
    const cleanTag = (tagToAdd || tagInput).trim()
    if (!cleanTag) return

    const newTags = cleanTag.split(',').map(t => t.trim()).filter(Boolean)

    setFormData(prev => {
      const existing = prev.tags || []
      const updated = [...existing]
      newTags.forEach(t => {
        if (!updated.some(item => item.toLowerCase() === t.toLowerCase())) {
          updated.push(t)
        }
      })
      return { ...prev, tags: updated }
    })
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t.toLowerCase() !== tagToRemove.toLowerCase())
    }))
  }

  const getAudienceArray = (val) => {
    if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase().trim())
    if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
    return ['women']
  }

  const handleAudienceToggle = (val) => {
    setFormData(prev => {
      const current = getAudienceArray(prev.targetAudience || prev.gender)
      if (current.includes(val)) {
        const next = current.filter(v => v !== val)
        return { ...prev, targetAudience: next.length > 0 ? next : ['women'] }
      } else {
        return { ...prev, targetAudience: [...current, val] }
      }
    })
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchBrands()
  }, [])


  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, audienceFilter, brandFilter, collectionFilter, stockFilter, statusFilter])

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

      // Fetch ONLY categories configured in Admin Category Section (SITE_SETTINGS)
      const settingsData = await apiRequest(API_ENDPOINTS.SITE_SETTINGS)
      if (settingsData?.success && settingsData?.data?.categorySlides && Array.isArray(settingsData.data.categorySlides)) {
        catList = settingsData.data.categorySlides.filter(Boolean).map(c => ({
          slug: c.slug || (c.title ? c.title.toLowerCase().replace(/\s+/g, '-') : ''),
          title: c.title || c.slug
        })).filter(c => c.slug || c.title)
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

      let finalTags = [...(formData.tags || [])]
      if (tagInput && tagInput.trim()) {
        const pendingTags = tagInput.trim().split(',').map(t => t.trim()).filter(Boolean)
        pendingTags.forEach(t => {
          if (!finalTags.some(item => item.toLowerCase() === t.toLowerCase())) {
            finalTags.push(t)
          }
        })
      }

      const audienceList = getAudienceArray(formData.targetAudience || formData.gender)

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        shortDescription: formData.shortDescription,
        category: formData.category,
        brand: formData.brand ? formData.brand.trim() : undefined,
        gender: audienceList,
        targetAudience: audienceList,
        subcategory: formData.subcategory,
        sku: formData.sku ? formData.sku.trim() : undefined,
        price: parsedPrice,
        mrp: (formData.mrp && !isNaN(parseFloat(formData.mrp))) ? parseFloat(formData.mrp) : (formData.discountPrice && !isNaN(parseFloat(formData.discountPrice)) ? parseFloat(formData.discountPrice) : undefined),
        discountPrice: (formData.mrp && !isNaN(parseFloat(formData.mrp))) ? parseFloat(formData.mrp) : (formData.discountPrice && !isNaN(parseFloat(formData.discountPrice)) ? parseFloat(formData.discountPrice) : undefined),
        stock: totalStock,
        images: formData.images.map(normalizeMediaUrl).filter(Boolean),
        preview3dImages: (formData.preview3dImages || []).map(normalizeMediaUrl).filter(Boolean),
        sizeStock: formData.sizeStock,
        dimensions: {
          length: parseFloat(formData.dimensions?.length) || 20,
          width: parseFloat(formData.dimensions?.width) || 15,
          height: parseFloat(formData.dimensions?.height) || 5
        },
        weightKg: parseFloat(formData.weightKg || formData.weight?.value || formData.weight) || 0.5,
        materials: formData.materials,
        fabric: formData.fabric,
        fit: formData.fit,
        occasion: formData.occasion,
        design: formData.design,
        sleeves: formData.sleeves,
        length: formData.length,
        careInstructions: formData.careInstructions,
        tags: finalTags,
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

  const handleMoveProduct = async (product, direction) => {
    const currentIndex = products.findIndex(p => p._id === product._id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= products.length) return

    const targetProduct = products[targetIndex]

    const updatedProducts = [...products]
    updatedProducts[currentIndex] = targetProduct
    updatedProducts[targetIndex] = product

    const reordered = updatedProducts.map((p, idx) => ({
      ...p,
      order: idx
    }))

    setProducts(reordered)

    try {
      await Promise.all([
        apiRequest(`${API_ENDPOINTS.PRODUCTS}/${product._id}`, {
          method: 'PUT',
          auth: true,
          body: { order: targetIndex }
        }),
        apiRequest(`${API_ENDPOINTS.PRODUCTS}/${targetProduct._id}`, {
          method: 'PUT',
          auth: true,
          body: { order: currentIndex }
        })
      ])
      showNotification(`Moved "${product.name}" ${direction === 'up' ? 'Up ⬆️' : 'Down ⬇️'}`)
    } catch (err) {
      console.error('Reorder error:', err)
      showNotification('Failed to update product position', 'error')
      fetchProducts()
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
    const defaultBrand = availableBrands[0] || ''
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      slug: '',
      category: defaultCat,
      brand: defaultBrand,
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
      video: '',
      tags: [],
      seo: { title: '', description: '' }
    })
    setTagInput('')
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
      brand: product.brand || (availableBrands[0] || ''),
      targetAudience: getAudienceArray(product.targetAudience || product.gender),
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
      dimensions: {
        length: product.dimensions?.length || product.dimensions?.lengthCm || product.lengthCm || (typeof product.length === 'number' ? product.length : '') || '20',
        width: product.dimensions?.width || product.dimensions?.widthCm || product.breadth || product.widthCm || '15',
        height: product.dimensions?.height || product.dimensions?.heightCm || product.heightCm || product.height || '5'
      },
      weight: typeof product.weightKg === 'number' ? product.weightKg.toString() : (typeof product.weight === 'number' ? product.weight.toString() : (product.weight?.value || product.weight?.valueGrams ? (product.weight.valueGrams / 1000).toString() : '0.5')),
      weightKg: typeof product.weightKg === 'number' ? product.weightKg.toString() : (typeof product.weight === 'number' ? product.weight.toString() : (product.weight?.value || product.weight?.valueGrams ? (product.weight.valueGrams / 1000).toString() : '0.5')),
      materials: product.materials || [],
      fabric: product.fabric || '',
      fit: product.fit || '',
      occasion: product.occasion || '',
      design: product.design || '',
      sleeves: product.sleeves || '',
      length: product.length || '',
      careInstructions: product.careInstructions || '',
      tags: product.tags || [],
      seo: product.seo || { title: '', description: '' }
    })
    setEditingProduct(product)
    setShowForm(true)
  }



  const checkBelongsToAudience = (product, audience) => {
    if (!product || !audience || audience === 'all') return true
    const target = audience.toLowerCase().trim()
    const targetAud = getAudienceArray(product.targetAudience)
    const genderArr = getAudienceArray(product.gender)
    const allAuds = [...targetAud, ...genderArr]

    const pCat = String(product.category || '').toLowerCase().trim()
    const pName = String(product.name || '').toLowerCase().trim()
    const fullText = `${pCat} ${pName}`

    const womenKeywords = ['kurti', 'sharara', 'saree', 'lehenga', 'anarkali', 'kaftan', 'gown', 'dupatta', 'suit', 'palazzo', 'women', 'female', 'ladies']
    const menKeywords = ['sherwani', 'bandhgala', 'nehru jacket', 'waistcoat', 'pathani', 'men kurta', 'kurta pyjama', 'men', 'male', 'gents', 'mens']

    const isWomenCategory = womenKeywords.some(kw => fullText.includes(kw))
    const isMenCategory = menKeywords.some(kw => fullText.includes(kw))

    const hasExplicitMen = allAuds.some(a => ['men', 'male', 'gents', 'mens'].includes(a))
    const hasExplicitWomen = allAuds.some(a => ['women', 'female', 'ladies', 'womens'].includes(a))
    const isUnisex = allAuds.some(a => ['all', 'unisex'].includes(a)) || (hasExplicitMen && hasExplicitWomen)

    if (isUnisex) return true

    if (target === 'men') {
      if (hasExplicitMen) return true
      if (hasExplicitWomen) return false
      if (isWomenCategory && !isMenCategory) return false
      if (isMenCategory) return true
      return false
    }

    if (target === 'women') {
      if (hasExplicitWomen) return true
      if (hasExplicitMen) return false
      if (isMenCategory) return false
      if (isWomenCategory) return true
      return !hasExplicitMen && !isMenCategory
    }

    return true
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.description, product.category]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || (() => {
      if (!product.category) return false
      const pCat = product.category.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
      const cFilter = categoryFilter.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
      return pCat === cFilter || pCat.includes(cFilter) || cFilter.includes(pCat)
    })()

    const matchesAudience = audienceFilter === 'all' || checkBelongsToAudience(product, audienceFilter)

    const matchesBrand = brandFilter === 'all' || (product.brand || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '') === brandFilter.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
    const matchesCollection = collectionFilter === 'all'
      || (collectionFilter === 'collection' && product.inCollection)
      || (collectionFilter === 'regular' && !product.inCollection)
    const matchesStock = stockFilter === 'all'
      || (stockFilter === 'in-stock' && product.stock > 0)
      || (stockFilter === 'out-of-stock' && product.stock === 0)
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' && product.isActive !== false)
      || (statusFilter === 'inactive' && product.isActive === false)

    return matchesSearch && matchesCategory && matchesAudience && matchesBrand && matchesCollection && matchesStock && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="products-manager">
      <div className="manager-header">
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

        <div className="filter-selects-group">
          <select className="toolbar-select" value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)}>
            <option value="all">All Gender (Men & Women)</option>
            <option value="women">Women Only</option>
            <option value="men">Men Only</option>
          </select>

          <select className="toolbar-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {availableCategories.map(cat => {
              const slug = typeof cat === 'string' ? cat : (cat.slug || cat.title)
              const title = typeof cat === 'string' ? (cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')) : (cat.title || cat.slug)
              return <option key={slug} value={slug}>{title}</option>
            })}
          </select>

          <select className="toolbar-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="all">All Brands</option>
            {availableBrands.map(b => (
              <option key={b} value={b}>{b}</option>
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

          <select className="toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses (Active & Inactive)</option>
            <option value="active">Active Only (Live on Storefront)</option>
            <option value="inactive">Inactive Only (Hidden on Storefront)</option>
          </select>
        </div>
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
                <button className={formTab === 'features' ? 'active' : ''} onClick={() => setFormTab('features')}>Features & Specs</button>
                <button className={formTab === 'advanced' ? 'active' : ''} onClick={() => setFormTab('advanced')}>Advanced</button>
                <button className={formTab === 'tags' ? 'active' : ''} onClick={() => setFormTab('tags')}>Tags & SEO</button>
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
                        <label style={{ fontWeight: 700, color: '#1e293b' }}>Brand *</label>
                        <select
                          value={formData.brand || ''}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          required
                          style={{ borderColor: '#3b82f6', background: '#f0f9ff' }}
                        >
                          <option value="">-- Select Brand --</option>
                          {availableBrands.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                          <option value="new_brand">+ Add Custom Brand</option>
                        </select>
                        {formData.brand === 'new_brand' && (
                          <input
                            type="text"
                            placeholder="Type new brand name"
                            className="mt-2"
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                const newBrandName = e.target.value.trim()
                                setAvailableBrands(prev => Array.from(new Set([...prev, newBrandName])))
                                setFormData({ ...formData, brand: newBrandName })
                              }
                            }}
                          />
                        )}
                      </div>
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

                    <div className="form-group mb-4">
                      <label style={{ fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                        Target Audience Panels (Multi-Select: Choose where this product appears) *
                      </label>
                      <div className="checkbox-audience-row" style={{ display: 'flex', gap: '1.25rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                          <input
                            type="checkbox"
                            checked={getAudienceArray(formData.targetAudience || formData.gender).includes('all')}
                            onChange={() => handleAudienceToggle('all')}
                          />
                          <span>🌐 ALL</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: '#2563eb' }}>
                          <input
                            type="checkbox"
                            checked={getAudienceArray(formData.targetAudience || formData.gender).includes('men')}
                            onChange={() => handleAudienceToggle('men')}
                          />
                          <span>👨 MEN</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: '#ec4899' }}>
                          <input
                            type="checkbox"
                            checked={getAudienceArray(formData.targetAudience || formData.gender).includes('women')}
                            onChange={() => handleAudienceToggle('women')}
                          />
                          <span>👩 WOMEN</span>
                        </label>
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

                {formTab === 'features' && (
                  <div className="form-tab-content">
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1c1917', marginBottom: '14px' }}>
                      ✦ Features & Craft Details (Displays in Features & Craft Tab)
                    </h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Fabric / Material</label>
                        <input
                          type="text"
                          value={formData.fabric || ''}
                          onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                          placeholder="e.g. Silk Blend with Organza Accents"
                        />
                      </div>
                      <div className="form-group">
                        <label>Fit Type</label>
                        <input
                          type="text"
                          value={formData.fit || ''}
                          onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                          placeholder="e.g. Regular Fit / A-Line Silhouette"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Occasion</label>
                        <input
                          type="text"
                          value={formData.occasion || ''}
                          onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                          placeholder="e.g. Festival, Wedding, Festive Get-togethers"
                        />
                      </div>
                      <div className="form-group">
                        <label>Design / Pattern</label>
                        <input
                          type="text"
                          value={formData.design || ''}
                          onChange={(e) => setFormData({ ...formData, design: e.target.value })}
                          placeholder="e.g. Abstract Print, Hand Embroidery"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Sleeves</label>
                        <input
                          type="text"
                          value={formData.sleeves || ''}
                          onChange={(e) => setFormData({ ...formData, sleeves: e.target.value })}
                          placeholder="e.g. 3/4 Sleeves, Full Sleeves"
                        />
                      </div>
                      <div className="form-group">
                        <label>Garment Length</label>
                        <input
                          type="text"
                          value={formData.length || ''}
                          onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                          placeholder="e.g. Ankle Length, Calf Length"
                        />
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', margin: '18px 0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Weight (kg)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 0.5"
                            value={formData.weightKg !== undefined ? formData.weightKg : (typeof formData.weight === 'string' ? formData.weight : (formData.weight?.value || ''))}
                            onChange={(e) => setFormData({ ...formData, weightKg: e.target.value, weight: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Length (cm)</label>
                          <input
                            type="number"
                            placeholder="e.g. 20"
                            value={formData.dimensions?.length !== undefined ? formData.dimensions.length : ''}
                            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Breadth / Width (cm)</label>
                          <input
                            type="number"
                            placeholder="e.g. 15"
                            value={formData.dimensions?.width !== undefined ? formData.dimensions.width : ''}
                            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: e.target.value } })}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Height (cm)</label>
                          <input
                            type="number"
                            placeholder="e.g. 5"
                            value={formData.dimensions?.height !== undefined ? formData.dimensions.height : ''}
                            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: e.target.value } })}
                          />
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1c1917', margin: '22px 0 14px 0' }}>
                      ✦ Specs & Care Instructions (Displays in Specs & Care Tab)
                    </h3>
                    <div className="form-group">
                      <label>Care Instructions</label>
                      <textarea
                        rows={3}
                        value={formData.careInstructions || ''}
                        onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                        placeholder="e.g. Dry Clean Only. Store in cool place away from direct sunlight."
                      />
                    </div>
                  </div>
                )}

                {formTab === 'advanced' && (
                  <div className="form-tab-content">
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

                {(formTab === 'tags' || formTab === 'seo') && (
                  <div className="form-tab-content">
                    <div className="form-group">
                      <label>Product Tags (e.g. White, Festival, Partywear)</label>
                      <div className="url-upload-row">
                        <input
                          type="text"
                          className="url-upload-input"
                          placeholder="Type tag (e.g. white, festival, partywear) and press Enter"
                          value={tagInput}
                          onChange={(e) => {
                            const val = e.target.value
                            setTagInput(val)
                            if (val.includes(',')) {
                              handleAddTag(val)
                            }
                          }}
                          onBlur={() => {
                            if (tagInput.trim()) {
                              handleAddTag()
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="url-upload-btn"
                          onClick={() => handleAddTag()}
                        >
                          + Add Tag
                        </button>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '6px' }}>
                        Separate multiple tags with commas (e.g. <code>white, festival, silk</code>).
                      </p>
                    </div>

                    {/* Quick Popular Tag Suggestions */}
                    <div className="form-group" style={{ marginTop: '16px' }}>
                      <label style={{ fontSize: '0.85rem', color: '#555', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                        ✦ Quick Add Popular Tags
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['White', 'Festival', 'Wedding', 'Partywear', 'Casual', 'Summer', 'Diwali', 'Bridal', 'Handloom', 'Silk', 'Cotton', 'Embroidered', 'Pastel'].map(popularTag => {
                          const isAdded = (formData.tags || []).some(t => t.toLowerCase() === popularTag.toLowerCase())
                          return (
                            <button
                              key={popularTag}
                              type="button"
                              onClick={() => isAdded ? handleRemoveTag(popularTag) : handleAddTag(popularTag)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                border: isAdded ? '1px solid #d4af37' : '1px dashed #ccc',
                                background: isAdded ? '#fefdfb' : '#fafafa',
                                color: isAdded ? '#d4af37' : '#555',
                                fontWeight: isAdded ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {isAdded ? `✓ ${popularTag}` : `+ ${popularTag}`}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Currently Selected Tags */}
                    <div className="form-group" style={{ marginTop: '20px' }}>
                      <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        Assigned Product Tags ({(formData.tags || []).length})
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '48px', padding: '12px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                        {(formData.tags || []).length > 0 ? (
                          formData.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                background: '#1a1a1a',
                                color: '#fff',
                                borderRadius: '16px',
                                fontSize: '0.82rem',
                                fontWeight: '500'
                              }}
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#bbb',
                                  cursor: 'pointer',
                                  fontSize: '1rem',
                                  lineHeight: 1,
                                  padding: 0,
                                  marginLeft: '4px'
                                }}
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        ) : (
                          <p style={{ color: '#999', fontSize: '0.85rem', margin: 0, alignSelf: 'center' }}>
                            No tags assigned yet. Type above or click popular tags to assign.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Secondary SEO Fields */}
                    <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                      <h4 style={{ fontSize: '0.95rem', color: '#333', marginBottom: '14px', fontWeight: '600' }}>Search Engine Meta Settings (SEO)</h4>
                      <div className="form-group">
                        <label>SEO Search Title</label>
                        <input type="text" value={formData.seo?.title || ''} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })} placeholder="Google search title" />
                      </div>
                      <div className="form-group">
                        <label>SEO Meta Description</label>
                        <textarea value={formData.seo?.description || ''} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })} rows="2" placeholder="Meta description for search engines" />
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
                    <div className="product-taxonomy-cell">
                      <div className="taxonomy-pill-row">
                        <span className="category-badge-pill">{product.category || 'General'}</span>
                        {product.brand && (
                          <span
                            className="brand-badge-pill"
                            onClick={() => setBrandFilter(product.brand)}
                            title={`Click to filter products by ${product.brand}`}
                          >
                            🏢 {product.brand}
                          </span>
                        )}
                      </div>
                      <div className="audience-pill-row">
                        {(() => {
                          const auds = getAudienceArray(product.targetAudience || product.gender)
                          return auds.map((aud, i) => {
                            const isMen = aud === 'men'
                            const isWomen = aud === 'women'
                            const badgeClass = isMen ? 'aud-badge men' : isWomen ? 'aud-badge women' : 'aud-badge all'
                            const icon = isMen ? '👨' : isWomen ? '👩' : '🌐'
                            return (
                              <span key={i} className={badgeClass}>
                                {icon} {aud.toUpperCase()}
                              </span>
                            )
                          })
                        })()}
                      </div>
                    </div>
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
                        onClick={() => handleMoveProduct(product, 'up')}
                        disabled={products.findIndex(p => p._id === product._id) === 0}
                        className="action-icon-btn move-up"
                        title="Move Up (Aage / Uper)"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                      </button>
                      <button
                        onClick={() => handleMoveProduct(product, 'down')}
                        disabled={products.findIndex(p => p._id === product._id) === products.length - 1}
                        className="action-icon-btn move-down"
                        title="Move Down (Peeche / Neeche)"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>
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
                    <div className="taxonomy-pill-row">
                      <span className="category-badge-pill">{product.category || 'General'}</span>
                      {product.brand && (
                        <span
                          className="brand-badge-pill"
                          onClick={() => setBrandFilter(product.brand)}
                        >
                          🏢 {product.brand}
                        </span>
                      )}
                    </div>
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
                  onClick={() => handleMoveProduct(product, 'up')}
                  disabled={products.findIndex(p => p._id === product._id) === 0}
                  className="mobile-action-btn move-up"
                  title="Move Up (Uper)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  <span>Up</span>
                </button>
                <button
                  onClick={() => handleMoveProduct(product, 'down')}
                  disabled={products.findIndex(p => p._id === product._id) === products.length - 1}
                  className="mobile-action-btn move-down"
                  title="Move Down (Neeche)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  <span>Down</span>
                </button>
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
