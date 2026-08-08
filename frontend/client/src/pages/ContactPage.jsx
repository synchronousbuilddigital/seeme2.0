import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './ContactPage.css'

const ContactPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Contact Us | See Mee Haute Couture'
    window.scrollTo(0, 0)
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  })

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="contact-page simple-unified">
      {/* Editorial Back Navigation */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn" aria-label="Go Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Hero Banner */}
      <section className="simple-hero">
        <div className="simple-hero-content">
          <motion.span 
            className="simple-kicker"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            GET IN TOUCH
          </motion.span>
          <motion.h1 
            className="simple-title"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Contact <span className="italic-accent">Us</span>
          </motion.h1>
          <motion.p 
            className="simple-subtitle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            We would love to hear from you. Reach out for order assistance, sizing, custom fittings, or general inquiries.
          </motion.p>
        </div>
      </section>

      <div className="simple-container">
        {/* 3 Simple Quick Contact Cards */}
        <div className="simple-cards-grid">
          <div className="simple-card">
            <div className="simple-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3 className="simple-card-title">Email Us</h3>
            <p className="simple-card-desc">Send us an email anytime</p>
            <a href="mailto:bizseemee@gmail.com" className="simple-card-link">bizseemee@gmail.com</a>
          </div>

          <div className="simple-card">
            <div className="simple-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <h3 className="simple-card-title">Call Us</h3>
            <p className="simple-card-desc">Mon - Sat from 10am to 7pm</p>
            <a href="tel:+919876543210" className="simple-card-link">+91 (800) SEE-MEE</a>
          </div>

          <div className="simple-card">
            <div className="simple-card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <h3 className="simple-card-title">WhatsApp</h3>
            <p className="simple-card-desc">Chat for instant assistance</p>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="simple-card-link">Chat on WhatsApp</a>
          </div>
        </div>

        {/* 2-Column Desktop / 1-Column Mobile Layout */}
        <div className="simple-content-layout">
          {/* Contact Form */}
          <div className="simple-form-wrapper">
            <h2 className="simple-form-title">Send a Message</h2>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="simple-form">
                <div className="simple-form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    placeholder="Enter your full name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="simple-form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="Enter your email address" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="simple-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    placeholder="Enter your phone number" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="simple-form-group">
                  <label htmlFor="subject">Subject</label>
                  <select 
                    id="subject" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleInputChange}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Order Status">Order Status</option>
                    <option value="Bespoke & Custom Fittings">Bespoke & Custom Fittings</option>
                    <option value="Exchanges & Returns">Exchanges & Returns</option>
                  </select>
                </div>

                <div className="simple-form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="5" 
                    placeholder="How can we help you?" 
                    value={formData.message} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <button type="submit" className="simple-submit-btn" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            ) : (
              <div className="simple-success-msg">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3>Thank You!</h3>
                <p>Your message has been sent successfully. We will get back to you shortly.</p>
                <button 
                  type="button" 
                  className="simple-reset-btn"
                  onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' }) }}
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>

          {/* Studio Info Sidebar */}
          <div className="simple-info-sidebar">
            <h2 className="sidebar-title">Our Studio</h2>
            
            <div className="sidebar-item">
              <span className="sidebar-label">Address</span>
              <p className="sidebar-val">
                See Mee Heritage House,<br />
                Old City Heritage Quarter,<br />
                Varanasi / New Delhi, India
              </p>
            </div>

            <div className="sidebar-item">
              <span className="sidebar-label">Business Hours</span>
              <p className="sidebar-val">
                Monday – Saturday: 10:00 AM – 7:00 PM IST<br />
                Sunday: Closed
              </p>
            </div>

            <div className="sidebar-item">
              <span className="sidebar-label">Custom Appointments</span>
              <p className="sidebar-val">
                For custom bridal trousseaus or tailor fittings, please reach out directly via phone or WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
