import { useState, useEffect } from 'react'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './PaymentsManager.css'

const PaymentsManager = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

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
