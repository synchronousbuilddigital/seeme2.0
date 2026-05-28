import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { API_ENDPOINTS } from '../config/api'
import './AccountPage.css'

const AccountPage = () => {
  const { user, logout, token, updateUser } = useAuth()
  const navigate = useNavigate()
  const { wishlist } = useCart()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }

    const fetchData = async () => {
      try {
        const [ordersRes, addressesRes] = await Promise.all([
          fetch(API_ENDPOINTS.ORDERS_MY, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(API_ENDPOINTS.USERS_ADDRESSES, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        const ordersData = await ordersRes.json()
        const addressesData = await addressesRes.json()

        if (ordersData.success) setOrders(ordersData.data)
        if (addressesData.success) setAddresses(addressesData.data)
      } catch (err) {
        console.error('Error fetching account data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()

    // Real-time sync: poll every 30 seconds for order status updates
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [user, navigate, token])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    try {
      const response = await fetch(API_ENDPOINTS.USERS_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      const data = await response.json()
      if (data.success) {
        updateUser(data.data)
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Update failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error occurred' })
    }
  }

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [newAddress, setNewAddress] = useState({
    street: '', city: '', state: '', pincode: '', isDefault: false
  })
  const [showAddressModal, setShowAddressModal] = useState(false)

  const handleAddAddress = async (e) => {
    e.preventDefault()
    // Basic client-side validation
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      setMessage({ type: 'error', text: 'Please fill all required address fields.' })
      return
    }

    try {
      const method = editingAddressId ? 'PUT' : 'POST'
      const url = editingAddressId ? `${API_ENDPOINTS.USERS_ADDRESSES}/${editingAddressId}` : API_ENDPOINTS.USERS_ADDRESSES
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      })
      const data = await response.json()
      if (data.success) {
        setAddresses(data.data)
        setShowAddressForm(false)
        setShowAddressModal(false)
        setEditingAddressId(null)
        setNewAddress({ street: '', city: '', state: '', pincode: '', isDefault: false })
        setMessage({ type: 'success', text: editingAddressId ? 'Address updated' : 'Address added' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save address' })
      }
    } catch (err) {
      console.error('Error saving address:', err)
      setMessage({ type: 'error', text: 'Failed to save address' })
    }
  }

  const handleEditAddress = (addr) => {
    setNewAddress({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault
    })
    setEditingAddressId(addr._id)
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (id) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS_ADDRESSES}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setAddresses(data.data)
      }
    } catch (err) {
      console.error('Error deleting address:', err)
    }
  }

  const [selectedOrder, setSelectedOrder] = useState(null)

  const handlePrint = (order) => {
    const orderCustomer = order.customer || {
      name: user.name,
      email: user.email,
      phone: profileData.phone || user.phone || 'N/A',
      address: order.deliveryAddress || primaryAddress || { street: 'N/A', city: 'N/A', state: 'N/A', pincode: 'N/A' }
    }
    
    const win = window.open('', '', 'height=800,width=950')
    win.document.write(`
      <html>
        <head>
          <title>SEE MEE - Order Receipt #${order.orderNumber || order._id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
            
            body {
              font-family: 'Outfit', sans-serif;
              padding: 50px;
              color: #111;
              background-color: #FFF;
              line-height: 1.6;
            }
            .invoice-wrapper {
              max-width: 850px;
              margin: 0 auto;
              border: 1.5px solid #F0F0F0;
              padding: 50px;
              position: relative;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.02);
            }
            .invoice-wrapper::before {
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0;
              height: 4px;
              background: linear-gradient(90deg, #D4AF37 0%, #F3E5AB 50%, #C49A27 100%);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1.5px solid #F0F0F0;
              padding-bottom: 30px;
              margin-bottom: 35px;
            }
            .brand-logo h1 {
              font-family: 'Playfair Display', serif;
              font-size: 2.2rem;
              font-weight: 700;
              letter-spacing: 0.1em;
              margin: 0;
              color: #000;
              text-transform: uppercase;
            }
            .brand-logo p {
              font-family: 'Outfit', sans-serif;
              font-size: 0.72rem;
              text-transform: uppercase;
              letter-spacing: 0.25em;
              margin: 6px 0 0 0;
              color: #C49A27;
              font-weight: 600;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-meta h2 {
              font-family: 'Playfair Display', serif;
              font-size: 1.6rem;
              font-weight: 400;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0 0 8px 0;
            }
            .invoice-meta p {
              font-size: 0.85rem;
              color: #666;
              margin: 3px 0;
            }
            .grid-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
              margin-bottom: 40px;
            }
            .detail-block h3 {
              font-size: 0.75rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #888;
              border-bottom: 1.5px solid #F0F0F0;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .detail-block p {
              font-size: 0.88rem;
              color: #333;
              margin: 4px 0;
              line-height: 1.5;
            }
            .detail-block strong {
              color: #000;
              font-size: 0.95rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 35px;
            }
            th {
              font-size: 0.75rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #888;
              background-color: #FAFAFA;
              padding: 14px 16px;
              text-align: left;
              border-bottom: 1.5px solid #EAEAEA;
            }
            td {
              padding: 18px 16px;
              font-size: 0.88rem;
              color: #444;
              border-bottom: 1px solid #F0F0F0;
            }
            .item-name {
              font-weight: 600;
              color: #000;
            }
            .item-spec {
              font-size: 0.78rem;
              color: #666;
              margin-top: 4px;
            }
            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 25px;
            }
            .totals-table {
              width: 320px;
              border: none;
              margin-bottom: 0;
            }
            .totals-table td {
              padding: 8px 16px;
              border: none;
            }
            .totals-table tr.grand-total td {
              font-family: 'Playfair Display', serif;
              font-size: 1.4rem;
              font-weight: 700;
              color: #C49A27;
              padding-top: 15px;
              border-top: 1.5px solid #111;
            }
            .footer {
              margin-top: 70px;
              text-align: center;
              font-size: 0.8rem;
              color: #777;
              border-top: 1px solid #F0F0F0;
              padding-top: 35px;
            }
            .footer p {
              margin: 4px 0;
            }
            .footer-sig {
              font-family: 'Playfair Display', serif;
              font-style: italic;
              color: #C49A27;
              font-size: 1.15rem;
              margin-bottom: 12px !important;
            }
            
            @media print {
              body { padding: 0; background: none; }
              .invoice-wrapper { border: none; padding: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header">
              <div class="brand-logo">
                <h1>SEE MEE</h1>
                <p>Atelier of Heritage & Style</p>
              </div>
              <div class="invoice-meta">
                <h2>Invoice</h2>
                <p>Order #: <strong>${order.orderNumber || order._id}</strong></p>
                <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Status: ${order.status.toUpperCase()}</p>
              </div>
            </div>
            
            <div class="grid-details">
              <div class="detail-block">
                <h3>Delivery Address</h3>
                <p><strong>${orderCustomer.name}</strong></p>
                <p>${orderCustomer.address.street}</p>
                <p>${orderCustomer.address.city}, ${orderCustomer.address.state} - ${orderCustomer.address.pincode}</p>
                <p>T: ${orderCustomer.phone}</p>
              </div>
              <div class="detail-block" style="text-align: right;">
                <h3>Billing & Payment</h3>
                <p>Payment Method: <strong>${order.paymentMethod === 'online' ? 'Online Credit/Debit Card' : 'Cash on Delivery'}</strong></p>
                <p>Payment Status: <strong style="color: ${order.paymentStatus === 'paid' ? '#27AE60' : '#D97706'}">${order.paymentStatus.toUpperCase()}</strong></p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Items Ordered</th>
                  <th style="text-align: center;">Price</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">${item.name}</div>
                      <div class="item-spec">Size: ${item.size} • Color: ${item.color || 'Standard'}</div>
                    </td>
                    <td style="text-align: center;">₹${item.price.toLocaleString('en-IN')}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals-container">
              <table class="totals-table">
                <tr>
                  <td style="color: #666;">Subtotal</td>
                  <td style="text-align: right; font-weight: 600;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="color: #666;">Shipping & Handling</td>
                  <td style="text-align: right; color: #27AE60; font-weight: 600;">Complimentary</td>
                </tr>
                <tr class="grand-total">
                  <td>Total</td>
                  <td style="text-align: right;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>
            
            <div class="footer">
              <p class="footer-sig">Thank you for your patronage</p>
              <p>Each piece is crafted with care at the Atelier of See Mee.</p>
              <p>© ${new Date().getFullYear()} See Mee. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  const primaryAddress = addresses.find((addr) => addr.isDefault) || addresses[0] || null
  const settingsSummary = [
    {
      label: 'Phone',
      value: profileData.phone || 'Not added',
      note: 'Used for delivery updates and verification.'
    },
    {
      label: 'Addresses',
      value: addresses.length,
      note: 'Saved delivery destinations.'
    },
    {
      label: 'Default Address',
      value: primaryAddress ? 'Set' : 'Missing',
      note: primaryAddress ? `${primaryAddress.city}, ${primaryAddress.state}` : 'Add one to speed up checkout.'
    }
  ]

  const menuItems = [
    { id: 'dashboard', label: 'My Profile' },
    { id: 'orders', label: 'My Orders' },
    { id: 'wishlist', label: 'Saved Items' },
    { id: 'profile', label: 'Settings' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="account-section-view">
            <div className="section-intro">
              <h2>My Profile</h2>
              <p>Quick access to your account activity, saved items, and delivery details.</p>
            </div>

            <div className="profile-overview">
              <section className="profile-hero-panel">
                <div className="profile-hero-copy">
                  <span className="greeting-label">Welcome back</span>
                  <h2 className="greeting-title">{user?.name || 'Atelier Member'}</h2>
                  <p className="greeting-subtitle">
                    Review your recent orders, saved pieces, and shipping details from one place.
                  </p>
                  <div className="profile-hero-actions">
                    <button type="button" className="btn-editorial gold" onClick={() => setActiveTab('orders')}>View Orders</button>
                    <button type="button" className="btn-editorial outline hero-ghost" onClick={() => setActiveTab('wishlist')}>Open Wishlist</button>
                  </div>
                </div>

                <div className="profile-hero-card">
                  <span className="profile-hero-badge">Account Snapshot</span>
                  <div className="profile-hero-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                  <div className="profile-hero-meta">
                    <span className="profile-hero-label">Email</span>
                    <strong>{user?.email}</strong>
                  </div>
                  <div className="profile-hero-meta">
                    <span className="profile-hero-label">Phone</span>
                    <strong>{profileData.phone || 'Not added yet'}</strong>
                  </div>
                </div>
              </section>

              <div className="profile-insights-grid">
                <button type="button" className="profile-insight-card" onClick={() => setActiveTab('orders')}>
                  <span className="profile-insight-label">Orders</span>
                  <strong className="profile-insight-value">{orders.length}</strong>
                  <p>Track recent purchases and delivery progress.</p>
                </button>

                <button type="button" className="profile-insight-card" onClick={() => setActiveTab('wishlist')}>
                  <span className="profile-insight-label">Wishlist</span>
                  <strong className="profile-insight-value">{wishlist.length}</strong>
                  <p>Pieces saved for later and quick shopping.</p>
                </button>

                <div className="profile-insight-card profile-status-card">
                  <span className="profile-insight-label">Default Address</span>
                  <strong className="profile-insight-value status">{primaryAddress ? 'Set' : 'Missing'}</strong>
                  <p>{primaryAddress ? `${primaryAddress.city}, ${primaryAddress.state}` : 'Add one for faster checkout.'}</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'orders':
        return (
          <div className="account-section-view">
            <div className="section-intro orders-hero">
              <h2>My Orders</h2>
              <p>Your recent purchases and their current status.</p>
            </div>

            {loading ? (
              <div className="editorial-empty">
                <p>Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="editorial-empty">
                <p>No orders yet. Start exploring the collection.</p>
              </div>
            ) : (
              <div className="profile-details-panel">
                <div className="profile-detail-grid orders-list">
                  {orders.map((order) => (
                    <motion.div key={order._id}>
                      <button type="button" className="profile-detail-item order-card" onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}>
                        <div className="order-card-left">
                          <div className="order-id">#{order.orderNumber || order._id}</div>
                          <div className="order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>

                        <div className="order-card-right">
                          <span className={`order-status-badge ${(order.status || '').toLowerCase()}`}>{order.status || 'Pending'}</span>
                          <strong className="order-amount">₹{order.totalAmount?.toLocaleString?.() || order.totalAmount}</strong>
                          <span className={`order-expand ${selectedOrder?._id === order._id ? 'open' : ''}`}>▲</span>
                        </div>
                      </button>

                      {selectedOrder?._id === order._id && (
                        <motion.div className="order-detail-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <div className="order-detail-timeline">
                            {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, idx) => (
                              <div key={step} className={`timeline-step ${step === (order.status || '').toLowerCase() ? 'active' : ''}`}>
                                <div className="timeline-dot"></div>
                                <span className="timeline-label">{step}</span>
                              </div>
                            ))}
                          </div>

                          <div className="order-detail-grid">
                            <section className="order-section items-section">
                              <h4 className="order-section-title">Items Ordered</h4>
                              {order.items?.map((item, i) => (
                                <div key={i} className="order-item">
                                  {item.image && <img src={item.image} alt={item.name} className="item-thumb" />}
                                  <div className="item-info">
                                    <strong>{item.name}</strong>
                                    <p className="item-meta">Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}</p>
                                  </div>
                                  <strong className="item-price">₹{item.price?.toLocaleString?.() || item.price}</strong>
                                </div>
                              )) || <p className="no-items">No items available</p>}
                            </section>

                            <section className="order-section delivery-section">
                              <h4 className="order-section-title">Delivery Address</h4>
                              {order.deliveryAddress ? (
                                <div className="address-block">
                                  <strong>{order.deliveryAddress.name || 'Recipient'}</strong>
                                  <p>{order.deliveryAddress.street}</p>
                                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                                  {order.deliveryAddress.phone && <p>T: {order.deliveryAddress.phone}</p>}
                                </div>
                              ) : (
                                <p className="no-info">Address not available</p>
                              )}
                            </section>

                            <section className="order-section payment-section">
                              <h4 className="order-section-title">Payment</h4>
                              <div className="payment-info">
                                <div className="payment-row">
                                  <span>Method:</span>
                                  <strong>{order.paymentMethod || 'N/A'}</strong>
                                </div>
                                <div className="payment-row">
                                  <span>Status:</span>
                                  <strong className={`payment-status ${(order.paymentStatus || '').toLowerCase()}`}>{order.paymentStatus || 'Pending'}</strong>
                                </div>
                              </div>
                            </section>
                          </div>

                          <div className="order-detail-actions">
                            <button type="button" className="btn-editorial outline" onClick={() => handlePrint(order)}>Print Receipt</button>
                            <button type="button" className="btn-editorial outline" onClick={() => window.location.href='mailto:support@seemee.com'}>Contact Support</button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'wishlist':
        return (
          <div className="account-section-view">
            <div className="section-intro">
              <h2>Saved Items</h2>
              <p>Items you have saved for later.</p>
            </div>

            {wishlist.length === 0 ? (
              <div className="editorial-empty">
                <p>Your wishlist is empty. Add pieces from the collection to save them here.</p>
              </div>
            ) : (
              <div className="profile-details-panel">
                <div className="profile-detail-grid">
                  {wishlist.map((item) => (
                    <div key={item.id || item._id} className="profile-detail-item">
                      <span className="profile-detail-label">Saved Piece</span>
                      <strong className="profile-detail-value">{item.name}</strong>
                      <p>{item.category || 'Collection item'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'profile':
        return (
          <div className="account-section-view">
            <div className="section-intro">
               <h2>My Settings</h2>
               <p>Update your personal details and preferences.</p>
            </div>
            {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}
          <div className="profile-management-layout">
            <form className="editorial-form profile-settings-form" onSubmit={handleProfileUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email} disabled />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="Enter mobile number" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" placeholder="Leave blank to keep current" value={profileData.password} onChange={(e) => setProfileData({...profileData, password: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-editorial gold">Save Changes</button>
            </form>

            <section className="contact-address-panel">
             <div className="contact-address-card">
              <span className="profile-panel-label">Phone</span>
              <strong>{profileData.phone || 'No phone number saved yet'}</strong>
              <p>Use your phone number for delivery updates and account verification.</p>
             </div>

             <div className="contact-address-card">
              <span className="profile-panel-label">Primary Address</span>
              {primaryAddress ? (
                <>
                 <strong>{primaryAddress.street}</strong>
                 <p>{primaryAddress.city}, {primaryAddress.state} - {primaryAddress.pincode}</p>
                </>
              ) : (
                <>
                 <strong>No address saved yet</strong>
                 <p>Add your delivery address to speed up checkout.</p>
                </>
              )}
              <button type="button" className="btn-editorial outline address-cta" onClick={() => { setShowAddressModal(true); setShowAddressForm(true); setEditingAddressId(null); }}>Manage Addresses</button>
             </div>
            </section>

            {/* Address Manager Modal */}
            {showAddressModal && (
              <div className="modal-overlay manage-address-overlay" onClick={() => { setShowAddressModal(false); setShowAddressForm(false); setEditingAddressId(null); }}>
                <motion.div className="address-modal-panel manage-address-panel" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <div className="address-modal-hero">
                    <div className="section-intro compact settings-address-header address-modal-copy">
                      <div>
                        <span className="address-modal-kicker">Delivery book</span>
                        <h2>Manage Addresses</h2>
                        <p>Save, edit, and prioritize delivery addresses for faster checkout.</p>
                      </div>
                      <div className="address-modal-actions">
                        <button type="button" className="btn-editorial gold" onClick={() => { setEditingAddressId(null); setNewAddress({ street: '', city: '', state: '', pincode: '', isDefault: false }); setShowAddressForm(true); }}>+ Add New Address</button>
                        <button type="button" className="btn-editorial outline" onClick={() => { setShowAddressModal(false); setShowAddressForm(false); setEditingAddressId(null); }}>Close</button>
                      </div>
                    </div>

                    <div className="address-modal-metrics">
                      <div className="address-metric-card">
                        <span>Saved</span>
                        <strong>{addresses.length}</strong>
                      </div>
                      <div className="address-metric-card">
                        <span>Default</span>
                        <strong>{primaryAddress ? 'Set' : 'Unset'}</strong>
                      </div>
                      <div className="address-metric-card">
                        <span>Mode</span>
                        <strong>{editingAddressId ? 'Editing' : 'Creating'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="address-manager-layout">
                    <section className="address-manager-column address-form-column">
                      <div className="address-column-heading">
                        <div>
                          <span className="profile-panel-label">Address form</span>
                          <h3>{editingAddressId ? 'Edit delivery address' : 'Add a delivery address'}</h3>
                        </div>
                        <p>Use this form to keep billing and delivery details ready for the next order.</p>
                      </div>

                      {showAddressForm ? (
                        <form className="editorial-form full-width address-manager-form" onSubmit={handleAddAddress}>
                          <div className="form-grid address-form-grid">
                            <div className="form-group full-span">
                              <label>Street Address</label>
                              <input type="text" placeholder="House/Flat No, Street, Area" required value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>City</label>
                              <input type="text" placeholder="City" required value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>State</label>
                              <input type="text" placeholder="State" required value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                            </div>
                            <div className="form-group">
                              <label>Pincode</label>
                              <input type="text" placeholder="6-digit pincode" required value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                            </div>
                          </div>

                          <label className="luxury-checkbox-wrapper">
                            <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })} />
                            <span className="checkbox-text">Set as default shipping address</span>
                          </label>

                          <div className="form-actions-right address-form-actions">
                            <button type="submit" className="btn-editorial gold">{editingAddressId ? 'Update Address' : 'Save Address'}</button>
                            <button type="button" className="btn-editorial outline" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}>Hide Form</button>
                          </div>
                        </form>
                      ) : (
                        <div className="editorial-empty address-form-empty">
                          <p>The form is hidden. Use “Add New Address” to start a fresh entry.</p>
                        </div>
                      )}
                    </section>

                    <section className="address-manager-column address-list-column">
                      <div className="address-column-heading">
                        <div>
                          <span className="profile-panel-label">Saved addresses</span>
                          <h3>Delivery destinations</h3>
                        </div>
                        <p>Pick the default address or update entries whenever details change.</p>
                      </div>

                      <div className="settings-address-grid modal-grid">
                        {addresses.length === 0 ? (
                          <div className="editorial-empty settings-address-empty">
                            <p>No address saved yet. Add one for faster checkout.</p>
                          </div>
                        ) : (
                          addresses.map((addr) => (
                            <motion.div key={addr._id} className="address-registry-card settings-address-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                              <div className="addr-header">
                                <div className="addr-badge">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                  </svg>
                                  <span>{addr.isDefault ? 'Default Destination' : 'Destination'}</span>
                                </div>
                                <div className="addr-actions">
                                  <button type="button" onClick={() => { handleEditAddress(addr); setShowAddressForm(true); }} className="addr-edit">Edit</button>
                                  <button type="button" onClick={() => handleDeleteAddress(addr._id)} className="addr-delete">Remove</button>
                                </div>
                              </div>
                              <p className="addr-text">{addr.street}<br />{addr.city}, {addr.state} - {addr.pincode}</p>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="account-page-v2">
      {/* Elegant Back Navigation */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>
      <div className="account-wrapper">
        <aside className="account-nav-sidebar">
          <div className="nav-profile-card">
            <div className="nav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="nav-user-info">
              <h3>{user?.name}</h3>
              <p>Atelier Member</p>
            </div>
          </div>
          <nav className="side-navigation">
            {menuItems.map((item) => (
              <button key={item.id} className={`side-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                <span className="side-nav-label">{item.label}</span>
                <div className="side-nav-indicator"></div>
              </button>
            ))}
            <div className="nav-spacer"></div>
            <button className="side-nav-item logout" onClick={() => { logout(); navigate('/'); }}>
              <span className="side-nav-label">Sign Out</span>
            </button>
          </nav>
        </aside>
        <main className="account-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="view-container"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default AccountPage
