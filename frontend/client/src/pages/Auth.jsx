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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { user, token, login, signup, forgotPassword, loginWithToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const authNotice = location.state?.message
  const redirectTarget = location.state?.from || location.state?.redirectUrl || '/'

  // Handle Google OAuth callback redirect parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const oauthToken = searchParams.get('token')
    const oauthUserStr = searchParams.get('user')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      setError(decodeURIComponent(oauthError))
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (oauthToken && oauthUserStr) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(oauthUserStr))
        loginWithToken(oauthToken, parsedUser)
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (err) {
        console.error('Failed to parse Google OAuth user:', err)
        setError('Google authentication failed. Please try again.')
      }
    }
  }, [location.search])

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

  const handleGoogleLogin = () => {
    const googleAuthUrl = API_ENDPOINTS.GOOGLE_AUTH || `${API_ENDPOINTS.LOGIN.replace('/login', '/google')}`
    window.location.href = googleAuthUrl
  }

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
      const rawPhone = (formData.phone || '').trim()
      if (!rawPhone) {
        setError('Phone Number is required')
        setLoading(false)
        return
      }
      const digitsOnly = rawPhone.replace(/\D/g, '')
      const isValidPhone = /^[6-9]\d{9}$/.test(digitsOnly) || (digitsOnly.length === 12 && digitsOnly.startsWith('91') && /^[6-9]\d{9}$/.test(digitsOnly.slice(2)))
      if (!isValidPhone) {
        setError('Please enter a valid 10-digit mobile number')
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
          // Regular user goes to redirect target or home
          navigate(redirectTarget)
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
            {/* Mobile Brand Header */}
            <div className="auth-mobile-header">
              <span className="mobile-brand-kicker">EST. 2026 • HAUTE COUTURE</span>
              <h2 className="mobile-brand-title" onClick={() => navigate('/')}>SEEMEE</h2>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="auth-mode-switcher">
              <button 
                type="button" 
                className={`switcher-tab ${isLogin ? 'active' : ''}`}
                onClick={() => { if (!isLogin) toggleMode() }}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`switcher-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => { if (isLogin) toggleMode() }}
              >
                Create Account
              </button>
            </div>

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
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
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
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required={!isLogin}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                    </div>
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

              <div className="auth-divider-editorial">
                <span>OR</span>
              </div>

              <motion.button
                type="button"
                className="google-auth-btn-editorial"
                onClick={handleGoogleLogin}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
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
