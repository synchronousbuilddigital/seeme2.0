import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getCategoryProducts, isCategoryForAudience } from '../utils/categoryHelper'
import './CategoriesPage.css'

// Curated pastel themes matching the exact mockup layout
const BENTO_THEMES = {
  tallPink: {
    bg: '#f8d5cf',
    innerBg: '#e8b7af',
    text: '#151816',
    subtext: '#5e4d4a',
    arrowBg: '#151917',
    arrowColor: '#ffffff',
    imagePosition: 'center 15%'
  }, // 1. Cord set (Tall, dusty rose)
  yellowHorizontal: {
    bg: '#fae497',
    innerBg: '#e3cb69',
    text: '#151816',
    subtext: '#594f26',
    arrowBg: '#151917',
    arrowColor: '#ffffff',
    imagePosition: 'center 18%'
  }, // 2. Printed suit set (Horizontal, butterscotch)
  blueHorizontal: {
    bg: '#c4e5ee',
    innerBg: '#9fc6d2',
    text: '#151816',
    subtext: '#3d4e55',
    arrowBg: '#151917',
    arrowColor: '#ffffff',
    imagePosition: 'center 20%'
  }, // 3. Nehru jacket / Shirt (Horizontal, sky blue)
  purpleCard: {
    bg: '#d8cff8',
    innerBg: '#b7abe0',
    text: '#151816',
    subtext: '#4c4569',
    arrowBg: '#151917',
    arrowColor: '#ffffff',
    imagePosition: 'center 22%'
  }, // 4. T shirt (Lavender purple)
  peachCard: {
    bg: '#f9c5a7',
    innerBg: '#de9f7b',
    text: '#151816',
    subtext: '#63493b',
    arrowBg: '#151917',
    arrowColor: '#ffffff',
    imagePosition: 'center 20%'
  }, // 5. Sherwani / Kurta set (Apricot peach)
  limeCard: {
    bg: '#deee96',
    innerBg: '#c7da72',
    text: '#141815',
    subtext: '#4b5548',
    arrowBg: '#151917',
    arrowColor: '#ffffff',
    imagePosition: 'center 20%'
  },
  mintCard: {
    bg: '#cbeada',
    innerBg: '#a8d8c0',
    text: '#141815',
    subtext: '#3a5446',
    arrowBg: '#151917',
    arrowColor: '#ffffff',
    imagePosition: 'center 20%'
  }
}

// Ordered strictly to match the mockup image:
// 1. Cord set (Tall Pink)
// 2. Printed suit set (Yellow Horizontal)
// 3. Nehru jacket / Shirt (Blue Horizontal)
// 4. T shirt (Purple)
// 5. Sherwani / Kurta set (Peach)
const PREFERRED_MOCKUP_SLUGS = [
  'cord-set',
  'printed-suit-set',
  'nehru-jacket',
  'shirt',
  't-shirt',
  'tshirt',
  'sherwani',
  'kurta-set'
]

