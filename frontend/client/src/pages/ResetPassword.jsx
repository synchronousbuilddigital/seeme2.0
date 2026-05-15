import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    setError('')
    
    const res = await resetPassword(token, password)
    if (res.success) {
      setSuccess('Your password has been reset successfully. You can now sign in.')
      setTimeout(() => navigate('/auth'), 3000)
    } else {
      setError(res.message || 'Link expired or invalid.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page-editorial">
      <div className="auth-form-side" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', background: 'transparent' }}>
        <div className="auth-form-container">
          <div className="auth-header-editorial">
            <span className="form-kicker">SECURITY</span>
            <h1 className="form-title">Reset Password</h1>
            <p className="form-subtitle">Choose a new secure password for your SEEMEE account.</p>
          </div>

          {error && <div className="auth-error-editorial">{error}</div>}
          {success && <div className="modal-success" style={{ padding: '20px', marginBottom: '20px' }}>{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="auth-form-editorial">
              <div className="input-group-editorial">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>
              <div className="input-group-editorial">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>
              <button type="submit" className="submit-btn-editorial" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
