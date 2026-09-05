import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { belongsToAudience } from '../utils/categoryHelper'
import AddToCartButton from './AddToCartButton'
import './NewArrivals.css'

const NewArrivals = ({ activeAudience = 'all' }) => {
  const navigate = useNavigate()
  const { toggleWishlist, isInWishlist, addToCart } = useContext(CartContext)
  const [arrivals, setArrivals] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch Arrivals
  useEffect(() => {
    let isMounted = true
    const fetchTopProducts = async () => {
      try {
        if (arrivals.length === 0) setLoading(true)
        const data = await cachedFetch(API_ENDPOINTS.PRODUCTS, { ttlMs: 300000 })
        if (isMounted && data?.success && Array.isArray(data.data) && data.data.length > 0) {
          const audienceFiltered = data.data.filter(p => belongsToAudience(p, activeAudience))
          const newArrivalOnly = audienceFiltered.filter(p => p.isNewArrival === true)
          const finalSelection = newArrivalOnly.length > 0 ? newArrivalOnly : audienceFiltered
          setArrivals(finalSelection.slice(0, 4))
        }
      } catch (error) {
        console.error('Error fetching new arrivals:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchTopProducts()
    return () => { isMounted = false }
  }, [activeAudience])

  if (loading && arrivals.length === 0) return null

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
                <div
                  className="arrival-card-modern compact-card"
                  onClick={() => {
                    const prodId = item._id || item.id
                    if (prodId) {
                      navigate(`/product/${prodId}`, { state: { product: item } })
                    } else {
                      navigate('/collections')
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-media">
                    <div className="image-zoom-container">
                      <img
                        src={getOptimizedImageUrl(item.image || item.images?.[0], 'product')}
                        alt={item.title || item.name}
                        loading="lazy"
                      />
                    </div>

                    <button
                      className={`heart-btn ${isInWishlist(item._id || item.id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(item)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isInWishlist(item._id || item.id) ? "currentColor" : "none"} stroke="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <div className="card-content-modern">
                    <span className="card-category">{item.category}</span>
                    <h3 className="card-name-modern">{item.title || item.name}</h3>
                    <div className="card-footer-modern">
                      <div className="card-price-group">
                        <span className="card-price">₹{item.price ? Number(item.price).toLocaleString('en-IN') : '7,500'}</span>
                        {(item.mrp || item.discountPrice || item.originalPrice) && Number(item.mrp || item.discountPrice || item.originalPrice) > Number(item.price || 0) && (
                          <span className="card-mrp">₹{Number(item.mrp || item.discountPrice || item.originalPrice).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <AddToCartButton
                        product={item}
                        variant="mini"
                        label="+ Add"
                      />
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
            onClick={() => navigate(`/collections?gender=${activeAudience}`)}
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
