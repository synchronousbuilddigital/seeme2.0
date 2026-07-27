import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { API_ENDPOINTS } from '../config/api'

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
            body: JSON.stringify({ cart: cart.map(item => ({
              product: item.id || item._id,
              quantity: item.quantity,
              size: item.size || item.selectedSize || 'S',
              color: item.color || ''
            }))})
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
  }

  const getCartTotal = () => {
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
    }, 0).toLocaleString('en-IN')
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const toggleWishlist = (product) => {
    setWishlist(prevWishlist => {
      // Normalize product ID
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
      }
      
      console.log('New wishlist:', newWishlist)
      return newWishlist
    })
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
        getWishlistCount
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
