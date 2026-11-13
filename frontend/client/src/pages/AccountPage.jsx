import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { API_ENDPOINTS, getAdminUrl } from '../config/api'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { fetchPincodeDetails } from '../utils/pincodeService'
import { printOrderInvoice } from '../utils/invoiceHelper'
import './AccountPage.css'

const EMPTY_ADDRESS = {
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false
}

const ORDER_STEPS = ['placed', 'confirmed', 'shipped', 'delivered']

const ACTIVE_ORDER_STATUSES = [
  'pending',
  'processing',
  'confirmed',
  'approved',
  'placed',
  'shipped',
  'in_transit',
  'out_for_delivery'
]

const SHIPPED_STATUSES = [
  'shipped',
  'delivered',
  'in_transit',
  'out_for_delivery',
  'picked_up'
]

const formatCurrency = (value) =>
  `â‚¹${Number(value || 0).toLocaleString('en-IN')}`

const formatDate = (value) => {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const readResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return {
      success: response.ok,
      message: response.ok
        ? ''
        : `Request failed with status ${response.status}`
    }
  }

  try {
    return await response.json()
  } catch {
    return {
      success: false,
      message: 'The server returned an invalid response.'
    }
  }
}

const getStatusStyle = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'delivered':
      return {
        bg: 'rgba(34, 197, 94, 0.12)',
        text: '#16a34a',
        border: 'rgba(34, 197, 94, 0.3)'
      }

    case 'shipped':
    case 'in_transit':
    case 'out_for_delivery':
      return {
        bg: 'rgba(14, 165, 233, 0.12)',
        text: '#0284c7',
        border: 'rgba(14, 165, 233, 0.3)'
      }

    case 'processing':
    case 'confirmed':
    case 'approved':
      return {
        bg: 'rgba(234, 179, 8, 0.12)',
        text: '#ca8a04',
        border: 'rgba(234, 179, 8, 0.3)'
      }

    case 'cancelled':
      return {
        bg: 'rgba(239, 68, 68, 0.12)',
        text: '#dc2626',
        border: 'rgba(239, 68, 68, 0.3)'
      }

    default:
      return {
        bg: 'rgba(120, 113, 108, 0.12)',
        text: '#78716c',
        border: 'rgba(120, 113, 108, 0.3)'
      }
  }
}

const Icon = ({ name, size = 18 }) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )

    case 'orders':
      return (
        <svg {...commonProps}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      )

    case 'heart':
      return (
        <svg {...commonProps}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
        </svg>
      )

    case 'user':
      return (
        <svg {...commonProps}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )

    case 'location':
      return (
        <svg {...commonProps}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )

    case 'logout':
      return (
        <svg {...commonProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      )

    case 'back':
      return (
        <svg {...commonProps}>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      )

    case 'print':
      return (
        <svg {...commonProps}>
          <path d="M6 9V2h12v7" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      )

    case 'mail':
      return (
        <svg {...commonProps}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 6-10 7L2 6" />
        </svg>
      )

    case 'trash':
      return (
        <svg {...commonProps}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6v14H5V6" />
        </svg>
      )

    case 'edit':
      return (
        <svg {...commonProps}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14h14a2 2 0 0 0 2-2v-7" />
          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4Z" />
        </svg>
      )

    case 'eye':
      return (
        <svg {...commonProps}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )

    case 'eye-off':
      return (
        <svg {...commonProps}>
          <path d="m1 1 22 22" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c7 0 11 8 11 8a17 17 0 0 1-2.2 3.2" />
          <path d="M6.1 6.1A18 18 0 0 0 1 12s4 8 11 8a10 10 0 0 0 5.9-1.9" />
        </svg>
      )

    default:
      return null
  }
}

const OrderCard = ({
  order,
  user,
  expanded,
  cancelling,
  onToggle,
  onCancel,
  onPrint
}) => {
  const status = String(order.status || 'placed').toLowerCase()
  const shippingStatus = String(order.shipping?.status || '').toLowerCase()
  const statusStyle = getStatusStyle(status)
  const currentStepIndex = Math.max(ORDER_STEPS.indexOf(status), 0)

  const isOfflineCod =
    String(order.orderType || '').toUpperCase() === 'OFFLINE' &&
    String(order.paymentMethod || '').toLowerCase() === 'cod'

  const isCodApproved =
    String(order.paymentStatus || '').toLowerCase() === 'paid' ||
    ['confirmed', 'approved', 'processing', 'cod approved'].includes(status)

  const alreadyShipped =
    SHIPPED_STATUSES.includes(status) ||
    SHIPPED_STATUSES.includes(shippingStatus) ||
    Boolean(
      order.shipping?.awbNumber ||
      order.shipping?.pickupAt ||
      order.trackingNumber
    )

  const address =
    order.deliveryAddress ||
    order.shippingAddress ||
    order.customer?.address ||
    order.billingAddress ||
    user?.addresses?.find((item) => item.isDefault) ||
    user?.addresses?.[0]

  const addressName =
    address?.name || order.customer?.name || user?.name || 'Valued Client'

  const addressPhone =
    address?.phone || order.customer?.phone || user?.phone || ''

  return (
    <motion.article
      layout
      className={`order-card-container ${expanded ? 'expanded' : ''}`}
    >
      <button
        type="button"
        className="order-summary-row"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="order-main-info">
          <div className="order-id-badge">
            <strong>Order #{order.orderNumber || order._id}</strong>
            <span className="order-date-str">
              Placed on {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        <div className="order-summary-right">
          <span
            className="order-status-pill"
            style={{
              background: statusStyle.bg,
              color: statusStyle.text,
              border: `1px solid ${statusStyle.border}`
            }}
          >
            {order.status || 'Pending'}
          </span>

          <div className="order-amount-display">
            <span className="amount-label">Total</span>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>

          <span className="order-toggle-btn">
            {expanded ? 'Hide Details â–²' : 'View Details â–¼'}
          </span>
        </div>
      </button>

      {!expanded && (
        <div className="order-items-strip">
          {(order.items || []).map((item, index) => (
            <div
              key={item._id || `${item.name}-${index}`}
              className="strip-item"
            >
              <img
                src={getOptimizedImageUrl(item.image)}
                alt={item.name || 'Ordered product'}
                className="strip-thumb"
              />

              <div className="strip-text">
                <span className="strip-name">{item.name}</span>
                <span className="strip-spec">
                  Qty: {item.quantity || 1}
                  {item.size ? ` â€¢ Size: ${item.size}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="order-detail-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="order-progress-wrapper">
              <h4 className="progress-title">Order Status Timeline</h4>

              {status === 'cancelled' ? (
                <div className="timeline-cancelled-banner">
                  <span className="cancelled-icon-badge">Ã—</span>
                  <span className="cancelled-text">
                    This order is cancelled
                  </span>
                </div>
              ) : isOfflineCod ? (
                <div className="cod-handover-banner-box">
                  <div
                    className={
                      isCodApproved
                        ? 'cod-approved-handover'
                        : 'cod-pending-approval'
                    }
                  >
                    <div
                      className={`handover-icon-circle ${
                        isCodApproved ? 'green' : 'amber'
                      }`}
                    >
                      <Icon name="orders" />
                    </div>

                    <div className="handover-text">
                      <span
                        className={`handover-mini-tag ${
                          isCodApproved ? '' : 'amber'
                        }`}
                      >
                        {isCodApproved ? 'ADMIN APPROVED' : 'PROCESSING'}
                      </span>

                      <strong
                        className={`handover-main-title ${
                          isCodApproved ? '' : 'amber'
                        }`}
                      >
                        {isCodApproved
                          ? 'ORDER HANDOVER'
                          : 'ORDER PROCESSING'}
                      </strong>

                      <p className="handover-sub">
                        {isCodApproved
                          ? 'COD payment verified and the item was handed over to the customer.'
                          : 'Your Cash on Delivery order is processing. Handover will be confirmed shortly.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="progress-bar-steps">
                  {ORDER_STEPS.map((step, index) => (
                    <div
                      key={step}
                      className={`progress-step-item ${
                        index <= currentStepIndex ? 'completed' : ''
                      } ${index === currentStepIndex ? 'active' : ''}`}
                    >
                      <div className="step-dot">
                        {index <= currentStepIndex ? 'âœ“' : index + 1}
                      </div>
                      <span className="step-name">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="order-detail-grid">
              <section className="order-section items-section">
                <h4 className="order-section-title">
                  Items in Order ({order.items?.length || 0})
                </h4>

                <div className="order-items-detailed-list">
                  {(order.items || []).map((item, index) => (
                    <div
                      key={item._id || `${item.name}-${index}`}
                      className="order-item-row"
                    >
                      <img
                        src={getOptimizedImageUrl(item.image)}
                        alt={item.name || 'Ordered product'}
                        className="item-thumb-large"
                      />

                      <div className="item-info-meta">
                        <strong className="item-title">{item.name}</strong>

                        <div className="item-tags">
                          {item.size && (
                            <span className="item-tag">
                              Size: {item.size}
                            </span>
                          )}

                          {item.color && (
                            <span className="item-tag">
                              Color: {item.color}
                            </span>
                          )}

                          <span className="item-tag">
                            Qty: {item.quantity || 1}
                          </span>
                        </div>
                      </div>

                      <strong className="item-row-price">
                        {formatCurrency(
                          Number(item.price || 0) *
                            Number(item.quantity || 1)
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>

              <div className="order-side-info-col">
                <section className="order-section delivery-section">
                  <h4 className="order-section-title">
                    <Icon name="location" size={15} /> Delivery Address
                  </h4>

                  <div className="address-info-box">
                    <strong>{addressName}</strong>

                    {address?.street && <p>{address.street}</p>}

                    {(address?.city ||
                      address?.state ||
                      address?.pincode) && (
                      <p>
                        {[address?.city, address?.state]
                          .filter(Boolean)
                          .join(', ')}
                        {address?.pincode
                          ? ` - ${address.pincode}`
                          : ''}
                      </p>
                    )}

                    {addressPhone && <p>+91 {addressPhone}</p>}

                    {!address && (
                      <>
                        <p>{order.customer?.email || user?.email}</p>
                        <p className="no-info">
                          Delivery address unavailable
                        </p>
                      </>
                    )}
                  </div>
                </section>

                <section className="order-section payment-section">
                  <h4 className="order-section-title">
                    Payment Details
                  </h4>

                  <div className="payment-info-box">
                    <div className="payment-row">
                      <span>Method:</span>
                      <strong>
                        {String(order.paymentMethod).toLowerCase() ===
                        'online'
                          ? 'Card / UPI / Online'
                          : 'Cash on Delivery'}
                      </strong>
                    </div>

                    <div className="payment-row">
                      <span>Status:</span>
                      <strong
                        className={`payment-status ${
                          status === 'cancelled'
                            ? 'cancelled'
                            : String(
                                order.paymentStatus || 'pending'
                              ).toLowerCase()
                        }`}
                      >
                        {status === 'cancelled'
                          ? 'CANCELLED'
                          : String(
                              order.paymentStatus || 'pending'
                            ).toUpperCase()}
                      </strong>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="order-detail-actions">
              {status !== 'cancelled' && !alreadyShipped && (
                <button
                  type="button"
                  className="btn-editorial outline cancel-btn-editorial"
                  onClick={onCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}

              <button
                type="button"
                className="btn-editorial gold"
                onClick={onPrint}
              >
                <Icon name="print" size={14} />
                <span>Print Invoice</span>
              </button>

              <a
                className="btn-editorial outline"
                href="mailto:bizseemee@gmail.com?subject=SEEMEE%20Customer%20Support%20Inquiry"
              >
                <Icon name="mail" size={14} />
                <span>Contact Support</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

const AccountPage = () => {
  const { user, logout, token, updateUser } = useAuth()
  const { wishlist = [], toggleWishlist, addToCart } = useCart()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)

  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    password: ''
  })

  const [message, setMessage] = useState({
    type: '',
    text: ''
  })

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showAccountPassword, setShowAccountPassword] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS)
  const [pincodeLoading, setPincodeLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text })
  }, [])

  const resetAddressForm = useCallback(
    (defaultAddress = false) => {
      setNewAddress({
        ...EMPTY_ADDRESS,
        name: user?.name || '',
        phone: user?.phone || '',
        isDefault: defaultAddress
      })
      setEditingAddressId(null)
      setPincodeError('')
    },
    [user]
  )

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }

    setProfileData({
      name: user.name || '',
      phone: user.phone || '',
      password: ''
    })
  }, [user, navigate])

  useEffect(() => {
    const pincode = String(newAddress.pincode || '').trim()

    setPincodeError('')

    if (!/^\d{6}$/.test(pincode)) {
      setPincodeLoading(false)
      return undefined
    }

    let active = true

    const timer = window.setTimeout(async () => {
      setPincodeLoading(true)

      try {
        const result = await fetchPincodeDetails(pincode)

        if (!active) return

        if (result.success) {
          setNewAddress((current) => ({
            ...current,
            city: result.city || current.city,
            state: result.state || current.state
          }))
          setPincodeError('')
        } else if (!result.aborted) {
          setPincodeError(
            result.error || 'Invalid or non-existent PIN code.'
          )
          setNewAddress((current) => ({
            ...current,
            city: '',
            state: ''
          }))
        }
      } catch {
        if (active) {
          setPincodeError('Unable to verify this PIN code.')
        }
      } finally {
        if (active) {
          setPincodeLoading(false)
        }
      }
    }, 400)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [newAddress.pincode])

  useEffect(() => {
    if (!user || !token) return undefined

    let active = true

    const loadAccountData = async (showLoader = false) => {
      if (showLoader) {
        setLoading(true)
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`
        }

        const [ordersResponse, addressesResponse] = await Promise.all([
          fetch(API_ENDPOINTS.ORDERS_MY, { headers }),
          fetch(API_ENDPOINTS.USERS_ADDRESSES, { headers })
        ])

        if (
          ordersResponse.status === 401 ||
          addressesResponse.status === 401
        ) {
          logout()
          navigate('/auth', { replace: true })
          return
        }

        const [ordersResult, addressesResult] = await Promise.all([
          readResponse(ordersResponse),
          readResponse(addressesResponse)
        ])

        if (!active) return

        if (
          ordersResponse.ok &&
          ordersResult.success &&
          Array.isArray(ordersResult.data)
        ) {
          setOrders(ordersResult.data)
        }

        if (
          addressesResponse.ok &&
          addressesResult.success &&
          Array.isArray(addressesResult.data)
        ) {
          setAddresses(addressesResult.data)
        }
      } catch (error) {
        console.error('Unable to load account data:', error)

        if (active && showLoader) {
          showMessage(
            'error',
            'Unable to load your account information.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadAccountData(true)

    const interval = window.setInterval(() => {
      loadAccountData(false)
    }, 30000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [user, token, logout, navigate, showMessage])

  const primaryAddress = useMemo(
    () =>
      addresses.find((address) => address.isDefault) ||
      addresses[0] ||
      null,
    [addresses]
  )

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = String(order.status || '').toLowerCase()

      if (orderFilter === 'active') {
        return ACTIVE_ORDER_STATUSES.includes(status)
      }

      if (orderFilter === 'completed') {
        return status === 'delivered'
      }

      if (orderFilter === 'cancelled') {
        return status === 'cancelled'
      }

      return true
    })
  }, [orders, orderFilter])

  const menuItems = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Overview',
        icon: <Icon name="dashboard" />,
        badge: null
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: <Icon name="orders" />,
        badge: orders.length || null
      },
      {
        id: 'wishlist',
        label: 'Wishlist',
        icon: <Icon name="heart" />,
        badge: wishlist.length || null
      },
      {
        id: 'profile',
        label: 'Settings',
        icon: <Icon name="user" />,
        badge: null
      }
    ],
    [orders.length, wishlist.length]
  )

  const selectTab = (tab) => {
    setActiveTab(tab)
    setMessage({ type: '', text: '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProfileUpdate = async (event) => {
    event.preventDefault()
    setMessage({ type: '', text: '' })

    const name = profileData.name.trim()
    const phone = profileData.phone.replace(/\D/g, '')

    if (!name) {
      showMessage('error', 'Please enter your full name.')
      return
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      showMessage(
        'error',
        'Please enter a valid 10-digit Indian phone number.'
      )
      return
    }

    if (
      profileData.password &&
      profileData.password.length < 6
    ) {
      showMessage(
        'error',
        'The new password must contain at least 6 characters.'
      )
      return
    }

    const payload = {
      name,
      phone
    }

    if (profileData.password) {
      payload.password = profileData.password
    }

    try {
      const response = await fetch(API_ENDPOINTS.USERS_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await readResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Profile update failed.')
      }

      updateUser(result.data)

      setProfileData((current) => ({
        ...current,
        password: ''
      }))

      showMessage('success', 'Profile updated successfully.')
    } catch (error) {
      showMessage(
        'error',
        error.message || 'Unable to update your profile.'
      )
    }
  }

  const handleAddressSubmit = async (event) => {
    event.preventDefault()
    setMessage({ type: '', text: '' })

    const payload = {
      name: String(newAddress.name || user?.name || '').trim(),
      phone: String(
        newAddress.phone || user?.phone || ''
      )
        .replace(/\D/g, '')
        .slice(-10),
      street: String(newAddress.street || '').trim(),
      city: String(newAddress.city || '').trim(),
      state: String(newAddress.state || '').trim(),
      pincode: String(newAddress.pincode || '').trim(),
      isDefault: Boolean(newAddress.isDefault)
    }

    if (!payload.name) {
      showMessage('error', 'Please enter the recipient name.')
      return
    }

    if (!/^[6-9]\d{9}$/.test(payload.phone)) {
      showMessage(
        'error',
        'Please enter a valid 10-digit Indian phone number.'
      )
      return
    }

    if (
      !payload.street ||
      !payload.city ||
      !payload.state
    ) {
      showMessage(
        'error',
        'Please complete all required address fields.'
      )
      return
    }

    if (!/^[1-8]\d{5}$/.test(payload.pincode)) {
      showMessage(
        'error',
        'Please enter a valid 6-digit Indian PIN code.'
      )
      return
    }

    if (pincodeLoading) {
      showMessage(
        'error',
        'Please wait while the PIN code is being verified.'
      )
      return
    }

    if (pincodeError) {
      showMessage('error', pincodeError)
      return
    }

    const url = editingAddressId
      ? `${API_ENDPOINTS.USERS_ADDRESSES}/${editingAddressId}`
      : API_ENDPOINTS.USERS_ADDRESSES

    try {
      const response = await fetch(url, {
        method: editingAddressId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await readResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to save address.')
      }

      if (Array.isArray(result.data)) {
        setAddresses(result.data)
      }

      showMessage(
        'success',
        editingAddressId
          ? 'Address updated successfully.'
          : 'Address added successfully.'
      )

      setShowAddressForm(false)
      resetAddressForm(false)
    } catch (error) {
      showMessage(
        'error',
        error.message || 'Unable to save this address.'
      )
    }
  }

  const handleEditAddress = (address) => {
    setNewAddress({
      name: address.name || user?.name || '',
      phone: address.phone || user?.phone || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      pincode: String(address.pincode || ''),
      isDefault: Boolean(address.isDefault)
    })

    setEditingAddressId(address._id)
    setPincodeError('')
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Remove this saved address?')) return

    try {
      const response = await fetch(
        `${API_ENDPOINTS.USERS_ADDRESSES}/${addressId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await readResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to remove address.')
      }

      if (Array.isArray(result.data)) {
        setAddresses(result.data)
      } else {
        setAddresses((current) =>
          current.filter((address) => address._id !== addressId)
        )
      }

      showMessage('success', 'Address removed successfully.')
    } catch (error) {
      showMessage(
        'error',
        error.message || 'Unable to remove this address.'
      )
    }
  }

  const handleSetDefaultAddress = async (address) => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.USERS_ADDRESSES}/${address._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...address,
            isDefault: true
          })
        }
      )

      const result = await readResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to update the default address.'
        )
      }

      if (Array.isArray(result.data)) {
        setAddresses(result.data)
      } else {
        setAddresses((current) =>
          current.map((item) => ({
            ...item,
            isDefault: item._id === address._id
          }))
        )
      }

      showMessage(
        'success',
        'Default shipping address updated.'
      )
    } catch (error) {
      showMessage(
        'error',
        error.message || 'Unable to update the default address.'
      )
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return
    }

    setCancellingOrderId(orderId)

    try {
      const response = await fetch(
        API_ENDPOINTS.ORDERS_CANCEL(orderId),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )

      const result = await readResponse(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to cancel order.')
      }

      setOrders((current) =>
        current.map((order) =>
          order._id === orderId
            ? { ...order, status: 'Cancelled' }
            : order
        )
      )

      showMessage('success', 'Order cancelled successfully.')
    } catch (error) {
      showMessage(
        'error',
        error.message || 'Unable to cancel this order.'
      )
    } finally {
      setCancellingOrderId(null)
    }
  }

  const openAdminPortal = () => {
    const adminToken =
      token ||
      localStorage.getItem('seemee-token') ||
      localStorage.getItem('adminToken') ||
      ''

    const adminUser = user
      ? JSON.stringify(user)
      : localStorage.getItem('seemee-user') || ''

    window.location.assign(
      `${getAdminUrl()}/dashboard?token=${encodeURIComponent(
        adminToken
      )}&user=${encodeURIComponent(adminUser)}`
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const renderDashboard = () => (
    <div className="account-section-view ux-overview-container">
      <section className="ux-profile-hero">
        <div className="ux-hero-left">
          <div className="ux-avatar-wrapper">
            <div className="ux-hero-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span
              className="ux-status-online"
              title="Account active"
            />
          </div>

          <div className="ux-hero-details">
            <div className="ux-tier-badge-row">
              <span className="ux-greeting">Welcome Back,</span>
              <span className="ux-tier-badge">SEEMEE MEMBER</span>
            </div>

            <h1 className="ux-hero-name">
              {user?.name || 'Valued Client'}
            </h1>

            <div className="ux-meta-pills-row">
              <span className="ux-meta-pill">{user?.email}</span>

              {profileData.phone && (
                <span className="ux-meta-pill">
                  {profileData.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="ux-hero-actions">
          {user?.role === 'admin' && (
            <button
              type="button"
              className="ux-btn-gold"
              onClick={openAdminPortal}
            >
              Admin Portal
            </button>
          )}

          <button
            type="button"
            className="ux-btn-secondary"
            onClick={() => selectTab('profile')}
          >
            <Icon name="user" size={14} />
            <span>Account Settings</span>
          </button>
        </div>
      </section>

      <div className="ux-hub-grid">
        <button
          type="button"
          className="ux-hub-card"
          onClick={() => selectTab('orders')}
        >
          <div className="ux-card-top">
            <div className="ux-card-icon-wrap orders">
              <Icon name="orders" />
            </div>
            <span className="ux-chip-badge">
              {orders.length} Orders
            </span>
          </div>

          <h3 className="ux-card-title">
            Order History & Tracking
          </h3>
          <p className="ux-card-desc">
            Track active shipments, past purchases, and invoices.
          </p>

          <div className="ux-card-footer">
            <span className="ux-action-link">Manage Orders</span>
            <span className="ux-arrow">â†’</span>
          </div>
        </button>

        <button
          type="button"
          className="ux-hub-card"
          onClick={() => selectTab('wishlist')}
        >
          <div className="ux-card-top">
            <div className="ux-card-icon-wrap wishlist">
              <Icon name="heart" />
            </div>
            <span className="ux-chip-badge">
              {wishlist.length} Saved
            </span>
          </div>

          <h3 className="ux-card-title">Saved Wishlist</h3>
          <p className="ux-card-desc">
            View your saved products and add them to your bag.
          </p>

          <div className="ux-card-footer">
            <span className="ux-action-link">View Wishlist</span>
            <span className="ux-arrow">â†’</span>
          </div>
        </button>

        <button
          type="button"
          className="ux-hub-card"
          onClick={() => {
            selectTab('profile')
            resetAddressForm(addresses.length === 0)
            setShowAddressForm(true)
          }}
        >
          <div className="ux-card-top">
            <div className="ux-card-icon-wrap address">
              <Icon name="location" />
            </div>

            <span
              className={`ux-chip-badge ${
                primaryAddress ? 'success' : 'warning'
              }`}
            >
              {primaryAddress ? 'Configured' : 'Add Now'}
            </span>
          </div>

          <h3 className="ux-card-title">Shipping Addresses</h3>

          <p className="ux-card-desc">
            {primaryAddress
              ? `${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.state}`
              : 'Save your delivery address for faster checkout.'}
          </p>

          <div className="ux-card-footer">
            <span className="ux-action-link">
              Manage Addresses
            </span>
            <span className="ux-arrow">â†’</span>
          </div>
        </button>

        <button
          type="button"
          className="ux-hub-card"
          onClick={() => selectTab('profile')}
        >
          <div className="ux-card-top">
            <div className="ux-card-icon-wrap security">
              <Icon name="user" />
            </div>
            <span className="ux-chip-badge success">Active</span>
          </div>

          <h3 className="ux-card-title">Profile & Security</h3>
          <p className="ux-card-desc">
            Update your personal information and password.
          </p>

          <div className="ux-card-footer">
            <span className="ux-action-link">Update Profile</span>
            <span className="ux-arrow">â†’</span>
          </div>
        </button>
      </div>

      <div className="ux-dossier-card">
        <div className="ux-dossier-header">
          <div>
            <span className="ux-dossier-tag">Account Dossier</span>
            <h2>Profile & Delivery Overview</h2>
          </div>

          <button
            type="button"
            className="ux-text-btn"
            onClick={() => selectTab('profile')}
          >
            <span>Edit Details</span>
            <Icon name="edit" size={13} />
          </button>
        </div>

        <div className="ux-dossier-grid">
          <div className="ux-dossier-tile">
            <span className="ux-tile-label">Client Name</span>
            <span className="ux-tile-value">
              {user?.name || 'Not specified'}
            </span>
          </div>

          <div className="ux-dossier-tile">
            <span className="ux-tile-label">Email Address</span>
            <span className="ux-tile-value">{user?.email}</span>
          </div>

          <div className="ux-dossier-tile">
            <span className="ux-tile-label">Contact Number</span>
            <span className="ux-tile-value">
              {profileData.phone || 'Not added yet'}
            </span>
          </div>

          <div className="ux-dossier-tile">
            <span className="ux-tile-label">
              Primary Shipping Address
            </span>

            <span className="ux-tile-value">
              {primaryAddress
                ? `${primaryAddress.street}, ${primaryAddress.city}, ${primaryAddress.state} - ${primaryAddress.pincode}`
                : 'No default delivery address configured.'}
            </span>
          </div>
        </div>
      </div>

      <div className="ux-shortcuts-banner">
        <div className="ux-shortcuts-row">
          <button
            type="button"
            className="ux-shortcut-chip"
            onClick={() => navigate('/collections')}
          >
            Explore Collections
          </button>

          <button
            type="button"
            className="ux-shortcut-chip"
            onClick={() => navigate('/new-arrivals')}
          >
            New Arrivals
          </button>

          <button
            type="button"
            className="ux-shortcut-chip"
            onClick={() => navigate('/cart')}
          >
            View Shopping Bag
          </button>
        </div>
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="account-section-view">
      <div className="section-intro orders-hero">
        <div>
          <h2>My Orders</h2>
          <p>
            Track purchases, delivery milestones, and invoices.
          </p>
        </div>

        <div className="orders-filter-pills">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'active', label: 'In Progress' },
            { id: 'completed', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`filter-pill ${
                orderFilter === filter.id ? 'active' : ''
              }`}
              onClick={() => setOrderFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="editorial-empty">
          <div className="spinner" />
          <p>Retrieving your order history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="editorial-empty-card">
          <div className="empty-icon-circle">
            <Icon name="orders" size={32} />
          </div>

          <h4>No orders found</h4>
          <p>
            Your matching orders will appear here with tracking
            information.
          </p>

          <button
            type="button"
            className="btn-editorial gold"
            onClick={() => navigate('/collections')}
          >
            Shop Now
          </button>
        </div>
      ) : (
        <div className="orders-full-list">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              user={user}
              expanded={selectedOrderId === order._id}
              cancelling={cancellingOrderId === order._id}
              onToggle={() =>
                setSelectedOrderId((current) =>
                  current === order._id ? null : order._id
                )
              }
              onCancel={() => handleCancelOrder(order._id)}
              onPrint={() => printOrderInvoice(order)}
            />
          ))}
        </div>
      )}
    </div>
  )

  const renderWishlist = () => (
    <div className="account-section-view">
      <div className="section-intro">
        <div>
          <h2>Saved Wishlist ({wishlist.length})</h2>
          <p>View products saved for future purchases.</p>
        </div>

        {wishlist.length > 0 && (
          <button
            type="button"
            className="btn-editorial outline"
            onClick={() => navigate('/collections')}
          >
            Discover More Items
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="editorial-empty-card">
          <div className="empty-icon-circle">
            <Icon name="heart" size={32} />
          </div>

          <h4>Your Wishlist is Empty</h4>
          <p>
            Explore our collections and save products you love.
          </p>

          <button
            type="button"
            className="btn-editorial gold"
            onClick={() => navigate('/collections')}
          >
            Explore Collections
          </button>
        </div>
      ) : (
        <div className="wishlist-full-grid">
          {wishlist.map((item) => (
            <article key={item.id || item._id} className="wishlist-card">
              <div
                className="wishlist-card-media"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/product/${item.id || item._id}`)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    navigate(`/product/${item.id || item._id}`)
                  }
                }}
              >
                <img
                  src={getOptimizedImageUrl(
                    item.images?.[0] || item.image
                  )}
                  alt={item.name || 'Wishlist product'}
                  className="wishlist-card-img"
                />

                <button
                  type="button"
                  className="wishlist-remove-icon"
                  title="Remove from wishlist"
                  aria-label={`Remove ${item.name} from wishlist`}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleWishlist(item)
                  }}
                >
                  ×
                </button>
              </div>

              <div className="wishlist-card-info">
                <span className="wishlist-card-category">
                  {item.category || 'Atelier Collection'}
                </span>

                <button
                  type="button"
                  className="wishlist-card-title"
                  onClick={() => navigate(`/product/${item.id || item._id}`)}
                >
                  {item.name}
                </button>

                <div className="wishlist-card-price">
                  {formatCurrency(
                    typeof item.price === 'number'
                      ? item.price
                      : Number(
                          String(item.price || '0').replace(/[₹,\s]/g, '')
                        ) || 0
                  )}
                </div>

                <div className="wishlist-card-actions">
                  <button
                    type="button"
                    className="btn-editorial gold full-btn"
                    onClick={() => addToCart(item)}
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )

  const renderProfile = () => (
    <div className="account-section-view ux-settings-container">
      <div className="section-intro ux-settings-intro">
        <div>
          <h2>Account Settings & Security</h2>
          <p>
            Manage your profile, password, and delivery addresses.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`form-message ${message.type}`}
            role="status"
          >
            <span>{message.text}</span>

            <button
              type="button"
              className="close-toast"
              aria-label="Close message"
              onClick={() => setMessage({ type: '', text: '' })}
            >
              Ã—
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="profile-management-layout">
        <form
          className="editorial-form profile-settings-form ux-settings-card"
          onSubmit={handleProfileUpdate}
        >
          <div className="form-heading-strip">
            <div className="profile-heading-avatar">
              {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div>
              <h3>Personal Profile & Credentials</h3>
              <p>Update your account information and password</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="account-name">Full Name</label>
              <input
                id="account-name"
                type="text"
                value={profileData.name}
                onChange={(event) =>
                  setProfileData((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="account-email">Email Address</label>
              <input
                id="account-email"
                type="email"
                value={user?.email || ''}
                disabled
                className="disabled-input"
              />
              <span className="input-hint">
                Verified primary account email
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="account-phone">Phone Number</label>
              <input
                id="account-phone"
                type="tel"
                maxLength={10}
                value={profileData.phone}
                onChange={(event) =>
                  setProfileData((current) => ({
                    ...current,
                    phone: event.target.value.replace(/\D/g, '')
                  }))
                }
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="account-password">
                New Password (Optional)
              </label>

              <div className="password-input-wrapper">
                <input
                  id="account-password"
                  type={showAccountPassword ? 'text' : 'password'}
                  value={profileData.password}
                  onChange={(event) =>
                    setProfileData((current) => ({
                      ...current,
                      password: event.target.value
                    }))
                  }
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() =>
                    setShowAccountPassword((current) => !current)
                  }
                  aria-label={
                    showAccountPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  <Icon
                    name={
                      showAccountPassword ? 'eye-off' : 'eye'
                    }
                  />
                </button>
              </div>
            </div>
          </div>

          <div
            className="form-action-row"
            style={{ marginTop: 16 }}
          >
            <button
              type="submit"
              className="btn-editorial gold"
            >
              Save Profile Changes
            </button>
          </div>
        </form>

        <section className="contact-address-panel ux-settings-card">
          <div className="form-heading-strip-row">
            <div>
              <h3>Saved Shipping Addresses</h3>
              <p>
                {addresses.length} delivery destinations configured
              </p>
            </div>

            <button
              type="button"
              className="btn-editorial gold compact-btn"
              onClick={() => {
                if (showAddressForm) {
                  setShowAddressForm(false)
                  resetAddressForm(false)
                  return
                }

                resetAddressForm(addresses.length === 0)
                setShowAddressForm(true)
              }}
            >
              {showAddressForm ? 'Cancel Form Ã—' : '+ Add Address'}
            </button>
          </div>

          <AnimatePresence>
            {showAddressForm && (
              <motion.form
                className="editorial-form inline-address-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddressSubmit}
              >
                <h4 className="inline-form-title">
                  {editingAddressId
                    ? 'Edit Delivery Address'
                    : 'Add New Shipping Address'}
                </h4>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="address-name">
                      Recipient Full Name *
                    </label>
                    <input
                      id="address-name"
                      type="text"
                      value={newAddress.name}
                      onChange={(event) =>
                        setNewAddress((current) => ({
                          ...current,
                          name: event.target.value
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address-phone">
                      Phone Number *
                    </label>
                    <input
                      id="address-phone"
                      type="tel"
                      maxLength={10}
                      value={newAddress.phone}
                      onChange={(event) =>
                        setNewAddress((current) => ({
                          ...current,
                          phone: event.target.value.replace(
                            /\D/g,
                            ''
                          )
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group full-span">
                    <label htmlFor="address-street">
                      Street Address / House Number / Area *
                    </label>
                    <input
                      id="address-street"
                      type="text"
                      value={newAddress.street}
                      onChange={(event) =>
                        setNewAddress((current) => ({
                          ...current,
                          street: event.target.value
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address-pincode">
                      PIN Code *
                      {pincodeLoading && (
                        <span className="input-hint">
                          {' '}
                          Verifying...
                        </span>
                      )}
                    </label>

                    <input
                      id="address-pincode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={newAddress.pincode}
                      onChange={(event) =>
                        setNewAddress((current) => ({
                          ...current,
                          pincode: event.target.value.replace(
                            /\D/g,
                            ''
                          )
                        }))
                      }
                      required
                    />

                    {pincodeError && (
                      <span
                        className="input-hint"
                        style={{ color: '#dc2626' }}
                      >
                        {pincodeError}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="address-city">City *</label>
                    <input
                      id="address-city"
                      type="text"
                      value={newAddress.city}
                      onChange={(event) =>
                        setNewAddress((current) => ({
                          ...current,
                          city: event.target.value
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group full-span">
                    <label htmlFor="address-state">State *</label>
                    <input
                      id="address-state"
                      type="text"
                      value={newAddress.state}
                      onChange={(event) =>
                        setNewAddress((current) => ({
                          ...current,
                          state: event.target.value
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <label className="luxury-checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={(event) =>
                      setNewAddress((current) => ({
                        ...current,
                        isDefault: event.target.checked
                      }))
                    }
                  />
                  <span className="checkbox-text">
                    Set as default shipping address
                  </span>
                </label>

                <div className="inline-form-actions">
                  <button
                    type="submit"
                    className="btn-editorial gold"
                    disabled={pincodeLoading}
                  >
                    {editingAddressId
                      ? 'Update Address'
                      : 'Save Address'}
                  </button>

                  <button
                    type="button"
                    className="btn-editorial outline"
                    onClick={() => {
                      setShowAddressForm(false)
                      resetAddressForm(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="address-quick-list">
            {addresses.length === 0 ? (
              <div className="editorial-empty-card compact">
                <div className="empty-icon-circle">
                  <Icon name="location" size={32} />
                </div>

                <h4>No Addresses Saved</h4>
                <p>
                  Save an address for faster checkout and delivery.
                </p>

                <button
                  type="button"
                  className="btn-editorial gold"
                  onClick={() => {
                    resetAddressForm(true)
                    setShowAddressForm(true)
                  }}
                >
                  + Add First Address
                </button>
              </div>
            ) : (
              addresses.map((address) => (
                <article
                  key={address._id}
                  className={`address-quick-card ${
                    address.isDefault ? 'is-default-card' : ''
                  }`}
                >
                  <div className="addr-badge-row">
                    <span
                      className={
                        address.isDefault
                          ? 'default-tag'
                          : 'destination-tag'
                      }
                    >
                      {address.isDefault
                        ? 'âœ¦ DEFAULT DESTINATION'
                        : 'DESTINATION'}
                    </span>
                  </div>

                  <strong className="addr-street">
                    {address.street}
                  </strong>

                  <p className="addr-location">
                    {address.city}, {address.state} -{' '}
                    {address.pincode}
                  </p>

                  {(address.name || address.phone) && (
                    <p>
                      {address.name}
                      {address.name && address.phone ? ' â€¢ ' : ''}
                      {address.phone
                        ? `+91 ${address.phone}`
                        : ''}
                    </p>
                  )}

                  <div className="addr-quick-actions">
                    <button
                      type="button"
                      className="addr-action-btn edit"
                      onClick={() => handleEditAddress(address)}
                    >
                      <Icon name="edit" size={12} />
                      <span>Edit</span>
                    </button>

                    {!address.isDefault && (
                      <button
                        type="button"
                        className="addr-action-btn default-btn"
                        onClick={() =>
                          handleSetDefaultAddress(address)
                        }
                      >
                        Set as Default
                      </button>
                    )}

                    <button
                      type="button"
                      className="addr-action-btn delete"
                      onClick={() =>
                        handleDeleteAddress(address._id)
                      }
                    >
                      <Icon name="trash" size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return renderOrders()

      case 'wishlist':
        return renderWishlist()

      case 'profile':
        return renderProfile()

      case 'dashboard':
      default:
        return renderDashboard()
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="account-page-v2">
      <div className="editorial-back-nav">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="editorial-back-btn"
        >
          <Icon name="back" size={16} />
          <span>Back</span>
        </button>
      </div>

      <div className="mobile-account-header">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mobile-back-btn"
          aria-label="Go back"
        >
          <Icon name="back" />
        </button>

        <div className="mobile-header-user">
          <div className="mobile-header-avatar">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="mobile-header-info">
            <span className="mobile-user-name">
              {user.name || 'Valued Client'}
            </span>
            <span className="mobile-user-badge">
              âœ¦ SEEMEE Member
            </span>
          </div>
        </div>

        <button
          type="button"
          className="mobile-logout-btn"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <Icon name="logout" />
        </button>
      </div>

      <div className="mobile-segmented-tabbar">
        <div className="mobile-tab-scroll-container">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mobile-tab-btn ${
                activeTab === item.id ? 'active' : ''
              }`}
              onClick={() => selectTab(item.id)}
            >
              <span className="mobile-tab-icon">
                {item.icon}
              </span>
              <span className="mobile-tab-label">
                {item.label}
              </span>

              {item.badge !== null && (
                <span className="mobile-tab-badge">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="account-wrapper">
        <aside className="account-nav-sidebar">
          <div className="nav-profile-card">
            <div className="nav-avatar">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="nav-user-info">
              <h3>{user.name || 'Valued Client'}</h3>
              <p>âœ¦ SEEMEE MEMBER</p>
            </div>
          </div>

          <nav className="side-navigation">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`side-nav-item ${
                  activeTab === item.id ? 'active' : ''
                }`}
                onClick={() => selectTab(item.id)}
              >
                <div className="side-nav-icon-box">
                  {item.icon}
                </div>

                <span className="side-nav-label">
                  {item.label}
                </span>

                {item.badge !== null && (
                  <span className="side-nav-badge">
                    {item.badge}
                  </span>
                )}

                <span className="side-nav-arrow">â€º</span>
              </button>
            ))}

            <div className="nav-spacer" />

            <button
              type="button"
              className="side-nav-item logout"
              onClick={handleLogout}
            >
              <div className="side-nav-icon-box logout-icon">
                <Icon name="logout" size={16} />
              </div>

              <span className="side-nav-label">Sign Out</span>
            </button>
          </nav>
        </aside>

        <main className="account-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="view-container"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default AccountPage
