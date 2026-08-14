import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './ActivityManager.css'

const ActivityManager = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 60000) // Poll every minute
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.ANALYTICS, { auth: true })
      if (data.success) {
        // Construct a richer activity list
        const orderActivities = (data.data.recentOrders || []).map(o => ({
          id: `order-${o._id}`,
          type: 'order',
          title: 'New Order Placed',
          text: `Order #${o.orderNumber} for ₹${o.totalAmount.toLocaleString()} by ${o.customer.name}`,
          timestamp: o.createdAt,
          status: o.status
        }))

        const inventoryAlerts = (data.data.lowStockProducts || []).map(p => ({
          id: `stock-${p._id}`,
          type: 'inventory',
          title: 'Low Stock Alert',
          text: `${p.name} is running low (${p.stock} units left)`,
          timestamp: new Date().toISOString(), // Mock timestamp since alert is current
          priority: 'high'
        }))

        // Combined and sorted
        const combined = [...orderActivities, ...inventoryAlerts].sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        )
        setActivities(combined)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const [searchTerm, setSearchTerm] = useState('')

  const filteredActivities = activities.filter(a => {
    if (filter === 'high') {
      if (a.priority !== 'high') return false
    } else if (filter !== 'all' && a.type !== filter) {
      return false
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim()
      const haystack = [a.title, a.text, a.status, a.type].join(' ').toLowerCase()
      return haystack.includes(q)
    }

    return true
  })

  const getActivityColor = (type, priority) => {
    if (priority === 'high') return '#DC2626'
    switch(type) {
      case 'order': return '#D4AF37'
      case 'inventory': return '#F59E0B'
      default: return '#8C6D23'
    }
  }

  const orderCount = activities.filter(a => a.type === 'order').length
  const inventoryAlertCount = activities.filter(a => a.type === 'inventory').length
  const highPriorityCount = activities.filter(a => a.priority === 'high').length

  return (
    <div className="activity-manager">


      {/* Executive KPI Summary Cards */}
      <div className="activity-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL SIGNALS</span>
            <h3 className="kpi-value">{activities.length}</h3>
            <span className="kpi-subtext">Active session events</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">ORDER EVENTS</span>
            <h3 className="kpi-value">{orderCount}</h3>
            <span className="kpi-subtext">Checkouts & orders</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">STOCK ALERTS</span>
            <h3 className="kpi-value">{inventoryAlertCount}</h3>
            <span className="kpi-subtext">Low stock warnings</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">SYSTEM HEALTH</span>
            <h3 className="kpi-value">100%</h3>
            <span className="kpi-subtext">Ledger synched</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="activity-toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="search" 
            placeholder="Search activity events, order numbers, or alerts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="feed-filters">
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            <span>ALL UPDATES</span>
            <span className="count">{activities.length}</span>
          </button>
          <button className={`filter-tab ${filter === 'order' ? 'active' : ''}`} onClick={() => setFilter('order')}>
            <span>ORDERS</span>
            <span className="count">{orderCount}</span>
          </button>
          <button className={`filter-tab ${filter === 'inventory' ? 'active' : ''}`} onClick={() => setFilter('inventory')}>
            <span>INVENTORY</span>
            <span className="count">{inventoryAlertCount}</span>
          </button>
          <button className={`filter-tab ${filter === 'high' ? 'active' : ''}`} onClick={() => setFilter('high')}>
            <span>⚠️ HIGH PRIORITY</span>
            <span className="count">{highPriorityCount}</span>
          </button>
        </div>
      </div>

      <div className="activity-container premium-card">
        {loading && activities.length === 0 ? (
          <div className="feed-loader">
            <div className="pulse-loader"></div>
            <span>Listening for store signals & ledger updates...</span>
          </div>
        ) : (
          <div className="activity-timeline">
            <AnimatePresence mode="popLayout">
              {filteredActivities.map((act, index) => (
                <motion.div 
                  key={act.id} 
                  className={`activity-card ${act.priority || ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="activity-marker">
                    <div className="marker-dot" style={{ backgroundColor: getActivityColor(act.type, act.priority) }} />
                    <div className="marker-line" />
                  </div>
                  <div className="activity-content">
                    <div className="content-header">
                      <div className="type-badge-wrap">
                        <span className={`type-badge ${act.type}`}>
                          <span className="dot-indicator" style={{ backgroundColor: getActivityColor(act.type, act.priority) }}></span>
                          {act.type === 'order' ? '🛍️ ORDER EVENT' : '⚠️ STOCK ALERT'}
                        </span>
                        {act.priority === 'high' && (
                          <span className="high-priority-tag">CRITICAL</span>
                        )}
                      </div>
                      <span className="timestamp">
                        <strong>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        <span className="full-date"> • {new Date(act.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </span>
                    </div>
                    
                    <div className="event-body">
                      <h3>{act.title}</h3>
                      <p>{act.text}</p>
                    </div>

                    {act.status && (
                      <div className="activity-meta">
                        <span className={`status-tag ${act.status}`}>
                          <span className="status-dot" />
                          {act.status}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredActivities.length === 0 && !loading && (
              <div className="empty-feed">
                <span className="empty-feed-icon">📜</span>
                <h3>No activity signals recorded</h3>
                <p>No audit trail events match your current filter or search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityManager
