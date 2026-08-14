import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Get inline logo attachment for Nodemailer CID embedding
 */
const getLogoAttachment = () => {
  const possiblePaths = [
    path.join(__dirname, '..', 'public', 'images', 'logoSEEMEE1.png'),
    path.join(__dirname, '..', '..', 'frontend', 'client', 'public', 'images', 'logoSEEMEE1.png'),
    path.join(process.cwd(), 'public', 'images', 'logoSEEMEE1.png'),
    path.join(process.cwd(), 'backend', 'public', 'images', 'logoSEEMEE1.png'),
    path.join(process.cwd(), 'frontend', 'client', 'public', 'images', 'logoSEEMEE1.png')
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return [{
        filename: 'logoSEEMEE1.png',
        path: p,
        cid: 'seemee_logo_header@seemee.com',
        contentDisposition: 'inline'
      }]
    }
  }
  return []
}

/**
 * Create Gmail Transporter using Nodemailer's built-in Gmail Service
 */
const createTransporter = () => {
  const user = (process.env.GMAIL_USER || '').trim()
  const rawPass = (process.env.GMAIL_APP_PASSWORD || '').trim()
  const pass = rawPass.replace(/\s+/g, '') // Strips spaces from 16-character App Password

  if (!user || !pass || user.includes('your_email') || pass.includes('your_app_password')) {
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  })
}

/**
 * Reusable email sending function with inline logo attachment & Gmail fallback
 */
