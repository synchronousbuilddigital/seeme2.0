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

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter)

  const getActivityColor = (type) => {
    switch(type) {
      case 'order': return '#4f46e5';
      case 'inventory': return '#ef4444';
      default: return '#94a3b8';
    }
  }

  return (
    <div className="activity-manager">
      <div className="manager-header">
        <div>
          <h1>Activity Log</h1>
          <p>Real-time updates and notifications</p>
        </div>
      </div>

      <div className="activity-toolbar">
        <div className="feed-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All Updates</button>
          <button className={filter === 'order' ? 'active' : ''} onClick={() => setFilter('order')}>Orders</button>
          <button className={filter === 'inventory' ? 'active' : ''} onClick={() => setFilter('inventory')}>Inventory</button>
        </div>
      </div>

      <div className="activity-container">
        {loading && activities.length === 0 ? (
          <div className="feed-loader">
            <div className="pulse-loader"></div>
            <span>Listening for store signals...</span>
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
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="activity-marker">
                    <div className="marker-dot" style={{ backgroundColor: getActivityColor(act.type) }} />
                    <div className="marker-line" />
                  </div>
                  <div className="activity-content">
                    <div className="content-header">
                      <div className="type-badge">
                        <span className="dot-indicator" style={{ backgroundColor: getActivityColor(act.type) }}></span>
                        {act.type}
                      </div>
                      <span className="timestamp">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="full-date"> • {new Date(act.timestamp).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <h3>{act.title}</h3>
                    <p>{act.text}</p>
                    {act.status && (
                      <div className="activity-meta">
                        <span className={`status-tag ${act.status}`}>{act.status}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredActivities.length === 0 && !loading && (
              <div className="empty-feed">
                <p>No activity recorded in this category yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityManager
