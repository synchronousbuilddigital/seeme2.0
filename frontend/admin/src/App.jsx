import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { clearAdminSession, isAdminSessionValid } from './utils/apiClient'
import './App.css'

const syncQuerySession = () => {
  try {
    const query = new URLSearchParams(window.location.search)
    const token = query.get('token')
    const user = query.get('user')

    if (token && user) {
      localStorage.setItem('adminToken', token)
      localStorage.setItem('adminUser', user)
      localStorage.setItem('seemee-token', token)
      localStorage.setItem('seemee-user', user)
      // Clean up address bar query params
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  } catch (err) {
    console.error('Error syncing query session:', err)
  }
}

const ProtectedRoute = ({ children }) => {
  syncQuerySession()

  if (!isAdminSessionValid()) {
    clearAdminSession()
    return <Navigate to="/login" replace />
  }
  return children
}

const RootRoute = () => {
  syncQuerySession()

  if (isAdminSessionValid()) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="admin-app">
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />
          <Route path="/" element={<RootRoute />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