export const sendEmail = async ({ to, subject, html }) => {
  const user = (process.env.GMAIL_USER || '').trim()
  const from = process.env.EMAIL_FROM || `"SEEMEE" <${user || 'noreply@seemee.com'}>`

  const transporter = createTransporter()

  if (!transporter) {
    console.log('\n=================================================================')
    console.log('⚠️ [GMAIL NOT CONFIGURED] Set GMAIL_USER & GMAIL_APP_PASSWORD in backend/.env')
    console.log(`📧 Target Recipient: ${to}`)
    console.log(`🔑 Subject: ${subject}`)
    console.log('=================================================================\n')
    return { success: false, error: 'Gmail credentials not configured in .env' }
  }

  const attachments = getLogoAttachment()

  const mailOptions = {
    from,
    to,
    subject,
    html,
    ...(attachments.length > 0 && { attachments })
  }

  // Attempt 1: Standard Gmail Service
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ [GMAIL SENT] Email successfully delivered to ${to} (MessageId: ${info.messageId})`)
    return { success: true, info }
  } catch (err) {
    console.warn(`⚠️ [Gmail Service failed for ${to}]: ${err.message}. Retrying via Port 587...`)

    // Attempt 2: Explicit Port 587 STARTTLS Fallback
    try {
      const rawPass = (process.env.GMAIL_APP_PASSWORD || '').trim()
      const pass = rawPass.replace(/\s+/g, '')
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      })

      const info = await fallbackTransporter.sendMail(mailOptions)
      console.log(`✅ [GMAIL SENT via Port 587] Email successfully delivered to ${to} (MessageId: ${info.messageId})`)
      return { success: true, info }
    } catch (fallbackErr) {
      console.error(`❌ [GMAIL SMTP ERROR for ${to}]:`, fallbackErr.message)
      if (fallbackErr.message.includes('535') || fallbackErr.message.includes('BadCredentials')) {
        console.log('\n=================================================================')
        console.log('❌ [GMAIL AUTHENTICATION FAILED - 535 Bad Credentials]')
        console.log('👉 Google rejected the App Password in backend/.env.')
        console.log('   Reason: Google App Passwords are 16 letters (4 blocks of 4 letters).')
        console.log('   Go to: https://myaccount.google.com/apppasswords to generate a new 16-character password.')
        console.log('=================================================================\n')
      }
      return { success: false, error: fallbackErr.message }
    }
  }
}

const getLogoHeaderHtml = (subtitle = 'Notification') => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')

  // 1. Prefer CID inline attachment (cid:seemee_logo_header@seemee.com) which works reliably across Gmail, Outlook & Apple Mail.
  // Base64 data URIs are blocked/stripped by Gmail and webmail providers causing broken logo image icons.
  const logoAttachments = getLogoAttachment()
  let logoSrc = 'cid:seemee_logo_header@seemee.com'

  if (logoAttachments.length === 0) {
    if (process.env.PUBLIC_LOGO_URL) {
      logoSrc = process.env.PUBLIC_LOGO_URL
    } else if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
      logoSrc = `${clientUrl}/images/logoSEEMEE1.png`
    }
  }

  return `
    <div style="text-align: center; margin-bottom: 25px;">
      <a href="${clientUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
        <img src="${logoSrc}" alt="SEEMEE Logo" width="160" height="56" style="max-height: 56px; height: 56px; width: auto; max-width: 180px; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto; border: 0; outline: none; text-decoration: none;" />
      </a>
      <h2 style="font-family: Georgia, 'Times New Roman', serif; color: #1C1917; font-size: 26px; font-weight: bold; margin: 0; letter-spacing: 2px;">SEEMEE</h2>
      <p style="color: #D4AF37; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-top: 4px; margin-bottom: 0;">${subtitle}</p>
    </div>
  `
}

/**
 * 1. Send Forgot Password OTP Email
 */
export const sendOtpEmail = async (email, name, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 30px; border-radius: 12px; border: 1px solid #E7E5E4; color: #1C1917;">
      ${getLogoHeaderHtml('Security Verification')}

      <div style="background: #FFFFFF; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
        <h3 style="margin-top: 0; color: #1C1917; font-size: 20px;">Password Reset Request</h3>
        <p style="color: #57534E; font-size: 14px; line-height: 1.6;">Hello <strong>${name || 'Valued Customer'}</strong>,</p>
        <p style="color: #57534E; font-size: 14px; line-height: 1.6;">We received a request to reset your password. Use the 6-digit OTP code below to verify your request:</p>
        
        <div style="background: #1C1917; border: 2px solid #D4AF37; padding: 18px; border-radius: 8px; text-align: center; margin: 25px 0;">
          <span style="font-family: monospace; font-size: 36px; font-weight: bold; color: #D4AF37; letter-spacing: 8px;">${otp}</span>
        </div>

        <p style="font-size: 13px; color: #78716C; margin-bottom: 0;">⏰ This OTP is valid for <strong>2 minutes</strong>. Do not share this OTP code with anyone.</p>
      </div>

      <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #A8A29E;">
        <p>© ${new Date().getFullYear()} SEEMEE. All rights reserved.</p>
      </div>
    </div>
  `

  return await sendEmail({
    to: email,
    subject: `${otp} is your SEEMEE Password Reset OTP`,
    html
  })
}

/**
 * 2. Send Order Status Email (Placed, Confirmed, Shipped, Delivered, Cancelled)
 */
