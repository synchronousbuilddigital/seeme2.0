import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './AdminDashboard.css'
import NewArrivalsManager from '../components/NewArrivalsManager'
import ProductsManager from '../components/ProductsManager'
import OrdersManager from '../components/OrdersManager'
import CategoryManager from '../components/CategoryManager'
import BrandManager from '../components/BrandManager'
import GlobalSearch from '../components/GlobalSearch'
import InventoryManager from '../components/InventoryManager'
import CustomersManager from '../components/CustomersManager'
import PaymentsManager from '../components/PaymentsManager'
import ActivityManager from '../components/ActivityManager'
import HeroCarouselManager from '../components/HeroCarouselManager'
import BannerManager from '../components/BannerManager'
import MagazineManager from '../components/MagazineManager'
import ReelsManager from '../components/ReelsManager'
import CouponsManager from '../components/CouponsManager'
import NotificationBell from '../components/NotificationBell'
import NotificationCenter from '../components/NotificationCenter'
import { isAdminSessionValid, getStoredAdminUser, clearAdminSession } from '../utils/apiClient'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    revenue: 0,
    topProducts: [],
    recentOrders: [],
    monthlyRevenue: [],
    totalUsers: 0
  })
  const [backendStatus, setBackendStatus] = useState('checking')
  const [lastSync, setLastSync] = useState(new Date())
  const [selectedProductForHero, setSelectedProductForHero] = useState(null)
  const [timeframe, setTimeframe] = useState('6months')
  const [targetOrderId, setTargetOrderId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check URL parameters for push notification clicks (?orderId=xxx)
    const params = new URLSearchParams(window.location.search)
    const orderIdParam = params.get('orderId')
    if (orderIdParam) {
      handleSelectOrderFromNotif(orderIdParam)
    }
  }, [])

  const handleSelectOrderFromNotif = (orderId) => {
    setTargetOrderId(orderId)
    setActiveTab('orders')
    setVisitedTabs(prev => new Set(prev).add('orders'))
  }

  useEffect(() => {
    if (!isAdminSessionValid()) {
      clearAdminSession()
      navigate('/login')
      return
    }

    // Initial fetch
    fetchStats(timeframe)

    // Real-time sync (polling every 60 seconds)
    const syncInterval = setInterval(() => {
      fetchStats(timeframe)
    }, 60000)

    return () => clearInterval(syncInterval)
  }, [navigate, timeframe])

  const fetchStats = async (tf = timeframe) => {
    try {
      setBackendStatus('online')

      // Fetch fast dashboard summary immediately
      const summaryData = await apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD_SUMMARY, { auth: true })

      if (summaryData.success) {
        const s = summaryData.data
        setStats(prev => ({
          ...prev,
          totalOrders: s.totalOrders || 0,
          totalProducts: s.totalProducts || 0,
          revenue: s.totalRevenue || 0,
          totalUsers: s.totalUsers || 0
        }))
      }

      setLastSync(new Date())

      // Fetch heavy analytics asynchronously in background without blocking initial UI
      apiRequest(`${API_ENDPOINTS.ADMIN.ANALYTICS}?timeframe=${tf}`, { auth: true })
        .then(analyticsData => {
          if (analyticsData.success) {
            const a = analyticsData.data || {}
            const topProds = a.topProducts || []
            setStats(prev => ({
              ...prev,
              pendingOrders: (a.ordersByStatus || []).find(status => status._id === 'pending')?.count || 0,
              topProducts: topProds,
              recentOrders: a.recentOrders || [],
              monthlyRevenue: a.monthlyRevenue || []
            }))

            // Client-side fallback: if any top product lacks an image, enrich it asynchronously
            if (topProds.some(p => !p.image && p._id)) {
              Promise.all(
                topProds.map(async (prod) => {
                  if (prod.image) return prod
                  try {
                    const pRes = await apiRequest(`${API_ENDPOINTS.PRODUCTS}/${prod._id}`)
                    if (pRes?.success && pRes.data?.images?.length > 0) {
                      return { ...prod, image: pRes.data.images[0] }
                    }
                  } catch {
                    // ignore
                  }
                  return prod
                })
              ).then(enriched => {
                setStats(prev => ({ ...prev, topProducts: enriched }))
              })
            }
          }
        })
        .catch(err => console.error('Analytics bg fetch error:', err))

    } catch (error) {
      console.error('Error fetching stats:', error)
      setBackendStatus('offline')

      if (error.message?.toLowerCase().includes('not authorized')) {
        clearAdminSession()
        navigate('/login')
      }
    }
  }

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe)
    fetchStats(newTimeframe)
  }

  const handleLogout = () => {
    clearAdminSession()
    navigate('/login')
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [visitedTabs, setVisitedTabs] = useState(new Set(['overview']))
  const [ordersInitialFilter, setOrdersInitialFilter] = useState('all')

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
    setVisitedTabs(prev => new Set(prev).add(tab))
  }

  const handleOpenOrders = (status = 'all') => {
    setOrdersInitialFilter(status)
    setTargetOrderId(null)
    handleTabClick('orders')
  }

  return (
    <div className="admin-dashboard">
      {/* Mobile Backdrop Overlay when drawer menu is open */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sticky Top Header Bar */}
      <header className="mobile-header-bar">
        <div className="mobile-header-left">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isMobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="mobile-logo-container" onClick={() => handleTabClick('overview')}>
            <img src="/images/logoSEEMEE1.png" alt="See Mee" className="mobile-logo" />
            <span className="mobile-app-title">ADMIN</span>
          </div>
        </div>

        <div className="mobile-header-right">
          <span className="mobile-active-tab-name">
            {activeTab === 'overview' && 'Overview'}
            {activeTab === 'products' && 'Products'}
            {activeTab === 'orders' && 'Orders'}
            {activeTab === 'inventory' && 'Inventory'}
            {activeTab === 'customers' && 'Customers'}
            {activeTab === 'activity' && 'Activity'}
            {activeTab === 'categories' && 'Categories'}
            {activeTab === 'hero' && 'Hero'}
            {activeTab === 'magazine' && 'Magazine'}
          </span>
          <div className="mobile-avatar" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>A</div>
        </div>
      </header>

      {/* Sidebar Navigation Drawer (Desktop fixed sidebar & Mobile slide-out drawer) */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container" onClick={() => handleTabClick('overview')} style={{ cursor: 'pointer' }}>
            <img
              src="/images/logoSEEMEE1.png"
              alt="See Mee Logo"
              className="admin-logo"
            />
          </div>
          {!sidebarCollapsed && <span className="admin-brand-name">ADMIN PANEL</span>}
          {/* Mobile close button inside sidebar */}
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(prev => !prev)}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        <nav className="sidebar-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => handleTabClick('overview')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Overview</span>
          </button>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => handleTabClick('products')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span>Products</span>
          </button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => handleTabClick('orders')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span>Orders</span>
          </button>
          <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => handleTabClick('inventory')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <span>Inventory</span>
          </button>
          <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => handleTabClick('customers')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            <span>Customers</span>
          </button>
          <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => handleTabClick('activity')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span>Activity Log</span>
          </button>
          <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => handleTabClick('categories')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            <span>Categories</span>
          </button>
          <button className={activeTab === 'brands' ? 'active' : ''} onClick={() => handleTabClick('brands')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            <span>Brands</span>
          </button>
          <button className={activeTab === 'hero' ? 'active' : ''} onClick={() => handleTabClick('hero')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Hero Section</span>
          </button>
          <button className={activeTab === 'banner' ? 'active' : ''} onClick={() => handleTabClick('banner')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="7" cy="12" r="1.5"></circle><path d="M11 15h7M11 9h4"></path></svg>
            <span>Promo Banner</span>
          </button>
          <button className={activeTab === 'magazine' ? 'active' : ''} onClick={() => handleTabClick('magazine')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span>Magazine Booklet</span>
          </button>
          <button className={activeTab === 'reels' ? 'active' : ''} onClick={() => handleTabClick('reels')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
            <span>Catalog Reels</span>
          </button>
          <button className={activeTab === 'coupons' ? 'active' : ''} onClick={() => handleTabClick('coupons')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            <span>Coupons & Offers</span>
          </button>
          <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => handleTabClick('notifications')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span>Notifications</span>
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="admin-content">
        <div className="content-header">
          <div className="content-topbar">
            <div className="topbar-search-area">
              <GlobalSearch onResults={(selection) => {
                if (selection.type === 'product') setActiveTab('products')
                if (selection.type === 'order') handleSelectOrderFromNotif(selection.id)
                if (selection.type === 'customer') setActiveTab('customers')
              }} />
            </div>

            <div className="topbar-actions">
              <NotificationBell onSelectOrder={handleSelectOrderFromNotif} />
              <div className="admin-profile-pill" onClick={handleLogout} title="Admin Profile (Click to logout)">
                {getStoredAdminUser()?.avatar ? (
                  <img
                    src={getStoredAdminUser().avatar}
                    alt={getStoredAdminUser()?.name || 'Admin'}
                    className="admin-profile-avatar"
                  />
                ) : (
                  <div className="admin-profile-avatar-fallback">
                    {(getStoredAdminUser()?.name || 'Admin').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="admin-profile-text">
                  <span className="admin-profile-name">{getStoredAdminUser()?.name || 'Admin'}</span>
                  <span className="admin-profile-role">{getStoredAdminUser()?.role ? (getStoredAdminUser().role.charAt(0).toUpperCase() + getStoredAdminUser().role.slice(1)) : 'Admin'}</span>
                </div>
                <svg className="admin-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Subpage Header for non-overview tabs */}
        {activeTab !== 'overview' && (
          <div className="subpage-header">
            <h1 className="subpage-title">
              {activeTab === 'products' && 'Product Library'}
              {activeTab === 'orders' && 'Order Management'}
              {activeTab === 'inventory' && 'Inventory Control'}
              {activeTab === 'customers' && 'Customer Registry'}
              {activeTab === 'activity' && 'Real-time Activity'}
              {activeTab === 'categories' && 'Category Slides'}
              {activeTab === 'brands' && 'Brands Manager'}
              {activeTab === 'hero' && 'Hero Carousel'}
              {activeTab === 'banner' && 'Promo Banner Manager'}
              {activeTab === 'magazine' && 'Magazine Booklet'}
              {activeTab === 'reels' && 'Catalog Reels Studio'}
              {activeTab === 'coupons' && 'Coupons & Offers'}
              {activeTab === 'notifications' && 'Notifications History'}
            </h1>
          </div>
        )}

        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <div className="overview-section">
            {/* Overview Header Banner with Date Filter */}
            <div className="overview-header-row">
              <div className="overview-title-group">
                <h1 className="overview-main-title">Dashboard Overview</h1>
                <p className="overview-subtitle">Welcome back! Here's what's happening with your store.</p>
              </div>
              <div className="overview-date-filter">
                <div className="date-filter-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <select
                    className="date-filter-native-select"
                    value={timeframe}
                    onChange={(e) => handleTimeframeChange(e.target.value)}
                  >
                    <option value="6months">Last 6 Months</option>
                    <option value="12months">Last Year</option>
                  </select>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 4 KPI Stat Cards */}
            <div className="stats-grid">
              {/* Card 1: Orders */}
              <motion.div
                className="stat-card"
                onClick={() => handleOpenOrders('all')}
                title="Click to view all Orders"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="stat-card-top">
                  <div className="stat-icon-wrapper blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="21" r="1.5"></circle>
                      <circle cx="19" cy="21" r="1.5"></circle>
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                    </svg>
                  </div>
                  <div className="stat-card-meta">
                    <span className="stat-card-title">ORDERS</span>
                    <span className="stat-card-number">{stats.totalOrders}</span>
                  </div>
                </div>
                <div className="stat-card-bottom">
                  <div className="stat-trend-text positive">
                    ↗ +12% <span className="stat-trend-sub">vs last month</span>
                  </div>
                  <svg className="stat-sparkline" width="68" height="28" viewBox="0 0 68 28" fill="none">
                    <path d="M2 22 C 16 26, 22 10, 34 18 C 46 26, 54 8, 66 10" stroke="#93C5FD" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              {/* Card 2: Revenue */}
              <motion.div
                className="stat-card"
                onClick={() => handleOpenOrders('all')}
                title="Click to view Orders & Revenue"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <div className="stat-card-top">
                  <div className="stat-icon-wrapper green">
                    <span className="stat-rupee-symbol">₹</span>
                  </div>
                  <div className="stat-card-meta">
                    <span className="stat-card-title">REVENUE</span>
                    <span className="stat-card-number">₹{stats.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card-bottom">
                  <div className="stat-trend-text positive">
                    ↗ +24% <span className="stat-trend-sub">vs last month</span>
                  </div>
                  <svg className="stat-sparkline" width="68" height="28" viewBox="0 0 68 28" fill="none">
                    <path d="M2 24 C 18 26, 26 14, 38 18 C 48 22, 56 6, 66 8" stroke="#86EFAC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              {/* Card 3: Customers */}
              <motion.div
                className="stat-card"
                onClick={() => handleTabClick('customers')}
                title="Click to view Customer Registry"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
              >
                <div className="stat-card-top">
                  <div className="stat-icon-wrapper purple">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <div className="stat-card-meta">
                    <span className="stat-card-title">CUSTOMERS</span>
                    <span className="stat-card-number">{stats.totalUsers}</span>
                  </div>
                </div>
                <div className="stat-card-bottom">
                  <div className="stat-trend-text positive">
                    ↗ +8% <span className="stat-trend-sub">new users</span>
                  </div>
                  <svg className="stat-sparkline" width="68" height="28" viewBox="0 0 68 28" fill="none">
                    <path d="M2 18 C 16 24, 24 12, 36 20 C 46 26, 56 10, 66 12" stroke="#C4B5FD" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              {/* Card 4: Pending */}
              <motion.div
                className="stat-card"
                onClick={() => handleOpenOrders('pending')}
                title="Click to view Pending Orders"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
              >
                <div className="stat-card-top">
                  <div className="stat-icon-wrapper amber">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className="stat-card-meta">
                    <span className="stat-card-title">PENDING</span>
                    <span className="stat-card-number">{stats.pendingOrders}</span>
                  </div>
                </div>
                <div className="stat-card-bottom">
                  <div className="stat-alert-badge warning">
                    <span className="alert-circle-icon">!</span>
                    <span>Action required</span>
                  </div>
                  <svg className="stat-sparkline" width="68" height="28" viewBox="0 0 68 28" fill="none">
                    <path d="M2 22 C 18 20, 26 24, 38 16 C 48 8, 56 20, 66 14" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Main Grid: Revenue Growth Chart (Left) + Top Performing Products (Right) */}
            <div className="dashboard-grid-main">
              <div className="grid-left">
                <div className="chart-card">
                  <div className="chart-header-row">
                    <div>
                      <h3 className="card-section-title">Revenue Growth</h3>
                      <p className="card-section-subtitle">Total revenue for the selected period</p>
                    </div>
                    <div className="chart-timeframe-badge">
                      <select
                        className="chart-header-select"
                        value={timeframe}
                        onChange={(e) => handleTimeframeChange(e.target.value)}
                      >
                        <option value="6months">Last 6 Months</option>
                        <option value="12months">Last Year</option>
                      </select>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  <div className="chart-summary-stat">
                    <span className="chart-summary-amount">
                      ₹{((stats.monthlyRevenue || []).reduce((acc, m) => acc + (m.revenue || 0), 0)).toLocaleString('en-IN')}
                    </span>
                    <span className="chart-summary-label">Selected Period Revenue</span>
                  </div>

                  {/* Clean Visual Bar Chart with Gridlines matching screenshot */}
                  {(() => {
                    const maxMonthlyRev = Math.max(...(stats.monthlyRevenue || []).map(m => m.revenue || 0), 1000)
                    const targetMax = maxMonthlyRev > 45000 ? 60000 : maxMonthlyRev > 25000 ? 40000 : maxMonthlyRev > 10000 ? 20000 : 10000
                    const yTicks = [
                      `₹${targetMax >= 1000 ? Math.round(targetMax / 1000) + 'k' : targetMax}`,
                      `₹${Math.round(targetMax * 0.666) >= 1000 ? Math.round(targetMax * 0.666 / 1000) + 'k' : Math.round(targetMax * 0.666)}`,
                      `₹${Math.round(targetMax * 0.333) >= 1000 ? Math.round(targetMax * 0.333 / 1000) + 'k' : Math.round(targetMax * 0.333)}`,
                      '₹0'
                    ]

                    return (
                      <div className="chart-visual-wrapper">
                        <div className="chart-y-axis-col">
                          {yTicks.map((tick, idx) => (
                            <span key={idx} className="chart-y-tick">{tick}</span>
                          ))}
                        </div>

                        <div className="chart-canvas-area">
                          <div className="chart-gridlines-bg">
                            <div className="chart-gridline-row"></div>
                            <div className="chart-gridline-row"></div>
                            <div className="chart-gridline-row"></div>
                            <div className="chart-gridline-row base"></div>
                          </div>

                          <div className="chart-columns-flex">
                            {stats.monthlyRevenue.map((m, i) => {
                              const rev = m.revenue || 0
                              const pct = targetMax > 0 ? (rev / targetMax) * 100 : 0
                              const barHeightPct = rev > 0 ? Math.min(100, Math.max(4, pct)) : 0
                              const monthLabel = (m.monthLabel || (m._id?.month ? `M${m._id.month}` : 'N/A')).toUpperCase()
                              const isMax = rev === maxMonthlyRev && rev > 0
                              const displayVal = rev > 0 ? (rev >= 1000 ? `₹${(rev / 1000).toFixed(rev >= 10000 ? 1 : 0)}k` : `₹${rev}`) : '₹0'

                              return (
                                <div key={i} className="chart-column-item">
                                  <div className="bar-tooltip">
                                    <span className="tooltip-amount">₹{rev.toLocaleString('en-IN')}</span>
                                    <span className="tooltip-date">{monthLabel} {m.year || ''}</span>
                                    {(m.count !== undefined && m.count > 0) && (
                                      <span className="tooltip-count">{m.count} order{m.count > 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                  <div className="chart-column-track">
                                    <span className="bar-top-amount-label">{displayVal}</span>
                                    <motion.div
                                      className={`revenue-bar-fill ${isMax ? 'highest' : ''} ${rev === 0 ? 'empty' : ''}`}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${barHeightPct}%` }}
                                      transition={{ duration: 0.6, delay: i * 0.05 }}
                                    ></motion.div>
                                  </div>
                                  <span className="bar-month-tag">{monthLabel}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  {stats.monthlyRevenue.length === 0 && (
                    <p className="no-data-msg">No revenue data available for this timeframe</p>
                  )}
                </div>

                <div className="recent-orders-card">
                  <div className="card-header-clean">
                    <h3 className="card-section-title">Latest Transactions</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('orders')}>View All</button>
                  </div>
                  <div className="simple-table-wrapper">
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.slice(0, 5).map(o => (
                          <tr
                            key={o._id}
                            className="clickable-order-row"
                            onClick={() => handleSelectOrderFromNotif(o._id)}
                            title={`Open Order #${o.orderNumber}`}
                          >
                            <td className="order-num-cell">#{o.orderNumber}</td>
                            <td>{o.customer?.name}</td>
                            <td><span className={`mini-badge ${o.status}`}>{o.status}</span></td>
                            <td className="amount-cell">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {stats.recentOrders.length === 0 && (
                      <p className="empty-transactions-placeholder">No transactions recorded yet</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid-right">
                <div className="top-products-card">
                  <div className="top-products-card-header">
                    <h3 className="card-section-title">Top Performing Products</h3>
                    <p className="card-section-subtitle">Best selling products in the selected period</p>
                  </div>
                  <div className="top-products-list">
                    {stats.topProducts.map((p, i) => (
                      <div
                        key={p._id || i}
                        className="top-product-item"
                        onClick={() => handleTabClick('products')}
                        title={`View ${p.name} in Products`}
                      >
                        <div
                          className={`product-rank-badge rank-${i + 1}`}
                          style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, borderRadius: 8 }}
                        >
                          {i + 1}
                        </div>
                        <div
                          className="product-image-container"
                          style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: 8, overflow: 'hidden' }}
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="product-thumb-image"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }}
                              onError={(e) => {
                                e.target.style.display = 'none'
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="product-thumb-placeholder"
                            style={{ display: p.image ? 'none' : 'flex' }}
                            title={p.name}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                          </div>
                        </div>
                        <div className="product-info-col">
                          <h4
                            className="product-name-heading"
                            style={{ fontFamily: "'Cormorant Garamond', 'Plus Jakarta Sans', serif", fontSize: '0.88rem', fontWeight: 700 }}
                            title={p.name}
                          >
                            {p.name}
                          </h4>
                          <span className="product-sales-count">{p.totalSold} Units Sold</span>
                        </div>
                        <div
                          className="product-revenue-amount"
                          style={{ fontSize: '0.95rem', fontWeight: 800 }}
                        >
                          ₹{(p.revenue || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                    {stats.topProducts.length === 0 && <p className="empty-state">No sales data yet</p>}
                  </div>
                </div>

                <div className="quick-actions-card">
                  <div className="card-header-clean">
                    <h3 className="card-section-title">Quick Operations</h3>
                  </div>
                  <div className="actions-grid">
                    <button className="action-tile" onClick={() => handleTabClick('products')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                      <span>New Product</span>
                    </button>
                    <button className="action-tile" onClick={() => handleTabClick('inventory')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></div>
                      <span>Update Stock</span>
                    </button>
                    <button className="action-tile" onClick={() => handleTabClick('categories')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div>
                      <span>Categories</span>
                    </button>
                    <button className="action-tile" onClick={() => handleTabClick('reels')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></div>
                      <span>Catalog Reels</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {visitedTabs.has('products') && (
          <div style={{ display: activeTab === 'products' ? 'block' : 'none' }}>
            <ProductsManager
              onPromoteToHero={(product) => {
                setSelectedProductForHero(product)
                handleTabClick('hero')
              }}
            />
          </div>
        )}

        {visitedTabs.has('orders') && (
          <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
            <OrdersManager
              targetOrderId={targetOrderId}
              onClearTargetOrder={() => setTargetOrderId(null)}
              initialStatusFilter={ordersInitialFilter}
            />
          </div>
        )}

        {visitedTabs.has('inventory') && (
          <div style={{ display: activeTab === 'inventory' ? 'block' : 'none' }}>
            <InventoryManager />
          </div>
        )}

        {visitedTabs.has('customers') && (
          <div style={{ display: activeTab === 'customers' ? 'block' : 'none' }}>
            <CustomersManager />
          </div>
        )}

        {visitedTabs.has('activity') && (
          <div style={{ display: activeTab === 'activity' ? 'block' : 'none' }}>
            <ActivityManager />
          </div>
        )}

        {visitedTabs.has('categories') && (
          <div style={{ display: activeTab === 'categories' ? 'block' : 'none' }}>
            <CategoryManager />
          </div>
        )}

        {visitedTabs.has('brands') && (
          <div style={{ display: activeTab === 'brands' ? 'block' : 'none' }}>
            <BrandManager />
          </div>
        )}

        {visitedTabs.has('hero') && (
          <div style={{ display: activeTab === 'hero' ? 'block' : 'none' }}>
            <HeroCarouselManager
              preSelectedProduct={selectedProductForHero}
              onClearPreSelected={() => setSelectedProductForHero(null)}
            />
          </div>
        )}

        {visitedTabs.has('banner') && (
          <div style={{ display: activeTab === 'banner' ? 'block' : 'none' }}>
            <BannerManager />
          </div>
        )}

        {visitedTabs.has('magazine') && (
          <div style={{ display: activeTab === 'magazine' ? 'block' : 'none' }}>
            <MagazineManager />
          </div>
        )}

        {visitedTabs.has('reels') && (
          <div style={{ display: activeTab === 'reels' ? 'block' : 'none' }}>
            <ReelsManager />
          </div>
        )}

        {visitedTabs.has('coupons') && (
          <div style={{ display: activeTab === 'coupons' ? 'block' : 'none' }}>
            <CouponsManager />
          </div>
        )}

        {visitedTabs.has('notifications') && (
          <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
            <NotificationCenter onSelectOrder={handleSelectOrderFromNotif} />
          </div>
        )}
      </main>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-bottom-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabClick('overview')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Overview</span>
        </button>

        <button
          className={`mobile-bottom-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => handleTabClick('products')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          <span>Products</span>
        </button>

        <button
          className={`mobile-bottom-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleTabClick('orders')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <span>Orders</span>
        </button>

        <button
          className={`mobile-bottom-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => handleTabClick('inventory')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          <span>Inventory</span>
        </button>

        <button
          className={`mobile-bottom-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          <span>Menu</span>
        </button>
      </nav>
    </div>
  )
}

export default AdminDashboard
