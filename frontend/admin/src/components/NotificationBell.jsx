import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './NotificationBell.css'

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

const NotificationBell = ({ onSelectOrder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
      console.error('Error fetching admin notifications:', err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notif._id), {
          method: 'PATCH',
          auth: true
        })
      }
    } catch (err) {
      console.error('Error marking notification as read:', err.message)
    } finally {
      setIsOpen(false)
      const orderTarget = notif.order?._id || notif.order || notif.orderId
      if (orderTarget && onSelectOrder) {
        onSelectOrder(orderTarget)
      }
    }
  }

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation()
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
    }
  }

  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      await apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'PATCH',
        auth: true
      })
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message)
    }
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className={`bell-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications(true)
        }}
        title="Admin Notifications"
        aria-label="Admin Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span className="bell-badge-count">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-dropdown-panel"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="notif-dropdown-header">
              <div className="notif-header-title">
                <h3>Notifications</h3>
                {unreadCount > 0 && <span className="notif-unread-pill">{unreadCount} new</span>}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="mark-all-read-btn"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="notif-dropdown-body">
              {loading && notifications.length === 0 ? (
                <div className="notif-loading-state">
                  <div className="notif-spinner"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty-state">
                  <div className="empty-bell-icon">🔔</div>
                  <p className="empty-title">No notifications yet</p>
                  <p className="empty-subtitle">New customer order alerts will appear here in real-time.</p>
                </div>
              ) : (
                <div className="notif-list scrollbar-custom">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notif-item ${!n.isRead ? 'unread' : 'read'}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="notif-item-icon">
                        {n.type === 'NEW_ORDER' ? '🛍️' : n.type === 'PAYMENT_RECEIVED' ? '💳' : n.type === 'ORDER_CANCELLED' ? '❌' : '🔔'}
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-top">
                          <span className="notif-item-title">{n.title}</span>
                          <div className="notif-item-right">
                            <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                            {/* Cross Button to Delete Notification */}
                            <button
                              type="button"
                              className="btn-dropdown-delete"
                              onClick={(e) => handleDeleteNotification(e, n._id)}
                              title="Delete notification"
                              aria-label="Delete notification"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="notif-item-msg">{n.message}</p>
                        {n.orderNumber && (
                          <div className="notif-item-footer">
                            <span className="order-tag">#{n.orderNumber}</span>
                            {n.totalAmount && (
                              <span className="amount-tag">₹{n.totalAmount.toLocaleString('en-IN')}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {!n.isRead && <span className="unread-dot" title="Unread"></span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell
