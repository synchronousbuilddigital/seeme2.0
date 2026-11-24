/**
 * Helper utility for Product Color & Size Variant stock operations.
 * Handles validation, atomic deduction, rollback, and restock across both
 * color-specific sizeStock (colorImages[].sizeStock) and general product sizeStock.
 */

/**
 * Check if the requested quantity of a product variant is available in stock.
 * Returns { inStock: boolean, availableQty: number, errorMsg: string | null }
 */
export const checkVariantAvailability = (product, { size, color, quantity = 1 } = {}) => {
  if (!product) {
    return { inStock: false, availableQty: 0, errorMsg: 'Product not found' }
  }

  const requestedQty = Math.max(1, Number(quantity) || 1)
  const normColor = color ? String(color).trim().toLowerCase() : ''
  const normSize = size ? String(size).trim().toUpperCase() : ''

  // 1. Check if product has color-specific sizeStock
  if (normColor && Array.isArray(product.colorImages) && product.colorImages.length > 0) {
    const colorEntry = product.colorImages.find(
      ci => ci && ci.color && ci.color.trim().toLowerCase() === normColor
    )

    if (colorEntry && Array.isArray(colorEntry.sizeStock) && colorEntry.sizeStock.length > 0) {
      if (normSize) {
        const sizeItem = colorEntry.sizeStock.find(
          s => s && s.size && s.size.trim().toUpperCase() === normSize
        )
        const available = sizeItem ? Math.max(0, Number(sizeItem.quantity) || 0) : 0
        if (available < requestedQty) {
          return {
            inStock: false,
            availableQty: available,
            errorMsg: `Insufficient stock for ${product.name} (${color} - Size ${size}). Only ${available} available.`
          }
        }
        return { inStock: true, availableQty: available, errorMsg: null }
      } else {
        // If no specific size requested, check total in this color
        const colorTotal = colorEntry.sizeStock.reduce(
          (sum, s) => sum + Math.max(0, Number(s.quantity) || 0),
          0
        )
        if (colorTotal < requestedQty) {
          return {
            inStock: false,
            availableQty: colorTotal,
            errorMsg: `Insufficient stock for ${product.name} (${color}). Only ${colorTotal} available.`
          }
        }
        return { inStock: true, availableQty: colorTotal, errorMsg: null }
      }
    }
  }

  // 2. Check general product.sizeStock
  if (normSize && Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
    const sizeItem = product.sizeStock.find(
      s => s && s.size && s.size.trim().toUpperCase() === normSize
    )
    const available = sizeItem ? Math.max(0, Number(sizeItem.quantity) || 0) : 0
    if (available < requestedQty) {
      return {
        inStock: false,
        availableQty: available,
        errorMsg: `Insufficient stock for size ${size} of ${product.name}. Only ${available} available.`
      }
    }
    return { inStock: true, availableQty: available, errorMsg: null }
  }

  // 3. Fallback to overall product.stock
  const totalAvailable = Math.max(0, Number(product.stock) || 0)
  if (totalAvailable < requestedQty) {
    return {
      inStock: false,
      availableQty: totalAvailable,
      errorMsg: `Insufficient stock for ${product.name}. Only ${totalAvailable} available.`
    }
  }

  return { inStock: true, availableQty: totalAvailable, errorMsg: null }
}

/**
 * Deduct stock for a single variant item from product.
 * Mutates product in-memory; caller must await product.save().
 */
export const deductVariantStock = (product, { size, color, quantity = 1 } = {}) => {
  if (!product) return
  const deductQty = Math.max(1, Number(quantity) || 1)
  const normColor = color ? String(color).trim().toLowerCase() : ''
  const normSize = size ? String(size).trim().toUpperCase() : ''

  let deductedFromColor = false

  // 1. Deduct from color-specific sizeStock if exists
  if (normColor && Array.isArray(product.colorImages) && product.colorImages.length > 0) {
    const colorEntry = product.colorImages.find(
      ci => ci && ci.color && ci.color.trim().toLowerCase() === normColor
    )
    if (colorEntry && Array.isArray(colorEntry.sizeStock) && colorEntry.sizeStock.length > 0) {
      if (normSize) {
        const sizeItem = colorEntry.sizeStock.find(
          s => s && s.size && s.size.trim().toUpperCase() === normSize
        )
        if (sizeItem) {
          sizeItem.quantity = Math.max(0, (Number(sizeItem.quantity) || 0) - deductQty)
          deductedFromColor = true
        }
      }
    }
  }

  // 2. Also deduct from general product.sizeStock if size exists there
  if (normSize && Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
    const sizeItem = product.sizeStock.find(
      s => s && s.size && s.size.trim().toUpperCase() === normSize
    )
    if (sizeItem) {
      sizeItem.quantity = Math.max(0, (Number(sizeItem.quantity) || 0) - deductQty)
    }
  }

  // 3. Recalculate total product.stock
  recalculateTotalStock(product)
}

/**
 * Restore stock for a single variant item back to product.
 * Mutates product in-memory; caller must await product.save().
 */
export const restoreVariantStock = (product, { size, color, quantity = 1 } = {}) => {
  if (!product) return
  const restoreQty = Math.max(1, Number(quantity) || 1)
  const normColor = color ? String(color).trim().toLowerCase() : ''
  const normSize = size ? String(size).trim().toUpperCase() : ''

  // 1. Restore to color-specific sizeStock if exists
  if (normColor && Array.isArray(product.colorImages) && product.colorImages.length > 0) {
    const colorEntry = product.colorImages.find(
      ci => ci && ci.color && ci.color.trim().toLowerCase() === normColor
    )
    if (colorEntry && Array.isArray(colorEntry.sizeStock) && colorEntry.sizeStock.length > 0) {
      if (normSize) {
        const sizeItem = colorEntry.sizeStock.find(
          s => s && s.size && s.size.trim().toUpperCase() === normSize
        )
        if (sizeItem) {
          sizeItem.quantity = (Number(sizeItem.quantity) || 0) + restoreQty
        } else {
          colorEntry.sizeStock.push({ size: normSize, quantity: restoreQty })
        }
      }
    }
  }

  // 2. Also restore to general product.sizeStock if present
  if (normSize && Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
    const sizeItem = product.sizeStock.find(
      s => s && s.size && s.size.trim().toUpperCase() === normSize
    )
    if (sizeItem) {
      sizeItem.quantity = (Number(sizeItem.quantity) || 0) + restoreQty
    } else {
      product.sizeStock.push({ size: normSize, quantity: restoreQty })
    }
  }

  // 3. Recalculate total product.stock
  recalculateTotalStock(product)
}

/**
 * Recalculate product.stock from either colorImages.sizeStock or product.sizeStock
 */
export const recalculateTotalStock = (product) => {
  if (!product) return

  let hasColorSizeStock = false
  let colorStockSum = 0

  if (Array.isArray(product.colorImages) && product.colorImages.length > 0) {
    for (const ci of product.colorImages) {
      if (Array.isArray(ci.sizeStock) && ci.sizeStock.length > 0) {
        hasColorSizeStock = true
        colorStockSum += ci.sizeStock.reduce(
          (sum, s) => sum + Math.max(0, Number(s.quantity) || 0),
          0
        )
      }
    }
  }

  if (hasColorSizeStock && colorStockSum > 0) {
    product.stock = colorStockSum
  } else if (Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
    product.stock = product.sizeStock.reduce(
      (sum, s) => sum + Math.max(0, Number(s.quantity) || 0),
      0
    )
  }
}
