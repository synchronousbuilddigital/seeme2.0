/**
 * Notification formatting utilities for SEEMEE Admin Panel
 * Eliminates duplicate emojis, duplicate order IDs, and duplicate monetary amounts.
 */

/**
 * Strips leading emojis and symbols from notification title
 * since the UI card/item already renders a dedicated type icon badge.
 */
export const cleanNotificationTitle = (title) => {
  if (!title) return ''
  // Strip leading emojis, variation selectors, zero-width joiners, and surrounding whitespace
  const cleaned = title.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s\-_–—:]+/u, '').trim()
  return cleaned || title
}

/**
 * Formats notification message cleanly without repeating the Order ID or Amount
 * which are already displayed as badge pills in the notification card/item footer.
 */
export const cleanNotificationMessage = (notif) => {
  if (!notif || !notif.message) return ''
  let msg = notif.message.trim()

  const orderNum = (notif.orderNumber || notif.order?.orderNumber || '').replace(/^#/, '')
  const totalAmount = notif.totalAmount ?? notif.order?.totalAmount
  const customerName = notif.order?.customer?.name

  // Cancellation format: "Order #SM... placed by AMAN RAJ has been cancelled."
  const cancelMatch = msg.match(/(?:Order\s+#?[A-Za-z0-9_-]+\s+)?placed\s+by\s+(.*?)\s+has\s+been\s+cancelled/i)
  if (cancelMatch) {
    return `Order placed by ${cancelMatch[1].trim()} has been cancelled.`
  }
  if (/cancelled/i.test(msg)) {
    return customerName ? `Order placed by ${customerName} has been cancelled.` : 'Order has been cancelled.'
  }

  // New order format: "Order #SM... has been placed for ₹598."
  if (/has\s+been\s+placed/i.test(msg) || notif.type === 'NEW_ORDER') {
    const placedMatch = msg.match(/placed\s+by\s+([^.]+)/i)
    if (placedMatch) {
      return `Order placed by ${placedMatch[1].trim()}.`
    }
    if (customerName) {
      return `Order placed by ${customerName}.`
    }
    return 'New customer order has been placed.'
  }

  // Fallback: strip orderNumber and totalAmount if they occur in msg to prevent double display
  if (orderNum) {
    msg = msg.replace(new RegExp('(?:Order\\s*)?#' + orderNum + '\\s*', 'gi'), '')
  }
  if (totalAmount !== undefined && totalAmount !== null) {
    const formatted = Number(totalAmount).toLocaleString('en-IN')
    msg = msg.replace(new RegExp('\\s*(?:for\\s*)?(?:₹|Rs\\.?\\s*)(' + formatted + '|' + totalAmount + ')(\\.)?', 'gi'), '$2')
  }

  msg = msg.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').trim()
  return msg || notif.message
}

/**
 * Extracts normalized order number (without leading '#' so template can reliably format)
 */
export const getNotificationOrderNumber = (notif) => {
  const num = notif?.orderNumber || notif?.order?.orderNumber
  if (!num) return null
  return String(num).replace(/^#/, '')
}

/**
 * Extracts and formats total amount with Indian currency numbering
 */
export const getNotificationAmount = (notif) => {
  const amt = notif?.totalAmount ?? notif?.order?.totalAmount
  if (amt === undefined || amt === null || isNaN(Number(amt))) return null
  return Number(amt).toLocaleString('en-IN')
}
