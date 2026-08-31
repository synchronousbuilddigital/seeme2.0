import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { cachedFetch } from '../utils/cachedFetch'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './BrandsThatLead.css'

const BrandsThatLead = ({ activeAudience = 'men' }) => {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const fetchBrands = async () => {
      try {
        setLoading(true)
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

  // Strictly return null if no brands exist in Admin database
  if (!loading && brands.length === 0) {
    return null
  }

  return (
    <section className="brands-lead-section" id="brands-that-lead">
      <div className="brands-lead-container">
        {/* Section Header */}
        <div className="brands-lead-header">
          <h2 className="brands-lead-title">BRANDS THAT LEAD</h2>
          <div className="brands-title-underline" />
        </div>

        {/* Brands Grid */}
        {loading ? (
          <div className="brands-skeleton-grid">
            {Array(2).fill(0).map((_, idx) => (
              <div key={idx} className="brand-skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="brands-cards-row">
            {brands.map((brand) => (
              <div
                key={brand._id}
                className="brand-card-item"
                style={{
                  backgroundColor: brand.bgColor || '#FAF7F2',
                  backgroundImage: brand.bgImage ? `linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.75)), url(${getOptimizedImageUrl(brand.bgImage, 'hero')})` : 'none'
                }}
                onClick={() => {
                  const bName = brand.name || ''
                  navigate(`/collections?brand=${encodeURIComponent(bName)}`)
                }}
              >
                {/* Left Side: Photo covering full card height */}
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

                {/* Right Side: Details & Action Pill Button */}
                <div className="brand-card-info-side">
                  <div className="brand-details">
                    <span className="brand-mini-badge">FEATURED BRAND</span>
                    <h3 className="brand-name-text">{brand.name}</h3>
                    {brand.tagline && <p className="brand-tagline-text">{brand.tagline}</p>}
                  </div>

                  <div className="brand-action-area">
                    <button
                      type="button"
                      className="brand-pill-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const bName = brand.name || ''
                        navigate(`/collections?brand=${encodeURIComponent(bName)}`)
                      }}
                    >
                      <span>{brand.buttonText || 'Products ↗'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default BrandsThatLead
