import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest } from '../utils/apiClient'
import { API_ENDPOINTS } from '../config/api'
import './CouponsManager.css'

const CouponsManager = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'expired' | 'upcoming' | 'disabled'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [toast, setToast] = useState(null)
  const [viewingUsage, setViewingUsage] = useState(null)

  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')

  const initialFormState = {
    code: '',
    description: '',
    discountType: 'percentage',
    percentage: 10,
    fixedAmount: 500,
    minimumOrder: 0,
    maximumDiscount: '',
    usageLimit: '',
    perUserLimit: 1,
    applicableCategories: '',
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    freeShipping: false,
    firstOrderOnly: false,
    isActive: true,
    targetAudience: 'all', // 'all' | 'selected'
    allowedUsers: []
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchCoupons()
  }, [search, statusFilter])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleCopyCode = (code) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code)
      showToast(`Copied "${code}" to clipboard!`, 'success')
    }
  }

  const fetchCustomers = async () => {
    if (customers.length > 0) return
    try {
      setLoadingCustomers(true)
      const data = await apiRequest(API_ENDPOINTS.ADMIN.CUSTOMERS, { auth: true })
      if (data.success && Array.isArray(data.data)) {
        setCustomers(data.data)
      }
    } catch (err) {
      console.error('Error fetching customer list:', err)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams({
        search,
        status: statusFilter
      }).toString()

      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.COUPONS}?${query}`, {
        auth: true
      })
      if (data.success && Array.isArray(data.data)) {
        setCoupons(data.data)
      } else if (data.message) {
        showToast(data.message, 'error')
      }
    } catch (err) {
      console.error('Error fetching coupons:', err)
      showToast(err.message || 'Failed to load coupons', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingCoupon(null)
    setFormData(initialFormState)
    setCustomerSearch('')
    setIsModalOpen(true)
    fetchCustomers()
  }

  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon)
    const allowedUserIds = (coupon.allowedUsers || []).map(u => typeof u === 'object' ? u._id : u)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      percentage: coupon.percentage || 0,
      fixedAmount: coupon.fixedAmount || 0,
      minimumOrder: coupon.minimumOrder || 0,
      maximumDiscount: coupon.maximumDiscount || '',
      usageLimit: coupon.usageLimit !== null ? coupon.usageLimit : '',
      perUserLimit: coupon.perUserLimit || 1,
      applicableCategories: (coupon.applicableCategories || []).join(', '),
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : '',
      freeShipping: coupon.freeShipping || false,
      firstOrderOnly: coupon.firstOrderOnly || false,
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      targetAudience: coupon.targetAudience || (allowedUserIds.length > 0 ? 'selected' : 'all'),
      allowedUsers: allowedUserIds
    })
    setCustomerSearch('')
    setIsModalOpen(true)
    fetchCustomers()
  }

  const handleToggleStatus = async (coupon) => {
    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.COUPONS}/${coupon._id}/status`, {
        method: 'PATCH',
        auth: true,
        body: { isActive: !coupon.isActive }
      })
      if (data.success) {
        showToast(data.message || 'Status updated')
        fetchCoupons()
      } else {
        showToast(data.message || 'Error updating status', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error toggling status', 'error')
    }
  }

  const handleDuplicate = async (couponId) => {
    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.COUPONS}/${couponId}/duplicate`, {
        method: 'POST',
        auth: true
      })
      if (data.success) {
        showToast(data.message || 'Coupon duplicated')
        fetchCoupons()
      } else {
        showToast(data.message || 'Error duplicating coupon', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error duplicating coupon', 'error')
    }
  }

  const handleDelete = async (couponId, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return
    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.COUPONS}/${couponId}`, {
        method: 'DELETE',
        auth: true
      })
      if (data.success) {
        showToast(data.message || 'Coupon deleted')
        fetchCoupons()
      } else {
        showToast(data.message || 'Error deleting coupon', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error deleting coupon', 'error')
    }
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!formData.code.trim()) {
      showToast('Coupon code is required', 'error')
      return
    }

    if (formData.targetAudience === 'selected' && (!formData.allowedUsers || formData.allowedUsers.length === 0)) {
      showToast('Please select at least one customer for a targeted coupon', 'error')
      return
    }

    const payload = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      percentage: Number(formData.percentage) || 0,
      fixedAmount: Number(formData.fixedAmount) || 0,
      minimumOrder: Number(formData.minimumOrder) || 0,
      maximumDiscount: formData.maximumDiscount !== '' ? Number(formData.maximumDiscount) : null,
      usageLimit: formData.usageLimit !== '' ? Number(formData.usageLimit) : null,
      perUserLimit: Number(formData.perUserLimit) || 1,
      applicableCategories: formData.applicableCategories
        ? formData.applicableCategories.split(',').map(c => c.trim()).filter(Boolean)
        : [],
      targetAudience: formData.targetAudience,
      allowedUsers: formData.targetAudience === 'selected' ? formData.allowedUsers : []
    }

    try {
      const url = editingCoupon ? `${API_ENDPOINTS.ADMIN.COUPONS}/${editingCoupon._id}` : API_ENDPOINTS.ADMIN.COUPONS
      const method = editingCoupon ? 'PUT' : 'POST'

      const data = await apiRequest(url, {
        method,
        auth: true,
        body: payload
      })

      if (data.success) {
        showToast(data.message || 'Saved successfully!')
        setIsModalOpen(false)
        fetchCoupons()
      } else {
        showToast(data.message || 'Save failed', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Error saving coupon', 'error')
    }
  }

  // Statistics Calculation
  const totalCoupons = coupons.length
  const activeCouponsCount = coupons.filter(c => c.isActive && new Date(c.expiryDate) >= new Date()).length
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)

  return (
    <div className="admin-coupons-container">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`admin-coupon-toast ${toast.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Main Controls */}
      <header className="coupons-header-section">
        <div className="header-title-block">
          <span className="coupons-badge">✦ PROMOTIONS & MARKETING</span>
          <h1 className="coupons-title">Coupon Management</h1>
          <p className="coupons-subtitle">Create, configure, and monitor customer discount codes & white-glove offer campaigns.</p>
        </div>

        <button className="btn-create-coupon" onClick={handleOpenCreateModal}>
          <span>+ Create New Coupon</span>
        </button>
      </header>

      {/* Analytics KPI Stat Cards */}
      <div className="coupons-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL COUPONS</span>
          <span className="kpi-val">{totalCoupons}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">ACTIVE CAMPAIGNS</span>
          <span className="kpi-val active">{activeCouponsCount}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">TOTAL REDEMPTIONS</span>
          <span className="kpi-val gold">{totalRedemptions}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="coupons-toolbar-row">
        <div className="search-box-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by coupon code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')} aria-label="Clear search">✕</button>
          )}
        </div>

        <div className="filter-tabs-row">
          {['all', 'active', 'expired', 'upcoming', 'disabled'].map(tab => (
            <button
              key={tab}
              className={`filter-tab-btn ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table & Mobile Card List */}
      <div className="coupons-table-card">
        {loading ? (
          <div className="coupons-loading-box">
            <div className="spinner"></div>
            <span>Loading promotions...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="coupons-empty-box">
            <span>🎁</span>
            <h3>No Coupons Found</h3>
            <p>Create your first discount coupon to launch a promotion campaign.</p>
            <button className="btn-create-coupon inline-empty-btn" onClick={handleOpenCreateModal}>
              + Create Coupon
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-responsive coupons-desktop-table">
              <table className="coupons-table">
                <thead>
                  <tr>
                    <th>CODE</th>
                    <th>TYPE & VALUE</th>
                    <th>MIN ORDER</th>
                    <th>USAGE COUNT</th>
                    <th>EXPIRY DATE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => {
                    const isExpired = new Date(coupon.expiryDate) < new Date()
                    const isUpcoming = new Date(coupon.startDate) > new Date()

                    return (
                      <tr key={coupon._id}>
                        <td className="col-code">
                          <span
                            className="code-chip"
                            title="Click to copy code"
                            onClick={() => handleCopyCode(coupon.code)}
                          >
                            ✦ {coupon.code}
                          </span>
                          {coupon.description && <span className="desc-sub">{coupon.description}</span>}
                        </td>

                        <td className="col-type">
                          <span className="type-name">
                            {coupon.discountType === 'percentage' && `${coupon.percentage}% OFF`}
                            {coupon.discountType === 'fixedAmount' && `₹${coupon.fixedAmount} OFF`}
                            {coupon.discountType === 'freeShipping' && 'FREE SHIPPING'}
                            {coupon.discountType === 'buyXgetY' && 'BUY X GET Y'}
                          </span>
                          {coupon.maximumDiscount > 0 && (
                            <span className="cap-sub">Max Cap: ₹{coupon.maximumDiscount}</span>
                          )}
                          {coupon.targetAudience === 'selected' || (coupon.allowedUsers && coupon.allowedUsers.length > 0) ? (
                            <span className="audience-badge selected" title={`Assigned to ${coupon.allowedUsers?.length || 0} customer(s)`}>
                              🎯 Targeted ({coupon.allowedUsers?.length || 0} Users)
                            </span>
                          ) : (
                            <span className="audience-badge all">🌐 All Users</span>
                          )}
                        </td>

                        <td>₹{(coupon.minimumOrder || 0).toLocaleString('en-IN')}</td>

                        <td>
                          <span className="usage-count">
                            {coupon.usedCount || 0} / {coupon.usageLimit !== null ? coupon.usageLimit : '∞'}
                          </span>
                        </td>

                        <td>{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</td>

                        <td>
                          <button
                            className={`status-toggle-badge ${
                              !coupon.isActive ? 'disabled' : isExpired ? 'expired' : isUpcoming ? 'upcoming' : 'active'
                            }`}
                            onClick={() => handleToggleStatus(coupon)}
                          >
                            {!coupon.isActive ? 'Disabled' : isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : 'Active ✓'}
                          </button>
                        </td>

                        <td className="col-actions">
                          <button className="btn-action edit" onClick={() => handleOpenEditModal(coupon)} title="Edit">
                            ✎
                          </button>
                          <button className="btn-action dup" onClick={() => handleDuplicate(coupon._id)} title="Duplicate">
                            📋
                          </button>
                          <button className="btn-action del" onClick={() => handleDelete(coupon._id, coupon.code)} title="Delete">
                            🗑
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Feed */}
            <div className="coupons-mobile-cards">
              {coupons.map(coupon => {
                const isExpired = new Date(coupon.expiryDate) < new Date()
                const isUpcoming = new Date(coupon.startDate) > new Date()
                const usagePercent = coupon.usageLimit ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.usageLimit) * 100)) : 0

                return (
                  <div className="coupon-mobile-card" key={coupon._id}>
                    <div className="mobile-card-top">
                      <div className="code-badge-wrap">
                        <span
                          className="code-chip"
                          title="Tap to copy code"
                          onClick={() => handleCopyCode(coupon.code)}
                        >
                          ✦ {coupon.code}
                        </span>
                        <span className="mobile-discount-badge">
                          {coupon.discountType === 'percentage' && `${coupon.percentage}% OFF`}
                          {coupon.discountType === 'fixedAmount' && `₹${coupon.fixedAmount} OFF`}
                          {coupon.discountType === 'freeShipping' && 'FREE SHIPPING'}
                          {coupon.discountType === 'buyXgetY' && 'BUY X GET Y'}
                        </span>
                      </div>

                      <button
                        className={`status-toggle-badge ${
                          !coupon.isActive ? 'disabled' : isExpired ? 'expired' : isUpcoming ? 'upcoming' : 'active'
                        }`}
                        onClick={() => handleToggleStatus(coupon)}
                      >
                        {!coupon.isActive ? 'Disabled' : isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : 'Active ✓'}
                      </button>
                    </div>

                    {coupon.description && <p className="mobile-card-desc">{coupon.description}</p>}

                    <div className="mobile-card-stats-grid">
                      <div className="m-stat-box">
                        <span className="m-stat-label">MIN ORDER</span>
                        <span className="m-stat-val">₹{(coupon.minimumOrder || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="m-stat-box">
                        <span className="m-stat-label">USAGE</span>
                        <span className="m-stat-val">
                          {coupon.usedCount || 0} / {coupon.usageLimit !== null ? coupon.usageLimit : '∞'}
                        </span>
                      </div>

                      <div className="m-stat-box">
                        <span className="m-stat-label">EXPIRY</span>
                        <span className="m-stat-val">{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>

                    {coupon.usageLimit > 0 && (
                      <div className="mobile-usage-progress">
                        <div className="progress-info">
                          <span>Redemption Capacity</span>
                          <span>{usagePercent}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${usagePercent}%` }}></div>
                        </div>
                      </div>
                    )}

                    <div className="mobile-card-tags">
                      {coupon.targetAudience === 'selected' || (coupon.allowedUsers && coupon.allowedUsers.length > 0) ? (
                        <span className="m-tag purple">🎯 Targeted ({coupon.allowedUsers?.length || 0} Users)</span>
                      ) : (
                        <span className="m-tag gray">🌐 All Users</span>
                      )}
                      {coupon.freeShipping && <span className="m-tag gold">Free Shipping</span>}
                      {coupon.firstOrderOnly && <span className="m-tag blue">First Order Only</span>}
                      {coupon.applicableCategories?.map(cat => (
                        <span className="m-tag gray" key={cat}>{cat}</span>
                      ))}
                    </div>

                    <div className="mobile-card-actions">
                      <button className="m-action-btn edit" onClick={() => handleOpenEditModal(coupon)}>
                        <span>✎ Edit</span>
                      </button>
                      <button className="m-action-btn dup" onClick={() => handleDuplicate(coupon._id)}>
                        <span>📋 Duplicate</span>
                      </button>
                      <button className="m-action-btn del" onClick={() => handleDelete(coupon._id, coupon.code)}>
                        <span>🗑 Delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) for Mobile Quick Create */}
      <button
        className="mobile-fab-create-coupon"
        onClick={handleOpenCreateModal}
        aria-label="Create Coupon"
        title="Create New Coupon"
      >
        <span>+</span>
      </button>

      {/* Create / Edit Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <motion.div
              className="admin-coupon-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}</h3>
                <button className="btn-close-x" onClick={() => setIsModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmitForm} className="admin-coupon-form">
                {/* Target Audience Section */}
                <div className="form-group audience-selection-group">
                  <label className="audience-group-label">Target Audience *</label>
                  <div className="audience-toggle-row">
                    <button
                      type="button"
                      className={`audience-toggle-btn ${formData.targetAudience === 'all' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, targetAudience: 'all' })}
                    >
                      <span className="audience-icon">🌐</span>
                      <div className="audience-text">
                        <strong>All Customers</strong>
                        <small>Public promo code for all shoppers</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`audience-toggle-btn ${formData.targetAudience === 'selected' ? 'active' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, targetAudience: 'selected' })
                        fetchCustomers()
                      }}
                    >
                      <span className="audience-icon">🎯</span>
                      <div className="audience-text">
                        <strong>Selected Users Only</strong>
                        <small>Exclusive offer for specific customers</small>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Customer Multi-Selector Box */}
                {formData.targetAudience === 'selected' && (
                  <div className="selected-users-manager">
                    <div className="users-manager-header">
                      <span className="users-manager-title">
                        Assign Customer(s) ({formData.allowedUsers.length} Selected)
                      </span>
                      <div className="users-manager-actions">
                        <input
                          type="text"
                          className="user-search-input"
                          placeholder="🔍 Search customer name, email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Selected User Chips */}
                    {formData.allowedUsers.length > 0 && (
                      <div className="selected-user-chips-row">
                        {formData.allowedUsers.map(uId => {
                          const userObj = customers.find(c => String(c._id) === String(uId))
                          const name = userObj ? userObj.name : 'User'
                          const email = userObj ? userObj.email : uId
                          return (
                            <span key={uId} className="user-chip">
                              <span className="chip-avatar">👤</span> {name} ({email})
                              <button
                                type="button"
                                className="chip-remove-btn"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    allowedUsers: prev.allowedUsers.filter(id => String(id) !== String(uId))
                                  }))
                                }}
                              >✕</button>
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Customer Selection Scroll List */}
                    <div className="customer-selection-list">
                      {loadingCustomers ? (
                        <div className="customer-list-status">Loading customers list...</div>
                      ) : customers.length === 0 ? (
                        <div className="customer-list-status">No registered customers found.</div>
                      ) : (
                        customers
                          .filter(c => {
                            if (!customerSearch.trim()) return true
                            const q = customerSearch.toLowerCase()
                            return (
                              (c.name && c.name.toLowerCase().includes(q)) ||
                              (c.email && c.email.toLowerCase().includes(q)) ||
                              (c.phone && c.phone.includes(q))
                            )
                          })
                          .map(c => {
                            const isSelected = formData.allowedUsers.some(id => String(id) === String(c._id))
                            return (
                              <label key={c._id} className={`customer-item ${isSelected ? 'selected' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({ ...prev, allowedUsers: [...prev.allowedUsers, c._id] }))
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        allowedUsers: prev.allowedUsers.filter(id => String(id) !== String(c._id))
                                      }))
                                    }
                                  }}
                                />
                                <div className="cust-info">
                                  <span className="cust-name">{c.name || 'Customer'}</span>
                                  <span className="cust-email">{c.email} {c.phone ? `• ${c.phone}` : ''}</span>
                                </div>
                                {isSelected && <span className="cust-check-badge">Selected ✓</span>}
                              </label>
                            )
                          })
                      )}
                    </div>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FESTIVE20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Discount Type *</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixedAmount">Fixed Amount Discount (₹)</option>
                      <option value="freeShipping">Free Express Shipping</option>
                      <option value="buyXgetY">Buy X Get Y Free</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Short description displayed to customers"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {formData.discountType === 'percentage' && (
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Percentage Off (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.percentage}
                        onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Maximum Discount Cap (₹) (Optional)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        value={formData.maximumDiscount}
                        onChange={(e) => setFormData({ ...formData, maximumDiscount: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {formData.discountType === 'fixedAmount' && (
                  <div className="form-group">
                    <label>Fixed Discount Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.fixedAmount}
                      onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Minimum Order Threshold (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minimumOrder}
                      onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Usage Limit (Blank for Unlimited)</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Per-User Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.perUserLimit}
                      onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Applicable Categories (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. anarkali, palazzo"
                      value={formData.applicableCategories}
                      onChange={(e) => setFormData({ ...formData, applicableCategories: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-checkboxes-row">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.freeShipping}
                      onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
                    />
                    <span>Grant Free Shipping</span>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.firstOrderOnly}
                      onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                    />
                    <span>First Order Only</span>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Active Status</span>
                  </label>
                </div>

                <div className="modal-footer-row">
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-save">{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CouponsManager
