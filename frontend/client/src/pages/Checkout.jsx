import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CartContext } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { API_ENDPOINTS, RAZORPAY_KEY_ID } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './Checkout.css'

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext)
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
    paymentMethod: 'cod',
    giftWrap: false
  })
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)

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

  const handleAddressSelect = (addr) => {
    setSelectedAddressId(addr._id)
    setFormData(prev => ({
      ...prev,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode
    }))
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

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

  const calculateTotal = () => {
    let total = calculateSubtotal() + calculateShipping()
    if (formData.giftWrap) total += 250
    return total
  }

  const calculateShipping = () => {
    return 500 // Fixed for white glove as per user's real data request
  }

  const validateForm = () => {
    const { name, email, phone, street, city, state, pincode } = formData
    
    // Trim all inputs for validation
    const trimmedPincode = pincode.trim()
    const trimmedPhone = phone.trim()

    if (!name || !email || !trimmedPhone || !street || !city || !state || !trimmedPincode) {
      alert('Please fill in all required fields')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      alert('Please enter a valid email address')
      return false
    }

    // Relaxed phone validation: at least 10 digits, allow optional + prefix
    const phoneRegex = /^\+?[0-9]{10,15}$/
    if (!phoneRegex.test(trimmedPhone.replace(/\s/g, ''))) {
      alert('Please enter a valid phone number (at least 10 digits)')
      return false
    }

    // Relaxed pincode validation: 4 to 10 characters, allowing alphanumeric for international support
    const pincodeRegex = /^[a-zA-Z0-9\s-]{4,10}$/
    if (!pincodeRegex.test(trimmedPincode)) {
      alert('Please enter a valid pincode/zipcode')
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

      // Handle Mock Mode
      if (razorpayOrder.id.startsWith('order_mock_')) {
        console.warn('⚠️ Entering Mock Payment Mode');
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
          alert('MOCK PAYMENT SUCCESSFUL! (Razorpay is in test/mock mode)')
          navigate('/orders')
        } else {
          alert('Mock payment failed: ' + result.message)
        }
        return;
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'SEE MEE',
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
            clearCart()
            alert('Payment successful! Your order has been placed.')
            navigate('/orders')
          } else {
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: '#D4AF37' }
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
    const orderData = {
      customer: {
        name: formData.name, email: formData.email, phone: formData.phone,
        address: { street: formData.street, city: formData.city, state: formData.state, pincode: formData.pincode, country: 'India' }
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
          size: item.size || 'M',
          color: item.color || 'Standard',
          image: item.images?.[0] || item.image 
        }
      }),
      totalAmount: calculateTotal(),
      paymentMethod: formData.paymentMethod
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
      <header className="checkout-header-luxury">
        <div className="header-container-luxury">
          <span className="editorial-mini-label">Checkout</span>
          <h1 className="checkout-main-title">Complete Your Order</h1>
        </div>
      </header>

      <div className="checkout-grid-luxury">
        {/* Left: Shipping & Payment Form */}
        <div className="checkout-form-column">
          <form onSubmit={handleSubmit} className="luxury-form">
            <section className="form-luxury-section">
              <h2 className="section-title-luxury">Delivery Details</h2>
              
              {user && addresses.length > 0 && (
                <div className="saved-addresses-luxury">
                  <span className="mini-title">Saved Addresses</span>
                  <div className="address-pills">
                    {addresses.map(addr => (
                      <div 
                        key={addr._id} 
                        className={`address-pill ${selectedAddressId === addr._id ? 'active' : ''}`}
                        onClick={() => handleAddressSelect(addr)}
                      >
                        <span className="pill-text">{addr.city}, {addr.pincode}</span>
                        {addr.isDefault && <span className="pill-badge">Default</span>}
                      </div>
                    ))}
                    <div className="address-pill new" onClick={() => setSelectedAddressId(null)}>
                      + New Address
                    </div>
                  </div>
                </div>
              )}

              <div className="input-group-luxury">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Prasad Shaswat" required />
              </div>

              <div className="input-row-luxury">
                <div className="input-group-luxury">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="prasadshaswat9265@gmail.com" required />
                </div>
                <div className="input-group-luxury">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="09265318481" required />
                </div>
              </div>

              <div className="input-group-luxury">
                <label>Shipping Address</label>
                <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Siliver Residency Dindoli surat 118" required />
              </div>

              <div className="input-row-luxury tri">
                <div className="input-group-luxury">
                  <label>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Surat" required />
                </div>
                <div className="input-group-luxury">
                  <label>State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Gujarat" required />
                </div>
                <div className="input-group-luxury">
                  <label>Pincode</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="394210" required />
                </div>
              </div>
            </section>

            <section className="form-luxury-section">
              <h2 className="section-title-luxury">Method of Payment</h2>
              <div className="payment-grid-luxury">
                <label className={`payment-card-luxury ${formData.paymentMethod === 'online' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="online" checked={formData.paymentMethod === 'online'} onChange={handleChange} />
                  <div className="payment-card-content">
                    <span className="method-title">Pay Online</span>
                    <span className="method-desc">Razorpay / Card / UPI</span>
                  </div>
                </label>

                <label className={`payment-card-luxury ${formData.paymentMethod === 'cod' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} />
                  <div className="payment-card-content">
                    <span className="method-title">On Delivery</span>
                    <span className="method-desc">Cash / QR at doorstep</span>
                  </div>
                </label>
              </div>
            </section>
 
             <section className="form-luxury-section">
               <h2 className="section-title-luxury">Extra Options</h2>
               <label className={`luxury-checkbox ${formData.giftWrap ? 'active' : ''}`}>
                 <input 
                   type="checkbox" 
                   checked={formData.giftWrap} 
                   onChange={(e) => setFormData({...formData, giftWrap: e.target.checked})} 
                 />
                 <div className="checkbox-content">
                   <span className="option-title">Gift Wrapping (+₹250)</span>
                   <span className="option-desc">Premium gift wrap with silk ribbons.</span>
                 </div>
               </label>
             </section>

            <motion.button 
              type="submit" 
              className="place-order-luxury-btn"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </motion.button>
          </form>
        </div>

        {/* Right: Summary Sidebar */}
        <aside className="checkout-summary-column">
          <div className="summary-card-luxury">
            <h2 className="summary-title-luxury">Order Summary</h2>
            
            <div className="summary-items-scroll">
              {cart.map((item) => (
                <div key={item.id || item._id} className="mini-item-luxury">
                  <div className="mini-item-media">
                    <img src={getOptimizedImageUrl(item.images?.[0] || item.image, 'thumbnail')} alt={item.name} />
                  </div>
                  <div className="mini-item-info">
                    <h4>{item.name}</h4>
                    <span>Qty: {item.quantity} | Size: <strong>{item.selectedSize || item.size || 'S'}</strong></span>
                  </div>
                  <div className="mini-item-price">
                    ₹{(typeof item.price === 'number' ? item.price : parseInt(item.price.replace(/[₹,]/g, '')) || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-calculations">
              <div className="calc-line">
                <span>Subtotal</span>
                <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="calc-line">
                <span>Shipping</span>
                <span className={calculateShipping() === 0 ? 'free' : ''}>
                  {calculateShipping() === 0 ? 'Free' : `₹${calculateShipping()}`}
                </span>
              </div>
              {formData.giftWrap && (
                <div className="calc-line">
                  <span>Gift Wrap</span>
                  <span>₹250</span>
                </div>
              )}
            </div>

            <div className="summary-total-luxury">
              <span className="total-label">Total</span>
              <span className="total-value">₹{calculateTotal().toLocaleString('en-IN')}</span>
            </div>

            <div className="checkout-trust">
              <div className="trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Secure Payment</span>
              </div>
              <div className="trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Checkout
