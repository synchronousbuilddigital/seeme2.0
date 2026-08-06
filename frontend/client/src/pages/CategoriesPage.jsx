import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getCategoryProducts } from '../utils/categoryHelper'
import './CategoriesPage.css'

const CategoriesPage = () => {
  const navigate = useNavigate()
  const [categoriesList, setCategoriesList] = useState([])
  const [loading, setLoading] = useState(true)

  // Category Search State
  const [searchCategoryQuery, setSearchCategoryQuery] = useState('')

  useEffect(() => {
    loadAllCategories()
    window.scrollTo(0, 0)
  }, [])

  const loadAllCategories = async () => {
    setLoading(true)
    try {
      const [prodData, settingsData] = await Promise.all([
        cachedFetch(`${API_ENDPOINTS.PRODUCTS}?limit=1000`),
        cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true })
      ])

      const activeProducts = prodData?.success && Array.isArray(prodData.data)
        ? prodData.data.filter(p => p.isActive)
        : []

      let rawCategories = []
      if (settingsData?.success && Array.isArray(settingsData.data?.categorySlides)) {
        rawCategories = settingsData.data.categorySlides.filter(Boolean)
      }

      // Process only admin categories
      const processedCategories = rawCategories.map((cat) => {
        const catTitle = cat?.title || cat?.name || ''
        const catSlug = cat?.slug || catTitle
        const matching = getCategoryProducts(activeProducts, catSlug)
        const matchedProduct = matching[0]

        return {
          ...cat,
          title: catTitle,
          slug: catSlug,
          productCount: matching.length,
          features: cat?.features && cat.features.length > 0 ? cat.features : ['Luxury Tailoring', 'Pure Fabrics'],
          subtitle: cat?.subtitle || 'Atelier Collection',
          description: cat?.description || 'Artisanal heritage creations blending traditional weaves with contemporary grace.',
          image: cat?.image || (matchedProduct?.images?.[0] || matchedProduct?.image) || '/images/categories_straight.jpg'
        }
      })

      setCategoriesList(processedCategories)
    } catch (error) {
      console.error('Error loading admin categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter Categories by Search Query
  const filteredCategories = useMemo(() => {
    if (!searchCategoryQuery.trim()) return categoriesList
    const q = searchCategoryQuery.toLowerCase().trim()
    return categoriesList.filter(cat =>
      cat.title?.toLowerCase().includes(q) ||
      cat.subtitle?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q) ||
      cat.slug?.toLowerCase().includes(q)
    )
  }, [categoriesList, searchCategoryQuery])

  if (loading) {
    return (
      <div className="categories-page-loading">
        <div className="glowing-gold-spinner"></div>
        <p>Curating SEEMEE Atelier Categories...</p>
      </div>
    )
  }

  return (
    <div className="all-categories-page">
      {/* Editorial Navigation Bar */}
      <div className="editorial-top-bar">
        <div className="editorial-top-container">
          <button onClick={() => navigate(-1)} className="editorial-back-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>

          <nav className="category-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">All Categories</span>
          </nav>
        </div>
      </div>

      {/* Hero Header */}
      <section className="categories-page-hero">
        <div className="hero-watermark">ATELIER ARCHIVE</div>
        <div className="container hero-container-box">
          <motion.div
            className="hero-header-box"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="seal-badge-box">
              <span className="rotating-star">✦</span>
              <span className="seal-text">SEEMEE HAUTE COUTURE • CATEGORIES DIRECTORY</span>
            </div>

            <h1 className="hero-title">All Categories</h1>
            <p className="categories-hero-sub">Explore our curated silhouettes, handwoven textiles, and heritage drapes.</p>
          </motion.div>
        </div>
      </section>

      {/* 🌟 LUXURY EDITORIAL CATEGORY SHOWCASE */}
      <section className="visual-categories-section">
        <div className="container">
          <div className="section-title-bar">
            <div className="title-left">
              <span className="section-eyebrow">✦ SEEMEE ATELIER GALLERY</span>
              <h2>Curated Category Showcase</h2>
            </div>

            {/* Search Categories */}
            <div className="category-search-box">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchCategoryQuery}
                onChange={(e) => setSearchCategoryQuery(e.target.value)}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </div>

            <span className="count-tag">✦ {filteredCategories.length} Categories</span>
          </div>

          <div className="categories-editorial-grid">
            {filteredCategories.length === 0 ? (
              <div className="no-categories-found">
                <p>No categories found matching "{searchCategoryQuery}"</p>
                <button onClick={() => setSearchCategoryQuery('')}>Clear Search</button>
              </div>
            ) : (
              filteredCategories.map((cat, idx) => {
                const indexFormatted = String(idx + 1).padStart(2, '0')
                const isSale = idx % 3 === 2

                return (
                  <motion.div
                    key={cat._id || cat.slug || idx}
                    className="editorial-category-card"
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                    onClick={() => navigate(`/category/${cat.slug}`)}
                  >
                    {/* Top Image Container */}
                    <div className="editorial-card-media">
                      <img
                        src={getImageUrl(cat.image)}
                        alt={cat.title}
                        loading="lazy"
                        onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                      />

                      {/* Top-Left Index Overlay */}
                      <div className="card-index-overlay">{indexFormatted}</div>


                    </div>

                    {/* Bottom Content Container */}
                    <div className="editorial-card-content">
                      <span className="card-category-eyebrow">{cat.subtitle ? cat.subtitle.toUpperCase() : 'SEEMEE COLLECTION'}</span>
                      <h3 className="card-title-heading">{cat.title}</h3>
                      <p className="card-description-text">{cat.description}</p>

                      {cat.productCount ? (
                        <div className="card-price-count">
                          <span className="count-text">{cat.productCount} Designs Available</span>
                        </div>
                      ) : null}

                      <div
                        className="discover-more-cta"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/category/${cat.slug}`)
                        }}
                      >
                        <span>EXPLORE CATEGORY</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Craftsmanship Banner */}
      <section className="category-editorial-footer">
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
