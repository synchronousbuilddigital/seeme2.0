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

  const [segmentFilter, setSegmentFilter] = useState('all')

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

  // Compute stats for history drawer
  const validHistoryOrders = customerOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
  const historyTotalSpent = validHistoryOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)
  const historyOrderCount = customerOrders.length

  // Find customer phone number from user model or order history
  const getCustomerPhone = (customer) => {
    if (customer.phone) return customer.phone
    const orderWithPhone = customerOrders.find(o => o.customer?.phone)
    return orderWithPhone?.customer?.phone || null
  }

  // Find customer address list (saved addresses or order delivery address)
  const getCustomerAddresses = (customer) => {
    if (Array.isArray(customer.addresses) && customer.addresses.length > 0) {
      return customer.addresses
    }
    const orderWithAddr = customerOrders.find(o => o.customer?.address)
    if (orderWithAddr?.customer?.address) {
      const addr = orderWithAddr.customer.address
      return [{
        street: addr.street || addr.addressLine1 || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || addr.zipCode || '',
        country: addr.country || 'India',
        isDefault: true
      }]
    }
    return []
  }

  // Calculate Customer Directory KPI Metrics
  const totalClientsCount = customers.length
  const vipClientsCount = customers.filter(c => (c.orderCount || 0) >= 2).length
  const totalLifetimeSpending = customers.reduce((sum, c) => sum + (Number(c.totalSpending) || 0), 0)
  const avgSpendingPerClient = totalClientsCount > 0 ? Math.round(totalLifetimeSpending / totalClientsCount) : 0

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase().trim()
    const matchesSearch = (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    )

    if (!matchesSearch) return false

    if (segmentFilter === 'vip') return (c.orderCount || 0) >= 2
    if (segmentFilter === 'active') return !c.isBlocked
    if (segmentFilter === 'blocked') return c.isBlocked
    return true
  })

  if (loading) return (
    <div className="customers-loading-screen">
      <div className="mini-spinner" />
      <p>Loading Atelier Client Directory...</p>
    </div>
  )

  return (
    <div className="customers-manager">


      {/* Executive KPI Grid */}
      <div className="customers-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL CLIENTS</span>
            <h3 className="kpi-value">{totalClientsCount}</h3>
            <span className="kpi-subtext">Registered accounts</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap crown">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">VIP SHOPPERS</span>
            <h3 className="kpi-value">{vipClientsCount}</h3>
            <span className="kpi-subtext">2+ orders placed</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">LIFETIME SPENDING</span>
            <h3 className="kpi-value">₹{totalLifetimeSpending.toLocaleString('en-IN')}</h3>
            <span className="kpi-subtext">Total client expenditure</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">AVG VALUE / CLIENT</span>
            <h3 className="kpi-value">₹{avgSpendingPerClient.toLocaleString('en-IN')}</h3>
            <span className="kpi-subtext">Average client LTV</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Search Bar */}
      <div className="customers-toolbar">
        <div className="search-box-container">
          <div className="search-box-inner">
            <div className="search-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="search" 
              className="executive-search-input"
              placeholder="Search client by name, email, phone number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm ? (
              <div className="search-active-meta">
                <span className="results-count-badge">Found {filteredCustomers.length} {filteredCustomers.length === 1 ? 'match' : 'matches'}</span>
                <button className="clear-search-btn" onClick={() => setSearchTerm('')} title="Clear Search">✕</button>
              </div>
            ) : (
              <span className="search-shortcut-hint">⌘K Quick Search</span>
            )}
          </div>
        </div>

        <div className="segment-filters-row">
          <button 
            className={`filter-tab ${segmentFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSegmentFilter('all')}
          >
            <span>ALL CLIENTS</span>
            <span className="count">{customers.length}</span>
          </button>
          <button 
            className={`filter-tab ${segmentFilter === 'vip' ? 'active' : ''}`}
            onClick={() => setSegmentFilter('vip')}
          >
            <span>✦ VIP SHOPPERS</span>
            <span className="count">{vipClientsCount}</span>
          </button>
          <button 
            className={`filter-tab ${segmentFilter === 'active' ? 'active' : ''}`}
            onClick={() => setSegmentFilter('active')}
          >
            <span>ACTIVE</span>
            <span className="count">{customers.filter(c => !c.isBlocked).length}</span>
          </button>
          <button 
            className={`filter-tab ${segmentFilter === 'blocked' ? 'active' : ''}`}
            onClick={() => setSegmentFilter('blocked')}
          >
            <span>BLOCKED</span>
            <span className="count">{customers.filter(c => c.isBlocked).length}</span>
          </button>
        </div>
      </div>

      <div className="customers-table-container premium-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Profile</th>
              <th>Phone Number</th>
              <th>Status</th>
              <th>Orders</th>
              <th>Lifetime Spend</th>
              <th>Member Since</th>
              <th style={{ textAlign: 'right', paddingRight: '2.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: '#777' }}>
                  <div className="empty-search-state">
                    <span className="empty-search-icon">🔍</span>
                    <h3>No matching clients found</h3>
                    <p>Try searching with a different name, email or phone number</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => (
                <tr key={customer._id}>
                  <td>
                    <div className="customer-cell">
                      <div className="avatar">
                        {customer.name ? customer.name[0].toUpperCase() : 'U'}
                      </div>
                      <div className="details">
                        <div className="name-row">
                          <span className="name">{customer.name || 'Anonymous User'}</span>
                          {(customer.orderCount || 0) >= 2 && (
                            <span className="vip-pill-tag">✦ VIP</span>
                          )}
                        </div>
                        <span className="email">{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="phone-text">
                      {customer.phone ? (
                        <>📞 {customer.phone}</>
                      ) : (
                        <span style={{ color: '#a8a29e', fontStyle: 'italic' }}>Not Provided</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${customer.isBlocked ? 'blocked' : 'active'}`}>
                      <span className="status-dot" />
                      {customer.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <span className="orders-count-badge">
                      {customer.orderCount || 0} {customer.orderCount === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td>
                    <span className="total-spending-text">
                      ₹{(customer.totalSpending || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    <span className="joined-date-text">
                      {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                    <button className="view-profile-btn luxury-btn" onClick={() => handleViewHistory(customer)}>
                      <div className="btn-icon-wrap">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                      <span>View Profile & History</span>
                      <svg className="btn-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer History & Profile Drawer */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedCustomer && (
          <div className="modal-overlay" onClick={() => {
            setIsHistoryModalOpen(false)
            setSelectedCustomer(null)
            setCustomerOrders([])
          }}>
            <motion.div 
              className="customer-history-drawer"
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 120 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header-luxury">
                <div className="header-profile">
                  <div className="avatar-large">
                    {selectedCustomer.name ? selectedCustomer.name[0].toUpperCase() : 'U'}
                    {(selectedCustomer.orderCount || 0) >= 2 && (
                      <span className="crown-badge" title="VIP Shopper">✦</span>
                    )}
                  </div>
                  <div className="profile-text">
                    <div className="profile-name-badge">
                      <h2>{selectedCustomer.name || 'Customer Profile'}</h2>
                      {(selectedCustomer.orderCount || 0) >= 2 && (
                        <span className="vip-tag-gold">✦ VIP CLIENT</span>
                      )}
                    </div>
                    <span className="email">{selectedCustomer.email}</span>
                  </div>
                </div>
                <button className="close-drawer" onClick={() => {
                  setIsHistoryModalOpen(false)
                  setSelectedCustomer(null)
                  setCustomerOrders([])
                }}>&times;</button>
              </div>

              {/* Key Metrics Dashboard Bar */}
              <div className="drawer-stats">
                <div className="stat-box">
                  <span className="label">LIFETIME SPENT</span>
                  <span className="value">₹{(customerOrders.length > 0 ? historyTotalSpent : (selectedCustomer.totalSpending || 0)).toLocaleString('en-IN')}</span>
                </div>
                <div className="stat-box">
                  <span className="label">ORDERS PLACED</span>
                  <span className="value">{customerOrders.length > 0 ? historyOrderCount : (selectedCustomer.orderCount || 0)}</span>
                </div>
                <div className="stat-box">
                  <span className="label">MEMBER SINCE</span>
                  <span className="value">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', {
                      month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="drawer-body">
                {/* Customer Contact & Saved Address Card */}
                <div className="customer-info-card">
                  <h4 className="info-card-title">✦ CLIENT CONTACT & DELIVERY PROFILE</h4>
                  
                  <div className="info-grid">
                    <div className="info-tile">
                      <span className="tile-label">Phone Number</span>
                      <span className="tile-val">
                        {getCustomerPhone(selectedCustomer) ? (
                          <a href={`tel:${getCustomerPhone(selectedCustomer)}`} className="contact-link">
                            📞 {getCustomerPhone(selectedCustomer)}
                          </a>
                        ) : 'Not Provided'}
                      </span>
                    </div>

                    <div className="info-tile">
                      <span className="tile-label">Email Address</span>
                      <span className="tile-val">
                        <a href={`mailto:${selectedCustomer.email}`} className="contact-link">
                          ✉️ {selectedCustomer.email}
                        </a>
                      </span>
                    </div>
                  </div>

                  <div className="address-section">
                    <span className="info-label">📍 SAVED SHIPPING ADDRESSES</span>
                    {getCustomerAddresses(selectedCustomer).length === 0 ? (
                      <p className="no-addr-text">No delivery addresses recorded yet.</p>
                    ) : (
                      getCustomerAddresses(selectedCustomer).map((addr, idx) => (
                        <div key={idx} className="customer-addr-box">
                          {addr.isDefault && <span className="default-tag">Default Address</span>}
                          <p className="street-line">{addr.street || addr.addressLine1}</p>
                          <p className="city-line">{[addr.city, addr.state, addr.pincode || addr.zipCode].filter(Boolean).join(', ')}</p>
                          <p className="country-line">{addr.country || 'India'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Purchase Ledger Section */}
                <div className="history-section-header">
                  <h3>✦ TRANSACTION & PURCHASE HISTORY</h3>
                  <span className="order-count-chip">{customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'}</span>
                </div>
                
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
                          <div className="order-num-group">
                            <span className="order-num">#{order.orderNumber}</span>
                            <span className="date">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </span>
                          </div>
                          <span className={`status-pill ${order.status}`}>{order.status}</span>
                        </div>

                        <div className="card-middle">
                          <span className="items-count-label">Items ({order.items?.length || 0})</span>
                          <span className="amount">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="card-items">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="item-row">
                              <span className="item-name">{item.name}</span>
                              <span className="item-details">Size: {item.size || 'N/A'} • Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {order.customer?.address && (
                          <div className="order-shipping-addr">
                            <span>Ship To: </span>
                            {[order.customer.address.street, order.customer.address.city, order.customer.address.state, order.customer.address.pincode].filter(Boolean).join(', ')}
                          </div>
                        )}
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
