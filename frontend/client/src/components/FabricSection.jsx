import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './FabricSection.css'

const FALLBACK_FABRICS = [
  { title: 'Banarasi Weave', description: 'Intricate gold zari metallic threads woven on rich mulberry magenta silk brocade.', image: '/images/about/fabric1.jpg' },
  { title: 'Velvet Luxury', description: 'Deep plush royal burgundy velvet catching soft ambient light highlights.', image: '/images/about/fabric4.jpg' },
  { title: 'Silk Blend', description: 'Lustrous ivory raw silk blend displaying organic handloom slubs.', image: '/images/about/fabric3.jpg' }
]

const FabricSection = () => {
  const navigate = useNavigate()
  const [fabrics, setFabrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.SITE_SETTINGS)
        const data = await response.json()
        if (data.success && data.data.fabrics && data.data.fabrics.length > 0) {
          // Take first 3 for homepage layout
          setFabrics(data.data.fabrics.slice(0, 3))
        } else {
          setFabrics(FALLBACK_FABRICS)
        }
      } catch (error) {
        console.error('Error fetching fabrics for homepage:', error)
        setFabrics(FALLBACK_FABRICS)
      } finally {
        setLoading(false)
      }
    }

    fetchFabrics()
  }, [])

  if (loading) return null

  return (
    <section className="homepage-fabric-section">
      <div className="fabric-section-container">
        {/* Editorial Header */}
        <div className="fabric-section-header">
          <span className="fabric-kicker">Tactile Heritage</span>
          <h2 className="fabric-heading">
            The Art of the <span className="italic">Weave</span>
          </h2>
          <div className="fabric-header-line" />
          <p className="fabric-section-intro">
            Every SeeMee silhouette begins with the selection of premium, heritage Indian textiles. Feel the weight of legacy, patience, and ancestral craftsmanship woven into the very fabric of our collections.
          </p>
        </div>

        {/* Fabrics Interactive Grid */}
        <div className="fabric-interactive-grid">
          {fabrics.map((fabric, index) => (
            <motion.div
              key={fabric.title || index}
              className="fabric-texture-card"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              onClick={() => navigate('/fabrics')}
            >
              <div className="fabric-card-image-wrap">
                <img
                  src={getOptimizedImageUrl(fabric.image, 'hero')}
                  alt={fabric.title}
                  className="fabric-card-image"
                />
                <div className="fabric-card-overlay">
                  <span className="tactile-tag">Heritage Weave</span>
                  <h3 className="fabric-card-title">{fabric.title}</h3>
                  <p className="fabric-card-desc">{fabric.description}</p>
                  <span className="explore-card-link">Explore detail →</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Call to Action */}
        <div className="fabric-section-action">
          <motion.button
            className="explore-fabrics-btn"
            onClick={() => navigate('/fabrics')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Explore the Textile Gallery</span>
            <svg width="20" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2,6 L22,6 M16,1 L22,6 L16,11" />
            </svg>
          </motion.button>
        </div>
      </div>
    </section>
  )
}

export default FabricSection
