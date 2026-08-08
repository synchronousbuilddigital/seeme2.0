import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './PolicyPages.css'

const PrivacyPolicyPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Privacy Policy | See Mee Haute Couture'
    window.scrollTo(0, 0)
  }, [])

  const tocItems = [
    { id: 'info-collect', num: '01', title: 'Information We Collect' },
    { id: 'info-use', num: '02', title: 'How We Use Your Information' },
    { id: 'payment-security', num: '03', title: 'Payment Security' },
    { id: 'info-sharing', num: '04', title: 'Information Sharing' },
    { id: 'cookies', num: '05', title: 'Cookies & Tracking' },
    { id: 'data-security', num: '06', title: 'Data Security' },
    { id: 'your-rights', num: '07', title: 'Your Rights' },
    { id: 'policy-updates', num: '08', title: 'Policy Updates' },
    { id: 'contact-info', num: '09', title: 'Contact Information' }
  ]

  return (
    <div className="policy-page">
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

      {/* Atmospheric Monogram Background */}
      <div className="watermark-logo">SEEMEE</div>

      {/* Hero Section */}
      <section className="policy-hero">
        <div className="policy-hero-glow"></div>
        <div className="policy-hero-content">
          <motion.span 
            className="policy-kicker"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            TRUST & TRANSPARENCY
          </motion.span>
          <motion.h1 
            className="policy-hero-title"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          >
            Privacy <span className="italic-accent">Policy</span>
          </motion.h1>
          <motion.p 
            className="policy-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            At See Mee Haute Couture, protecting your personal privacy is paramount to our house ethos. Learn how we collect, safeguard, and honor your personal data.
          </motion.p>
          <motion.div 
            className="policy-last-updated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>EFFECTIVE DATE: AUGUST 2026</span>
          </motion.div>
        </div>
      </section>

      <div className="policy-container">
        {/* Policy Overview Card */}
        <div className="policy-overview-card">
          <div className="overview-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h2 className="overview-title">Our Privacy Commitment</h2>
          </div>
          <p className="overview-text">
            See Mee ("we", "our", or "us") respects your preferences regarding the collection and use of your personal information. This Privacy Policy describes how we collect, use, process, and disclose information related to your access to and use of our online store, digital services, and customer care channels.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="policy-toc">
          <h3 className="toc-title">Table of Contents</h3>
          <ul className="toc-list">
            {tocItems.map(item => (
              <li key={item.id}>
                <a href={`#${item.id}`}>
                  <span className="toc-num">{item.num}.</span>
                  <span>{item.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Detailed Sections */}
        <div className="policy-sections-wrapper">
          {/* 01 Information We Collect */}
          <section className="policy-section" id="info-collect">
            <div className="section-head">
              <span className="section-num">01</span>
              <h2 className="section-title">Information We Collect</h2>
            </div>
            <div className="section-body">
              <p>
                We collect personal information that you voluntarily provide to us when you register an account, make a purchase, subscribe to our newsletter, or communicate directly with our client services team.
              </p>
              <ul className="policy-list">
                <li>
                  <strong>Personal Identity & Contact Data:</strong> Includes your full name, email address, telephone number, shipping address, and billing address.
                </li>
                <li>
                  <strong>Account Credentials:</strong> Passwords, security tokens, and profile preferences managed securely within your registered account.
                </li>
                <li>
                  <strong>Transaction & Order Details:</strong> Information regarding products purchased, order values, size selections, order history, and custom tailoring specifications.
                </li>
                <li>
                  <strong>Device & Interaction Data:</strong> Technical information automatically collected when browsing, including IP addresses, browser types, operating systems, and page interaction records.
                </li>
              </ul>
            </div>
          </section>

          {/* 02 How We Use Your Information */}
          <section className="policy-section" id="info-use">
            <div className="section-head">
              <span className="section-num">02</span>
              <h2 className="section-title">How We Use Your Information</h2>
            </div>
            <div className="section-body">
              <p>
                Your information enables us to deliver an exceptional luxury shopping experience, fulfill your orders with artisanal precision, and continuously refine our service offerings.
              </p>
              <ul className="policy-list">
                <li><strong>Order Fulfillment & Delivery:</strong> Processing checkout transactions, tailoring custom garments, dispatching shipments, and sending tracking updates.</li>
                <li><strong>Client Care & Support:</strong> Responding to inquiries regarding sizing, fabric compositions, order status, exchanges, and custom requests.</li>
                <li><strong>Personalized Experience:</strong> Recommending curated collections, bespoke attire, and exclusive seasonal releases aligned with your preferences.</li>
                <li><strong>Marketing Communications:</strong> Sending newsletters, private event invitations, and VIP lookbooks (you may opt out at any time).</li>
                <li><strong>Operational Integrity:</strong> Enhancing website security, preventing fraudulent transactions, and ensuring compliance with applicable legal obligations.</li>
              </ul>
            </div>
          </section>

          {/* 03 Payment Security */}
          <section className="policy-section" id="payment-security">
            <div className="section-head">
              <span className="section-num">03</span>
              <h2 className="section-title">Payment Security</h2>
            </div>
            <div className="section-body">
              <p>
                We prioritize financial data protection through bank-grade encryption standards and certified PCI-DSS compliant payment gateways.
              </p>
              <div className="policy-callout">
                <strong>Zero Financial Data Storage:</strong> See Mee does not store or process your complete credit card numbers, debit card details, or banking passwords on our servers. All payments are encrypted end-to-end via secure payment gateway partners.
              </div>
              <p>
                Transactions are validated through multi-factor authentication (3D Secure / OTP) to shield your transactions against unauthorized access.
              </p>
            </div>
          </section>

          {/* 04 Information Sharing */}
          <section className="policy-section" id="info-sharing">
            <div className="section-head">
              <span className="section-num">04</span>
              <h2 className="section-title">Information Sharing</h2>
            </div>
            <div className="section-body">
              <p>
                We respect the confidential nature of your personal data. We do not sell, rent, or trade your personal information to third-party marketing companies.
              </p>
              <p>Information is shared strictly with trusted service partners under non-disclosure obligations, including:</p>
              <ul className="policy-list">
                <li><strong>Logistics & Delivery Partners:</strong> Premium courier and shipping providers to ensure reliable delivery of your purchases.</li>
                <li><strong>Payment Processors:</strong> Certified financial institutions and gateways executing secure checkout procedures.</li>
                <li><strong>IT Infrastructure Partners:</strong> Cloud hosting, encryption services, and customer relationship management platforms.</li>
                <li><strong>Legal Requirements:</strong> Regulatory bodies or law enforcement authorities when strictly mandated by law or court order.</li>
              </ul>
            </div>
          </section>

          {/* 05 Cookies */}
          <section className="policy-section" id="cookies">
            <div className="section-head">
              <span className="section-num">05</span>
              <h2 className="section-title">Cookies & Tracking Technologies</h2>
            </div>
            <div className="section-body">
              <p>
                Cookies are small text files stored on your browser or device to improve website functionality and personalize your browsing journey.
              </p>
              <ul className="policy-list">
                <li><strong>Essential Cookies:</strong> Required for fundamental site operations, including shopping bag persistence and secure login sessions.</li>
                <li><strong>Performance & Analytics Cookies:</strong> Helping us analyze site usage, traffic patterns, and page load speeds to optimize performance.</li>
                <li><strong>Preference Cookies:</strong> Remembering your language, region, and currency settings across visits.</li>
              </ul>
              <p>
                You may adjust your browser settings to refuse or delete cookies at any time, though certain features of our boutique may be limited.
              </p>
            </div>
          </section>

          {/* 06 Data Security */}
          <section className="policy-section" id="data-security">
            <div className="section-head">
              <span className="section-num">06</span>
              <h2 className="section-title">Data Security</h2>
            </div>
            <div className="section-body">
              <p>
                We employ robust technical, administrative, and physical safeguards designed to protect personal data against unauthorized access, destruction, loss, or alteration.
              </p>
              <p>
                Our security architecture includes SSL/TLS encryption for all transmitted data, firewalls, regular security audits, and restricted employee access controls.
              </p>
            </div>
          </section>

          {/* 07 Your Rights */}
          <section className="policy-section" id="your-rights">
            <div className="section-head">
              <span className="section-num">07</span>
              <h2 className="section-title">Your Rights</h2>
            </div>
            <div className="section-body">
              <p>You maintain full control over your personal information. Depending on your jurisdiction, your rights include:</p>
              <ul className="policy-list">
                <li><strong>Access & Portability:</strong> Requesting a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> Requesting updates to inaccurate or incomplete information.</li>
                <li><strong>Erasure:</strong> Requesting deletion of your personal account data, subject to legitimate tax and legal retention requirements.</li>
                <li><strong>Opt-Out:</strong> Unsubscribing from marketing emails by clicking the "Unsubscribe" link in any communication or updating your account profile.</li>
              </ul>
            </div>
          </section>

          {/* 08 Policy Updates */}
          <section className="policy-section" id="policy-updates">
            <div className="section-head">
              <span className="section-num">08</span>
              <h2 className="section-title">Policy Updates</h2>
            </div>
            <div className="section-body">
              <p>
                We may periodically update this Privacy Policy to reflect changes in our operational practices, technological enhancements, or legal standards.
              </p>
              <p>
                Any modifications will be posted directly on this page with an updated "Effective Date". We encourage you to review this policy periodically.
              </p>
            </div>
          </section>

          {/* 09 Contact Information */}
          <section className="policy-section" id="contact-info">
            <div className="section-head">
              <span className="section-num">09</span>
              <h2 className="section-title">Contact Information</h2>
            </div>
            <div className="section-body">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our data protection practices, please contact our dedicated Privacy Desk:
              </p>
              <div className="contact-details-box">
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <span className="contact-label">EMAIL US</span>
                    <a href="mailto:bizseemee@gmail.com" className="contact-value">bizseemee@gmail.com</a>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="contact-label">CLIENT CARE</span>
                    <a href="tel:+919876543210" className="contact-value">+91 (800) SEE-MEE</a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
