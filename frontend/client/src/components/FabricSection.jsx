import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './FabricSection.css'

const FALLBACK_FABRICS = [
  { title: 'Banarasi Weave', description: 'Intricate gold zari metallic threads woven on rich mulberry magenta silk brocade.', image: '/images/about/fabric1.jpg' },
  { title: 'Velvet Luxury', description: 'Deep plush royal burgundy velvet catching soft ambient light highlights.', image: '/images/about/fabric4.jpg' },
  { title: 'Silk Blend', description: 'Lustrous ivory raw silk blend displaying organic handloom slubs.', image: '/images/about/fabric3.jpg' },
  { title: 'Chanderi Brocade', description: 'Translucent cotton-silk hand-woven with floral buttis in ancient looms, combining airy comfort with royal gold artistry.', image: '/images/about/fabric1.jpg' }
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
          // Slice to 4 elements to perfectly match the 4-step infographic timeline
          setFabrics(data.data.fabrics.slice(0, 4))
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

        {/* Infographic Timeline Spine Layout */}
        <div className="fabric-timeline-container">
          <div className="timeline-spine" />

          {fabrics.map((fabric, index) => {
            // Alternating branching side matching the user's reference image
            // Step 1 (index 0) branches to the Right
            // Step 2 (index 1) branches to the Left
            // Step 3 (index 2) branches to the Right
            // Step 4 (index 3) branches to the Left
            const isBranchRight = index % 2 === 0

            return (
              <motion.div
                key={fabric.title || index}
                className={`fabric-timeline-row ${isBranchRight ? 'branch-right' : 'branch-left'}`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onClick={() => navigate('/fabrics')}
              >
                {/* Curved Infographic Connector Line */}
                <div className={`connector-line ${isBranchRight ? 'to-right' : 'to-left'}`} />

                {/* Central Numbered Circular Badge */}
                <div className="fabric-timeline-badge-wrap">
                  <div className="fabric-timeline-badge">
                    <span className="badge-number">{index + 1}</span>
                  </div>
                </div>

                {/* Asymmetric Side Content Block holding both circular image and text */}
                <div className="fabric-timeline-card">
                  
                  {/* Circle Form Fabric Image Portal */}
                  <div className="fabric-timeline-image-container">
                    <div className="fabric-row-image-frame">
                      <img
                        src={getOptimizedImageUrl(fabric.image, 'hero')}
                        alt={fabric.title}
                        className="fabric-row-image"
                      />
                      <div className="fabric-row-image-overlay" />
                    </div>
                  </div>

                  {/* Text Editorial Block */}
                  <div className="fabric-timeline-content">
                    <span className="fabric-row-kicker">Heritage 0{index + 1}</span>
                    <h3 className="fabric-row-title">{fabric.title}</h3>
                    <div className="fabric-row-divider" />
                    <p className="fabric-row-description">{fabric.description}</p>
                    
                    {/* Dynamic Premium Line Art Icon to match the infographic theme */}
                    <div className="fabric-timeline-icon-wrap">
                      {index === 0 && (
                        /* Fabric Needle/Spindle Loom Icon */
                        <svg className="timeline-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 2 L12 22 M8 10 C8 7, 16 7, 16 10 C16 13, 8 13, 8 16 C8 19, 16 19, 16 22" />
                        </svg>
                      )}
                      {index === 1 && (
                        /* Royal Crown / Velvet Icon */
                        <svg className="timeline-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 18 L4 8 L9 13 L12 6 L15 13 L20 8 L22 18 Z" />
                          <circle cx="12" cy="5" r="1" fill="currentColor" />
                          <circle cx="4" cy="7" r="1" fill="currentColor" />
                          <circle cx="20" cy="7" r="1" fill="currentColor" />
                        </svg>
                      )}
                      {index === 2 && (
                        /* Organic Lotus Leaf / Silk Spindle Icon */
                        <svg className="timeline-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 22 C12 22, 4 16, 4 11 C4 7, 8 5, 12 2 C16 5, 20 7, 20 11 C20 16, 12 22, 12 22 Z" />
                          <path d="M12 22 L12 11" />
                        </svg>
                      )}
                      {index === 3 && (
                        /* Handloom Weaver Shuttle Icon */
                        <svg className="timeline-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 12 C4 8, 20 4, 20 12 C20 20, 4 16, 4 12 Z" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )
          })}
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
