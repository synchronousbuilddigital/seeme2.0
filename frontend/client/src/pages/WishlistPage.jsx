import { useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import AddToCartButton from '../components/AddToCartButton'
import './WishlistPage.css'

const WishlistPage = () => {
  const navigate = useNavigate()
  const { wishlist, toggleWishlist, addToCart } = useContext(CartContext)

  return (
    <div className="wishlist-page-editorial">
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
      <header className="wishlist-header">
        <span className="editorial-kicker">CURATED SELECTION</span>
        <h1 className="wishlist-title">My Wishlist</h1>
        <p className="wishlist-subtitle">Items you've earmarked for your collection.</p>
      </header>

      <div className="wishlist-container">
        {wishlist.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3>Your wishlist is currently empty</h3>
            <p>Explore our collections and save your favorite pieces here.</p>
            <Link to="/collections" className="explore-btn">Explore Collections</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item) => (
              <motion.div 
                key={item.id || item._id} 
                className="wishlist-card"
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="wishlist-card-media">
                  <Link to={`/product/${item.id || item._id}`}>
                    <img src={getOptimizedImageUrl(item.images?.[0] || item.image)} alt={item.name} />
                  </Link>
                  <button className="remove-wishlist-btn" onClick={() => toggleWishlist(item)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="wishlist-card-info">
                  <span className="item-category">{item.category}</span>
                  <h3 className="item-name">{item.name}</h3>
                  <div className="item-price">
                    ₹{(typeof item.price === 'number' ? item.price : parseInt(item.price.replace(/[₹,]/g, '')) || 0).toLocaleString('en-IN')}
                  </div>
                  <AddToCartButton
                    product={item}
                    variant="full"
                    label="ADD TO BAG"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WishlistPage
