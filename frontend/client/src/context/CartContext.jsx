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

  // Sync with backend
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
          
          if (cartData.success) {
            // Merge or replace? For simplicity, we'll replace local if backend has items
            if (cartData.data.length > 0) setCart(cartData.data)
          }
          if (wishlistData.success) {
            if (wishlistData.data.length > 0) setWishlist(wishlistData.data)
          }
        } catch (err) {
          console.error('Error syncing with backend:', err)
        }
      }
      fetchUserData()
    }
  }, [user, token])

  // Periodic sync to backend
  useEffect(() => {
    if (user && token && cart.length > 0) {
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
              size: item.size,
              color: item.color
            }))})
          })
        } catch (err) {
          console.error('Cart sync error:', err)
        }
      }
      const timeout = setTimeout(sync, 2000)
      return () => clearTimeout(timeout)
    }
  }, [cart, user, token])

  const addToCart = (product) => {
    console.log('Adding product to cart:', product)
    setCart(prevCart => {
      console.log('Current cart:', prevCart)
      
      // Normalize product ID - use _id if id doesn't exist (MongoDB products)
      const productId = product.id || product._id
      const normalizedProduct = {
        ...product,
        id: productId
      }
      
      const existingItem = prevCart.find(item => {
        const itemId = item.id || item._id
        return itemId === productId
      })
      console.log('Existing item found:', existingItem)

      if (existingItem) {
        console.log('Product already in cart, increasing quantity')
        return prevCart.map(item => {
          const itemId = item.id || item._id
          return itemId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        })
      }

      console.log('Adding new product to cart')
      return [...prevCart, { ...normalizedProduct, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => {
      const itemId = item.id || item._id
      return itemId !== productId
    }))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(prevCart =>
      prevCart.map(item => {
        const itemId = item.id || item._id
        return itemId === productId ? { ...item, quantity } : item
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
