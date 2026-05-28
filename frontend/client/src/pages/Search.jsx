import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './Search.css'

const Search = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    sortBy: 'newest',
    minPrice: '',
    maxPrice: '',
    category: ''
  })
  
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const searchTerm = queryParams.get('q') || ''

  useEffect(() => {
    fetchResults()
  }, [location.search, filters])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        sortBy: filters.sortBy,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        category: filters.category
      })
      
      const response = await fetch(`/api/products/search?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.products)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(true)
      // Small delay for smooth transition
      setTimeout(() => setLoading(false), 500)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="search-page">
      {/* Elegant Back Navigation */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>
      <div className="search-header">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="search-summary"
          >
            <h1>Search Results</h1>
            <p>{total} exquisite pieces found for <span>"{searchTerm}"</span></p>
          </motion.div>
        </div>
      </div>

      <div className="search-container container">
        {/* Filters Sidebar */}
        <aside className="search-filters">
          <div className="filter-group">
            <h3>Sort By</h3>
            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <div className="filter-group">
            <h3>Category</h3>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="anarkali">Anarkali</option>
              <option value="palazzo">Palazzo</option>
              <option value="straight-cut">Straight Cut</option>
              <option value="sharara">Sharara</option>
            </select>
          </div>

          <div className="filter-group">
            <h3>Price Range</h3>
            <div className="price-inputs">
              <input 
                type="number" 
                name="minPrice" 
                placeholder="Min" 
                value={filters.minPrice} 
                onChange={handleFilterChange}
              />
              <span>-</span>
              <input 
                type="number" 
                name="maxPrice" 
                placeholder="Max" 
                value={filters.maxPrice} 
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="search-results">
          {loading ? (
            <div className="loader-container">
              <div className="luxury-loader"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product, index) => (
                <motion.div 
                  key={product._id}
                  className="product-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <div className="product-image">
                    <img src={product.images[0]} alt={product.name} />
                    {product.stock <= 0 && <span className="sold-out">Sold Out</span>}
                  </div>
                  <div className="product-info">
                    <span className="category-tag">{product.category}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">₹{product.price.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <h2>No pieces found</h2>
              <p>We couldn't find any matches for your search. Perhaps try a different silhouette or color?</p>
              <button onClick={() => navigate('/new-arrivals')} className="btn-primary">Explore All Collections</button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Search
