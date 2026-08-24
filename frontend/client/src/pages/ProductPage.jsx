import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { AuthContext } from '../context/AuthContext'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { trackViewItem } from '../utils/gtmEcommerce'
import AddToCartButton from '../components/AddToCartButton'
import './ProductPage.css'

const ProductPage = () => {
  const {
    cart,
    addToCart,
    buyNow,
    getItemQuantity,
    clearCart,
    toggleWishlist,
    isInWishlist,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    couponLoading,
    availableCoupons
  } = useContext(CartContext)

  const authContext = useContext(AuthContext)
  const currentUser = authContext?.user

  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const passedProduct = location.state?.product && (location.state.product._id === id || location.state.product.id === id)
    ? location.state.product
    : null

  const [product, setProduct] = useState(() => passedProduct)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(() => !passedProduct)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('Royal Gold')
  const [offersOpen, setOffersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [sizeUnit, setSizeUnit] = useState('in')
  const [addedToast, setAddedToast] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(() => currentUser?.email || '')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifySuccess, setNotifySuccess] = useState(null)
  const [notifyError, setNotifyError] = useState(null)

  useEffect(() => {
    if (currentUser?.email && !notifyEmail) {
      setNotifyEmail(currentUser.email)
    }
  }, [currentUser?.email])

  const [selectedSize, setSelectedSize] = useState(() => {
    if (passedProduct) {
      const sizesList = (passedProduct.sizes && passedProduct.sizes.length > 0)
        ? passedProduct.sizes
        : (passedProduct.sizeStock && passedProduct.sizeStock.length > 0)
          ? passedProduct.sizeStock.map(s => s.size)
          : []
      return (sizesList && sizesList.length > 0) ? sizesList[0] : 'S'
    }
    return 'S'
  })

  useEffect(() => {
    if (showSizeGuide || isZoomOpen || showCouponModal || showNotifyModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showSizeGuide, isZoomOpen, showCouponModal, showNotifyModal])

  const handleNotifySubmit = async (e) => {
    e.preventDefault()
    if (!notifyEmail || !/\S+@\S+\.\S+/.test(notifyEmail)) {
      setNotifyError('Please enter a valid email address.')
      return
    }
    setNotifyLoading(true)
    setNotifyError(null)
    setNotifySuccess(null)
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${id}/notify-restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail, size: selectedSize })
      })
      const data = await response.json()
      if (data && data.success) {
        setNotifySuccess(data.message || 'Restock alert registered! We will email you as soon as this item is back in stock.')
      } else {
        setNotifyError(data?.message || 'Failed to register restock alert.')
      }
    } catch (err) {
      console.error('Notify restock error:', err)
      setNotifyError('Failed to register restock alert. Please try again.')
    } finally {
      setNotifyLoading(false)
    }
  }

  const getSelectedSizeStock = () => {
    if (!product) return 0
    if (product.sizeStock && Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
      if (!selectedSize) return product.sizeStock.reduce((acc, item) => acc + Number(item.quantity || item.stock || 0), 0)
      const found = product.sizeStock.find(s => String(s.size).toUpperCase() === String(selectedSize).toUpperCase())
      return found ? Number(found.quantity || found.stock || 0) : 0
    }
    return product.stock !== undefined && product.stock !== null ? Number(product.stock) : 10
  }

  const currentStock = getSelectedSizeStock()
  const isOutOfStock = currentStock <= 0 || product?.status === 'Out of Stock'

  useEffect(() => {
    fetchProduct()
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    if (product) {
      try {
        trackViewItem(product)
      } catch (e) {
        console.error('GTM error in trackViewItem:', e)
      }
    }
  }, [product?._id || product?.id])

  const fetchProduct = async () => {
    if (!product) {
      setLoading(true)
    }
    try {
      const data = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}/${id}`)
      if (data.success && data.data && data.data.isActive !== false) {
        setProduct(data.data)
        const sizesList = (data.data.sizes && data.data.sizes.length > 0)
          ? data.data.sizes
          : (data.data.sizeStock && data.data.sizeStock.length > 0)
            ? data.data.sizeStock.map(s => s.size)
            : []
        const initialSize = (sizesList && sizesList.length > 0) ? sizesList[0] : 'S'
        setSelectedSize(prev => prev || initialSize)
        fetchRelatedProducts(data.data.category, data.data._id)
      } else if (!product) {
        setError('This product is currently inactive or unavailable.')
      }
    } catch (err) {
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async (category, currentId) => {
    try {
      const data = await cachedFetch(`${API_ENDPOINTS.PRODUCTS}?category=${category}&limit=5`)
      if (data.success) {
        const filtered = (data.data || []).filter(p => p._id !== currentId)
        setRelatedProducts(filtered)
      }
    } catch (err) {
      console.error('Error fetching related products:', err)
    }
  }

  const formatCategoryName = (slug) => {
    if (!slug) return 'Collection'
    return String(slug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Custom']
  const availableSizes = (product?.sizes && product.sizes.length > 0)
    ? product.sizes
    : (product?.sizeStock && product.sizeStock.some(s => s.quantity > 0))
      ? product.sizeStock.filter(s => s.quantity > 0).map(s => s.size)
      : defaultSizes

  const handleAddBag = () => {
    if (!selectedSize) {
      alert('Please select a size to proceed')
      return
    }
    addToCart({ ...product, selectedSize, quantity }, navigate)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  const handleBuyNow = () => {
    if (!product) return
    const sizeToUse = selectedSize || (availableSizes && availableSizes.length > 0 ? availableSizes[0] : 'S')
    const prodId = product._id || product.id
    const inCartQty = getItemQuantity ? getItemQuantity(prodId, sizeToUse) : 0
    const qtyToUse = Math.max(Number(quantity) || 1, inCartQty || 1)

    if (buyNow) {
      const res = buyNow(product, sizeToUse, qtyToUse, navigate)
      if (res === false) return
    } else {
      const res = addToCart({ ...product, selectedSize: sizeToUse, quantity: qtyToUse }, navigate)
      if (res === false) return
    }

    // Open Checkout page directly
    navigate('/checkout')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Check out ${product?.name} on SEEMEE Haute Couture`,
        url: window.location.href,
      }).catch(() => { })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Product link copied to clipboard!')
    }
  }

  if (loading && !product) {
    return (
      <div className="modern-product-page">
        <div className="product-layout-container product-skeleton-wrapper">
          <div className="product-media-column">
            <div className="skeleton-box skeleton-main-img"></div>
          </div>
          <div className="product-info-column">
            <div className="skeleton-box skeleton-line-title"></div>
            <div className="skeleton-box skeleton-line-price"></div>
            <div className="skeleton-box skeleton-block"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="modern-product-page">
        <div className="product-error-container">
          <h2>Silhouette Not Available</h2>
          <p>{error || "The product you're looking for does not exist or has been removed."}</p>
          <button className="back-to-shop-btn" onClick={() => navigate('/collections')}>
            Explore Full Collection
          </button>
        </div>
      </div>
    )
  }

  const currentPrice = Number(product.price || 0)
  const originalPrice = (product.mrp || product.discountPrice) ? Number(product.mrp || product.discountPrice) : null
  const hasDiscount = originalPrice && originalPrice > currentPrice
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0
  const savingsAmount = hasDiscount ? (originalPrice - currentPrice) : 0

  const mainImageUrl = getImageUrl(product.images?.[selectedImage] || product.image)

  const handleApplyPdpCoupon = async (e, codeOverride) => {
    if (e) e.preventDefault()
    const targetCode = codeOverride || pdpCouponCode
    if (!targetCode) return
    setPdpCouponError(null)

    // Compute updated cart synchronously for instant coupon calculation
    const productId = product.id || product._id
    const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'S'
    const productSize = selectedSize || product.selectedSize || product.size || defaultSize
    const normalizedProduct = {
      ...product,
      id: productId,
      size: productSize,
      selectedSize: productSize
    }

    const existingIndex = (cart || []).findIndex(item => {
      const itemId = item.id || item._id
      const itemSize = item.selectedSize || item.size || 'S'
      return itemId === productId && itemSize === productSize
    })

    const addedQty = Number(quantity) || 1
    let updatedCart = []

    if (existingIndex > -1) {
      updatedCart = cart.map((item, idx) => {
        if (idx === existingIndex) {
          return { ...item, quantity: (item.quantity || 1) + addedQty }
        }
        return item
      })
    } else {
      updatedCart = [...(cart || []), { ...normalizedProduct, quantity: addedQty }]
    }

    // Ensure item is added to cart
    const isAdded = addToCart({
      ...product,
      selectedSize: productSize,
      quantity
    })
    if (isAdded === false) return

    try {
      const res = await applyCoupon(targetCode, updatedCart)
      setAddedToast(true)
      setTimeout(() => setAddedToast(false), 3500)
      setPdpCouponCode('')
      setShowCouponModal(false)
    } catch (err) {
      setPdpCouponError(err.message || 'Invalid coupon code')
    }
  }

  return (
    <div className="product-page-wrapper">
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div 
            className="cart-added-toast"
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            <span>✦ Added to your Shopping Bag!</span>
            <Link to="/cart" className="toast-cart-link">View Bag & Checkout →</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="product-layout-container">
        {/* Top Breadcrumb Nav */}
        <nav className="product-top-breadcrumbs">
          <Link to="/">Home</Link>
          <span className="crumb-sep">/</span>
          <Link to="/collections">Collections</Link>
          <span className="crumb-sep">/</span>
          <Link to={`/category/${product.category}`}>{formatCategoryName(product.category)}</Link>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">{product.name}</span>
        </nav>

        {/* 2-Column Product Section */}
        <div className="product-main-grid">
          {/* Left Column: Gallery */}
          <div className="product-media-column">
            <div className="main-image-card">
              {hasDiscount && (
                <span className="image-discount-badge">{discountPercent}% OFF</span>
              )}

              <img
                src={mainImageUrl}
                alt={product.name}
                className="main-product-img"
                onClick={() => setIsZoomOpen(true)}
              />

              <button className="tap-to-zoom-btn" onClick={() => setIsZoomOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <span>Tap to Zoom</span>
              </button>
            </div>

            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="product-thumbnails-row">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumb-chip ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={getImageUrl(img)} alt={`View ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Controls */}
          <div className="product-info-column">
            {/* Title Header with Share & Wishlist */}
            <div className="product-header-row">
              <h1 className="product-title-text">{product.name}</h1>
              <div className="product-header-actions">
                <button className="icon-action-btn" onClick={handleShare} title="Share Product">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
                <button
                  className={`icon-action-btn ${isInWishlist(product._id) ? 'active-wish' : ''}`}
                  onClick={() => toggleWishlist(product, navigate)}
                  title="Add to Wishlist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
            </div>



            <div className="product-divider"></div>

            {/* Price Box */}
            <div className="product-price-box">
              <div className="price-top-row">
                <span className="current-price">₹{currentPrice.toLocaleString('en-IN')}.00</span>
                {hasDiscount && (
                  <>
                    <span className="original-mrp-crossed">₹{originalPrice.toLocaleString('en-IN')}.00</span>
                    <span className="save-percent-tag">Save {discountPercent}%</span>
                  </>
                )}
              </div>
              {hasDiscount && (
                <div className="savings-highlight">
                  You save ₹{savingsAmount.toLocaleString('en-IN')}.00 &ndash; {discountPercent}% off
                </div>
              )}
            </div>

            {/* Available Atelier Offers & Coupons Option Card */}
            {availableCoupons.length > 0 && (
              <div className="pdp-coupons-trigger-card" onClick={() => setShowCouponModal(true)}>
                <div className="trigger-left-block">
                  <span className="gift-emoji-icon">🎁</span>
                  <div className="trigger-text-block">
                    <span className="trigger-main-heading">APPLY COUPON & OFFERS</span>
                    <span className="trigger-sub-heading">View all {availableCoupons.length} Atelier promotional discounts</span>
                  </div>
                </div>
                <button type="button" className="trigger-view-link">
                  View All Offers ›
                </button>
              </div>
            )}





            {/* Size Selector */}
            <div className="product-option-section">
              <div className="size-option-header">
                <span className="option-title-label">SIZE: <strong>{selectedSize}</strong></span>
                <button className="size-guide-link-btn" onClick={() => setShowSizeGuide(true)}>
                  Size Chart
                </button>
              </div>
              <div className="size-pills-row">
                {(() => {
                  const defaultOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']
                  const sizeSet = new Set()

                  if (product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
                    product.sizes.forEach(s => s && sizeSet.add(String(s).trim().toUpperCase()))
                  }
                  if (product?.sizeStock && Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
                    product.sizeStock.forEach(s => s?.size && sizeSet.add(String(s.size).trim().toUpperCase()))
                  }
                  if (selectedSize) {
                    sizeSet.add(String(selectedSize).trim().toUpperCase())
                  }

                  if (sizeSet.size === 0) {
                    defaultOrder.forEach(s => sizeSet.add(s))
                  }

                  const allSizesList = Array.from(sizeSet).sort((a, b) => {
                    const idxA = defaultOrder.indexOf(a)
                    const idxB = defaultOrder.indexOf(b)
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB
                    if (idxA !== -1) return -1
                    if (idxB !== -1) return 1
                    return a.localeCompare(b)
                  })

                  return allSizesList.map(sz => {
                    const sizeQty = (() => {
                      if (!product?.sizeStock || !Array.isArray(product.sizeStock)) {
                        return product?.stock !== undefined ? Number(product.stock) : 10
                      }
                      const item = product.sizeStock.find(s => String(s.size).toUpperCase() === String(sz).toUpperCase())
                      return item ? Number(item.quantity || item.stock || 0) : 0
                    })()

                    const isSizeOutOfStock = sizeQty <= 0
                    const isSelected = selectedSize === sz

                    return (
                      <button
                        key={sz}
                        type="button"
                        className={`size-chip-btn ${isSelected ? 'active' : ''} ${isSizeOutOfStock ? 'out-of-stock-chip' : ''}`}
                        onClick={() => setSelectedSize(sz)}
                        title={isSizeOutOfStock ? `${sz} - Not Available (Click to subscribe for restock alert)` : `${sz} - In Stock`}
                      >
                        <span className="size-label-text">{sz}</span>
                        {isSizeOutOfStock && <span className="size-strike-line" aria-hidden="true" />}
                      </button>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Action Box */}
            <div className="quantity-action-card">
              <div className="quantity-header-row">
                <div className={`stock-status-pill ${isOutOfStock ? 'out-of-stock' : ''}`}>
                  <span className={`stock-dot ${isOutOfStock ? 'out-of-stock-dot' : ''}`}></span>
                  <span>{isOutOfStock ? `Not Available (Out of Stock) — Size ${selectedSize}` : 'In Stock'}</span>
                </div>
              </div>

              {isOutOfStock ? (
                <div className="action-buttons-row out-of-stock-row">
                  <button type="button" className="btn-not-available" disabled>
                    NOT AVAILABLE
                  </button>
                  <button
                    type="button"
                    className="btn-notify-restock"
                    onClick={() => {
                      setShowNotifyModal(true)
                      setNotifySuccess(null)
                      setNotifyError(null)
                    }}
                  >
                    🔔 NOTIFY ME WHEN AVAILABLE
                  </button>
                </div>
              ) : (
                <div className="action-buttons-row">
                  <AddToCartButton
                    product={product}
                    selectedSize={selectedSize}
                    label="ADD TO CART"
                    variant="full"
                    showIcon={true}
                    onAddCallback={() => {
                      setAddedToast(true)
                      setTimeout(() => setAddedToast(false), 2500)
                    }}
                  />
                  <button className="buy-now-pill-btn" onClick={handleBuyNow}>
                    BUY NOW
                  </button>
                </div>
              )}
            </div>

            {/* Trust Badges Strip (3 Cards) */}
            <div className="trust-badges-row">
              <div className="trust-badge-card">
                <span className="badge-icon">🚚</span>
                <div>
                  <strong>Free Shipping</strong>
                  <p>On orders above ₹499</p>
                </div>
              </div>
              <div className="trust-badge-card">
                <span className="badge-icon">🛡️</span>
                <div>
                  <strong>Artisan Guarantee</strong>
                  <p>100% Handcrafted</p>
                </div>
              </div>
              <div className="trust-badge-card">
                <span className="badge-icon">🔒</span>
                <div>
                  <strong>Secure Checkout</strong>
                  <p>100% safe payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tabbed Content Area */}
        <div className="product-tabbed-section">
          <div className="tabbed-header-bar">
            <button
              className={`tab-bar-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`tab-bar-btn ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features & Craft
            </button>
            <button
              className={`tab-bar-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              Specs & Care
            </button>
          </div>

          <div className="tabbed-content-panel">
            {activeTab === 'description' && (
              <div className="tab-pane-box">
                <h3>Product Description</h3>
                {product.description ? (
                  <p className="tab-desc-text">{product.description}</p>
                ) : (
                  <p className="tab-empty-text">No description specified for this item.</p>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="tab-pane-box">
                <h3>Craftsmanship & Features</h3>
                <ul className="tab-bullet-list">
                  {(product.fabric || product.material) && (
                    <li><strong>Fabric / Material:</strong> {product.fabric || product.material}</li>
                  )}
                  {product.fit && (
                    <li><strong>Fit Type:</strong> {product.fit}</li>
                  )}
                  {product.occasion && (
                    <li><strong>Occasion:</strong> {product.occasion}</li>
                  )}
                  {product.design && (
                    <li><strong>Design / Pattern:</strong> {product.design}</li>
                  )}
                  {product.sleeves && (
                    <li><strong>Sleeves:</strong> {product.sleeves}</li>
                  )}
                  {product.length && (
                    <li><strong>Garment Length:</strong> {product.length}</li>
                  )}
                  {!((product.fabric || product.material) || product.fit || product.occasion || product.design || product.sleeves || product.length) && (
                    <li>✦ Crafted with premium  standards by SeeMee.</li>
                  )}
                </ul>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="tab-pane-box">
                <h3>Specifications & Care</h3>
                <table className="specs-table">
                  <tbody>
                    {product.category && (
                      <tr>
                        <td>Category</td>
                        <td>{formatCategoryName(product.category)}</td>
                      </tr>
                    )}
                    {product.brand && (
                      <tr>
                        <td>Brand</td>
                        <td>{product.brand}</td>
                      </tr>
                    )}
                    {(product.fabric || product.material) && (
                      <tr>
                        <td>Fabric Material</td>
                        <td>{product.fabric || product.material}</td>
                      </tr>
                    )}
                    {product.careInstructions && (
                      <tr>
                        <td>Care Instructions</td>
                        <td>{product.careInstructions}</td>
                      </tr>
                    )}
                    {(() => {
                      let displayWeight = ''
                      if (typeof product.weightKg === 'number' && product.weightKg > 0) {
                        displayWeight = `${product.weightKg} kg`
                      } else if (product.weight?.valueGrams && product.weight.valueGrams > 0) {
                        displayWeight = `${product.weight.valueGrams} g`
                      } else if (typeof product.weight === 'number' && product.weight > 0) {
                        displayWeight = product.weight < 20 ? `${product.weight} kg` : `${product.weight} g`
                      } else if (product.weight?.value && !isNaN(parseFloat(product.weight.value))) {
                        const val = parseFloat(product.weight.value)
                        displayWeight = val < 20 ? `${val} kg` : `${val} g`
                      }

                      if (!displayWeight) return null

                      return (
                        <tr>
                          <td>Package Weight</td>
                          <td><strong>{displayWeight}</strong></td>
                        </tr>
                      )
                    })()}
                    {(() => {
                      const dim = product.dimensions || {}
                      const l = product.lengthCm || dim.lengthCm || dim.length || (typeof product.length === 'number' ? product.length : null)
                      const b = product.breadth || product.widthCm || dim.widthCm || dim.width || dim.breadth
                      const h = product.heightCm || product.height || dim.heightCm || dim.height

                      if (!l && !b && !h) return null

                      return (
                        <tr>
                          <td>Package Dimensions (L × B × H)</td>
                          <td><strong>{l || '20'} cm × {b || '15'} cm × {h || '5'} cm</strong></td>
                        </tr>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="related-products-section">
            <h2 className="related-section-title">You May Also Like</h2>
            <div className="related-products-grid">
              {relatedProducts.map(rel => {
                const rPrice = Number(rel.price || 0)
                const rMrp = (rel.mrp || rel.discountPrice) ? Number(rel.mrp || rel.discountPrice) : null
                const rHasDiscount = rMrp && rMrp > rPrice
                const rDiscountPercent = rHasDiscount ? Math.round(((rMrp - rPrice) / rMrp) * 100) : 0

                return (
                  <div
                    key={rel._id}
                    className="related-product-card"
                    onClick={() => navigate(`/product/${rel._id}`, { state: { product: rel } })}
                  >
                    <div className="related-image-wrapper">
                      {rHasDiscount && (
                        <span className="related-discount-pill">{rDiscountPercent}% OFF</span>
                      )}
                      <img src={getImageUrl(rel.images?.[0] || rel.image)} alt={rel.name} />
                    </div>
                    <div className="related-card-info">
                      <h4>{rel.name}</h4>
                      <div className="related-card-prices-row">
                        <span className="related-card-price">₹{rPrice.toLocaleString('en-IN')}</span>
                        {rHasDiscount && (
                          <span className="related-card-mrp">₹{rMrp.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="related-add-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart({
                            id: rel._id || rel.id,
                            _id: rel._id || rel.id,
                            name: rel.name,
                            price: rel.price,
                            image: rel.images?.[0] || rel.image,
                            size: 'M',
                            quantity: 1
                          })
                          setAddedToast(true)
                          setTimeout(() => setAddedToast(false), 3500)
                        }}
                      >
                        + ADD TO BAG
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <div className="zoom-modal-overlay" onClick={() => setIsZoomOpen(false)}>
            <motion.div
              className="zoom-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button className="zoom-close-btn" onClick={() => setIsZoomOpen(false)}>&times;</button>
              <img src={mainImageUrl} alt={product.name} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="size-modal-backdrop" onClick={() => setShowSizeGuide(false)}>
            <motion.div
              className="size-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="size-modal-header">
                <div>
                  <span className="size-modal-badge">✦ GARMENT MEASUREMENTS</span>
                  <h3>OFFICIAL SIZE CHART</h3>
                </div>
                <button className="close-modal-btn" onClick={() => setShowSizeGuide(false)}>✕</button>
              </div>

              <div className="size-unit-switcher">
                <span className="unit-label">Display Unit:</span>
                <div className="unit-toggle-pills">
                  <button
                    className={`unit-pill ${sizeUnit === 'in' ? 'active' : ''}`}
                    onClick={() => setSizeUnit('in')}
                  >
                    Inches (in)
                  </button>
                  <button
                    className={`unit-pill ${sizeUnit === 'cm' ? 'active' : ''}`}
                    onClick={() => setSizeUnit('cm')}
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>

              <div className="size-table-wrapper">
                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Bust ({sizeUnit})</th>
                      <th>Waist ({sizeUnit})</th>
                      <th>Hip ({sizeUnit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>XS</td><td>{sizeUnit === 'in' ? '32"' : '81 cm'}</td><td>{sizeUnit === 'in' ? '26"' : '66 cm'}</td><td>{sizeUnit === 'in' ? '36"' : '91 cm'}</td></tr>
                    <tr><td>S</td><td>{sizeUnit === 'in' ? '34"' : '86 cm'}</td><td>{sizeUnit === 'in' ? '28"' : '71 cm'}</td><td>{sizeUnit === 'in' ? '38"' : '96 cm'}</td></tr>
                    <tr><td>M</td><td>{sizeUnit === 'in' ? '36"' : '91 cm'}</td><td>{sizeUnit === 'in' ? '30"' : '76 cm'}</td><td>{sizeUnit === 'in' ? '40"' : '101 cm'}</td></tr>
                    <tr><td>L</td><td>{sizeUnit === 'in' ? '38"' : '96 cm'}</td><td>{sizeUnit === 'in' ? '32"' : '81 cm'}</td><td>{sizeUnit === 'in' ? '42"' : '106 cm'}</td></tr>
                    <tr><td>XL</td><td>{sizeUnit === 'in' ? '40"' : '101 cm'}</td><td>{sizeUnit === 'in' ? '34"' : '86 cm'}</td><td>{sizeUnit === 'in' ? '44"' : '111 cm'}</td></tr>
                    <tr><td>XXL</td><td>{sizeUnit === 'in' ? '42"' : '106 cm'}</td><td>{sizeUnit === 'in' ? '36"' : '91 cm'}</td><td>{sizeUnit === 'in' ? '46"' : '116 cm'}</td></tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ALL AVAILABLE COUPONS MODAL POPUP OVER WINDOW */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="pdp-coupon-window-overlay" onClick={() => setShowCouponModal(false)}>
            <motion.div
              className="pdp-coupon-window-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="pdp-window-header">
                <div className="pdp-window-header-titles">
                  <span className="window-sparkle-tag">🎁 ATELIER PROMOTIONAL OFFERS</span>
                  <h3 className="window-title">All Available Coupons</h3>
                </div>
                <button 
                  type="button" 
                  className="btn-window-close-x" 
                  onClick={() => setShowCouponModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="pdp-window-body">
                <p className="pdp-window-sub">Click "Copy Code" to copy promo code and enter it at Cart or Checkout page.</p>

                <div className="pdp-window-coupons-list">
                  {availableCoupons.map(c => {
                    const isCopied = copiedCode === c.code
                    return (
                      <div key={c._id || c.code} className="window-coupon-item-card">
                        <div className="item-info-left">
                          <div className="badge-min-row">
                            <span className="window-code-badge">✦ {c.code}</span>
                            {c.minimumOrder > 0 && (
                              <span className="window-min-tag">Min. Order: ₹{c.minimumOrder.toLocaleString('en-IN')}</span>
                            )}
                          </div>
                          <p className="window-coupon-desc">{c.description || `${c.percentage ? `${c.percentage}% OFF` : `₹${c.fixedAmount} OFF`}`}</p>
                        </div>
                        <button
                          type="button"
                          className={`btn-window-copy-code ${isCopied ? 'copied' : ''}`}
                          onClick={() => {
                            navigator.clipboard.writeText(c.code)
                            setCopiedCode(c.code)
                            setTimeout(() => setCopiedCode(null), 2500)
                          }}
                        >
                          {isCopied ? 'Copied ✓' : 'Copy Code'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING RESTOCK ALERT NOTIFICATION MODAL */}
      <AnimatePresence>
        {showNotifyModal && (
          <div className="pdp-coupon-window-overlay" onClick={() => setShowNotifyModal(false)}>
            <motion.div
              className="pdp-coupon-window-card notify-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="pdp-window-header">
                <div className="pdp-window-header-titles">
                  <span className="window-sparkle-tag">🔔 RESTOCK NOTIFICATION</span>
                  <h3 className="window-title">Notify Me When Available</h3>
                </div>
                <button
                  type="button"
                  className="btn-window-close-x"
                  onClick={() => setShowNotifyModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="pdp-window-body">
                {notifySuccess ? (
                  <div className="notify-success-box">
                    <span className="notify-success-icon">🎉</span>
                    <h4 className="notify-success-heading">Alert Subscribed Successfully!</h4>
                    <p className="notify-success-msg">{notifySuccess}</p>
                    <button
                      type="button"
                      className="btn-notify-done"
                      onClick={() => setShowNotifyModal(false)}
                    >
                      Got It!
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleNotifySubmit} className="notify-form-wrap">
                    <p className="pdp-window-sub">
                      Receive an automated notification as soon as <strong>{product?.name}</strong> {selectedSize ? `(Size: ${selectedSize})` : ''} is restocked!
                    </p>

                    {currentUser?.email && (
                      <div className="logged-in-user-badge">
                        <span>👤 Logged in as:</span>
                        <strong>{currentUser.email}</strong>
                      </div>
                    )}

                    {notifyError && (
                      <div className="notify-error-banner">
                        ⚠️ {notifyError}
                      </div>
                    )}

                    <div className="notify-input-block">
                      <label htmlFor="notify-email-input" className="notify-input-label">YOUR EMAIL ADDRESS</label>
                      <input
                        id="notify-email-input"
                        type="email"
                        placeholder="e.g. name@example.com"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        required
                        className="notify-email-input-field"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-restock-alert"
                      disabled={notifyLoading}
                    >
                      {notifyLoading ? 'Submitting Request...' : '🔔 Notify Me When Available'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default ProductPage
