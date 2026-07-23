import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './CustomersManager.css'

const CustomersManager = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.CUSTOMERS, { auth: true })
      if (data.success) {
        setCustomers(data.data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer)
    setIsHistoryModalOpen(true)
    setHistoryLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.ORDERS, { auth: true })
      if (data.success) {
        const filtered = (data.data || []).filter(order => 
          order.customer?.email?.toLowerCase().trim() === customer.email?.toLowerCase().trim()
        )
        setCustomerOrders(filtered)
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Compute stats for history drawer
  const validHistoryOrders = customerOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
  const historyTotalSpent = validHistoryOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
  const historyOrderCount = customerOrders.length

  if (loading) return <div className="loading">Loading Customers...</div>

  return (
    <div className="customers-manager">
      <div className="toolbar">
        <input 
          type="search" 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="customers-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Status</th>
              <th>Total Orders</th>
              <th>Total Spending</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer._id}>
                <td>
                  <div className="customer-cell">
                    <div className="avatar">{customer.name ? customer.name[0] : 'U'}</div>
                    <div className="details">
                      <span className="name">{customer.name}</span>
                      <span className="email">{customer.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                   <span className={`status-pill ${customer.isBlocked ? 'blocked' : 'active'}`}>
                     {customer.isBlocked ? 'Blocked' : 'Active'}
                   </span>
                </td>
                <td>{customer.orderCount || 0}</td>
                <td>₹{(customer.totalSpending || 0).toLocaleString('en-IN')}</td>
                <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="action-link" onClick={() => handleViewHistory(customer)}>View History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer History Drawer */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedCustomer && (
          <div className="modal-overlay" onClick={() => {
            setIsHistoryModalOpen(false)
            setSelectedCustomer(null)
            setCustomerOrders([])
          }}>
            <motion.div 
              className="customer-history-drawer"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <div className="header-profile">
                  <div className="avatar-large">{selectedCustomer.name ? selectedCustomer.name[0] : 'U'}</div>
                  <div className="profile-text">
                    <h2>{selectedCustomer.name}</h2>
                    <span className="email">{selectedCustomer.email}</span>
                  </div>
                </div>
                <button className="close-drawer" onClick={() => {
                  setIsHistoryModalOpen(false)
                  setSelectedCustomer(null)
                  setCustomerOrders([])
                }}>&times;</button>
              </div>

              <div className="drawer-stats">
                <div className="stat-box">
                  <span className="label">Total Spent</span>
                  <span className="value">₹{(customerOrders.length > 0 ? historyTotalSpent : (selectedCustomer.totalSpending || 0)).toLocaleString('en-IN')}</span>
                </div>
                <div className="stat-box">
                  <span className="label">Orders Placed</span>
                  <span className="value">{customerOrders.length > 0 ? historyOrderCount : (selectedCustomer.orderCount || 0)}</span>
                </div>
                <div className="stat-box">
                  <span className="label">Member Since</span>
                  <span className="value">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', {
                      month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="drawer-body">
                <h3>Order Log</h3>
                
                {historyLoading ? (
                  <div className="history-loading">
                    <div className="mini-spinner" />
                    <p>Retrieving transaction ledger...</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="empty-history">
                    <span className="icon">🛍️</span>
                    <h4>No purchases recorded</h4>
                    <p>This client hasn't completed any checkouts yet.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {customerOrders.map(order => (
                      <div key={order._id} className="history-order-card">
                        <div className="card-top">
                          <span className="order-num">#{order.orderNumber}</span>
                          <span className={`status-pill ${order.status}`}>{order.status}</span>
                        </div>
                        <div className="card-middle">
                          <span className="date">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                          <span className="amount">₹{order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="card-items">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="item-row">
                              <span className="item-name">{item.name}</span>
                              <span className="item-details">Size: {item.size || 'N/A'} • Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomersManager
