import { useState, useEffect, useContext, useMemo } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { AuthContext } from '../context/AuthContext'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { trackViewItem } from '../utils/gtmEcommerce'
import { getColorHex } from '../utils/colorHelper'
import { isExcludedSize, getSizeStockQty, getSortedSizesForProduct, getFirstAvailableSize, isSizeInStock, isProductInStock } from '../utils/sizeHelper'
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

  // Sibling color variants found among other products in the store/category
  const siblingColorVariants = useMemo(() => {
    if (!product || !Array.isArray(relatedProducts) || relatedProducts.length === 0) return []
    const norm = (str) => String(str || '').toLowerCase().trim()
    const cleanBaseName = (name) => {
      let n = norm(name)
      n = n.replace(/\s*[-–—|/].*$/, '').replace(/\s*\(.*?\)/g, '').trim()
      return n
    }
    const currentBase = cleanBaseName(product.name)
    if (!currentBase || currentBase.length < 3) return []

    const siblings = []
    const curId = String(product._id || product.id || '')
    relatedProducts.forEach(rel => {
      if (!rel) return
      const relId = String(rel._id || rel.id || '')
      if (relId === curId) return
      const relBase = cleanBaseName(rel.name)
      const isBaseMatch = relBase === currentBase || (relBase.length > 3 && (relBase.startsWith(currentBase) || currentBase.startsWith(relBase)))
      if (isBaseMatch) {
        const relColor = rel.color || (Array.isArray(rel.colors) && rel.colors[0])
        if (relColor && typeof relColor === 'string' && relColor.trim() && relColor.toLowerCase() !== 'standard') {
          const colClean = relColor.trim()
          if (!siblings.some(s => s.color.toLowerCase() === colClean.toLowerCase())) {
            siblings.push({
              color: colClean,
              product: rel,
              productId: relId,
              images: Array.isArray(rel.images) && rel.images.length > 0 ? rel.images : (rel.image ? [rel.image] : [])
            })
          }
        }
      }
    })
    return siblings
  }, [product, relatedProducts])

  // Aggregate all available colors (from colorImages, colors, color, and sibling products)
  const productColors = useMemo(() => {
    const list = []
    // 1. Explicit color-specific images defined on product
    if (Array.isArray(product?.colorImages) && product.colorImages.length > 0) {
      product.colorImages.forEach(ci => {
        if (ci && ci.color && typeof ci.color === 'string' && ci.color.trim()) {
          const clean = ci.color.trim()
          if (!list.some(x => x.toLowerCase() === clean.toLowerCase())) {
            list.push(clean)
          }
        }
      })
    }
    // 2. Regular colors array
    if (Array.isArray(product?.colors) && product.colors.length > 0) {
      product.colors.forEach(c => {
        if (c && typeof c === 'string' && c.trim() && c.trim().toLowerCase() !== 'standard') {
          const clean = c.trim()
          if (!list.some(x => x.toLowerCase() === clean.toLowerCase())) {
            list.push(clean)
          }
        }
      })
    }
    // 3. Single color field
    if (product?.color && typeof product.color === 'string' && product.color.trim() && product.color.trim().toLowerCase() !== 'standard') {
      const clean = product.color.trim()
      if (!list.some(x => x.toLowerCase() === clean.toLowerCase())) {
        list.push(clean)
      }
    }
    // 4. Sibling variant products in store
    siblingColorVariants.forEach(s => {
      if (!list.some(x => x.toLowerCase() === s.color.toLowerCase())) {
        list.push(s.color)
      }
    })
    return list
  }, [product, siblingColorVariants])

  const [selectedColor, setSelectedColor] = useState(() => {
    if (passedProduct) {
      if (Array.isArray(passedProduct.colors) && passedProduct.colors.length > 0) {
        const valid = passedProduct.colors.find(c => c && typeof c === 'string' && c.trim() && c.trim().toLowerCase() !== 'standard')
        if (valid) return valid.trim()
      }
      if (passedProduct.color && typeof passedProduct.color === 'string' && passedProduct.color.trim() && passedProduct.color.trim().toLowerCase() !== 'standard') {
        return passedProduct.color.trim()
      }
    }
    return ''
  })

  // Determine active images according to selected colour
  const currentGalleryImages = useMemo(() => {
    if (!product) return []
    const norm = (s) => String(s || '').toLowerCase().trim()
    const activeCol = norm(selectedColor || (productColors.length > 0 ? productColors[0] : ''))

    // 1. Check explicit colorImages assigned in admin
    if (activeCol && Array.isArray(product.colorImages) && product.colorImages.length > 0) {
      const match = product.colorImages.find(ci => norm(ci.color) === activeCol)
      if (match && Array.isArray(match.images) && match.images.length > 0) {
        return match.images.filter(Boolean)
      }
    }

    // 2. Intelligent keyword / filename matching in product.images
    if (activeCol && Array.isArray(product.images) && product.images.length > 0) {
      const matchedByUrl = product.images.filter(img => {
        const urlStr = norm(typeof img === 'string' ? img : img?.url)
        return urlStr.includes(activeCol) || urlStr.includes(`_${activeCol}`) || urlStr.includes(`-${activeCol}`)
      })
      if (matchedByUrl.length > 0) {
        return matchedByUrl.filter(Boolean)
      }
    }

    // 3. Sibling product image match
    if (activeCol && siblingColorVariants.length > 0) {
      const sibMatch = siblingColorVariants.find(s => norm(s.color) === activeCol)
      if (sibMatch && sibMatch.images && sibMatch.images.length > 0) {
        return sibMatch.images.filter(Boolean)
      }
    }

    // 4. Positional fallback: if product has N colors and N images, map 1:1
    if (activeCol && productColors.length > 1 && Array.isArray(product.images) && product.images.length >= productColors.length) {
      const colIdx = productColors.findIndex(c => norm(c) === activeCol)
      if (colIdx >= 0 && colIdx < product.images.length) {
        const reordered = [product.images[colIdx], ...product.images.filter((_, i) => i !== colIdx)]
        return reordered.filter(Boolean)
      }
    }

    // 5. Fallback to product images or main image
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean)
    }
    if (product.image) {
      return [product.image]
    }
    return []
  }, [product, selectedColor, productColors, siblingColorVariants])

  const handleColorChange = (col) => {
    if (!col) return
    const norm = (s) => String(s || '').toLowerCase().trim()
    const targetCol = norm(col)

    // Check if this color belongs to a sibling product
    const sibMatch = siblingColorVariants.find(s => norm(s.color) === targetCol)
    const hasLocalImages = Array.isArray(product?.colorImages) && product.colorImages.some(ci => norm(ci.color) === targetCol && ci.images?.length > 0)

    if (sibMatch && sibMatch.productId && !hasLocalImages) {
      navigate(`/product/${sibMatch.productId}`, { state: { product: sibMatch.product } })
      return
    }

    setSelectedColor(col)
    setSelectedImage(0)

    // If current selectedSize is out of stock in this newly selected color, switch to first available in-stock size!
    if (selectedSize && !isSizeInStock(selectedSize, product, col)) {
      const bestSize = getFirstAvailableSize(product, selectedSize, col)
      setSelectedSize(bestSize)
    }
  }

  useEffect(() => {
    if (product) {
      if (productColors.length > 0) {
        setSelectedColor(prev => prev && productColors.some(c => c.toLowerCase() === prev.toLowerCase()) ? prev : productColors[0])
      } else {
        setSelectedColor('')
      }
    }
  }, [product?._id || product?.id, product?.colors, product?.color, product?.colorImages, productColors])

  // Get representative image for color swatch thumbnail
  const getColorSwatchImage = (col) => {
    if (!product || !col) return null
    const norm = (s) => String(s || '').toLowerCase().trim()
    const targetCol = norm(col)

    // 1. Explicit colorImages in product
    if (Array.isArray(product.colorImages) && product.colorImages.length > 0) {
      const match = product.colorImages.find(ci => ci && norm(ci.color) === targetCol)
      if (match && Array.isArray(match.images) && match.images.length > 0) {
        return match.images[0]
      }
    }

    // 2. Intelligent keyword / filename match in product.images
    if (Array.isArray(product.images) && product.images.length > 0) {
      const match = product.images.find(img => {
        const urlStr = norm(typeof img === 'string' ? img : img?.url)
        return urlStr.includes(targetCol) || urlStr.includes(`_${targetCol}`) || urlStr.includes(`-${targetCol}`)
      })
      if (match) return match
    }

    // 3. Sibling products match
    if (siblingColorVariants && siblingColorVariants.length > 0) {
      const sib = siblingColorVariants.find(s => norm(s.color) === targetCol)
      if (sib && sib.images && sib.images.length > 0) {
        return sib.images[0]
      }
    }

    // 4. Positional fallback: if product has multiple colors and multiple images
    if (productColors.length > 1 && Array.isArray(product.images) && product.images.length >= productColors.length) {
      const colIdx = productColors.findIndex(c => norm(c) === targetCol)
      if (colIdx >= 0 && colIdx < product.images.length) {
        return product.images[colIdx]
      }
    }

    // 5. Default main image
    return product.images?.[0] || product.image || null
  }

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
      return getFirstAvailableSize(passedProduct, 'S')
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
    const colorToUse = selectedColor || (productColors.length > 0 ? productColors[0] : '')
    if (!selectedSize) {
      if (colorToUse && Array.isArray(product.colorImages)) {
        const cEntry = product.colorImages.find(ci => ci && ci.color && ci.color.trim().toLowerCase() === colorToUse.toLowerCase())
        if (cEntry && Array.isArray(cEntry.sizeStock) && cEntry.sizeStock.length > 0) {
          return cEntry.sizeStock.reduce((acc, item) => acc + Number(item.quantity || 0), 0)
        }
      }
      if (product.sizeStock && Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
        return product.sizeStock.reduce((acc, item) => acc + Number(item.quantity || item.stock || 0), 0)
      }
    }
    return getSizeStockQty(selectedSize, product, colorToUse)
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
        const firstAvailable = getFirstAvailableSize(data.data, 'S')
        setSelectedSize(prev => {
          if (prev && !isExcludedSize(prev)) {
            const prevStock = getSizeStockQty(prev, data.data)
            if (prevStock > 0) return prev
          }
          return firstAvailable
        })
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
      let candidateProducts = []

      // 1. Fetch from the same category first
      if (category) {
        const catUrl = `${API_ENDPOINTS.PRODUCTS}?category=${encodeURIComponent(category)}&limit=24`
        const catData = await cachedFetch(catUrl)
        if (catData?.success && Array.isArray(catData.data)) {
          candidateProducts = catData.data
        }
      }

      // Filter: exclude currently viewed product, and ensure product is in stock
      const curIdStr = String(currentId?._id || currentId || '')
      let inStockRelated = candidateProducts
        .filter(p => {
          const pId = String(p._id || p.id || '')
          return pId && curIdStr && pId !== curIdStr
        })
        .filter(p => isProductInStock(p))

      // 2. If fewer than 4 in-stock products found, supplement with store products
      if (inStockRelated.length < 4) {
        const fallbackUrl = `${API_ENDPOINTS.PRODUCTS}?limit=30`
        const fallbackData = await cachedFetch(fallbackUrl)
        if (fallbackData?.success && Array.isArray(fallbackData.data)) {
          const existingIds = new Set(inStockRelated.map(p => String(p._id || p.id || '')))
          if (curIdStr) existingIds.add(curIdStr)

          const extraInStock = fallbackData.data
            .filter(p => {
              const pId = String(p._id || p.id || '')
              return pId && !existingIds.has(pId)
            })
            .filter(p => isProductInStock(p))

          inStockRelated = [...inStockRelated, ...extraInStock]
        }
      }

      // Display up to 8 in-stock related products
      setRelatedProducts(inStockRelated.slice(0, 8))
    } catch (err) {
      console.error('Error fetching related products:', err)
    }
  }

  const formatCategoryName = (slug) => {
    if (!slug) return 'Collection'
    return String(slug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
  const availableSizes = ((product?.sizes && product.sizes.length > 0)
    ? product.sizes.filter(s => !isExcludedSize(s))
    : (product?.sizeStock && product.sizeStock.some(s => s.quantity > 0))
      ? product.sizeStock.filter(s => s.quantity > 0 && !isExcludedSize(s.size)).map(s => s.size)
      : defaultSizes).filter(s => !isExcludedSize(s))

  const handleAddBag = () => {
    if (!selectedSize) {
      alert('Please select a size to proceed')
      return
    }
    const colorToUse = (selectedColor && selectedColor.toLowerCase() !== 'standard')
      ? selectedColor
      : (productColors.length > 0 ? productColors[0] : ((product?.color && product.color.toLowerCase() !== 'standard') ? product.color : ''))
    const activeColorImg = currentGalleryImages[0] || product.images?.[0] || product.image
    addToCart({ ...product, image: activeColorImg, selectedSize, selectedColor: colorToUse, color: colorToUse, quantity }, navigate)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  const handleBuyNow = () => {
    if (!product) return
    const sizeToUse = selectedSize || (availableSizes && availableSizes.length > 0 ? availableSizes[0] : 'S')
    const colorToUse = (selectedColor && selectedColor.toLowerCase() !== 'standard')
      ? selectedColor
      : (productColors.length > 0 ? productColors[0] : ((product?.color && product.color.toLowerCase() !== 'standard') ? product.color : ''))
    const prodId = product._id || product.id
    const inCartQty = getItemQuantity ? getItemQuantity(prodId, sizeToUse) : 0
    const qtyToUse = Math.max(Number(quantity) || 1, inCartQty || 1)

    const activeColorImg = currentGalleryImages[0] || product.images?.[0] || product.image
    if (buyNow) {
      const res = buyNow({ ...product, image: activeColorImg, selectedSize: sizeToUse, selectedColor: colorToUse, color: colorToUse }, sizeToUse, qtyToUse, navigate)
      if (res === false) return
    } else {
      const res = addToCart({ ...product, image: activeColorImg, selectedSize: sizeToUse, selectedColor: colorToUse, color: colorToUse, quantity: qtyToUse }, navigate)
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

  const mainImageUrl = getImageUrl(currentGalleryImages[selectedImage] || currentGalleryImages[0] || product.images?.[0] || product.image)

  const handleApplyPdpCoupon = async (e, codeOverride) => {
    if (e) e.preventDefault()
    const targetCode = codeOverride || pdpCouponCode
    if (!targetCode) return
    setPdpCouponError(null)

    // Compute updated cart synchronously for instant coupon calculation
    const productId = product.id || product._id
    const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'S'
    const productSize = selectedSize || product.selectedSize || product.size || defaultSize
    const colorToUse = (selectedColor && selectedColor.toLowerCase() !== 'standard')
      ? selectedColor
      : (productColors.length > 0 ? productColors[0] : '')
    const normalizedProduct = {
      ...product,
      id: productId,
      size: productSize,
      selectedSize: productSize,
      color: colorToUse,
      selectedColor: colorToUse
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
                key={mainImageUrl}
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
            {currentGalleryImages && currentGalleryImages.length > 1 && (
              <div className="product-thumbnails-row">
                {currentGalleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumb-chip ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={getImageUrl(img)} alt={`${product.name} view ${idx + 1}`} />
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





            {/* Colour Selector */}
            {productColors.length > 0 && (
              <div className="product-option-section pdp-color-section">
                <div className="size-option-header pdp-color-header-row">
                  <span className="option-title-label pdp-color-title">
                    Color: <strong className="pdp-active-color-name">{selectedColor || productColors[0]}</strong>
                  </span>
                  <span className="pdp-color-count-tag">
                    {productColors.length} {productColors.length === 1 ? 'Color' : 'Colors'}
                  </span>
                </div>
                <div className="color-swatches-row pdp-image-swatches-row">
                  {productColors.map((col) => {
                    const isSelected = (selectedColor || productColors[0] || '').toLowerCase() === col.toLowerCase()
                    const swatchImg = getColorSwatchImage(col)
                    const hex = getColorHex(col)

                    return (
                      <button
                        key={col}
                        type="button"
                        className={`pdp-image-swatch-card ${isSelected ? 'active' : ''}`}
                        onClick={() => handleColorChange(col)}
                        title={`Select Color: ${col}`}
                        aria-label={`Select Color: ${col}`}
                      >
                        {swatchImg ? (
                          <img
                            src={getImageUrl(swatchImg)}
                            alt={col}
                            className="pdp-image-swatch-thumb"
                            loading="lazy"
                          />
                        ) : (
                          <span className="pdp-image-swatch-fallback-hex" style={{ backgroundColor: hex }} />
                        )}
                        <span className="swatch-tooltip">{col}</span>
                      </button>
                    )
                  })}
                </div>
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
                  const colorToUse = selectedColor || (productColors.length > 0 ? productColors[0] : '')
                  const sortedSizesList = getSortedSizesForProduct(product, colorToUse)

                  return sortedSizesList.map(sz => {
                    const sizeQty = getSizeStockQty(sz, product, colorToUse)
                    const isSizeOutOfStock = sizeQty <= 0
                    const isSelected = String(selectedSize).toUpperCase() === String(sz).toUpperCase()

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
                    product={{
                      ...product,
                      image: currentGalleryImages[0] || product.images?.[0] || product.image,
                      selectedColor: (selectedColor && selectedColor.toLowerCase() !== 'standard')
                        ? selectedColor
                        : (productColors.length > 0 ? productColors[0] : '')
                    }}
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
                  <p>On all orders</p>
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
        {(() => {
          const visibleRelated = relatedProducts.filter(rel => isProductInStock(rel))
          if (visibleRelated.length === 0) return null

          return (
            <div className="related-products-section">
              <h2 className="related-section-title">You May Also Like</h2>
              <div className="related-products-grid">
                {visibleRelated.map(rel => {
                  const rPrice = Number(rel.price || 0)
                  const rMrp = (rel.mrp || rel.discountPrice) ? Number(rel.mrp || rel.discountPrice) : null
                  const rHasDiscount = rMrp && rMrp > rPrice
                  const rDiscountPercent = rHasDiscount ? Math.round(((rMrp - rPrice) / rMrp) * 100) : 0
                  const chosenSize = getFirstAvailableSize(rel, 'M')

                  return (
                    <div
                      key={rel._id || rel.id}
                      className="related-product-card"
                      onClick={() => navigate(`/product/${rel._id || rel.id}`, { state: { product: rel } })}
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
                              size: chosenSize,
                              selectedSize: chosenSize,
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
          )
        })()}
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
                    <tr><td>3XL</td><td>{sizeUnit === 'in' ? '44"' : '112 cm'}</td><td>{sizeUnit === 'in' ? '38"' : '97 cm'}</td><td>{sizeUnit === 'in' ? '48"' : '122 cm'}</td></tr>
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
