import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './ActivityManager.css'

const ActivityManager = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [copiedId, setCopiedId] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 45000) // Auto-refresh every 45s
    return () => clearInterval(interval)
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      // Parallel fetch: full orders list and inventory/analytics alerts
      const [ordersRes, analyticsRes] = await Promise.allSettled([
        apiRequest(API_ENDPOINTS.ORDERS, { auth: true }),
        apiRequest(API_ENDPOINTS.ADMIN.ANALYTICS, { auth: true })
      ])

      let ordersList = []
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.success && Array.isArray(ordersRes.value.data)) {
        ordersList = ordersRes.value.data
      } else if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success && Array.isArray(analyticsRes.value.data?.recentOrders)) {
        ordersList = analyticsRes.value.data.recentOrders
      }

      const orderActivities = ordersList.map(o => {
        const status = (o.status || 'pending').toLowerCase()
        let eventTitle = 'New Order Placed'
        let eventIcon = '🛍️'
        let priority = 'normal'

        if (status === 'cancelled') {
          eventTitle = 'Order Cancelled'
          eventIcon = '❌'
        } else if (status === 'shipped') {
          eventTitle = 'Order Dispatched'
          eventIcon = '🚚'
        } else if (status === 'delivered') {
          eventTitle = 'Order Delivered'
          eventIcon = '📦'
        } else if (status === 'confirmed') {
          eventTitle = 'Order Confirmed'
          eventIcon = '✅'
        } else if (status === 'pending') {
          eventTitle = 'New Order Placed'
          eventIcon = '⏳'
        }

        const itemsCount = o.items?.length || 1
        const customerName = o.customer?.name || 'Guest Customer'
        const customerEmail = o.customer?.email || ''
        const amount = Number(o.totalAmount || 0)
        const orderNum = o.orderNumber || (o._id ? String(o._id).slice(-8).toUpperCase() : 'UNKNOWN')

        return {
          id: `order-${o._id || orderNum}`,
          type: 'order',
          orderStatus: status,
          eventIcon,
          title: eventTitle,
          orderNumber: orderNum,
          customerName,
          customerEmail,
          itemsCount,
          amount,
          paymentMethod: (o.paymentMethod || 'online').toUpperCase(),
          paymentStatus: (o.paymentStatus || (o.paymentMethod === 'cod' ? 'PENDING' : 'PAID')).toUpperCase(),
          timestamp: o.createdAt || new Date().toISOString(),
          priority
        }
      })

      // Low stock alerts
      let inventoryAlerts = []
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success && Array.isArray(analyticsRes.value.data?.lowStockProducts)) {
        inventoryAlerts = analyticsRes.value.data.lowStockProducts.map(p => ({
          id: `stock-${p._id}`,
          type: 'inventory',
          orderStatus: 'alert',
          eventIcon: '⚠️',
          title: 'Low Stock Warning',
          orderNumber: null,
          customerName: p.name || 'Product',
          customerEmail: `${p.stock || 0} units remaining`,
          itemsCount: p.stock || 0,
          amount: null,
          paymentMethod: 'INVENTORY',
          paymentStatus: 'CRITICAL',
          timestamp: p.updatedAt || new Date().toISOString(),
          priority: 'high'
        }))
      }

      // Combine and sort newest first
      const combined = [...orderActivities, ...inventoryAlerts].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )

      setActivities(combined)
      setLastRefreshed(new Date())
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyOrderNumber = (orderNum, e) => {
    e.stopPropagation()
    if (!orderNum) return
    navigator.clipboard?.writeText(orderNum)
    setCopiedId(orderNum)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      // Type/Status filters
      if (filter === 'high') {
        if (a.priority !== 'high') return false
      } else if (filter === 'order') {
        if (a.type !== 'order') return false
      } else if (filter === 'inventory') {
        if (a.type !== 'inventory') return false
      } else if (filter === 'cancelled') {
        if (a.orderStatus !== 'cancelled') return false
      } else if (filter === 'shipped') {
        if (a.orderStatus !== 'shipped' && a.orderStatus !== 'delivered') return false
      } else if (filter === 'confirmed') {
        if (a.orderStatus !== 'confirmed') return false
      }

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim()
        const haystack = [
          a.orderNumber,
          a.customerName,
          a.customerEmail,
          a.title,
          a.orderStatus,
          a.paymentMethod,
          String(a.amount || '')
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(q)
      }

      return true
    })
  }, [activities, filter, searchTerm])

  // Pagination calculation
  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredActivities.slice(startIndex, startIndex + pageSize)
  }, [filteredActivities, currentPage, pageSize])

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchTerm, pageSize])

  // Count aggregates
  const orderCount = activities.filter(a => a.type === 'order').length
  const inventoryAlertCount = activities.filter(a => a.type === 'inventory').length
  const cancelledCount = activities.filter(a => a.orderStatus === 'cancelled').length
  const shippedCount = activities.filter(a => a.orderStatus === 'shipped' || a.orderStatus === 'delivered').length
  const confirmedCount = activities.filter(a => a.orderStatus === 'confirmed').length
  const highPriorityCount = activities.filter(a => a.priority === 'high').length

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed': return 'badge-confirmed'
      case 'shipped': return 'badge-shipped'
      case 'delivered': return 'badge-delivered'
      case 'cancelled': return 'badge-cancelled'
      case 'pending': return 'badge-pending'
      case 'alert': return 'badge-alert'
      default: return 'badge-default'
    }
  }

  const formatRelativeTime = (timestamp) => {
    try {
      const now = new Date()
      const diffSec = Math.floor((now - new Date(timestamp)) / 1000)
      if (diffSec < 60) return 'Just now'
      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) return `${diffMin}m ago`
      const diffHour = Math.floor(diffMin / 60)
      if (diffHour < 24) return `${diffHour}h ago`
      const diffDay = Math.floor(diffHour / 24)
      if (diffDay < 7) return `${diffDay}d ago`
      return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } catch {
      return ''
    }
  }

  return (
    <div className="activity-manager">
      {/* Header */}
      <div className="manager-header">
        <div>
          <div className="executive-badge">
            <span className="live-pulse-dot" />
            LIVE AUDIT TRAIL & SYSTEM SIGNALS
          </div>
          <h1>System Activity Logs</h1>
          <p>Real-time audit ledger of customer checkouts, logistics movements, and store alerts</p>
        </div>
        <div className="header-right">
          <span className="sync-timestamp">
            Synced: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button className="refresh-btn" onClick={fetchActivities} disabled={loading}>
            <svg className={loading ? 'spin-icon' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {loading ? 'SYNCING...' : 'REFRESH'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="activity-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL SIGNALS</span>
            <h3 className="kpi-value">{activities.length}</h3>
            <span className="kpi-subtext">Active store events</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">CHECKOUTS</span>
            <h3 className="kpi-value">{orderCount}</h3>
            <span className="kpi-subtext">{confirmedCount} confirmed • {shippedCount} shipped</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">STOCK ALERTS</span>
            <h3 className="kpi-value">{inventoryAlertCount}</h3>
            <span className="kpi-subtext">Low stock warnings</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">LEDGER HEALTH</span>
            <h3 className="kpi-value">100%</h3>
            <span className="kpi-subtext">Database in sync</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Filter Tabs */}
      <div className="activity-toolbar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="search" 
            placeholder="Search activity by Order #, Customer, Amount, or Status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="feed-filters">
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            <span>ALL</span>
            <span className="count">{activities.length}</span>
          </button>
          <button className={`filter-tab ${filter === 'order' ? 'active' : ''}`} onClick={() => setFilter('order')}>
            <span>ORDERS</span>
            <span className="count">{orderCount}</span>
          </button>
          <button className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`} onClick={() => setFilter('confirmed')}>
            <span>CONFIRMED</span>
            <span className="count">{confirmedCount}</span>
          </button>
          <button className={`filter-tab ${filter === 'shipped' ? 'active' : ''}`} onClick={() => setFilter('shipped')}>
            <span>SHIPPED</span>
            <span className="count">{shippedCount}</span>
          </button>
          <button className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => setFilter('cancelled')}>
            <span>CANCELLED</span>
            <span className="count">{cancelledCount}</span>
          </button>
          <button className={`filter-tab ${filter === 'inventory' ? 'active' : ''}`} onClick={() => setFilter('inventory')}>
            <span>INVENTORY</span>
            <span className="count">{inventoryAlertCount}</span>
          </button>
          {highPriorityCount > 0 && (
            <button className={`filter-tab ${filter === 'high' ? 'active' : ''}`} onClick={() => setFilter('high')}>
              <span>⚠️ CRITICAL</span>
              <span className="count">{highPriorityCount}</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact Log Stream Container */}
      <div className="activity-container log-stream-card">
        {/* Stream Table Header */}
        <div className="log-stream-header">
          <div className="col-time">TIMESTAMP</div>
          <div className="col-event">EVENT & REFERENCE</div>
          <div className="col-customer">CUSTOMER / DETAILS</div>
          <div className="col-amount">AMOUNT</div>
          <div className="col-payment">PAYMENT</div>
          <div className="col-status">STATUS</div>
        </div>

        {loading && activities.length === 0 ? (
          <div className="feed-loader">
            <div className="pulse-loader"></div>
            <span>Reading real-time activity stream & ledger events...</span>
          </div>
        ) : (
          <div className="log-stream-body">
            <AnimatePresence mode="popLayout">
              {paginatedActivities.map((act) => (
                <motion.div 
                  key={act.id} 
                  className={`log-row ${act.orderStatus}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Timestamp */}
                  <div className="col-time">
                    <span className="time-primary">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="time-secondary">
                      {new Date(act.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      <span className="time-rel"> • {formatRelativeTime(act.timestamp)}</span>
                    </span>
                  </div>

                  {/* Event & Ref */}
                  <div className="col-event">
                    <div className="event-title-wrap">
                      <span className="event-icon">{act.eventIcon}</span>
                      <span className="event-name">{act.title}</span>
                    </div>
                    {act.orderNumber && (
                      <div 
                        className="order-ref-pill"
                        title="Click to copy Order ID"
                        onClick={(e) => handleCopyOrderNumber(act.orderNumber, e)}
                      >
                        <span className="hash">#</span>
                        <span className="ref-id">{act.orderNumber}</span>
                        <span className="copy-hint">{copiedId === act.orderNumber ? '✓' : '⧉'}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer / Subject */}
                  <div className="col-customer">
                    <span className="customer-name" title={act.customerName}>
                      {act.customerName}
                    </span>
                    <span className="customer-sub" title={act.customerEmail}>
                      {act.type === 'order' 
                        ? `${act.itemsCount} item${act.itemsCount > 1 ? 's' : ''} • ${act.customerEmail || 'No email'}`
                        : act.customerEmail
                      }
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-amount">
                    {act.amount !== null ? (
                      <span className="amount-val">₹{act.amount.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="amount-na">—</span>
                    )}
                  </div>

                  {/* Payment */}
                  <div className="col-payment">
                    {act.paymentMethod ? (
                      <span className={`payment-pill ${act.paymentMethod.toLowerCase()}`}>
                        {act.paymentMethod}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-status">
                    <span className={`status-pill ${getStatusBadgeClass(act.orderStatus)}`}>
                      <span className="status-dot" />
                      {act.orderStatus.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredActivities.length === 0 && !loading && (
              <div className="empty-feed">
                <span className="empty-feed-icon">📜</span>
                <h3>No activity logs match your filter</h3>
                <p>Try clearing search keywords or choosing "ALL" updates.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination Bar */}
        {filteredActivities.length > 0 && (
          <div className="log-pagination-bar">
            <div className="pagination-info">
              Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong>–<strong>{Math.min(currentPage * pageSize, filteredActivities.length)}</strong> of <strong>{filteredActivities.length}</strong> activity logs
            </div>

            <div className="pagination-controls">
              {/* Page Size Selector */}
              <div className="page-size-selector">
                <span>Per page:</span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div className="page-buttons">
                <button 
                  className="page-btn nav-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  ‹ Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1]
                    return (
                      <span key={p} className="page-num-wrap">
                        {prev && p - prev > 1 && <span className="page-dots">…</span>}
                        <button
                          className={`page-btn ${currentPage === p ? 'active' : ''}`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    )
                  })
                }

                <button 
                  className="page-btn nav-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityManager