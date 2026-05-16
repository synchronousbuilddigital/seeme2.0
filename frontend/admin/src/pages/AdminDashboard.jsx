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
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdminSessionValid()) {
      clearAdminSession()
      navigate('/login')
      return
    }

    // Initial fetch
    fetchStats()

    // Real-time sync (polling every 30 seconds)
    const syncInterval = setInterval(() => {
      fetchStats()
    }, 30000)

    return () => clearInterval(syncInterval)
  }, [navigate])

  const fetchStats = async () => {
    try {
      const [healthData, summaryData, analyticsData] = await Promise.all([
        apiRequest(API_ENDPOINTS.HEALTH),
        apiRequest(API_ENDPOINTS.ADMIN.DASHBOARD_SUMMARY, { auth: true }),
        apiRequest(API_ENDPOINTS.ADMIN.ANALYTICS, { auth: true })
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

  const handleLogout = () => {
    clearAdminSession()
    navigate('/login')
  }

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header" onClick={() => setActiveTab('overview')} style={{ cursor: 'pointer' }}>
          <div className="logo-container">
            <img
              src="/images/logoSEEMEE1.png"
              alt="See Mee Logo"
              className="admin-logo"
            />
          </div>
          {!sidebarCollapsed && <span className="admin-brand-name">ADMIN PANEL</span>}
        </div>

        <button
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(prev => !prev)}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        <nav className="sidebar-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Overview</span>
          </button>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span>Products</span>
          </button>
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span>Orders</span>
          </button>
          <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <span>Inventory</span>
          </button>
          <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => setActiveTab('customers')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            <span>Customers</span>
          </button>
          <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span>Activity Log</span>
          </button>
          <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            <span>Categories</span>
          </button>
          <button className={activeTab === 'hero' ? 'active' : ''} onClick={() => setActiveTab('hero')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Hero Section</span>
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
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
              </h1>
              <div className="sync-indicator">
                <div className={`status-dot ${backendStatus}`}></div>
                <span>Last Synced: {lastSync.toLocaleTimeString()}</span>
              </div>
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

        {activeTab === 'overview' && (
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
                    <h3>Revenue Growth</h3>
                    <select className="minimal-select">
                      <option>Last 6 Months</option>
                      <option>Last Year</option>
                    </select>
                  </div>
                  <div className="chart-placeholder">
                    {/* Custom CSS Chart bars */}
                    <div className="chart-bars">
                      {stats.monthlyRevenue.map((m, i) => (
                        <div key={i} className="bar-wrapper">
                          <motion.div
                            className="bar"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.min(100, (m.revenue / (stats.revenue / 3)) * 100)}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                          ></motion.div>
                          <span>M{m._id.month}</span>
                        </div>
                      ))}
                      {stats.monthlyRevenue.length === 0 && <p>No revenue data yet</p>}
                    </div>
                  </div>
                </div>

                <div className="recent-orders-card">
                  <div className="card-header">
                    <h3>Latest Transactions</h3>
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
                          <tr key={o._id}>
                            <td>#{o.orderNumber}</td>
                            <td>{o.customer.name}</td>
                            <td><span className={`mini-badge ${o.status}`}>{o.status}</span></td>
                            <td>₹{o.totalAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                    <button className="action-tile" onClick={() => window.open('/api/health', '_blank')}>
                      <div className="tile-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
                      <span>API Health</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <ProductsManager 
            onPromoteToHero={(product) => {
              setSelectedProductForHero(product)
              setActiveTab('hero')
            }} 
          />
        )}
        {activeTab === 'orders' && <OrdersManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'customers' && <CustomersManager />}
        {activeTab === 'activity' && <ActivityManager />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'hero' && (
          <HeroCarouselManager 
            preSelectedProduct={selectedProductForHero} 
            onClearPreSelected={() => setSelectedProductForHero(null)}
          />
        )}
      </main>
    </div>
  )
}

export default AdminDashboard
