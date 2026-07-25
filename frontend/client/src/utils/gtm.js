/**
 * Utility for pushing events to Google Tag Manager (GTM) dataLayer.
 */

/**
 * Pushes a custom event or payload to the window.dataLayer array.
 * @param {Object} eventData - The payload to send to GTM.
 */
export const pushToDataLayer = (eventData) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);
  }
};

/**
 * Track a page view event in GTM.
 * @param {string} pagePath - The URL path of the page viewed.
 * @param {string} pageTitle - The title of the page.
 */
export const trackPageView = (pagePath, pageTitle) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: pagePath || window.location.pathname,
    page_title: pageTitle || document.title,
  });
};

/**
 * Track an eCommerce event (e.g. add_to_cart, purchase, view_item).
 * @param {string} eventName - GA4/GTM standard event name (e.g., 'add_to_cart', 'purchase', 'view_item').
 * @param {Object} ecommerceData - GA4 eCommerce data structure.
 */
export const trackEcommerceEvent = (eventName, ecommerceData) => {
  pushToDataLayer({
    event: eventName,
    ecommerce: ecommerceData,
  });
};

export default {
  pushToDataLayer,
  trackPageView,
  trackEcommerceEvent,
};
