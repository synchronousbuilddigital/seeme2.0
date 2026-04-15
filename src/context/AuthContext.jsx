import { createContext, useContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('seemee-user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch (error) {
      console.error('Error loading user from localStorage:', error)
      return null
    }
  })

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('seemee-token') || null
    } catch (error) {
      console.error('Error loading token from localStorage:', error)
      return null
    }
  })

  // Save user to localStorage whenever it changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('seemee-user', JSON.stringify(user))
      } else {
        localStorage.removeItem('seemee-user')
      }
    } catch (error) {
      console.error('Error saving user to localStorage:', error)
    }
  }, [user])

  // Save token to localStorage whenever it changes
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('seemee-token', token)
      } else {
        localStorage.removeItem('seemee-token')
      }
    } catch (error) {
      console.error('Error saving token to localStorage:', error)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      setUser(data.user)
      setToken(data.token)
      return { success: true, user: data.user, token: data.token }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  const signup = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      setUser(data.user)
      setToken(data.token)
      return { success: true, user: data.user, token: data.token }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('seemee-user')
    localStorage.removeItem('seemee-token')
    localStorage.removeItem('seemee-cart')
    localStorage.removeItem('seemee-wishlist')
  }

  const isAuthenticated = () => {
    return !!user && !!token
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
