import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import { printOrderInvoice } from '../utils/invoiceHelper'
import './CustomersManager.css'

const CustomersManager = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [drawerTab, setDrawerTab] = useState('profile') // 'profile' | 'cart' | 'history'
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)

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
    setDrawerTab('profile')
    setIsHistoryModalOpen(true)
    setHistoryLoading(true)
    setSelectedOrderDetails(null)
    try {
      const data = await apiRequest(API_ENDPOINTS.ORDERS, { auth: true })
      if (data.success) {
        const custEmail = (customer.email || '').toLowerCase().trim()
        const custPhone = (customer.phone || '').trim().replace(/^\+91/, '').replace(/\s+/g, '')
        const custId = String(customer._id || customer.id || '')
        const filtered = (data.data || []).filter(order => {
          const ordEmail = (order.customer?.email || '').toLowerCase().trim()
          const ordPhone = (order.customer?.phone || '').trim().replace(/^\+91/, '').replace(/\s+/g, '')
          const ordUserId = String(order.user?._id || order.user || '')
          return (
            (custEmail && ordEmail === custEmail) ||
            (custPhone && ordPhone && (ordPhone === custPhone || ordPhone.endsWith(custPhone) || custPhone.endsWith(ordPhone))) ||
            (custId && ordUserId && ordUserId === custId)
          )
        })
        setCustomerOrders(filtered)
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Format Last Login relative/exact timestamp
  const formatLastLogin = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Never'

    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 2) return 'Just Now'
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12" />
              <path d="M6 8h12" />
              <path d="M6 13l8.5 8" />
              <path d="M6 13h3a4.5 4.5 0 0 0 0-9" />
            </svg>
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
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="customers-table-container premium-card desktop-only-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Profile</th>
              <th>Phone Number</th>
              <th>Orders</th>
              <th>Lifetime Spend</th>
              <th>Member Since</th>
              <th style={{ textAlign: 'right', paddingRight: '2.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '60px 20px', color: '#777' }}>
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

      {/* Mobile Customer Cards Feed */}
      <div className="mobile-customer-card-feed">
        {filteredCustomers.length === 0 ? (
          <div className="empty-search-state">
            <span className="empty-search-icon">🔍</span>
            <h3>No matching clients found</h3>
            <p>Try searching with a different name, email or phone number</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div 
              key={customer._id} 
              className="mobile-customer-card"
              onClick={() => handleViewHistory(customer)}
            >
              {/* Top Row: Avatar + Name + VIP Tag + Joined Date */}
              <div className="m-cust-card-top">
                <div className="m-cust-avatar-group">
                  <div className="m-cust-avatar">
                    {customer.name ? customer.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="m-cust-name-col">
                    <div className="m-cust-name-row">
                      <h4 className="m-cust-name">{customer.name || 'Anonymous User'}</h4>
                      {(customer.orderCount || 0) >= 2 && (
                        <span className="vip-pill-tag">✦ VIP</span>
                      )}
                    </div>
                    <span className="m-cust-email">{customer.email}</span>
                  </div>
                </div>
                <span className="m-cust-joined-date">
                  Since {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Middle Section: Phone Contact & Cart Indicator */}
              <div className="m-cust-contact-row">
                <div className="m-cust-contact-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span>{customer.phone || 'No phone provided'}</span>
                </div>
                {customer.cart && customer.cart.length > 0 && (
                  <span className="m-cust-cart-badge">
                    🛒 {customer.cart.length} {customer.cart.length === 1 ? 'item' : 'items'} in cart
                  </span>
                )}
              </div>

              {/* Stats Strip: Orders Count & Lifetime Spend */}
              <div className="m-cust-stats-strip">
                <div className="m-cust-stat-col">
                  <span className="m-cust-stat-label">ORDERS</span>
                  <span className="m-cust-stat-val">
                    📦 {customer.orderCount || 0} {customer.orderCount === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                <div className="m-cust-stat-divider"></div>
                <div className="m-cust-stat-col">
                  <span className="m-cust-stat-label">LIFETIME SPEND</span>
                  <span className="m-cust-stat-val spend-val">
                    ₹{(customer.totalSpending || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Footer: View Profile & History Button */}
              <div className="m-cust-card-footer">
                <button 
                  className="m-cust-view-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewHistory(customer)
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>View Profile & History</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          ))
        )}
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
              initial={{ opacity: 0, x: 180 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 180 }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Hero Bar */}
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
                    <span className="email">✉️ {selectedCustomer.email}</span>
                  </div>
                </div>
                <button className="close-drawer" onClick={() => {
                  setIsHistoryModalOpen(false)
                  setSelectedCustomer(null)
                  setCustomerOrders([])
                  setSelectedOrderDetails(null)
                }}>&times;</button>
              </div>

              {/* Executive 4-Metric Dashboard Grid */}
              <div className="drawer-stats-grid">
                <div className="stat-card">
                  <span className="label">LIFETIME SPEND</span>
                  <span className="value gold-text">₹{(customerOrders.length > 0 ? historyTotalSpent : (selectedCustomer.totalSpending || 0)).toLocaleString('en-IN')}</span>
                  <span className="sub-label">Total Completed</span>
                </div>
                <div
                  className="stat-card"
                  onClick={() => setDrawerTab('history')}
                  style={{ cursor: 'pointer' }}
                  title="Click to view full purchase history"
                >
                  <span className="label">ORDERS PLACED</span>
                  <span className="value">{customerOrders.length > 0 ? historyOrderCount : (selectedCustomer.orderCount || 0)}</span>
                  <span className="sub-label">View History →</span>
                </div>
                <div className="stat-card">
                  <span className="label">MEMBER SINCE</span>
                  <span className="value">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', {
                      month: 'short', year: 'numeric'
                    })}
                  </span>
                  <span className="sub-label">Joined Atelier</span>
                </div>
                <div className="stat-card">
                  <span className="label">LAST LOGGED IN</span>
                  <span className="value green-text">
                    <span className="pulse-dot"></span>
                    {formatLastLogin(selectedCustomer.lastLogin || selectedCustomer.updatedAt || selectedCustomer.createdAt)}
                  </span>
                  <span className="sub-label">Active Session</span>
                </div>
              </div>

              {/* Tab Navigation Row */}
              <div className="dossier-tab-row">
                <button 
                  className={`dossier-tab-btn ${drawerTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('profile')}
                >
                  👤 Client Profile & Addresses
                </button>
                <button 
                  className={`dossier-tab-btn ${drawerTab === 'cart' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('cart')}
                >
                  🛒 Active Cart ({Array.isArray(selectedCustomer.cart) ? selectedCustomer.cart.length : 0})
                </button>
                <button 
                  className={`dossier-tab-btn ${drawerTab === 'history' ? 'active' : ''}`}
                  onClick={() => setDrawerTab('history')}
                >
                  📜 Order History ({customerOrders.length})
                </button>
              </div>

              <div className="drawer-body">
                {drawerTab === 'profile' && (
                  <>
                    {/* Customer Contact & Saved Address Card */}
                    <div className="customer-info-card">
                      <h4 className="info-card-title">✦ CLIENT CONTACT & AUTHENTICATION PROFILE</h4>
                      
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

                        <div className="info-tile">
                          <span className="tile-label">Exact Last Login Timestamp</span>
                          <span className="tile-val" style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.82rem' }}>
                            {selectedCustomer.lastLogin ? (
                              new Date(selectedCustomer.lastLogin).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                              })
                            ) : (
                              new Date(selectedCustomer.updatedAt || selectedCustomer.createdAt).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
                              })
                            )}
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                {addr.name && <strong style={{ fontSize: '0.86rem', color: '#1c1917' }}>{addr.name}</strong>}
                                {addr.isDefault && <span className="default-tag">Default Address</span>}
                              </div>
                              <p className="street-line">{addr.street || addr.addressLine1}</p>
                              <p className="city-line">{[addr.city, addr.state, addr.pincode || addr.zipCode].filter(Boolean).join(', ')}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.78rem', color: '#78716c' }}>
                                <span className="country-line">{addr.country || 'India'}</span>
                                {addr.phone && <span style={{ fontWeight: '600', color: '#166534' }}>📞 +91 {addr.phone}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Recent Orders Preview in Profile View */}
                      {customerOrders.length > 0 && (
                        <div className="address-section" style={{ marginTop: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span className="info-label">🛍️ RECENT ORDERS ({customerOrders.length})</span>
                            <button
                              type="button"
                              onClick={() => setDrawerTab('history')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#8C6D23',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              View All History →
                            </button>
                          </div>
                          <div className="history-list" style={{ gap: '10px' }}>
                            {customerOrders.slice(0, 2).map(order => (
                              <div key={order._id} className="history-order-card" style={{ padding: '12px' }}>
                                <div className="card-top">
                                  <div className="order-num-group">
                                    <span className="order-num" style={{ fontSize: '0.94rem' }}>#{order.orderNumber}</span>
                                    <span className="date">
                                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                  </div>
                                  <span className={`status-pill ${order.status}`}>{order.status}</span>
                                </div>
                                <div className="card-items">
                                  {order.items?.slice(0, 2).map((item, idx) => {
                                    const itemImg = item.image || item.product?.images?.[0] || item.product?.image
                                    return (
                                      <div key={idx} className="item-row">
                                        <div className="item-thumb-box">
                                          {itemImg ? (
                                            <img
                                              src={getImageUrl(itemImg)}
                                              alt={item.name || 'Order Item'}
                                              className="item-thumb-img"
                                              onError={(e) => { e.target.style.display = 'none' }}
                                            />
                                          ) : (
                                            <div className="item-thumb-placeholder">🛍️</div>
                                          )}
                                        </div>
                                        <div className="item-info-col">
                                          <span className="item-name">{item.name}</span>
                                          <span className="item-details">Size: {item.size || 'N/A'} • Qty: {item.quantity}</span>
                                        </div>
                                        <div className="item-price-col">
                                          ₹{((item.price || item.product?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                <div className="card-bottom-actions">
                                  <span className="amount" style={{ fontSize: '0.94rem', fontWeight: 700 }}>
                                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                                  </span>
                                  <button
                                    type="button"
                                    className="view-order-details-btn"
                                    onClick={() => setSelectedOrderDetails(order)}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    <span>View Order</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {drawerTab === 'cart' && (
                  <div className="customer-info-card active-cart-section">
                    <div className="history-section-header" style={{ marginBottom: '12px' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🛒</span> CURRENT ACTIVE SHOPPING CART
                      </h3>
                      {Array.isArray(selectedCustomer.cart) && selectedCustomer.cart.length > 0 && (
                        <span className="order-count-chip" style={{ background: '#0F172A', color: '#D4AF37', border: '1px solid #D4AF37' }}>
                          {selectedCustomer.cart.reduce((total, item) => total + (Number(item.quantity) || 1), 0)} Items (₹{selectedCustomer.cart.reduce((sum, item) => sum + ((Number(item.product?.price) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0).toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>

                    {!Array.isArray(selectedCustomer.cart) || selectedCustomer.cart.length === 0 ? (
                      <div className="empty-history" style={{ padding: '30px 10px' }}>
                        <span className="icon">🛍️</span>
                        <h4>No active items in cart</h4>
                        <p>This client currently has an empty shopping bag.</p>
                      </div>
                    ) : (
                      <div className="active-cart-items-grid">
                        {selectedCustomer.cart.map((item, idx) => (
                          <div key={idx} className="cart-item-luxury-card">
                            <img 
                              src={getImageUrl((item.product || item).images?.[0] || (item.product || item).image)} 
                              alt={(item.product || item).name || 'Cart Item'} 
                              className="cart-item-thumb" 
                            />
                            <div className="cart-item-details">
                              <span className="cart-prod-title">{(item.product || item).name || 'Product Item'}</span>
                              <div className="cart-meta-tags">
                                {item.size && <span className="cart-chip-tag">Size: {item.size}</span>}
                                {item.color && <span className="cart-chip-tag">Color: {item.color}</span>}
                                <span className="cart-chip-tag qty">Qty: {Number(item.quantity) || 1}</span>
                              </div>
                              <div className="cart-price-line">
                                <span className="unit-price">
                                  ₹{(Number((item.product || item).price) || Number(item.price) || 0).toLocaleString('en-IN')} × {Number(item.quantity) || 1}
                                </span>
                                <span className="subtotal-price">
                                  ₹{((Number((item.product || item).price) || Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {drawerTab === 'history' && (
                  <>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="order-channel-tag" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '700' }}>
                                  {String(order.orderType || 'ONLINE').toUpperCase()}
                                </span>
                                <span className={`status-pill ${order.status}`}>{order.status}</span>
                              </div>
                            </div>

                            <div className="card-middle">
                              <span className="items-count-label">Items ({order.items?.length || 0})</span>
                              <span className="amount">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                            </div>

                            <div className="card-items">
                              {order.items?.map((item, idx) => {
                                const itemImg = item.image || item.product?.images?.[0] || item.product?.image
                                return (
                                  <div key={idx} className="item-row">
                                    <div className="item-thumb-box">
                                      {itemImg ? (
                                        <img
                                          src={getImageUrl(itemImg)}
                                          alt={item.name || 'Order Item'}
                                          className="item-thumb-img"
                                          onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                      ) : (
                                        <div className="item-thumb-placeholder">🛍️</div>
                                      )}
                                    </div>
                                    <div className="item-info-col">
                                      <span className="item-name">{item.name}</span>
                                      <span className="item-details">
                                        {item.size ? `Size: ${item.size}` : ''}
                                        {item.color ? ` • ${item.color}` : ''}
                                        {` • Qty: ${item.quantity}`}
                                      </span>
                                    </div>
                                    <div className="item-price-col">
                                      ₹{((item.price || item.product?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            <div className="card-bottom-actions">
                              {order.customer?.address ? (
                                <div className="order-shipping-addr">
                                  <span>Ship To: </span>
                                  {[order.customer.address.street, order.customer.address.city, order.customer.address.state, order.customer.address.pincode].filter(Boolean).join(', ')}
                                </div>
                              ) : <div />}
                              <button
                                type="button"
                                className="view-order-details-btn"
                                onClick={() => setSelectedOrderDetails(order)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span>View Order</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dedicated Customer Order Details Modal */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="modal-overlay customer-order-modal-overlay" onClick={() => setSelectedOrderDetails(null)}>
            <motion.div
              className="customer-order-details-modal"
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="order-modal-header">
                <div className="order-modal-title-group">
                  <div className="order-modal-tag-row">
                    <span className="order-modal-num">#{selectedOrderDetails.orderNumber}</span>
                    <span className={`status-pill ${selectedOrderDetails.status}`}>
                      {selectedOrderDetails.status}
                    </span>
                    <span className="order-channel-tag">
                      {String(selectedOrderDetails.orderType || 'ONLINE').toUpperCase()}
                    </span>
                  </div>
                  <span className="order-modal-date">
                    Order Date: {new Date(selectedOrderDetails.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  className="close-order-modal-btn"
                  onClick={() => setSelectedOrderDetails(null)}
                  title="Close Order Details"
                >
                  &times;
                </button>
              </div>

              <div className="order-modal-body">
                {/* Package Items Section */}
                <div className="order-modal-section">
                  <div className="section-head-line">
                    <h4 className="section-title">
                      <span>📦</span> ORDERED PRODUCTS & ITEMS ({selectedOrderDetails.items?.length || 0})
                    </h4>
                  </div>

                  <div className="order-modal-items-list">
                    {selectedOrderDetails.items?.map((item, idx) => {
                      const itemImg = item.image || item.product?.images?.[0] || item.product?.image
                      const unitPrice = item.price || item.product?.price || 0
                      const itemTotal = unitPrice * (item.quantity || 1)
                      return (
                        <div key={idx} className="order-modal-item-row">
                          <div className="order-item-img-container">
                            {itemImg ? (
                              <img
                                src={getImageUrl(itemImg)}
                                alt={item.name || 'Order Item'}
                                className="order-item-big-img"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="order-item-no-img">🛍️</div>
                            )}
                          </div>
                          <div className="order-item-details-container">
                            <h5 className="order-item-title">{item.name}</h5>
                            <div className="order-item-chips">
                              {item.size && <span className="chip">Size: {item.size}</span>}
                              {item.color && <span className="chip">Color: {item.color}</span>}
                              <span className="chip qty">Qty: {item.quantity}</span>
                              {(item.weightKg || item.product?.weightKg) && (
                                <span className="chip weight">{item.weightKg || item.product?.weightKg} kg</span>
                              )}
                            </div>
                            <div className="order-item-price-row">
                              <span className="unit-calc">
                                ₹{unitPrice.toLocaleString('en-IN')} × {item.quantity}
                              </span>
                              <span className="line-total">
                                ₹{itemTotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Grid for Delivery & Payment Details */}
                <div className="order-modal-info-grid">
                  {/* Shipping Address */}
                  <div className="order-modal-card">
                    <h5 className="card-heading">📍 SHIPPING & DELIVERY ADDRESS</h5>
                    <div className="card-content">
                      <strong className="client-recipient-name">
                        {selectedOrderDetails.customer?.name || selectedCustomer?.name || 'Client'}
                      </strong>
                      <p className="addr-street">
                        {selectedOrderDetails.customer?.address?.street || selectedOrderDetails.customer?.address?.addressLine1 || 'Street not specified'}
                      </p>
                      <p className="addr-city">
                        {[
                          selectedOrderDetails.customer?.address?.city,
                          selectedOrderDetails.customer?.address?.state,
                          selectedOrderDetails.customer?.address?.pincode
                        ].filter(Boolean).join(', ') || 'City/State not specified'}
                      </p>
                      <p className="addr-country">{selectedOrderDetails.customer?.address?.country || 'India'}</p>
                      <div className="addr-contact-row">
                        {(selectedOrderDetails.customer?.phone || selectedCustomer?.phone) && (
                          <span className="phone">📞 +91 {selectedOrderDetails.customer?.phone || selectedCustomer?.phone}</span>
                        )}
                        {(selectedOrderDetails.customer?.email || selectedCustomer?.email) && (
                          <span className="email">✉️ {selectedOrderDetails.customer?.email || selectedCustomer?.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment & Logistics Info */}
                  <div className="order-modal-card">
                    <h5 className="card-heading">💳 PAYMENT & LOGISTICS</h5>
                    <div className="card-content">
                      <div className="meta-line">
                        <span className="meta-label">Payment Mode:</span>
                        <span className="meta-val highlight">
                          {String(selectedOrderDetails.paymentMethod || '').toLowerCase() === 'cod'
                            ? 'Cash on Delivery (COD)'
                            : (selectedOrderDetails.paymentMethod || 'Online').toUpperCase()}
                        </span>
                      </div>
                      <div className="meta-line">
                        <span className="meta-label">Payment Status:</span>
                        <span className={`meta-val pay-status ${selectedOrderDetails.paymentStatus || 'pending'}`}>
                          {(selectedOrderDetails.paymentStatus || 'PENDING').toUpperCase()}
                        </span>
                      </div>
                      <div className="meta-line">
                        <span className="meta-label">Fulfillment Status:</span>
                        <span className="meta-val status-text">{selectedOrderDetails.status?.toUpperCase()}</span>
                      </div>
                      {selectedOrderDetails.shipping?.awbNumber && (
                        <div className="meta-line">
                          <span className="meta-label">AWB Tracking:</span>
                          <span className="meta-val">{selectedOrderDetails.shipping.awbNumber}</span>
                        </div>
                      )}
                      {selectedOrderDetails.shipping?.courierName && (
                        <div className="meta-line">
                          <span className="meta-label">Courier Partner:</span>
                          <span className="meta-val">{selectedOrderDetails.shipping.courierName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="order-modal-summary-box">
                  <div className="summary-row">
                    <span>Items Subtotal</span>
                    <span>₹{selectedOrderDetails.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping Charges</span>
                    <span className="free-text">FREE</span>
                  </div>
                  <div className="summary-row grand-total">
                    <span>Total Amount</span>
                    <span className="total-val">₹{selectedOrderDetails.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="order-modal-footer">
                <button
                  type="button"
                  className="print-invoice-btn"
                  onClick={() => printOrderInvoice(selectedOrderDetails)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  <span>Print Invoice</span>
                </button>
                <button
                  type="button"
                  className="close-action-btn"
                  onClick={() => setSelectedOrderDetails(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomersManager
