/**
 * Helper utilities for product size sorting and stock availability.
 * Requirement: For every individual product, available sizes must appear FIRST in the size selector row,
 * followed by out-of-stock sizes.
 * Supports Color + Size Matrix inventory (colorImages[].sizeStock).
 */

export const isExcludedSize = (s) => {
  if (!s) return true
  const upper = String(s).trim().toUpperCase()
  return (
    upper === 'FREE SIZE' ||
    upper === 'FREESIZE' ||
    upper === 'FREE-SIZE' ||
    upper === 'CUSTOM' ||
    upper === 'CUSTOM SIZE' ||
    upper === 'CUSTOM-SIZE'
  )
}

/**
 * Get available stock quantity for a specific size of a product.
 * Takes optional selectedColor to look up Color + Size Matrix inventory.
 * Returns 0 if product is out of stock or size has 0 quantity.
 */
export const getSizeStockQty = (sz, prod, selectedColor = null) => {
  if (!prod || !sz) return 0
  if (prod.status === 'Out of Stock' || prod.status === 'archived' || prod.inStock === false) return 0

  const targetSizeUpper = String(sz).trim().toUpperCase()

  // 1. Check Color-specific sizeStock if selectedColor is provided
  if (selectedColor && Array.isArray(prod.colorImages) && prod.colorImages.length > 0) {
    const targetColLower = String(selectedColor).trim().toLowerCase()
    const colorEntry = prod.colorImages.find(
      ci => ci && ci.color && ci.color.trim().toLowerCase() === targetColLower
    )
    if (colorEntry && Array.isArray(colorEntry.sizeStock) && colorEntry.sizeStock.length > 0) {
      const foundInColor = colorEntry.sizeStock.find(
        s => s && String(s.size).trim().toUpperCase() === targetSizeUpper
      )
      if (foundInColor) {
        return Math.max(0, Number(foundInColor.quantity ?? foundInColor.stock ?? 0))
      }
      return 0
    }
  }

  // 2. Product-level sizeStock
  if (Array.isArray(prod.sizeStock) && prod.sizeStock.length > 0) {
    const found = prod.sizeStock.find(
      s => s && String(s.size).trim().toUpperCase() === targetSizeUpper
    )
    if (found) {
      return Math.max(0, Number(found.quantity ?? found.stock ?? 0))
    }
    // If product defines sizeStock but this size is not in sizeStock, stock is 0
    return 0
  }

  // Fallback to overall product.stock if sizeStock is not specified
  if (prod.stock !== undefined && prod.stock !== null) {
    return Math.max(0, Number(prod.stock))
  }

  // Default assumption if no stock fields given: in-stock (e.g. 10)
  return 10
}

export const isSizeInStock = (sz, prod, selectedColor = null) => {
  return getSizeStockQty(sz, prod, selectedColor) > 0
}

/**
 * Standard size order comparison helper.
 */
const DEFAULT_SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL']

const compareBySizeOrder = (a, b) => {
  const upperA = String(a).trim().toUpperCase()
  const upperB = String(b).trim().toUpperCase()
  const idxA = DEFAULT_SIZE_ORDER.indexOf(upperA)
  const idxB = DEFAULT_SIZE_ORDER.indexOf(upperB)

  if (idxA !== -1 && idxB !== -1) return idxA - idxB
  if (idxA !== -1) return -1
  if (idxB !== -1) return 1

  const numA = parseFloat(upperA)
  const numB = parseFloat(upperB)
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB

  return upperA.localeCompare(upperB)
}

/**
 * Returns an array of size strings where:
 * 1. Available (in-stock) sizes come FIRST (ordered by standard size hierarchy).
 * 2. Out-of-stock sizes come SECOND (ordered by standard size hierarchy).
 */
