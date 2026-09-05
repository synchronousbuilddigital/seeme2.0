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
  if (Array.isArray(val)) {
    const cleaned = val.map(v => (v || '').toLowerCase().trim()).filter(Boolean)
    if (cleaned.length > 0) return cleaned
  }
  if (typeof val === 'string' && val.trim()) {
    return [val.toLowerCase().trim()]
  }
  return []
}

export const belongsToAudience = (product, audience) => {
  if (!product || !audience) return true
  const target = audience.toLowerCase().trim()
  if (target === 'all') return true

  const genderArr = getAudienceArray(product.gender)
  const targetAudArr = getAudienceArray(product.targetAudience)
  const forTargetArr = getAudienceArray(product.forTarget)
  const targetAudiencesArr = getAudienceArray(product.targetAudiences)
  const allAuds = [...genderArr, ...targetAudArr, ...forTargetArr, ...targetAudiencesArr]

  const specificMenTags = ['men', 'male', 'gents', 'mens', 'him', 'man']
  const specificWomenTags = ['women', 'female', 'ladies', 'womens', 'her', 'woman']
  const specificKidsTags = ['kids', 'children', 'child', 'boys', 'girls', 'kid']
  const unisexTags = ['all', 'unisex', 'both', 'everyone']

  const hasExplicitMen = allAuds.some(a => specificMenTags.includes(a))
  const hasExplicitWomen = allAuds.some(a => specificWomenTags.includes(a))
  const hasExplicitKids = allAuds.some(a => specificKidsTags.includes(a))
  const hasExplicitAll = allAuds.some(a => unisexTags.includes(a))

  // 1. Explicit Admin Panel settings take absolute priority
  // Product explicitly marked for Women only (and NOT Men)
  if (hasExplicitWomen && !hasExplicitMen) {
    if (target === 'women') return true
    return false
  }

  // Product explicitly marked for Men only (and NOT Women)
  if (hasExplicitMen && !hasExplicitWomen) {
    if (target === 'men') return true
    return false
  }

  // Product explicitly tagged for both Women AND Men, or tagged 'all' / 'unisex'
  if ((hasExplicitWomen && hasExplicitMen) || (hasExplicitAll && !hasExplicitWomen && !hasExplicitMen)) {
    return target === 'women' || target === 'men' || target === 'all' || target === 'kids'
  }

  // Explicit Kids tag check
  if (hasExplicitKids) {
    if (target === 'kids') return true
    if (target === 'all') return true
    return false
  }

  // 2. Keyword fallback for products without explicit tags set in Admin
  const pCat = String(product.category || '').toLowerCase().trim()
  const pName = String(product.name || '').toLowerCase().trim()
  const pSub = String(product.subcategory || '').toLowerCase().trim()
  const pDesc = String(product.description || '').toLowerCase().trim()
  const pTags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase().trim() : ''
  const fullText = `${pCat} ${pName} ${pSub} ${pDesc} ${pTags}`

  const womenKeywords = [
    'kurti', 'kurtis', 'sharara', 'saree', 'sari', 'lehenga', 'anarkali', 
    'kaftan', 'gown', 'dupatta', 'suit', 'palazzo', 'women', 'female', 
    'girl', 'ladies', 'draped saree', 'choli', 'blouse', 'top', 'dress', 
    'tunic', 'skirt', 'women co-ord', 'salwar'
  ]
  
  const menKeywords = [
    'sherwani', 'bandhgala', 'nehru jacket', 'waistcoat', 'pathani', 
    'men kurta', 'kurta pyjama', 'kurta pajama', 'men', 'male', 
    'boy', 'gents', 'mens', 'shirt', 'shirts', 'trouser', 'trousers', 
    'suit for men', 't-shirt', 'polo', 'jacket for men', 'pyjama'
  ]

  const isWomenCategory = womenKeywords.some(kw => fullText.includes(kw))
  const isMenCategory = menKeywords.some(kw => fullText.includes(kw))

  if (target === 'men') {
    if (isWomenCategory && !isMenCategory) return false
    if (isMenCategory) return true
    return false
  }

  if (target === 'women') {
    if (isMenCategory && !isWomenCategory) return false
    if (isWomenCategory) return true
    return true
  }

  return true
}

export const isCategoryForAudience = (category, audience = 'all', activeProducts = []) => {
  if (!category) return false
  const target = (audience || 'all').toLowerCase().trim()
  if (target === 'all') return true

  const auds = getAudienceArray(category.targetAudience || category.targetAudiences)

  // 1. Explicitly tagged for target audience in Admin Panel
  if (auds.includes(target)) {
    return true
  }

  // 2. Explicitly tagged for the other gender only (e.g. 'women' when checking 'men')
  const otherGender = target === 'men' ? 'women' : 'men'
  if (auds.includes(otherGender) && !auds.includes(target)) {
    return false
  }

  // 3. Fallback for 'all' tagged categories: check if active products exist for this audience
  const catSlug = (category.slug || category.title || '').toLowerCase().trim()
  if (Array.isArray(activeProducts) && activeProducts.length > 0 && catSlug) {
    return activeProducts.some(p => belongsToAudience(p, target) && isProductInCategory(p, catSlug))
  }

  // 4. Default fallback for 'all' tagged categories
  return auds.includes('all') || auds.length === 0
}

