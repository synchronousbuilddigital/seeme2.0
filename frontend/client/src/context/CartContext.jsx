import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { API_ENDPOINTS } from '../config/api'
import {
  trackAddToCart,
  trackRemoveFromCart,
  trackAddToWishlist,
  trackCouponApply,
  trackCouponRemoved,
  trackCouponInvalid,
  trackCouponExpired
} from '../utils/gtmEcommerce'

export const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth()
  // Initialize state from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('seemee-cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
      return []
    }
  })

  const [wishlist, setWishlist] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem('seemee-wishlist')
      return savedWishlist ? JSON.parse(savedWishlist) : []
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error)
      return []
    }
  })

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('seemee-applied-coupon')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isFreeShippingFromCoupon, setIsFreeShippingFromCoupon] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('seemee-cart', JSON.stringify(cart))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [cart])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('seemee-wishlist', JSON.stringify(wishlist))
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error)
    }
  }, [wishlist])

  // Auto-validate applied coupon when cart updates
  useEffect(() => {
    if (!appliedCoupon || !cart.length) {
      if (appliedCoupon && !cart.length) {
        removeCoupon(true)
      }
      return
    }

    const revalidate = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.COUPON_APPLY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: appliedCoupon.code,
            cartItems: cart,
            userId: user?._id || user?.email,
            userEmail: user?.email
          })
        })
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) return
        const data = await response.json()
        if (data.success && data.data?.isValid) {
          setCouponDiscount(data.data.discountAmount || 0)
          setIsFreeShippingFromCoupon(data.data.isFreeShipping || false)
        } else {
          // Coupon no longer valid (e.g. minimum order not met after removing item)
          try {
            trackCouponInvalid({ coupon_code: appliedCoupon.code, reason: data.message })
          } catch (e) {}
          setAppliedCoupon(null)
          setCouponDiscount(0)
          setIsFreeShippingFromCoupon(false)
          localStorage.removeItem('seemee-applied-coupon')
        }
      } catch (err) {
        console.error('Error revalidating coupon:', err)
      }
    }

    const timer = setTimeout(revalidate, 300)
    return () => clearTimeout(timer)
  }, [cart, user])

  // Apply Coupon Method (Backend Validated)
  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      throw new Error('Please enter a coupon code.')
    }
    const cleanCode = code.trim().toUpperCase()
    setCouponLoading(true)

    try {
      const response = await fetch(API_ENDPOINTS.COUPON_APPLY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          cartItems: cart,
          userId: user?._id || user?.email,
          userEmail: user?.email
        })
      })

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error('Server error: invalid response format. Please try again.')
      }

      const data = await response.json()

      if (!data.success || !data.data?.isValid) {
        const errMsg = data.message || 'Invalid coupon code.'
        if (data.reason === 'EXPIRED') {
          try { trackCouponExpired({ coupon_code: cleanCode }) } catch (e) {}
        } else {
          try { trackCouponInvalid({ coupon_code: cleanCode, reason: errMsg }) } catch (e) {}
        }
        throw new Error(errMsg)
      }

      const validCouponData = data.data.coupon
      const discount = data.data.discountAmount || 0
      const isFreeShip = data.data.isFreeShipping || false

      setAppliedCoupon(validCouponData)
      setCouponDiscount(discount)
      setIsFreeShippingFromCoupon(isFreeShip)
      localStorage.setItem('seemee-applied-coupon', JSON.stringify(validCouponData))

      const cartVal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0)
      try {
        trackCouponApply({ coupon_code: cleanCode, discount, cart_value: cartVal })
      } catch (e) {}

      return data.data
    } catch (err) {
      throw err
    } finally {
      setCouponLoading(false)
    }
  }

  // Remove Coupon Method
  const removeCoupon = (silent = false) => {
    if (appliedCoupon && !silent) {
      try {
        trackCouponRemoved({ coupon_code: appliedCoupon.code })
      } catch (e) {}
    }
    setAppliedCoupon(null)
    setCouponDiscount(0)
    setIsFreeShippingFromCoupon(false)
    localStorage.removeItem('seemee-applied-coupon')
  }

  // Sync with backend on login / mount
  useEffect(() => {
    if (user && token) {
      const fetchUserData = async () => {
        try {
          const [cartRes, wishlistRes] = await Promise.all([
            fetch(API_ENDPOINTS.USERS_CART, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(API_ENDPOINTS.USERS_WISHLIST, { headers: { 'Authorization': `Bearer ${token}` } })
          ])
          const cartData = await cartRes.json()
          const wishlistData = await wishlistRes.json()

          if (cartData.success && Array.isArray(cartData.data)) {
            const normalizedCart = cartData.data
              .filter(item => item && item.product) // Filter out deleted/null products
              .map(item => {
                if (item.product && typeof item.product === 'object') {
                  const itemSize = item.size || item.selectedSize || 'S'
                  return {
                    ...item.product,
                    id: item.product._id,
                    quantity: item.quantity || 1,
                    size: itemSize,
                    selectedSize: itemSize,
                    color: item.color || ''
                  }
                }
                return item
              })
            setCart(normalizedCart)
          }
          if (wishlistData.success && Array.isArray(wishlistData.data)) {
            setWishlist(wishlistData.data)
          }
        } catch (err) {
          console.error('Error syncing with backend:', err)
        }
      }
      fetchUserData()
    }
  }, [user, token])

  // Sync cart changes to backend (including deletions and empty cart)
  useEffect(() => {
    if (user && token) {
      const sync = async () => {
        try {
          await fetch(`${API_ENDPOINTS.USERS_CART}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              cart: cart.map(item => ({
                product: item.id || item._id,
                quantity: item.quantity,
                size: item.size || item.selectedSize || 'S',
                color: item.color || ''
              }))
            })
          })
        } catch (err) {
          console.error('Cart sync error:', err)
        }
      }
      const timeout = setTimeout(sync, 300) // Fast 300ms debounce
      return () => clearTimeout(timeout)
    }
  }, [cart, user, token])

  const addToCart = (product) => {
    console.log('Adding product to cart:', product)
    try {
      const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'S'
      const productSize = product.selectedSize || product.size || defaultSize
      trackAddToCart(product, product.quantity || 1, productSize)
    } catch (e) {
      console.error('GTM error in addToCart:', e)
    }

    setCart(prevCart => {
      const productId = product.id || product._id
      const defaultSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'S'
      const productSize = product.selectedSize || product.size || defaultSize
      const normalizedProduct = {
        ...product,
        id: productId,
        size: productSize,
        selectedSize: productSize
      }

      const existingIndex = prevCart.findIndex(item => {
        const itemId = item.id || item._id
        const itemSize = item.selectedSize || item.size || 'S'
        return itemId === productId && itemSize === productSize
      })

      if (existingIndex > -1) {
        return prevCart.map((item, idx) => {
          if (idx === existingIndex) {
            return { ...item, quantity: (item.quantity || 1) + 1 }
          }
          return item
        })
      }

      return [...prevCart, { ...normalizedProduct, quantity: 1 }]
    })
  }

  const removeFromCart = (productId, size) => {
    const targetItem = cart.find(item => {
      const itemId = item.id || item._id
      const itemSize = item.selectedSize || item.size || 'S'
      return size ? (itemId === productId && itemSize === size) : (itemId === productId)
    })
    if (targetItem) {
      try {
        trackRemoveFromCart(targetItem, targetItem.quantity || 1)
      } catch (e) {
        console.error('GTM error in removeFromCart:', e)
      }
    }

    setCart(prevCart => prevCart.filter(item => {
      const itemId = item.id || item._id
      const itemSize = item.selectedSize || item.size || 'S'
      if (size) {
        return !(itemId === productId && itemSize === size)
      }
      return itemId !== productId
    }))
  }

  const updateQuantity = (productId, quantity, size) => {
    if (quantity <= 0) {
      removeFromCart(productId, size)
      return
    }

    setCart(prevCart =>
      prevCart.map(item => {
        const itemId = item.id || item._id
        const itemSize = item.selectedSize || item.size || 'S'
        const isMatch = size ? (itemId === productId && itemSize === size) : (itemId === productId)
        return isMatch ? { ...item, quantity: Math.max(1, quantity) } : item
      })
    )
  }

  const clearCart = () => {
    setCart([])
    removeCoupon(true)
  }

  const getCartTotal = () => {
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
    }, 0).toLocaleString('en-IN')
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + (item.quantity || 1), 0)
  }

  const toggleWishlist = (product, customNavigate) => {
    if (!user || !token) {
      const msg = 'Please sign in or create an account to save items to your wishlist.'
      if (typeof customNavigate === 'function') {
        customNavigate('/auth', { state: { message: msg, from: window.location.pathname } })
      } else {
        window.location.href = `/auth`
      }
      return false
    }

    setWishlist(prevWishlist => {
      const productId = product.id || product._id
      const normalizedProduct = {
        ...product,
        id: productId
      }

      const exists = prevWishlist.find(item => {
        const itemId = item.id || item._id
        return itemId === productId
      })

      let newWishlist
      if (exists) {
        newWishlist = prevWishlist.filter(item => {
          const itemId = item.id || item._id
          return itemId !== productId
        })
        console.log('Removed from wishlist:', product.name)
      } else {
        newWishlist = [...prevWishlist, normalizedProduct]
        console.log('Added to wishlist:', product.name)
        try {
          trackAddToWishlist(product)
        } catch (e) {}
      }

      console.log('New wishlist:', newWishlist)
      return newWishlist
    })
    return true
  }

  const isInWishlist = (productId) => {
    return wishlist.some(item => {
      const itemId = item.id || item._id
      return itemId === productId
    })
  }

  const getWishlistCount = () => {
    return wishlist.length
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
        getWishlistCount,
        appliedCoupon,
        couponDiscount,
        isFreeShippingFromCoupon,
        couponLoading,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
