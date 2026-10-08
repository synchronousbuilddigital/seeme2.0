import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getCategoryProducts, isCategoryForAudience } from '../utils/categoryHelper'
import './CategoriesPage.css'

const cardGradients = [
  'linear-gradient(145deg, #1b263b 0%, #0d1b2a 100%)',
  'linear-gradient(145deg, #cbb69d 0%, #a89478 100%)',
  'linear-gradient(145deg, #2b7a70 0%, #144d46 100%)',
  'linear-gradient(145deg, #eab308 0%, #ca8a04 100%)',
  'linear-gradient(145deg, #881337 0%, #4c0519 100%)',
  'linear-gradient(145deg, #334155 0%, #0f172a 100%)'
]

const cardEyebrows = [
  'TIMELESS ELEGANCE',
  'ELEGANCE FABRIC',
  'FESTIVAL OCCASION',
  'HANDLOOM WEAVE',
  'ROYAL ATELIER',
  'HERITAGE SILHOUETTE'
]

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
        ? prodData.data.filter(p => p.isActive)
        : []

      let rawCategories = []
      if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides)) {
        rawCategories = settingsData.data.categorySlides.filter(Boolean)
      }

      const processedCategories = rawCategories.map((cat, idx) => {
        const catTitle = cat?.title || cat?.name || ''
        const catSlug = cat?.slug || catTitle
        const matching = getCategoryProducts(activeProds, catSlug)
        const matchedProduct = matching[0]

        return {
          ...cat,
          title: catTitle,
          slug: catSlug,
          targetAudience: normalizeAudience(cat?.targetAudience),
          productCount: matching.length,
          features: cat?.features && cat.features.length > 0 ? cat.features : ['Luxury Tailoring', 'Pure Fabrics'],
          subtitle: cat?.subtitle || 'Seemee Collection',
          description: cat?.description || 'Artisanal heritage creations blending traditional weaves with contemporary grace.',
          image: cat?.image || (matchedProduct?.images?.[0] || matchedProduct?.image) || '',
          gradient: cardGradients[idx % cardGradients.length],
          eyebrow: cardEyebrows[idx % cardEyebrows.length]
        }
      })

      setCategoriesList(processedCategories)
      setActiveProducts(activeProds)
    } catch (error) {
      console.error('Error loading admin categories:', error)
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
        cat.subtitle?.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q) ||
        cat.slug?.toLowerCase().includes(q)
      )
    }
    return result
  }, [categoriesList, activeAudience, activeProducts, searchCategoryQuery])

  // Split categories into 3 looping columns for the drifting showcase
  const { col1, col2, col3 } = useMemo(() => {
    const list = filteredCategories.length > 0 ? filteredCategories : categoriesList
    if (list.length === 0) return { col1: [], col2: [], col3: [] }

    const c1 = list.filter((_, i) => i % 3 === 0)
    const c2 = list.filter((_, i) => i % 3 === 1)
    const c3 = list.filter((_, i) => i % 3 === 2)

    const fillCol = (arr) => {
      if (arr.length === 0) return list
      let res = [...arr]
      while (res.length < 4) {
        res = [...res, ...arr]
      }
      return [...res, ...res]
    }

    return {
      col1: fillCol(c1),
      col2: fillCol(c2.length ? c2 : c1),
      col3: fillCol(c3.length ? c3 : c1)
    }
  }, [filteredCategories, categoriesList])

  const scrollToGrid = () => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth' })
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
      {/* Top Header Bar matching Screenshot */}
      <div className="editorial-top-bar">
        <div className="editorial-top-container">
          {/* Left Segmented Control Pill: ALL, MEN, WOMEN */}
          <div className="mockup-audience-pill-container">
            <button
              type="button"
              className={`mockup-pill-btn ${activeAudience === 'all' ? 'active' : ''}`}
              onClick={() => setActiveAudience('all')}
            >
              ALL
            </button>
            <button
              type="button"
              className={`mockup-pill-btn ${activeAudience === 'men' ? 'active' : ''}`}
              onClick={() => setActiveAudience('men')}
            >
              MEN
            </button>
            <button
              type="button"
              className={`mockup-pill-btn ${activeAudience === 'women' ? 'active' : ''}`}
              onClick={() => setActiveAudience('women')}
            >
              WOMEN
            </button>
          </div>

          {/* Right Search Input Pill */}
          <div className="mockup-search-pill-box">
            <input
              type="text"
              placeholder="Search silhouettes & styles..."
              value={searchCategoryQuery}
              onChange={(e) => setSearchCategoryQuery(e.target.value)}
            />
            {searchCategoryQuery ? (
              <button className="clear-search-trigger" onClick={() => setSearchCategoryQuery('')}>
                &times;
              </button>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* 🌟 3-COLUMN DRIFTING SHOWCASE HERO (Matching Screenshot) */}
      <section className="drifting-hero-section">
        <div className="drifting-hero-container">
          {/* Left Hero Content */}
          <div className="hero-left-content">
            <h1 className="hero-main-heading">
              Every style,<br />always moving
            </h1>
            <div className="hero-heading-line"></div>
            <p className="hero-subtext">
              Three columns drift in opposite directions. Hover a column to hold it still.
            </p>
          </div>

          {/* Right 3-Column Drifting Columns Mosaic */}
          <div className="hero-right-drift-mosaic">
            {/* Column 1 - Drifts Up */}
            <div className="drift-column-wrap">
              <div className="drift-column-inner col-up">
                {col1.map((cat, idx) => (
                  <div
                    key={`c1-${idx}`}
                    className="drift-card-item"
                    style={{
                      background: cat.image
                        ? `linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.78) 100%), url(${getImageUrl(cat.image)}) center top / cover no-repeat`
                        : cat.gradient
                    }}
                    onClick={() => navigate(`/category/${cat.slug}`)}
                  >
                    <div className="card-top-row">
                      <span className="card-eyebrow-text">{cat.eyebrow}</span>
                      <div className="card-arrow-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
                    <h3 className="card-bottom-title">{cat.title}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2 - Drifts Down */}
            <div className="drift-column-wrap">
              <div className="drift-column-inner col-down">
                {col2.map((cat, idx) => (
                  <div
                    key={`c2-${idx}`}
                    className="drift-card-item"
                    style={{
                      background: cat.image
                        ? `linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.78) 100%), url(${getImageUrl(cat.image)}) center top / cover no-repeat`
                        : cat.gradient
                    }}
                    onClick={() => navigate(`/category/${cat.slug}`)}
                  >
                    <div className="card-top-row">
                      <span className="card-eyebrow-text">{cat.eyebrow}</span>
                      <div className="card-arrow-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
                    <h3 className="card-bottom-title">{cat.title}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3 - Drifts Up */}
            <div className="drift-column-wrap">
              <div className="drift-column-inner col-up">
                {col3.map((cat, idx) => (
                  <div
                    key={`c3-${idx}`}
                    className="drift-card-item"
                    style={{
                      background: cat.image
                        ? `linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.78) 100%), url(${getImageUrl(cat.image)}) center top / cover no-repeat`
                        : cat.gradient
                    }}
                    onClick={() => navigate(`/category/${cat.slug}`)}
                  >
                    <div className="card-top-row">
                      <span className="card-eyebrow-text">{cat.eyebrow}</span>
                      <div className="card-arrow-circle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
                    <h3 className="card-bottom-title">{cat.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Craftsmanship Banner */}
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
