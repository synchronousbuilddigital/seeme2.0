import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartContext } from '../context/CartContext'
import { API_ENDPOINTS, RAZORPAY_KEY_ID } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './Checkout.css'

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod'
  })

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.length === 0) {
      navigate('/')
    }
  }, [cart, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      // Handle both string and number prices, with safety checks
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
    const subtotal = calculateSubtotal()
    return subtotal >= 50000 ? 0 : 500
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping()
  }

  const validateForm = () => {
    const { name, email, phone, street, city, state, pincode } = formData
    
    if (!name || !email || !phone || !street || !city || !state || !pincode) {
      alert('Please fill in all required fields')
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address')
      return false
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(phone)) {
      alert('Please enter a valid 10-digit phone number')
      return false
    }

    // Pincode validation
    const pincodeRegex = /^[0-9]{6}$/
    if (!pincodeRegex.test(pincode)) {
      alert('Please enter a valid 6-digit pincode')
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
      // Create Razorpay order
      const response = await fetch(API_ENDPOINTS.CREATE_RAZORPAY_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: calculateTotal() })
      })

      const { data: razorpayOrder } = await response.json()

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'SEE MEE',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async function (response) {
          // Verify payment
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
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#D4AF37'
        }
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

    if (!validateForm()) {
      return
    }

    setLoading(true)

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
        // Normalize ID
        const itemId = item.id || item._id
        
        // Handle both string and number prices
        let price = 0
        if (item.price) {
          if (typeof item.price === 'string') {
            price = parseInt(item.price.replace(/[₹,]/g, '')) || 0
          } else if (typeof item.price === 'number') {
            price = item.price
          }
        }
        return {
          productId: itemId,
          name: item.name,
          price: price,
          quantity: item.quantity,
          image: item.images?.[0] || item.image
        }
      }),
      totalAmount: calculateTotal(),
      paymentMethod: formData.paymentMethod
    }

    if (formData.paymentMethod === 'online') {
      handleRazorpayPayment(orderData)
    } else {
      // Cash on Delivery
      try {
        const response = await fetch(API_ENDPOINTS.VERIFY_PAYMENT, {
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
          alert('Order failed. Please try again.')
        }
      } catch (error) {
        console.error('Order error:', error)
        alert('Order failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-content">
          <div className="checkout-form-section">
            <h1>Checkout</h1>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Shipping Information</h2>
                
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="street">Street Address *</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="pincode">Pincode *</label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="6-digit code"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Payment Method</h2>
                
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-content">
                      <span className="payment-title">Online Payment</span>
                      <span className="payment-desc">Pay securely with Razorpay</span>
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleChange}
                    />
                    <div className="payment-option-content">
                      <span className="payment-title">Cash on Delivery</span>
                      <span className="payment-desc">Pay when you receive</span>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="place-order-btn"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          <div className="order-summary-section">
            <div className="order-summary">
              <h2>Order Summary</h2>
              
              <div className="summary-items">
                {cart.map((item) => {
                  // Normalize ID
                  const itemId = item.id || item._id
                  
                  // Handle both string and number prices for display
                  let displayPrice = '₹0'
                  if (item.price) {
                    if (typeof item.price === 'string') {
                      displayPrice = item.price
                    } else if (typeof item.price === 'number') {
                      displayPrice = `₹${item.price.toLocaleString('en-IN')}`
                    }
                  }
                  
                  return (
                    <div key={itemId} className="summary-item">
                      <img 
                        src={getOptimizedImageUrl(item.images?.[0] || item.image, 'thumbnail')} 
                        alt={item.name} 
                      />
                      <div className="summary-item-details">
                        <h3>{item.name}</h3>
                        <p>Qty: {item.quantity}</p>
                      </div>
                      <span className="summary-item-price">{displayPrice}</span>
                    </div>
                  )
                })}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>
                    {calculateShipping() === 0 ? (
                      <span className="free-shipping">FREE</span>
                    ) : (
                      `₹${calculateShipping()}`
                    )}
                  </span>
                </div>
                {calculateSubtotal() < 50000 && (
                  <div className="shipping-note">
                    Add ₹{(50000 - calculateSubtotal()).toLocaleString('en-IN')} more for free shipping
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
