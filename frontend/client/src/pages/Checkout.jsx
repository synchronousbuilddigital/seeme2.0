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
    couponLoading,
    applyCoupon,
    removeCoupon,
    availableCoupons
  } = useContext(CartContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { user, token } = useAuth()
  const [orderType, setOrderType] = useState('ONLINE')
  
  const [formData, setFormData] = useState(() => {
    let savedLocal = null
    try {
      const item = localStorage.getItem('seemee-last-shipping-address')
      if (item) savedLocal = JSON.parse(item)
    } catch (e) {
      console.error('Error parsing local shipping address:', e)
    }
    return {
      name: savedLocal?.name || user?.name || '',
      email: savedLocal?.email || user?.email || '',
      phone: savedLocal?.phone || user?.phone || '',
      street: savedLocal?.street || '',
      city: savedLocal?.city || '',
      state: savedLocal?.state || '',
      pincode: savedLocal?.pincode || '',
      paymentMethod: savedLocal?.paymentMethod || 'online'
    }
  })
  
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [saveAddress, setSaveAddress] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [addressSaveSuccess, setAddressSaveSuccess] = useState('')
  const [addressFormError, setAddressFormError] = useState('')

  const [checkoutCouponCode, setCheckoutCouponCode] = useState('')
  const [checkoutCouponError, setCheckoutCouponError] = useState('')
  const [isOnlineCodEnabled, setIsOnlineCodEnabled] = useState(true)

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.COD_STATUS || (API_ENDPOINTS.SITE_SETTINGS + '/cod-status')}?_t=${Date.now()}`, { cache: 'no-store' })
        const data = await res.json()
        if (data && typeof data.isOnlineCodEnabled === 'boolean') {
          const codEnabled = data.isOnlineCodEnabled
          setIsOnlineCodEnabled(codEnabled)
          if (!codEnabled && formData.paymentMethod === 'cod' && orderType === 'ONLINE') {
            setFormData(prev => ({ ...prev, paymentMethod: 'online' }))
          }
        } else {
          const fallbackRes = await fetch(`${API_ENDPOINTS.SITE_SETTINGS}?_t=${Date.now()}`, { cache: 'no-store' })
          const fallbackData = await fallbackRes.json()
          const payload = fallbackData?.data || fallbackData
          if (payload && payload.isOnlineCodEnabled !== undefined) {
            const codEnabled = payload.isOnlineCodEnabled !== false
            setIsOnlineCodEnabled(codEnabled)
            if (!codEnabled && formData.paymentMethod === 'cod' && orderType === 'ONLINE') {
              setFormData(prev => ({ ...prev, paymentMethod: 'online' }))
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load site settings in checkout:', err)
      }
    }
    fetchSiteSettings()
  }, [orderType])

  // Offline Store Pincode Verification State
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [offlinePincodeInput, setOfflinePincodeInput] = useState('')
  const [offlineVerifying, setOfflineVerifying] = useState(false)
  const [offlinePincodeError, setOfflinePincodeError] = useState('')
  const [offlineVerified, setOfflineVerified] = useState(false)

  const handleOfflineStoreClick = () => {
    if (offlineVerified && String(formData.pincode || '').trim() === '122103') {
      setOrderType('OFFLINE')
      return
    }
    setOfflinePincodeInput(formData.pincode || '')
    setOfflinePincodeError('')
    setShowOfflineModal(true)
  }

  const handleVerifyOfflinePincodeSubmit = async (e) => {
    if (e) e.preventDefault()
    const trimmed = String(offlinePincodeInput || '').trim()

    if (!trimmed) {
      setOfflinePincodeError('Please enter your 6-digit pincode.')
      return
    }

    setOfflineVerifying(true)
    setOfflinePincodeError('')

    try {
      const res = await fetch(API_ENDPOINTS.VERIFY_OFFLINE_PINCODE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: trimmed })
      })
      const data = await res.json()

      if (data.success && data.allowed) {
        setOfflineVerified(true)
        setOrderType('OFFLINE')
        setFormData(prev => ({ ...prev, pincode: '122103' }))
        setShowOfflineModal(false)
        setOfflinePincodeError('')
      } else {
        setOfflinePincodeError(data.message || 'Offline store is not available in your area.')
        setOfflineVerified(false)
        setOrderType('ONLINE')
      }
    } catch (err) {
      console.error('Offline pincode check error:', err)
      setOfflinePincodeError('Offline store is not available in your area.')
      setOfflineVerified(false)
      setOrderType('ONLINE')
    } finally {
      setOfflineVerifying(false)
    }
  }

  // Mirror form data to local storage for quick fallback
  useEffect(() => {
    if (formData.street || formData.pincode || formData.city || formData.phone) {
      try {
        localStorage.setItem('seemee-last-shipping-address', JSON.stringify(formData))
      } catch (e) {
        console.error('Error storing local shipping address:', e)
      }
    }
  }, [formData])

  const saveAddressToBackend = async (customAddr) => {
    if (!user || !token) return null
    const addrToSave = customAddr || {
      name: formData.name,
      phone: formData.phone,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      isDefault: addresses.length === 0
    }
    if (!addrToSave.street || !addrToSave.city || !addrToSave.state || !addrToSave.pincode) return null

    try {
      setSavingAddress(true)
      const res = await fetch(API_ENDPOINTS.USERS_ADDRESSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addrToSave)
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setAddresses(data.data)
        const newest = data.data[data.data.length - 1]
        if (newest) {
          setSelectedAddressId(newest._id)
          setFormData(prev => ({
            ...prev,
            name: newest.name || prev.name,
            phone: newest.phone || prev.phone,
            street: newest.street || prev.street,
            city: newest.city || prev.city,
            state: newest.state || prev.state,
            pincode: newest.pincode || prev.pincode
          }))
        }
        setAddressSaveSuccess('Address saved to your profile!')
        setAddressFormError('')
        setTimeout(() => setAddressSaveSuccess(''), 3500)
        return newest
      }
    } catch (err) {
      console.error('Error saving address to profile:', err)
    } finally {
      setSavingAddress(false)
    }
    return null
  }

  const handleCancelNewAddress = () => {
    setAddressFormError('')
    setEditingAddressId(null)
    if (addresses.length > 0) {
      const defaultOrFirst = addresses.find(a => a.isDefault) || addresses[0]
      if (defaultOrFirst) {
        handleAddressSelect(defaultOrFirst)
      }
    }
  }

  const handleStartEditAddress = (addr) => {
    setEditingAddressId(addr._id)
    setSelectedAddressId(addr._id)
    setAddressFormError('')
    setFormData(prev => ({
      ...prev,
      name: addr.name || user?.name || prev.name || '',
      phone: addr.phone || user?.phone || prev.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || ''
    }))
  }

  const handleCancelAddressEdit = () => {
    setEditingAddressId(null)
    setAddressFormError('')
    if (selectedAddressId) {
      const current = addresses.find(a => a._id === selectedAddressId)
      if (current) {
        setFormData(prev => ({
          ...prev,
          name: current.name || prev.name,
          phone: current.phone || prev.phone,
          street: current.street || '',
          city: current.city || '',
          state: current.state || '',
          pincode: current.pincode || ''
        }))
      }
    }
  }

  const handleSaveEditedAddress = async (e) => {
    if (e) e.preventDefault()
    setAddressFormError('')

    const sanitize = (s) => String(s || '').replace(/<[^>]*>?/gm, '').trim()
    const name = sanitize(formData.name)
    const rawPhone = String(formData.phone || '').replace(/\D/g, '').slice(-10)
    const street = sanitize(formData.street)
    const city = sanitize(formData.city)
    const state = sanitize(formData.state)
    const pincode = String(formData.pincode || '').trim()

    if (!name) {
      setAddressFormError('Please enter recipient full name.')
      return
    }
    if (!rawPhone || !/^[6-9]\d{9}$/.test(rawPhone)) {
      setAddressFormError('Compulsory: Please enter a valid 10-digit Indian phone number (starting with 6-9).')
      return
    }
    if (!street) {
      setAddressFormError('Please enter street address / house details.')
      return
    }
    if (!pincode || pincode.length !== 6 || !/^[1-8][0-9]{5}$/.test(pincode)) {
      setAddressFormError('Please enter a valid 6-digit Indian PIN code (must start with 1-8).')
      return
    }
    if (pincodeError) {
      setAddressFormError(`Invalid PIN code: ${pincodeError}`)
      return
    }
    if (!city) {
      setAddressFormError('Please enter city / district.')
      return
    }
    if (!state) {
      setAddressFormError('Please select state.')
      return
    }

    const payload = {
      name,
      phone: rawPhone,
      street,
      city,
      state,
      pincode
    }

    const isMongoId = editingAddressId && /^[0-9a-fA-F]{24}$/.test(editingAddressId)

    try {
      setSavingAddress(true)

      let res, data
      if (isMongoId) {
        res = await fetch(`${API_ENDPOINTS.USERS_ADDRESSES}/${editingAddressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        data = await res.json()
      } else {
        res = await fetch(API_ENDPOINTS.USERS_ADDRESSES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...payload, isDefault: true })
        })
        data = await res.json()
      }

      if (data && data.success && Array.isArray(data.data)) {
        setAddresses(data.data)
        const updated = isMongoId
          ? data.data.find(a => a._id === editingAddressId) || data.data[0]
          : data.data[data.data.length - 1]

        if (updated) {
          setSelectedAddressId(updated._id)
          setFormData(prev => ({
            ...prev,
            name: updated.name || prev.name,
            phone: updated.phone || prev.phone,
            street: updated.street || prev.street,
            city: updated.city || prev.city,
            state: updated.state || prev.state,
            pincode: updated.pincode || prev.pincode
          }))
        }

        setEditingAddressId(null)
        setAddressSaveSuccess('Address updated successfully!')
        setAddressFormError('')
        setTimeout(() => setAddressSaveSuccess(''), 3500)
      } else {
        setAddressFormError(data?.message || 'Failed to update address. Please try again.')
      }
    } catch (err) {
      console.error('Error updating address:', err)
      setAddressFormError('Failed to update address. Please try again.')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleManualSaveAddress = async (e) => {
    if (e) e.preventDefault()
    setAddressFormError('')

    const sanitize = (s) => String(s || '').replace(/<[^>]*>?/gm, '').trim()
    const name = sanitize(formData.name)
    const rawPhone = String(formData.phone || '').replace(/\D/g, '').slice(-10)
    const street = sanitize(formData.street)
    const city = sanitize(formData.city)
    const state = sanitize(formData.state)
    const pincode = String(formData.pincode || '').trim()

    if (!name) {
      setAddressFormError('Please enter recipient full name.')
      return
    }
    if (!rawPhone || !/^[6-9]\d{9}$/.test(rawPhone)) {
      setAddressFormError('Compulsory: Please enter a valid 10-digit Indian phone number (starting with 6-9).')
      return
    }
    if (!street) {
      setAddressFormError('Please enter street address / house details.')
      return
    }
    if (!pincode || pincode.length !== 6 || !/^[1-8][0-9]{5}$/.test(pincode)) {
      setAddressFormError('Please enter a valid 6-digit Indian PIN code (must start with 1-8).')
      return
    }
    if (pincodeError) {
      setAddressFormError(`Invalid PIN code: ${pincodeError}`)
      return
    }
    if (!city) {
      setAddressFormError('Please enter city / district.')
      return
    }
    if (!state) {
      setAddressFormError('Please select state.')
      return
    }

    const saved = await saveAddressToBackend({
      name,
      phone: rawPhone,
      street,
      city,
      state,
      pincode,
      isDefault: addresses.length === 0
    })

    if (!saved) {
      setAddressFormError('Failed to save address. Please check your details and try again.')
    }
  }

  const handleApplyCheckoutCoupon = async (e, codeOverride) => {
    if (e) e.preventDefault()
    const targetCode = codeOverride || checkoutCouponCode
    if (!targetCode || !targetCode.trim()) return
    setCheckoutCouponError('')
    try {
      await applyCoupon(targetCode)
      setCheckoutCouponCode('')
    } catch (err) {
      setCheckoutCouponError(err.message || 'Invalid coupon code.')
    }
  }

  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')

  // Ad2Ship Shipping Rate & Courier Partner state
  const [shippingPartners, setShippingPartners] = useState([])
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const [placedOrder, setPlacedOrder] = useState(null)
  const orderCompletedRef = useRef(false)

  useEffect(() => {
    if (!user || !token) {
      navigate('/auth', { state: { message: 'Please sign in or create an account to proceed to checkout and buy products.', from: '/checkout' } })
    }
  }, [user, token, navigate])

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
              paymentType: formData.paymentMethod === 'cod' ? 'cod' : 'prepaid',
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
    // If order has been placed, is in progress, or is redirecting, DO NOT redirect to home
    if (orderCompletedRef.current || placedOrder || loading) return

    if (cart.length === 0) {
      navigate('/')
    }
  }, [cart, placedOrder, loading, navigate])

  useEffect(() => {
    if (user && token) {
      fetchAddresses()
    }
  }, [user, token])

  const fetchAddresses = async () => {
    try {
      let loadedAddrs = []
      const response = await fetch(API_ENDPOINTS.USERS_ADDRESSES, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        loadedAddrs = data.data
      } else {
        // Fallback to user profile address or local storage
        let savedLocal = null
        try {
          const item = localStorage.getItem('seemee-last-shipping-address')
          if (item) savedLocal = JSON.parse(item)
        } catch (e) {}

        const profileAddr = {
          _id: 'profile-default-addr',
          name: user?.name || savedLocal?.name || '',
          phone: user?.phone || savedLocal?.phone || '',
          street: user?.street || user?.address || savedLocal?.street || '',
          city: user?.city || savedLocal?.city || '',
          state: user?.state || savedLocal?.state || '',
          pincode: user?.pincode || savedLocal?.pincode || '',
          isDefault: true
        }

        if (profileAddr.street || profileAddr.pincode || profileAddr.city) {
          loadedAddrs = [profileAddr]
        }
      }

      setAddresses(loadedAddrs)
      if (loadedAddrs.length > 0) {
        const defaultAddr = loadedAddrs.find(a => a.isDefault) || loadedAddrs[0]
        if (defaultAddr && defaultAddr.street) {
          handleAddressSelect(defaultAddr)
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
    }
  }

  const handleAddressSelect = (address) => {
    setSelectedAddressId(address._id)
    setEditingAddressId(null)
    setAddressFormError('')
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
    if (addressFormError) setAddressFormError('')
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
    const charge = selectedPartner?.shippingCharges ?? selectedPartner?.shippingCharge ?? 0
    return typeof charge === 'number' && !isNaN(charge) && charge >= 0 ? charge : 0
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

    const cleanPhone = trimmedPhone.replace(/\D/g, '').slice(-10)
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      alert('Compulsory: Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9).')
      return false
    }

    const pincodeRegex = /^[1-8][0-9]{5}$/
    if (!pincodeRegex.test(trimmedPincode)) {
      alert('Please enter a valid 6-digit Indian PIN code (must start with 1-8).')
      return false
    }

    if (pincodeError) {
      alert(`Invalid PIN code: ${pincodeError}`)
      return false
    }

    if (orderType === 'OFFLINE' && trimmedPincode !== '122103') {
      alert('Offline store is not available in your area.')
      setOrderType('ONLINE')
      return false
    }

    if (orderType === 'ONLINE' && (!shippingPartners || shippingPartners.length === 0 || shippingError)) {
      alert('Your delivery pincode is not serviceable by our courier partners. Please provide a different address.')
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
      const authHeaders = { 'Content-Type': 'application/json' }
      if (token) authHeaders['Authorization'] = `Bearer ${token}`

      const response = await fetch(API_ENDPOINTS.CREATE_RAZORPAY_ORDER, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          amount: calculateTotal(),
          items: orderData.items,
          couponCode: appliedCoupon?.code || null,
          couponDiscount: couponDiscount || 0
        })
      })
      const { data: razorpayOrder } = await response.json()

      if (razorpayOrder.id.startsWith('order_mock_')) {
        const verifyResponse = await fetch(API_ENDPOINTS.VERIFY_PAYMENT, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: 'pay_mock_' + Date.now(),
            razorpay_signature: 'sig_mock',
            ...orderData
          })
        })
        const result = await verifyResponse.json()
        if (result.success) {
          orderCompletedRef.current = true
          const finalOrder = result.data || {
            _id: 'ORD-' + Date.now(),
            customer: orderData.customer,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            paymentMethod: 'online',
            orderType: orderData.orderType || 'ONLINE',
            status: 'Placed'
          }
          setPlacedOrder(finalOrder)
          sessionStorage.setItem('seemee_last_placed_order', JSON.stringify(finalOrder))
          clearCart()
          const targetSuccessUrl = `/order-success/${finalOrder._id || finalOrder.orderNumber || ''}`
          navigate(targetSuccessUrl, {
            state: { order: finalOrder },
            replace: true
          })
          return
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
            headers: authHeaders,
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...orderData
            })
          })
          const result = await verifyResponse.json()
          if (result.success) {
            orderCompletedRef.current = true
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
            const finalOrder = result.data || {
              _id: 'ORD-' + Date.now(),
              customer: orderData.customer,
              items: orderData.items,
              totalAmount: orderData.totalAmount,
              paymentMethod: 'online',
              orderType: orderData.orderType || 'ONLINE',
              status: 'Placed'
            }
            setPlacedOrder(finalOrder)
            sessionStorage.setItem('seemee_last_placed_order', JSON.stringify(finalOrder))
            clearCart()
            const targetSuccessUrl = `/order-success/${finalOrder._id || finalOrder.orderNumber || ''}`
            navigate(targetSuccessUrl, {
              state: { order: finalOrder },
              replace: true
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

    if (orderType === 'ONLINE' && !isOnlineCodEnabled && formData.paymentMethod === 'cod') {
      alert('Cash on Delivery (COD) is currently disabled for online store orders. Please proceed with Instant Online Payment.')
      setFormData(prev => ({ ...prev, paymentMethod: 'online' }))
      return
    }

    setLoading(true)

    try {
      trackAddShippingInfo(cart, 'Express', '')
      trackAddPaymentInfo(cart, formData.paymentMethod === 'online' ? 'Razorpay' : 'COD', '')
    } catch (e) {
      console.error('GTM checkout tracking error:', e)
    }

    if (user && token && saveAddress && !selectedAddressId) {
      try {
        await saveAddressToBackend()
      } catch (err) {
        console.error('Auto save address error:', err)
      }
    }

    const orderData = {
      user: user?._id || user?.id || null,
      orderType: orderType || 'ONLINE',
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
          color: (item.selectedColor && item.selectedColor.toLowerCase() !== 'standard') ? item.selectedColor : ((item.color && item.color.toLowerCase() !== 'standard') ? item.color : ''),
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
        const authHeaders = { 'Content-Type': 'application/json' }
        if (token) authHeaders['Authorization'] = `Bearer ${token}`

        const response = await fetch(API_ENDPOINTS.ORDERS, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(orderData)
        })
        const result = await response.json()
        if (result.success) {
          orderCompletedRef.current = true
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
          const finalOrder = result.data || {
            _id: 'ORD-' + Date.now(),
            customer: orderData.customer,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            paymentMethod: orderData.paymentMethod,
            orderType: orderData.orderType || 'ONLINE',
            status: 'Placed'
          }
          setPlacedOrder(finalOrder)
          sessionStorage.setItem('seemee_last_placed_order', JSON.stringify(finalOrder))
          clearCart()
          const targetSuccessUrl = `/order-success/${finalOrder._id || finalOrder.orderNumber || ''}`
          navigate(targetSuccessUrl, {
            state: { order: finalOrder },
            replace: true
          })
          return
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

  if (cart.length === 0 && !orderCompletedRef.current && !placedOrder) return null

  const totalItemsCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0)

  return (
    <div className="editorial-checkout">
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
              
              {user && addresses && addresses.length > 0 && (
                <div className="saved-addresses-luxury">
                  <div className="saved-addresses-header">
                    <span className="mini-title">
                      {editingAddressId
                        ? 'Editing Delivery Address'
                        : (!selectedAddressId ? 'Saved Addresses (Click to choose)' : 'Select Shipping Address')}
                    </span>
                    {editingAddressId ? (
                      <button 
                        type="button" 
                        className="btn-cancel-new-addr"
                        onClick={handleCancelAddressEdit}
                        title="Cancel editing address"
                      >
                        ✕ Cancel Edit
                      </button>
                    ) : !selectedAddressId && (
                      <button 
                        type="button" 
                        className="btn-cancel-new-addr"
                        onClick={handleCancelNewAddress}
                        title="Cancel and return to saved addresses"
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>

                  <div className="address-pills">
                    {addresses.map(addr => (
                      <div 
                        key={addr._id} 
                        className={`address-pill ${selectedAddressId === addr._id ? 'active' : ''} ${editingAddressId === addr._id ? 'editing' : ''}`}
                        onClick={() => handleAddressSelect(addr)}
                      >
                        <div className="pill-top">
                          <span className="pill-text">{addr.name || user.name || 'Saved Address'}</span>
                          <div className="pill-actions">
                            {addr.isDefault && <span className="pill-badge">Default</span>}
                            <button
                              type="button"
                              className="btn-pill-edit"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEditAddress(addr)
                              }}
                              title="Edit this address"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                        <span className="pill-sub">
                          {addr.street ? `${addr.street}, ${addr.city || ''}, ${addr.state || ''} ${addr.pincode ? `- ${addr.pincode}` : ''}` : 'Saved Address'}
                        </span>
                      </div>
                    ))}

                    {/* Hide + Add New Address when form is already open or editing */}
                    {selectedAddressId && !editingAddressId && (
                      <div 
                        className="address-pill new" 
                        onClick={() => {
                          setSelectedAddressId(null)
                          setEditingAddressId(null)
                          setAddressFormError('')
                          setFormData(prev => ({
                            ...prev,
                            street: '',
                            city: '',
                            state: '',
                            pincode: ''
                          }))
                        }}
                      >
                        <span>+ Add New Address</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recipient Details & Address Form - shown when adding new address, editing address, or no saved address */}
              {(!selectedAddressId || editingAddressId || addresses.length === 0) && (
                <div className="new-address-form-box">
                  {addresses && addresses.length > 0 && (
                    <div className="new-address-form-header">
                      <span className="new-address-form-title">
                        {editingAddressId ? 'Edit Delivery Address' : 'Enter New Delivery Address'}
                      </span>
                      {editingAddressId && (
                        <span className="edit-address-badge-hint">Updating Saved Address</span>
                      )}
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
                        required={!selectedAddressId}
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
                          required={!selectedAddressId}
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
                          required={!selectedAddressId}
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
                        required={!selectedAddressId}
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
                        required={!selectedAddressId}
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
                        {pincodeLoading && <span className="pincode-status-text">Verifying...</span>}
                      </label>
                      <input 
                        id="checkout-pincode"
                        type="text" 
                        name="pincode" 
                        value={formData.pincode} 
                        onChange={handleChange} 
                        placeholder="6-Digit PIN" 
                        maxLength={6}
                        required={!selectedAddressId}
                      />
                    </div>
                  </div>

                  {addressFormError && (
                    <div className="address-form-error-box">
                      <span>⚠ {addressFormError}</span>
                    </div>
                  )}

                  <div className="address-form-actions">
                    <button
                      type="button"
                      className="btn-save-address-primary"
                      onClick={editingAddressId ? handleSaveEditedAddress : handleManualSaveAddress}
                      disabled={savingAddress}
                    >
                      {savingAddress ? (
                        <>
                          <span className="btn-spinner-sm"></span>
                          <span>{editingAddressId ? 'Updating Address...' : 'Saving Address...'}</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                          </svg>
                          <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                        </>
                      )}
                    </button>

                    {addresses && addresses.length > 0 && (
                      <button
                        type="button"
                        className="btn-cancel-address-secondary"
                        onClick={editingAddressId ? handleCancelAddressEdit : handleCancelNewAddress}
                        disabled={savingAddress}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {addressSaveSuccess && (
                <div className="pincode-alert-box success">
                  <span>✓ {addressSaveSuccess}</span>
                </div>
              )}

              {pincodeError && (
                <div className="pincode-alert-box error">
                  <span>{pincodeError}</span>
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

              <div className="order-type-selector-luxury">
                <label 
                  className={`order-type-card ${orderType === 'ONLINE' ? 'active' : ''}`}
                  onClick={() => {
                    setOrderType('ONLINE')
                  }}
                >
                  <input 
                    type="radio" 
                    name="orderType" 
                    value="ONLINE" 
                    checked={orderType === 'ONLINE'} 
                    onChange={() => {
                      setOrderType('ONLINE')
                    }} 
                  />
                  <div className="order-type-info">
                    <strong className="order-type-title">Online Store</strong>
                    <span className="order-type-desc">Doorstep Delivery (Online or Cash on Delivery)</span>
                  </div>
                </label>

                <div 
                  className={`order-type-card ${orderType === 'OFFLINE' ? 'active' : ''}`}
                  onClick={handleOfflineStoreClick}
                >
                  <input 
                    type="radio" 
                    name="orderType" 
                    value="OFFLINE" 
                    checked={orderType === 'OFFLINE'} 
                    onChange={handleOfflineStoreClick} 
                  />
                  <div className="order-type-info">
                    <strong className="order-type-title">Offline Store</strong>
                    <span className={`order-type-desc ${orderType === 'OFFLINE' ? 'verified' : ''}`}>
                      {orderType === 'OFFLINE' ? '✓ Verified (Pincode: 122103)' : 'Pincode Verification Required (122103)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="section-header-box" style={{ marginTop: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 className="section-title-luxury" style={{ fontSize: '16px' }}>Payment Method</h3>
                  <p className="section-desc">
                    Select Online Payment (Razorpay / UPI / Cards) or Cash on Delivery (COD)
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
                    <div className="payment-title-group">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" className="payment-method-icon">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      <span className="method-title">Instant Online Payment (Razorpay)</span>
                    </div>
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

                {/* COD Option — Only displayed if order is Offline Store or Online COD is enabled */}
                {(orderType === 'OFFLINE' || isOnlineCodEnabled) && (
                  <label className={`payment-card-luxury ${formData.paymentMethod === 'cod' ? 'active' : ''}`} style={{ marginTop: '16px' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="cod" 
                      checked={formData.paymentMethod === 'cod'} 
                      onChange={handleChange} 
                    />
                    <div className="payment-card-content">
                      <div className="payment-title-group">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="payment-method-icon">
                          <path d="M6 3h12" />
                          <path d="M6 8h12" />
                          <path d="m6 13 8.5 8" />
                          <path d="M6 13h3" />
                          <path d="M9 13c6.667 0 6.667-10 0-10" />
                        </svg>
                        <span className="method-title">Cash on Delivery (COD)</span>
                      </div>
                      <span className="method-desc">Pay cash upon delivery at your doorstep. Verified before dispatch.</span>
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
                    ? `Place Cash on Delivery Order — ₹${calculateTotal().toLocaleString('en-IN')}`
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
                      {((item.selectedColor || item.color) && (item.selectedColor || item.color).toLowerCase() !== 'standard') && <span className="meta-chip">Colour: {item.selectedColor || item.color}</span>}
                    </div>
                  </div>
                  <div className="mini-item-price">
                    ₹{((typeof item.price === 'number' ? item.price : parseInt(item.price.replace(/[₹,]/g, '')) || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Coupon Application Box */}
            <div className="checkout-coupon-box desktop-checkout-coupon">
              <div className="checkout-coupon-header">
                <span className="checkout-coupon-title">PROMO / COUPON CODE</span>
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <span className="checkout-coupon-badge">{availableCoupons.length} AVAILABLE</span>
                )}
              </div>
              {appliedCoupon ? (
                <div className="checkout-applied-coupon">
                  <div className="applied-info">
                    <span className="gold-code">✦ {appliedCoupon.code} APPLIED</span>
                    <span className="savings-tag">Savings: ₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                  <button type="button" className="btn-remove-checkout-coupon" onClick={() => removeCoupon()} title="Remove Coupon">
                    Remove ✕
                  </button>
                </div>
              ) : (
                <>
                  {availableCoupons.length > 0 && (
                    <div className="checkout-select-wrap">
                      <select
                        className="checkout-coupon-select-dropdown"
                        value={checkoutCouponCode}
                        onChange={(e) => {
                          const code = e.target.value
                          setCheckoutCouponCode(code)
                          if (code) {
                            handleApplyCheckoutCoupon(null, code)
                          }
                        }}
                        disabled={couponLoading}
                      >
                        <option value="">Select an available coupon ({availableCoupons.length})</option>
                        {availableCoupons.map(c => (
                          <option key={c._id || c.code} value={c.code}>
                            {c.code} ({c.percentage ? `${c.percentage}% OFF` : `₹${c.fixedAmount} OFF`}{c.minimumOrder > 0 ? ` — Minimum Order: ₹${c.minimumOrder.toLocaleString('en-IN')}` : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <form onSubmit={handleApplyCheckoutCoupon} className="checkout-coupon-form">
                    <input
                      type="text"
                      placeholder="Or enter custom code"
                      value={checkoutCouponCode}
                      onChange={(e) => setCheckoutCouponCode(e.target.value.toUpperCase())}
                      disabled={couponLoading}
                    />
                    <button type="submit" disabled={couponLoading || !checkoutCouponCode.trim()}>
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                  {checkoutCouponError && (
                    <span className="checkout-coupon-error">{checkoutCouponError}</span>
                  )}
                </>
              )}
            </div>

            <div className="summary-calculations">
              <div className="calc-line">
                <span>Items Subtotal</span>
                <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
              </div>
              <div className="calc-line">
                <span>Insured Express Shipping</span>
                <span className={calculateShipping() > 0 ? '' : 'green-text'}>
                  {calculateShipping() > 0 ? `₹${calculateShipping().toLocaleString('en-IN')}` : 'FREE'}
                </span>
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
          onClick={() => {
            const form = document.getElementById('checkout-luxury-form')
            if (form && !form.checkValidity()) {
              form.reportValidity()
            }
          }}
        >
          {loading ? (
            <span className="btn-loading-state">
              <span className="btn-spinner"></span>
              Processing...
            </span>
          ) : (
            <span>
              {formData.paymentMethod === 'cod' ? 'Place COD Order →' : 'Proceed to Pay →'}
            </span>
          )}
        </button>
      </div>

      {/* Offline Store Pincode Verification Modal */}
      {showOfflineModal && (
        <div 
          className="offline-pincode-modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => {
            setShowOfflineModal(false)
            setOfflinePincodeError('')
          }}
        >
          <div 
            className="offline-pincode-modal-card" 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '32px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1.5px solid #d4af37',
              color: '#b8860b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>

            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '22px',
              fontWeight: '500',
              color: '#1c1917',
              marginBottom: '8px'
            }}>
              Offline Store Access
            </h3>

            <p style={{
              fontSize: '13px',
              color: '#78716c',
              lineHeight: '1.5',
              marginBottom: '20px'
            }}>
              Offline Store & Cash on Delivery options are exclusively available in select regions. Please enter your 6-digit delivery pincode to proceed.
            </p>

            <form onSubmit={handleVerifyOfflinePincodeSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={offlinePincodeInput}
                  onChange={(e) => {
                    setOfflinePincodeInput(e.target.value.replace(/\D/g, ''))
                    setOfflinePincodeError('')
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '18px',
                    fontWeight: '700',
                    letterSpacing: '0.15em',
                    textAlign: 'center',
                    borderRadius: '12px',
                    border: offlinePincodeError ? '1.5px solid #ef4444' : '1.5px solid #d6d3d1',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              {offlinePincodeError && (
                <div style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{offlinePincodeError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowOfflineModal(false)
                    setOfflinePincodeError('')
                    setOrderType('ONLINE')
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #d6d3d1',
                    background: '#f5f5f4',
                    color: '#44403c',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offlineVerifying}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1c1917 0%, #000000 100%)',
                    color: '#d4af37',
                    fontSize: '13px',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {offlineVerifying ? 'Checking...' : 'Verify Pincode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout
