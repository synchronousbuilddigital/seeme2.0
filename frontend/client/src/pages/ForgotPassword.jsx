import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import './ForgotPassword.css'

const ForgotPassword = () => {
  const navigate = useNavigate()

  // Steps: 1 = Email Input, 2 = 6-digit OTP Verification, 3 = New Password
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 2-Minute Countdown Timer (120 seconds)
  const [timerSeconds, setTimerSeconds] = useState(120)
  const [isTimerActive, setIsTimerActive] = useState(false)

  const otpInputRefs = useRef([])

  // Countdown Timer Effect
  useEffect(() => {
    let interval = null
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0) {
      setIsTimerActive(false)
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isTimerActive, timerSeconds])

  // Format seconds as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(data.message || 'A 6-digit OTP code has been sent to your Gmail.')
        setStep(2)
        setTimerSeconds(120) // 2 minutes timer
        setIsTimerActive(true)
        setTimeout(() => {
          if (otpInputRefs.current[0]) otpInputRefs.current[0].focus()
        }, 300)
      } else {
        setError(data.message || 'Failed to send OTP code. Please check your email.')
      }
    } catch (err) {
      setError('Network error. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otpDigits]
    newOtp[index] = value.slice(-1)
    setOtpDigits(newOtp)

    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus()
    }
  }

  // Handle OTP Backspace & Paste
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      setOtpDigits(pastedData.split(''))
      if (otpInputRefs.current[5]) otpInputRefs.current[5].focus()
    }
  }

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const fullOtp = otpDigits.join('')
    if (fullOtp.length < 6) {
      setError('Please enter the full 6-digit OTP code.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(API_ENDPOINTS.AUTH_VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('OTP verified successfully! Set your new password below.')
        setStep(3)
        setIsTimerActive(false)
      } else {
        setError(data.message || 'Invalid or expired OTP code.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(API_ENDPOINTS.AUTH_RESET_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpDigits.join(''),
          password
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Password reset successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/auth')
        }, 2000)
      } else {
        setError(data.message || 'Failed to reset password.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <motion.div 
        className="forgot-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="brand-header">
          <span className="brand-star">✦</span>
          <span className="brand-label">SEEMEE ATELIER</span>
          <span className="brand-star">✦</span>
        </div>

        <h1 className="card-title">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Enter Verification OTP'}
          {step === 3 && 'Reset Password'}
        </h1>
        <p className="card-subtitle">
          {step === 1 && 'Enter your registered email address to receive a 6-digit OTP code.'}
          {step === 2 && `Enter the 6-digit OTP sent to ${email}.`}
          {step === 3 && 'Set a new secure password for your SEEMEE account.'}
        </p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div className="alert error-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span>⚠️ {error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div className="alert success-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span>✅ {success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="step-form">
            <div className="form-group">
              <label>Registered Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="action-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'SEND OTP TO EMAIL'}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="step-form">
            <div className="otp-input-group" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => otpInputRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="otp-digit"
                />
              ))}
            </div>

            <div className="timer-row">
              {isTimerActive ? (
                <span className="timer-text">⏱ OTP expires in <strong>{formatTime(timerSeconds)}</strong></span>
              ) : (
                <span className="timer-text expired">⚠️ OTP Expired</span>
              )}
              <button 
                type="button" 
                className="resend-btn" 
                disabled={isTimerActive || loading}
                onClick={handleSendOtp}
              >
                Resend OTP
              </button>
            </div>

            <button type="submit" className="action-btn" disabled={loading || otpDigits.join('').length < 6}>
              {loading ? 'Verifying...' : 'VERIFY OTP'}
            </button>

            <button type="button" className="text-back-btn" onClick={() => { setStep(1); setError(''); setSuccess(''); }}>
              ← Change Email
            </button>
          </form>
        )}

        {/* STEP 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="step-form">
            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
                <button type="button" className="show-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>

            <button type="submit" className="action-btn" disabled={loading}>
              {loading ? 'Updating Password...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}

        <div className="card-footer">
          <Link to="/auth" className="back-link">
            ← Return to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
