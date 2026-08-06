import { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { API_ENDPOINTS, RAZORPAY_KEY_ID } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { trackAddShippingInfo, trackAddPaymentInfo, trackPurchase } from '../utils/gtmEcommerce'
import './Checkout.css'

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
]

const CustomStateSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="custom-state-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'selected-val' : 'placeholder-val'}>
          {value || 'Select State'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#78716c"
          strokeWidth="2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="custom-select-options-list">
          {INDIAN_STATES.map((st) => (
            <div
              key={st}
              className={`custom-select-option ${value === st ? 'selected' : ''}`}
              onClick={() => {
                onChange({ target: { name: 'state', value: st } })
                setIsOpen(false)
              }}
            >
              {st}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Checkout = () => {
  const {
    cart,
    getCartTotal,
    clearCart,
    appliedCoupon,
    couponDiscount,
    isFreeShippingFromCoupon,
    removeCoupon
  } = useContext(CartContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { user, token } = useAuth()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'online'
  })
  
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showMobileSummary, setShowMobileSummary] = useState(false)

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/')
    }
  }, [cart, navigate])

  useEffect(() => {
    if (user && token) {
      fetchAddresses()
    }
  }, [user, token])

  const fetchAddresses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USERS_ADDRESSES, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setAddresses(data.data)
        const defaultAddr = data.data.find(a => a.isDefault)
        if (defaultAddr) {
          handleAddressSelect(defaultAddr)
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address._id)
    setFormData(prev => ({
      ...prev,
      name: address.name || prev.name,
      phone: address.phone || prev.phone,
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || ''
    }))
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleChange = handleInputChange

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      let price = 0
      if (item.price) {
        if (typeof item.price === 'string') {
          price = parseInt(item.price.replace(/[₹,]/g, '')) || 0
        } else if (typeof item.price === 'number') {
          price = item.price
        }
      }
      return total + (price * (item.quantity || 1))
    }, 0)
  }

  const calculateShipping = () => {
    return 0
  }

  const calculateTotal = () => {
    let total = calculateSubtotal() + calculateShipping()
    total = Math.max(0, total - couponDiscount)
    return total
  }

  const validateForm = () => {
    const { name, email, phone, street, city, state, pincode } = formData
    const trimmedPincode = pincode.trim()
    const trimmedPhone = phone.trim()

    if (!name || !email || !trimmedPhone || !street || !city || !state || !trimmedPincode) {
      alert('Please fill in all required shipping and contact fields.')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      alert('Please enter a valid email address.')
      return false
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/
    if (!phoneRegex.test(trimmedPhone.replace(/\s/g, ''))) {
      alert('Please enter a valid 10-digit phone number.')
      return false
    }

    const pincodeRegex = /^[a-zA-Z0-9\s-]{4,10}$/
    if (!pincodeRegex.test(trimmedPincode)) {
      alert('Please enter a valid pincode / zipcode.')
      return false
    }

    return true
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRazorpayPayment = async (orderData) => {
    const res = await loadRazorpayScript()
    if (!res) {
      alert('Razorpay SDK failed to load. Please check your internet connection.')
      return
    }
    try {
      const response = await fetch(API_ENDPOINTS.CREATE_RAZORPAY_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: calculateTotal() })
      })
      const { data: razorpayOrder } = await response.json()

      if (razorpayOrder.id.startsWith('order_mock_')) {
        const verifyResponse = await fetch(API_ENDPOINTS.VERIFY_PAYMENT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: 'pay_mock_' + Date.now(),
            razorpay_signature: 'sig_mock',
            ...orderData
          })
        })
        const result = await verifyResponse.json()
        if (result.success) {
          clearCart()
          alert('Order placed successfully via Online Payment!')
          navigate('/orders')
        } else {
          alert('Payment verification failed: ' + result.message)
        }
        return
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'SEE MEE HAUTE COUTURE',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          const verifyResponse = await fetch(API_ENDPOINTS.VERIFY_PAYMENT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...orderData
            })
          })
          const result = await verifyResponse.json()
          if (result.success) {
            try {
              const orderId = result.data?._id || result.data?.orderId || response.razorpay_order_id || Date.now()
              trackPurchase({
                orderId,
                total: calculateTotal(),
                shippingCost: 0,
                tax: 0,
                coupon: '',
                items: cart
              })
            } catch (e) {
              console.error('GTM purchase tracking error:', e)
            }
            clearCart()
            alert('Payment successful! Your order has been placed.')
            navigate('/orders')
          } else {
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: '#1C1917' }
      }
      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    // Fire GTM Shipping and Payment Info events
    try {
      trackAddShippingInfo(cart, 'Express', '')
      trackAddPaymentInfo(cart, formData.paymentMethod === 'online' ? 'Razorpay' : 'COD', '')
    } catch (e) {
      console.error('GTM checkout tracking error:', e)
    }

    const orderData = {
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India'
        }
      },
      items: cart.map(item => {
        const itemId = item.id || item._id
        let price = 0
        if (item.price) {
          if (typeof item.price === 'string') price = parseInt(item.price.replace(/[₹,]/g, '')) || 0
          else if (typeof item.price === 'number') price = item.price
        }
        return { 
          product: itemId, 
          name: item.name, 
          price: price, 
          quantity: item.quantity, 
          size: item.selectedSize || item.size || 'M',
          color: item.color || 'Standard',
          image: item.images?.[0] || item.image 
        }
      }),
      totalAmount: calculateTotal(),
      paymentMethod: formData.paymentMethod,
      couponCode: appliedCoupon?.code || null,
      couponDiscount: couponDiscount || 0
    }

    if (formData.paymentMethod === 'online') {
      handleRazorpayPayment(orderData)
    } else {
      try {
        const response = await fetch(API_ENDPOINTS.ORDERS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        })
        const result = await response.json()
        if (result.success) {
          try {
            const orderId = result.data?._id || result.data?.orderId || Date.now()
            trackPurchase({
              orderId,
              total: calculateTotal(),
              shippingCost: 0,
              tax: 0,
              coupon: '',
              items: cart
            })
          } catch (e) {
            console.error('GTM purchase tracking error:', e)
          }
          clearCart()
          alert('Order placed successfully! You will pay on delivery.')
          navigate('/orders')
        } else {
          alert('Order failed: ' + (result.message || 'Please try again.'))
        }
      } catch (error) {
        console.error('Order error:', error)
        alert('Order failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  if (cart.length === 0) return null

  return (
    <div className="editorial-checkout">
      {/* Top Luxury Banner */}
      <div className="checkout-top-nav-bar">
        <div className="checkout-nav-container">
          <button onClick={() => navigate('/cart')} className="checkout-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Return to Shopping Bag</span>
          </button>

          <div className="checkout-progress-stepper">
            <span className="step-pill active">1. Delivery Details</span>
            <span className="step-line"></span>
            <span className="step-pill active">2. Payment</span>
            <span className="step-line"></span>
            <span className="step-pill">3. Confirmation</span>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Order Summary Accordion Bar */}
      <div className="mobile-checkout-summary-bar">
        <button 
          type="button" 
          className="mobile-summary-toggle-btn"
          onClick={() => setShowMobileSummary(!showMobileSummary)}
        >
          <div className="toggle-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>{showMobileSummary ? 'Hide Order Summary' : 'Show Order Summary'}</span>
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ transform: showMobileSummary ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <span className="mobile-total-val">₹{calculateTotal().toLocaleString('en-IN')}</span>
        </button>

        <AnimatePresence>
          {showMobileSummary && (
            <motion.div 
              className="mobile-summary-drawer-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mobile-items-list">
                {cart.map(item => (
                  <div key={item.id || item._id} className="mobile-mini-item">
                    <img 
                      src={getOptimizedImageUrl(item.images?.[0] || item.image, 'thumbnail')} 
                      alt={item.name} 
                      onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                    />
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <span>Qty: {item.quantity} | Size: {item.selectedSize || item.size || 'M'}</span>
                    </div>
                    <span className="item-price">
                      ₹{((typeof item.price === 'number' ? item.price : parseInt(item.price.replace(/[₹,]/g, '')) || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mobile-summary-breakdown">
                <div className="calc-line">
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                </div>
                <div className="calc-line">
                  <span>White-Glove Shipping</span>
                  <span>₹{calculateShipping()}</span>
                </div>
                <div className="calc-line grand-total-line">
                  <span>Total Payable</span>
                  <span className="gold-text">₹{calculateTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <header className="checkout-header-luxury">
        <div className="header-container-luxury">
          <span className="editorial-mini-label">✦ SECURE ATELIER CHECKOUT</span>
          <h1 className="checkout-main-title">Complete Your Order</h1>
          <p className="checkout-subtitle">Insured priority dispatch across India & international destinations.</p>
        </div>
      </header>

      <div className="checkout-grid-luxury">
        {/* Left Form Column */}
        <div className="checkout-form-column">
          <form id="checkout-luxury-form" onSubmit={handleSubmit} className="luxury-form">
            
            {/* Section 1: Saved Addresses & Delivery Information */}
            <motion.section 
              className="form-luxury-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-header-box">
                <span className="section-num">01</span>
                <h2 className="section-title-luxury">Delivery Details</h2>
              </div>
              
              {user && addresses.length > 0 && (
                <div className="saved-addresses-luxury">
                  <span className="mini-title">Saved Address Book</span>
                  <div className="address-pills">
                    {addresses.map(addr => (
                      <div 
                        key={addr._id} 
                        className={`address-pill ${selectedAddressId === addr._id ? 'active' : ''}`}
                        onClick={() => handleAddressSelect(addr)}
                      >
                        <div className="pill-top">
                          <span className="pill-text">{addr.street ? `${addr.street.slice(0, 22)}...` : addr.city}</span>
                          {addr.isDefault && <span className="pill-badge">Default</span>}
                        </div>
                        <span className="pill-sub">{addr.city}, {addr.state} - {addr.pincode}</span>
                      </div>
                    ))}
                    <div 
                      className={`address-pill new ${!selectedAddressId ? 'active' : ''}`} 
                      onClick={() => {
                        setSelectedAddressId(null)
                        setFormData(prev => ({ ...prev, street: '', city: '', state: '', pincode: '' }))
                      }}
                    >
                      <span>+ Enter New Address</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="input-group-luxury">
                <label htmlFor="checkout-name">Recipient Full Name *</label>
                <input 
                  id="checkout-name"
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="e.g. Maharani Gayatri Devi" 
                  required 
                />
              </div>

              <div className="input-row-luxury">
                <div className="input-group-luxury">
                  <label htmlFor="checkout-email">Email Address (Order Confirmation) *</label>
                  <input 
                    id="checkout-email"
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="client@domain.com" 
                    required 
                  />
                </div>
                <div className="input-group-luxury">
                  <label htmlFor="checkout-phone">Phone Number (For Delivery Updates) *</label>
                  <input 
                    id="checkout-phone"
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+91 98765 43210" 
                    required 
                  />
                </div>
              </div>

              <div className="input-group-luxury">
                <label htmlFor="checkout-street">Street Address / House / Flat / Locality *</label>
                <input 
                  id="checkout-street"
                  type="text" 
                  name="street" 
                  value={formData.street} 
                  onChange={handleChange} 
                  placeholder="e.g. Flat 402, Silver Residency, Dindoli Road" 
                  required 
                />
              </div>

              <div className="input-row-luxury tri">
                <div className="input-group-luxury">
                  <label htmlFor="checkout-city">City / District *</label>
                  <input 
                    id="checkout-city"
                    type="text" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                    placeholder="Surat" 
                    required 
                  />
                </div>
                <div className="input-group-luxury">
                  <label htmlFor="checkout-state">State *</label>
                  <CustomStateSelect 
                    value={formData.state} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="input-group-luxury">
                  <label htmlFor="checkout-pincode">Pincode / Zipcode *</label>
                  <input 
                    id="checkout-pincode"
                    type="text" 
                    name="pincode" 
                    value={formData.pincode} 
                    onChange={handleChange} 
                    placeholder="394210" 
                    required 
                  />
                </div>
              </div>
            </motion.section>

            {/* Section 2: Payment Method */}
            <motion.section 
              className="form-luxury-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="section-header-box">
                <span className="section-num">02</span>
                <h2 className="section-title-luxury">Payment Selection</h2>
              </div>

              <div className="payment-grid-luxury">
                <label className={`payment-card-luxury ${formData.paymentMethod === 'online' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="online" 
                    checked={formData.paymentMethod === 'online'} 
                    onChange={handleChange} 
                  />
                  <div className="payment-card-content">
                    <div className="payment-icon-head">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      <span className="gold-security-badge">Recommended</span>
                    </div>
                    <span className="method-title">Instant Online Payment</span>
                    <span className="method-desc">UPI, Razorpay, Credit / Debit Cards, NetBanking</span>
                  </div>
                </label>

                <label className={`payment-card-luxury ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="cod" 
                    checked={formData.paymentMethod === 'cod'} 
                    onChange={handleChange} 
                  />
                  <div className="payment-card-content">
                    <div className="payment-icon-head">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                        <path d="M6 12h.01M18 12h.01"></path>
                      </svg>
                    </div>
                    <span className="method-title">Pay On Delivery (COD)</span>
                    <span className="method-desc">Cash or QR payment at your doorstep</span>
                  </div>
                </label>
              </div>
            </motion.section>



            {/* Submit Button */}
            <motion.button 
              type="submit" 
              className="place-order-luxury-btn"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="btn-loading-state">
                  <span className="btn-spinner"></span>
                  Processing Secure Order...
                </span>
              ) : (
                <span>
                  {formData.paymentMethod === 'online' 
                    ? `Proceed to Secure Payment — ₹${calculateTotal().toLocaleString('en-IN')}` 
                    : `Confirm Cash on Delivery Order — ₹${calculateTotal().toLocaleString('en-IN')}`
                  }
                </span>
              )}
            </motion.button>
          </form>
        </div>

        {/* Right Summary Sidebar */}
        <aside className="checkout-summary-column">
          <div className="summary-card-luxury">
            <div className="summary-header">
              <h2 className="summary-title-luxury">Order Summary</h2>
              <span className="items-count-tag">{cart.reduce((acc, item) => acc + (item.quantity || 1), 0)} Items</span>
            </div>

            <div className="summary-items-scroll">
              {cart.map((item) => (
                <div key={item.id || item._id} className="mini-item-luxury">
                  <div className="mini-item-media">
                    <img 
                      src={getOptimizedImageUrl(item.images?.[0] || item.image, 'thumbnail')} 
                      alt={item.name} 
                      onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                    />
                  </div>
                  <div className="mini-item-info">
                    <h4>{item.name}</h4>
                    <div className="mini-item-meta">
                      <span className="meta-chip">Qty: {item.quantity}</span>
                      <span className="meta-chip gold">Size: {item.selectedSize || item.size || 'M'}</span>
                    </div>
                  </div>
                  <div className="mini-item-price">
                    ₹{((typeof item.price === 'number' ? item.price : parseInt(item.price.replace(/[₹,]/g, '')) || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-calculations">
              <div className="calc-line">
                <span>Items Subtotal</span>
                <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="calc-line">
                <span>Insured White-Glove Shipping</span>
                <span>₹{calculateShipping()}</span>
              </div>
            </div>

            <div className="summary-total-luxury">
              <span className="total-label">Grand Total</span>
              <span className="total-value">₹{calculateTotal().toLocaleString('en-IN')}</span>
              <span className="total-tax-note">Inclusive of all taxes & insurance</span>
            </div>

            <div className="checkout-trust">
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Priority Insured Dispatch</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Authentic Heritage Guarantee</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Mobile Bottom CTA Action Bar */}
      <div className="mobile-sticky-action-bar">
        <div className="mobile-sticky-price-box">
          <span className="mobile-sticky-label">Grand Total</span>
          <span className="mobile-sticky-price">₹{calculateTotal().toLocaleString('en-IN')}</span>
        </div>
        <button 
          type="submit" 
          form="checkout-luxury-form"
          className="mobile-sticky-cta-btn"
          disabled={loading}
        >
          {loading ? (
            <span className="btn-loading-state">
              <span className="btn-spinner"></span>
              Processing...
            </span>
          ) : (
            <span>
              {formData.paymentMethod === 'online' ? 'Proceed to Pay →' : 'Confirm Order →'}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

export default Checkout
