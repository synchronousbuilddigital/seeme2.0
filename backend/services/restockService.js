import RestockSubscription from '../models/RestockSubscription.js'
import Product from '../models/Product.js'
import { sendEmail } from './emailService.js'

/**
 * Subscribe a user email to be notified when a product (or specific size) is back in stock
 */
export const subscribeRestockNotification = async ({ productId, email, size = '' }) => {
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new Error('Please provide a valid email address')
  }

  const product = await Product.findById(productId).lean()
  if (!product) {
    throw new Error('Product not found')
  }

  const normalizedEmail = email.toLowerCase().trim()
  const normalizedSize = (size || '').trim().toUpperCase()

  // Check if subscription already exists
  let subscription = await RestockSubscription.findOne({
    product: productId,
    email: normalizedEmail,
    size: normalizedSize,
    status: 'pending'
  })

  if (!subscription) {
    subscription = await RestockSubscription.create({
      product: productId,
      productName: product.name || 'SeeMee Product',
      email: normalizedEmail,
      size: normalizedSize,
      status: 'pending'
    })
  }

  return {
    success: true,
    message: `You're all set! We will email you at ${normalizedEmail} as soon as this item is back in stock.`,
    subscription
  }
}

/**
 * Check and notify subscribers when a product (or specific size) is restocked from 0 to >0
 */
export const notifyRestockedSubscribers = async (productId, updatedProduct) => {
  try {
    if (!productId) return

    const product = updatedProduct || await Product.findById(productId).lean()
    if (!product) return

    // Find all pending subscriptions for this product
    const pendingSubs = await RestockSubscription.find({
      product: productId,
      status: 'pending'
    })

    if (!pendingSubs || pendingSubs.length === 0) return

    console.log(`\n🔔 [RESTOCK CHECK] Product "${product.name}" (${productId}) updated. Found ${pendingSubs.length} pending subscription(s).`)

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://seemee.in'
    const productUrl = `${clientUrl}/product/${product._id}`
    const productImage = (product.images && product.images[0]) || product.image || ''
    const productPrice = product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : ''

    for (const sub of pendingSubs) {
      const hasSizeStockList = product.sizeStock && Array.isArray(product.sizeStock) && product.sizeStock.length > 0

      if (sub.size && hasSizeStockList) {
        const sizeItem = product.sizeStock.find(s => String(s.size).trim().toUpperCase() === String(sub.size).trim().toUpperCase())
        const sizeQty = sizeItem ? Number(sizeItem.quantity || sizeItem.stock || 0) : 0
        if (sizeQty <= 0) {
          console.log(`ℹ️ [RESTOCK SKIP] Size ${sub.size} for ${sub.email} is still out of stock (Qty: ${sizeQty}).`)
          continue
        }
      } else {
        const totalStock = Number(product.stock || 0)
        if (totalStock <= 0) {
          console.log(`ℹ️ [RESTOCK SKIP] Overall product stock for ${sub.email} is still 0.`)
          continue
        }
      }

      const sizeTag = sub.size ? ` (Size: ${sub.size})` : ''
      const emailHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #fefdfb; color: #1c1917; border: 1px solid #e7e5e4; border-radius: 12px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f0eee9;">
            <h1 style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 2px; color: #854d0e; margin: 0;">SEEMEE</h1>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #a8a29e; margin-top: 4px;">HAUTE COUTURE</p>
          </div>

          <div style="padding: 24px 0; text-align: center;">
            <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">BACK IN STOCK</span>
            
            <h2 style="font-family: Georgia, serif; font-size: 22px; margin: 0 0 10px 0; color: #1c1917;">Good News! Your Favorite Item is Available Again</h2>
            <p style="font-size: 14px; color: #57534e; margin: 0 0 24px 0; line-height: 1.5;">
              The item you requested notifications for, <strong>${product.name}${sizeTag}</strong>, has just been restocked!
            </p>

            ${productImage ? `
              <div style="margin: 20px 0;">
                <img src="${productImage}" alt="${product.name}" style="max-width: 260px; max-height: 320px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 15px rgba(0,0,0,0.08);" />
              </div>
            ` : ''}

            <h3 style="font-size: 18px; margin: 12px 0 4px 0; color: #1c1917;">${product.name}</h3>
            ${productPrice ? `<p style="font-size: 16px; font-weight: 700; color: #854d0e; margin: 0 0 24px 0;">${productPrice}</p>` : ''}

            <div style="margin-top: 24px;">
              <a href="${productUrl}" style="display: inline-block; background-color: #1c1917; color: #d4af37; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 32px; border-radius: 30px; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                SHOP NOW
              </a>
            </div>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f0eee9; font-size: 11px; color: #a8a29e;">
            <p style="margin: 0 0 4px 0;">You received this email because you requested a restock notification on SeeMee.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SeeMee Luxury Apparel. All rights reserved.</p>
          </div>
        </div>
      `

      try {
        console.log(`📧 [SENDING RESTOCK EMAIL] Sending restock email to ${sub.email} for ${product.name}${sizeTag}...`)
        await sendEmail({
          to: sub.email,
          subject: `Good News! ${product.name}${sizeTag} is Back in Stock | SeeMee`,
          html: emailHtml
        })

        // Mark as notified
        sub.status = 'notified'
        sub.notifiedAt = new Date()
        await sub.save()
        console.log(`✅ [RESTOCK EMAIL SENT] Successfully notified ${sub.email} for ${product.name}${sizeTag}.\n`)
      } catch (err) {
        console.error(`❌ [RESTOCK EMAIL ERROR] Failed to send email to ${sub.email}:`, err.message)
      }
    }
  } catch (error) {
    console.error('Error in notifyRestockedSubscribers:', error)
  }
}
