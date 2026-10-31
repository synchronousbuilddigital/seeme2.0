/**
 * SEEMEE Atelier - Unified Luxury Invoice Helper
 * Generates an identical, elegant, print-ready Tax Invoice across Admin and Client applications.
 */

export const generateOrderInvoiceHtml = (order = {}) => {
  const customer = order.customer || {}
  const customerName = customer.name || order.deliveryAddress?.name || order.user?.name || 'Valued Client'
  const customerEmail = customer.email || order.deliveryAddress?.email || order.user?.email || 'N/A'
  const customerPhone = customer.phone || order.deliveryAddress?.phone || order.user?.phone || 'N/A'

  const addressObj = customer.address || order.deliveryAddress || order.billingAddress || {}
  const street = addressObj.street || addressObj.addressLine1 || addressObj.line1 || ''
  const city = addressObj.city || ''
  const state = addressObj.state || ''
  const pincode = addressObj.pincode || addressObj.postalCode || addressObj.zip || ''
  const country = addressObj.country || 'India'

  const orderNum = order.orderNumber || (order._id ? `SM${String(order._id).slice(-10).toUpperCase()}` : 'SEEMEE-ORDER')
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()

  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const isOffline = String(order.orderType || '').toUpperCase() === 'OFFLINE'
  const orderChannel = isOffline ? 'Atelier Offline Store' : 'Online Store (Pan-India)'

  const isCod = String(order.paymentMethod || '').toLowerCase() === 'cod'
  const isPaid = String(order.paymentStatus || '').toLowerCase() === 'paid'

  const paymentMethodLabel = isCod ? 'Cash on Delivery (COD)' : 'Instant Online Payment (Razorpay / UPI / Cards)'
  const paymentStatusLabel = isPaid
    ? 'PAID'
    : isCod
    ? 'PAYABLE AT DOORSTEP'
    : 'PROCESSING'

  const rawStatus = String(order.status || 'processing').toLowerCase()
  const displayStatus = rawStatus === 'pending_approval' || rawStatus === 'pending'
    ? 'PROCESSING'
    : rawStatus.toUpperCase()

  const items = Array.isArray(order.items) ? order.items : []
  const subtotal = items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
  const discount = Number(order.couponDiscount || 0)
  const grandTotal = Number(order.totalAmount != null ? order.totalAmount : Math.max(0, subtotal - discount))

  const itemsRowsHtml = items.length > 0 ? items.map((item, index) => {
    const name = item.name || item.product?.name || 'Haute Couture Ensemble'
    const size = item.size || item.selectedSize || 'Standard'
    const color = item.color || item.selectedColor || ''
    const qty = Number(item.quantity || 1)
    const price = Number(item.price || 0)
    const lineTotal = price * qty

    const variantNotes = [
      size ? `Size: <strong>${size}</strong>` : null,
      color && color.toLowerCase() !== 'standard' ? `Color: <strong>${color}</strong>` : null
    ].filter(Boolean).join('&nbsp;&nbsp;•&nbsp;&nbsp;')

    return `
      <tr>
        <td class="col-center col-num">${index + 1}</td>
        <td class="col-desc">
          <div class="item-name">${name}</div>
          ${variantNotes ? `<div class="item-meta">${variantNotes}</div>` : ''}
        </td>
        <td class="col-center">₹${price.toLocaleString('en-IN')}</td>
        <td class="col-center item-qty">${qty}</td>
        <td class="col-right item-total">₹${lineTotal.toLocaleString('en-IN')}</td>
      </tr>
    `
  }).join('') : `
    <tr>
      <td colspan="5" style="text-align:center; padding: 24px; color: #777;">No line items detailed for this order.</td>
    </tr>
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEEMEE Atelier - Tax Invoice #${orderNum}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F7F4;
      color: #1C1917;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 30px 15px;
    }

    .screen-actions-bar {
      max-width: 860px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1C1917;
      color: #FFF;
      padding: 12px 24px;
      border-radius: 10px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.15);
    }

    .screen-actions-bar span {
      font-size: 0.9rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: #E7E5E4;
    }

    .screen-actions-btns {
      display: flex;
      gap: 10px;
    }

    .action-btn {
      padding: 8px 18px;
      border-radius: 6px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .action-btn.btn-print {
      background: #D4AF37;
      color: #1C1917;
    }

    .action-btn.btn-print:hover {
      background: #E5C158;
    }

    .action-btn.btn-close {
      background: rgba(255, 255, 255, 0.15);
      color: #FFF;
    }

    .action-btn.btn-close:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .invoice-card {
      max-width: 860px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 8px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
      position: relative;
      overflow: hidden;
      padding: 48px;
    }

    /* Luxury Golden Accent Top Bar */
    .invoice-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #997825 0%, #D4AF37 40%, #F5E6AB 70%, #997825 100%);
    }

    /* Header Section */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #F1EFEA;
      padding-bottom: 28px;
      margin-bottom: 28px;
    }

    .brand-block h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      color: #000000;
      text-transform: uppercase;
      line-height: 1;
      margin-bottom: 6px;
    }

    .brand-block .tagline {
      font-size: 0.72rem;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #997825;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .brand-contact {
      font-size: 0.78rem;
      color: #78716C;
      line-height: 1.5;
    }

    .invoice-meta-block {
      text-align: right;
    }

    .invoice-meta-block h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.45rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #1C1917;
      margin-bottom: 10px;
    }

    .meta-row {
      font-size: 0.85rem;
      color: #57534E;
      margin-bottom: 4px;
    }

    .meta-row strong {
      color: #1C1917;
    }

    .meta-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-top: 6px;
    }

    .meta-badge.status-badge {
      background: #F5F5F4;
      color: #1C1917;
      border: 1px solid #D6D3D1;
    }

    /* Client & Order Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 36px;
      margin-bottom: 32px;
      background: #FAF8F5;
      border: 1px solid #EAE6DF;
      border-radius: 8px;
      padding: 22px 24px;
    }

    .section-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #8C6D23;
      margin-bottom: 8px;
      border-bottom: 1px solid #EAE6DF;
      padding-bottom: 4px;
    }

    .details-col p {
      font-size: 0.86rem;
      color: #44403C;
      margin-bottom: 3px;
      line-height: 1.45;
    }

    .details-col .client-name {
      font-size: 0.98rem;
      font-weight: 700;
      color: #1C1917;
      margin-bottom: 4px;
    }

    .payment-tag {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 0.74rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }

    .payment-tag.paid {
      background: #DCFCE7;
      color: #15803D;
      border: 1px solid #86EFAC;
    }

    .payment-tag.pending {
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FCD34D;
    }

    /* Table */
    .table-container {
      margin-bottom: 28px;
    }

    table.invoice-items {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #E7E5E4;
    }

    table.invoice-items th {
      background: #1C1917;
      color: #FFFFFF;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 12px 14px;
      border-right: 1px solid #292524;
    }

    table.invoice-items th:last-child {
      border-right: none;
    }

    table.invoice-items td {
      padding: 14px;
      border-bottom: 1px solid #F1EFEA;
      font-size: 0.88rem;
      color: #44403C;
      vertical-align: middle;
    }

    table.invoice-items tr:nth-child(even) td {
      background: #FAF8F5;
    }

    table.invoice-items .col-num {
      width: 40px;
    }

    table.invoice-items .col-center {
      text-align: center;
    }

    table.invoice-items .col-right {
      text-align: right;
    }

    table.invoice-items .col-desc {
      text-align: left;
    }

    .item-name {
      font-weight: 600;
      color: #1C1917;
      font-size: 0.92rem;
    }

    .item-meta {
      font-size: 0.78rem;
      color: #78716C;
      margin-top: 3px;
    }

    .item-qty {
      font-weight: 600;
      color: #1C1917;
    }

    .item-total {
      font-weight: 700;
      color: #1C1917;
    }

    /* Summary & Totals */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 34px;
    }

    .summary-box {
      width: 360px;
      background: #FAF8F5;
      border: 1px solid #EAE6DF;
      border-radius: 8px;
      padding: 18px 22px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.86rem;
      color: #57534E;
      margin-bottom: 8px;
    }

    .summary-row.discount-row {
      color: #15803D;
      font-weight: 600;
    }

    .summary-row.shipping-row {
      color: #15803D;
      font-weight: 500;
    }

    .summary-divider {
      height: 1px;
      background: #EAE6DF;
      margin: 12px 0;
    }

    .summary-row.grand-total {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1C1917;
      margin-bottom: 0;
      padding-top: 4px;
    }

    .summary-row.grand-total .total-amount {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.35rem;
      color: #997825;
    }

    /* Footer & Atelier Sign-off */
    .invoice-footer {
      border-top: 1.5px solid #F1EFEA;
      padding-top: 24px;
      text-align: center;
    }

    .footer-quote {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 1.05rem;
      color: #997825;
      margin-bottom: 8px;
    }

    .footer-legal {
      font-size: 0.74rem;
      color: #78716C;
      line-height: 1.6;
      max-width: 680px;
      margin: 0 auto;
    }

    .footer-stamp {
      margin-top: 12px;
      font-size: 0.68rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #A8A29E;
      font-weight: 600;
    }

    /* Print Overrides */
    @media print {
      @page {
        size: A4;
        margin: 12mm 15mm;
      }

      body {
        background-color: #FFFFFF !important;
        padding: 0 !important;
      }

      .no-print,
      .screen-actions-bar {
        display: none !important;
      }

      .invoice-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
      }

      .details-grid {
        background: #FAF8F5 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      table.invoice-items th {
        background: #1C1917 !important;
        color: #FFFFFF !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .summary-box {
        background: #FAF8F5 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .invoice-card::before {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Floating Screen Actions (Hidden on Print) -->
  <div class="screen-actions-bar no-print">
    <span>SEEMEE Atelier • Tax Invoice #${orderNum}</span>
    <div class="screen-actions-btns">
      <button class="action-btn btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save PDF
      </button>
      <button class="action-btn btn-close" onclick="window.close()">
        Close
      </button>
    </div>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div class="invoice-header">
      <div class="brand-block">
        <h1>SEEMEE</h1>
        <div class="tagline">Haute Couture Atelier</div>
        <div class="brand-contact">
          Registered Luxury Atelier • New Delhi, India<br>
          Official Store: seemee.in &nbsp;|&nbsp; Support: contact@seemee.in<br>
          Tax ID / GSTIN: 07AALCS9120F1ZX
        </div>
      </div>
      <div class="invoice-meta-block">
        <h2>Tax Invoice</h2>
        <div class="meta-row">Invoice / Order No: <strong>#${orderNum}</strong></div>
        <div class="meta-row">Placed Date: <strong>${formattedDate}</strong></div>
        <div class="meta-row">Placed Time: <strong>${formattedTime}</strong></div>
        <div class="meta-row">Channel: <strong>${orderChannel}</strong></div>
        <div><span class="meta-badge status-badge">Order: ${displayStatus}</span></div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="details-grid">
      <div class="details-col">
        <div class="section-title">Billed & Delivered To</div>
        <div class="client-name">${customerName}</div>
        <p>${[street, [city, state].filter(Boolean).join(', ') + (pincode ? ` - ${pincode}` : ''), country].filter(Boolean).join('<br>')}</p>
        <p style="margin-top: 6px;"><strong>Phone:</strong> ${customerPhone}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
      </div>
      <div class="details-col">
        <div class="section-title">Payment & Settlement</div>
        <p><strong>Method:</strong> ${paymentMethodLabel}</p>
        <p><strong>Payment Status:</strong> 
          <span class="payment-tag ${isPaid ? 'paid' : 'pending'}">${paymentStatusLabel}</span>
        </p>
        ${order.paymentDetails?.paymentId ? `<p style="margin-top: 4px; font-size: 0.78rem; color: #666;"><strong>Ref ID:</strong> ${order.paymentDetails.paymentId}</p>` : ''}
        <p style="margin-top: 8px; font-size: 0.78rem; color: #78716C;">
          All deliveries verified prior to dispatch.
        </p>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table class="invoice-items">
        <thead>
          <tr>
            <th class="col-center col-num">#</th>
            <th class="col-desc">Item Description</th>
            <th class="col-center">Unit Price</th>
            <th class="col-center">Qty</th>
            <th class="col-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Summary Box -->
    <div class="summary-section">
      <div class="summary-box">
        <div class="summary-row">
          <span>Items Subtotal</span>
          <span>₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${discount > 0 ? `
          <div class="summary-row discount-row">
            <span>Special Atelier Discount ${order.couponCode ? `(${order.couponCode})` : ''}</span>
            <span>-₹${discount.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        <div class="summary-row shipping-row">
          <span>Priority White-Glove Shipping</span>
          <span>Complimentary (FREE)</span>
        </div>
        <div class="summary-row" style="font-size: 0.78rem; color: #78716C;">
          <span>Applicable GST / Taxes</span>
          <span>Inclusive</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row grand-total">
          <span>Total Amount</span>
          <span class="total-amount">₹${grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-quote">Thank you for choosing SEEMEE Atelier</div>
      <div class="footer-legal">
        Every garment is crafted with exceptional care and authentic artisanal handiwork. 
        For any alterations, sizing assistance, or concierge support, please write to contact@seemee.in quoting your Order Number.<br>
        Items in unworn condition with original labels may be exchanged within 7 days of delivery.
      </div>
      <div class="footer-stamp">
        Official Authenticated Electronic Tax Invoice • SEEMEE Luxury Atelier • seemee.in
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Triggers the browser print dialog for an order using the standardized luxury invoice layout.
 * Safe across popup blockers and ensures complete DOM rendering before invoking window.print().
 */
export const printOrderInvoice = (order) => {
  if (!order) {
    console.error('printOrderInvoice: No order data provided')
    return
  }

  const invoiceHtml = generateOrderInvoiceHtml(order)
  const printWindow = window.open('', '_blank', 'height=850,width=1000,menubar=no,toolbar=no,location=no,status=no')

  if (!printWindow) {
    alert('Please allow popups for this site to view and print your invoice.')
    return
  }

  printWindow.document.open()
  printWindow.document.write(invoiceHtml)
  printWindow.document.close()

  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    try {
      printWindow.focus()
      printWindow.print()
    } catch (e) {
      console.error('Error invoking print dialog:', e)
    }
  }

  printWindow.onload = () => {
    setTimeout(triggerPrint, 350)
  }

  // Fallback in case onload fired synchronously or is bypassed
  setTimeout(triggerPrint, 750)
}