const formatCategoryTitle = (str) => {
  if (!str) return ''
  const cleaned = String(str)
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

const formatStyleCount = (count) => {
  const num = Number(count) || 0
  const padded = num < 10 ? `0${num}` : `${num}`
  return `[${padded}] styles`
}

const ArrowButton = ({ label }) => (
  <div className="bento-arrow-circle" aria-label={label || 'View category'}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  </div>
)

const CategoriesPage = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [categoriesList, setCategoriesList] = useState([])
  const [activeProducts, setActiveProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Category Search & Audience State
  const [searchCategoryQuery, setSearchCategoryQuery] = useState('')
  const [activeAudience, setActiveAudience] = useState('all')

  useEffect(() => {
    loadAllCategories()
    window.scrollTo(0, 0)
  }, [])

  const normalizeAudience = (val) => {
    if (Array.isArray(val)) return val.map(v => (v || '').toLowerCase().trim())
    if (typeof val === 'string' && val.trim()) return [val.toLowerCase().trim()]
    return ['all']
  }

  const loadAllCategories = async () => {
    setLoading(true)
    try {
      const [prodData, settingsData] = await Promise.all([
        cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=10000`),
        cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true })
      ])

      const activeProds = prodData?.success && Array.isArray(prodData.data)
        ? prodData.data.filter(p => p.isActive !== false)
        : []

      let rawCategories = []
      if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides)) {
        rawCategories = settingsData.data.categorySlides.filter(Boolean)
      }

      // Merge distinct categories from active products
      const existingSlugs = new Set(
        rawCategories.map(c => (c?.slug || c?.title || '').toLowerCase().trim()).filter(Boolean)
      )

      activeProds.forEach(p => {
        if (!p || !p.category) return
        const pCatSlug = p.category.toLowerCase().trim()
        const normPCat = pCatSlug.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')

        const alreadyExists = Array.from(existingSlugs).some(s => {
          const normS = s.replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
          return s === pCatSlug || normS === normPCat
        })

        if (!alreadyExists) {
          rawCategories.push({
            title: p.category,
            slug: pCatSlug,
            targetAudience: ['all'],
            subtitle: 'Seemee Collection',
            description: `Handcrafted ${p.category} creations.`,
            image: (p.images?.[0] || p.image) || ''
          })
          existingSlugs.add(pCatSlug)
        }
      })

      // Sort with preference to match the mockup image order:
      // Cord set (1) -> Printed suit set (2) -> Shirt / Nehru jacket (3) -> T shirt (4) -> Sherwani / Kurta set (5)
      const sortedRaw = [...rawCategories].sort((a, b) => {
        const slugA = (a?.slug || a?.title || '').toLowerCase().trim()
        const slugB = (b?.slug || b?.title || '').toLowerCase().trim()
        const idxA = PREFERRED_MOCKUP_SLUGS.indexOf(slugA)
        const idxB = PREFERRED_MOCKUP_SLUGS.indexOf(slugB)

        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return (a?.order || 0) - (b?.order || 0)
      })

      const themeKeys = [
        'tallPink',
        'yellowHorizontal',
        'blueHorizontal',
        'purpleCard',
        'peachCard',
        'limeCard',
        'mintCard'
      ]

      const processedCategories = sortedRaw.map((cat, idx) => {
        const catTitle = cat?.title || cat?.name || ''
        const catSlug = cat?.slug || catTitle
        const matching = getCategoryProducts(activeProds, catSlug)
        const matchedProduct = matching[0]
        const theme = BENTO_THEMES[themeKeys[idx % themeKeys.length]]
        const resolvedImage = cat?.image || (matchedProduct?.images?.[0] || matchedProduct?.image) || '/images/categories_straight.jpg'

        return {
          ...cat,
          title: catTitle,
          displayTitle: formatCategoryTitle(catTitle),
          slug: catSlug,
          targetAudience: normalizeAudience(cat?.targetAudience),
          productCount: matching.length,
          features: cat?.features && cat.features.length > 0 ? cat.features : ['Luxury Tailoring', 'Pure Fabrics'],
          subtitle: cat?.subtitle || 'Seemee Collection',
          description: cat?.description || 'Artisanal heritage creations blending traditional weaves with contemporary grace.',
          image: resolvedImage,
          theme
        }
      })

      setCategoriesList(processedCategories)
      setActiveProducts(activeProds)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter Categories by Audience & Search Query
  const filteredCategories = useMemo(() => {
    let result = categoriesList.filter(cat => isCategoryForAudience(cat, activeAudience, activeProducts))

    if (searchCategoryQuery.trim()) {
      const q = searchCategoryQuery.toLowerCase().trim()
      result = result.filter(cat =>
        cat.title?.toLowerCase().includes(q) ||
        cat.displayTitle?.toLowerCase().includes(q) ||
        cat.subtitle?.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q) ||
        cat.slug?.toLowerCase().includes(q)
      )
    }
    return result
  }, [categoriesList, activeAudience, activeProducts, searchCategoryQuery])

  // Slots matching the 5-card Mockup layout
  const { col1Tall, col2Top, col2Bottom, col3Top, col3Bottom, extraItems } = useMemo(() => {
    const list = filteredCategories
    return {
      col1Tall: list[0] || null,
      col2Top: list[1] || null,
      col2Bottom: list[2] || null,
      col3Top: list[3] || null,
      col3Bottom: list[4] || null,
      extraItems: list.slice(5)
    }
  }, [filteredCategories])

  const handleCardClick = (slug) => {
    if (slug) {
      navigate(`/category/${slug}`)
    }
  }

  if (loading) {
    return (
      <div className="categories-page-loading">
        <div className="glowing-gold-spinner"></div>
        <p>Curating SEEMEE Categories...</p>
      </div>
    )
  }

  return (
    <div className="all-categories-page">
      <div className="mockup-categories-wrapper">
        {/* ============================================================== */}
        {/* SLIM TOP CONTROL BAR: Audience Pills + Search                   */}
        {/* ============================================================== */}
        <div className="mockup-top-controls">
          <div className="mockup-audience-pill-bar" role="tablist" aria-label="Target audience">
            {['all', 'men', 'women'].map((aud) => (
              <button
                key={aud}
                type="button"
                role="tab"
                aria-selected={activeAudience === aud}
                className={`mockup-filter-btn ${activeAudience === aud ? 'active' : ''}`}
                onClick={() => setActiveAudience(aud)}
              >
                {aud.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="mockup-search-pill-box">
            <svg
              className="mockup-search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search silhouettes & styles..."
              value={searchCategoryQuery}
              onChange={(e) => setSearchCategoryQuery(e.target.value)}
              aria-label="Search silhouettes and styles"
            />
            {searchCategoryQuery && (
              <button
                type="button"
                className="mockup-search-clear"
                onClick={() => setSearchCategoryQuery('')}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* EXACT 3-COLUMN BENTO GRID MATCHING THE MOCKUP IMAGE             */}
        {/* ============================================================== */}
        {filteredCategories.length > 0 ? (
          <div className="mockup-bento-grid">
            {/* ---------------- Column 1: Tall Card (Cord set) ------------ */}
            {col1Tall && (
              <div
                className="bento-tall-col"
                style={{
                  backgroundColor: col1Tall.theme.bg,
                  color: col1Tall.theme.text
                }}
                onClick={() => handleCardClick(col1Tall.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(col1Tall.slug)}
              >
                <div className="bento-card-header">
                  <div className="bento-card-title-group">
                    <h2 className="bento-card-title bento-title-tall" style={{ color: col1Tall.theme.text }}>
                      {col1Tall.displayTitle}
                    </h2>
                    <span className="bento-card-styles" style={{ color: col1Tall.theme.subtext }}>
                      {formatStyleCount(col1Tall.productCount)}
                    </span>
                  </div>
                  <ArrowButton label={`View ${col1Tall.displayTitle}`} />
                </div>

                <div
                  className="bento-inner-box bento-inner-tall"
                  style={{ backgroundColor: col1Tall.theme.innerBg }}
                >
                  <img
                    src={getImageUrl(col1Tall.image)}
                    alt={col1Tall.displayTitle}
                    className="bento-card-img"
                    style={{ objectPosition: col1Tall.theme?.imagePosition || 'center 15%' }}
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/images/categories_straight.jpg'
                    }}
                  />
                </div>
              </div>
            )}

            {/* --------- Column 2: 2 Stacked Horizontal Cards (Yellow & Blue) --------- */}
            {(col2Top || col2Bottom) && (
              <div className="bento-middle-col">
                {/* Horizontal Card 1: Printed suit set (Yellow) */}
                {col2Top && (
                  <div
                    className="bento-horizontal-card"
                    style={{
                      backgroundColor: col2Top.theme.bg,
                      color: col2Top.theme.text
                    }}
                    onClick={() => handleCardClick(col2Top.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick(col2Top.slug)}
                  >
                    <div className="bento-horizontal-left">
                      <div className="bento-card-title-group">
                        <h2 className="bento-card-title" style={{ color: col2Top.theme.text }}>
                          {col2Top.displayTitle}
                        </h2>
                        <span className="bento-card-styles" style={{ color: col2Top.theme.subtext }}>
                          {formatStyleCount(col2Top.productCount)}
                        </span>
                      </div>
                      <ArrowButton label={`View ${col2Top.displayTitle}`} />
                    </div>

                    <div
                      className="bento-inner-box bento-inner-horizontal"
                      style={{ backgroundColor: col2Top.theme.innerBg }}
                    >
                      <img
                        src={getImageUrl(col2Top.image)}
                        alt={col2Top.displayTitle}
                        className="bento-card-img"
                        style={{ objectPosition: col2Top.theme?.imagePosition || 'center 18%' }}
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/images/categories_straight.jpg'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Horizontal Card 2: Nehru jacket / Shirt (Blue) */}
                {col2Bottom && (
                  <div
                    className="bento-horizontal-card"
                    style={{
                      backgroundColor: col2Bottom.theme.bg,
                      color: col2Bottom.theme.text
                    }}
                    onClick={() => handleCardClick(col2Bottom.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick(col2Bottom.slug)}
                  >
                    <div className="bento-horizontal-left">
                      <div className="bento-card-title-group">
                        <h2 className="bento-card-title" style={{ color: col2Bottom.theme.text }}>
                          {col2Bottom.displayTitle}
                        </h2>
                        <span className="bento-card-styles" style={{ color: col2Bottom.theme.subtext }}>
                          {formatStyleCount(col2Bottom.productCount)}
                        </span>
                      </div>
                      <ArrowButton label={`View ${col2Bottom.displayTitle}`} />
                    </div>

                    <div
                      className="bento-inner-box bento-inner-horizontal"
                      style={{ backgroundColor: col2Bottom.theme.innerBg }}
                    >
                      <img
                        src={getImageUrl(col2Bottom.image)}
                        alt={col2Bottom.displayTitle}
                        className="bento-card-img"
                        style={{ objectPosition: col2Bottom.theme?.imagePosition || 'center 20%' }}
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/images/categories_straight.jpg'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --------- Column 3: 2 Stacked Cards (Purple & Peach: T shirt, Sherwani) --------- */}
            {(col3Top || col3Bottom) && (
              <div className="bento-right-col">
                {/* Compact Card 1: T shirt (Purple) */}
                {col3Top && (
                  <div
                    className="bento-compact-card"
                    style={{
                      backgroundColor: col3Top.theme.bg,
                      color: col3Top.theme.text
                    }}
                    onClick={() => handleCardClick(col3Top.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick(col3Top.slug)}
                  >
                    <div className="bento-card-header">
                      <div className="bento-card-title-group">
                        <h2 className="bento-card-title" style={{ color: col3Top.theme.text }}>
                          {col3Top.displayTitle}
                        </h2>
                        <span className="bento-card-styles" style={{ color: col3Top.theme.subtext }}>
                          {formatStyleCount(col3Top.productCount)}
                        </span>
                      </div>
                      <ArrowButton label={`View ${col3Top.displayTitle}`} />
                    </div>

                    <div
                      className="bento-inner-box bento-inner-compact"
                      style={{ backgroundColor: col3Top.theme.innerBg }}
                    >
                      <img
                        src={getImageUrl(col3Top.image)}
                        alt={col3Top.displayTitle}
                        className="bento-card-img"
                        style={{ objectPosition: col3Top.theme?.imagePosition || 'center 22%' }}
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/images/categories_straight.jpg'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Compact Card 2: Sherwani / Kurta set (Peach) */}
                {col3Bottom && (
                  <div
                    className="bento-compact-card"
                    style={{
                      backgroundColor: col3Bottom.theme.bg,
                      color: col3Bottom.theme.text
                    }}
                    onClick={() => handleCardClick(col3Bottom.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCardClick(col3Bottom.slug)}
                  >
                    <div className="bento-card-header">
                      <div className="bento-card-title-group">
                        <h2 className="bento-card-title" style={{ color: col3Bottom.theme.text }}>
                          {col3Bottom.displayTitle}
                        </h2>
                        <span className="bento-card-styles" style={{ color: col3Bottom.theme.subtext }}>
                          {formatStyleCount(col3Bottom.productCount)}
                        </span>
                      </div>
                      <ArrowButton label={`View ${col3Bottom.displayTitle}`} />
                    </div>

                    <div
                      className="bento-inner-box bento-inner-compact"
                      style={{ backgroundColor: col3Bottom.theme.innerBg }}
                    >
                      <img
                        src={getImageUrl(col3Bottom.image)}
                        alt={col3Bottom.displayTitle}
                        className="bento-card-img"
                        style={{ objectPosition: col3Bottom.theme?.imagePosition || 'center 20%' }}
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = '/images/categories_straight.jpg'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty Search State */
          <div className="mockup-empty-state">
            <h3>No categories found</h3>
            <p>We couldn&apos;t find any silhouettes matching &ldquo;{searchCategoryQuery}&rdquo;.</p>
            <button
              type="button"
              className="mockup-reset-search-btn"
              onClick={() => {
                setSearchCategoryQuery('')
                setActiveAudience('all')
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Extra categories if more than 5 exist */}
        {extraItems && extraItems.length > 0 && (
          <div className="mockup-extra-grid">
            {extraItems.map((cat) => (
              <div
                key={cat.slug}
                className="bento-compact-card"
                style={{
                  backgroundColor: cat.theme.bg,
                  color: cat.theme.text
                }}
                onClick={() => handleCardClick(cat.slug)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(cat.slug)}
              >
                <div className="bento-card-header">
                  <div className="bento-card-title-group">
                    <h2 className="bento-card-title" style={{ color: cat.theme.text }}>
                      {cat.displayTitle}
                    </h2>
                    <span className="bento-card-styles" style={{ color: cat.theme.subtext }}>
                      {formatStyleCount(cat.productCount)}
                    </span>
                  </div>
                  <ArrowButton label={`View ${cat.displayTitle}`} />
                </div>

                <div
                  className="bento-inner-box bento-inner-compact"
                  style={{ backgroundColor: cat.theme.innerBg }}
                >
                  <img
                    src={getImageUrl(cat.image)}
                    alt={cat.displayTitle}
                    className="bento-card-img"
                    style={{ objectPosition: cat.theme?.imagePosition || 'center 20%' }}
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/images/categories_straight.jpg'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Existing Content Preserved: Craftsmanship Promise Section      */}
      {/* ============================================================== */}
      <section className="category-editorial-footer" ref={gridRef}>
        <div className="editorial-glass-box">
          <span className="editorial-eyebrow">✦ SEEMEE CRAFTSMANSHIP PROMISE</span>
          <h2 className="editorial-title">Artisanal Luxury & Heritage Tailoring</h2>
          <p className="editorial-body">
            Every creation in our categories is crafted with meticulous attention to detail, pairing authentic handloom weaves with contemporary cuts to ensure timeless elegance.
          </p>
          <div className="editorial-chips-row">
            <span className="editorial-chip-item">✦ 100% Handcrafted</span>
            <span className="editorial-chip-item">✦ Custom Fitting Available</span>
            <span className="editorial-chip-item">✦ Express Global Shipping</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CategoriesPage
