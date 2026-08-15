import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './OrdersManager.css'

const OrdersManager = ({ targetOrderId, onClearTargetOrder }) => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportStep, setExportStep] = useState('options')
  const [exportRange, setExportRange] = useState('filtered')
  const [exportFormat, setExportFormat] = useState('csv')
  const [exportProgressText, setExportProgressText] = useState('')

  // Ad2Ship Logistics States
  const [ad2shipLoading, setAd2shipLoading] = useState(false)
  const [ad2shipPartners, setAd2shipPartners] = useState([])
  const [selectedCourierId, setSelectedCourierId] = useState('')
  const [trackingModalData, setTrackingModalData] = useState(null)

  // Refund Management States
  const [refunds, setRefunds] = useState([])
  const [refundProcessingId, setRefundProcessingId] = useState(null)
  const [codActionLoading, setCodActionLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchRefunds()
  }, [])

  const handleApproveCod = async (orderId) => {
    if (!window.confirm('Are you sure you want to approve COD for this offline order?')) return
    setCodActionLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.APPROVE_COD(orderId), {
        method: 'PUT',
        auth: true
      })
      if (data.success) {
        showNotification('Offline COD Payment Approved successfully!')
        fetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data)
        }
      } else {
        showNotification(data.message || 'COD Approval failed', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'COD Approval failed', 'error')
    } finally {
      setCodActionLoading(false)
    }
  }

  const handleRejectCod = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject COD for this offline order?')) return
    setCodActionLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.REJECT_COD(orderId), {
        method: 'PUT',
        auth: true
      })
      if (data.success) {
        showNotification('Offline COD Payment Rejected.')
        fetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data)
        }
      } else {
        showNotification(data.message || 'COD Rejection failed', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'COD Rejection failed', 'error')
    } finally {
      setCodActionLoading(false)
    }
  }

  useEffect(() => {
    if (targetOrderId && orders.length > 0) {
      const match = orders.find(o => String(o._id) === String(targetOrderId) || String(o.orderNumber) === String(targetOrderId))
      if (match) {
        setSelectedOrder(match)
      } else {
        apiRequest(`${API_ENDPOINTS.ORDERS}/${targetOrderId}`, { auth: true })
          .then(res => {
            if (res.success && res.data) setSelectedOrder(res.data)
          })
          .catch(e => console.warn('Direct target order fetch error:', e.message))
      }
    }
  }, [targetOrderId, orders])

  const fetchRefunds = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.REFUNDS, { auth: true })
      if (data.success) {
        setRefunds(data.data)
      }
    } catch (err) {
      console.error('Error fetching refunds:', err)
    }
  }

  const handleApproveRefund = async (refundId) => {
    if (!window.confirm('Are you sure you want to approve this refund? The payment gateway will process the refund to the customer.')) return
    setRefundProcessingId(refundId)
    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.REFUND_APPROVE(refundId), {
        method: 'POST',
        auth: true
      })
      if (data.success) {
        showNotification('Refund approved and processed via Razorpay!')
        fetchOrders()
        fetchRefunds()
        if (selectedOrder) {
          setSelectedOrder(data.order || { ...selectedOrder, refundStatus: 'refunded', status: 'refunded', paymentStatus: 'refunded' })
        }
      } else {
        showNotification(data.message || 'Refund approval failed', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'Refund approval failed', 'error')
    } finally {
      setRefundProcessingId(null)
    }
  }

  const handleRejectRefund = async (refundId) => {
    const reason = window.prompt('Enter reason for rejecting refund (optional):', 'Order does not meet refund policy conditions')
    if (reason === null) return

    setRefundProcessingId(refundId)
    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.REFUND_REJECT(refundId), {
        method: 'POST',
        auth: true,
        body: { adminNote: reason }
      })
      if (data.success) {
        showNotification('Refund request rejected.')
        fetchOrders()
        fetchRefunds()
        if (selectedOrder) {
          setSelectedOrder(data.order || { ...selectedOrder, refundStatus: 'refund_rejected' })
        }
      } else {
        showNotification(data.message || 'Refund rejection failed', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'Refund rejection failed', 'error')
    } finally {
      setRefundProcessingId(null)
    }
  }

  const handleCalculateRate = async (order) => {
    if (!order.customer?.address?.pincode) {
      showNotification('Pincode missing for this order address', 'error')
      return
    }
    setAd2shipLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.SHIPPING.RATE, {
        method: 'POST',
        body: {
          deliveryPincode: order.customer.address.pincode,
          paymentType: order.paymentMethod === 'cod' ? 'cod' : 'prepaid',
          items: order.items.map(i => ({ product: i.product?._id || i.product, quantity: i.quantity, price: i.price })),
          invoiceAmount: order.totalAmount
        }
      })
      if (data.success && data.data?.partners?.length > 0) {
        setAd2shipPartners(data.data.partners)
        setSelectedCourierId(String(data.data.partners[0].id))
        showNotification(`Found ${data.data.partners.length} available courier partners!`)
      } else {
        showNotification(data.message || 'No serviceable partners found', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'Rate calculation failed', 'error')
    } finally {
      setAd2shipLoading(false)
    }
  }

  const handleCreateAd2ShipOrder = async (orderId) => {
    setAd2shipLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.SHIPPING.CREATE, {
        method: 'POST',
        auth: true,
        body: { orderId }
      })
      if (data.success) {
        showNotification('Ad2Ship order initialized!')
        fetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data)
        }
      } else {
        showNotification(data.message || 'Failed to create Ad2Ship order', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'Creation failed', 'error')
    } finally {
      setAd2shipLoading(false)
    }
  }

  const handleShipOrder = async (orderId) => {
    if (!selectedCourierId) {
      showNotification('Please select a courier partner first', 'error')
      return
    }
    setAd2shipLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.SHIPPING.SHIP, {
        method: 'POST',
        auth: true,
        body: { orderId, courierPartnerId: Number(selectedCourierId) }
      })
      if (data.success) {
        showNotification(`Shipment dispatched! AWB: ${data.shipping?.awbNumber || ''}`)
        fetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data)
        }
      } else {
        showNotification(data.message || 'Shipment failed', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'Shipment failed', 'error')
    } finally {
      setAd2shipLoading(false)
    }
  }

  const handleGenerateDocument = async (orderId, type) => {
    if (selectedOrder && !selectedOrder.shipping?.awbNumber) {
      showNotification('Please ship the order & assign AWB first before generating documents', 'error')
      return
    }

    setAd2shipLoading(true)
    try {
      const endpoint = type === 'label' ? API_ENDPOINTS.SHIPPING.LABEL : type === 'invoice' ? API_ENDPOINTS.SHIPPING.INVOICE : API_ENDPOINTS.SHIPPING.MANIFEST
      const data = await apiRequest(endpoint, {
        method: 'POST',
        auth: true,
        body: { orderId }
      })
      if (data.success) {
        showNotification(`${type.toUpperCase()} generated successfully!`)
        if (data.labelUrl) window.open(data.labelUrl, '_blank')
        if (data.invoiceUrl) window.open(data.invoiceUrl, '_blank')
        if (data.manifestUrl) window.open(data.manifestUrl, '_blank')
        fetchOrders()
      } else {
        showNotification(data.message || `Failed to generate ${type}`, 'error')
      }
    } catch (err) {
      showNotification(err.message || `Document generation failed`, 'error')
    } finally {
      setAd2shipLoading(false)
    }
  }

  const handleTrackShipment = async (order) => {
    const awb = order.shipping?.awbNumber || order.trackingNumber
    const ad2shipId = order.shipping?.ad2shipOrderId
    if (!awb && !ad2shipId) {
      showNotification('No AWB or Ad2Ship Order ID found for tracking', 'error')
      return
    }
    setAd2shipLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.SHIPPING.TRACK, {
        method: 'POST',
        body: { awbNumber: awb, orderId: order._id }
      })
      if (data.success) {
        setTrackingModalData(data.data)
      } else {
        showNotification(data.message || 'Tracking failed', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'Tracking failed', 'error')
    } finally {
      setAd2shipLoading(false)
    }
  }

  const handleCancelShipment = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this shipment?')) return
    setAd2shipLoading(true)
    try {
      const data = await apiRequest(API_ENDPOINTS.SHIPPING.CANCEL, {
        method: 'POST',
        auth: true,
        body: { orderId }
      })
      if (data.success) {
        showNotification('Shipment cancelled successfully!')
        fetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data)
        }
      } else {
        showNotification(data.message || 'Cancellation failed', 'error')
      }
    } catch (err) {
      showNotification(err.message || 'Cancellation failed', 'error')
    } finally {
      setAd2shipLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ORDERS, { auth: true })
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, note = '') => {
    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        auth: true,
        body: { status: newStatus, note }
      })

      if (data.success) {
        fetchOrders()
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.data)
        }
        showNotification('Order status updated!')
      }
    } catch (error) {
      showNotification(error.message || 'Failed to update status', 'error')
    }
  }

  const updateTracking = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const trackingData = {
      trackingNumber: formData.get('trackingNumber'),
      estimatedDelivery: formData.get('estimatedDelivery'),
      status: selectedOrder.status,
      note: `Tracking information updated: ${formData.get('trackingNumber')}`
    }

    try {
      const data = await apiRequest(`${API_ENDPOINTS.ADMIN.BASE}/orders/${selectedOrder._id}/status`, {
        method: 'PUT',
        auth: true,
        body: trackingData
      })

      if (data.success) {
        fetchOrders()
        setSelectedOrder(data.data)
        showNotification('Tracking info updated!')
      }
    } catch (error) {
      showNotification('Failed to update tracking', 'error')
    }
  }

  const printInvoice = () => {
    const printContent = document.getElementById('invoice-printable').innerHTML
    const win = window.open('', '', 'height=700,width=900')
    win.document.write('<html><head><title>Invoice - SeeMee</title>')
    win.document.write('<style>body{font-family:sans-serif;padding:40px;} .header{display:flex;justify-content:space-between;margin-bottom:40px;} .table{width:100%;border-collapse:collapse;} .table th,.table td{border:1px solid #eee;padding:12px;text-align:left;} .total-box{margin-top:30px;text-align:right;} .badge{padding:4px 8px;border-radius:4px;font-size:12px;text-transform:uppercase;}</style>')
    win.document.write('</head><body>')
    win.document.write(printContent)
    win.document.write('</body></html>')
    win.document.close()
    win.print()
  }

  const openExportModal = () => {
    setExportStep('options')
    setExportRange('filtered')
    setExportFormat('csv')
    setIsExportModalOpen(true)
  }

  const triggerExportGeneration = () => {
    setExportStep('generating')

    const steps = [
      'Establishing secure ledger synthesis sequence...',
      'Serializing customer purchase metrics...',
      'Compiling cryptographic archive metadata...',
      'Ledger payload fully structured and sealed.'
    ]

    let currentStep = 0
    setExportProgressText(steps[0])

    const interval = setInterval(() => {
      currentStep++
      if (currentStep < steps.length) {
        setExportProgressText(steps[currentStep])
      } else {
        clearInterval(interval)
        performLedgerDownload()
        setExportStep('success')
        showNotification('Ledger compiled successfully!')
      }
    }, 600)
  }

  const performLedgerDownload = () => {
    const listToExport = exportRange === 'filtered' ? visibleOrders : orders

    if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(listToExport, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders_ledger_${new Date().toISOString().split('T')[0]}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Amount', 'Status', 'Payment Method']
      const rows = listToExport.map(o => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString(),
        o.customer?.name || '',
        o.customer?.email || '',
        o.totalAmount,
        o.status,
        o.paymentMethod
      ])

      const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const filteredOrders = orders
    .filter(order => {
      if (orderTypeFilter === 'ONLINE') return String(order.orderType || 'ONLINE').toUpperCase() === 'ONLINE'
      if (orderTypeFilter === 'OFFLINE') return String(order.orderType || '').toUpperCase() === 'OFFLINE'
      return true
    })
    .filter(order => {
      if (filter === 'all') return true
      if (filter === 'refund_requested') return order.refundStatus === 'refund_requested' || order.status === 'refunded'
      return order.status === filter
    })

  const visibleOrders = filteredOrders.filter((order) => {
    const haystack = [
      order.orderNumber,
      order.customer?.name,
      order.customer?.email,
      order.customer?.phone
    ].join(' ').toLowerCase()
    return haystack.includes(searchTerm.toLowerCase())
  })

  // Executive KPI summary calculations
  const totalOrdersCount = orders.length
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const shippedCount = orders.filter(o => o.status === 'shipped').length
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)

  return (
    <div className="orders-manager">
      {/* Header & KPI Summary Cards */}
      <div className="manager-header">
        <div className="header-actions">
          <button className="export-btn" onClick={openExportModal}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export Ledger
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="orders-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL ORDERS</span>
            <h3 className="kpi-value">{totalOrdersCount}</h3>
            <span className="kpi-subtext">Lifetime register</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">PENDING / TAILORING</span>
            <h3 className="kpi-value">{pendingCount}</h3>
            <span className="kpi-subtext">Requires fulfillment</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">IN TRANSIT</span>
            <h3 className="kpi-value">{shippedCount}</h3>
            <span className="kpi-subtext">Dispatched shipments</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">GROSS REVENUE</span>
            <h3 className="kpi-value">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            <span className="kpi-subtext">Active orders volume</span>
          </div>
        </div>
      </div>

      <div className="orders-toolbar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            className="orders-search"
            type="search"
            placeholder="Search by Order #, Customer name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="order-type-channel-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
          <button
            type="button"
            className={`channel-tab ${orderTypeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setOrderTypeFilter('all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: orderTypeFilter === 'all' ? '1.5px solid #d4af37' : '1px solid #333',
              background: orderTypeFilter === 'all' ? '#d4af37' : '#1c1917',
              color: orderTypeFilter === 'all' ? '#000' : '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            All Orders ({orders.length})
          </button>
          <button
            type="button"
            className={`channel-tab ${orderTypeFilter === 'ONLINE' ? 'active' : ''}`}
            onClick={() => setOrderTypeFilter('ONLINE')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: orderTypeFilter === 'ONLINE' ? '1.5px solid #3b82f6' : '1px solid #333',
              background: orderTypeFilter === 'ONLINE' ? '#2563eb' : '#1c1917',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>🌐</span>
            <span>Online Orders ({orders.filter(o => String(o.orderType || 'ONLINE').toUpperCase() === 'ONLINE').length})</span>
          </button>
          <button
            type="button"
            className={`channel-tab ${orderTypeFilter === 'OFFLINE' ? 'active' : ''}`}
            onClick={() => setOrderTypeFilter('OFFLINE')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: orderTypeFilter === 'OFFLINE' ? '1.5px solid #10b981' : '1px solid #333',
              background: orderTypeFilter === 'OFFLINE' ? '#059669' : '#1c1917',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>🏬</span>
            <span>Offline Orders ({orders.filter(o => String(o.orderType || '').toUpperCase() === 'OFFLINE').length})</span>
          </button>
        </div>

        <div className="filters-row">
          {['all', 'refund_requested', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              <span className={`status-dot ${status}`} />
              <span className="tab-name">{status === 'refund_requested' ? 'Refund Requests' : status}</span>
              <span className="count">
                {status === 'all'
                  ? filteredOrders.length
                  : status === 'refund_requested'
                    ? filteredOrders.filter(o => o.refundStatus === 'refund_requested' || o.status === 'refunded').length
                    : filteredOrders.filter(o => o.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="orders-table-container premium-card desktop-only-table">
        {visibleOrders.length === 0 ? (
          <div className="no-orders-state">
            <div className="empty-icon">📦</div>
            <h3>No matching orders found</h3>
            <p>Try adjusting your search criteria or status filter</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Channel</th>
                <th>Items Preview</th>
                <th>Customer</th>
                <th>Placement Date</th>
                <th>Payment</th>
                <th>Fulfillment Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className="order-id-cell">
                      <span className="order-num">#{order.orderNumber}</span>
                      <span className="item-count">{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                      background: String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                      color: String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? '#059669' : '#2563eb',
                      border: `1.5px solid ${String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? '#10b981' : '#3b82f6'}`
                    }}>
                      <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? '🏬' : '🌐'}</span>
                      <span>{String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'}</span>
                    </span>
                  </td>
                  <td>
                    <div className="order-items-thumb-stack">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="mini-thumb-wrap" title={`${item.name} (${item.size})`}>
                          <img src={getImageUrl(item.image)} alt={item.name} />
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <span className="thumb-more-count">+{order.items.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar-circle">
                        {order.customer?.name ? order.customer.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="customer-text-meta">
                        <h4>{order.customer?.name || 'Guest Customer'}</h4>
                        <p>{order.customer?.email || order.customer?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <strong>{new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}</strong>
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`payment-badge ${order.paymentMethod === 'cod' ? 'cod' : 'paid'}`}>
                        <span className="pay-dot" />
                        {(order.paymentMethod || 'online').toUpperCase()} ({(order.paymentStatus || 'pending').toUpperCase()})
                      </span>
                      {String(order.orderType || '').toUpperCase() === 'OFFLINE' && String(order.paymentMethod || '').toLowerCase() === 'cod' && (
                        <div>
                          {String(order.paymentStatus || '').toLowerCase() === 'pending' && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                              <button
                                type="button"
                                disabled={codActionLoading}
                                onClick={(e) => { e.stopPropagation(); handleApproveCod(order._id); }}
                                style={{ padding: '2px 8px', fontSize: '0.72rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Approve COD
                              </button>
                              <button
                                type="button"
                                disabled={codActionLoading}
                                onClick={(e) => { e.stopPropagation(); handleRejectCod(order._id); }}
                                style={{ padding: '2px 8px', fontSize: '0.72rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Reject COD
                              </button>
                            </div>
                          )}
                          {String(order.paymentStatus || '').toLowerCase() === 'paid' && (
                            <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 'bold' }}>
                              ✓ Paid {order.approvedBy?.name ? `(${order.approvedBy.name})` : ''}
                            </span>
                          )}
                          {String(order.paymentStatus || '').toLowerCase() === 'rejected' && (
                            <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 'bold' }}>
                              ✕ COD Rejected
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${order.status}`}>
                      <span className="status-indicator-dot" />
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span className="amount-cell">₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </td>
                  <td>
                    <button className="manage-btn" onClick={() => setSelectedOrder(order)}>
                      <span>Manage</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Touch Order Card Feed */}
      <div className="mobile-order-card-feed">
        {visibleOrders.map((order) => (
          <div key={order._id} className="mobile-order-card" onClick={() => setSelectedOrder(order)}>
            <div className="mobile-order-card-top">
              <div className="mobile-order-id-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mobile-order-num">#{order.orderNumber}</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    background: String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    color: String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? '#059669' : '#2563eb',
                    border: `1px solid ${String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? '#10b981' : '#3b82f6'}`
                  }}>
                    <span>{String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? '🏬' : '🌐'}</span>
                    <span>{String(order.orderType || 'ONLINE').toUpperCase() === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'}</span>
                  </span>
                </div>
                <span className="mobile-order-date">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short'
                  })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className={`status-pill ${order.status}`}>
                {order.status}
              </span>
            </div>

            <div className="mobile-order-card-body">
              <div className="mobile-customer-info">
                <div className="mobile-customer-avatar">
                  {order.customer?.name ? order.customer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="mobile-customer-text">
                  <h4>{order.customer?.name || 'Customer'}</h4>
                  <p>{order.customer?.phone || order.customer?.email || 'No contact details'}</p>
                </div>
              </div>

              <div className="mobile-order-financials">
                <div className="mobile-order-items-badge">
                  📦 {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                </div>
                <div className="mobile-order-total">
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Item Thumbnail Strip for Mobile */}
            {order.items && order.items.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', padding: '2px 0 6px 0' }}>
                {order.items.slice(0, 4).map((item, idx) => (
                  <div key={idx} style={{ width: '38px', height: '48px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#f4f1ea', border: '1px solid #eae7e0' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                {order.items.length > 4 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#B8860B', background: 'rgba(212, 175, 55, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                    +{order.items.length - 4} more
                  </span>
                )}
              </div>
            )}

            <div className="mobile-order-card-footer">
              <span className={`payment-badge ${order.paymentStatus || 'unpaid'}`}>
                {order.paymentMethod === 'cod' ? 'COD' : 'ONLINE PAID'}
              </span>
              <button className="mobile-manage-btn" onClick={(e) => {
                e.stopPropagation()
                setSelectedOrder(order)
              }}>
                <span>Manage Order</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        ))}
        {visibleOrders.length === 0 && (
          <div className="no-orders-state">
            <div className="empty-icon">📦</div>
            <h3>No orders found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <motion.div
              className="order-detail-modal"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-sidebar-header">
                <div className="header-main">
                  <h2>Order #{selectedOrder.orderNumber}</h2>
                  <span className={`status-pill ${selectedOrder.status}`}>{selectedOrder.status}</span>
                </div>
                <div className="header-actions">
                  <button className="print-btn" onClick={printInvoice}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Print Invoice
                  </button>
                  <button className="close-side-modal" onClick={() => setSelectedOrder(null)}>&times;</button>
                </div>
              </div>

              <div className="modal-scroll-area">
                {/* Hidden Printable Invoice */}
                <div id="invoice-printable" style={{ display: 'none' }}>
                  <div className="header">
                    <div>
                      <h1>SEEMEE</h1>
                      <p>Order #{selectedOrder.orderNumber}</p>
                      <p>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3>Customer</h3>
                      <p>{selectedOrder.customer.name}</p>
                      <p>{selectedOrder.customer.email}</p>
                      <p>{selectedOrder.customer.phone}</p>
                    </div>
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name} (Size: {item.size})</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price}</td>
                          <td>₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="total-box">
                    <h3>Grand Total: ₹{selectedOrder.totalAmount}</h3>
                    <p>Status: <span className="badge">{selectedOrder.status}</span></p>
                  </div>
                </div>

                <div className="modal-sections">
                  <section className="info-section">
                    <h3>Customer Details</h3>
                    <div className="info-card">
                      <div className="user-profile-mini">
                        <div className="avatar">{selectedOrder.customer.name.charAt(0)}</div>
                        <div className="user-text">
                          <h4>{selectedOrder.customer.name}</h4>
                          <p>{selectedOrder.customer.email}</p>
                          <p>{selectedOrder.customer.phone}</p>
                        </div>
                      </div>
                      <div className="address-box">
                        <label>Shipping Address</label>
                        <p>{selectedOrder.customer.address?.street}</p>
                        <p>{selectedOrder.customer.address?.city}, {selectedOrder.customer.address?.state}</p>
                        <p>{selectedOrder.customer.address?.pincode}</p>
                      </div>
                    </div>
                  </section>

                  {/* Offline Store COD Approval Card */}
                  {String(selectedOrder.orderType || '').toUpperCase() === 'OFFLINE' && String(selectedOrder.paymentMethod || '').toLowerCase() === 'cod' && (
                    <section className="offline-cod-section" style={{ marginTop: '20px' }}>
                      <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.05em', color: '#111', textTransform: 'uppercase', marginBottom: '10px' }}>🏬 Offline Store COD Management</h3>
                      <div style={{ padding: '20px', background: '#1c1917', color: '#ffffff', borderRadius: '12px', border: '1.5px solid #10b981', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '0.88rem' }}>
                          <div><span style={{ color: '#a3a3a3' }}>Order Channel:</span> <strong style={{ color: '#10b981', marginLeft: '4px', fontWeight: '700' }}>OFFLINE STORE</strong></div>
                          <div><span style={{ color: '#a3a3a3' }}>Payment Method:</span> <strong style={{ color: '#ffffff', marginLeft: '4px', fontWeight: '700' }}>COD</strong></div>
                          <div><span style={{ color: '#a3a3a3' }}>Payment Status:</span> <strong style={{ color: String(selectedOrder.paymentStatus || '').toLowerCase() === 'paid' ? '#22c55e' : String(selectedOrder.paymentStatus || '').toLowerCase() === 'rejected' ? '#ef4444' : '#f59e0b', marginLeft: '4px', fontWeight: '700' }}>{(selectedOrder.paymentStatus || 'PENDING').toUpperCase()}</strong></div>
                        </div>

                        {selectedOrder.approvedBy && (
                          <div style={{ padding: '10px 14px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', borderRadius: '8px', color: '#4ade80', fontSize: '0.82rem', marginBottom: '12px' }}>
                            ✓ <strong>Approved By:</strong> {selectedOrder.approvedBy.name || selectedOrder.approvedBy.email || 'Admin'}
                            {selectedOrder.approvedAt && ` on ${new Date(selectedOrder.approvedAt).toLocaleString('en-IN')}`}
                          </div>
                        )}

                        {String(selectedOrder.paymentStatus || '').toLowerCase() === 'rejected' && (
                          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem', marginBottom: '12px' }}>
                            ✕ COD Payment has been rejected by Admin.
                          </div>
                        )}

                        {String(selectedOrder.paymentStatus || '').toLowerCase() === 'pending' && (
                          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button
                              type="button"
                              disabled={codActionLoading}
                              onClick={() => handleApproveCod(selectedOrder._id)}
                              style={{
                                padding: '10px 20px',
                                fontSize: '0.85rem',
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                              }}
                            >
                              {codActionLoading ? 'Processing...' : 'Approve COD'}
                            </button>
                            <button
                              type="button"
                              disabled={codActionLoading}
                              onClick={() => handleRejectCod(selectedOrder._id)}
                              style={{
                                padding: '10px 20px',
                                fontSize: '0.85rem',
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1.5px solid #ef4444',
                                borderRadius: '6px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {codActionLoading ? 'Processing...' : 'Reject COD'}
                            </button>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Refund Control Card */}
                  <section className="refund-section" style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.05em', color: '#111', textTransform: 'uppercase', marginBottom: '10px' }}>💳 Payment & Refund Control</h3>
                    <div style={{ padding: '20px', background: '#111111', color: '#ffffff', borderRadius: '12px', border: '1.5px solid #d4af37', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.88rem' }}>
                        <div><span style={{ color: '#a3a3a3' }}>Order Channel:</span> <strong style={{ color: '#d4af37', marginLeft: '4px', fontWeight: '700' }}>{(selectedOrder.orderType || 'ONLINE').toUpperCase()}</strong></div>
                        <div><span style={{ color: '#a3a3a3' }}>Payment Method:</span> <strong style={{ color: '#ffffff', marginLeft: '4px', fontWeight: '700' }}>{(selectedOrder.paymentMethod || 'online').toUpperCase()}</strong></div>
                        <div><span style={{ color: '#a3a3a3' }}>Payment Status:</span> <strong style={{ color: selectedOrder.paymentStatus === 'paid' ? '#22c55e' : '#f59e0b', marginLeft: '4px', fontWeight: '700' }}>{(selectedOrder.paymentStatus || 'pending').toUpperCase()}</strong></div>
                        <div><span style={{ color: '#a3a3a3' }}>Refund Status:</span> <strong style={{ color: '#d4af37', marginLeft: '4px', fontWeight: '700' }}>{(selectedOrder.refundStatus || 'not_refunded').toUpperCase()}</strong></div>
                      </div>

                      {/* Active Refund Request Details */}
                      {(() => {
                        const matchingRefund = refunds.find(r => (r.order?._id || r.order) === selectedOrder._id) || (selectedOrder.refundStatus === 'refund_requested' ? { status: 'requested', amount: selectedOrder.totalAmount, reason: 'Customer requested refund' } : null)

                        if (!matchingRefund && selectedOrder.refundStatus !== 'refund_requested') {
                          return (
                            <div style={{ fontSize: '0.82rem', color: '#a3a3a3', fontStyle: 'italic', borderTop: '1px solid #333', paddingTop: '10px' }}>
                              No active refund request submitted for this order.
                            </div>
                          )
                        }

                        const isShippedOrAWB = ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes((selectedOrder.status || '').toLowerCase()) || Boolean(selectedOrder.shipping?.awbNumber)

                        return (
                          <div style={{ background: '#1c1917', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #d4af37', marginTop: '12px' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#d4af37', marginBottom: '8px', letterSpacing: '0.05em' }}>
                              CUSTOMER REFUND REQUEST
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#e5e5e5', marginBottom: '4px' }}>
                              <strong>Refund Amount:</strong> ₹{Number(matchingRefund.amount || selectedOrder.totalAmount).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#e5e5e5', marginBottom: '4px' }}>
                              <strong>Reason:</strong> {matchingRefund.reason || 'Ordered by mistake'}
                            </div>
                            {matchingRefund.createdAt && (
                              <div style={{ fontSize: '0.78rem', color: '#a3a3a3', marginBottom: '12px' }}>
                                Requested on: {new Date(matchingRefund.createdAt).toLocaleString('en-IN')}
                              </div>
                            )}

                            {/* Eligibility Check Badge */}
                            {isShippedOrAWB ? (
                              <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', color: '#f87171', padding: '10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '12px' }}>
                                ⚠️ CANNOT APPROVE: Order has already shipped from warehouse. Refunds are disabled after shipping.
                              </div>
                            ) : (
                              <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#4ade80', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '12px' }}>
                                ✓ Eligible for refund approval (Order not shipped from warehouse)
                              </div>
                            )}

                            {/* Approval / Rejection Action Buttons */}
                            {(matchingRefund.status === 'requested' || selectedOrder.refundStatus === 'refund_requested') ? (
                              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                <button
                                  type="button"
                                  disabled={refundProcessingId === (matchingRefund._id || selectedOrder._id) || isShippedOrAWB}
                                  onClick={() => handleApproveRefund(matchingRefund._id || selectedOrder._id)}
                                  style={{
                                    padding: '8px 18px',
                                    fontSize: '0.82rem',
                                    background: isShippedOrAWB ? '#444444' : '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    cursor: isShippedOrAWB ? 'not-allowed' : 'pointer',
                                    boxShadow: isShippedOrAWB ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.3)'
                                  }}
                                >
                                  {refundProcessingId === (matchingRefund._id || selectedOrder._id) ? 'Processing Gateway Refund...' : 'Approve Refund'}
                                </button>
                                <button
                                  type="button"
                                  disabled={refundProcessingId === (matchingRefund._id || selectedOrder._id)}
                                  onClick={() => handleRejectRefund(matchingRefund._id || selectedOrder._id)}
                                  style={{
                                    padding: '8px 16px',
                                    fontSize: '0.82rem',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    border: '1.5px solid #ef4444',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reject Request
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.82rem', color: '#d4af37', marginTop: '8px', fontWeight: '600' }}>
                                Status: {(matchingRefund.status || selectedOrder.refundStatus).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </section>

                  {String(selectedOrder.orderType || 'ONLINE').toUpperCase() === 'ONLINE' ? (
                    <section className="tracking-section">
                      <h3>Logistics & Status</h3>
                      <div className="status-control-card">
                        <div className="control-group">
                          <label>Current Stage</label>
                          <select
                            value={selectedOrder.status}
                            onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                          >
                            <option value="pending">Pending Receipt</option>
                            <option value="confirmed">Order Confirmed</option>
                            <option value="processing">Processing & Tailoring</option>
                            <option value="shipped">Dispatched</option>
                            <option value="delivered">Delivered Successfully</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <form className="tracking-form" onSubmit={updateTracking}>
                          <div className="input-row">
                            <div className="control-group">
                              <label>Tracking Number</label>
                              <input name="trackingNumber" defaultValue={selectedOrder.trackingNumber} placeholder="e.g. SF12345678" />
                            </div>
                            <div className="control-group">
                              <label>Est. Delivery</label>
                              <input type="date" name="estimatedDelivery" defaultValue={selectedOrder.estimatedDelivery?.split('T')[0]} />
                            </div>
                          </div>
                          <button type="submit" className="update-track-btn">Update Tracking</button>
                        </form>

                        {/* Ad2Ship Logistics Management Card */}
                        <div className="ad2ship-fulfillment-card" style={{ marginTop: '20px', padding: '20px', background: '#111111', color: '#ffffff', borderRadius: '12px', border: '1.5px solid #d4af37', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '10px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#d4af37', fontWeight: '700', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🚚 AD2SHIP LOGISTICS CONTROL</span>
                            </h4>
                            {ad2shipLoading && <span style={{ fontSize: '0.8rem', color: '#facc15', fontWeight: '600' }}>Processing Ad2Ship...</span>}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '0.88rem' }}>
                            <div><span style={{ color: '#a3a3a3' }}>Ad2Ship Order ID:</span> <strong style={{ color: '#ffffff', marginLeft: '4px', fontWeight: '700' }}>{selectedOrder.shipping?.ad2shipOrderId || 'None'}</strong></div>
                            <div><span style={{ color: '#a3a3a3' }}>AWB Number:</span> <strong style={{ color: '#ffffff', marginLeft: '4px', fontWeight: '700' }}>{selectedOrder.shipping?.awbNumber || selectedOrder.trackingNumber || 'Unassigned'}</strong></div>
                            <div><span style={{ color: '#a3a3a3' }}>Courier Partner:</span> <strong style={{ color: '#ffffff', marginLeft: '4px', fontWeight: '700' }}>{selectedOrder.shipping?.courierName || 'Unassigned'}</strong></div>
                            <div><span style={{ color: '#a3a3a3' }}>Shipping Fee:</span> <strong style={{ color: '#facc15', marginLeft: '4px', fontWeight: '700' }}>₹{selectedOrder.shipping?.totalCharges || 0}</strong></div>
                          </div>

                          {/* Partner Selection Dropdown */}
                          {ad2shipPartners.length > 0 && !selectedOrder.shipping?.awbNumber && (
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: '700', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Courier Partner:</label>
                              <select
                                className="ad2ship-courier-select"
                                value={selectedCourierId}
                                onChange={(e) => setSelectedCourierId(e.target.value)}
                              >
                                {ad2shipPartners.map(p => (
                                  <option key={p.id} value={p.id} style={{ background: '#ffffff', color: '#111111', fontWeight: '600' }}>
                                    {p.name} — ₹{p.total_charge} (Freight: ₹{p.freight_charge}, COD: ₹{p.cod_charge})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Ad2Ship Action Buttons */}
                          <div className="ad2ship-buttons-mobile-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <button
                              type="button"
                              disabled={ad2shipLoading}
                              onClick={() => handleCalculateRate(selectedOrder)}
                              style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#1c1917', color: '#d4af37', border: '1.5px solid #d4af37', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                            >
                              Calculate Rates
                            </button>

                            {!selectedOrder.shipping?.ad2shipOrderId && (
                              <button
                                type="button"
                                disabled={ad2shipLoading}
                                onClick={() => handleCreateAd2ShipOrder(selectedOrder._id)}
                                style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#d4af37', color: '#000000', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
                              >
                                Create Ad2Ship Order
                              </button>
                            )}

                            {selectedOrder.shipping?.ad2shipOrderId && !selectedOrder.shipping?.awbNumber && (
                              <button
                                type="button"
                                disabled={ad2shipLoading || !selectedCourierId}
                                onClick={() => handleShipOrder(selectedOrder._id)}
                                style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
                              >
                                Ship Order & Assign AWB
                              </button>
                            )}

                            {(selectedOrder.shipping?.awbNumber || selectedOrder.shipping?.ad2shipOrderId) && (
                              <button
                                type="button"
                                disabled={ad2shipLoading}
                                onClick={() => handleTrackShipment(selectedOrder)}
                                style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Track Live
                              </button>
                            )}

                            {selectedOrder.shipping?.ad2shipOrderId && (
                              <>
                                <button
                                  type="button"
                                  disabled={ad2shipLoading || !selectedOrder.shipping?.awbNumber}
                                  title={!selectedOrder.shipping?.awbNumber ? 'Ship order & assign AWB first' : 'Download shipping label'}
                                  onClick={() => handleGenerateDocument(selectedOrder._id, 'label')}
                                  style={{ padding: '8px 14px', fontSize: '0.82rem', background: selectedOrder.shipping?.awbNumber ? '#334155' : '#1e293b', color: selectedOrder.shipping?.awbNumber ? '#ffffff' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: selectedOrder.shipping?.awbNumber ? 'pointer' : 'not-allowed' }}
                                >
                                  Download Label
                                </button>
                                <button
                                  type="button"
                                  disabled={ad2shipLoading || !selectedOrder.shipping?.awbNumber}
                                  title={!selectedOrder.shipping?.awbNumber ? 'Ship order & assign AWB first' : 'Download tax invoice'}
                                  onClick={() => handleGenerateDocument(selectedOrder._id, 'invoice')}
                                  style={{ padding: '8px 14px', fontSize: '0.82rem', background: selectedOrder.shipping?.awbNumber ? '#334155' : '#1e293b', color: selectedOrder.shipping?.awbNumber ? '#ffffff' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: selectedOrder.shipping?.awbNumber ? 'pointer' : 'not-allowed' }}
                                >
                                  Download Invoice
                                </button>
                                <button
                                  type="button"
                                  disabled={ad2shipLoading || !selectedOrder.shipping?.awbNumber}
                                  title={!selectedOrder.shipping?.awbNumber ? 'Ship order & assign AWB first' : 'Generate courier manifest'}
                                  onClick={() => handleGenerateDocument(selectedOrder._id, 'manifest')}
                                  style={{ padding: '8px 14px', fontSize: '0.82rem', background: selectedOrder.shipping?.manifestGenerated ? '#15803d' : (selectedOrder.shipping?.awbNumber ? '#334155' : '#1e293b'), color: selectedOrder.shipping?.awbNumber ? '#ffffff' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: selectedOrder.shipping?.awbNumber ? 'pointer' : 'not-allowed' }}
                                >
                                  {selectedOrder.shipping?.manifestGenerated ? 'Manifested ✓' : 'Manifest'}
                                </button>
                              </>
                            )}

                            {selectedOrder.shipping?.ad2shipOrderId && !selectedOrder.shipping?.awbNumber && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && (
                              <button
                                type="button"
                                disabled={ad2shipLoading}
                                onClick={() => handleCancelShipment(selectedOrder._id)}
                                style={{ padding: '8px 14px', fontSize: '0.82rem', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                              >
                                Cancel Shipment
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <section className="tracking-section">
                      <h3>Order Fulfillment & Status</h3>
                      <div className="status-control-card">
                        <div className="control-group">
                          <label>Current Stage</label>
                          <select
                            value={selectedOrder.status}
                            onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="delivered">Completed / Handed Over</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div style={{ padding: '14px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', marginTop: '14px', fontWeight: '600' }}>
                          🏬 <strong>Offline Store Order:</strong> Logistics, courier shipping, tracking, and Ad2Ship controls are omitted for offline store orders.
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="timeline-section">
                    <h3>Order Journey</h3>
                    <div className="journey-timeline">
                      {selectedOrder.timeline?.map((entry, idx) => (
                        <div key={idx} className="timeline-step">
                          <div className="step-marker" />
                          <div className="step-content">
                            <span className="step-status">{entry.status}</span>
                            <p className="step-note">{entry.note}</p>
                            <span className="step-time">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      <div className="timeline-step active">
                        <div className="step-marker pulse" />
                        <div className="step-content">
                          <span className="step-status">Order Placed</span>
                          <p className="step-note">System received the order request</p>
                          <span className="step-time">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="items-section">
                    <h3>Package Contents</h3>
                    <div className="package-list">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="pkg-item">
                          <img src={getImageUrl(item.image)} alt={item.name} />
                          <div className="pkg-info">
                            <h4>{item.name}</h4>
                            <p>Size: {item.size} • Qty: {item.quantity}</p>
                          </div>
                          <div className="pkg-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    <div className="order-summary-box">
                      <div className="sum-row"><span>Subtotal</span><span>₹{selectedOrder.totalAmount.toLocaleString()}</span></div>
                      <div className="sum-row"><span>Shipping</span><span>Free</span></div>
                      <div className="sum-row total"><span>Total</span><span>₹{selectedOrder.totalAmount.toLocaleString()}</span></div>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Export Dialog */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="modal-overlay" onClick={() => setIsExportModalOpen(false)}>
            <motion.div
              className="premium-export-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-topbar">
                <h3>Atelier Ledger Export</h3>
                <button className="close-btn" onClick={() => setIsExportModalOpen(false)}>&times;</button>
              </div>

              {exportStep === 'options' && (
                <div className="export-modal-body">
                  <p className="subtitle">Compile and serialize your orders metadata into a clean ledger document.</p>

                  <div className="export-option-group">
                    <label>Export Range</label>
                    <div className="custom-radio-group">
                      <div
                        className={`radio-card ${exportRange === 'filtered' ? 'active' : ''}`}
                        onClick={() => setExportRange('filtered')}
                      >
                        <div className="radio-dot" />
                        <div className="radio-label">
                          <h4>Filtered View ({visibleOrders.length} Orders)</h4>
                          <p>Current search & state status filters</p>
                        </div>
                      </div>
                      <div
                        className={`radio-card ${exportRange === 'all' ? 'active' : ''}`}
                        onClick={() => setExportRange('all')}
                      >
                        <div className="radio-dot" />
                        <div className="radio-label">
                          <h4>Entire Registry ({orders.length} Orders)</h4>
                          <p>Export all historical records</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="export-option-group">
                    <label>Serialization Format</label>
                    <div className="format-grid">
                      <button
                        className={`format-tile ${exportFormat === 'csv' ? 'active' : ''}`}
                        onClick={() => setExportFormat('csv')}
                      >
                        <div className="tile-icon">📄</div>
                        <span>CSV Spreadsheet</span>
                      </button>
                      <button
                        className={`format-tile ${exportFormat === 'json' ? 'active' : ''}`}
                        onClick={() => setExportFormat('json')}
                      >
                        <div className="tile-icon">{"{ }"}</div>
                        <span>JSON Payload</span>
                      </button>
                    </div>
                  </div>

                  <button className="primary-action-btn" onClick={triggerExportGeneration}>
                    <span>Initiate Ledger Synthesis</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}

              {exportStep === 'generating' && (
                <div className="export-modal-body loading-state">
                  <div className="luxury-spinner">
                    <div className="spinner-inner" />
                  </div>
                  <h3>Synthesizing Document</h3>
                  <p className="progress-text">{exportProgressText}</p>
                </div>
              )}

              {exportStep === 'success' && (
                <div className="export-modal-body success-state">
                  <div className="success-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3>Synthesis Complete</h3>
                  <p className="success-message">Ledger document compiled and dispatched successfully.</p>
                  <button className="done-btn" onClick={() => setIsExportModalOpen(false)}>Done</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Tracking Modal */}
      <AnimatePresence>
        {trackingModalData && (
          <div className="modal-overlay" onClick={() => setTrackingModalData(null)}>
            <motion.div
              className="order-detail-modal"
              style={{ maxWidth: '600px', width: '90%' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-sidebar-header">
                <h2>Ad2Ship Live Tracking</h2>
                <button className="close-side-modal" onClick={() => setTrackingModalData(null)}>&times;</button>
              </div>
              <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '80vh' }}>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#171717', borderRadius: '8px', border: '1px solid #333' }}>
                  <div style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>AWB Number: <strong style={{ color: '#d4af37' }}>{trackingModalData.AWBNumber}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>Courier Partner: <strong style={{ color: '#fff' }}>{trackingModalData.CourierPartner || 'N/A'}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>Current Status: <strong style={{ color: '#22c55e', textTransform: 'uppercase' }}>{trackingModalData.CurrentStatus}</strong></div>
                  {trackingModalData.ExpectedDeliveryDate && (
                    <div style={{ fontSize: '0.85rem', color: '#a3a3a3' }}>Est. Delivery: <strong style={{ color: '#fff' }}>{new Date(trackingModalData.ExpectedDeliveryDate).toLocaleDateString()}</strong></div>
                  )}
                </div>

                <h4 style={{ fontSize: '0.85rem', color: '#d4af37', textTransform: 'uppercase', marginBottom: '12px' }}>Tracking History</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {trackingModalData.OrderHistory?.map((ev, idx) => (
                    <div key={idx} style={{ padding: '10px 14px', background: '#262626', borderRadius: '6px', borderLeft: '3px solid #d4af37' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '600', color: '#fff' }}>
                        <span>{ev.status || ev.status_code}</span>
                        <span style={{ color: '#a3a3a3', fontSize: '0.75rem' }}>{ev.event_date ? new Date(ev.event_date).toLocaleString() : ''}</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#a3a3a3' }}>{ev.status_description || ev.remarks}</p>
                      {ev.location && <span style={{ fontSize: '0.72rem', color: '#d4af37' }}>📍 {ev.location}</span>}
                    </div>
                  ))}
                  {(!trackingModalData.OrderHistory || trackingModalData.OrderHistory.length === 0) && (
                    <p style={{ fontSize: '0.85rem', color: '#737373' }}>No tracking checkpoints recorded yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`toast-notification ${notification.type}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OrdersManager
