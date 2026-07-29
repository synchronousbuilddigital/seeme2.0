import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest, clearAdminSession } from '../utils/apiClient'
import './AdminDashboard.css'
import NewArrivalsManager from '../components/NewArrivalsManager'
import ProductsManager from '../components/ProductsManager'
import OrdersManager from '../components/OrdersManager'
import CategoryManager from '../components/CategoryManager'
import GlobalSearch from '../components/GlobalSearch'
import InventoryManager from '../components/InventoryManager'
import CustomersManager from '../components/CustomersManager'
import PaymentsManager from '../components/PaymentsManager'
import ActivityManager from '../components/ActivityManager'
import HeroCarouselManager from '../components/HeroCarouselManager'
import MagazineManager from '../components/MagazineManager'
import { isAdminSessionValid } from '../utils/apiClient'

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
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdminSessionValid()) {
      clearAdminSession()
      navigate('/login')
      return
    }

    // Initial fetch
    fetchStats(timeframe)

    // Real-time sync (polling every 30 seconds)
    const syncInterval = setInterval(() => {
      fetchStats(timeframe)
    }, 30000)

    return () => clearInterval(syncInterval)
  }, [navigate, timeframe])

  const fetchStats = async (tf = timeframe) => {
    try {
      const [healthData, summaryData, analyticsData] = await Promise.all([
        apiRequest(API_ENDPOINTS.HEALTH),
        apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD_SUMMARY, { auth: true }),
        apiRequest(`${API_ENDPOINTS.ADMIN.ANALYTICS}?timeframe=${tf}`, { auth: true })
      ])

      if (healthData.success) {
        setBackendStatus('online')
      }

      if (summaryData.success) {
        const s = summaryData.data
        const a = analyticsData.data || {}

        setStats({
          totalOrders: s.totalOrders || 0,
          totalProducts: s.totalProducts || 0,
          pendingOrders: (a.ordersByStatus || []).find(status => status._id === 'pending')?.count || 0,
          revenue: s.totalRevenue || 0,
          topProducts: a.topProducts || [],
          recentOrders: a.recentOrders || [],
          monthlyRevenue: a.monthlyRevenue || [],
          totalUsers: s.totalUsers || 0
        })
      }

      setLastSync(new Date())
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

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
    setVisitedTabs(prev => new Set(prev).add(tab))
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
          <button className={activeTab === 'hero' ? 'active' : ''} onClick={() => handleTabClick('hero')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Hero Section</span>
          </button>
          <button className={activeTab === 'magazine' ? 'active' : ''} onClick={() => handleTabClick('magazine')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span>Magazine Booklet</span>
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
            <div className="topbar-left">
              <h1 className="page-title">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'products' && 'Product Library'}
                {activeTab === 'orders' && 'Order Management'}
                {activeTab === 'inventory' && 'Inventory Control'}
                {activeTab === 'customers' && 'Customer Registry'}
                {activeTab === 'activity' && 'Real-time Activity'}
                {activeTab === 'categories' && 'Category Slides'}
                {activeTab === 'hero' && 'Hero Carousel'}
                {activeTab === 'magazine' && 'Magazine Booklet'}
              </h1>
            </div>

            <div className="topbar-actions">
              <GlobalSearch onResults={(selection) => {
                if (selection.type === 'product') setActiveTab('products')
                if (selection.type === 'order') setActiveTab('orders')
                if (selection.type === 'customer') setActiveTab('customers')
                // We could also set a filter or scroll to the item here
              }} />
              <div className="admin-profile">
                <div className="admin-info">
                  <p className="admin-name">Atelier Admin</p>
                  <p className="admin-role">Full Access</p>
                </div>
                <div className="admin-avatar">A</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search results are now handled by the GlobalSearch dropdown itself */}

        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <div className="overview-section">
            <div className="stats-grid">
              <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="stat-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Orders</span>
                  <span className="stat-value">{stats.totalOrders}</span>
                  <span className="stat-change positive">+12% vs last month</span>
                </div>
              </motion.div>

              <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="stat-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22m5-18H8.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Revenue</span>
                  <span className="stat-value">₹{stats.revenue.toLocaleString()}</span>
                  <span className="stat-change positive">+24% vs last month</span>
                </div>
              </motion.div>

              <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="stat-icon orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Customers</span>
                  <span className="stat-value">{stats.totalUsers}</span>
                  <span className="stat-change positive">+8% new users</span>
                </div>
              </motion.div>

              <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="stat-icon purple">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Pending</span>
                  <span className="stat-value">{stats.pendingOrders}</span>
                  <span className="stat-change warning">Action required</span>
                </div>
              </motion.div>
            </div>

            <div className="dashboard-grid-main">
              <div className="grid-left">
                <div className="chart-card">
                  <div className="card-header">
                    <div>
                      <h3>Revenue Growth</h3>
                      <div className="chart-sub-stat">
                        <span className="period-total">₹{((stats.monthlyRevenue || []).reduce((acc, m) => acc + (m.revenue || 0), 0)).toLocaleString('en-IN')}</span>
                        <span className="period-label">Selected Period Revenue</span>
                      </div>
                    </div>
                    <select 
                      className="minimal-select"
                      value={timeframe}
                      onChange={(e) => handleTimeframeChange(e.target.value)}
                    >
                      <option value="6months">Last 6 Months</option>
                      <option value="12months">Last Year</option>
                    </select>
                  </div>
                  <div className="chart-placeholder">
                    {/* Custom CSS Chart bars */}
                    <div className="chart-bars">
                      {(() => {
                        const maxMonthlyRev = Math.max(...(stats.monthlyRevenue || []).map(m => m.revenue || 0), 1)
                        return stats.monthlyRevenue.map((m, i) => {
                          const rev = m.revenue || 0
                          const pct = maxMonthlyRev > 0 ? (rev / maxMonthlyRev) * 100 : 0
                          const barHeightPct = rev > 0 ? Math.max(10, pct) : 4
                          const monthLabel = m.monthLabel || (m._id?.month ? `M${m._id.month}` : 'N/A')
                          const isMax = rev === maxMonthlyRev && rev > 0

                          return (
                            <div key={i} className="bar-wrapper">
                              <div className="bar-tooltip">
                                <span className="tooltip-amount">₹{rev.toLocaleString('en-IN')}</span>
                                <span className="tooltip-date">{monthLabel} {m.year || ''}</span>
                                {(m.count !== undefined && m.count > 0) && (
                                  <span className="tooltip-count">{m.count} order{m.count > 1 ? 's' : ''}</span>
                                )}
                              </div>
                              <div className="bar-container">
                                <span className="bar-top-value">
                                  {rev > 0 ? `₹${rev >= 1000 ? (rev / 1000).toFixed(1) + 'k' : rev}` : '₹0'}
                                </span>
                                <motion.div
                                  className={`bar ${isMax ? 'highest' : ''} ${rev === 0 ? 'empty' : ''}`}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${barHeightPct}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05 }}
                                ></motion.div>
                              </div>
                              <span className="bar-label">{monthLabel}</span>
                            </div>
                          )
                        })
                      })()}
                      {stats.monthlyRevenue.length === 0 && <p className="no-data-msg">No revenue data available for this timeframe</p>}
                    </div>
                  </div>
                </div>

                <div className="recent-orders-card">
                  <div className="card-header">
                    <h3>Latest Transactions</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('orders')}>View All</button>
                  </div>
                  {/* Desktop Table View */}
                  <div className="simple-table-wrapper desktop-only-table">
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
                          <tr key={o._id}>
                            <td>#{o.orderNumber}</td>
                            <td>{o.customer?.name}</td>
                            <td><span className={`mini-badge ${o.status}`}>{o.status}</span></td>
                            <td>₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Touch Transaction Card Feed */}
                  <div className="mobile-tx-feed">
                    {stats.recentOrders.slice(0, 5).map(o => (
                      <div key={o._id} className="mobile-tx-item" onClick={() => setActiveTab('orders')}>
                        <div className="mobile-tx-avatar">
                          {o.customer?.name ? o.customer.name.charAt(0).toUpperCase() : 'O'}
                        </div>
                        <div className="mobile-tx-info">
                          <div className="mobile-tx-header">
                            <span className="mobile-tx-number">#{o.orderNumber}</span>
                            <span className={`mini-badge ${o.status}`}>{o.status}</span>
                          </div>
                          <span className="mobile-tx-customer">{o.customer?.name || 'Customer'}</span>
                        </div>
                        <div className="mobile-tx-amount">
                          ₹{o.totalAmount?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                    {stats.recentOrders.length === 0 && <p className="empty-state">No transactions yet</p>}
                  </div>
                </div>
              </div>

              <div className="grid-right">
                <div className="top-products-card">
                  <h3>Top Performing Silhouettes</h3>
                  <div className="top-products-list">
                    {stats.topProducts.map((p, i) => (
                      <div key={i} className="top-product-item">
                        <div className="product-rank">{i + 1}</div>
                        <div className="product-info">
                          <h4>{p.name}</h4>
                          <p>{p.totalSold} Units Sold</p>
                        </div>
                        <div className="product-revenue">₹{p.revenue.toLocaleString()}</div>
                      </div>
                    ))}
                    {stats.topProducts.length === 0 && <p className="empty-state">No sales data yet</p>}
                  </div>
                </div>

                <div className="quick-actions-card">
                  <h3>Quick Operations</h3>
                  <div className="actions-grid">
                    <button className="action-tile" onClick={() => setActiveTab('products')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></div>
                      <span>New Product</span>
                    </button>
                    <button className="action-tile" onClick={() => setActiveTab('inventory')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></div>
                      <span>Update Stock</span>
                    </button>
                    <button className="action-tile" onClick={() => setActiveTab('categories')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div>
                      <span>Categories</span>
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
            <OrdersManager />
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

        {visitedTabs.has('hero') && (
          <div style={{ display: activeTab === 'hero' ? 'block' : 'none' }}>
            <HeroCarouselManager 
              preSelectedProduct={selectedProductForHero} 
              onClearPreSelected={() => setSelectedProductForHero(null)}
            />
          </div>
        )}

        {visitedTabs.has('magazine') && (
          <div style={{ display: activeTab === 'magazine' ? 'block' : 'none' }}>
            <MagazineManager />
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
