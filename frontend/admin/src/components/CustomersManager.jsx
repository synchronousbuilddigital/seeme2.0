import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import './CustomersManager.css'

const CustomersManager = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const data = await apiRequest(API_ENDPOINTS.ADMIN.CUSTOMERS, { auth: true })
      if (data.success) {
        setCustomers(data.data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="loading">Loading Customers...</div>

  return (
    <div className="customers-manager">
      <div className="toolbar">
        <input 
          type="search" 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="customers-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Status</th>
              <th>Total Orders</th>
              <th>Total Spending</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer._id}>
                <td>
                  <div className="customer-cell">
                    <div className="avatar">{customer.name[0]}</div>
                    <div className="details">
                      <span className="name">{customer.name}</span>
                      <span className="email">{customer.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                   <span className={`status-pill ${customer.isBlocked ? 'blocked' : 'active'}`}>
                     {customer.isBlocked ? 'Blocked' : 'Active'}
                   </span>
                </td>
                <td>{customer.orderCount || 0}</td>
                <td>₹{(customer.totalSpending || 0).toLocaleString()}</td>
                <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="action-link">View History</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CustomersManager
