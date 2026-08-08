import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './PolicyPages.css'

const ReturnPolicyPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Return & Exchange Policy | See Mee Haute Couture'
    window.scrollTo(0, 0)
  }, [])

  const highlightRules = [
    {
      title: 'No Returns After Dispatch',
      text: 'Returns and cancellations are NOT accepted once a product has been shipped. No cash refunds are provided after dispatch.',
      type: 'warning',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      )
    },
    {
      title: '7-Day Exchange Window',
      text: 'Products can only be exchanged within 7 days of delivery. Items must be unused, unworn, unwashed, with original tags and packaging intact.',
      type: 'standard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
      )
    },
    {
      title: 'Price Tier Exchange Rules',
      text: 'Exchange is permitted ONLY for a product of equal price or higher price (paying the difference). Exchange to a lower-priced product is NOT allowed.',
      type: 'standard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      )
    },
    {
      title: '48-Hour Damage Reporting',
      text: 'Damaged, defective, or incorrect items must be reported within 48 hours of delivery accompanied by photos and preferably an unboxing video.',
      type: 'success',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
      )
    }
  ]

  const tocItems = [
    { id: 'overview-policy', num: '01', title: 'Policy Overview' },
    { id: 'no-returns-dispatch', num: '02', title: 'No Returns & No Refunds After Dispatch' },
    { id: 'cancellation-rules', num: '03', title: 'Order Cancellation Rules' },
    { id: 'exchange-eligibility', num: '04', title: 'Exchange Eligibility (7 Days)' },
    { id: 'price-conditions', num: '05', title: 'Price Conditions for Exchange' },
    { id: 'no-cash-refunds', num: '06', title: 'No Cash Refunds or Store Credits' },
    { id: 'damaged-defective', num: '07', title: 'Damaged, Defective & Incorrect Products (48h)' },
    { id: 'shipping-charges', num: '08', title: 'Exchange Shipping Charges' },
    { id: 'exchange-process', num: '09', title: 'How to Request an Exchange' }
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
            HAUTE COUTURE CLIENT CARE
          </motion.span>
          <motion.h1 
            className="policy-hero-title"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          >
            Return & <span className="italic-accent">Exchange Policy</span>
          </motion.h1>
          <motion.p 
            className="policy-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            Our creations are crafted with meticulous artisanal devotion. Please review our exact exchange terms and guidelines before placing your order.
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
        {/* Quick Summary Cards */}
        <div className="rule-highlights-grid">
          {highlightRules.map((rule, idx) => (
            <div key={idx} className={`rule-card ${rule.type === 'warning' ? 'strict-warning' : rule.type === 'success' ? 'success-pill' : ''}`}>
              <div className="rule-icon-wrap">{rule.icon}</div>
              <h3 className="rule-card-title">{rule.title}</h3>
              <p className="rule-card-text">{rule.text}</p>
            </div>
          ))}
        </div>

        {/* Overview Box */}
        <div className="policy-overview-card">
          <div className="overview-header">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <h2 className="overview-title">Artisanal Exchange Policy Summary</h2>
          </div>
          <p className="overview-text">
            Because each See Mee garment represents handcrafted luxury—involving intricate handloom weaving, manual Zardozi needlework, and bespoke finishing—we do not offer post-dispatch order cancellations or cash refunds. We support product exchanges under specific, fair terms detailed below.
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
          {/* 01 Overview Policy */}
          <section className="policy-section" id="overview-policy">
            <div className="section-head">
              <span className="section-num">01</span>
              <h2 className="section-title">Policy Overview</h2>
            </div>
            <div className="section-body">
              <p>
                At See Mee Haute Couture, we maintain the highest standards of quality control for every handloom weave, silk ensemble, and handcrafted suit dispatched from our atelier.
              </p>
              <p>
                To maintain fair operational guidelines for our weavers, artisans, and clients, all purchases are subject to the strict business rules outlined in this document.
              </p>
            </div>
          </section>

          {/* 02 No Returns & No Refunds After Dispatch */}
          <section className="policy-section" id="no-returns-dispatch">
            <div className="section-head">
              <span className="section-num">02</span>
              <h2 className="section-title">No Returns & No Refunds After Dispatch</h2>
            </div>
            <div className="section-body">
              <div className="policy-callout alert">
                <strong>STRICT BUSINESS RULE:</strong> Returns are <strong>NOT accepted</strong> once a product has been shipped. <strong>No monetary refunds</strong> are provided after dispatch under any circumstances.
              </div>
              <p>
                Once an order departs our warehouse or production atelier, the sale is final regarding cash/bank refunds. Customers seeking sizing or style adjustments must request an exchange adhering to our 7-day exchange window.
              </p>
            </div>
          </section>

          {/* 03 Order Cancellation Rules */}
          <section className="policy-section" id="cancellation-rules">
            <div className="section-head">
              <span className="section-num">03</span>
              <h2 className="section-title">Order Cancellation Rules</h2>
            </div>
            <div className="section-body">
              <ul className="policy-list strict-rules">
                <li><strong>Pre-Shipment Cancellations:</strong> You may request an order cancellation strictly before the item has been shipped by contacting Client Care immediately.</li>
                <li><strong>Post-Shipment Cancellations:</strong> Orders <strong>cannot be cancelled</strong> after shipment. Any package refused at delivery will not be eligible for automatic refund or cancellation.</li>
              </ul>
            </div>
          </section>

          {/* 04 Exchange Eligibility (7 Days) */}
          <section className="policy-section" id="exchange-eligibility">
            <div className="section-head">
              <span className="section-num">04</span>
              <h2 className="section-title">Exchange Eligibility (Within 7 Days)</h2>
            </div>
            <div className="section-body">
              <p>
                Products can only be exchanged within <strong>7 days of delivery</strong>. To qualify for an exchange, products must strictly fulfill all of the following conditions:
              </p>
              <ul className="policy-list">
                <li>The product must be completely <strong>unused, unworn, and unwashed</strong>.</li>
                <li>The item must be in its original, pristine condition with all <strong>original brand tags, security seals, and protective packaging</strong> intact.</li>
                <li>Garments displaying any signs of wear, perfume scents, makeup marks, alterations, or washing will be disqualified from exchange.</li>
              </ul>
            </div>
          </section>

          {/* 05 Price Conditions for Exchange */}
          <section className="policy-section" id="price-conditions">
            <div className="section-head">
              <span className="section-num">05</span>
              <h2 className="section-title">Price Conditions for Exchange</h2>
            </div>
            <div className="section-body">
              <p>
                Exchanges are strictly permitted under specific price tier parameters:
              </p>
              <ul className="policy-list">
                <li>
                  <strong>Same Price Exchange:</strong> Exchange is allowed for another product or size of the exact <strong>same price</strong>.
                </li>
                <li>
                  <strong>Higher Price Exchange:</strong> Exchange is allowed for a product of a <strong>higher price</strong>, provided the customer pays the price difference prior to dispatch.
                </li>
                <li>
                  <strong>Lower Price Exchange Prohibited:</strong> Exchange to a <strong>lower-priced product is NOT allowed</strong> under any circumstances. Partial refunds or price adjustments for lower-priced exchanges will not be issued.
                </li>
              </ul>
            </div>
          </section>

          {/* 06 No Cash Refunds or Store Credits */}
          <section className="policy-section" id="no-cash-refunds">
            <div className="section-head">
              <span className="section-num">06</span>
              <h2 className="section-title">No Cash Refunds or Store Credits</h2>
            </div>
            <div className="section-body">
              <p>
                See Mee does <strong>NOT issue cash refunds, bank transfers, credit card reversals, or digital store credit balances</strong> for returned or exchanged merchandise after dispatch.
              </p>
              <p>
                All approved exchange requests are fulfilled directly through product replacement (matching or higher price tier).
              </p>
            </div>
          </section>

          {/* 07 Damaged, Defective & Incorrect Products */}
          <section className="policy-section" id="damaged-defective">
            <div className="section-head">
              <span className="section-num">07</span>
              <h2 className="section-title">Damaged, Defective, or Incorrect Products (48h Reporting)</h2>
            </div>
            <div className="section-body">
              <p>
                In the rare instance that you receive a damaged, defective, or incorrect product, our client care team will promptly rectify the issue.
              </p>
              <div className="policy-callout alert">
                <strong>48-HOUR MANDATORY REPORTING WINDOW:</strong> Damaged, defective, or incorrect items must be reported within <strong>48 hours of delivery</strong>.
              </div>
              <p>To process a defect or damage claim, you must provide:</p>
              <ul className="policy-list">
                <li>Clear, high-resolution <strong>photos</strong> of the defect, damaged area, or incorrect item received.</li>
                <li>An <strong>unboxing video</strong> (strongly recommended / preferred) showing the unopened package parcel and initial unpacking.</li>
                <li>Your original Order Number and registered contact details.</li>
              </ul>
            </div>
          </section>

          {/* 08 Exchange Shipping Charges */}
          <section className="policy-section" id="shipping-charges">
            <div className="section-head">
              <span className="section-num">08</span>
              <h2 className="section-title">Exchange Shipping Charges</h2>
            </div>
            <div className="section-body">
              <ul className="policy-list">
                <li>
                  <strong>Customer-Paid Shipping:</strong> All exchange shipping charges (returning the item to our facility and shipping the replaced item back) are paid by the customer for standard size or style exchanges.
                </li>
                <li>
                  <strong>Company-Paid Shipping:</strong> Reverse pickup and re-shipping fees will be covered entirely by See Mee <strong>ONLY if the mistake is from our side</strong> (e.g., defective item, wrong size dispatched, or wrong product delivered).
                </li>
              </ul>
            </div>
          </section>

          {/* 09 How to Request an Exchange */}
          <section className="policy-section" id="exchange-process">
            <div className="section-head">
              <span className="section-num">09</span>
              <h2 className="section-title">How to Request an Exchange</h2>
            </div>
            <div className="section-body">
              <p>
                To initiate an eligible exchange within the 7-day delivery window, please follow these steps:
              </p>
              <ul className="policy-list">
                <li>Contact our Client Care Concierge via email at <strong>bizseemee@gmail.com</strong> or WhatsApp at <strong>+91 (800) SEE-MEE</strong>.</li>
                <li>Include your Order Number, item details, reason for exchange, desired replacement item/size, and unboxing photos/video (if reporting damage).</li>
                <li>Once approved, our team will provide return shipment instructions. Ensure the item is packed securely in its original box with tags attached.</li>
              </ul>
              <div className="contact-details-box">
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <span className="contact-label">EXCHANGE HELPDESK</span>
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
                    <span className="contact-label">WHATSAPP CARE</span>
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

export default ReturnPolicyPage
