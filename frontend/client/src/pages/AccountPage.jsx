import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { API_ENDPOINTS, getAdminUrl } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { fetchPincodeDetails } from '../utils/pincodeService'
import { printOrderInvoice } from '../utils/invoiceHelper'
import './AccountPage.css'

const AccountPage = () => {
  const { user, logout, token, updateUser } = useAuth()
  const navigate = useNavigate()
  const { wishlist, toggleWishlist, addToCart } = useCart()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [menuExpanded, setMenuExpanded] = useState(false)
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showAccountPassword, setShowAccountPassword] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [newAddress, setNewAddress] = useState({
    street: '', city: '', state: '', pincode: '', isDefault: false
  })

  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')
  const [cancellingOrderId, setCancellingOrderId] = useState(null)

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }
    setCancellingOrderId(orderId)
    try {
      const response = await fetch(API_ENDPOINTS.ORDERS_CANCEL(orderId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Order cancelled successfully.' })
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o))
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to cancel order' })
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      setMessage({ type: 'error', text: 'Failed to cancel order' })
    } finally {
      setCancellingOrderId(null)
    }
  }

  // Automatic State & City autofill via India Post API for AccountPage address form
  useEffect(() => {
    const rawPin = newAddress.pincode ? String(newAddress.pincode).trim() : ''

    setPincodeError('')

    if (rawPin.length !== 6 || !/^\d{6}$/.test(rawPin)) {
      setPincodeLoading(false)
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      if (!isMounted) return
      setPincodeLoading(true)
      const res = await fetchPincodeDetails(rawPin)
      if (!isMounted) return
      setPincodeLoading(false)

      if (res.success) {
        setNewAddress(prev => ({
          ...prev,
          city: res.city || prev.city,
          state: res.state || prev.state
        }))
        setPincodeError('')
      } else if (!res.aborted) {
        setPincodeError(res.error || 'Invalid or non-existent PIN code.')
        setNewAddress(prev => ({
          ...prev,
          city: '',
          state: ''
        }))
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [newAddress.pincode])

  // Sync profileData when user state updates
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || ''
      }))
    }
  }, [user])

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

        if (ordersRes.status === 401 || addressesRes.status === 401) {
          console.warn('Session expired. Redirecting to login.')
          logout()
          navigate('/auth')
          return
        }

        const ordersData = await ordersRes.json()
        const addressesData = await addressesRes.json()

        if (ordersData.success && Array.isArray(ordersData.data)) {
          setOrders(ordersData.data)
        }
        if (addressesData.success && Array.isArray(addressesData.data)) {
          setAddresses(addressesData.data)
        }
      } catch (err) {
        console.error('Error fetching account data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
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

  const handleAddAddress = async (e) => {
    e.preventDefault()
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      setMessage({ type: 'error', text: 'Please fill all required address fields.' })
      return
    }

    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(String(newAddress.pincode).trim())) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit PIN code.' })
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
        setMessage({ type: 'success', text: editingAddressId ? 'Address updated' : 'Address added successfully' })
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
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      isDefault: !!addr.isDefault
    })
    setEditingAddressId(addr._id)
    setShowAddressForm(true)
    setShowAddressModal(true)
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
        setMessage({ type: 'success', text: 'Address removed successfully.' })
      }
    } catch (err) {
      console.error('Error deleting address:', err)
    }
  }

  const handleSetDefaultAddress = async (addr) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS_ADDRESSES}/${addr._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...addr, isDefault: true })
      })
      const data = await response.json()
      if (data.success) {
        setAddresses(data.data)
        setMessage({ type: 'success', text: 'Default shipping destination updated.' })
      }
    } catch (err) {
      console.error('Error setting default address:', err)
    }
  }

  const handlePrint = (order) => {
    printOrderInvoice(order)
  }

  const primaryAddress = addresses.find((addr) => addr.isDefault) || addresses[0] || null

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Overview', 
      badge: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="14" y="3" width="7" height="5" rx="1"/>
          <rect x="14" y="12" width="7" height="9" rx="1"/>
          <rect x="3" y="16" width="7" height="5" rx="1"/>
        </svg>
      )
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      badge: orders.length > 0 ? orders.length : null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      )
    },
    { 
      id: 'wishlist', 
      label: 'Wishlist', 
      badge: wishlist.length > 0 ? wishlist.length : null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      )
    },
    { 
      id: 'profile', 
      label: 'Settings', 
      badge: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  ]

  const filteredOrders = orders.filter(order => {
    const st = (order.status || '').toLowerCase()
    if (orderFilter === 'active') return ['pending', 'processing', 'shipped', 'confirmed'].includes(st)
    if (orderFilter === 'completed') return st === 'delivered'
    if (orderFilter === 'cancelled') return st === 'cancelled'
    return true
  })

  const getStatusColor = (status) => {
    const st = (status || '').toLowerCase()
    switch (st) {
      case 'delivered': return { bg: 'rgba(34, 197, 94, 0.12)', text: '#16a34a', border: 'rgba(34, 197, 94, 0.3)' }
      case 'shipped': return { bg: 'rgba(14, 165, 233, 0.12)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.3)' }
      case 'processing': case 'confirmed': return { bg: 'rgba(234, 179, 8, 0.12)', text: '#ca8a04', border: 'rgba(234, 179, 8, 0.3)' }
      case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.3)' }
      default: return { bg: 'rgba(120, 113, 108, 0.12)', text: '#78716c', border: 'rgba(120, 113, 108, 0.3)' }
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="account-section-view ux-overview-container">
            {/* UX Hero Profile Banner */}
            <section className="ux-profile-hero">
              <div className="ux-hero-left">
                <div className="ux-avatar-wrapper">
                  <div className="ux-hero-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="ux-status-online" title="Account Active"></span>
                </div>
                <div className="ux-hero-details">
                  <div className="ux-tier-badge-row">
                    <span className="ux-greeting">Welcome Back,</span>
                    <span className="ux-tier-badge">SEEMEE MEMBER</span>
                  </div>
                  <h1 className="ux-hero-name">{user?.name || 'Valued Client'}</h1>
                  <div className="ux-meta-pills-row">
                    <span className="ux-meta-pill">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M22 6l-10 7L2 6"/>
                      </svg>
                      <span>{user?.email}</span>
                    </span>
                    {profileData.phone && (
                      <span className="ux-meta-pill">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span>{profileData.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ux-hero-actions">
                {user?.role === 'admin' && (
                  <button
                    type="button"
                    className="ux-btn-gold"
                    onClick={() => {
                      const adminToken = token || localStorage.getItem('seemee-token') || localStorage.getItem('adminToken') || '';
                      const adminUserStr = user ? JSON.stringify(user) : localStorage.getItem('seemee-user') || '';
                      window.location.href = `${getAdminUrl()}/dashboard?token=${encodeURIComponent(adminToken)}&user=${encodeURIComponent(adminUserStr)}`;
                    }}
                  >
                     Admin Portal
                  </button>
                )}
                <button type="button" className="ux-btn-secondary" onClick={() => setActiveTab('profile')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  <span>Account Settings</span>
                </button>
              </div>
            </section>

            {/* UX Quick Access Navigation Hub (4 Interactive Cards) */}
            <div className="ux-hub-grid">
              <div className="ux-hub-card" onClick={() => setActiveTab('orders')}>
                <div className="ux-card-top">
                  <div className="ux-card-icon-wrap orders">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <span className="ux-chip-badge">{orders.length} Orders</span>
                </div>
                <h3 className="ux-card-title">Order History & Tracking</h3>
                <p className="ux-card-desc">Track active shipments, view past purchases, and download invoice summaries.</p>
                <div className="ux-card-footer">
                  <span className="ux-action-link">Manage Orders</span>
                  <span className="ux-arrow">→</span>
                </div>
              </div>

              <div className="ux-hub-card" onClick={() => setActiveTab('wishlist')}>
                <div className="ux-card-top">
                  <div className="ux-card-icon-wrap wishlist">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#DC2626" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  <span className="ux-chip-badge">{wishlist.length} Saved</span>
                </div>
                <h3 className="ux-card-title">Saved Wishlist</h3>
                <p className="ux-card-desc">Your curated collection of haute couture pieces saved for fast checkout.</p>
                <div className="ux-card-footer">
                  <span className="ux-action-link">View Wishlist</span>
                  <span className="ux-arrow">→</span>
                </div>
              </div>

              <div className="ux-hub-card" onClick={() => { setActiveTab('profile'); setShowAddressModal(true); }}>
                <div className="ux-card-top">
                  <div className="ux-card-icon-wrap address">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <span className={`ux-chip-badge ${primaryAddress ? 'success' : 'warning'}`}>
                    {primaryAddress ? 'Configured' : 'Add Now'}
                  </span>
                </div>
                <h3 className="ux-card-title">Shipping Addresses</h3>
                <p className="ux-card-desc">
                  {primaryAddress ? `${primaryAddress.street || ''}, ${primaryAddress.city}, ${primaryAddress.state}` : 'Save your delivery address for 1-click checkout.'}
                </p>
                <div className="ux-card-footer">
                  <span className="ux-action-link">Manage Addresses</span>
                  <span className="ux-arrow">→</span>
                </div>
              </div>

              <div className="ux-hub-card" onClick={() => setActiveTab('profile')}>
                <div className="ux-card-top">
                  <div className="ux-card-icon-wrap security">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <span className="ux-chip-badge success">Active</span>
                </div>
                <h3 className="ux-card-title">Profile & Security</h3>
                <p className="ux-card-desc">Update your personal account information, phone number, and change account password.</p>
                <div className="ux-card-footer">
                  <span className="ux-action-link">Update Profile</span>
                  <span className="ux-arrow">→</span>
                </div>
              </div>
            </div>

            {/* UX Account Dossier & Address Summary Card */}
            <div className="ux-dossier-card">
              <div className="ux-dossier-header">
                <div>
                  <span className="ux-dossier-tag">Account Dossier</span>
                  <h2>Profile & Delivery Overview</h2>
                </div>
                <button type="button" className="ux-text-btn" onClick={() => setActiveTab('profile')}>
                  <span>Edit Details</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>

              <div className="ux-dossier-grid">
                <div className="ux-dossier-tile">
                  <span className="ux-tile-label">Client Name</span>
                  <span className="ux-tile-value">{user?.name || 'Not specified'}</span>
                </div>
                <div className="ux-dossier-tile">
                  <span className="ux-tile-label">Email Address</span>
                  <span className="ux-tile-value">{user?.email}</span>
                </div>
                <div className="ux-dossier-tile">
                  <span className="ux-tile-label">Contact Number</span>
                  <span className="ux-tile-value">{profileData.phone || 'Not added yet'}</span>
                </div>
                <div className="ux-dossier-tile">
                  <span className="ux-tile-label">Primary Shipping Address</span>
                  <span className="ux-tile-value">
                    {primaryAddress ? (
                      `${primaryAddress.street || ''}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.pincode}`
                    ) : (
                      'No default delivery address configured.'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* UX Shopping Quick Shortcuts Footer */}
            <div className="ux-shortcuts-banner">
              {/* <span className="ux-banner-title">✦ ATELIE SHORTCUTS:</span> */}
              <div className="ux-shortcuts-row">
                <button type="button" className="ux-shortcut-chip" onClick={() => navigate('/collections')}>
                  <span>Explore Collections</span>
                </button>
                <button type="button" className="ux-shortcut-chip" onClick={() => navigate('/new-arrivals')}>
                  <span>New Arrivals</span>
                </button>
                <button type="button" className="ux-shortcut-chip" onClick={() => navigate('/cart')}>
                  <span>View Shopping Bag</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'orders':
        return (
          <div className="account-section-view">
            <div className="section-intro orders-hero">
              <div>
                <h2>My Orders</h2>
                <p>Track your purchases, delivery milestones, and order invoices.</p>
              </div>
              <div className="orders-filter-pills">
                {[
                  { id: 'all', label: `All (${orders.length})` },
                  { id: 'active', label: 'In Progress' },
                  { id: 'completed', label: 'Delivered' },
                  { id: 'cancelled', label: 'Cancelled' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className={`filter-pill ${orderFilter === f.id ? 'active' : ''}`}
                    onClick={() => setOrderFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="editorial-empty">
                <div className="spinner"></div>
                <p>Retrieving your order history...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="editorial-empty-card">
                <div className="empty-icon-circle">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <h4>No {orderFilter !== 'all' ? orderFilter : ''} orders found</h4>
                <p>When you make a purchase, your orders will appear here with full tracking.</p>
                <button type="button" className="btn-editorial gold" onClick={() => navigate('/collections')}>
                  Shop Now
                </button>
              </div>
            ) : (
              <div className="orders-full-list">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrder?._id === order._id
                  const statusStyle = getStatusColor(order.status)
                  const steps = ['placed', 'confirmed', 'shipped', 'delivered']
                  const currentStatus = (order.status || 'placed').toLowerCase()
                  const currentStepIdx = steps.indexOf(currentStatus) === -1 ? 0 : steps.indexOf(currentStatus)
                  const isCodOrder = String(order.paymentMethod || '').toLowerCase() === 'cod'
                  const isOfflineStore = String(order.orderType || '').toUpperCase() === 'OFFLINE'
                  const isCodApproved = (order.paymentStatus || '').toLowerCase() === 'paid' || currentStatus === 'confirmed' || currentStatus === 'approved' || currentStatus === 'processing' || currentStatus === 'cod approved'

                  return (
                    <motion.div key={order._id} className={`order-card-container ${isSelected ? 'expanded' : ''}`}>
                      <div className="order-summary-row" onClick={() => setSelectedOrder(isSelected ? null : order)}>
                        <div className="order-main-info">
                          <div className="order-id-badge">
                            <strong>Order #{order.orderNumber || order._id}</strong>
                            <span className="order-date-str">
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div className="order-summary-right">
                          <span className="order-status-pill" style={{ background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                            {order.status || 'Pending'}
                          </span>
                          <div className="order-amount-display">
                            <span className="amount-label">Total</span>
                            <strong>₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</strong>
                          </div>
                          <button type="button" className="order-toggle-btn">
                            {isSelected ? 'Hide Details ▲' : 'View Details ▼'}
                          </button>
                        </div>
                      </div>

                      {/* Items Preview Strip */}
                      {!isSelected && (
                        <div className="order-items-strip">
                          {(order.items || []).map((item, i) => (
                            <div key={i} className="strip-item">
                              <img src={getOptimizedImageUrl(item.image)} alt={item.name} className="strip-thumb" />
                              <div className="strip-text">
                                <span className="strip-name">{item.name}</span>
                                <span className="strip-spec">Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expanded Order Detail View */}
                      {isSelected && (
                        <motion.div 
                          className="order-detail-panel"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {/* Delivery Progress Bar or COD Handover Banner */}
                          <div className="order-progress-wrapper">
                            <h4 className="progress-title">Order Status Timeline</h4>
                            {currentStatus === 'cancelled' ? (
                              <div className="timeline-cancelled-banner">
                                <span className="cancelled-icon-badge">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                  </svg>
                                </span>
                                <span className="cancelled-text">This order is cancelled</span>
                              </div>
                            ) : (isOfflineStore && isCodOrder) ? (
                              <div className="cod-handover-banner-box">
                                {isCodApproved ? (
                                  <div className="cod-approved-handover">
                                    <div className="handover-icon-circle green">
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                        <line x1="3" y1="6" x2="21" y2="6"/>
                                        <path d="M16 10a4 4 0 0 1-8 0"/>
                                      </svg>
                                    </div>
                                    <div className="handover-text">
                                      <span className="handover-mini-tag">ADMIN APPROVED</span>
                                      <strong className="handover-main-title">ORDER HANDOVER</strong>
                                      <p className="handover-sub">COD Payment verified & approved by Admin. Item handed over to customer.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="cod-pending-approval">
                                    <div className="handover-icon-circle amber">
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                      </svg>
                                    </div>
                                    <div className="handover-text">
                                      <span className="handover-mini-tag amber">PROCESSING</span>
                                      <strong className="handover-main-title amber">ORDER PROCESSING</strong>
                                      <p className="handover-sub">Your Cash on Delivery order is currently processing. Order Handover will be confirmed shortly.</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="progress-bar-steps">
                                {steps.map((step, idx) => {
                                  const isDone = idx <= currentStepIdx
                                  return (
                                    <div key={step} className={`progress-step-item ${isDone ? 'completed' : ''} ${idx === currentStepIdx ? 'active' : ''}`}>
                                      <div className="step-dot">
                                        {isDone ? '✓' : idx + 1}
                                      </div>
                                      <span className="step-name">{step}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          <div className="order-detail-grid">
                            {/* Items List */}
                            <section className="order-section items-section">
                              <h4 className="order-section-title">Items in Order ({order.items?.length || 0})</h4>
                              <div className="order-items-detailed-list">
                                {order.items?.map((item, i) => (
                                  <div key={i} className="order-item-row">
                                    <img src={getOptimizedImageUrl(item.image)} alt={item.name} className="item-thumb-large" />
                                    <div className="item-info-meta">
                                      <strong className="item-title">{item.name}</strong>
                                      <div className="item-tags">
                                        {item.size && <span className="item-tag">Size: {item.size}</span>}
                                        {item.color && <span className="item-tag">Color: {item.color}</span>}
                                        <span className="item-tag">Qty: {item.quantity}</span>
                                      </div>
                                    </div>
                                    <strong className="item-row-price">₹{Number((item.price || 0) * item.quantity).toLocaleString('en-IN')}</strong>
                                  </div>
                                ))}
                              </div>
                            </section>

                            {/* Delivery & Payment Info */}
                            <div className="order-side-info-col">
                              <section className="order-section delivery-section">
                                <h4 className="order-section-title">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }}>
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                  </svg>
                                  <span>Delivery Address</span>
                                </h4>
                                {(() => {
                                  const addr = order.deliveryAddress || order.shippingAddress || order.customer?.address || order.billingAddress || (user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0])
                                  const addrName = addr?.name || order.customer?.name || user?.name || 'Valued Client'
                                  const streetStr = addr?.street || addr?.address || addr?.line1
                                  const cityStr = addr?.city
                                  const stateStr = addr?.state
                                  const pincodeStr = addr?.pincode || addr?.zip || addr?.zipcode
                                  const phoneStr = addr?.phone || order.customer?.phone || user?.phone

                                  if (streetStr || cityStr || pincodeStr) {
                                    return (
                                      <div className="address-info-box">
                                        <strong>{addrName}</strong>
                                        {streetStr && <p>{streetStr}</p>}
                                        {(cityStr || stateStr || pincodeStr) && (
                                          <p>{[cityStr, stateStr].filter(Boolean).join(', ')}{pincodeStr ? ` - ${pincodeStr}` : ''}</p>
                                        )}
                                        {phoneStr && (
                                          <p style={{ marginTop: '4px', fontSize: '0.78rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                            </svg>
                                            <span>{phoneStr}</span>
                                          </p>
                                        )}
                                      </div>
                                    )
                                  }

                                  return (
                                    <div className="address-info-box">
                                      <strong>{order.customer?.name || user?.name || 'Valued Client'}</strong>
                                      <p>{user?.email || order.customer?.email}</p>
                                      <p className="no-info" style={{ marginTop: '2px' }}>Primary Delivery Address</p>
                                    </div>
                                  )
                                })()}
                              </section>

                              <section className="order-section payment-section">
                                <h4 className="order-section-title">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }}>
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                    <line x1="1" y1="10" x2="23" y2="10"/>
                                  </svg>
                                  <span>Payment Details</span>
                                </h4>
                                <div className="payment-info-box">
                                  <div className="payment-row">
                                    <span>Method:</span>
                                    <strong>{order.paymentMethod === 'online' ? 'Card / UPI / Online' : 'Cash on Delivery'}</strong>
                                  </div>
                                  <div className="payment-row">
                                    <span>Status:</span>
                                    <strong className={`payment-status ${currentStatus === 'cancelled' ? 'cancelled' : (order.paymentStatus || '').toLowerCase()}`}>
                              {currentStatus === 'cancelled' ? 'CANCELLED' : (order.paymentStatus || 'pending').toUpperCase()}
                                    </strong>
                                  </div>
                                </div>
                              </section>
                            </div>
                          </div>

                          <div className="order-detail-actions">
                            {(() => {
                               const ordStatus = String(order.status || '').toLowerCase().trim()
                               const shipStatus = String(order.shipping?.status || '').toLowerCase().trim()
                               const isShipped = ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(ordStatus) ||
                                                 ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(shipStatus) ||
                                                 Boolean(order.shipping?.awbNumber || order.trackingNumber) ||
                                                 Boolean(order.shipping?.pickupAt)

                               if (ordStatus === 'cancelled' || isShipped) return null

                               return (
                                 <button 
                                   type="button" 
                                   className="btn-editorial outline cancel-btn-editorial" 
                                   onClick={() => handleCancelOrder(order._id)}
                                   disabled={cancellingOrderId === order._id}
                                 >
                                   {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                                 </button>
                               )
                             })()}
                            <button type="button" className="btn-editorial gold" onClick={() => handlePrint(order)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <polyline points="6 9 6 2 18 2 18 9"/>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect x="6" y="14" width="12" height="8"/>
                              </svg>
                              <span>Print Invoice</span>
                            </button>
                            <button type="button" className="btn-editorial outline" onClick={() => window.location.href='mailto:bizseemee@gmail.com?subject=SEEMEE%20Customer%20Support%20Inquiry'}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M22 6l-10 7L2 6"/>
                              </svg>
                              <span>Contact Support</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'wishlist':
        return (
          <div className="account-section-view">
            <div className="section-intro">
              <div>
                <h2>Saved Wishlist ({wishlist.length})</h2>
                <p>Explore all the pieces you have bookmarked for future purchases.</p>
              </div>
              {wishlist.length > 0 && (
                <button type="button" className="btn-editorial outline" onClick={() => navigate('/collections')}>
                  Discover More Items
                </button>
              )}
            </div>

            {wishlist.length === 0 ? (
              <div className="editorial-empty-card">
                <div className="empty-icon-circle">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <h4>Your Wishlist is Empty</h4>
                <p>Explore our collections and click the heart icon on items you love.</p>
                <button type="button" className="btn-editorial gold" onClick={() => navigate('/collections')}>
                  Explore Collections
                </button>
              </div>
            ) : (
              <div className="wishlist-full-grid">
                {wishlist.map((item) => {
                  const priceVal = typeof item.price === 'number' 
                    ? item.price 
                    : parseInt(String(item.price || '0').replace(/[₹,]/g, '')) || 0

                  return (
                    <div key={item.id || item._id} className="wishlist-card">
                      <div className="wishlist-card-media" onClick={() => navigate(`/product/${item.id || item._id}`)}>
                        <img 
                          src={getOptimizedImageUrl(item.images?.[0] || item.image)} 
                          alt={item.name} 
                          className="wishlist-card-img" 
                        />
                        <button 
                          type="button" 
                          className="wishlist-remove-icon"
                          title="Remove from Wishlist"
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(item); }}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="wishlist-card-info">
                        <span className="wishlist-card-category">{item.category || 'Atelier Collection'}</span>
                        <h4 className="wishlist-card-title" onClick={() => navigate(`/product/${item.id || item._id}`)}>
                          {item.name}
                        </h4>
                        <div className="wishlist-card-price">
                          ₹{priceVal.toLocaleString('en-IN')}
                        </div>
                        <div className="wishlist-card-actions">
                          <button 
                            type="button" 
                            className="btn-editorial gold full-btn"
                            onClick={() => addToCart(item)}
                          >
                            ADD TO BAG
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'profile':
        return (
          <div className="account-section-view ux-settings-container">
            {/* UX Settings Header */}
            <div className="section-intro ux-settings-intro">
              <div>
                <h2>Account Settings & Security</h2>
                <p>Manage your personal profile details, account password, and saved delivery destinations.</p>
              </div>
            </div>

            {/* Notification Banner */}
            <AnimatePresence>
              {message.text && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className={`form-message ${message.type}`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {message.type === 'success' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    )}
                    <span>{message.text}</span>
                  </span>
                  <button type="button" className="close-toast" onClick={() => setMessage({ type: '', text: '' })}>✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="profile-management-layout">
              {/* Profile & Security Form Card */}
              <form className="editorial-form profile-settings-form ux-settings-card" onSubmit={handleProfileUpdate}>
                <div className="form-heading-strip">
                  <div className="profile-heading-avatar">{profileData.name?.charAt(0).toUpperCase() || 'U'}</div>
                  <div>
                    <h3>Personal Profile & Credentials</h3>
                    <p>Update your personal information and account security password</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                      placeholder="Your Full Name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address </label>
                    <input type="email" value={user?.email || ''} disabled className="disabled-input" />
                    <span className="input-hint">Verified Primary Account Email</span>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="10-digit mobile number" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password (Optional)</label>
                    <div className="password-input-wrapper">
                      <input 
                        type={showAccountPassword ? "text" : "password"} 
                        placeholder="Min 6 characters to update password" 
                        value={profileData.password} 
                        onChange={(e) => setProfileData({...profileData, password: e.target.value})} 
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowAccountPassword(!showAccountPassword)}
                        aria-label={showAccountPassword ? "Hide password" : "Show password"}
                        tabIndex="-1"
                      >
                        {showAccountPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-action-row" style={{ marginTop: '16px' }}>
                  <button type="submit" className="btn-editorial gold">
                    Save Profile Changes
                  </button>
                </div>
              </form>

              {/* Delivery Addresses Management Panel */}
              <section className="contact-address-panel ux-settings-card">
                <div className="form-heading-strip-row">
                  <div>
                    <h3>Saved Shipping Addresses</h3>
                    <p>{addresses.length} delivery destinations configured</p>
                  </div>
                  <button 
                    type="button" 
                    className="btn-editorial gold compact-btn"
                    onClick={() => {
                      setEditingAddressId(null)
                      setNewAddress({ street: '', city: '', state: '', pincode: '', isDefault: addresses.length === 0 })
                      setShowAddressForm(!showAddressForm)
                    }}
                  >
                    {showAddressForm ? 'Cancel Form ✕' : '+ Add Address'}
                  </button>
                </div>

                {/* Inline Address Form */}
                <AnimatePresence>
                  {showAddressForm && (
                    <motion.form 
                      className="editorial-form inline-address-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddAddress}
                    >
                      <h4 className="inline-form-title">{editingAddressId ? 'Edit Delivery Address' : 'Add New Shipping Address'}</h4>
                      <div className="form-grid">
                        <div className="form-group full-span">
                          <label>Street Address / House No / Area</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Flat 402, Royal Residency, MG Road" 
                            required 
                            value={newAddress.street} 
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} 
                          />
                        </div>
                        <div className="form-group">
                          <label>City</label>
                          <input 
                            type="text" 
                            placeholder="City" 
                            required 
                            value={newAddress.city} 
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} 
                          />
                        </div>
                        <div className="form-group">
                          <label>State</label>
                          <input 
                            type="text" 
                            placeholder="State" 
                            required 
                            value={newAddress.state} 
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} 
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Pincode
                            {pincodeLoading && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#d4af37' }}>Verifying PIN...</span>}
                          </label>
                          <input 
                            type="text" 
                            placeholder="6-digit Pincode" 
                            required 
                            maxLength={6}
                            value={newAddress.pincode} 
                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} 
                          />
                          {pincodeError && <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'block' }}>{pincodeError}</span>}
                        </div>
                      </div>

                      <label className="luxury-checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          checked={newAddress.isDefault} 
                          onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })} 
                        />
                        <span className="checkbox-text">Set as default shipping address</span>
                      </label>

                      <div className="inline-form-actions">
                        <button type="submit" className="btn-editorial gold">
                          {editingAddressId ? 'Update Address' : 'Save Address'}
                        </button>
                        <button type="button" className="btn-editorial outline" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}>
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Saved Address Cards List */}
                <div className="address-quick-list">
                  {addresses.length === 0 ? (
                    <div className="editorial-empty-card compact">
                      <div className="empty-icon-circle">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                      <h4>No Addresses Saved</h4>
                      <p>Save your home, office, or secondary address for fast one-click checkout.</p>
                      <button 
                        type="button" 
                        className="btn-editorial gold"
                        onClick={() => {
                          setEditingAddressId(null)
                          setNewAddress({ street: '', city: '', state: '', pincode: '', isDefault: true })
                          setShowAddressForm(true)
                        }}
                      >
                        + Add First Address
                      </button>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr._id} className={`address-quick-card ${addr.isDefault ? 'is-default-card' : ''}`}>
                        <div className="addr-badge-row">
                          {addr.isDefault ? (
                            <span className="default-tag">✦ DEFAULT DESTINATION</span>
                          ) : (
                            <span className="destination-tag">DESTINATION</span>
                          )}
                        </div>

                        <strong className="addr-street">{addr.street}</strong>
                        <p className="addr-location">{addr.city}, {addr.state} - {addr.pincode}</p>

                        <div className="addr-quick-actions">
                          <button type="button" onClick={() => { handleEditAddress(addr); setShowAddressForm(true); }} className="addr-action-btn edit">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span>Edit</span>
                          </button>
                          {!addr.isDefault && (
                            <button type="button" onClick={() => handleSetDefaultAddress(addr)} className="addr-action-btn default-btn">
                              Set as Default
                            </button>
                          )}
                          <button type="button" onClick={() => handleDeleteAddress(addr._id)} className="addr-action-btn delete">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="account-page-v2">
      {/* Back button for desktop/tablet */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Mobile Luxury Account Header */}
      <div className="mobile-account-header">
        <button onClick={() => navigate(-1)} className="mobile-back-btn" aria-label="Go Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="mobile-header-user">
          <div className="mobile-header-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="mobile-header-info">
            <span className="mobile-user-name">{user?.name || 'Valued Client'}</span>
            <span className="mobile-user-badge">✦ SEEMEE Member</span>
          </div>
        </div>
        <button className="mobile-logout-btn" onClick={() => { logout(); navigate('/'); }} title="Sign Out" aria-label="Sign Out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Mobile Horizontal Segmented Tab Bar */}
      <div className="mobile-segmented-tabbar">
        <div className="mobile-tab-scroll-container">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-tab-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <span className="mobile-tab-icon">{item.icon}</span>
              <span className="mobile-tab-label">{item.label}</span>
              {item.badge !== null && <span className="mobile-tab-badge">{item.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="account-wrapper">
        {/* Navigation Sidebar (Desktop/Tablet) */}
        <aside className="account-nav-sidebar">
          <div className="nav-profile-card">
            <div className="nav-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div className="nav-user-info">
              <h3>{user?.name || 'Valued Client'}</h3>
              <p>✦ SEEMEE MEMBER</p>
            </div>
          </div>

          <nav className="side-navigation">
            {menuItems.map((item) => (
              <button 
                key={item.id} 
                className={`side-nav-item ${activeTab === item.id ? 'active' : ''}`} 
                onClick={() => { 
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                <div className="side-nav-icon-box">{item.icon}</div>
                <span className="side-nav-label">{item.label}</span>
                {item.badge !== null && <span className="side-nav-badge">{item.badge}</span>}
                <div className="side-nav-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </button>
            ))}
            <div className="nav-spacer"></div>
            <button className="side-nav-item logout" onClick={() => { logout(); navigate('/'); }}>
              <div className="side-nav-icon-box logout-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <span className="side-nav-label">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="account-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
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
