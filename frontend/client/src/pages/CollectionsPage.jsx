import { useState, useEffect, useContext, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { isProductInCategory } from '../utils/categoryHelper'
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
  const [addedToast, setAddedToast] = useState(false)

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

      // Dynamic Categories collection for tabs
      const catsMap = new Map()
      catsMap.set('all', { value: 'all', label: 'All Collections' })
      catsMap.set('2-piece-sets', { value: '2-piece-sets', label: '2-Piece Sets' })
      catsMap.set('3-piece-sets', { value: '3-piece-sets', label: '3-Piece Sets' })
      catsMap.set('co-ord-sets', { value: 'co-ord-sets', label: 'Co-ord Sets' })

      if (settingsData?.success && settingsData.data?.categorySlides) {
        settingsData.data.categorySlides.forEach(slide => {
          const val = (slide.slug || slide.title || '').toLowerCase().trim()
          const label = slide.title || val.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          if (val && !catsMap.has(val)) {
            catsMap.set(val, { value: val, label })
          }
        })
      }

      activeProducts.forEach(p => {
        if (!p.category) return
        const val = p.category.toLowerCase().trim()
        if (!catsMap.has(val)) {
          const label = p.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          catsMap.set(val, { value: val, label })
        }
      })

      setCategoriesList(Array.from(catsMap.values()))
    } catch (error) {
      console.error('Error fetching collections data:', error)
    } finally {
      setLoading(false)
    }
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
        p.description?.toLowerCase().includes(q)
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
  }, [products, selectedCategory, searchQuery, priceFilter, sortBy])

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
    setSortBy('featured')
    setSearchQuery('')
  }

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
        <div className="seal-badge-box">
          <span className="rotating-star">✦</span>
          <span className="seal-text">SEEMEE HAUTE COUTURE • COMPLETE CATALOG</span>
        </div>
        <h1 className="collections-title">Shop Our <span>Collections</span></h1>
        <p className="collections-subtitle">Explore our full repertoire of handcrafted luxury ensembles and silhouettes.</p>
      </motion.div>



      {/* Controls & Filtering Bar */}
      <motion.div
        className="collections-controls"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Search */}
        <div className="collections-search">
          <input
            type="text"
            placeholder="Search silhouettes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Filters Group */}
        <div className="controls-right-group">
          {/* Price Filter */}
          <div className="control-select-box">
            <label>Price:</label>
            <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
              <option value="all">All Prices</option>
              <option value="under-5000">Under ₹5,000</option>
              <option value="5000-15000">₹5,000 - ₹15,000</option>
              <option value="15000-30000">₹15,000 - ₹30,000</option>
              <option value="above-30000">Above ₹30,000</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="control-select-box">
            <label>Sort By:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          <div className="collections-count">
            <span>✦ {filteredProducts.length} Silhouettes</span>
          </div>

          {(selectedCategory !== 'all' || priceFilter !== 'all' || searchQuery || sortBy !== 'featured') && (
            <button className="clear-filters-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          )}
        </div>
      </motion.div>

      {/* Products Grid */}
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
