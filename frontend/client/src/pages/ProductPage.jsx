import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { trackViewItem } from '../utils/gtmEcommerce'
import './ProductPage.css'

const ProductPage = () => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    couponLoading
  } = useContext(CartContext)

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
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [pdpCouponCode, setPdpCouponCode] = useState('')
  const [pdpCouponError, setPdpCouponError] = useState(null)
  const [showCouponModal, setShowCouponModal] = useState(false)

  useEffect(() => {
    fetchAvailableCoupons()
  }, [])

  const fetchAvailableCoupons = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.COUPON_AVAILABLE)
      const contentType = res.headers.get('content-type') || ''
      if (!res.ok || !contentType.includes('application/json')) return
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setAvailableCoupons(data.data)
      }
    } catch (err) {
      console.error('Error fetching available coupons:', err)
    }
  }

  const [selectedSize, setSelectedSize] = useState(() => {
    if (passedProduct) {
      const sizesList = (passedProduct.sizes && passedProduct.sizes.length > 0)
        ? passedProduct.sizes
        : (passedProduct.sizeStock && passedProduct.sizeStock.length > 0)
          ? passedProduct.sizeStock.filter(s => s.quantity > 0).map(s => s.size)
          : []
      return (sizesList && sizesList.length > 0) ? sizesList[0] : 'S'
    }
    return 'S'
  })

  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [sizeUnit, setSizeUnit] = useState('in')
  const [addedToast, setAddedToast] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

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
            ? data.data.sizeStock.filter(s => s.quantity > 0).map(s => s.size)
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
    if (slug.toLowerCase() === '2-piece-sets') return '2-Piece Sets'
    if (slug.toLowerCase() === '3-piece-sets') return '3-Piece Sets'
    if (slug.toLowerCase() === 'co-ord-sets') return 'Co-ord Sets'
    return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
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
    for (let i = 0; i < quantity; i++) {
      addToCart({ ...product, selectedSize })
    }
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert('Please select a size to proceed')
      return
    }
    for (let i = 0; i < quantity; i++) {
      addToCart({ ...product, selectedSize })
    }
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

    // Ensure item is added to cart
    addToCart({
      ...product,
      selectedSize,
      quantity
    })

    try {
      const res = await applyCoupon(targetCode)
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
                  onClick={() => toggleWishlist(product)}
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

            {/* Available Atelier Offers & Coupon Trigger Box */}
            <div className="pdp-coupon-widget">
              {appliedCoupon ? (
                <div className="pdp-applied-coupon-card">
                  <div className="pdp-applied-info">
                    <span className="pdp-applied-code">✦ {appliedCoupon.code} APPLIED</span>
                    <span className="pdp-applied-sub">Savings: ₹{couponDiscount.toLocaleString('en-IN')} off your order</span>
                  </div>
                  <button className="btn-pdp-remove-coupon" onClick={() => removeCoupon()}>
                    Remove ✕
                  </button>
                </div>
              ) : (
                <button 
                  className="btn-open-coupon-modal-trigger"
                  onClick={() => setShowCouponModal(true)}
                >
                  <div className="trigger-left">
                    <span className="sparkle-icon">🎁</span>
                    <div className="trigger-text">
                      <span className="trigger-title">APPLY COUPON & OFFERS</span>
                      <span className="trigger-sub">View all {availableCoupons.length || 'available'} Atelier promotional discounts</span>
                    </div>
                  </div>
                  <span className="trigger-arrow">View All Offers ❯</span>
                </button>
              )}
            </div>





            {/* Size Selector */}
            <div className="product-option-section">
              <div className="size-option-header">
                <span className="option-title-label">SIZE: <strong>{selectedSize}</strong></span>
                <button className="size-guide-link-btn" onClick={() => setShowSizeGuide(true)}>
                  Size Chart
                </button>
              </div>
              <div className="size-pills-row">
                {availableSizes.map(sz => (
                  <button
                    key={sz}
                    className={`size-chip-btn ${selectedSize === sz ? 'active' : ''}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Action Box */}
            <div className="quantity-action-card">
              <div className="quantity-header-row">
                <div className="quantity-stepper-box">
                  <span className="qty-label">QUANTITY</span>
                  <div className="stepper-controls">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                    >
                      &minus;
                    </button>
                    <span className="qty-number">{quantity}</span>
                    <button onClick={() => setQuantity(prev => prev + 1)}>+</button>
                  </div>
                </div>
                <div className="stock-status-pill">
                  <span className="stock-dot"></span>
                  <span>In Stock</span>
                </div>
              </div>

              <div className="action-buttons-row">
                <button className="add-to-cart-pill-btn" onClick={handleAddBag}>
                  ADD TO CART
                </button>
                <button className="buy-now-pill-btn" onClick={handleBuyNow}>
                  BUY NOW
                </button>
              </div>
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
                    <li>✦ Crafted with premium haute couture standards by SeeMee.</li>
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
                    {product.weight?.valueGrams && (
                      <tr>
                        <td>Weight</td>
                        <td>{product.weight.valueGrams} grams</td>
                      </tr>
                    )}
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
              {relatedProducts.map(rel => (
                <div
                  key={rel._id}
                  className="related-product-card"
                  onClick={() => navigate(`/product/${rel._id}`, { state: { product: rel } })}
                >
                  <img src={getImageUrl(rel.images?.[0] || rel.image)} alt={rel.name} />
                  <div className="related-card-info">
                    <h4>{rel.name}</h4>
                    <span className="related-card-price">₹{Number(rel.price || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
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

      {/* ALL AVAILABLE COUPONS MODAL POPUP */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="pdp-modal-overlay" onClick={() => setShowCouponModal(false)}>
            <motion.div
              className="pdp-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="pdp-modal-header">
                <div>
                  <span className="pdp-modal-sparkle">🎁 ATELIER PROMOTIONS</span>
                  <h3>All Available Coupons & Offers</h3>
                </div>
                <button className="btn-modal-close" onClick={() => setShowCouponModal(false)}>✕</button>
              </div>

              <div className="pdp-modal-body">
                {/* Enter Custom Promo Code Box */}
                <form onSubmit={handleApplyPdpCoupon} className="pdp-modal-coupon-form">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code (e.g. WELCOME10)"
                    value={pdpCouponCode}
                    onChange={(e) => setPdpCouponCode(e.target.value.toUpperCase())}
                    disabled={couponLoading}
                  />
                  <button
                    type="submit"
                    className="btn-modal-apply-submit"
                    disabled={couponLoading || !pdpCouponCode.trim()}
                  >
                    {couponLoading ? 'Validating...' : 'Apply Code'}
                  </button>
                </form>

                {pdpCouponError && (
                  <div className="pdp-modal-error">
                    ⚠️ {pdpCouponError}
                  </div>
                )}

                {/* List of ALL Available Coupons */}
                <div className="pdp-coupons-all-list">
                  <h4 className="list-section-title">SELECT A COUPON TO APPLY ({availableCoupons.length})</h4>

                  {availableCoupons.length === 0 ? (
                    <div className="pdp-no-coupons">
                      <p>No special promotions available at this moment.</p>
                    </div>
                  ) : (
                    availableCoupons.map(c => {
                      const isApplied = appliedCoupon?.code === c.code
                      return (
                        <div key={c._id || c.code} className={`pdp-full-coupon-item ${isApplied ? 'applied' : ''}`}>
                          <div className="item-left-info">
                            <span className="coupon-code-badge">✦ {c.code}</span>
                            <p className="coupon-desc-text">{c.description || `${c.percentage ? `${c.percentage}% OFF` : `₹${c.fixedAmount} OFF`}`}</p>
                            {c.minimumOrder > 0 && (
                              <span className="coupon-min-tag">Min. Order: ₹{c.minimumOrder.toLocaleString('en-IN')}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`btn-coupon-list-apply ${isApplied ? 'btn-applied' : ''}`}
                            onClick={(e) => handleApplyPdpCoupon(e, c.code)}
                            disabled={couponLoading || isApplied}
                          >
                            {isApplied ? 'Applied ✓' : 'Apply'}
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductPage
