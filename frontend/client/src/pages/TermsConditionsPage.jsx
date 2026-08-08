import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './PolicyPages.css'

const TermsConditionsPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Terms & Conditions | See Mee Haute Couture'
    window.scrollTo(0, 0)
  }, [])

  const tocItems = [
    { id: 'general-terms', num: '01', title: 'General Terms' },
    { id: 'product-info', num: '02', title: 'Product Information' },
    { id: 'pricing', num: '03', title: 'Pricing & Currency' },
    { id: 'orders', num: '04', title: 'Orders & Acceptance' },
    { id: 'shipping', num: '05', title: 'Shipping & Delivery' },
    { id: 'user-responsibilities', num: '06', title: 'User Responsibilities' },
    { id: 'intellectual-property', num: '07', title: 'Intellectual Property' },
    { id: 'limitation-liability', num: '08', title: 'Limitation of Liability' },
    { id: 'changes-terms', num: '09', title: 'Changes to Terms' },
    { id: 'contact-info', num: '10', title: 'Contact Information' }
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
            LEGAL AGREEMENT & RULES
          </motion.span>
          <motion.h1 
            className="policy-hero-title"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          >
            Terms & <span className="italic-accent">Conditions</span>
          </motion.h1>
          <motion.p 
            className="policy-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            Please review the terms and conditions governing your access to and use of See Mee Haute Couture's online platform, digital services, and bespoke creations.
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <h2 className="overview-title">Terms of Service Agreement</h2>
          </div>
          <p className="overview-text">
            By browsing, accessing, or placing an order on See Mee ("the Website"), you agree to be bound by these Terms & Conditions. If you do not agree with any portion of these terms, we kindly ask that you discontinue using our website.
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
          {/* 01 General Terms */}
          <section className="policy-section" id="general-terms">
            <div className="section-head">
              <span className="section-num">01</span>
              <h2 className="section-title">General Terms</h2>
            </div>
            <div className="section-body">
              <p>
                The website www.seemee.in is operated by See Mee Haute Couture. Throughout the site, the terms "we", "us", and "our" refer to See Mee.
              </p>
              <ul className="policy-list">
                <li><strong>Eligibility:</strong> By placing an order, you represent that you are at least the legal age of majority in your jurisdiction, or have parental consent to use this site.</li>
                <li><strong>Service Availability:</strong> We reserve the right to refuse service, terminate accounts, or cancel orders at our discretion if fraud or violation of terms is suspected.</li>
                <li><strong>Compliance:</strong> You agree not to use our products or website for any illegal or unauthorized purpose.</li>
              </ul>
            </div>
          </section>

          {/* 02 Product Information */}
          <section className="policy-section" id="product-info">
            <div className="section-head">
              <span className="section-num">02</span>
              <h2 className="section-title">Product Information</h2>
            </div>
            <div className="section-body">
              <p>
                Every See Mee creation is handcrafted using traditional Indian weaving, embroidery, and dyeing techniques.
              </p>
              <ul className="policy-list">
                <li><strong>Handcrafted Variations:</strong> Minor variations in color, weave texture, embroidery placement, and embellishments are natural hallmarks of handloom and handcrafted luxury, not defects.</li>
                <li><strong>Color Display:</strong> We attempt to display product colors as accurately as possible. However, actual colors may vary slightly due to device screen settings and studio lighting.</li>
                <li><strong>Availability:</strong> Products are subject to availability. Items placed in your shopping bag are not reserved until checkout is completed.</li>
              </ul>
            </div>
          </section>

          {/* 03 Pricing & Currency */}
          <section className="policy-section" id="pricing">
            <div className="section-head">
              <span className="section-num">03</span>
              <h2 className="section-title">Pricing & Currency</h2>
            </div>
            <div className="section-body">
              <p>
                All prices listed on our website are shown in Indian Rupees (INR ₹) inclusive of applicable taxes, unless specified otherwise.
              </p>
              <ul className="policy-list">
                <li><strong>Price Adjustments:</strong> We reserve the right to modify prices without prior notice. However, confirmed orders will be fulfilled at the price quoted at checkout.</li>
                <li><strong>Typographical Errors:</strong> In the rare event that an item is listed at an incorrect price due to technical error, we reserve the right to cancel or modify affected orders prior to dispatch.</li>
              </ul>
            </div>
          </section>

          {/* 04 Orders & Acceptance */}
          <section className="policy-section" id="orders">
            <div className="section-head">
              <span className="section-num">04</span>
              <h2 className="section-title">Orders & Acceptance</h2>
            </div>
            <div className="section-body">
              <p>
                Upon placing an order, you will receive an automated order confirmation via email or SMS detailing your purchase.
              </p>
              <ul className="policy-list">
                <li><strong>Order Confirmation:</strong> An order confirmation email signifies receipt of your order request, but does not constitute final acceptance until payment validation and item dispatch.</li>
                <li><strong>Cancellation Policy:</strong> Orders can only be cancelled before shipment processing. Once a product has been dispatched, orders cannot be cancelled under any circumstances.</li>
              </ul>
            </div>
          </section>

          {/* 05 Shipping & Delivery */}
          <section className="policy-section" id="shipping">
            <div className="section-head">
              <span className="section-num">05</span>
              <h2 className="section-title">Shipping & Delivery</h2>
            </div>
            <div className="section-body">
              <p>
                We ship nationwide across India and internationally to selected destinations using trusted luxury courier partners.
              </p>
              <ul className="policy-list">
                <li><strong>Processing Timelines:</strong> Ready-to-wear items dispatch within 2-4 business days. Custom tailored or handcrafted couture pieces may require 2-4 weeks of lead time.</li>
                <li><strong>Delivery Delays:</strong> Delivery dates are estimates. See Mee is not liable for minor delays resulting from weather, customs clearance, or logistics delays beyond our direct control.</li>
              </ul>
            </div>
          </section>

          {/* 06 User Responsibilities */}
          <section className="policy-section" id="user-responsibilities">
            <div className="section-head">
              <span className="section-num">06</span>
              <h2 className="section-title">User Responsibilities</h2>
            </div>
            <div className="section-body">
              <p>
                As a valued visitor and customer, you agree to interact with our platform respectfully and securely.
              </p>
              <ul className="policy-list">
                <li><strong>Accurate Information:</strong> Providing complete, accurate, and current contact and shipping information.</li>
                <li><strong>Account Confidentiality:</strong> Maintaining the security of your account login credentials and accepting responsibility for all activities under your account.</li>
                <li><strong>Prohibited Actions:</strong> Refraining from transmitting malware, attempting unauthorized server access, or scraping site content.</li>
              </ul>
            </div>
          </section>

          {/* 07 Intellectual Property */}
          <section className="policy-section" id="intellectual-property">
            <div className="section-head">
              <span className="section-num">07</span>
              <h2 className="section-title">Intellectual Property</h2>
            </div>
            <div className="section-body">
              <p>
                All content on this website—including brand names, logos, original embroidery patterns, garment designs, product photography, copy, images, graphics, and video media—is the exclusive intellectual property of See Mee Haute Couture.
              </p>
              <div className="policy-callout">
                <strong>Copyright Protection:</strong> Any unauthorized reproduction, distribution, modification, or commercial exploitation of See Mee content or designs without express written consent is strictly prohibited and subject to legal action.
              </div>
            </div>
          </section>

          {/* 08 Limitation of Liability */}
          <section className="policy-section" id="limitation-liability">
            <div className="section-head">
              <span className="section-num">08</span>
              <h2 className="section-title">Limitation of Liability</h2>
            </div>
            <div className="section-body">
              <p>
                To the fullest extent permitted by applicable law, See Mee Haute Couture, its directors, officers, and employees shall not be liable for indirect, incidental, or consequential damages resulting from your use of or inability to use our site or products.
              </p>
            </div>
          </section>

          {/* 09 Changes to Terms */}
          <section className="policy-section" id="changes-terms">
            <div className="section-head">
              <span className="section-num">09</span>
              <h2 className="section-title">Changes to Terms</h2>
            </div>
            <div className="section-body">
              <p>
                We reserve the right to revise or update these Terms & Conditions at any time. Any changes will take effect immediately upon publication on the website. Continued use of the website following updates constitutes acceptance of the revised terms.
              </p>
            </div>
          </section>

          {/* 10 Contact Information */}
          <section className="policy-section" id="contact-info">
            <div className="section-head">
              <span className="section-num">10</span>
              <h2 className="section-title">Contact Information</h2>
            </div>
            <div className="section-body">
              <p>
                If you have questions regarding these Terms & Conditions, please contact our Legal & Advisory Desk:
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
                    <span className="contact-label">LEGAL INQUIRIES</span>
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
                    <span className="contact-label">CLIENT CONCIERGE</span>
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

export default TermsConditionsPage
