import { useState, useEffect, useContext, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getImageUrl, getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { isProductInCategory, getCategoryProducts } from '../utils/categoryHelper'
import { trackViewItemList, trackSelectItem } from '../utils/gtmEcommerce'
import AddToCartButton from '../components/AddToCartButton'
import './CategoryPage.css'

const CategoryPage = () => {
  const { categoryName } = useParams()
  const navigate = useNavigate()
  const { addToCart, buyNow, toggleWishlist, isInWishlist } = useContext(CartContext)

  const [products, setProducts] = useState([])
  const [allCategories, setAllCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtering & Sorting States
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [priceFilter, setPriceFilter] = useState('all')
  const [selectedSizes, setSelectedSizes] = useState([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // 4 Layout Modes: 'atelier' (3-col), 'lookbook' (2-col Editorial), 'matrix' (4-col), 'runway' (1-col Showcase)
  const [viewMode, setViewMode] = useState('atelier')

  // Quick Preview Modal state
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [quickViewActiveImage, setQuickViewActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [addedToast, setAddedToast] = useState(false)

  const [categoryInfo, setCategoryInfo] = useState({
    title: '',
    subtitle: 'The Atelier Collection',
    description: '',
    image: '',
    features: []
  })

  useEffect(() => {
    fetchCategoryDataAndProducts()
    window.scrollTo(0, 0)
    setSearchQuery('')
    setPriceFilter('all')
    setSelectedSizes([])
  }, [categoryName])

  const fetchCategoryDataAndProducts = async () => {
    setLoading(true)
    try {
      const [prodData, settingsData] = await Promise.all([
        cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=10000`),
        cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true })
      ])

      const rawList = Array.isArray(prodData?.data) ? prodData.data : (Array.isArray(prodData?.products) ? prodData.products : [])
      const activeProducts = rawList.filter(p => p.isActive !== false)

      let slidesList = []
      if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides) && settingsData.data.categorySlides.length > 0) {
        slidesList = settingsData.data.categorySlides.filter(Boolean)
      }

      // Merge distinct product categories from Admin products
      const existingSlugs = new Set(slidesList.map(c => (c?.slug || c?.title || '').toLowerCase().trim()).filter(Boolean))

      activeProducts.forEach(p => {
        if (!p || !p.category) return
        const pCatSlug = p.category.toLowerCase().trim()
        const normPCat = pCatSlug.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')

        const alreadyExists = Array.from(existingSlugs).some(s => {
          const normS = s.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
          return s === pCatSlug || normS === normPCat
        })

        if (!alreadyExists) {
          const titleFormatted = p.category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
          slidesList.push({
            slug: pCatSlug,
            title: titleFormatted,
            subtitle: 'Admin Collection',
            description: `Experience the grace of ${titleFormatted} silhouettes.`,
            image: (p.images?.[0] || p.image) || ''
          })
          existingSlugs.add(pCatSlug)
        }
      })

      setAllCategories(slidesList)

      const targetSlug = categoryName ? categoryName.toLowerCase().trim() : ''
      const targetNorm = targetSlug.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')

      let matchedSlide = slidesList.find(s => {
        if (!s) return false
        const sSlug = (s.slug || s.title || '').toLowerCase().trim()
        const sNorm = sSlug.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
        return sSlug === targetSlug || sNorm === targetNorm
      })

      const formattedName = categoryName
        ? categoryName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'Collection'

      if (matchedSlide) {
        setCategoryInfo({
          title: matchedSlide.title || formattedName,
          subtitle: matchedSlide.subtitle || 'The Atelier Collection',
          description: matchedSlide.description || `Experience the grace of ${matchedSlide.title || formattedName} silhouettes, blending traditional craftsmanship with contemporary luxury.`,
          image: matchedSlide.image || '',
          features: matchedSlide.features?.length ? matchedSlide.features : ['Luxury Tailoring', 'Pure Fabrics', 'Editorial Cut']
        })
      } else {
        setCategoryInfo({
          title: formattedName,
          subtitle: 'The Atelier Collection',
          description: `Experience the grace of ${formattedName} silhouettes, blending traditional craftsmanship with contemporary luxury.`,
          image: '',
          features: ['Luxury Tailoring', 'Pure Fabrics', 'Editorial Cut']
        })
      }

      const matchedProducts = getCategoryProducts(activeProducts, categoryName)
      setProducts(matchedProducts)
    } catch (error) {
      console.error('Error fetching category page data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and Sort Computation
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Audience / Gender Filter (Strict Panel Segmentation)
    const currentAudience = (new URLSearchParams(location.search)).get('gender') || localStorage.getItem('seemee_active_audience') || 'all'
    if (currentAudience && currentAudience !== 'all') {
      result = result.filter(p => belongsToAudience(p, currentAudience))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some(t => t?.toLowerCase().includes(q)))
      )
    }

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

    if (selectedSizes.length > 0) {
      result = result.filter(p => {
        const pSizes = p.sizes || ['S', 'M', 'L', 'XL']
        return selectedSizes.some(sz => pSizes.includes(sz))
      })
    }

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
        break
    }

    return result
  }, [products, searchQuery, priceFilter, selectedSizes, sortBy])

  useEffect(() => {
    if (filteredProducts.length > 0) {
      try {
        trackViewItemList(filteredProducts, categoryName || 'Category', categoryName || 'category')
      } catch (e) {
        console.error('GTM error in trackViewItemList:', e)
      }
    }
  }, [filteredProducts.length, categoryName])

  const toggleSizeFilter = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const resetAllFilters = () => {
    setSearchQuery('')
    setPriceFilter('all')
    setSelectedSizes([])
    setSortBy('featured')
  }

  const openQuickView = (e, product) => {
    e.stopPropagation()
    setQuickViewProduct(product)
    setQuickViewActiveImage(0)
    setSelectedSize(product.sizes?.[0] || 'M')
  }

  const handleQuickAdd = (e, product, sizeOverride) => {
    e.stopPropagation()
    const size = sizeOverride || product.sizes?.[0] || 'M'
    addToCart({ ...product, selectedSize: size })
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  const hasActiveFilters = searchQuery !== '' || priceFilter !== 'all' || selectedSizes.length > 0

  return (
    <div className="unique-category-page">
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            className="category-toast-notification"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <span className="toast-icon">✦</span>
            <span>Added to your luxury shopping bag</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Modern Category Page Header (No Giant Dark Banner) */}
      <header className="category-page-header">
        <div className="category-header-container">
          <div className="category-header-top">
            <button onClick={() => navigate('/categories')} className="editorial-back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>All Collections</span>
            </button>

            <nav className="category-breadcrumbs">
              <Link to="/">Home</Link>
              <span className="crumb-sep">/</span>
              <Link to="/categories">Categories</Link>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{categoryInfo.title}</span>
            </nav>
          </div>

          <div className="category-header-title-bar">
            <div className="category-header-info">
              <span className="category-badge-tag">✦ SEEMEE ATELIER</span>
              <h1 className="category-main-heading">{categoryInfo.title}</h1>
              {categoryInfo.description && (
                <p className="category-description-sub">{categoryInfo.description}</p>
              )}
            </div>


          </div>
        </div>
      </header>

      {/* Redesigned Luxury Filter & Controls Bar */}
      <div className="unique-toolbar-section">
        <div className="toolbar-glass-card">
          {/* Main Controls Row */}
          <div className="toolbar-primary-row">
            <div className="toolbar-left-group">
              <span className="count-badge-luxury">✦ {filteredProducts.length} DESIGNS</span>

              <button
                className="mobile-filter-trigger-btn"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span>REFINE FILTERS</span>
              </button>
            </div>

            <div className="toolbar-center-search">
              <div className="luxury-search-input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder={`Search ${categoryInfo.title || 'silhouettes'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>&times;</button>
                )}
              </div>
            </div>

            <div className="toolbar-right-selects">
              <div className="luxury-select-wrapper">
                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                  <option value="all">Price: All Ranges</option>
                  <option value="under-5000">Under ₹5,000</option>
                  <option value="5000-15000">₹5,000 - ₹15,000</option>
                  <option value="15000-30000">₹15,000 - ₹30,000</option>
                  <option value="above-30000">Above ₹30,000</option>
                </select>
              </div>

              <div className="luxury-select-wrapper">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">Featured Order</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Size Filter Pills Sub-Row */}
          <div className="size-filter-row">
            <span className="size-row-label">✦ SELECT SIZE:</span>
            <div className="size-pills-container">
              {['S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                const isSelected = selectedSizes.includes(sz)
                return (
                  <button
                    key={sz}
                    className={`luxury-size-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleSizeFilter(sz)}
                  >
                    {sz}
                  </button>
                )
              })}
            </div>

            {hasActiveFilters && (
              <button className="luxury-reset-filters-btn" onClick={resetAllFilters}>
                ✦ RESET ALL FILTERS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            className="mobile-filter-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              className="mobile-filter-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <h3 style={{ fontWeight: 900, fontSize: '1.35rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#000000' }}>FILTER</h3>
                <button className="drawer-close-btn" onClick={() => setShowMobileFilters(false)}>&times;</button>
              </div>

              <div className="drawer-body">
                <div className="drawer-section">
                  <label>Search Designs</label>
                  <input
                    type="text"
                    placeholder="Search by name or style..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="drawer-section">
                  <label>Price Range</label>
                  <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                    <option value="all">All Prices</option>
                    <option value="under-5000">Under ₹5,000</option>
                    <option value="5000-15000">₹5,000 - ₹15,000</option>
                    <option value="15000-30000">₹15,000 - ₹30,000</option>
                    <option value="above-30000">Above ₹30,000</option>
                  </select>
                </div>

                <div className="drawer-section">
                  <label>Available Sizes</label>
                  <div className="drawer-size-pills">
                    {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                      <button
                        key={sz}
                        className={`drawer-size-pill ${selectedSizes.includes(sz) ? 'active' : ''}`}
                        onClick={() => toggleSizeFilter(sz)}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="drawer-section">
                  <label>Sort By</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest</option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>

              <div className="drawer-footer">
                <button className="reset-drawer-btn" onClick={resetAllFilters}>Reset All</button>
                <button className="apply-drawer-btn" onClick={() => setShowMobileFilters(false)}>Show Results</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Product Showcase */}
      <section className="unique-showcase-section">
        <div className="showcase-container">
          {loading ? (
            <div className="unique-loading-state">
              <div className="glowing-gold-spinner"></div>
              <p>Curating {categoryInfo.title} Runway...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="unique-empty-state">
              <div className="empty-star">✦</div>
              <h3>No Couture Designs Match</h3>
              <p>Try adjusting your search query, price range, or size filter for {categoryInfo.title}.</p>
              <button className="reset-btn" onClick={resetAllFilters}>
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="unique-product-grid">
              {filteredProducts.map((product, index) => {
                const imagesList = product.images?.length > 0
                  ? product.images
                  : (product.image ? [product.image] : ['/images/categories_straight.jpg'])

                const secondImg = imagesList[1]
                const discountPct = product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0

                // Formatted index number e.g. 01, 02, 03...
                const formattedIndexNum = String(index + 1).padStart(2, '0')

                return (
                  <div key={product._id || product.id || index} className="grid-item-wrapper">
                    {/* Compact Product Card */}
                    <motion.div
                      className="unique-product-card"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
                      onClick={() => {
                        const productId = product._id || product.id
                        if (productId) navigate(`/product/${productId}`, { state: { product } })
                      }}
                    >
                      <div className="card-media-box">


                        <img
                          src={getOptimizedImageUrl(imagesList[0], 'product')}
                          alt={product.name}
                          className="card-img primary"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = '/images/categories_straight.jpg' }}
                        />



                        {/* Glassmorphic Top Controls */}
                        <div className="card-top-controls">
                          <button
                            className={`action-btn-heart ${isInWishlist(product._id || product.id) ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleWishlist(product)
                            }}
                            title="Add to Wishlist"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={isInWishlist(product._id || product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          </button>

                        </div>
                      </div>

                      {/* Clean Card Info Content: Title, Divider Line, Price & + ADD Button */}
                      <div className="card-info-content">
                        <h3 className="card-editorial-title">{product.name}</h3>

                        <div className="card-divider-line"></div>

                        <div className="card-footer-row">
                          <div className="card-price-group">
                            <span className="card-price-main">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
                            {(product.mrp || product.originalPrice || product.discountPrice) && Number(product.mrp || product.originalPrice || product.discountPrice) > Number(product.price) && (
                              <span className="card-price-strikethrough">
                                ₹{Number(product.mrp || product.originalPrice || product.discountPrice).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          <AddToCartButton
                            product={product}
                            selectedSize={product.sizes?.[0] || 'M'}
                            variant="mini"
                            label="+ ADD"
                            onAddCallback={() => {
                              setAddedToast(true)
                              setTimeout(() => setAddedToast(false), 2500)
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="quickview-overlay-backdrop" onClick={() => setQuickViewProduct(null)}>
            <motion.div
              className="quickview-modal-card"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-x" onClick={() => setQuickViewProduct(null)}>&times;</button>

              <div className="modal-split-grid">
                <div className="modal-media-side">
                  {(() => {
                    const modalImgs = quickViewProduct.images?.length > 0
                      ? quickViewProduct.images
                      : [quickViewProduct.image || '/images/categories_straight.jpg']
                    const currentImg = modalImgs[quickViewActiveImage] || modalImgs[0]

                    return (
                      <div className="modal-gallery-container">
                        <div className="modal-main-img-box">
                          <img
                            src={getOptimizedImageUrl(currentImg, 'product')}
                            alt={quickViewProduct.name}
                          />
                        </div>

                        {modalImgs.length > 1 && (
                          <div className="modal-thumbnails-strip">
                            {modalImgs.map((img, idx) => (
                              <button
                                key={idx}
                                className={`modal-thumb-btn ${quickViewActiveImage === idx ? 'active' : ''}`}
                                onClick={() => setQuickViewActiveImage(idx)}
                              >
                                <img src={getOptimizedImageUrl(img, 'product')} alt="" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                <div className="modal-details-side">
                  <span className="modal-cat-tag">✦ {quickViewProduct.category || categoryInfo.title}</span>
                  <h2 className="modal-prod-title">{quickViewProduct.name}</h2>

                  <div className="modal-price-row">
                    <span className="modal-price price-value">₹{quickViewProduct.price?.toLocaleString()}</span>
                    {quickViewProduct.originalPrice && quickViewProduct.originalPrice > quickViewProduct.price && (
                      <span className="modal-orig-price">₹{quickViewProduct.originalPrice.toLocaleString()}</span>
                    )}
                  </div>

                  <p className="modal-desc">{quickViewProduct.description || categoryInfo.description}</p>

                  <div className="size-selector-box">
                    <label>Select Tailored Size:</label>
                    <div className="size-buttons-group">
                      {(quickViewProduct.sizes || ['S', 'M', 'L', 'XL']).map((s) => (
                        <button
                          key={s}
                          className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                          onClick={() => setSelectedSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="modal-action-buttons">
                    <AddToCartButton
                      product={quickViewProduct}
                      selectedSize={selectedSize}
                      variant="modal"
                      label="+ ADD TO SHOPPING BAG"
                      onAddCallback={() => {
                        setAddedToast(true)
                        setTimeout(() => setAddedToast(false), 2500)
                      }}
                    />

                    <button
                      className="buy-now-modal-btn"
                      style={{
                        padding: '14px 20px',
                        background: '#d4af37',
                        color: '#000',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        borderRadius: '2px',
                        fontSize: '0.85rem'
                      }}
                      onClick={() => {
                        if (buyNow) buyNow(quickViewProduct, selectedSize)
                        setQuickViewProduct(null)
                        navigate('/checkout')
                      }}
                    >
                      BUY NOW
                    </button>

                    <button
                      className="view-full-page-btn"
                      onClick={() => {
                        const pid = quickViewProduct._id || quickViewProduct.id
                        setQuickViewProduct(null)
                        navigate(`/product/${pid}`)
                      }}
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Craftsmanship Banner */}
      {categoryInfo.features && categoryInfo.features.length > 0 && (
        <section className="category-editorial-footer">
          <div className="editorial-glass-box">
            <span className="editorial-eyebrow">✦ SEEMEE CRAFTSMANSHIP GUARANTEE</span>
            <h2 className="editorial-title">{categoryInfo.title}</h2>
            <p className="editorial-body">
              {categoryInfo.description}
            </p>
            <div className="editorial-chips-row">
              {categoryInfo.features.map((feat, i) => (
                <span key={i} className="editorial-chip-item">✦ {feat}</span>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default CategoryPage
