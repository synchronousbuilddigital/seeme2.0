import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './BrandsThatLead.css'

const CARD_THEMES = [
  {
    bgColor: '#FCEEEF',
    accentColor: '#B35B6D',
    textColor: '#1C2536',
    subtextColor: '#5A6578',
    leafColor: '#E4AAB5'
  },
  {
    bgColor: '#EBF3EC',
    accentColor: '#4D6B50',
    textColor: '#1C2536',
    subtextColor: '#5A6578',
    leafColor: '#9BB69E'
  },
  {
    bgColor: '#F7F1E5',
    accentColor: '#C29653',
    textColor: '#1C2536',
    subtextColor: '#5A6578',
    leafColor: '#E2CBA3'
  },
  {
    bgColor: '#E8F0F5',
    accentColor: '#547A8F',
    textColor: '#1C2536',
    subtextColor: '#5A6578',
    leafColor: '#A3C4D6'
  }
]

const DEFAULT_BRANDS = [
  {
    _id: 'default-1',
    name: 'SEEMEE',
    tagline: 'Elegant Ethnic Wear for Every Occasion',
    image: '/images/ruby_bridal_sharara.png',
    buttonText: 'Shop Now'
  },
  {
    _id: 'default-2',
    name: 'GP',
    tagline: 'Everyday Fashion, Reimagined',
    image: '/images/category_card_men.jpg',
    buttonText: 'Shop Now'
  },
  {
    _id: 'default-3',
    name: 'HUMBERTO',
    tagline: 'Classic T-shirts for Modern Living',
    image: '/images/categories_straight.jpg',
    buttonText: 'Shop Now'
  },
  {
    _id: 'default-4',
    name: 'HANGUP',
    tagline: 'Modern Fashion for Everyday Style',
    image: '/images/all_collection_tab.jpg',
    buttonText: 'Shop Now'
  }
]

const BrandsThatLead = ({ activeAudience = 'men' }) => {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const fetchBrands = async () => {
      try {
        if (brands.length === 0) setLoading(true)
        const targetUrl = `${API_ENDPOINTS.BRANDS}?gender=${encodeURIComponent(activeAudience)}`
        let res = await cachedFetch(targetUrl, { ttlMs: 60000 })
        
        if (isMounted && res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setBrands(res.data)
        } else {
          // Fallback to fetch all active brands created in Admin Panel
          const fallbackRes = await cachedFetch(API_ENDPOINTS.BRANDS, { ttlMs: 60000 })
          if (isMounted && fallbackRes?.success && Array.isArray(fallbackRes.data)) {
            setBrands(fallbackRes.data)
          } else if (isMounted) {
            setBrands([])
          }
        }
      } catch (err) {
        console.error('Error loading Brands That Lead:', err)
        if (isMounted) setBrands([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchBrands()
    return () => { isMounted = false }
  }, [activeAudience])

  const displayBrands = brands.length > 0 ? brands : DEFAULT_BRANDS

  return (
    <section className="brands-lead-section" id="brands-that-lead">
      {/* Corner Background Decorative Arcs */}
      <svg className="brands-bg-flourish-tl" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="0" cy="0" r="220" stroke="#C29653" strokeWidth="1.2" opacity="0.3" />
        <circle cx="0" cy="0" r="170" stroke="#C29653" strokeWidth="0.8" opacity="0.2" />
      </svg>
      <svg className="brands-bg-flourish-br" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M240 160C160 160 100 100 100 0" stroke="#C29653" strokeWidth="1.2" opacity="0.25" />
        <path d="M240 200C140 200 80 140 80 0" stroke="#C29653" strokeWidth="0.8" opacity="0.18" />
      </svg>

      <div className="brands-lead-container">
        {/* Section Header */}
        <div className="brands-lead-header">
          <span className="brands-lead-eyebrow">EXPLORE OUR COLLECTIONS</span>
          <h2 className="brands-lead-title">
            Brands That <span className="brands-title-gold">Lead</span>
          </h2>
          
          {/* Subtle Lotus Divider */}
          <div className="brands-header-divider">
            <span className="divider-line" />
            <svg className="lotus-emblem-svg" viewBox="0 0 32 20" fill="none">
              <path d="M16 1C16 1 11 6 11 12C11 16.5 16 19 16 19C16 19 21 16.5 21 12C21 6 16 1Z" fill="none" stroke="#B8941E" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M16 19C16 19 8 16 5 11C3.5 8.5 5 5.5 8 6.5C11 7.5 16 13 16 13" fill="none" stroke="#B8941E" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M16 19C16 19 24 16 27 11C28.5 8.5 27 5.5 24 6.5C21 7.5 16 13 16 13" fill="none" stroke="#B8941E" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span className="divider-line" />
          </div>

          <p className="brands-lead-subtitle">
            Discover our top fashion brands, handpicked for quality, style and everyday comfort.
          </p>
        </div>

        {/* Brands Grid */}
        {loading ? (
          <div className="brands-skeleton-grid">
            {Array(4).fill(0).map((_, idx) => (
              <div key={idx} className="brand-skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="brands-cards-row">
            {displayBrands.map((brand, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length]
              const cardBg = brand.bgColor || theme.bgColor
              const accentColor = theme.accentColor
              
              return (
                <div
                  key={brand._id || index}
                  className="brand-card-item"
                  style={{
                    '--card-bg': cardBg,
                    '--card-accent': accentColor
                  }}
                  onClick={() => {
                    const bName = brand.name || ''
                    navigate(`/collections?brand=${encodeURIComponent(bName)}`)
                  }}
                >
                  {/* Left Side: Photo */}
                  <div className="brand-card-photo-side">
                    <img
                      src={getOptimizedImageUrl(brand.image, 'card')}
                      alt={brand.name}
                      className="brand-card-photo-img"
                      loading="eager"
                      decoding="async"
                      onError={(e) => { e.target.src = '/images/home-hero.png' }}
                    />
                  </div>

                  {/* Right Side: Details with Swoop Curve */}
                  <div className="brand-card-info-side">
                    {/* Organic Swoop Curve Vector */}
                    <svg className="brand-card-swoop-svg" viewBox="0 0 40 100" preserveAspectRatio="none">
                      <path d="M40 0 C12 25, 12 75, 40 100 L40 0 Z" fill={cardBg} />
                    </svg>

                    <div className="brand-details">
                      <span className="brand-mini-badge" style={{ color: accentColor }}>FEATURED BRAND</span>
                      <h3 className="brand-name-text">{brand.name}</h3>
                      <p className="brand-tagline-text">{brand.tagline || 'Everyday Fashion, Reimagined'}</p>
                    </div>

                    <div className="brand-action-area">
                      <button
                        type="button"
                        className="brand-pill-button"
                        style={{ backgroundColor: accentColor }}
                        onClick={(e) => {
                          e.stopPropagation()
                          const bName = brand.name || ''
                          navigate(`/collections?brand=${encodeURIComponent(bName)}`)
                        }}
                      >
                        <span>{brand.buttonText || 'Shop Now'}</span>
                        <span className="button-arrow-circle">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </button>
                    </div>

                    {/* Corner Delicate Floral Line Art */}
                    <svg className="brand-card-leaf-art" viewBox="0 0 100 100" fill="none" style={{ color: theme.leafColor }}>
                      <path d="M85 90C65 85 45 65 30 40" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M60 70C68 62 78 62 82 70C74 78 64 76 60 70Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                      <path d="M45 50C53 42 63 42 67 50C59 58 49 56 45 50Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                      <path d="M30 35C38 27 48 27 52 35C44 43 34 41 30 35Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                    </svg>
                  </div>
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
