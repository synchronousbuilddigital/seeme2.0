import { useState, useEffect, useContext, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { belongsToAudience } from '../utils/categoryHelper'
import { trackViewItemList, trackSelectItem } from '../utils/gtmEcommerce'
import AddToCartButton from '../components/AddToCartButton'
import { isSizeInStock, getSortedSizesForProduct, getFirstAvailableSize, isProductOutOfStock } from '../utils/sizeHelper'
import './SalePage.css'

const SalePage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toggleWishlist, isInWishlist } = useContext(CartContext)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAudience, setSelectedAudience] = useState('all')
  const [discountFilter, setDiscountFilter] = useState('all') // 'all', '50', '40', '30', '20'
  const [priceFilter, setPriceFilter] = useState('all')
  const [maxPrice, setMaxPrice] = useState(10000)
  const [selectedSizes, setSelectedSizes] = useState([])
  const [sortBy, setSortBy] = useState('discount_desc')

  // UI state
  const [showSidebar, setShowSidebar] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState('M')

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchSaleProducts()
  }, [])

  // Synchronize discount filter with URL search param (?discount=20)
  useEffect(() => {
    const dParam = searchParams.get('discount') || searchParams.get('minDiscount')
    if (dParam) {
      setDiscountFilter(dParam)
    } else {
      setDiscountFilter('all')
    }
  }, [searchParams])

  const handleDiscountSelect = (id) => {
    setDiscountFilter(id)
    const nextParams = new URLSearchParams(searchParams)
    if (id === 'all') {
      nextParams.delete('discount')
      nextParams.delete('minDiscount')
    } else {
      nextParams.set('discount', id)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const fetchSaleProducts = async () => {
    setLoading(true)
    try {
      const response = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=1000&_t=${Date.now()}`, { forceRefresh: true, ttlMs: 10000 })
      const rawList = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response?.products) ? response.products : [])

      // STRICT FILTER: ONLY products explicitly enabled for Sale in Admin Panel
      let saleItems = rawList.filter(p => {
        if (!p || p.isActive === false) return false
        return Boolean(p.isSale === true || p.onSale === true || p.isSale === 'true' || p.onSale === 'true')
      })

      // Fallback if no products explicitly flagged onSale yet: show products with active discounts
      if (saleItems.length === 0) {
        saleItems = rawList.filter(p => {
          if (!p || p.isActive === false) return false
          const price = Number(p.price || 0)
          const mrp = Number(p.mrp || p.discountPrice || 0)
          return (mrp > price && price > 0) || (p.discount && Number(p.discount) > 0)
        })
      }

      setProducts(saleItems)

      try {
        trackViewItemList(saleItems, 'Festive Sale', 'festive_sale')
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching sale products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Derive unique categories present in sale products with counts
  const categoryCounts = useMemo(() => {
    const counts = { all: products.length }
    products.forEach(p => {
      const cat = (p.category || '').trim()
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1
      }
    })
    return counts
  }, [products])

  // Derive unique available sizes (excluding CUSTOM and FREE SIZE)
  const availableSizes = useMemo(() => {
    const EXCLUDED_SIZES = ['CUSTOM', 'FREE SIZE', 'FREESIZE', 'FREE-SIZE', 'CUSTOM SIZE']
    const set = new Set()
    products.forEach(p => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach(s => {
          if (s) {
            const normalized = String(s).trim().toUpperCase()
            if (!EXCLUDED_SIZES.includes(normalized)) {
              set.add(normalized)
            }
          }
        })
      }
      if (Array.isArray(p.sizeStock)) {
        p.sizeStock.forEach(item => {
          if (item?.size) {
            const normalized = String(item.size).trim().toUpperCase()
            if (!EXCLUDED_SIZES.includes(normalized)) {
              set.add(normalized)
            }
          }
        })
      }
    })
    const order = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL']
    return Array.from(set).sort((a, b) => {
      const idxA = order.indexOf(a)
      const idxB = order.indexOf(b)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })
  }, [products])

  const toggleSizeFilter = (sz) => {
    setSelectedSizes(prev =>
      prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]
    )
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedAudience('all')
    setDiscountFilter('all')
    setPriceFilter('all')
    setMaxPrice(10000)
    setSelectedSizes([])
    setSortBy('discount_desc')
  }

  const hasActiveFilters = Boolean(
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedAudience !== 'all' ||
    discountFilter !== 'all' ||
    priceFilter !== 'all' ||
    maxPrice < 10000 ||
    selectedSizes.length > 0 ||
    sortBy !== 'discount_desc'
  )

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const price = Number(p.price || 0)
      const mrp = Number(p.mrp || p.discountPrice || p.price || 0)
      const discPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : (p.discount || 0)

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = String(p.name || '').toLowerCase().includes(q)
        const matchCat = String(p.category || '').toLowerCase().includes(q)
        const matchSku = String(p.sku || '').toLowerCase().includes(q)
        if (!matchName && !matchCat && !matchSku) return false
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const pCat = String(p.category || '').toLowerCase().trim()
        if (pCat !== selectedCategory.toLowerCase().trim()) return false
      }

      // Audience / Gender filter
      if (selectedAudience !== 'all') {
        if (!belongsToAudience(p, selectedAudience)) return false
      }

      // Discount Filter
      if (discountFilter !== 'all') {
        const minDisc = parseInt(discountFilter, 10)
        if (discPct < minDisc) return false
      }

      // Price Filter (Slider & Quick Options)
      if (priceFilter === 'slider' || maxPrice < 10000) {
        if (price > maxPrice) return false
      } else if (priceFilter !== 'all') {
        if (priceFilter === 'under_1999' && price >= 2000) return false
        if (priceFilter === '2000_3499' && (price < 2000 || price > 3499)) return false
        if (priceFilter === '3500_4999' && (price < 3500 || price > 4999)) return false
        if (priceFilter === 'above_5000' && price < 5000) return false
      }

      // Size Filter
      if (selectedSizes.length > 0) {
        const productSizes = [
          ...(Array.isArray(p.sizes) ? p.sizes.map(s => String(s).trim().toUpperCase()) : []),
          ...(Array.isArray(p.sizeStock) ? p.sizeStock.map(s => String(s.size).trim().toUpperCase()) : [])
        ]
        const hasMatchingSize = selectedSizes.some(sz => productSizes.includes(sz))
        if (!hasMatchingSize) return false
      }

      return true
    }).sort((a, b) => {
      const priceA = Number(a.price || 0)
      const priceB = Number(b.price || 0)
      const mrpA = Number(a.mrp || a.discountPrice || a.price || 0)
      const mrpB = Number(b.mrp || b.discountPrice || b.price || 0)
      const discA = mrpA > priceA ? Math.round(((mrpA - priceA) / mrpA) * 100) : 0
      const discB = mrpB > priceB ? Math.round(((mrpB - priceB) / mrpB) * 100) : 0

      if (sortBy === 'discount_desc') return discB - discA
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      return 0
    })
  }, [products, searchQuery, selectedCategory, selectedAudience, discountFilter, priceFilter, maxPrice, selectedSizes, sortBy])

  const openQuickView = (e, product) => {
    e.stopPropagation()
    setSelectedProduct(product)
    setSelectedSize(getFirstAvailableSize(product, 'M'))
  }

  const closeQuickView = () => {
    setSelectedProduct(null)
  }

  return (
    <div className="sale-page-root">
      {/* Main Two-Column Layout (Sidebar on Left + Product Grid on Right) */}
      <div className="sale-layout-container">
        {/* Left Sticky Sidebar Panel */}
        <aside className={`sale-sidebar-panel ${showSidebar ? 'desktop-visible' : 'desktop-hidden'} ${showMobileFilters ? 'mobile-open' : ''}`}>
          <div className="sidebar-inner-scroll">
            {/* Sidebar Title & Mobile Close */}
            <div className="sidebar-top-bar">
              <h3 className="sidebar-title">FILTERS</h3>
              {hasActiveFilters && (
                <button className="sidebar-reset-btn" onClick={resetFilters}>
                  Clear All
                </button>
              )}
              <button
                type="button"
                className="sidebar-mobile-close mobile-only"
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close Filters"
              >
                ✕
              </button>
            </div>

            {/* 1. Search Box Widget */}
            <div className="sidebar-widget">
              <div className="sidebar-search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search sale styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="sidebar-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            </div>

            {/* 2. Gender / Audience Widget */}
            <div className="sidebar-widget">
              <h4 className="widget-header">GENDER / AUDIENCE</h4>
              <div className="sidebar-radio-list">
                {[
                  { id: 'all', label: 'All Styles' },
                  { id: 'women', label: 'Women' },
                  { id: 'men', label: 'Men' },
                  { id: 'kids', label: 'Kids' }
                ].map(aud => {
                  const count = aud.id === 'all'
                    ? products.length
                    : products.filter(p => belongsToAudience(p, aud.id)).length
                  const isChecked = selectedAudience === aud.id
                  return (
                    <button
                      key={aud.id}
                      type="button"
                      className={`sidebar-row-item ${isChecked ? 'active' : ''}`}
                      onClick={() => setSelectedAudience(aud.id)}
                    >
                      <span className="row-indicator">{isChecked ? '✓' : '•'}</span>
                      <span className="row-text">{aud.label}</span>
                      <span className="row-count">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Category Widget */}
            {Object.keys(categoryCounts).length > 2 && (
              <div className="sidebar-widget">
                <h4 className="widget-header">CATEGORIES</h4>
                <div className="sidebar-radio-list">
                  <button
                    type="button"
                    className={`sidebar-row-item ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    <span className="row-indicator">{selectedCategory === 'all' ? '✓' : '•'}</span>
                    <span className="row-text">All Categories</span>
                    <span className="row-count">{products.length}</span>
                  </button>

                  {Object.entries(categoryCounts)
                    .filter(([cat]) => cat !== 'all')
                    .map(([cat, count]) => {
                      const isChecked = selectedCategory.toLowerCase() === cat.toLowerCase()
                      return (
                        <button
                          key={cat}
                          type="button"
                          className={`sidebar-row-item ${isChecked ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(isChecked ? 'all' : cat)}
                        >
                          <span className="row-indicator">{isChecked ? '✓' : '•'}</span>
                          <span className="row-text">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                          <span className="row-count">{count}</span>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* 4. Minimum Discount Widget */}
            <div className="sidebar-widget">
              <h4 className="widget-header">MINIMUM DISCOUNT</h4>
              <div className="sidebar-radio-list">
                {[
                  { id: 'all', label: 'All Discounts' },
                  { id: '50', label: '50% & above' },
                  { id: '40', label: '40% & above' },
                  { id: '30', label: '30% & above' },
                  { id: '20', label: '20% & above' },
                  { id: '10', label: '10% & above' }
                ].map(opt => {
                  const isChecked = discountFilter === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`sidebar-row-item ${isChecked ? 'active' : ''}`}
                      onClick={() => handleDiscountSelect(opt.id)}
                    >
                      <span className="row-indicator">{isChecked ? '✓' : '•'}</span>
                      <span className="row-text">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 5. Price Range Slider Widget */}
            <div className="sidebar-widget">
              <h4 className="widget-header">PRICE RANGE</h4>

              <div className="sidebar-price-slider-box">
                <div className="price-slider-header">
                  <span className="price-slider-label">Max Price:</span>
                  <span className="price-slider-val">₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value))
                    setPriceFilter('slider')
                  }}
                  className="luxury-price-range-slider"
                  aria-label="Filter sale products by maximum price"
                />

                <div className="price-slider-ticks">
                  <span>₹0</span>
                  <span>₹10,000+</span>
                </div>
              </div>

              <div className="sidebar-radio-list" style={{ marginTop: '12px' }}>
                {[
                  { id: 'all', label: 'All Prices', max: 10000 },
                  { id: 'under_2500', label: 'Under ₹2,500', max: 2500 },
                  { id: 'under_5000', label: 'Under ₹5,000', max: 5000 },
                  { id: 'under_7500', label: 'Under ₹7,500', max: 7500 }
                ].map(p => {
                  const isChecked = (priceFilter === p.id && maxPrice === p.max) || (p.id === 'all' && priceFilter === 'all' && maxPrice === 10000)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`sidebar-row-item ${isChecked ? 'active' : ''}`}
                      onClick={() => {
                        setPriceFilter(p.id)
                        setMaxPrice(p.max)
                      }}
                    >
                      <span className="row-indicator">{isChecked ? '✓' : '•'}</span>
                      <span className="row-text">{p.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 6. Size Chips Widget */}
            {availableSizes.length > 0 && (
              <div className="sidebar-widget">
                <h4 className="widget-header">SIZES</h4>
                <div className="sidebar-size-chips">
                  {availableSizes.map(sz => {
                    const isSelected = selectedSizes.includes(sz)
                    return (
                      <button
                        key={sz}
                        type="button"
                        className={`sidebar-size-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleSizeFilter(sz)}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Footer Drawer Action */}
          <div className="sidebar-mobile-footer mobile-only">
            {hasActiveFilters && (
              <button className="mobile-reset-btn" onClick={resetFilters}>
                Reset
              </button>
            )}
            <button className="mobile-apply-btn" onClick={() => setShowMobileFilters(false)}>
              Show ({filteredProducts.length}) Results
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {showMobileFilters && (
          <div
            className="sale-mobile-backdrop"
            onClick={() => setShowMobileFilters(false)}
          />
        )}

        {/* Right Main Content Area: Products Grid */}
        <main className="sale-content-area">
          {/* Controls Bar: Filter Toggle & Sort */}
          <div className="sale-controls-bar">
            <div className="sale-controls-left">
              {/* Desktop Toggle Sidebar Button */}
              <button
                type="button"
                className="sale-sidebar-toggle-btn desktop-only"
                onClick={() => setShowSidebar(!showSidebar)}
                title={showSidebar ? 'Hide Filter Sidebar' : 'Show Filter Sidebar'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                <span>{showSidebar ? 'Hide Filters' : 'Show Filters'}</span>
              </button>

              {/* Mobile Filter Trigger Button */}
              <button
                type="button"
                className="sale-mobile-filter-trigger mobile-only"
                onClick={() => setShowMobileFilters(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filters</span>
                {hasActiveFilters && <span className="active-dot" />}
              </button>
            </div>

            <div className="sale-controls-right">
              {/* Sort Select */}
              <div className="sale-sort-select-box">
                <label htmlFor="sale-sort-dropdown">SORT BY:</label>
                <select
                  id="sale-sort-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="discount_desc">Highest Discount</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="sale-active-filters-bar">
              <span className="active-label">Active:</span>
              {searchQuery && (
                <span className="sale-filter-chip">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>✕</button>
                </span>
              )}
              {selectedAudience !== 'all' && (
                <span className="sale-filter-chip">
                  {selectedAudience.toUpperCase()}
                  <button onClick={() => setSelectedAudience('all')}>✕</button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="sale-filter-chip">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}>✕</button>
                </span>
              )}
              {discountFilter !== 'all' && (
                <span className="sale-filter-chip">
                  {discountFilter}%+ OFF
                  <button onClick={() => setDiscountFilter('all')}>✕</button>
                </span>
              )}
              {(priceFilter !== 'all' || maxPrice < 10000) && (
                <span className="sale-filter-chip">
                  {maxPrice < 10000 ? `Max ₹${maxPrice.toLocaleString('en-IN')}` : priceFilter.replace('_', ' ').toUpperCase()}
                  <button onClick={() => { setPriceFilter('all'); setMaxPrice(10000); }}>✕</button>
                </span>
              )}
              {selectedSizes.map(sz => (
                <span key={sz} className="sale-filter-chip">
                  Size: {sz}
                  <button onClick={() => toggleSizeFilter(sz)}>✕</button>
                </span>
              ))}
              <button className="sale-clear-all-text" onClick={resetFilters}>
                Clear All
              </button>
            </div>
          )}
          {loading ? (
            <div className="sale-skeleton-grid">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="sale-card-skeleton">
                  <div className="skeleton-image-box" />
                  <div className="skeleton-text line-title" />
                  <div className="skeleton-text line-price" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="sale-empty-state">
              <div className="empty-sparkle-motif">✨</div>
              <h2>No Matching Sale Silhouettes</h2>
              <p>
                {products.length === 0
                  ? 'Our festive sale collection is currently being updated. Discover our full catalog in the meantime!'
                  : 'No sale products match your active filters. Try adjusting your search or clearing filters.'}
              </p>
              <div className="empty-actions">
                {hasActiveFilters ? (
                  <button type="button" className="sale-cta-gold-btn" onClick={resetFilters}>
                    Clear All Filters
                  </button>
                ) : (
                  <Link to="/collections" className="sale-cta-gold-btn">
                    Explore All Collections →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="sale-product-grid">
              {filteredProducts.map((product, index) => {
                const mainImg = getOptimizedImageUrl(
                  product.images?.[0] || product.image || '/images/categories_straight.jpg',
                  { width: 600, quality: 85 }
                )
                const price = Number(product.price || 0)
                const mrp = Number(product.mrp || product.discountPrice || 0)
                const discountPct = (mrp > price && mrp > 0)
                  ? Math.round(((mrp - price) / mrp) * 100)
                  : (product.discount || 0)
                const isOutOfStock = isProductOutOfStock(product)
                const inWishlist = isInWishlist(product._id)

                return (
                  <motion.div
                    key={product._id || index}
                    className="sale-product-card"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: (index % 4) * 0.04 }}
                    onClick={() => {
                      try {
                        trackSelectItem(product, 'Festive Sale', 'festive_sale', index)
                      } catch (e) {}
                      navigate(`/product/${product._id}`, { state: { product } })
                    }}
                  >
                    <div className="sale-card-media">
                      <img
                        src={mainImg}
                        alt={product.name}
                        className="sale-product-image"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                      />

                      {/* Red drop-shadow % OFF badge */}
                      {discountPct > 0 && (
                        <span className="sale-discount-tag">
                          {discountPct}% OFF
                        </span>
                      )}

                      {/* Wishlist toggle */}
                      <button
                        type="button"
                        className={`sale-wishlist-btn ${inWishlist ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWishlist(product)
                        }}
                        aria-label="Toggle Wishlist"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {isOutOfStock && (
                        <div className="sale-sold-out-badge">Sold Out</div>
                      )}
                    </div>

                    <div className="sale-card-body">
                      {product.category && (
                        <span className="sale-product-category">
                          {product.category.toUpperCase()}
                        </span>
                      )}

                      <h3 className="sale-product-title" title={product.name}>
                        {product.name}
                      </h3>

                      <div className="sale-card-footer">
                        <div className="sale-pricing-group">
                          <span className="sale-current-price">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {mrp > price && (
                            <span className="sale-mrp-crossed">
                              ₹{mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <div className="sale-add-btn-wrapper" onClick={(e) => e.stopPropagation()}>
                          <AddToCartButton
                            product={product}
                            selectedSize={getFirstAvailableSize(product, 'M')}
                            variant="mini"
                            label="+ Add"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="sale-modal-overlay" onClick={closeQuickView}>
            <motion.div
              className="sale-quick-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="sale-modal-close" onClick={closeQuickView} aria-label="Close Modal">
                ✕
              </button>

              <div className="sale-modal-grid">
                <div className="sale-modal-media">
                  <img
                    src={getOptimizedImageUrl(selectedProduct.images?.[0] || selectedProduct.image, { width: 600 })}
                    alt={selectedProduct.name}
                  />
                </div>

                <div className="sale-modal-content">
                  <span className="sale-modal-cat">{selectedProduct.category}</span>
                  <h2 className="sale-modal-title">{selectedProduct.name}</h2>

                  <div className="sale-modal-pricing">
                    <span className="modal-price">₹{Number(selectedProduct.price || 0).toLocaleString('en-IN')}</span>
                    {selectedProduct.mrp && Number(selectedProduct.mrp) > Number(selectedProduct.price) && (
                      <span className="modal-mrp">₹{Number(selectedProduct.mrp).toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  <p className="sale-modal-desc">
                    {selectedProduct.description || selectedProduct.shortDescription || 'Exquisite festive craftsmanship tailored for special celebrations.'}
                  </p>

                  <div className="sale-modal-sizes">
                    <label>Select Size:</label>
                    <div className="sale-size-chips">
                      {getSortedSizesForProduct(selectedProduct).map(s => {
                        const inStock = isSizeInStock(selectedProduct, s)
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={!inStock}
                            className={`size-chip ${selectedSize === s ? 'active' : ''} ${!inStock ? 'out-of-stock' : ''}`}
                            onClick={() => inStock && setSelectedSize(s)}
                          >
                            {s} {!inStock && '✕'}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="sale-modal-actions">
                    <AddToCartButton
                      product={selectedProduct}
                      selectedSize={selectedSize}
                      variant="modal"
                      label="Add to Bag"
                    />
                    <button
                      type="button"
                      className="sale-view-details-btn"
                      onClick={() => {
                        navigate(`/product/${selectedProduct._id}`)
                        closeQuickView()
                      }}
                    >
                      View Full Details →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SalePage
