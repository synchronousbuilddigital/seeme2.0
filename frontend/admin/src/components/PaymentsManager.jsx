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
        // Use orders with payment info for now
        setPayments(data.data.filter(o => o.paymentStatus !== 'pending'))
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading Payments...</div>

  return (
    <div className="payments-manager">
      <div className="stats-strip">
        <div className="mini-stat">
          <label>Total Success</label>
          <span className="val">₹{payments.filter(p => p.paymentStatus === 'paid').reduce((s, p) => s + p.totalAmount, 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="payments-list">
        {payments.map(payment => (
          <div key={payment._id} className="payment-row">
            <div className="id">#{payment.orderNumber}</div>
            <div className="customer">{payment.customer.name}</div>
            <div className="method">{payment.paymentMethod.toUpperCase()}</div>
            <div className="amount">₹{payment.totalAmount.toLocaleString()}</div>
            <div className={`status ${payment.paymentStatus}`}>{payment.paymentStatus.toUpperCase()}</div>
            <div className="date">{new Date(payment.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentsManager
