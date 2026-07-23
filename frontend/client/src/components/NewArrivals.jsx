import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './NewArrivals.css'

const NewArrivals = () => {
  const navigate = useNavigate()
  const { toggleWishlist, isInWishlist, addToCart } = useContext(CartContext)
  const [arrivals, setArrivals] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_new_arrivals')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('seemee_new_arrivals')
      return cached ? false : true
    } catch {
      return true
    }
  })

  // Fetch Arrivals
  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.TOP_PRODUCTS)
        const data = await response.json()
        let result = []
        if (data.success && data.data.length > 0) {
          result = data.data
        } else {
          result = [
            { id: '1', category: 'anarkali', title: 'Anarkali Suit', price: 7500, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800' },
            { id: '2', category: 'palazzo', title: 'Palazzo Suit', price: 6800, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
            { id: '3', category: 'straight-cut', title: 'Straight Cut Suit', price: 8200, image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800' },
            { id: '4', category: 'sharara', title: 'Sharara Suit', price: 9500, image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=800' }
          ]
        }
        setArrivals(result)
        localStorage.setItem('seemee_new_arrivals', JSON.stringify(result))
      } catch (error) {
        const fallback = [
          { id: '1', category: 'anarkali', title: 'Anarkali Suit', price: 7500, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800' },
          { id: '2', category: 'palazzo', title: 'Palazzo Suit', price: 6800, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
          { id: '3', category: 'straight-cut', title: 'Straight Cut Suit', price: 8200, image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800' },
          { id: '4', category: 'sharara', title: 'Sharara Suit', price: 9500, image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=800' }
        ]
        setArrivals(fallback)
        localStorage.setItem('seemee_new_arrivals', JSON.stringify(fallback))
      } finally {
        setLoading(false)
      }
    }
    fetchTopProducts()
  }, [])

  if (loading) return null

  // Quadruple items (4 copies) for seamless ultrawide continuous looping
  const extendedArrivals = [...arrivals, ...arrivals, ...arrivals, ...arrivals]

  return (
    <section className="new-arrivals-premium small-size-section" id="new-arrivals">
      {/* Header Container - Centered and Padded */}
      <div className="premium-container">
        <motion.div 
          className="arrivals-header compact-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="header-top">
            <span className="premium-subtitle">Curated Selection</span>
            <div className="accent-line"></div>
          </div>
          <h2 className="premium-title">NEW <span>ARRIVALS</span></h2>
          <p className="premium-desc">Discover the latest masterpieces from our artisan atelier, where tradition meets contemporary grace.</p>
        </motion.div>
      </div>

      {/* Continuous Marquee Ticker Container - FULL BLEED / EDGE-TO-EDGE */}
      <div className="arrivals-carousel-container full-bleed-carousel">
        <div className="arrivals-carousel-viewport">
          <div className="arrivals-marquee-track">
            {extendedArrivals.map((item, index) => (
              <div key={index} className="carousel-card-wrapper">
                <div className="arrival-card-modern compact-card">
                  <div className="card-media" onClick={() => (item._id || item.id) ? navigate(`/product/${item._id || item.id}`) : navigate(`/collections`)}>
                    <div className="image-zoom-container">
                      <img 
                        src={getOptimizedImageUrl(item.image || item.images?.[0], 'product')} 
                        alt={item.title || item.name} 
                        loading="lazy"
                      />
                    </div>
                    <div className="card-media-overlay">
                       <div className="quick-view">Quick View</div>
                    </div>
                    <button 
                      className={`heart-btn ${isInWishlist(item._id || item.id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(item)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isInWishlist(item._id || item.id) ? "currentColor" : "none"} stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="card-content-modern">
                    <span className="card-category">{item.category}</span>
                    <h3 className="card-name-modern">{item.title || item.name}</h3>
                    <div className="card-footer-modern">
                      <span className="card-price">₹{item.price?.toLocaleString() || '7,500'}</span>
                      <button className="bag-btn-mini" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Container - Centered and Padded */}
      <div className="premium-container">
        <div className="arrivals-action compact-action">
          <motion.button 
            className="explore-btn-modern"
            whileHover={{ letterSpacing: '0.2em' }}
            onClick={() => navigate('/collections')}
          >
            Explore Full Collection
          </motion.button>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="premium-bg-decor">
        <div className="decor-circle circle-1"></div>
        <div className="decor-circle circle-2"></div>
      </div>
    </section>
  )
}

export default NewArrivals
