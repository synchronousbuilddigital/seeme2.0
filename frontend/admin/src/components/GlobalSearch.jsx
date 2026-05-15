import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './GlobalSearch.css'

export default function GlobalSearch({ onResults }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch()
      } else {
        setResults(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async () => {
    setLoading(true)
    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.SEARCH}?q=${encodeURIComponent(query)}&limit=5`, {
        auth: true
      })
      if (data.success) {
        setResults(data.data)
        setIsOpen(true)
      }
    } catch (err) {
      console.error('Search error', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (type, item) => {
    onResults({ type, item })
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className="global-search-container" ref={searchRef}>
      <div className={`search-input-wrapper ${loading ? 'loading' : ''}`}>
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search products, orders, customers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
        />
        {loading && <div className="loader-ring" />}
      </div>

      <AnimatePresence>
        {isOpen && results && (
          <motion.div 
            className="search-results-dropdown"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {results.products.length > 0 && (
              <div className="result-section">
                <h4>Products</h4>
                {results.products.map(p => (
                  <div key={p._id} className="result-item" onClick={() => handleSelect('product', p)}>
                    <img src={p.images[0]} alt="" />
                    <div>
                      <p className="item-title">{p.name}</p>
                      <p className="item-meta">₹{p.price.toLocaleString()} • {p.stock} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.orders.length > 0 && (
              <div className="result-section">
                <h4>Orders</h4>
                {results.orders.map(o => (
                  <div key={o._id} className="result-item" onClick={() => handleSelect('order', o)}>
                    <div className="item-icon">🛍️</div>
                    <div>
                      <p className="item-title">Order #{o.orderNumber}</p>
                      <p className="item-meta">{o.customer.name} • {o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.users.length > 0 && (
              <div className="result-section">
                <h4>Customers</h4>
                {results.users.map(u => (
                  <div key={u._id} className="result-item" onClick={() => handleSelect('customer', u)}>
                    <div className="item-icon avatar">{u.name[0]}</div>
                    <div>
                      <p className="item-title">{u.name}</p>
                      <p className="item-meta">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!results.products.length && !results.orders.length && !results.users.length && (
              <div className="no-results-msg">No matches found for "{query}"</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
