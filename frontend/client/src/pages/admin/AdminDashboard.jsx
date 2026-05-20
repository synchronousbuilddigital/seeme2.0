import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './AdminDashboard.css'
import { API_ENDPOINTS } from '../../config/api'
import NewArrivalsManager from './components/NewArrivalsManager'
import ProductsManager from './components/ProductsManager'
import OrdersManager from './components/OrdersManager'
import CollectionManager from './components/CollectionManager'
import MagazineManager from './components/MagazineManager'
import CarouselManager from './components/CarouselManager'
import SiteSettingsManager from './components/SiteSettingsManager'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    revenue: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    console.log('Admin token:', token ? 'exists' : 'missing')
    if (!token) {
      console.log('No token, redirecting to login')
      navigate('/admin/login')
      return
    }
    console.log('Token found, fetching stats')
    fetchStats()
  }, [navigate])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      
      // Fetch orders
      const ordersRes = await fetch(API_ENDPOINTS.ORDERS, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const ordersData = await ordersRes.json()
      
      // Fetch products
      const productsRes = await fetch(API_ENDPOINTS.PRODUCTS)
      const productsData = await productsRes.json()

      if (ordersData.success && productsData.success) {
        const orders = ordersData.data
        setStats({
          totalOrders: orders.length,
          totalProducts: productsData.data.length,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0)
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/admin/login')
  }

  return (
    <div className="admin-dashboard">
      {/* Mobile Top Header Bar */}
      <header className="mobile-header-bar">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open Navigation Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="mobile-logo-container" onClick={() => handleTabClick('overview')}>
          <h2 className="mobile-title">See Mee</h2>
        </div>
        <div className="mobile-avatar" onClick={() => handleTabClick('overview')}>A</div>
      </header>

      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header" onClick={() => handleTabClick('overview')} style={{ cursor: 'pointer' }}>
          <h2>See Mee</h2>
          <span>Admin Panel</span>
        </div>

        {/* Mobile Close Button inside Sidebar */}
        <button 
          className="mobile-close-btn"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close Navigation Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => handleTabClick('overview')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Overview
          </button>

          <button 
            className={activeTab === 'new-arrivals' ? 'active' : ''}
            onClick={() => handleTabClick('new-arrivals')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            New Arrivals
          </button>

          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => handleTabClick('products')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Products
          </button>

          <button 
            className={activeTab === 'collection' ? 'active' : ''}
            onClick={() => handleTabClick('collection')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Collection
          </button>

          <button 
            className={activeTab === 'magazine' ? 'active' : ''}
            onClick={() => handleTabClick('magazine')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Magazine
          </button>

          <button 
            className={activeTab === 'carousel' ? 'active' : ''}
            onClick={() => handleTabClick('carousel')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
            Hero Carousel
          </button>

          <button 
            className={activeTab === 'site-settings' ? 'active' : ''}
            onClick={() => handleTabClick('site-settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m-9-9h6m6 0h6"/>
            </svg>
            Site Settings
          </button>

          <button 
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => handleTabClick('orders')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Orders
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </aside>

      <main className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h1>Dashboard Overview</h1>
            <div className="stats-grid">
              <motion.div 
                className="stat-card"
                whileHover={{ y: -5 }}
              >
                <div className="stat-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">{stats.totalOrders}</span>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card"
                whileHover={{ y: -5 }}
              >
                <div className="stat-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Products</span>
                  <span className="stat-value">{stats.totalProducts}</span>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card"
                whileHover={{ y: -5 }}
              >
                <div className="stat-icon orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Pending Orders</span>
                  <span className="stat-value">{stats.pendingOrders}</span>
                </div>
              </motion.div>

              <motion.div 
                className="stat-card"
                whileHover={{ y: -5 }}
              >
                <div className="stat-icon purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-value">₹{stats.revenue.toLocaleString()}</span>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'new-arrivals' && <NewArrivalsManager />}
        {activeTab === 'products' && <ProductsManager />}
        {activeTab === 'collection' && <CollectionManager />}
        {activeTab === 'magazine' && <MagazineManager />}
        {activeTab === 'carousel' && <CarouselManager />}
        {activeTab === 'site-settings' && <SiteSettingsManager />}
        {activeTab === 'orders' && <OrdersManager />}
      </main>
    </div>
  )
}

export default AdminDashboard
