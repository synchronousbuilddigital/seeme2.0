/**
 * Centralized Ad2Ship Status Registry and Mapping Helpers
 */

export const AD2SHIP_STATUSES = {
  PENDING: 'pending',
  SHIPPED: 'shipped',
  MANIFESTED: 'manifested',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  UNDELIVERED: 'undelivered',
  RTO_INITIATED: 'rto_initiated',
  RTO_IN_TRANSIT: 'rto_in_transit',
  RTO_DELIVERED: 'rto_delivered',
  CANCELLED: 'cancelled'
}

/**
 * Maps Ad2Ship status codes to internal Seemee Order main statuses
 * Seemee main statuses: 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
 */
export const mapAd2ShipStatusToOrder = (ad2shipStatus) => {
  if (!ad2shipStatus) return 'pending'

  const normalized = String(ad2shipStatus).toLowerCase().trim()

  switch (normalized) {
    case AD2SHIP_STATUSES.PENDING:
      return 'pending'
    case AD2SHIP_STATUSES.MANIFESTED:
    case AD2SHIP_STATUSES.PICKUP_SCHEDULED:
      return 'confirmed'
    case AD2SHIP_STATUSES.PICKED_UP:
      return 'processing'
    case AD2SHIP_STATUSES.SHIPPED:
    case AD2SHIP_STATUSES.IN_TRANSIT:
    case AD2SHIP_STATUSES.OUT_FOR_DELIVERY:
      return 'shipped'
    case AD2SHIP_STATUSES.DELIVERED:
      return 'delivered'
    case AD2SHIP_STATUSES.CANCELLED:
      return 'cancelled'
    case AD2SHIP_STATUSES.UNDELIVERED:
    case AD2SHIP_STATUSES.RTO_INITIATED:
    case AD2SHIP_STATUSES.RTO_IN_TRANSIT:
    case AD2SHIP_STATUSES.RTO_DELIVERED:
      return 'processing'
    default:
      return 'processing'
  }
}