export const getSortedSizesForProduct = (prod, selectedColor = null) => {
  if (!prod) return []
  const sizeSet = new Set()

  // Color-specific sizes
  if (selectedColor && Array.isArray(prod.colorImages) && prod.colorImages.length > 0) {
    const targetColLower = String(selectedColor).trim().toLowerCase()
    const colorEntry = prod.colorImages.find(
      ci => ci && ci.color && ci.color.trim().toLowerCase() === targetColLower
    )
    if (colorEntry && Array.isArray(colorEntry.sizeStock) && colorEntry.sizeStock.length > 0) {
      colorEntry.sizeStock.forEach(s => {
        if (s?.size && !isExcludedSize(s.size)) {
          sizeSet.add(String(s.size).trim().toUpperCase())
        }
      })
    }
  }

  if (Array.isArray(prod.sizes) && prod.sizes.length > 0) {
    prod.sizes.forEach(s => {
      if (s && !isExcludedSize(s)) {
        sizeSet.add(String(s).trim().toUpperCase())
      }
    })
  }

  if (Array.isArray(prod.sizeStock) && prod.sizeStock.length > 0) {
    prod.sizeStock.forEach(s => {
      if (s?.size && !isExcludedSize(s.size)) {
        sizeSet.add(String(s.size).trim().toUpperCase())
      }
    })
  }

  // If no sizes specified at all on product, provide standard sizes
  if (sizeSet.size === 0) {
    ;['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].forEach(s => sizeSet.add(s))
  }

  const inStock = []
  const outOfStock = []

  Array.from(sizeSet).forEach(sz => {
    if (isSizeInStock(sz, prod, selectedColor)) {
      inStock.push(sz)
    } else {
      outOfStock.push(sz)
    }
  })

  inStock.sort(compareBySizeOrder)
  outOfStock.sort(compareBySizeOrder)

  // In-stock / available sizes first, then out of stock
  return [...inStock, ...outOfStock]
}

/**
 * Returns the best initial selected size:
 * 1. First available in-stock size.
 * 2. If all out of stock, first size in the sorted list.
 * 3. Fallback default size.
 */
export const getFirstAvailableSize = (prod, fallback = 'M', selectedColor = null) => {
  if (!prod) return fallback
  const sorted = getSortedSizesForProduct(prod, selectedColor)
  if (sorted.length === 0) return fallback
  const firstInStock = sorted.find(sz => isSizeInStock(sz, prod, selectedColor))
  return firstInStock || sorted[0] || fallback
}

/**
 * Checks whether an entire product has available stock.
 * Returns false if:
 * - Product is missing or inactive
 * - Product status is 'Out of Stock', 'archived', or 'draft'
 * - Product inStock property is explicitly false
 * - Product has sizeStock and total quantity across sizes is <= 0
 * - Product has stock field and value is <= 0
 */
export const isProductInStock = (product) => {
  if (!product) return false
  if (product.isActive === false) return false

  const statusLower = String(product.status || '').trim().toLowerCase()
  if (statusLower === 'out of stock' || statusLower === 'archived' || statusLower === 'draft') {
    return false
  }

  if (product.inStock === false) return false

  // Check colorImages sizeStock if defined
  if (Array.isArray(product.colorImages) && product.colorImages.length > 0) {
    const hasAnyColorSizeStock = product.colorImages.some(
      ci => Array.isArray(ci.sizeStock) && ci.sizeStock.length > 0
    )
    if (hasAnyColorSizeStock) {
      let grandTotal = 0
      product.colorImages.forEach(ci => {
        if (Array.isArray(ci.sizeStock)) {
          grandTotal += ci.sizeStock.reduce(
            (sum, s) => sum + Math.max(0, Number(s?.quantity ?? s?.stock ?? 0)),
            0
          )
        }
      })
      if (grandTotal > 0) return true
    }
  }

  // Check total quantity across sizes if sizeStock is defined
  if (Array.isArray(product.sizeStock) && product.sizeStock.length > 0) {
    const totalSizeStock = product.sizeStock.reduce(
      (sum, s) => sum + Math.max(0, Number(s?.quantity ?? s?.stock ?? 0)),
      0
    )
    if (totalSizeStock <= 0) return false
  } else if (product.stock !== undefined && product.stock !== null) {
    // If no sizeStock, check generic stock field
    if (Number(product.stock) <= 0) return false
  }

  return true
}

export const isProductOutOfStock = (product) => {
  return !isProductInStock(product)
}
