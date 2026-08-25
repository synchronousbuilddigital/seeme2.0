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
  const [navVisible, setNavVisible] = useState(true)
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
    let lastScrollPos = 0
    let ticking = false

    const isCatalogPage = location.pathname.startsWith('/catalog')

    const updateNav = (scrollTop) => {
      const isScrolled = scrollTop > 40
      setScrolled(isScrolled)
      setNavVisible(true)
      ticking = false
    }

    const handleWindowScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateNav(window.scrollY || document.documentElement.scrollTop || 0)
        })
        ticking = true
      }
    }

    const handleContainerScroll = (e) => {
      const target = e.target
      if (target && target.scrollTop !== undefined) {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateNav(target.scrollTop)
          })
          ticking = true
        }
      }
    }

    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    handleWindowScroll()

    let reelsContainer = document.querySelector('.reels-feed-container')
    if (reelsContainer) {
      reelsContainer.addEventListener('scroll', handleContainerScroll, { passive: true })
    }

    const observer = new MutationObserver(() => {
      const container = document.querySelector('.reels-feed-container')
      if (container && container !== reelsContainer) {
        if (reelsContainer) reelsContainer.removeEventListener('scroll', handleContainerScroll)
        reelsContainer = container
        reelsContainer.addEventListener('scroll', handleContainerScroll, { passive: true })
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('scroll', handleWindowScroll)
      if (reelsContainer) {
        reelsContainer.removeEventListener('scroll', handleContainerScroll)
      }
      observer.disconnect()
    }
  }, [location.pathname])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  // Auto-close profile dropdown menu on scroll
  useEffect(() => {
    if (!profileMenuOpen) return

    const handleScrollClose = () => {
      setProfileMenuOpen(false)
    }

    window.addEventListener('scroll', handleScrollClose, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScrollClose)
    }
  }, [profileMenuOpen])

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
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'scrolled' : ''} ${isAboutPage ? 'about-navbar' : ''} ${!navVisible ? 'nav-hidden' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: navVisible ? 0 : -100 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
              onClick={() => {
                if (!isAuthenticated()) {
                  navigate('/auth', { state: { message: 'Please sign in or create an account to view your wishlist.' } })
                } else {
                  onWishlistOpen()
                }
              }}
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

        {/* Premium Glassmorphic Mobile Drawer Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
              />

              {/* Mobile Drawer Sheet */}
              <motion.div
                className="mobile-drawer-sheet"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                {/* Drawer Header */}
                <div className="mobile-drawer-header">
                  <div className="mobile-drawer-brand">
                    <img src={logo} alt="See Mee Logo" className="drawer-logo-img" onClick={() => handleNavigation('/')} />
                    <span className="drawer-atelier-title">SEEMEE</span>
                  </div>
                  <button
                    className="mobile-drawer-close-btn"
                    onClick={() => setMenuOpen(false)}
                    title="Close Menu"
                  >
                    ✕
                  </button>
                </div>

                {/* Navigation Links List (Exact Admin Sidebar Drawer Card Style) */}
                <div className="mobile-drawer-nav-list">
                  <button onClick={() => handleNavigation('/')} className={`admin-style-link ${isActiveRoute('/') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span className="link-text">Home</span>
                    <span className="drawer-arrow">→</span>
                  </button>

                  <button onClick={() => handleNavigation('/collections')} className={`admin-style-link ${isActiveRoute('/collections') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    <span className="link-text">Shop Collections</span>
                    <span className="drawer-arrow">→</span>
                  </button>

                  <button onClick={() => handleNavigation('/catalog')} className={`admin-style-link ${isActiveRoute('/catalog') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2.5" ry="2.5" /></svg>
                    <span className="link-text">Catalog Reels</span>
                    <span className="reels-live-badge">REELS</span>
                    <span className="drawer-arrow">→</span>
                  </button>

                  {/* Categories Collapsible Submenu */}
                  <div className="drawer-submenu-group">
                    <button
                      className={`admin-style-link ${isActiveRoute('/categories') ? 'active' : ''}`}
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                      <span className="link-text">Categories</span>
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" style={{ transform: categoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', marginLeft: 'auto' }}>
                        <path d="M6 9L1 4h10z" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {categoriesOpen && (
                        <motion.div
                          className="drawer-submenu-list"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {availableCategories.map((cat) => {
                            const catSlug = cat.slug || cat
                            return (
                              <button
                                key={catSlug}
                                className={`drawer-sub-link ${location.pathname === `/category/${catSlug}` ? 'active' : ''}`}
                                onClick={() => handleNavigation(`/category/${catSlug}`)}
                              >
                                ✦ {cat.label || getCategoryLabel(cat)}
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={() => handleNavigation('/fabrics')} className={`admin-style-link ${isActiveRoute('/fabrics') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    <span className="link-text">Fabrics & Crafts</span>
                    <span className="drawer-arrow">→</span>
                  </button>

                  <button onClick={() => handleNavigation('/magazine')} className={`admin-style-link ${isActiveRoute('/magazine') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    <span className="link-text">Magazine</span>
                    <span className="drawer-arrow">→</span>
                  </button>

                  <button onClick={() => handleNavigation('/about')} className={`admin-style-link ${isActiveRoute('/about') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                    <span className="link-text">About Atelier</span>
                    <span className="drawer-arrow">→</span>
                  </button>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        const adminToken = token || localStorage.getItem('seemee-token') || localStorage.getItem('adminToken') || '';
                        const adminUserStr = user ? JSON.stringify(user) : localStorage.getItem('seemee-user') || localStorage.getItem('adminUser') || '';
                        window.location.href = `${getAdminUrl()}/dashboard?token=${encodeURIComponent(adminToken)}&user=${encodeURIComponent(adminUserStr)}`;
                      }}
                      className="admin-style-link admin-gold-link"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
                      <span className="link-text">Admin Dashboard</span>
                      <span className="drawer-arrow">→</span>
                    </button>
                  )}

                  <button
                    className="admin-style-link install-gold-link"
                    onClick={() => {
                      setMenuOpen(false);
                      window.dispatchEvent(new CustomEvent('trigger-app-install'));
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span className="link-text">Install Web App</span>
                    <span className="drawer-arrow">→</span>
                  </button>
                </div>

                {/* Drawer Footer Account Info */}
                <div className="mobile-drawer-footer">
                  {isAuthenticated() ? (
                    <button className="admin-style-link logout-style-btn" onClick={handleLogout}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      <span className="link-text">LOGOUT</span>
                      <span className="drawer-arrow">→</span>
                    </button>
                  ) : (
                    <button className="admin-style-link auth-style-btn" onClick={() => handleNavigation('/auth')}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      <span className="link-text">Sign In / Account</span>
                      <span className="drawer-arrow">→</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Sticky Mobile Bottom Navigation Bar (Admin Style) */}
      <nav className="client-mobile-bottom-nav">
        <button
          className={`mobile-bottom-nav-item ${isActiveRoute('/') && !menuOpen ? 'active' : ''}`}
          onClick={() => handleNavigation('/')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>HOME</span>
          <div className="bottom-nav-indicator"></div>
        </button>

        <button
          className={`mobile-bottom-nav-item ${isActiveRoute('/collections') && !menuOpen ? 'active' : ''}`}
          onClick={() => handleNavigation('/collections')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span>SHOP</span>
          <div className="bottom-nav-indicator"></div>
        </button>

        <button
          className={`mobile-bottom-nav-item ${isActiveRoute('/catalog') && !menuOpen ? 'active' : ''}`}
          onClick={() => handleNavigation('/catalog')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2.5" ry="2.5" />
          </svg>
          <span>CATALOG</span>
          <div className="bottom-nav-indicator"></div>
        </button>

        <button
          className={`mobile-bottom-nav-item ${location.pathname === '/cart' && !menuOpen ? 'active' : ''}`}
          onClick={() => handleNavigation('/cart')}
        >
          <div className="mobile-cart-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {getCartCount() > 0 && <span className="mobile-bottom-cart-badge">{getCartCount()}</span>}
          </div>
          <span>CART</span>
          <div className="bottom-nav-indicator"></div>
        </button>

        <button
          className={`mobile-bottom-nav-item ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span>MENU</span>
          <div className="bottom-nav-indicator"></div>
        </button>
      </nav>
    </>
  )
}

export default Navbar