export const sendOrderEmail = async (order, statusType = 'Placed') => {
  if (!order || !order.customer || !order.customer.email) {
    console.warn('⚠️ Order email skipped: Missing customer email')
    return null
  }

  const orderId = order.orderNumber || order._id || order.id || 'ORDER'
  const customerName = order.customer?.name || 'Valued Customer'
  const statusStr = String(statusType || order.status || 'Placed').toUpperCase()

  const address = order.customer?.address || {}
  const addressStr = [
    address.street || address.address,
    address.city,
    address.state,
    address.pincode,
    address.country || 'India'
  ].filter(Boolean).join(', ')

  const itemsList = (order.items || []).map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #F5F5F4;">
        <strong style="color: #1C1917; font-size: 14px;">${item.name || 'Item'}</strong>
        <div style="color: #78716C; font-size: 12px; margin-top: 4px;">
          Size: ${item.size || 'Standard'} | Color: ${item.color || 'Standard'} | Qty: ${item.quantity}
        </div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #F5F5F4; text-align: right; font-weight: bold; color: #1C1917;">
        ₹${Number(item.price * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('')

  const statusColors = {
    PLACED: '#2563EB',
    CONFIRMED: '#16A34A',
    SHIPPED: '#0284C7',
    DELIVERED: '#059669',
    CANCELLED: '#DC2626'
  }

  const badgeColor = statusColors[statusStr] || '#1C1917'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #FAF9F6; padding: 30px; border-radius: 12px; border: 1px solid #E7E5E4; color: #1C1917;">
      ${getLogoHeaderHtml(statusStr === 'PLACED' ? 'Order Confirmation' : statusStr === 'CANCELLED' ? 'Order Cancellation' : 'Order Update')}

      <div style="background: #FFFFFF; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F5F5F4; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h3 style="margin: 0; color: #1C1917; font-size: 18px;">Order #${orderId}</h3>
            <span style="font-size: 12px; color: #78716C;">Status: <strong style="color: ${badgeColor};">${statusStr}</strong></span>
          </div>
        </div>

        <p style="color: #57534E; font-size: 14px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
        <p style="color: #57534E; font-size: 14px; line-height: 1.6;">
          ${statusStr === 'PLACED' ? 'Thank you for your order! Your selection has been placed successfully.' : ''}
          ${statusStr === 'CONFIRMED' ? 'Great news! Your order has been confirmed.' : ''}
          ${statusStr === 'SHIPPED' ? 'Your order has been shipped and is on its way to your location.' : ''}
          ${statusStr === 'DELIVERED' ? 'Your order has been delivered successfully. Thank you for shopping with SEEMEE!' : ''}
          ${statusStr === 'CANCELLED' ? 'Your order has been cancelled as requested before shipping.' : ''}
          ${statusStr === 'REFUNDED' ? 'Your order refund has been processed successfully.' : ''}
        </p>

        ${(statusStr === 'CANCELLED' || statusStr === 'REFUNDED') ? (
          (order.paymentMethod === 'online' || order.paymentStatus === 'paid') ? `
            <div style="background: #FFFBEB; border: 1.5px solid #F59E0B; padding: 16px; border-radius: 8px; margin: 20px 0; color: #92400E; font-size: 14px; line-height: 1.5;">
              <strong style="font-size: 15px; color: #78350F; display: block; margin-bottom: 4px;">💳 Refund Notice:</strong>
              Your refund of <strong>₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}</strong> will be processed and credited to your original payment method within <strong>5-7 working days</strong>.
            </div>
          ` : `
            <div style="background: #F3F4F6; border: 1px solid #E5E7EB; padding: 14px; border-radius: 8px; margin: 20px 0; color: #4B5563; font-size: 13px; line-height: 1.5;">
              <strong style="color: #1F2937; display: block; margin-bottom: 4px;">ℹ️ Payment Notice:</strong>
              As this was a Cash on Delivery (COD) order, no payment refund is required.
            </div>
          `
        ) : ''}

        <h4 style="color: #1C1917; font-size: 15px; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #D4AF37; padding-bottom: 6px;">Ordered Items</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${itemsList}
          <tr>
            <td style="padding-top: 15px; font-weight: bold; font-size: 15px; color: #1C1917;">Total Amount:</td>
            <td style="padding-top: 15px; text-align: right; font-weight: bold; font-size: 16px; color: #D4AF37;">
              ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}
            </td>
          </tr>
        </table>

        <div style="background: #FAF9F6; padding: 15px; border-radius: 8px; font-size: 13px; color: #57534E; line-height: 1.5;">
          <strong style="color: #1C1917; display: block; margin-bottom: 4px;">📍 Delivery Address:</strong>
          ${customerName}<br/>
          ${addressStr || 'Address provided during checkout'}
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #F5F5F4;">
          <p style="font-size: 15px; font-family: Georgia, serif; color: #1C1917; margin: 0;">Thank you for choosing SEEMEE.</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #A8A29E;">
        <p>© ${new Date().getFullYear()} SEEMEE. All rights reserved.</p>
      </div>
    </div>
  `

  return await sendEmail({
    to: order.customer.email,
    subject: `Order #${orderId} - ${statusStr}`,
    html
  })
}

export default {
  sendEmail,
  sendOtpEmail,
  sendOrderEmail
}
