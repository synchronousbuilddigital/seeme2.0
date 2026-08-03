/**
 * ============================================================
 * See Mee — GTM / GA4 E-commerce DataLayer Implementation
 * Container: GTM-M8JDGXBG
 * ============================================================
 */

// ---------- Core helpers ----------

/** Safe push — works even if GTM loads late */
const pushToDataLayer = (payload) => {
  window.dataLayer = window.dataLayer || [];
  // IMPORTANT: clear previous ecommerce object so old items
  // don't leak into the next event (official Google recommendation)
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push(payload);
};

/**
 * Maps YOUR product object -> GA4 item schema.
 * Adjust the left side (product.xxx) to match your actual
 * product object keys from your API / state.
 */
export const mapProductToItem = (product, options = {}) => ({
  item_id: String(product.id || product._id || product.sku || ''),
  item_name: product.name || product.title || '',
  item_brand: "See Mee",
  item_category: product.category || "",            // e.g. "Anarkali Suits"
  item_category2: product.subCategory || product.subcategory || "", // e.g. "Bridal"
  item_variant: options.variant || product.selectedSize || product.size || product.color || "",
  price: Number(product.salePrice ?? product.price ?? 0),
  discount: product.mrp
    ? Number((product.mrp - (product.salePrice ?? product.price ?? 0)).toFixed(2))
    : 0,
  quantity: options.quantity || product.quantity || 1,
  item_list_name: options.listName || "",            // e.g. "Homepage Featured"
  item_list_id: options.listId || "",
  index: options.index ?? undefined,                 // position in list (0-based)
});

const CURRENCY = "INR";

/** Cart total helper */
const cartValue = (items) =>
  Number(
    (items || [])
      .reduce((sum, p) => sum + Number(p.salePrice ?? p.price ?? 0) * (p.quantity || 1), 0)
      .toFixed(2)
  );

// ============================================================
// 1. view_item_list — collection / category / listing pages
// ============================================================
export const trackViewItemList = (products = [], listName = "", listId = "") => {
  if (!Array.isArray(products) || !products.length) return;
  pushToDataLayer({
    event: "view_item_list",
    ecommerce: {
      item_list_name: listName,          // e.g. "Anarkali Suits"
      item_list_id: listId,              // e.g. "anarkali_suits"
      items: products.map((p, i) =>
        mapProductToItem(p, { listName, listId, index: i })
      ),
    },
  });
};

// ============================================================
// 2. select_item — user clicks a product card in a list
// ============================================================
export const trackSelectItem = (product, listName = "", listId = "", index = 0) => {
  if (!product) return;
  pushToDataLayer({
    event: "select_item",
    ecommerce: {
      item_list_name: listName,
      item_list_id: listId,
      items: [mapProductToItem(product, { listName, listId, index })],
    },
  });
};

// ============================================================
// 3. view_item — product detail page (PDP) load
// ============================================================
export const trackViewItem = (product) => {
  if (!product) return;
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      currency: CURRENCY,
      value: Number(product.salePrice ?? product.price ?? 0),
      items: [mapProductToItem(product)],
    },
  });
};

// ============================================================
// 4. add_to_cart
// ============================================================
export const trackAddToCart = (product, quantity = 1, variant = "") => {
  if (!product) return;
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: CURRENCY,
      value: Number((Number(product.salePrice ?? product.price ?? 0) * quantity).toFixed(2)),
      items: [mapProductToItem(product, { quantity, variant })],
    },
  });
};

// ============================================================
// 5. remove_from_cart
// ============================================================
export const trackRemoveFromCart = (product, quantity = 1) => {
  if (!product) return;
  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      currency: CURRENCY,
      value: Number((Number(product.salePrice ?? product.price ?? 0) * quantity).toFixed(2)),
      items: [mapProductToItem(product, { quantity })],
    },
  });
};

