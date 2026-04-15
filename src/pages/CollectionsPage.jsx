import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './CollectionsPage.css'

const CollectionsPage = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  const { addToCart } = useContext(CartContext)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, selectedCategory, sortBy])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        // featured - keep original order
        break
    }

    setFilteredProducts(filtered)
  }

  const categories = [
    { value: 'all', label: 'All Collections' },
    { value: 'anarkali', label: 'Anarkali' },
    { value: 'palazzo', label: 'Palazzo' },
    { value: 'straight-cut', label: 'Straight Cut' },
    { value: 'sharara', label: 'Sharara' }
  ]

  const handleAddToCart = (product) => {
    addToCart(product)
  }

  const openProductModal = (product) => {
    setSelectedProduct(product)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
  }

  if (loading) {
    return (
      <div className="collections-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading Collections...</p>
      </div>
    )
  }

  return (
    <div className="collections-page">
      {/* Header */}
      <motion.div 
        className="collections-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="collections-title">Our Collections</h1>
        <p className="collections-subtitle">Discover Timeless Elegance in Every Piece</p>
      </motion.div>

      {/* Filters & Sort */}
      <motion.div 
        className="collections-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="collections-filters">
          <label>Category:</label>
          <div className="filter-buttons">
            {categories.map(cat => (
              <button
                key={cat.value}
                className={`filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="collections-sort">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>

        <div className="collections-count">
          <span>{filteredProducts.length} Products</span>
        </div>
      </motion.div>

      {/* Products Grid */}
      <div className="collections-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>No products found in this category.</p>
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <motion.div
              key={product._id}
              className="collection-product-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -10 }}
            >
              <div className="product-image-wrapper" onClick={() => openProductModal(product)}>
                <img 
                  src={getOptimizedImageUrl(product.image, 'product')} 
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-overlay">
                  <button className="quick-view-btn">Quick View</button>
                </div>
                {product.stock === 0 && (
                  <div className="out-of-stock-badge">Out of Stock</div>
                )}
              </div>

              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <span className="product-price">₹{product.price.toLocaleString()}</span>
                  <motion.button
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Product Modal */}
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeProductModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="modal-content">
              <div className="modal-image">
                <img 
                  src={getOptimizedImageUrl(selectedProduct.image, 'hero')} 
                  alt={selectedProduct.name}
                />
              </div>

              <div className="modal-details">
                <span className="modal-category">{selectedProduct.category}</span>
                <h2 className="modal-title">{selectedProduct.name}</h2>
                <p className="modal-description">{selectedProduct.description}</p>
                
                <div className="modal-price-section">
                  <span className="modal-price">₹{selectedProduct.price.toLocaleString()}</span>
                  {selectedProduct.stock > 0 && (
                    <span className="modal-stock">In Stock: {selectedProduct.stock} units</span>
                  )}
                </div>

                <motion.button
                  className="modal-add-to-cart"
                  onClick={() => {
                    handleAddToCart(selectedProduct)
                    closeProductModal()
                  }}
                  disabled={selectedProduct.stock === 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default CollectionsPage
