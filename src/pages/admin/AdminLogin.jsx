import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.css'

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔐 Attempting login to:', '/api/auth/login')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      console.log('📡 Response status:', response.status)
      
      const data = await response.json()
      console.log('📦 Response data:', data)

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`)
      }

      if (data.success && data.user && data.user.role === 'admin') {
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminUser', JSON.stringify(data.user))
        
        // Try to open admin panel in new tab
        const newTab = window.open('/admin/dashboard', '_blank')
        
        // If popup was blocked, navigate in same tab
        if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
          // Popup blocked - navigate in same tab
          navigate('/admin/dashboard')
        } else {
          // Popup opened successfully - show message and clear form
          setError('')
          alert('✅ Admin panel opened in new tab!')
          setCredentials({ email: '', password: '' })
        }
      } else {
        setError(data.user?.role !== 'admin' ? 'Access denied. Admin privileges required.' : 'Invalid admin credentials')
      }
    } catch (err) {
      console.error('❌ Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-header">
          <h1>See Mee Admin</h1>
          <p>Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="admin-email">Email</label>
            <input
              type="email"
              id="admin-email"
              name="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              placeholder="admin@seemee.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              type="password"
              id="admin-password"
              name="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default AdminLogin
