import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { API_ENDPOINTS, getAdminUrl } from '../config/api'
import './Auth.css'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [logo, setLogo] = useState('/images/logoSEEMEE1.png')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  
  const { user, token, login, signup, forgotPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const authNotice = location.state?.message
  const redirectTarget = location.state?.from || location.state?.redirectUrl || '/'

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        const adminToken = token || localStorage.getItem('seemee-token') || ''
        window.location.href = `${getAdminUrl()}/dashboard?token=${encodeURIComponent(adminToken)}&user=${encodeURIComponent(JSON.stringify(user))}`
      } else {
        navigate(redirectTarget, { replace: true })
      }
    }
  }, [user, token])

  useEffect(() => {
    // Fetch logo from API
    fetch(API_ENDPOINTS.SITE_SETTINGS)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.logo) {
          setLogo(data.data.logo)
        }
      })
      .catch(err => console.error('Error fetching logo:', err))
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isLogin) {
      if (!formData.name || !formData.name.trim()) {
        setError('Full Name is required')
        setLoading(false)
        return
      }
      if (!formData.email || !formData.email.trim()) {
        setError('Email Address is required')
        setLoading(false)
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }
      if (!formData.phone || !formData.phone.trim()) {
        setError('Phone Number is required')
        setLoading(false)
        return
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
    } else {
      if (!formData.email || !formData.email.trim()) {
        setError('Email Address is required')
        setLoading(false)
        return
      }
      if (!formData.password) {
        setError('Password is required')
        setLoading(false)
        return
      }
    }

    try {
      let result
      if (isLogin) {
        result = await login(formData.email, formData.password)
      } else {
        result = await signup(formData.name, formData.email, formData.password, formData.phone)
      }

      if (result.success) {
        // Check if user is admin and redirect accordingly
        if (result.user && result.user.role === 'admin') {
          // Store admin credentials
          localStorage.setItem('adminToken', result.token)
          localStorage.setItem('adminUser', JSON.stringify(result.user))
          
          window.location.href = `${getAdminUrl()}/dashboard?token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(JSON.stringify(result.user))}`
        } else {
          // Regular user goes to home
          navigate('/')
        }
      } else {
        setError(result.error || 'Authentication failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    })
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await forgotPassword(forgotEmail)
      if (res.success) {
        setSuccess('Instructions have been sent to your email.')
      } else {
        setError(res.message || 'Something went wrong.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-editorial">
      <div className="auth-split-layout">
        {/* Left Side: Cinematic Image */}
        <motion.div 
          className="auth-image-side"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <img src="/images/auth-bg.png" alt="Luxury Fashion" className="auth-hero-img" />
          <div className="auth-image-overlay">
            <div className="auth-brand-info">
              <span className="editorial-kicker">EST. 2026</span>
              <h2 className="editorial-logo">SEEMEE</h2>
              <p className="editorial-tagline">Crafting Heritage into Modern Legacies</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
          className="auth-form-side"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="auth-form-container">
            <div className="auth-header-editorial">
              <span className="form-kicker">{isLogin ? 'WELCOME BACK' : 'START YOUR JOURNEY'}</span>
              <h1 className="form-title">{isLogin ? 'Sign In' : 'Create Account'}</h1>
              <p className="form-subtitle">
                {isLogin 
                  ? 'Access your exclusive collections and orders.' 
                  : 'Join the world of SEEMEE for a curated luxury experience.'}
              </p>
            </div>

            {authNotice && (
              <div className="auth-notice-banner">
                <span>🔒 {authNotice}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  className="auth-error-editorial"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="auth-form-editorial">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <>
                    <motion.div 
                      className="input-group-editorial"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required={!isLogin}
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="input-group-editorial"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        placeholder="+91 00000 00000"
                        required={!isLogin}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <div className="input-group-editorial">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="input-group-editorial">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
 
               {isLogin && (
                 <div className="forgot-password-link-container">
                   <Link 
                     to="/forgot-password"
                     className="forgot-password-btn"
                     onClick={(e) => e.stopPropagation()}
                   >
                     Forgot your password?
                   </Link>
                 </div>
               )}

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    className="input-group-editorial"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required={!isLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {!isLogin && (
                <div className="auth-checkbox-group">
                  <label className="checkbox-container">
                    <input type="checkbox" name="newsletter" />
                    <span className="checkmark"></span>
                    Subscribe to the SEEMEE Inner Circle for exclusive launches
                  </label>
                  <label className="checkbox-container">
                    <input type="checkbox" name="terms" required />
                    <span className="checkmark"></span>
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
              )}

              <motion.button
                type="submit"
                className="submit-btn-editorial"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-dots">Processing...</span>
                ) : (
                  <span>{isLogin ? 'ACCESS ACCOUNT' : 'CREATE ACCOUNT'}</span>
                )}
              </motion.button>
            </form>

            <div className="auth-footer-editorial">
              <p>
                {isLogin ? "Don't have an account?" : 'Already a member?'}
                <button onClick={toggleMode} className="mode-toggle-btn">
                  {isLogin ? 'Join SEEMEE' : 'Sign In instead'}
                </button>
              </p>
              
              <button className="back-btn-minimal" onClick={() => navigate('/')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Return to Store
              </button>
            </div>
          </div>
        </motion.div>

        {/* Forgot Password Modal/Overlay */}
        <AnimatePresence>
          {showForgot && (
            <motion.div 
              className="forgot-password-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="forgot-password-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <button className="close-modal-btn" onClick={() => {
                  setShowForgot(false)
                  setSuccess('')
                  setError('')
                }}>✕</button>
                
                <h2>Recover Password</h2>
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                
                {error && <div className="auth-error-editorial" style={{ marginBottom: '20px' }}>{error}</div>}
                {success && <div className="modal-success" style={{ padding: '20px', marginBottom: '20px' }}>{success}</div>}

                {!success && (
                  <form onSubmit={handleForgotPassword} className="auth-form-editorial">
                    <div className="input-group-editorial">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        value={forgotEmail} 
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        required 
                      />
                    </div>
                    <button type="submit" className="submit-btn-editorial" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Recovery Link'}
                    </button>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Auth
