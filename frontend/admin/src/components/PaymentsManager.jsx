import { useState, useEffect } from 'react'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './PaymentsManager.css'

const PaymentsManager = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const [isOnlineCodEnabled, setIsOnlineCodEnabled] = useState(true)
  const [togglingCod, setTogglingCod] = useState(false)

  useEffect(() => {
    fetchPayments()
    fetchSiteSettings()
  }, [])

  const fetchSiteSettings = async () => {
    try {
      const data = await apiRequest(`${API_ENDPOINTS.COD_STATUS}?_t=${Date.now()}`, { bypassCache: true })
      if (data && typeof data.isOnlineCodEnabled === 'boolean') {
        setIsOnlineCodEnabled(data.isOnlineCodEnabled)
      } else {
        const fullSettings = await apiRequest(`${API_ENDPOINTS.SITE_SETTINGS}?_t=${Date.now()}`, { bypassCache: true })
        const payload = fullSettings?.data || fullSettings
        if (payload && payload.isOnlineCodEnabled !== undefined) {
          setIsOnlineCodEnabled(payload.isOnlineCodEnabled !== false)
        }
      }
    } catch (err) {
      console.warn('Failed to load site settings for COD status:', err.message)
    }
  }

  const handleToggleOnlineCod = async () => {
    const nextState = !isOnlineCodEnabled
    const confirmMsg = nextState
      ? 'Are you sure you want to ENABLE Cash on Delivery (COD) for Online Store orders?'
      : 'Are you sure you want to DISABLE Cash on Delivery (COD) for Online Store orders? (Customers will only be able to pay online)'

    if (!window.confirm(confirmMsg)) return

    setTogglingCod(true)
    try {
      const res = await apiRequest(API_ENDPOINTS.TOGGLE_ONLINE_COD, {
        method: 'PUT',
        auth: true,
        body: { isOnlineCodEnabled: nextState }
      })
      if (res && (res.success || typeof res.isOnlineCodEnabled === 'boolean')) {
        const updatedVal = typeof res.isOnlineCodEnabled === 'boolean' ? res.isOnlineCodEnabled : nextState
        setIsOnlineCodEnabled(updatedVal)
        alert(`Online Store Cash on Delivery (COD) has been ${updatedVal ? 'ENABLED' : 'DISABLED'} successfully!`)
      } else {
        alert(res.message || 'Failed to update COD settings')
      }
    } catch (err) {
      alert(err.message || 'Failed to update COD settings')
    } finally {
      setTogglingCod(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ORDERS, { auth: true })
      if (data.success) {
        setPayments(data.data.filter(o => o.paymentStatus !== 'pending' || o.refundStatus !== 'not_refunded'))
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading Ledger Payments...</div>

  const totalSuccess = payments.filter(p => p.paymentStatus === 'paid').reduce((s, p) => s + (p.totalAmount || 0), 0)
  const totalRefunded = payments.filter(p => p.paymentStatus === 'refunded' || p.refundStatus === 'refunded').reduce((s, p) => s + (p.refundedAmount || p.totalAmount || 0), 0)

  return (
    <div className="payments-manager">
      <div style={{
        background: '#ffffff',
        border: '1.5px solid rgba(212, 175, 55, 0.35)',
        borderRadius: '12px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.12)', color: '#B8860B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1c1917' }}>Online Store COD Setting</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background: isOnlineCodEnabled ? '#dcfce7' : '#fee2e2',
                color: isOnlineCodEnabled ? '#15803d' : '#b91c1c',
                border: `1px solid ${isOnlineCodEnabled ? '#bbf7d0' : '#fecaca'}`
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                {isOnlineCodEnabled ? 'ACTIVE / ACCEPTING' : 'DISABLED / OFF'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '2px 0 0 0' }}>
              {isOnlineCodEnabled
                ? 'Cash on Delivery option is enabled for customers on the online store checkout.'
                : 'Cash on Delivery option is disabled on the online store checkout (prepaid only).'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleOnlineCod}
          disabled={togglingCod}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: isOnlineCodEnabled ? '#fef2f2' : '#f0fdf4',
            color: isOnlineCodEnabled ? '#dc2626' : '#16a34a',
            border: `1px solid ${isOnlineCodEnabled ? '#fca5a5' : '#86efac'}`
          }}
        >
          {togglingCod ? 'Updating...' : isOnlineCodEnabled ? '✕ Disable Online COD' : '✓ Enable Online COD'}
        </button>
      </div>

      <div className="stats-strip">
        <div className="mini-stat">
          <label>Total Success Volume</label>
          <span className="val">₹{totalSuccess.toLocaleString('en-IN')}</span>
        </div>
        <div className="mini-stat" style={{ borderLeft: '3px solid #ef4444', paddingLeft: '12px' }}>
          <label>Total Refunded Volume</label>
          <span className="val" style={{ color: '#ef4444' }}>₹{totalRefunded.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="payments-list">
        {payments.map(payment => (
          <div key={payment._id} className="payment-row">
            <div className="id">#{payment.orderNumber}</div>
            <div className="customer">{payment.customer?.name || 'Customer'}</div>
            <div className="method">{payment.paymentMethod?.toUpperCase()}</div>
            <div className="amount">₹{payment.totalAmount?.toLocaleString('en-IN')}</div>
            <div className={`status ${payment.paymentStatus}`}>
              {payment.paymentStatus === 'refunded' || payment.refundStatus === 'refunded' ? 'REFUNDED' : payment.paymentStatus?.toUpperCase()}
            </div>
            <div className="date">{new Date(payment.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentsManager
