import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './BrandsThatLead.css'

// Default fallback brands strictly segregated by audience
const DEFAULT_BRANDS = {
  men: [
    {
      _id: 'default-gp',
      name: 'GP',
      tagline: 'Everyday Fashion, Reimagined',
      image: '/images/category_card_men.jpg',
      buttonText: 'Shop Now',
      targetAudience: ['men']
    },
    {
      _id: 'default-humberto',
      name: 'HUMBERTO',
      tagline: 'Classic T-shirts for Modern Living',
      image: '/images/categories_straight.jpg',
      buttonText: 'Shop Now',
      targetAudience: ['men', 'women', 'all']
    },
    {
      _id: 'default-hangup',
      name: 'HANGUP',
      tagline: 'Modern Fashion for Everyday Style',
      image: '/images/all_collection_tab.jpg',
      buttonText: 'Shop Now',
      targetAudience: ['men']
    }
  ],
  women: [
    {
      _id: 'default-seemee',
      name: 'SEEMEE',
      tagline: 'Elegant Ethnic Wear for Every Occasion',
      image: '/images/ruby_bridal_sharara.png',
      buttonText: 'Shop Now',
      targetAudience: ['women', 'all']
    },
    {
      _id: 'default-humberto',
      name: 'HUMBERTO',
      tagline: 'Classic T-shirts for Modern Living',
      image: '/images/categories_straight.jpg',
      buttonText: 'Shop Now',
      targetAudience: ['men', 'women', 'all']
    }
  ],
  all: [
    {
      _id: 'default-seemee',
      name: 'SEEMEE',
      tagline: 'Elegant Ethnic Wear for Every Occasion',
      image: '/images/ruby_bridal_sharara.png',
      buttonText: 'Shop Now',
      targetAudience: ['women', 'all']
    },
    {
      _id: 'default-gp',
      name: 'GP',
      tagline: 'Everyday Fashion, Reimagined',
      image: '/images/category_card_men.jpg',
      buttonText: 'Shop Now',
      targetAudience: ['men']
    },
    {
      _id: 'default-humberto',
      name: 'HUMBERTO',
      tagline: 'Classic T-shirts for Modern Living',
      image: '/images/categories_straight.jpg',
      buttonText: 'Shop Now',
      targetAudience: ['men', 'women', 'all']
    },
    {
      _id: 'default-hangup',
      name: 'HANGUP',
      tagline: 'Modern Fashion for Everyday Style',
      image: '/images/all_collection_tab.jpg',
      buttonText: 'Shop Now',
      targetAudience: ['men']
    }
  ]
}

// Brand aesthetic design themes (matching Bento UI palette)
const BRAND_PRESET_THEMES = {
  SEEMEE: {
    themeClass: 'theme-blush',
    bgColor: '#FCE3EB',
    badgeColor: '#9D3B58',
    btnBg: '#9D3B58',
    photoBg: '#F0B8C8',
    fallbackImg: '/images/ruby_bridal_sharara.png'
  },
  GP: {
    themeClass: 'theme-mint',
    bgColor: '#D2F5EE',
    badgeColor: '#385C42',
    btnBg: '#276749',
    photoBg: '#C2EAE1',
    fallbackImg: '/images/category_card_men.jpg'
  },
  HUMBERTO: {
    themeClass: 'theme-sand',
    bgColor: '#F6F0DB',
    badgeColor: '#8E6627',
    btnBg: '#8C5E28',
    photoBg: '#E9E2C8',
    fallbackImg: '/images/categories_straight.jpg'
  },
  HANGUP: {
    themeClass: 'theme-slate',
    bgColor: '#D8E8F3',
    badgeColor: '#3D5C76',
    btnBg: '#3B5B75',
    photoBg: '#CFE0EC',
    fallbackImg: '/images/all_collection_tab.jpg'
  }
}

const FALLBACK_THEME_LIST = [
  BRAND_PRESET_THEMES.SEEMEE,
  BRAND_PRESET_THEMES.GP,
  BRAND_PRESET_THEMES.HUMBERTO,
  BRAND_PRESET_THEMES.HANGUP
]

const getBrandTheme = (brand, index) => {
  const normName = (brand?.name || '').toUpperCase().trim()
  if (BRAND_PRESET_THEMES[normName]) {
    return BRAND_PRESET_THEMES[normName]
  }
  return FALLBACK_THEME_LIST[index % FALLBACK_THEME_LIST.length]
}

export const isBrandForAudience = (brand, audience = 'all') => {
  if (!brand || brand.isActive === false) return false
  const aud = (audience || 'all').toLowerCase().trim()
  if (aud === 'all') return true

  const raw = brand.targetAudience
  const arr = Array.isArray(raw)
    ? raw.map(v => (v || '').toLowerCase().trim())
    : [(raw || '').toLowerCase().trim()]

  const hasMen = arr.includes('men') || arr.includes('male') || arr.includes('gents')
  const hasWomen = arr.includes('women') || arr.includes('female') || arr.includes('ladies')
  const hasExplicitAll = arr.includes('all') || arr.includes('unisex')

  if (hasWomen && !hasMen) return aud === 'women'
  if (hasMen && !hasWomen) return aud === 'men'
  if (hasExplicitAll || (hasMen && hasWomen)) return true

  return true
}

const formatButtonText = (text) => {
  if (!text) return 'Shop Now →'
  const trimmed = String(text).trim()
  if (trimmed.includes('→') || trimmed.includes('↗') || trimmed.includes('>')) {
    return trimmed
  }
  return `${trimmed} →`
}

const BrandsThatLead = ({ activeAudience = 'all' }) => {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const fetchBrands = async () => {
      try {
        setLoading(true)
        const targetUrl = `${API_ENDPOINTS.BRANDS}?gender=${encodeURIComponent(activeAudience)}`
        const res = await cachedFetch(targetUrl, { ttlMs: 30000 })
        
        if (isMounted) {
          const rawList = (res?.success && Array.isArray(res.data)) ? res.data : []
          // Strict filter: only brands that belong to this audience
          const validList = rawList.filter(b => isBrandForAudience(b, activeAudience))
          setBrands(validList)
        }
      } catch (err) {
        console.error('Error loading Brands That Lead:', err)
        if (isMounted) {
          // Fall back only to strictly appropriate audience defaults
          setBrands(DEFAULT_BRANDS[activeAudience] || DEFAULT_BRANDS.all || [])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchBrands()
    return () => { isMounted = false }
  }, [activeAudience])

  // Get displayed brands: exactly the audience brands, without any extra ones
  const audienceKey = (activeAudience || 'all').toLowerCase().trim()
  const displayBrands = brands.length > 0 
    ? brands 
    : (DEFAULT_BRANDS[audienceKey] || DEFAULT_BRANDS.all || [])

  // If no brands for this audience, hide section completely
  if (!loading && displayBrands.length === 0) {
    return null
  }

  const handleCardClick = (brand) => {
    if (brand.link && (brand.link.startsWith('/') || brand.link.startsWith('http'))) {
      navigate(brand.link)
    } else {
      navigate(`/collections?brand=${encodeURIComponent(brand.name)}&gender=${activeAudience}`)
    }
  }

  const totalCount = displayBrands.length

  // Determine card role based on count and index
  const getCardRole = (index, total) => {
    if (total === 4) {
      if (index === 0) return 'tall'
      if (index === 3) return 'wide'
      return 'square'
    }
    if (total === 3) {
      return 'square'
    }
    if (total === 2) {
      return 'wide'
    }
    return 'wide'
  }

  return (
    <section className="brands-lead-section" id="brands-that-lead">
      <div className="brands-lead-container">
        {/* Header with Title */}
        <div className="brands-lead-header">
          <h2 className="brands-lead-title">
            Brands That <span className="brands-title-gold">Lead</span>
          </h2>
        </div>

        {/* Bento Grid */}
        {loading && brands.length === 0 ? (
          <div className={`brands-bento-skeleton count-${totalCount || 4}`}>
            {totalCount === 3 ? (
              <>
                <div className="bento-skeleton-item bento-skeleton-square" />
                <div className="bento-skeleton-item bento-skeleton-square" />
                <div className="bento-skeleton-item bento-skeleton-square" />
              </>
            ) : totalCount === 2 ? (
              <>
                <div className="bento-skeleton-item bento-skeleton-square" />
                <div className="bento-skeleton-item bento-skeleton-square" />
              </>
            ) : (
              <>
                <div className="bento-skeleton-item bento-skeleton-tall" />
                <div className="bento-skeleton-item bento-skeleton-square" />
                <div className="bento-skeleton-item bento-skeleton-square" />
                <div className="bento-skeleton-item bento-skeleton-wide" />
              </>
            )}
          </div>
        ) : (
          <div className={`brands-bento-grid count-${totalCount}`}>
            {displayBrands.map((brand, idx) => {
              const theme = getBrandTheme(brand, idx)
              const role = getCardRole(idx, totalCount)
              const fallbackImg = theme.fallbackImg || '/images/ruby_bridal_sharara.png'
              const isTall = role === 'tall'
              const isWide = role === 'wide'

              return (
                <div
                  key={brand._id || brand.name || idx}
                  className={`bento-card bento-slot-${idx + 1} ${isTall ? 'bento-role-tall' : isWide ? 'bento-role-wide' : 'bento-role-square'} ${theme.themeClass}`}
                  style={{ backgroundColor: theme.bgColor }}
                  onClick={() => handleCardClick(brand)}
                >
                  <div className={`bento-card-content-left ${isWide ? 'bento-hangup-content' : ''}`}>
                    <div className="bento-card-texts">
                      <span className="bento-brand-badge" style={{ color: theme.badgeColor }}>
                        FEATURED BRAND
                      </span>
                      <h3 className="bento-brand-name">{brand.name}</h3>
                      <p className="bento-brand-tagline">{brand.tagline}</p>
                    </div>
                    <div className="bento-btn-wrap">
                      <button
                        type="button"
                        className="bento-pill-btn"
                        style={{ backgroundColor: theme.btnBg }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardClick(brand)
                        }}
                      >
                        {formatButtonText(brand.buttonText)}
                      </button>
                    </div>
                  </div>

                  {brand.image && (
                    <div className={`bento-card-photo-side ${isWide ? 'bento-hangup-photo-side' : ''} ${isTall ? 'bento-tall-photo-side' : ''}`}>
                      <img
                        src={getOptimizedImageUrl(brand.image, 'card')}
                        alt={brand.name}
                        className="bento-card-photo-img"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        onError={(e) => { e.target.src = fallbackImg }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default BrandsThatLead
