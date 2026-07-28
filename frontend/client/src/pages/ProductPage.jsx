import { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './ProductPage.css'

const ProductPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isInWishlist } = useContext(CartContext)
  
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('S')
  const [activeAccordion, setActiveAccordion] = useState('fabric')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [sizeUnit, setSizeUnit] = useState('in') // 'in' or 'cm'
  const [addedToast, setAddedToast] = useState(false)

  useEffect(() => {
    fetchProduct()
    window.scrollTo(0, 0)
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${id}`)
      const data = await response.json()
      if (data.success && data.data && data.data.isActive !== false) {
        setProduct(data.data)
        const sizesList = (data.data.sizes && data.data.sizes.length > 0)
          ? data.data.sizes
          : (data.data.sizeStock && data.data.sizeStock.length > 0)
            ? data.data.sizeStock.filter(s => s.quantity > 0).map(s => s.size)
            : []
        const initialSize = (sizesList && sizesList.length > 0) ? sizesList[0] : 'S'
        setSelectedSize(initialSize)
        fetchRelatedProducts(data.data.category, data.data._id)
      } else {
        setError('This product is currently inactive or unavailable.')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async (category, currentId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}?category=${category}&limit=5`)
      const data = await response.json()
      if (data.success) {
        const filtered = (data.data || []).filter(p => p._id !== currentId)
        setRelatedProducts(filtered)
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const formatCategoryName = (slug) => {
    if (!slug) return 'Collection'
    if (slug.toLowerCase() === '2-piece-sets') return '2-Piece Sets'
    if (slug.toLowerCase() === '3-piece-sets') return '3-Piece Sets'
    if (slug.toLowerCase() === 'co-ord-sets') return 'Co-ord Sets'
    return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
  }

  const toggleAccordion = (section) => {
    setActiveAccordion(prev => prev === section ? null : section)
  }

  // Available sizes fallback so EVERY product has complete size selection
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
    addToCart({ ...product, selectedSize })
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  if (loading) {
    return (
      <div className="product-loading-container">
        <div className="luxury-loader"></div>
        <p>Unveiling Masterpiece...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-not-found" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', marginBottom: '16px' }}>Masterpiece not found</h2>
        <p style={{ color: '#666', marginBottom: '32px' }}>We couldn't find the piece with ID: {id}</p>
        <button 
          onClick={() => navigate('/')}
          style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '16px 40px', textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer' }}
        >
          Return to Collection
        </button>
      </div>
    )
  }

  return (
    <div className="editorial-product-page">
      {/* Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div 
            className="cart-toast-banner"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <span>✦ Added to your Shopping Bag (Size: {selectedSize})</span>
            <button onClick={() => navigate('/cart')}>View Bag</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Back Navigation */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back to Collection</span>
        </button>
      </div>

      <div className="product-luxury-wrapper">
        {/* Left Column: Gallery */}
        <div className="product-gallery">
          <div className="main-image-container">
            <AnimatePresence mode='wait'>
              <motion.img 
                key={selectedImage}
                src={getImageUrl(product.images?.[selectedImage])} 
                alt={product.name}
                className="main-display-img"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </AnimatePresence>
            {product.stock < 10 && <div className="limited-edition-badge">Limited Edition</div>}
          </div>
          
          <div className="thumbnail-list">
            {product.images?.map((img, idx) => (
              <div 
                key={idx} 
                className={`thumbnail-item ${selectedImage === idx ? 'active' : ''}`}
                onClick={() => setSelectedImage(idx)}
              >
                <img src={getImageUrl(img)} alt={`View ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Redesigned Haute Couture Details */}
        <div className="product-details-content">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Formatted Breadcrumb */}
            <nav className="breadcrumb-luxury">
              <span onClick={() => navigate('/')}>Home</span>
              <span className="sep">/</span>
              <span onClick={() => navigate(`/category/${product.category}`)}>
                {formatCategoryName(product.category)}
              </span>
              <span className="sep">/</span>
              <span className="current">{product.name}</span>
            </nav>

            {/* Category Filigree Badge */}
            <div className="product-category-pill">
              <span className="sparkle">✦</span>
              <span>{formatCategoryName(product.category)}</span>
            </div>

            {/* Product Heading */}
            <h1 className="product-name-heading">{product.name}</h1>

            {/* Pricing Row */}
            <div className="product-price-row">
              <div className="price-main-block">
                <span className="price-value">₹{product.price?.toLocaleString('en-IN')}</span>
              </div>
              <span className="tax-guarantee-chip">✦ Inclusive of all taxes & free shipping</span>
            </div>

            {/* Editorial Description */}
            <div className="product-description-editorial">
              <p>
                {product.description || "Hand-crafted with exquisite precision, designed to bring effortless elegance and regal silhouette to your wardrobe."}
              </p>
            </div>

            {/* Size & Action Zone (ALWAYS RENDERED FOR ALL PRODUCTS) */}
            <div className="product-selection-zone">
              <div className="selection-group">
                <div className="selection-header">
                  <span className="selection-label">Select Size: <strong className="selected-size-text">{selectedSize}</strong></span>
                  <button 
                    className="size-guide-trigger"
                    onClick={() => setShowSizeGuide(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="10" rx="2" />
                      <line x1="6" y1="7" x2="6" y2="11" />
                      <line x1="10" y1="7" x2="10" y2="11" />
                      <line x1="14" y1="7" x2="14" y2="11" />
                      <line x1="18" y1="7" x2="18" y2="11" />
                    </svg>
                    Size Guide
                  </button>
                </div>

                <div className="size-options">
                  {availableSizes.map(size => (
                    <button 
                      key={size} 
                      className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons Stack */}
              <div className="action-stack">
                <div className="main-actions-row">
                  <motion.button 
                    className="add-to-bag-luxury"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddBag}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                    </svg>
                    <span>Add to Bag</span>
                  </motion.button>
                  
                  <motion.button 
                    className="buy-now-luxury"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (!selectedSize) {
                        alert('Please select a size to proceed')
                        return
                      }
                      addToCart({ ...product, selectedSize })
                      navigate('/checkout')
                    }}
                  >
                    Buy Now
                  </motion.button>
                </div>
                
                <button 
                  className={`wishlist-toggle-luxury ${isInWishlist(product._id) ? 'active' : ''}`}
                  onClick={() => toggleWishlist(product)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{isInWishlist(product._id) ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Custom Interactive Accordion Sections */}
            <div className="heritage-details-custom">
              {/* Accordion 1: Fabric & Craftsmanship */}
              <div className={`accordion-item ${activeAccordion === 'fabric' ? 'open' : ''}`}>
                <button 
                  className="accordion-header-btn"
                  onClick={() => toggleAccordion('fabric')}
                >
                  <div className="header-label-wrap">
                    <span className="icon-gold">✦</span>
                    <span className="title-text">Fabric & Craftsmanship</span>
                  </div>
                  <span className={`chevron-icon ${activeAccordion === 'fabric' ? 'open' : ''}`}>↓</span>
                </button>

                <AnimatePresence>
                  {activeAccordion === 'fabric' && (
                    <motion.div 
                      className="accordion-body-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <p>
                        Hand-selected premium textiles, meticulously embroidered by master artisans. Every piece undergoes rigorous quality checks to ensure legacy standards.
                      </p>
                      <ul className="care-bullets">
                        <li><span>✦</span> Dry clean only to preserve metallic threadwork</li>
                        <li><span>✦</span> Store in a cool, dry place away from direct sunlight</li>
                        <li><span>✦</span> Handle delicate drapes with extra care</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Shipping & Returns */}
              <div className={`accordion-item ${activeAccordion === 'shipping' ? 'open' : ''}`}>
                <button 
                  className="accordion-header-btn"
                  onClick={() => toggleAccordion('shipping')}
                >
                  <div className="header-label-wrap">
                    <span className="icon-gold">✦</span>
                    <span className="title-text">Shipping & Returns</span>
                  </div>
                  <span className={`chevron-icon ${activeAccordion === 'shipping' ? 'open' : ''}`}>↓</span>
                </button>

                <AnimatePresence>
                  {activeAccordion === 'shipping' && (
                    <motion.div 
                      className="accordion-body-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <p>
                        Complimentary premium shipping across India. Orders are dispatched within 2-4 business days in our signature gift box.
                      </p>
                      <p className="return-note">
                        Hassle-free returns & exchanges accepted within 7 days of delivery in original packaging.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 3: Artisanal Authenticity Guarantee */}
              <div className={`accordion-item ${activeAccordion === 'authenticity' ? 'open' : ''}`}>
                <button 
                  className="accordion-header-btn"
                  onClick={() => toggleAccordion('authenticity')}
                >
                  <div className="header-label-wrap">
                    <span className="icon-gold">✦</span>
                    <span className="title-text">100% Authentic Handloom Seal</span>
                  </div>
                  <span className={`chevron-icon ${activeAccordion === 'authenticity' ? 'open' : ''}`}>↓</span>
                </button>

                <AnimatePresence>
                  {activeAccordion === 'authenticity' && (
                    <motion.div 
                      className="accordion-body-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <p>
                        Every See Mee design comes certified with an authentic artisan seal, ensuring pure weave integrity and fair-wage support for master weavers.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="size-modal-backdrop" onClick={() => setShowSizeGuide(false)}>
            <motion.div 
              className="size-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="size-modal-header">
                <div>
                  <span className="size-modal-badge">✦ ATELIER GARMENT MEASUREMENTS</span>
                  <h3>OFFICIAL SIZE CHART</h3>
                </div>
                <button className="close-modal-btn" onClick={() => setShowSizeGuide(false)}>✕</button>
              </div>

              {/* Unit Converter Switcher */}
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
                      <th>Shoulder ({sizeUnit})</th>
                      <th>Length ({sizeUnit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeUnit === 'in' ? (
                      <>
                        <tr><td><strong>XS</strong></td><td>32 - 34</td><td>26 - 28</td><td>36 - 38</td><td>14.0</td><td>44</td></tr>
                        <tr><td><strong>S</strong></td><td>34 - 36</td><td>28 - 30</td><td>38 - 40</td><td>14.5</td><td>45</td></tr>
                        <tr><td><strong>M</strong></td><td>36 - 38</td><td>30 - 32</td><td>40 - 42</td><td>15.0</td><td>45</td></tr>
                        <tr><td><strong>L</strong></td><td>38 - 40</td><td>32 - 34</td><td>42 - 44</td><td>15.5</td><td>46</td></tr>
                        <tr><td><strong>XL</strong></td><td>40 - 42</td><td>34 - 36</td><td>44 - 46</td><td>16.0</td><td>46</td></tr>
                        <tr><td><strong>XXL</strong></td><td>42 - 44</td><td>36 - 38</td><td>46 - 48</td><td>16.5</td><td>47</td></tr>
                        <tr><td><strong>3XL</strong></td><td>44 - 46</td><td>38 - 40</td><td>48 - 50</td><td>17.0</td><td>47</td></tr>
                      </>
                    ) : (
                      <>
                        <tr><td><strong>XS</strong></td><td>81 - 86</td><td>66 - 71</td><td>91 - 96</td><td>35.5</td><td>111.5</td></tr>
                        <tr><td><strong>S</strong></td><td>86 - 91</td><td>71 - 76</td><td>96 - 101.5</td><td>37.0</td><td>114.0</td></tr>
                        <tr><td><strong>M</strong></td><td>91 - 96.5</td><td>76 - 81</td><td>101.5 - 106.5</td><td>38.0</td><td>114.0</td></tr>
                        <tr><td><strong>L</strong></td><td>96.5 - 101.5</td><td>81 - 86</td><td>106.5 - 111.5</td><td>39.5</td><td>117.0</td></tr>
                        <tr><td><strong>XL</strong></td><td>101.5 - 106.5</td><td>86 - 91.5</td><td>111.5 - 117</td><td>40.5</td><td>117.0</td></tr>
                        <tr><td><strong>XXL</strong></td><td>106.5 - 111.5</td><td>91.5 - 96.5</td><td>117 - 122</td><td>42.0</td><td>119.5</td></tr>
                        <tr><td><strong>3XL</strong></td><td>111.5 - 117</td><td>96.5 - 101.5</td><td>122 - 127</td><td>43.0</td><td>119.5</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* How to Measure & Tailoring Banner */}
              <div className="size-guide-footer">
                <div className="how-to-measure-block">
                  <h4>✦ HOW TO MEASURE YOURSELF</h4>
                  <ul>
                    <li><strong>Bust:</strong> Measure around the fullest part of your bust while keeping the tape horizontal.</li>
                    <li><strong>Waist:</strong> Measure around the narrowest part of your waistline (typically where your body bends side to side).</li>
                    <li><strong>Hips:</strong> Stand with feet together and measure around the fullest part of your hips.</li>
                  </ul>
                </div>
                <div className="custom-tailor-note">
                  <span>✦ <strong>Need Custom Tailoring?</strong> Select <strong>"Custom"</strong> size at checkout or contact our concierge after ordering for bespoke sizing.</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Suggested Masterpieces */}
      {relatedProducts.length > 0 && (
        <section className="suggested-section">
          <div className="suggested-header">
            <span className="editorial-label">✦ YOU MAY ALSO ADMIRE ✦</span>
            <h2 className="editorial-title-small">CURATED FOR YOU</h2>
          </div>
          <div className="related-products-grid">
            {relatedProducts.map((p) => (
              <motion.div 
                key={p._id} 
                className="related-product-card"
                whileHover={{ y: -8 }}
                onClick={() => navigate(`/product/${p._id}`)}
              >
                <div className="related-img-wrapper">
                  <img src={getImageUrl(p.images?.[0])} alt={p.name} />
                </div>
                <div className="related-info">
                  <span className="related-category">{formatCategoryName(p.category)}</span>
                  <h3>{p.name}</h3>
                  <p className="related-price">₹{p.price?.toLocaleString('en-IN')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductPage
