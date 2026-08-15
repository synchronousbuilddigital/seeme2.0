import { useState, useContext, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { API_ENDPOINTS, RAZORPAY_KEY_ID } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { fetchPincodeDetails } from '../utils/pincodeService'
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
          {value || 'Select Delivery State'}
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
  const [orderType, setOrderType] = useState('ONLINE')
  
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

  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')

  // Ad2Ship Shipping Rate & Courier Partner state
  const [shippingPartners, setShippingPartners] = useState([])
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const [placedOrder, setPlacedOrder] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    if (placedOrder) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [placedOrder])

  const handleCancelOrderFromModal = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancellingId(orderId)
    try {
      const response = await fetch(API_ENDPOINTS.ORDERS_CANCEL(orderId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setPlacedOrder(prev => prev ? { ...prev, status: 'Cancelled' } : null)
      } else {
        alert(data.message || 'Failed to cancel order.')
      }
    } catch (err) {
      console.error('Cancel order error:', err)
      alert('Failed to cancel order. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  // Automatic State & City autofill + Ad2Ship Rate Calculation
  useEffect(() => {
    const rawPin = formData.pincode ? String(formData.pincode).trim() : ''

    setPincodeError('')
    setShippingError('')

    if (rawPin.length !== 6 || !/^\d{6}$/.test(rawPin)) {
      setPincodeLoading(false)
      setShippingPartners([])
      setSelectedPartner(null)
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      if (!isMounted) return
      setPincodeLoading(true)
      setShippingLoading(true)

      const res = await fetchPincodeDetails(rawPin)
      if (!isMounted) return
      setPincodeLoading(false)

      if (res.success) {
        setFormData(prev => ({
          ...prev,
          city: res.city || prev.city,
          state: res.state || prev.state
        }))
        setPincodeError('')

        // Call Backend Ad2Ship Rate Calculator API
        try {
          const rateRes = await fetch(API_ENDPOINTS.SHIPPING_RATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deliveryPincode: rawPin,
              paymentType: 'prepaid',
              items: cart.map(i => ({ product: i.id || i._id, quantity: i.quantity, price: i.price })),
              invoiceAmount: calculateTotal()
            })
          })
          const rateData = await rateRes.json()
          if (!isMounted) return

          if (rateData.success && rateData.data?.partners?.length > 0) {
            setShippingPartners(rateData.data.partners)
            setSelectedPartner(rateData.data.partners[0])
            setShippingError('')
          } else {
            setShippingPartners([])
            setSelectedPartner(null)
            let errMsg = 'Pincode not serviceable by courier partners.'
            if (rateData.message) {
              let rawStr = typeof rateData.message === 'string'
                ? rateData.message
                : (typeof rateData.message === 'object'
                  ? Object.entries(rateData.message).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
                  : String(rateData.message))

              if (rawStr && !rawStr.includes('InvoiceAmount') && !rawStr.includes('ApiKey')) {
                errMsg = rawStr
              }
            }
            setShippingError(errMsg)
          }
        } catch (err) {
          console.error('Rate calculation error:', err)
          if (isMounted) {
            setShippingPartners([])
            setSelectedPartner(null)
          }
        } finally {
          if (isMounted) setShippingLoading(false)
        }
      } else if (!res.aborted) {
        setPincodeError(res.error || 'Invalid or non-existent PIN code.')
        setShippingLoading(false)
        setShippingPartners([])
        setSelectedPartner(null)
        setFormData(prev => ({
          ...prev,
          city: '',
          state: ''
        }))
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [formData.pincode, formData.paymentMethod, cart, getCartTotal])

  useEffect(() => {
    if (cart.length === 0 && !placedOrder) {
      navigate('/')
    }
  }, [cart, placedOrder, navigate])

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
    total = Math.max(0, total - (couponDiscount || 0))
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
          setPlacedOrder(result.data || {
            _id: 'ORD-' + Date.now(),
            customer: orderData.customer,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            paymentMethod: 'online',
            status: 'Placed'
          })
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
            setPlacedOrder(result.data || {
              _id: 'ORD-' + Date.now(),
              customer: orderData.customer,
              items: orderData.items,
              totalAmount: orderData.totalAmount,
              paymentMethod: 'online',
              status: 'Placed'
            })
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

    try {
      trackAddShippingInfo(cart, 'Express', '')
      trackAddPaymentInfo(cart, formData.paymentMethod === 'online' ? 'Razorpay' : 'COD', '')
    } catch (e) {
      console.error('GTM checkout tracking error:', e)
    }

    const orderData = {
      orderType: orderType,
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
          quantity: item.quantity || 1, 
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
          setPlacedOrder(result.data || {
            _id: 'ORD-' + Date.now(),
            customer: orderData.customer,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            paymentMethod: orderData.paymentMethod,
            status: 'Placed'
          })
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

  if (cart.length === 0 && !placedOrder) return null

  const totalItemsCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0)

  return (
    <div className="editorial-checkout">
      {/* Mobile Collapsible Order Summary Accordion Bar */}
      <div className="mobile-checkout-summary-bar">
        <button 
          type="button" 
          className="mobile-summary-toggle-btn"
          onClick={() => setShowMobileSummary(!showMobileSummary)}
        >
          <div className="toggle-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>{showMobileSummary ? 'Hide Order Summary' : `Show Order Summary (${totalItemsCount} items)`}</span>
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
                {appliedCoupon && (
                  <div className="calc-line discount-line">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="gold-text">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="calc-line">
                  <span>Priority Shipping</span>
                  <span className="green-text">FREE</span>
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

      {/* Main Luxury Header Hero Banner */}
      <header className="checkout-header-luxury">
        <div className="header-container-luxury">
          
          <h1 className="checkout-main-title">Complete Your Order</h1>
          <p className="checkout-subtitle">Priority insured white-glove dispatch across India & International destinations.</p>
        </div>
      </header>

      {/* Main Checkout Layout Grid */}
      <div className="checkout-grid-luxury">
        {/* Left Column: Form & Address Details */}
        <div className="checkout-form-column">
          <form id="checkout-luxury-form" onSubmit={handleSubmit} className="luxury-form">
            
            {/* Section 01: Delivery Details */}
            <motion.section 
              className="form-luxury-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-header-box">
                <div className="section-badge-pill">01</div>
                <div>
                  <h2 className="section-title-luxury">Delivery Destination</h2>
                  <p className="section-desc">Enter your shipping address for insured express delivery</p>
                </div>
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
                          <span className="pill-text">{addr.name || user.name}</span>
                          {addr.isDefault && <span className="pill-badge">Default</span>}
                        </div>
                        <span className="pill-sub">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</span>
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
                <div className="input-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input 
                    id="checkout-name"
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Enter full name of recipient" 
                    required 
                  />
                </div>
              </div>

              <div className="input-row-luxury">
                <div className="input-group-luxury">
                  <label htmlFor="checkout-email">Email Address (Order Confirmation) *</label>
                  <div className="input-with-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
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
                </div>

                <div className="input-group-luxury">
                  <label htmlFor="checkout-phone">Phone Number (Delivery Updates) *</label>
                  <div className="input-with-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
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
              </div>

              <div className="input-group-luxury">
                <label htmlFor="checkout-street">Street Address / House / Flat / Locality *</label>
                <div className="input-with-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <input 
                    id="checkout-street"
                    type="text" 
                    name="street" 
                    value={formData.street} 
                    onChange={handleChange} 
                    placeholder="Flat 402, Building / House Name, Street, Landmark" 
                    required 
                  />
                </div>
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
                    placeholder="City / District" 
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
                  <label htmlFor="checkout-pincode">
                    Pincode *
                    {pincodeLoading && <span className="pincode-status-text">🔍 Verifying...</span>}
                  </label>
                  <input 
                    id="checkout-pincode"
                    type="text" 
                    name="pincode" 
                    value={formData.pincode} 
                    onChange={handleChange} 
                    placeholder="6-Digit PIN" 
                    maxLength={6}
                    required 
                  />
                </div>
              </div>

              {pincodeError && (
                <div className="pincode-alert-box error">
                  <span>⚠️ {pincodeError}</span>
                </div>
              )}


            </motion.section>

            {/* Section 02: Order Type & Payment Method Selection */}
            <motion.section 
              className="form-luxury-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="section-header-box">
                <div className="section-badge-pill">02</div>
                <div>
                  <h2 className="section-title-luxury">Order Type</h2>
                  <p className="section-desc">Select how you would like to place your order</p>
                </div>
              </div>

              <div className="order-type-selector-luxury" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <label 
                  className={`order-type-card ${orderType === 'ONLINE' ? 'active' : ''}`}
                  onClick={() => {
                    setOrderType('ONLINE')
                    setFormData(prev => ({ ...prev, paymentMethod: 'online' }))
                  }}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: orderType === 'ONLINE' ? '2px solid #d4af37' : '1px solid #e7e5e4',
                    borderRadius: '12px',
                    background: orderType === 'ONLINE' ? 'rgba(212, 175, 55, 0.05)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <input 
                    type="radio" 
                    name="orderType" 
                    value="ONLINE" 
                    checked={orderType === 'ONLINE'} 
                    onChange={() => {
                      setOrderType('ONLINE')
                      setFormData(prev => ({ ...prev, paymentMethod: 'online' }))
                    }} 
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#1c1917', fontSize: '15px' }}>Online Store</strong>
                    <span style={{ fontSize: '12px', color: '#78716c' }}>Online Payment Only (Razorpay)</span>
                  </div>
                </label>

                <label 
                  className={`order-type-card ${orderType === 'OFFLINE' ? 'active' : ''}`}
                  onClick={() => {
                    setOrderType('OFFLINE')
                  }}
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: orderType === 'OFFLINE' ? '2px solid #d4af37' : '1px solid #e7e5e4',
                    borderRadius: '12px',
                    background: orderType === 'OFFLINE' ? 'rgba(212, 175, 55, 0.05)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <input 
                    type="radio" 
                    name="orderType" 
                    value="OFFLINE" 
                    checked={orderType === 'OFFLINE'} 
                    onChange={() => setOrderType('OFFLINE')} 
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#1c1917', fontSize: '15px' }}>Offline Store</strong>
                    <span style={{ fontSize: '12px', color: '#78716c' }}>COD or Online Payment</span>
                  </div>
                </label>
              </div>

              <div className="section-header-box" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 className="section-title-luxury" style={{ fontSize: '16px' }}>Payment Method</h3>
                  <p className="section-desc">
                    {orderType === 'ONLINE' ? 'Online Payment Only' : 'Select COD or Online Payment'}
                  </p>
                </div>
              </div>

              <div className="payment-grid-luxury">
                {/* Razorpay Online Payment Option */}
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
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      <span className="gold-security-badge">✦ 100% Encrypted Payment</span>
                    </div>
                    <span className="method-title">Instant Online Payment (Razorpay)</span>
                    <span className="method-desc">UPI (GPay / PhonePe / Paytm / BHIM), Credit & Debit Cards, NetBanking, Wallets</span>
                    <div className="payment-logos-strip">
                      <span className="pay-tag">GPay</span>
                      <span className="pay-tag">PhonePe</span>
                      <span className="pay-tag">Paytm</span>
                      <span className="pay-tag">UPI</span>
                      <span className="pay-tag">Visa</span>
                      <span className="pay-tag">Mastercard</span>
                    </div>
                  </div>
                </label>

                {/* COD Option — ONLY visible for Offline Store orders */}
                {orderType === 'OFFLINE' && (
                  <label className={`payment-card-luxury ${formData.paymentMethod === 'cod' ? 'active' : ''}`} style={{ marginTop: '16px' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={formData.paymentMethod === 'cod'} 
                      onChange={handleChange} 
                    />
                    <div className="payment-card-content">
                      <div className="payment-icon-head">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        <span className="gold-security-badge">✦ Offline Store Exclusive</span>
                      </div>
                      <span className="method-title">Cash on Delivery (COD)</span>
                      <span className="method-desc">Pay cash upon delivery. Subject to admin approval.</span>
                    </div>
                  </label>
                )}
              </div>
            </motion.section>

            {/* Desktop Action Submit Button */}
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
                  Processing Your Order...
                </span>
              ) : (
                <span>
                  {formData.paymentMethod === 'cod'
                    ? `Place Offline COD Order — ₹${calculateTotal().toLocaleString('en-IN')}`
                    : `Proceed to Secure Payment — ₹${calculateTotal().toLocaleString('en-IN')}`
                  }
                </span>
              )}
            </motion.button>
          </form>
        </div>

        {/* Right Column: Sticky Order Summary Card */}
        <aside className="checkout-summary-column">
          <div className="summary-card-luxury">
            <div className="summary-header">
              <h2 className="summary-title-luxury">Order Summary</h2>
              <span className="items-count-tag">{totalItemsCount} Items</span>
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
                    <span className="item-qty-badge">{item.quantity || 1}</span>
                  </div>
                  <div className="mini-item-info">
                    <h4>{item.name}</h4>
                    <div className="mini-item-meta">
                      <span className="meta-chip gold">Size: {item.selectedSize || item.size || 'M'}</span>
                      {item.color && <span className="meta-chip">{item.color}</span>}
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
                <span>Insured Express Shipping</span>
                <span className="green-text">FREE</span>
              </div>
              {appliedCoupon && (
                <div className="calc-line discount-line">
                  <span className="coupon-code-label">Promo Coupon ({appliedCoupon.code})</span>
                  <span className="gold-text">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="summary-total-luxury">
              <div className="total-title-row">
                <span className="total-label">Grand Total</span>
                <span className="total-value">₹{calculateTotal().toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="checkout-trust">
              <div className="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <strong>256-Bit SSL Encryption</strong>
                  <p>Bank-grade secure transactions</p>
                </div>
              </div>
              <div className="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <div>
                  <strong>Priority Insured Shipping</strong>
                  <p>Tracked doorstep delivery</p>
                </div>
              </div>
              <div className="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div>
                  <strong>Authentic Heritage Quality</strong>
                  <p>Certified ethnic luxury craftsmanship</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Mobile Bottom CTA Bar */}
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
              Proceed to Pay →
            </span>
          )}
        </button>
      </div>

      {/* Order Placed Confirmation Window Modal */}
      <AnimatePresence>
        {placedOrder && (
          <div className="order-placed-modal-overlay">
            <motion.div 
              className="order-placed-card-luxury"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="placed-header">
                <div className="placed-icon-circle">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="editorial-mini-label">✦ ORDER CONFIRMED</span>
                <h2 className="placed-title">Order Placed Successfully</h2>
                <p className="placed-subtitle">
                  Thank you for choosing SEEMEE Haute Couture. We have received your order and sent a confirmation email to <strong>{placedOrder.customer?.email}</strong>.
                </p>
              </div>

              <div className="placed-details-box">
                <div className="detail-row">
                  <span>Order Reference ID:</span>
                  <strong>#{placedOrder._id ? String(placedOrder._id).slice(-8).toUpperCase() : 'SEEMEE'}</strong>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <span className={`placed-status-pill ${(placedOrder.status || 'placed').toLowerCase()}`}>
                    {placedOrder.status || 'Placed'}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Payment Method:</span>
                  <strong>{placedOrder.paymentMethod === 'online' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}</strong>
                </div>
                <div className="detail-row">
                  <span>Total Amount:</span>
                  <strong className="gold-total-text">₹{Number(placedOrder.totalAmount || 0).toLocaleString('en-IN')}.00</strong>
                </div>
                {placedOrder.customer?.address && (
                  <div className="detail-row address-summary">
                    <span>Shipping Destination:</span>
                    <p>
                      <strong>{placedOrder.customer.name}</strong><br/>
                      {placedOrder.customer.address.street}, {placedOrder.customer.address.city}, {placedOrder.customer.address.state} - {placedOrder.customer.address.pincode}
                    </p>
                  </div>
                )}
              </div>

              <div className="placed-items-container">
                <span className="items-header-title">Ordered Items ({placedOrder.items?.length || 0})</span>
                <div className="placed-items-list">
                  {placedOrder.items?.map((item, idx) => (
                    <div key={idx} className="placed-item-card">
                      <img 
                        src={getOptimizedImageUrl(item.image || item.images?.[0], 'thumbnail')} 
                        alt={item.name} 
                        onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                      />
                      <div className="item-meta">
                        <h4>{item.name}</h4>
                        <span>Qty: {item.quantity} | Size: {item.size || item.selectedSize || 'M'}</span>
                      </div>
                      <span className="item-price-val">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="placed-modal-actions">
                {(() => {
                  const ordStatus = String(placedOrder.status || '').toLowerCase().trim()
                  const shipStatus = String(placedOrder.shipping?.status || '').toLowerCase().trim()
                  const isShipped = ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(ordStatus) ||
                                    ['shipped', 'delivered', 'in_transit', 'out_for_delivery', 'picked_up'].includes(shipStatus) ||
                                    Boolean(placedOrder.shipping?.awbNumber || placedOrder.trackingNumber) ||
                                    Boolean(placedOrder.shipping?.pickupAt)
                  const isCancelled = ordStatus === 'cancelled'

                  if (isCancelled) {
                    return (
                      <div className="cancelled-state-notice">
                        <span className="cancelled-msg">⚠️ This order is cancelled</span>
                        <button type="button" className="btn-primary-modal-action" onClick={() => navigate('/collections')}>
                          Continue Shopping
                        </button>
                      </div>
                    )
                  }

                  return (
                    <>
                      {!isShipped && (
                        <button 
                          type="button" 
                          className="btn-cancel-modal-action"
                          onClick={() => handleCancelOrderFromModal(placedOrder._id)}
                          disabled={cancellingId === placedOrder._id}
                        >
                          {cancellingId === placedOrder._id ? 'Cancelling...' : '🚫 Cancel Order'}
                        </button>
                      )}
                      <button 
                        type="button" 
                        className="btn-primary-modal-action"
                        onClick={() => navigate('/orders')}
                      >
                        View Orders in Account
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary-modal-action"
                        onClick={() => navigate('/collections')}
                      >
                        Continue Shopping
                      </button>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Checkout
