import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

const createTransporter = () => {
  // In development/test environment without SMTP keys, use a mock logger
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    return {
      sendMail: async (options) => {
        console.log('\n--- 📧 MOCK EMAIL SENT ---')
        console.log(`To: ${options.to}`)
        console.log(`Subject: ${options.subject}`)
        console.log(`Body Snippet: ${options.html.substring(0, 100)}...`)
        console.log('---------------------------\n')
        return { messageId: 'mock-id-' + Date.now() }
      }
    }
  }

  // Real SMTP Transporter (Production)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

const transporter = createTransporter()

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const attachments = getLogoAttachment()
    const info = await transporter.sendMail({
      from: `"SEEMEE" <${process.env.SMTP_FROM || 'noreply@seemee.com'}>`,
      to,
      subject,
      html,
      ...(attachments.length > 0 && { attachments })
    })
    return info
  } catch (error) {
    console.error('❌ Email Error:', error)
    // Don't throw error to avoid breaking main application flow
    return null
  }
}

// Transactional Email Templates
export const sendOrderConfirmation = async (order) => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')
  const logoAttachments = getLogoAttachment()
  const logoUrl = logoAttachments.length > 0 ? 'cid:seemee_logo_header@seemee.com' : `${clientUrl}/images/logoSEEMEE1.png`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoUrl}" alt="SEEMEE" style="max-height: 52px; height: 52px; width: auto; margin-bottom: 8px; display: inline-block;" />
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin: 0; font-size: 24px;">SEEMEE</h2>
      </div>
      <h3 style="color: #D4AF37; border-bottom: 1px solid #eee; padding-bottom: 10px;">Order Confirmed</h3>
      <p>Hello ${order.customer.name},</p>
      <p>Thank you for shopping at SEEMEE. Your order <strong>#${order._id}</strong> has been successfully placed.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Order Summary</h3>
        ${order.items.map(item => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>${item.name} (x${item.quantity})</span>
            <span>₹${item.price.toLocaleString()}</span>
          </div>
        `).join('')}
        <hr style="border: 0; border-top: 1px solid #ddd;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total</span>
          <span>₹${order.totalAmount.toLocaleString()}</span>
        </div>
      </div>
      
      <p>We will notify you once your order has been shipped.</p>
      <p>Warm regards,<br><strong>SEEMEE</strong></p>
    </div>
  `
  return sendEmail({ to: order.customer.email, subject: `Order Confirmed - #${order._id}`, html })
}

export const sendStatusUpdate = async (order) => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')
  const logoAttachments = getLogoAttachment()
  const logoUrl = logoAttachments.length > 0 ? 'cid:seemee_logo_header@seemee.com' : `${clientUrl}/images/logoSEEMEE1.png`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoUrl}" alt="SEEMEE" style="max-height: 52px; height: 52px; width: auto; margin-bottom: 8px; display: inline-block;" />
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin: 0; font-size: 24px;">SEEMEE</h2>
      </div>
      <h3 style="color: #D4AF37;">Order Status Updated</h3>
      <p>Hello ${order.customer.name},</p>
      <p>The status of your order <strong>#${order._id}</strong> has been updated to: <strong>${order.status.toUpperCase()}</strong>.</p>
      <p>You can track your order in your account dashboard.</p>
      <p>Warm regards,<br><strong>SEEMEE</strong></p>
    </div>
  `
  return sendEmail({ to: order.customer.email, subject: `Order Status Update - #${order._id}`, html })
}
