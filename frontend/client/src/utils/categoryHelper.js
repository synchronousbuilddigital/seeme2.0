/**
 * Purely dynamic category matching utility.
 * Matches product.category with targetCategorySlug 100% dynamically
 * based on Admin Panel categories without any hardcoded category names.
 */

export const slugifyCategory = (str) => {
  if (!str) return ''
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(sets?|suits?|edition|collection)$/g, '')
}

export const isProductInCategory = (product, targetCategorySlug) => {
  if (!targetCategorySlug || targetCategorySlug === 'all') return true
  if (!product || !product.category) return false

  const targetRaw = String(targetCategorySlug).toLowerCase().trim()
  const pCatRaw = String(product.category).toLowerCase().trim()

  // 1. Direct exact match (case-insensitive)
  if (pCatRaw === targetRaw) return true

  // 2. Pure dynamic slugified match (removes punctuation, spaces, and generic suffixes)
  const targetSlug = slugifyCategory(targetRaw)
  const pCatSlug = slugifyCategory(pCatRaw)

  if (targetSlug && pCatSlug && targetSlug === pCatSlug) {
    return true
  }

  // 3. Substring matching for multi-word dynamic categories
  if (targetSlug.length >= 3 && pCatSlug.length >= 3) {
    if (pCatSlug.includes(targetSlug) || targetSlug.includes(pCatSlug)) {
      return true
    }
  }

  return false
}

export const getCategoryProducts = (allProducts, categorySlug) => {
  if (!Array.isArray(allProducts)) return []
  const active = allProducts.filter(p => p.isActive !== false)
  if (!categorySlug || categorySlug === 'all') return active

  return active.filter(p => isProductInCategory(p, categorySlug))
}

export const getAudienceArray = (val) => {
  if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase().trim())
  if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
  return ['all']
}

export const belongsToAudience = (product, audience) => {
  if (!product || !audience || audience === 'all') return true
  const target = audience.toLowerCase().trim()
  const audList = [
    ...getAudienceArray(product.targetAudience),
    ...getAudienceArray(product.gender)
  ]
  return audList.includes(target) || audList.includes('all')
}
