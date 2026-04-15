import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getImageUrl } from '../../../utils/imageHelper'
import './OrdersManager.css'

const OrdersManager = () => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        fetchOrders()
        alert('Order status updated!')
      }
    } catch (error) {
      alert('Failed to update order status')
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444'
    }
    return colors[status] || '#64748b'
  }

  return (
    <div className="orders-manager">
      <div className="manager-header">
        <div>
          <h1>Orders Management</h1>
          <p>Track and manage customer orders</p>
        </div>
      </div>

      <div className="filters">
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'all' && ` (${orders.length})`}
            {status !== 'all' && ` (${orders.filter(o => o.status === status).length})`}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              className="order-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="order-header">
                <div>
                  <h3>Order #{order.orderNumber}</h3>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <span 
                  className="status-badge"
                  style={{ background: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-customer">
                <div className="customer-info">
                  <strong>{order.customer.name}</strong>
                  <span>{order.customer.email}</span>
                  <span>{order.customer.phone}</span>
                </div>
              </div>

              <div className="order-items">
                <span className="items-count">{order.items.length} item(s)</span>
                <span className="order-total">₹{order.totalAmount.toLocaleString()}</span>
              </div>

              <div className="order-actions">
                <select
                  value={order.status}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateOrderStatus(order._id, e.target.value)
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedOrder && (
        <div className="order-modal" onClick={() => setSelectedOrder(null)}>
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Order Details</h2>
              <button onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> {selectedOrder.orderNumber}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedOrder.status) }}>{selectedOrder.status}</span></p>
                <p><strong>Payment:</strong> {selectedOrder.paymentMethod.toUpperCase()}</p>
              </div>

              <div className="detail-section">
                <h3>Customer Details</h3>
                <p><strong>Name:</strong> {selectedOrder.customer.name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                {selectedOrder.customer.address && (
                  <p><strong>Address:</strong> {selectedOrder.customer.address.street}, {selectedOrder.customer.address.city}, {selectedOrder.customer.address.state} - {selectedOrder.customer.address.pincode}</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Order Items</h3>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="order-item-detail">
                    <div className="item-image">
                      {item.image && <img src={getImageUrl(item.image)} alt={item.name} />}
                    </div>
                    <div className="item-info">
                      <p><strong>{item.name}</strong></p>
                      <p>Quantity: {item.quantity}</p>
                      {item.size && <p>Size: {item.size}</p>}
                      {item.color && <p>Color: {item.color}</p>}
                      <p className="item-price">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="detail-section total-section">
                <h3>Total Amount: ₹{selectedOrder.totalAmount.toLocaleString()}</h3>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default OrdersManager
