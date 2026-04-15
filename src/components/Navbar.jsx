import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'

const Navbar = ({ onCartOpen, onWishlistOpen }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [logo, setLogo] = useState('/images/logoSEEMEE1.png')
  const { getCartCount, getWishlistCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch logo from API
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.logo) {
          setLogo(data.data.logo)
        }
      })
      .catch(err => console.error('Error fetching logo:', err))
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [categoriesOpen, setCategoriesOpen] = useState(false)

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMenuOpen(false)
  }

  const handleNavigation = (path) => {
    navigate(path)
    setMenuOpen(false)
    setCategoriesOpen(false)
  }

  const handleLogout = () => {
    logout()
    setProfileMenuOpen(false)
    navigate('/')
  }

  const handleProfileClick = () => {
    if (isAuthenticated()) {
      setProfileMenuOpen(!profileMenuOpen)
    } else {
      navigate('/auth')
    }
  }

  return (
    <motion.nav 
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="navbar-container">
        {/* Logo */}
        <motion.div 
          className="logo"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <img 
            src={logo} 
            alt="See Mee Logo" 
            className="logo-image"
          />
        </motion.div>

        {/* Navigation Links - Only visible when scrolled */}
        {scrolled && (
          <motion.div 
            className="nav-links"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button onClick={() => handleNavigation('/fabrics')}>Fabrics</button>
            
            {/* Categories Dropdown */}
            <div 
              className="nav-dropdown"
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button className="dropdown-trigger">
                Categories
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: '4px' }}>
                  <path d="M6 9L1 4h10z"/>
                </svg>
              </button>
              <AnimatePresence>
                {categoriesOpen && (
                  <motion.div 
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button onClick={() => handleNavigation('/category/anarkali')}>Anarkali</button>
                    <button onClick={() => handleNavigation('/category/palazzo')}>Palazzo</button>
                    <button onClick={() => handleNavigation('/category/straight-cut')}>Straight Cut</button>
                    <button onClick={() => handleNavigation('/category/sharara')}>Sharara</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => handleNavigation('/new-arrivals')}>New Arrivals</button>
            <button onClick={() => scrollToSection('featured-collection')}>Collections</button>
            <button onClick={() => handleNavigation('/magazine')}>Magazine</button>
            <button onClick={() => scrollToSection('about')}>About</button>
          </motion.div>
        )}

        {/* Actions - Always visible */}
        <div className="nav-actions">
          <motion.button 
            className="icon-btn search-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </motion.button>
          
          <motion.button 
            className="icon-btn cart-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cart')}
            title="Cart"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {getCartCount() > 0 && <span className="cart-count">{getCartCount()}</span>}
          </motion.button>
          
          <motion.button 
            className="icon-btn wishlist-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onWishlistOpen}
            title="Wishlist"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {getWishlistCount() > 0 && <span className="wishlist-count">{getWishlistCount()}</span>}
          </motion.button>
          
          {/* Profile Button */}
          <div className="profile-container">
            <motion.button 
              className={`icon-btn profile-btn ${isAuthenticated() ? 'authenticated' : ''}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleProfileClick}
              title={isAuthenticated() ? 'Profile' : 'Sign In'}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </motion.button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {profileMenuOpen && isAuthenticated() && (
                <motion.div 
                  className="profile-dropdown"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="profile-info">
                    <div className="profile-avatar">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-details">
                      <p className="profile-name">{user?.name}</p>
                      <p className="profile-email">{user?.email}</p>
                    </div>
                  </div>
                  <div className="profile-divider"></div>
                  <button className="profile-menu-item" onClick={() => { setProfileMenuOpen(false); navigate('/orders'); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    </svg>
                    My Orders
                  </button>
                  <button className="profile-menu-item" onClick={() => { setProfileMenuOpen(false); onWishlistOpen(); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    Wishlist
                  </button>
                  <div className="profile-divider"></div>
                  <button className="profile-menu-item logout-btn" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`menu-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div 
          className="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <button onClick={() => handleNavigation('/fabrics')}>Fabrics</button>
          
          {/* Mobile Categories Submenu */}
          <div className="mobile-submenu">
            <button 
              className="mobile-submenu-trigger"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              Categories
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: '4px', transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                <path d="M6 9L1 4h10z"/>
              </svg>
            </button>
            {categoriesOpen && (
              <div className="mobile-submenu-items">
                <button onClick={() => handleNavigation('/category/anarkali')}>Anarkali</button>
                <button onClick={() => handleNavigation('/category/palazzo')}>Palazzo</button>
                <button onClick={() => handleNavigation('/category/straight-cut')}>Straight Cut</button>
                <button onClick={() => handleNavigation('/category/sharara')}>Sharara</button>
              </div>
            )}
          </div>

          <button onClick={() => handleNavigation('/new-arrivals')}>New Arrivals</button>
          <button onClick={() => scrollToSection('featured-collection')}>Collections</button>
          <button onClick={() => handleNavigation('/magazine')}>Magazine</button>
          <button onClick={() => scrollToSection('about')}>About</button>
        </motion.div>
      )}
    </motion.nav>
  )
}

export default Navbar
