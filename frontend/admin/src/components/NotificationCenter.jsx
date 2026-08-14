import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './NotificationCenter.css'

const timeAgo = (dateString) => {
  if (!dateString) return ''
  const past = new Date(dateString)
  const now = new Date()
  const diffInSec = Math.floor((now - past) / 1000)

  if (diffInSec < 60) return 'Just now'
  const diffInMin = Math.floor(diffInSec / 60)
  if (diffInMin < 60) return `${diffInMin}m ago`
  const diffInHours = Math.floor(diffInMin / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

const NotificationCenter = ({ onSelectOrder }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchNotifications()

    // Poll for notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const data = await apiRequest(API_ENDPOINTS.NOTIFICATIONS.BASE, { auth: true })
      if (data.success) {
        setNotifications(data.data || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error fetching notification center list:', err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleMarkAsRead = async (e, notif) => {
    if (e) e.stopPropagation()
    if (notif.isRead) return
    try {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      await apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notif._id), {
        method: 'PATCH',
        auth: true
      })
    } catch (err) {
      console.error('Error marking notification read:', err.message)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      await apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'PATCH',
        auth: true
      })
    } catch (err) {
      console.error('Error marking all as read:', err.message)
    }
  }

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      const targetNotif = notifications.find(n => n._id === id)
      setNotifications(prev => prev.filter(n => n._id !== id))
      if (targetNotif && !targetNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      await apiRequest(API_ENDPOINTS.NOTIFICATIONS.DELETE(id), {
        method: 'DELETE',
        auth: true
      })
    } catch (err) {
      console.error('Error deleting notification:', err.message)
      fetchNotifications(true)
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notification records? This action cannot be undone.')) return
    try {
      setNotifications([])
      setUnreadCount(0)
      await apiRequest(API_ENDPOINTS.NOTIFICATIONS.CLEAR_ALL, {
        method: 'DELETE',
        auth: true
      })
    } catch (err) {
      console.error('Error clearing notifications:', err.message)
      fetchNotifications(true)
    }
  }

  const handleCardClick = (notif) => {
    handleMarkAsRead(null, notif)
    const orderId = notif.order?._id || notif.order || notif.orderId
    if (orderId && onSelectOrder) {
      onSelectOrder(orderId)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false
    if (filter === 'orders' && n.type !== 'NEW_ORDER') return false
    if (filter === 'cancellations' && (n.type !== 'ORDER_CANCELLED' && n.type !== 'CANCELLED')) return false

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const titleMatch = (n.title || '').toLowerCase().includes(term)
      const msgMatch = (n.message || '').toLowerCase().includes(term)
      const orderMatch = (n.orderNumber || '').toLowerCase().includes(term)
      return titleMatch || msgMatch || orderMatch
    }

    return true
  })

  return (
    <div className="notification-center-container">
      {/* Luxury Hero Banner */}
      <div className="notif-hero-banner">
        <div className="hero-left">
          <div className="hero-pulse-badge">
            <span className="live-pulse-dot"></span>
            LIVE STREAM ACTIVE
          </div>
          <h2>Admin Notification Command Center</h2>
          <p>Real-time customer purchases, instant push dispatch logs, & order cancellation stream</p>
        </div>

        <div className="hero-right-stats">
          <div className="hero-stat-card total">
            <span className="hero-stat-num">{notifications.length}</span>
            <span className="hero-stat-label">Total Notifications</span>
          </div>
          <div className="hero-stat-card unread">
            <span className="hero-stat-num">{unreadCount}</span>
            <span className="hero-stat-label">Unread Alerts</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Search Bar */}
      <div className="notif-center-toolbar">
        <div className="toolbar-left-group">
          <div className="filter-tabs">
            <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              All ({notifications.length})
            </button>
            <button className={`filter-tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
              Unread ({unreadCount})
            </button>
            <button className={`filter-tab ${filter === 'orders' ? 'active' : ''}`} onClick={() => setFilter('orders')}>
              🛍️ Orders ({notifications.filter(n => n.type === 'NEW_ORDER').length})
            </button>
            <button className={`filter-tab ${filter === 'cancellations' ? 'active' : ''}`} onClick={() => setFilter('cancellations')}>
              ❌ Cancellations ({notifications.filter(n => n.type === 'ORDER_CANCELLED' || n.type === 'CANCELLED').length})
            </button>
          </div>

          <div className="notif-search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by Order # or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
        </div>

        <div className="toolbar-actions">
          {unreadCount > 0 && (
            <button type="button" className="btn-action mark-read" onClick={handleMarkAllRead}>
              ✓ Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button type="button" className="btn-action clear-all" onClick={handleClearAll}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Notification Cards Body */}
      <div className="notif-center-body">
        {loading && notifications.length === 0 ? (
          <div className="center-loading-state">
            <div className="loading-spinner"></div>
            <p>Loading notification history stream...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="center-empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No Notifications Found</h3>
            <p>{searchTerm ? `No alerts matched your search query "${searchTerm}".` : filter === 'all' ? 'No order alerts have been logged yet.' : `No notifications match the "${filter}" filter.`}</p>
          </div>
        ) : (
          <div className="notif-card-grid">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map(n => {
                const isCancelled = n.type === 'ORDER_CANCELLED' || n.type === 'CANCELLED'
                const isOrder = n.type === 'NEW_ORDER'

                return (
                  <motion.div
                    key={n._id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, x: -30 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`notif-card ${!n.isRead ? 'unread' : 'read'} ${isCancelled ? 'type-cancel' : isOrder ? 'type-order' : ''}`}
                    onClick={() => handleCardClick(n)}
                  >
                    <div className="card-top-row">
                      <div className="card-type-header">
                        <span className={`type-badge-icon ${isCancelled ? 'cancel' : isOrder ? 'order' : ''}`}>
                          {isCancelled ? '❌' : isOrder ? '🛍️' : '🔔'}
                        </span>
                        <div>
                          <h4 className="card-type-title">{n.title}</h4>
                          <span className="card-category-label">
                            {isCancelled ? 'Order Cancellation' : isOrder ? 'New Customer Order' : 'System Notice'}
                          </span>
                        </div>
                      </div>

                      <div className="card-top-right">
                        <span className="card-timestamp">{timeAgo(n.createdAt)}</span>
                        {/* Cross Button to Delete Notification */}
                        <button
                          type="button"
                          className="btn-delete-notif"
                          onClick={(e) => handleDeleteNotification(e, n._id)}
                          title="Delete notification"
                          aria-label="Delete notification"
                          disabled={deletingId === n._id}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <p className="card-message">{n.message}</p>

                    <div className="card-bottom-row">
                      <div className="card-meta-tags">
                        {n.orderNumber && (
                          <span className="meta-order-number">#{n.orderNumber}</span>
                        )}
                        {n.totalAmount && (
                          <span className="meta-order-amount">₹{n.totalAmount.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      <div className="card-action-trigger">
                        {!n.isRead && (
                          <button
                            type="button"
                            className="btn-mark-single-read"
                            onClick={(e) => handleMarkAsRead(e, n)}
                            title="Mark as Read"
                          >
                            ✓ Mark Read
                          </button>
                        )}
                        <button type="button" className="btn-view-order">
                          View Order Details →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationCenter
