import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_ENDPOINTS, getAdminUrl } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './Navbar.css'

const normalizeCategorySlug = (slug) => {
  if (!slug) return ''
  const str = (typeof slug === 'object' && slug !== null) ? (slug.slug || slug.title || slug.name || '') : String(slug)
  let s = str.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  if (s.startsWith('2piece')) return '2piece'
  if (s.startsWith('3piece')) return '3piece'
  if (s.includes('coord') || s.includes('cord')) return 'coord'
  return s
}

const getCategoryLabel = (catItem) => {
  if (!catItem) return ''
  if (typeof catItem === 'object' && catItem !== null) {
    if (catItem.title) return catItem.title
    if (catItem.label) return catItem.label
    if (catItem.name) return catItem.name
  }
  const str = String(catItem)
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const getCategorySlug = (catItem) => {
  if (!catItem) return ''
  if (typeof catItem === 'object' && catItem !== null) {
    if (catItem.slug) return catItem.slug
    if (catItem.title) return String(catItem.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }
  return String(catItem).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const Navbar = ({ onCartOpen, onWishlistOpen }) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [logo, setLogo] = useState('/images/logoSEEMEE1.png')
  const { getCartCount, getWishlistCount } = useCart()
  const { user, token, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAboutPage = location.pathname === '/about'

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    if (path === '/categories') {
      return location.pathname.startsWith('/categor')
    }
    if (path === '/collections') {
      return location.pathname.startsWith('/collection') || location.pathname.startsWith('/shop')
    }
    if (path === '/catalog') {
      return location.pathname.startsWith('/catalog')
    }
    if (path === '/fabrics') {
      return location.pathname.startsWith('/fabric')
    }
    if (path === '/magazine') {
      return location.pathname.startsWith('/magazine')
    }
    if (path === '/about') {
      return location.pathname.startsWith('/about')
    }
    return location.pathname === path
  }

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableCategories, setAvailableCategories] = useState([])

  useEffect(() => {
    const fetchNavbarCategories = async () => {
      try {
        const [settingsData, prodData] = await Promise.all([
          cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true }).catch(() => null),
          cachedFetch(API_ENDPOINTS.PRODUCTS).catch(() => null)
        ])

        const activeProducts = (prodData?.success && Array.isArray(prodData.data)) ? prodData.data : []

        let adminCategorySlides = []
        if (settingsData?.success && settingsData.data?.categorySlides?.length > 0) {
          adminCategorySlides = settingsData.data.categorySlides
        }

        const categoriesData = await cachedFetch(API_ENDPOINTS.GET_CATEGORIES).catch(() => null)
        let apiCategories = []
        if (categoriesData?.success && Array.isArray(categoriesData.data)) {
          apiCategories = categoriesData.data
        }

        const seenKeys = new Set()
        const mergedCategories = []

        if (adminCategorySlides.length > 0) {
          adminCategorySlides.filter(Boolean).forEach((cat, idx) => {
            const key = (cat?.slug || cat?.title || '').toLowerCase().trim()
            if (key && !seenKeys.has(key)) {
              seenKeys.add(key)

              const normKey = key.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
              const matchedProduct = activeProducts.find(p => {
                if (!p || !p.category) return false
                const normPCat = p.category.toLowerCase().replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
                return normPCat === normKey || p.category.toLowerCase() === key
              })
              const prodImg = matchedProduct && (matchedProduct.images?.[0] || matchedProduct.image)
              const poolImg = activeProducts[idx % activeProducts.length]?.images?.[0] || activeProducts[idx % activeProducts.length]?.image

              const catImage = cat.image || cat.img || prodImg || poolImg || '/images/categories_straight.jpg'

              mergedCategories.push({
                slug: getCategorySlug(cat),
                label: getCategoryLabel(cat),
                image: getOptimizedImageUrl(catImage)
              })
            }
          })
        } else {
          apiCategories.filter(Boolean).forEach((cat, idx) => {
            const key = (typeof cat === 'string' ? cat : (cat?.slug || cat?.title || '')).toLowerCase().trim()
            if (key && !seenKeys.has(key)) {
              seenKeys.add(key)

              const normKey = key.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
              const matchedProduct = activeProducts.find(p => {
                if (!p.category) return false
                const normPCat = p.category.toLowerCase().replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
                return normPCat === normKey || p.category.toLowerCase() === key
              })
              const prodImg = matchedProduct && (matchedProduct.images?.[0] || matchedProduct.image)
              const poolImg = activeProducts[idx % activeProducts.length]?.images?.[0] || activeProducts[idx % activeProducts.length]?.image

              const rawImg = typeof cat === 'object' ? (cat.image || cat.img) : null
              const catImage = rawImg || prodImg || poolImg || '/images/categories_straight.jpg'

              mergedCategories.push({
                slug: getCategorySlug(cat),
                label: getCategoryLabel(cat),
                image: getOptimizedImageUrl(catImage)
              })
            }
          })
        }

        if (mergedCategories.length > 0) {
          setAvailableCategories(mergedCategories)
        }
      } catch (err) {
        console.error('Error fetching admin categories for Navbar:', err)
      }
    }

    fetchNavbarCategories()
  }, [])

  useEffect(() => {
    cachedFetch(API_ENDPOINTS.SITE_SETTINGS)
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

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''} ${isAboutPage ? 'about-navbar' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="navbar-container">
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

        <div className={`nav-links ${scrolled ? 'scrolled-links' : ''}`}>
          <button onClick={() => handleNavigation('/')} className={`nav-item ${isActiveRoute('/') ? 'active' : ''}`}>Home</button>

          <div
            className="nav-dropdown"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              className={`dropdown-trigger nav-item ${isActiveRoute('/categories') ? 'active' : ''}`}
              onClick={() => handleNavigation('/categories')}
            >
              Categories
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="dropdown-arrow">
                <path d="M6 9L1 4h10z" />
              </svg>
            </button>
            <AnimatePresence>
              {categoriesOpen && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: 15, x: '-50%', scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: 10, x: '-50%', scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="dropdown-grid">
                    {availableCategories.map(cat => {
                      const catSlug = cat.slug || cat
                      const isCatActive = location.pathname === `/category/${catSlug}`
                      return (
                        <button
                          key={catSlug}
                          className={isCatActive ? 'active' : ''}
                          onClick={() => handleNavigation(`/category/${catSlug}`)}
                        >
                          <img
                            src={cat.image || '/images/categories_straight.jpg'}
                            alt={cat.label || getCategoryLabel(cat)}
                            className="cat-dropdown-thumb"
                            onError={(e) => { e.currentTarget.src = '/images/categories_straight.jpg' }}
                          />
                          <span>{cat.label || getCategoryLabel(cat)}</span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => handleNavigation('/collections')} className={`nav-item ${isActiveRoute('/collections') ? 'active' : ''}`}>Shop</button>
          <button onClick={() => handleNavigation('/catalog')} className={`nav-item highlight-catalog ${isActiveRoute('/catalog') ? 'active' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '5px' }}>
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2.5" ry="2.5" />
            </svg>
            Catalog
          </button>
          <button onClick={() => handleNavigation('/fabrics')} className={`nav-item ${isActiveRoute('/fabrics') ? 'active' : ''}`}>Fabrics</button>
          <button onClick={() => handleNavigation('/magazine')} className={`nav-item ${isActiveRoute('/magazine') ? 'active' : ''}`}>Magazine</button>
          <button onClick={() => handleNavigation('/about')} className={`nav-item ${isActiveRoute('/about') ? 'active' : ''}`}>About</button>
        </div>

        <div className="nav-actions">
          <AnimatePresence>
            {searchOpen && (
              <motion.form
                className="search-form"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '250px', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                onSubmit={handleSearch}
              >
                <input
                  type="text"
                  placeholder="Search silhouettes..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                />
              </motion.form>
            )}
          </AnimatePresence>

          <motion.button
            className={`icon-btn search-btn ${searchOpen ? 'active' : ''}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
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
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
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
                  {user?.role === 'admin' ? (
                    <button
                      className="profile-menu-item"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        const adminToken = token || localStorage.getItem('seemee-token') || localStorage.getItem('adminToken') || '';
                        const adminUserStr = user ? JSON.stringify(user) : localStorage.getItem('seemee-user') || localStorage.getItem('adminUser') || '';
                        window.location.href = `${getAdminUrl()}/dashboard?token=${encodeURIComponent(adminToken)}&user=${encodeURIComponent(adminUserStr)}`;
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="9" />
                        <rect x="14" y="3" width="7" height="5" />
                        <rect x="14" y="12" width="7" height="9" />
                        <rect x="3" y="16" width="7" height="5" />
                      </svg>
                      Admin Dashboard
                    </button>
                  ) : (
                    <>
                      <button className="profile-menu-item" onClick={() => { setProfileMenuOpen(false); navigate('/account'); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        My Profile
                      </button>
                      <button className="profile-menu-item" onClick={() => { setProfileMenuOpen(false); navigate('/orders'); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                        My Orders
                      </button>
                      <button className="profile-menu-item" onClick={() => { setProfileMenuOpen(false); onWishlistOpen(); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        Saved Items
                      </button>
                    </>
                  )}
                  <div className="profile-divider"></div>
                  <button className="profile-menu-item logout-btn" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
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
          <button onClick={() => handleNavigation('/')} className={isActiveRoute('/') ? 'active' : ''}>Home</button>

          {/* Mobile Categories Submenu */}
          <div className="mobile-submenu">
            <button
              className={`mobile-submenu-trigger ${isActiveRoute('/categories') ? 'active' : ''}`}
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              Categories
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: '4px', transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                <path d="M6 9L1 4h10z" />
              </svg>
            </button>
            {categoriesOpen && (
              <div className="mobile-submenu-items">
                {availableCategories.map(cat => {
                  const catSlug = cat.slug || cat
                  const isCatActive = location.pathname === `/category/${catSlug}`
                  return (
                    <button
                      key={catSlug}
                      className={isCatActive ? 'active' : ''}
                      onClick={() => handleNavigation(`/category/${catSlug}`)}
                    >
                      <img
                        src={cat.image || '/images/categories_straight.jpg'}
                        alt={cat.label || getCategoryLabel(cat)}
                        className="cat-dropdown-thumb mobile"
                        onError={(e) => { e.currentTarget.src = '/images/categories_straight.jpg' }}
                      />
                      <span>{cat.label || getCategoryLabel(cat)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button onClick={() => handleNavigation('/collections')} className={isActiveRoute('/collections') ? 'active' : ''}>Shop</button>
          <button onClick={() => handleNavigation('/catalog')} className={`mobile-catalog-btn ${isActiveRoute('/catalog') ? 'active' : ''}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '6px' }}>
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2.5" ry="2.5" />
            </svg>
            Catalog Reels
          </button>
          <button onClick={() => handleNavigation('/fabrics')} className={isActiveRoute('/fabrics') ? 'active' : ''}>Fabrics</button>
          <button onClick={() => handleNavigation('/magazine')} className={isActiveRoute('/magazine') ? 'active' : ''}>Magazine</button>
          <button onClick={() => handleNavigation('/about')} className={isActiveRoute('/about') ? 'active' : ''}>About</button>
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setMenuOpen(false);
                const adminToken = token || localStorage.getItem('seemee-token') || localStorage.getItem('adminToken') || '';
                const adminUserStr = user ? JSON.stringify(user) : localStorage.getItem('seemee-user') || localStorage.getItem('adminUser') || '';
                window.location.href = `${getAdminUrl()}/dashboard?token=${encodeURIComponent(adminToken)}&user=${encodeURIComponent(adminUserStr)}`;
              }}
              className="mobile-admin-btn"
              style={{ color: '#D4AF37', fontWeight: '600', letterSpacing: '0.05em' }}
            >
              ✦ Admin Dashboard
            </button>
          )}
        </motion.div>
      )}
    </motion.nav>
  )
}

export default Navbar
