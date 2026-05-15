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
  const [selectedSize, setSelectedSize] = useState('')

  useEffect(() => {
    fetchProduct()
    window.scrollTo(0, 0)
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_ENDPOINTS.PRODUCTS}/${id}`)
      const data = await response.json()
      if (data.success) {
        setProduct(data.data)
        if (data.data.sizes?.length > 0) {
          setSelectedSize(data.data.sizes[0])
        }
        // Fetch related products
        fetchRelatedProducts(data.data.category, data.data._id)
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
        // Filter out current product
        const filtered = (data.data || []).filter(p => p._id !== currentId)
        setRelatedProducts(filtered)
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
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
      <div className="product-luxury-wrapper">
        
        {/* Left: Cinematic Gallery */}
        <div className="product-gallery">
          <div className="main-image-container">
            <AnimatePresence mode='wait'>
              <motion.img 
                key={selectedImage}
                src={getImageUrl(product.images?.[selectedImage])} 
                alt={product.name}
                className="main-display-img"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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

        {/* Right: Refined Details */}
        <div className="product-details-content">
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <nav className="breadcrumb-luxury">
              <span onClick={() => navigate('/')}>Home</span> / 
              <span onClick={() => navigate(`/category/${product.category}`)}>{product.category}</span> / 
              <span className="current">{product.name}</span>
            </nav>

            <h1 className="product-name-heading">{product.name}</h1>
            <div className="product-price-row">
              <span className="price-value">₹{product.price?.toLocaleString('en-IN')}</span>
              <span className="tax-info">Inclusive of all taxes</span>
            </div>

            <div className="product-description-editorial">
              <p>{product.description}</p>
            </div>

            <div className="product-selection-zone">
              {/* Size Selection */}
              <div className="selection-group">
                <div className="selection-header">
                  <span className="selection-label">Select Size</span>
                  <button className="size-guide-trigger">Size Guide</button>
                </div>
                <div className="size-options">
                  {product.sizes?.map(size => (
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

              {/* Add to Cart Actions */}
              <div className="action-stack">
                <div className="main-actions-row">
                  <motion.button 
                    className="add-to-bag-luxury"
                    whileHover={{ backgroundColor: '#1a1a1a', color: '#fff' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (product.sizes?.length > 0 && !selectedSize) {
                        alert('Please select a size to proceed')
                        return
                      }
                      addToCart({ ...product, selectedSize })
                    }}
                  >
                    Add to Bag
                  </motion.button>
                  
                  <motion.button 
                    className="buy-now-luxury"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (product.sizes?.length > 0 && !selectedSize) {
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product._id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {isInWishlist(product._id) ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>
            </div>

            {/* Heritage Info Accordion */}
            <div className="heritage-details">
              <details open>
                <summary>Fabric & Craftsmanship</summary>
                <div className="details-inner">
                  <p>Hand-selected premium textiles, meticulously embroidered by master artisans. Every piece undergoes rigorous quality checks to ensure legacy standards.</p>
                  <ul>
                    <li>Dry clean only</li>
                    <li>Store in a cool, dry place</li>
                    <li>Handle with care</li>
                  </ul>
                </div>
              </details>
              <details>
                <summary>Shipping & Returns</summary>
                <div className="details-inner">
                  <p>Complimentary premium shipping on all orders. Returns accepted within 7 days in original packaging.</p>
                </div>
              </details>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Suggested Masterpieces */}
      {relatedProducts.length > 0 && (
        <section className="suggested-section">
          <div className="suggested-header">
            <span className="editorial-label">You May Also Admire</span>
            <h2 className="editorial-title-small">Curated for You</h2>
          </div>
          <div className="related-products-grid">
            {relatedProducts.map((p) => (
              <motion.div 
                key={p._id} 
                className="related-product-card"
                whileHover={{ y: -10 }}
                onClick={() => navigate(`/product/${p._id}`)}
              >
                <div className="related-img-wrapper">
                  <img src={getImageUrl(p.images?.[0])} alt={p.name} />
                </div>
                <div className="related-info">
                  <h3>{p.name}</h3>
                  <p>₹{p.price?.toLocaleString('en-IN')}</p>
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
