import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Orders.css'

const Orders = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="orders-page">
      <div className="orders-container">
        <motion.div
          className="orders-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
          <h1>My Orders</h1>
          <p>Track and manage your orders</p>
        </motion.div>

        <motion.div
          className="orders-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="empty-orders">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here</p>
            <motion.button
              className="shop-now-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
            >
              Start Shopping
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Orders
