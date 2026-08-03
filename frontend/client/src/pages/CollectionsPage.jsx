import { useState, useEffect, useContext, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { isProductInCategory, getCategoryProducts } from '../utils/categoryHelper'
import './CollectionsPage.css'

const CollectionsPage = () => {
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useContext(CartContext)

  const [products, setProducts] = useState([])
  const [categoriesList, setCategoriesList] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & Search & Sorting
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [selectedSizes, setSelectedSizes] = useState([])
  const [showSidebar, setShowSidebar] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [openSections, setOpenSections] = useState({
    search: true,
    categories: true,
    price: true,
    sizes: true,
    sort: true
  })
  const [addedToast, setAddedToast] = useState(false)

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }))
  }

  // Quick View Modal
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState('M')

  useEffect(() => {
    fetchCollectionsAndProducts()
    window.scrollTo(0, 0)
  }, [])

  const fetchCollectionsAndProducts = async () => {
    setLoading(true)
    try {
      const [prodData, settingsData] = await Promise.all([
        cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=1000`),
        cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true })
      ])

      const activeProducts = prodData?.success && Array.isArray(prodData.data)
        ? prodData.data.filter(p => p.isActive)
        : []
      setProducts(activeProducts)

      // Dynamic Categories collection strictly from Admin Panel Site Settings
      const catsMap = new Map()
      catsMap.set('all', { value: 'all', label: 'All Collections' })

      if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides) && settingsData.data.categorySlides.length > 0) {
        settingsData.data.categorySlides.forEach(slide => {
          const val = (slide.slug || slide.title || '').toLowerCase().trim()
          const label = slide.title || val.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          if (val && !catsMap.has(val)) {
            catsMap.set(val, { value: val, label })
          }
        })
      } else {
        // Fallback to active products' categories if Admin site-settings isn't set up yet
        activeProducts.forEach(p => {
          if (!p.category) return
          const val = p.category.toLowerCase().trim()
          if (!catsMap.has(val)) {
            const label = p.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            catsMap.set(val, { value: val, label })
          }
        })
      }

      setCategoriesList(Array.from(catsMap.values()))
    } catch (error) {
      console.error('Error fetching collections data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSizeFilter = (sz) => {
    setSelectedSizes(prev =>
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    )
  }

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Category Filter
    if (selectedCategory !== 'all') {
      result = getCategoryProducts(result, selectedCategory)
    }

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some(t => t?.toLowerCase().includes(q)))
      )
    }

    // Price Filter
    if (priceFilter !== 'all') {
      result = result.filter(p => {
        const price = p.price || 0
        switch (priceFilter) {
          case 'under-5000':
            return price < 5000
          case '5000-15000':
            return price >= 5000 && price <= 15000
          case '15000-30000':
            return price >= 15000 && price <= 30000
          case 'above-30000':
            return price > 30000
          default:
            return true
        }
      })
    }

    // Size Filter
    if (selectedSizes.length > 0) {
      result = result.filter(p =>
        Array.isArray(p.sizes) && p.sizes.some(s => selectedSizes.includes(s))
      )
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        break
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      default:
        // featured
        break
    }

    return result
  }, [products, selectedCategory, searchQuery, priceFilter, selectedSizes, sortBy])

  const handleAddToCart = (product, size) => {
    const itemSize = size || selectedSize || product.sizes?.[0] || 'M'
    addToCart({ ...product, selectedSize: itemSize })
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setSelectedSize(product.sizes?.[0] || 'M')
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
  }

  const resetFilters = () => {
    setSelectedCategory('all')
    setPriceFilter('all')
    setSelectedSizes([])
    setSortBy('featured')
    setSearchQuery('')
  }

  const hasActiveFilters = selectedCategory !== 'all' || priceFilter !== 'all' || selectedSizes.length > 0 || searchQuery.trim() !== '' || sortBy !== 'featured'

  if (loading) {
    return (
      <div className="collections-page-loading">
        <div className="glowing-gold-spinner"></div>
        <p>Curating Heritage Collections...</p>
      </div>
    )
  }

  return (
    <div className="collections-page">
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            className="collections-toast-notification"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <span className="toast-icon">✦</span>
            <span>Added to your shopping bag</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editorial Top Nav */}
      <div className="editorial-back-nav">
        <div className="editorial-back-container">
          <button onClick={() => navigate(-1)} className="editorial-back-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>
          <nav className="collections-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Shop All Collections</span>
          </nav>
        </div>
      </div>

      {/* Header Banner */}
      <motion.div
        className="collections-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="collections-title">Shop Our <span>Collections</span></h1>
        <p className="collections-subtitle">Explore our full repertoire of handcrafted luxury ensembles and silhouettes.</p>
      </motion.div>

      {/* Main Layout: Sticky Sidebar Filter on Left + Product Grid on Right */}
      <div className="collections-main-layout">
        {/* Left Sidebar Filter Panel (Unified for Desktop and Mobile) */}
        <aside className={`collections-sidebar-panel ${showMobileFilters ? 'mobile-active' : ''}`}>


          <div className="sidebar-widgets-scroll-container">
            {/* Search Widget */}
            <div className="sidebar-widget">
              <h4 className="widget-title">SEARCH</h4>
              <div className="sidebar-search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search style or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="sidebar-clear-x" onClick={() => setSearchQuery('')}>&times;</button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="sidebar-widget">
              <h4 className="widget-title">CATEGORIES</h4>
              <div className="sidebar-category-list">
                {categoriesList.map(cat => {
                  const count = cat.value === 'all'
                    ? products.length
                    : getCategoryProducts(products, cat.value).length
                  const isSelected = selectedCategory === cat.value

                  return (
                    <button
                      key={cat.value}
                      className={`sidebar-cat-row ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      <span className="cat-bullet">{isSelected ? '✦' : '•'}</span>
                      <span className="cat-name">{cat.label}</span>
                      <span className="cat-count">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="sidebar-widget">
              <h4 className="widget-title">PRICE RANGE</h4>
              <div className="sidebar-radio-group">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under-5000', label: 'Under ₹5,000' },
                  { id: '5000-15000', label: '₹5,000 - ₹15,000' },
                  { id: '15000-30000', label: '₹15,000 - ₹30,000' },
                  { id: 'above-30000', label: 'Above ₹30,000' }
                ].map(p => (
                  <label key={p.id} className={`sidebar-radio-row ${priceFilter === p.id ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="collectionsSidebarPrice"
                      checked={priceFilter === p.id}
                      onChange={() => setPriceFilter(p.id)}
                    />
                    <span className="radio-label">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="sidebar-widget">
              <h4 className="widget-title">SIZES</h4>
              <div className="sidebar-size-pills">
                {['S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                  const isSelected = selectedSizes.includes(sz)
                  return (
                    <button
                      key={sz}
                      className={`sidebar-size-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleSizeFilter(sz)}
                    >
                      {sz}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sort By Widget */}
            <div className="sidebar-widget">
              <h4 className="widget-title">SORT BY</h4>
              <div className="sidebar-select-wrap">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">Featured Order</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Reset Button */}
          {hasActiveFilters && (
            <button className="sidebar-clear-all-cta desktop-only" onClick={resetFilters}>
              ✦ CLEAR ALL FILTERS
            </button>
          )}

          {/* Mobile Footer Action Bar */}
          <div className="mobile-sidebar-footer-bar">
            {hasActiveFilters && (
              <button className="mobile-sidebar-reset-btn" onClick={resetFilters}>
                Reset
              </button>
            )}
            <button className="mobile-sidebar-apply-btn" onClick={() => setShowMobileFilters(false)}>
              Show ({filteredProducts.length}) Results
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop Overlay */}
        {showMobileFilters && (
          <div className="mobile-sidebar-backdrop" onClick={() => setShowMobileFilters(false)} />
        )}

        {/* Right Product Grid Wrapper */}
        <div className="collections-grid-wrapper">
          <div className="grid-header-bar">
            <span className="grid-count-chip">✦ {filteredProducts.length} SILHOUETTES</span>
            <button
              className="mobile-filter-trigger-btn"
              onClick={() => setShowMobileFilters(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>Filters</span>
            </button>
          </div>

          <div className="collections-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <span className="no-products-icon">✧</span>
                <h3>No Silhouettes Match Your Criteria</h3>
                <p>Try adjusting your search terms, category filters, or price range.</p>
                <button className="reset-btn-cta" onClick={resetFilters}>
                  View All Collections
                </button>
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const hasDiscount = (product.mrp || product.discountPrice) && Number(product.mrp || product.discountPrice) > Number(product.price)
                const mainImg = getOptimizedImageUrl(product.images?.[0] || product.image, 'product')

                return (
                  <motion.div
                    key={product._id || index}
                    className="collection-product-card"
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
                  >
                    <div
                      className="product-image-wrapper"
                      onClick={() => navigate(`/product/${product._id}`, { state: { product } })}
                    >
                      <img
                        src={mainImg}
                        alt={product.name}
                        className="product-image"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                      />

                      <div className="product-overlay">
                        <button
                          className="quick-view-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            openProductModal(product)
                          }}
                        >
                          Quick View
                        </button>
                      </div>

                      <button
                        className={`wishlist-btn-card ${isInWishlist(product._id) ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWishlist(product)
                        }}
                        title="Add to Wishlist"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {product.stock === 0 && (
                        <div className="out-of-stock-badge">Sold Out</div>
                      )}
                    </div>

                    <div className="product-info">
                      <h3
                        className="product-name"
                        onClick={() => navigate(`/product/${product._id}`, { state: { product } })}
                      >
                        {product.name}
                      </h3>

                      <div className="product-footer">
                        <div className="collection-price-group">
                          <span className="product-price">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                          {hasDiscount && (
                            <span className="product-mrp-crossed">
                              ₹{Number(product.mrp || product.discountPrice).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <motion.button
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {product.stock === 0 ? 'Sold Out' : '+ Add to Bag'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>



      {/* Quick View Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            className="product-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProductModal}
          >
            <motion.div
              className="product-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeProductModal}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="modal-content">
                <div className="modal-image">
                  <img
                    src={getOptimizedImageUrl(selectedProduct.images?.[0] || selectedProduct.image, 'hero')}
                    alt={selectedProduct.name}
                    onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                  />
                </div>

                <div className="modal-details">
                  <span className="modal-category">
                    {(selectedProduct.category || 'Atelier Collection').toUpperCase()}
                  </span>
                  <h2 className="modal-title">{selectedProduct.name}</h2>
                  <p className="modal-description">{selectedProduct.description}</p>

                  <div className="modal-price-section">
                    <div className="modal-price-group">
                      <span className="modal-price">₹{Number(selectedProduct.price || 0).toLocaleString('en-IN')}</span>
                      {(selectedProduct.mrp || selectedProduct.discountPrice) && Number(selectedProduct.mrp || selectedProduct.discountPrice) > Number(selectedProduct.price) && (
                        <span className="modal-mrp-crossed">
                          ₹{Number(selectedProduct.mrp || selectedProduct.discountPrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {selectedProduct.stock > 0 ? (
                      <span className="modal-stock in-stock">✦ In Stock</span>
                    ) : (
                      <span className="modal-stock out-stock">✦ Sold Out</span>
                    )}
                  </div>

                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="modal-size-selector">
                      <label>Select Size:</label>
                      <div className="size-buttons">
                        {selectedProduct.sizes.map(sz => (
                          <button
                            key={sz}
                            className={`size-btn ${selectedSize === sz ? 'active' : ''}`}
                            onClick={() => setSelectedSize(sz)}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <motion.button
                      className="modal-add-to-cart"
                      onClick={() => {
                        handleAddToCart(selectedProduct, selectedSize)
                        closeProductModal()
                      }}
                      disabled={selectedProduct.stock === 0}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {selectedProduct.stock === 0 ? 'Sold Out' : 'ADD TO BAG'}
                    </motion.button>

                    <button
                      className="modal-full-details-btn"
                      onClick={() => {
                        closeProductModal()
                        navigate(`/product/${selectedProduct._id}`, { state: { product: selectedProduct } })
                      }}
                    >
                      View Full Details →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CollectionsPage
