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
  const [arrivals, setArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.TOP_PRODUCTS)
        const data = await response.json()
        if (data.success && data.data.length > 0) {
          setArrivals(data.data)
        } else {
          setArrivals([
            { id: '1', category: 'anarkali', title: 'Anarkali Suit', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800' },
            { id: '2', category: 'palazzo', title: 'Palazzo Suit', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
            { id: '3', category: 'straight-cut', title: 'Straight Cut Suit', image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800' }
          ])
        }
      } catch (error) {
        setArrivals([
          { id: '1', category: 'anarkali', title: 'Anarkali Suit', image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800' },
          { id: '2', category: 'palazzo', title: 'Palazzo Suit', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
          { id: '3', category: 'straight-cut', title: 'Straight Cut Suit', image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800' }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchTopProducts()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  }

  if (loading) return null

  return (
    <section className="new-arrivals-premium" id="new-arrivals">
      <div className="premium-container">
        <motion.div 
          className="arrivals-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="header-top">
            <span className="premium-subtitle">Curated Selection</span>
            <div className="accent-line"></div>
          </div>
          <h2 className="premium-title">NEW <span>ARRIVALS</span></h2>
          <p className="premium-desc">Discover the latest masterpieces from our artisan atelier, where tradition meets contemporary grace.</p>
        </motion.div>

        <motion.div 
          className="arrivals-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {arrivals.map((item, index) => (
            <motion.div 
              key={item._id || item.id || index} 
              className="arrival-card-modern"
              variants={itemVariants}
            >
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(item._id || item.id) ? "currentColor" : "none"} stroke="currentColor">
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
            </motion.div>
          ))}
        </motion.div>
        
        <div className="arrivals-action">
          <motion.button 
            className="explore-btn-modern"
            whileHover={{ letterSpacing: '0.3em' }}
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