// ============================================================
// 6. view_cart — cart page / cart drawer open
// ============================================================
export const trackViewCart = (cartItems = []) => {
  pushToDataLayer({
    event: "view_cart",
    ecommerce: {
      currency: CURRENCY,
      value: cartValue(cartItems),
      items: (cartItems || []).map((p) => mapProductToItem(p)),
    },
  });
};

// ============================================================
// 7. add_to_wishlist (optional but useful for remarketing)
// ============================================================
export const trackAddToWishlist = (product) => {
  if (!product) return;
  pushToDataLayer({
    event: "add_to_wishlist",
    ecommerce: {
      currency: CURRENCY,
      value: Number(product.salePrice ?? product.price ?? 0),
      items: [mapProductToItem(product)],
    },
  });
};

// ============================================================
// 8. begin_checkout — checkout button clicked
// ============================================================
export const trackBeginCheckout = (cartItems = [], coupon = "") => {
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: CURRENCY,
      value: cartValue(cartItems),
      coupon,
      items: (cartItems || []).map((p) => mapProductToItem(p)),
    },
  });
};

// ============================================================
// 9. add_shipping_info — shipping step completed
// ============================================================
export const trackAddShippingInfo = (cartItems = [], shippingTier = "Standard", coupon = "") => {
  pushToDataLayer({
    event: "add_shipping_info",
    ecommerce: {
      currency: CURRENCY,
      value: cartValue(cartItems),
      coupon,
      shipping_tier: shippingTier,       // e.g. "Standard", "Express"
      items: (cartItems || []).map((p) => mapProductToItem(p)),
    },
  });
};

// ============================================================
// 10. add_payment_info — payment method selected
// ============================================================
export const trackAddPaymentInfo = (cartItems = [], paymentType = "", coupon = "") => {
  pushToDataLayer({
    event: "add_payment_info",
    ecommerce: {
      currency: CURRENCY,
      value: cartValue(cartItems),
      coupon,
      payment_type: paymentType,         // e.g. "UPI", "Card", "COD", "Razorpay"
      items: (cartItems || []).map((p) => mapProductToItem(p)),
    },
  });
};

// ============================================================
// 11. purchase — order confirmation / thank-you page
// ============================================================
export const trackPurchase = (order) => {
  if (!order || !order.orderId) return;
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: String(order.orderId),   // REQUIRED — must be unique
      currency: CURRENCY,
      value: Number(order.total || 0),         // grand total incl. tax & shipping
      tax: Number(order.tax || 0),
      shipping: Number(order.shippingCost || 0),
      coupon: order.coupon || "",
      items: (order.items || []).map((p) => mapProductToItem(p)),
    },
  });
};

// ============================================================
// 12. refund (optional — call from admin/webhook-triggered page)
// ============================================================
export const trackRefund = (order) => {
  if (!order || !order.orderId) return;
  pushToDataLayer({
    event: "refund",
    ecommerce: {
      transaction_id: String(order.orderId),
      currency: CURRENCY,
      value: Number(order.refundAmount || 0),
      items: (order.items || []).map((p) => mapProductToItem(p)),
    },
  });
};

// ============================================================
// 13. Coupon Events — coupon_apply, coupon_removed, coupon_invalid, coupon_expired
// ============================================================
export const trackCouponApply = ({ coupon_code, discount = 0, cart_value = 0 }) => {
  pushToDataLayer({
    event: "coupon_apply",
    coupon_code: String(coupon_code),
    discount: Number(discount),
    cart_value: Number(cart_value)
  });
};

export const trackCouponRemoved = ({ coupon_code }) => {
  pushToDataLayer({
    event: "coupon_removed",
    coupon_code: String(coupon_code)
  });
};

export const trackCouponInvalid = ({ coupon_code, reason = "" }) => {
  pushToDataLayer({
    event: "coupon_invalid",
    coupon_code: String(coupon_code),
    reason: String(reason)
  });
};

export const trackCouponExpired = ({ coupon_code }) => {
  pushToDataLayer({
    event: "coupon_expired",
    coupon_code: String(coupon_code)
  });
};
