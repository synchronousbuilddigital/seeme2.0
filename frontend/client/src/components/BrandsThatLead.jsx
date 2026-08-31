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
        const res = await cachedFetch(targetUrl, { ttlMs: 120000 })
        
        if (isMounted && res?.success && Array.isArray(res.data)) {
          setBrands(res.data)
        }
      } catch (err) {
        console.error('Error loading Brands That Lead:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchBrands()
    return () => { isMounted = false }
  }, [activeAudience])

  if (!loading && brands.length === 0) {
    return null
  }

  return (
    <section className="brands-lead-section" id="brands-that-lead">
      <div className="brands-lead-container">
        {/* Section Header */}
        <div className="brands-lead-header">
          <span className="brands-lead-eyebrow">CURATED EXCELLENCE</span>
          <h2 className="brands-lead-title">BRANDS THAT LEAD</h2>
          <div className="brands-title-underline" />
        </div>

        {/* Brands Grid */}
        {loading ? (
          <div className="brands-skeleton-grid">
            {Array(3).fill(0).map((_, idx) => (
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
                  backgroundColor: brand.bgColor || '#D1F2EE',
                  backgroundImage: brand.bgImage ? `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${getOptimizedImageUrl(brand.bgImage, 'hero')})` : 'none'
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
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.target.src = '/images/placeholder.jpg' }}
                  />
                </div>

                {/* Right Side: Details & Action Pill Button */}
                <div className="brand-card-info-side">
                  <div className="brand-details">
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
