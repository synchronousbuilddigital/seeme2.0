export const getProductPricing = (product = {}) => {
  const currentPrice = Number(product.salePrice ?? product.price ?? 0)
  const originalPrice = Number(product.mrp ?? product.originalPrice ?? product.discountPrice ?? 0)
  const explicitDiscount = Number(product.discountPercent ?? product.discount ?? 0)

  const computedDiscount = originalPrice > currentPrice && currentPrice > 0
    ? ((originalPrice - currentPrice) / originalPrice) * 100
    : 0

  const discountPercent = Math.max(0, Math.min(100, Math.round(computedDiscount || explicitDiscount || 0)))

  return {
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : 0,
    originalPrice: Number.isFinite(originalPrice) ? originalPrice : 0,
    discountPercent
  }
}

export const getProductDiscountPercent = (product) => getProductPricing(product).discountPercent