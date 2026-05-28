import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './FabricSection.css'

const FALLBACK_FABRICS = [
  { 
    title: 'Banarasi Silk Weave', 
    description: 'Woven in the sacred town of Varanasi, our Banarasi silk is celebrated for its deep mulberry silk base intricately hand-woven with real gold and silver metallic zari threads. Every yard requires weeks of meticulous handloom craftsmanship, creating delicate floral motifs (buttis) and architectural patterns inspired by royal Mughal aesthetics.', 
    image: '/images/about/fabric1.jpg' 
  },
  { 
    title: 'Royal Velvet Luxury', 
    description: 'Crafted with an ultra-dense, luxurious pile that catches soft ambient light, our premium royal velvet represents pure opulence. The deep silk-blend weave yields a sumptuous weight and liquid-like drape, bringing a regal structure and timeless, sophisticated sheen to SeeMee’s statement evening silhouettes.', 
    image: '/images/about/fabric4.jpg' 
  },
  { 
    title: 'Lustrous Silk-Cotton Blend', 
    description: 'This heritage textile blends the structural strength of hand-spun raw silk slubs with the breathable softness of fine cotton. Perfect for modern, structured drapes, it features subtle, natural variations in texture that proudly showcase its hand-woven, organic origin on traditional Indian pit looms.', 
    image: '/images/about/fabric3.jpg' 
  },
  { 
    title: 'Chanderi Brocade Artistry', 
    description: 'Originating from royal looms, our translucent cotton-silk Chanderi is sheer and lightweight yet highly resilient. Hand-embellished with intricate floral buttis in gold zari, it seamlessly bridges the gap between delicate hot-weather comfort and grand, majestic celebration attire.', 
    image: '/images/about/fabric1.jpg' 
  }
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
          // Merge rich descriptions into the fetched data
          const merged = data.data.fabrics.slice(0, 4).map((f, idx) => ({
            ...f,
            description: FALLBACK_FABRICS[idx]?.description || f.description
          }))
          setFabrics(merged)
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
        
        {/* Editorial Section Header */}
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

        {/* Large Alternating Fabric Circles Grid */}
        <div className="fabric-rows-container">
          {fabrics.map((fabric, index) => {
            const isImageLeft = index % 2 === 0

            return (
              <motion.div
                key={fabric.title || index}
                className={`fabric-row-alternating ${isImageLeft ? 'image-left' : 'row-reverse'}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onClick={() => navigate('/fabrics')}
              >
                {/* Large Circle Fabric Portal */}
                <div className="fabric-large-circle-portal">
                  <div className="hoop-tension-adjuster">
                    <div className="adjuster-screw" />
                  </div>
                  <div className="fabric-circle-inner">
                    <img
                      src={getOptimizedImageUrl(fabric.image, 'hero')}
                      alt={fabric.title}
                      className="fabric-circle-img"
                    />
                    <div className="fabric-circle-overlay" />
                  </div>
                </div>

                {/* Editorial Storytelling Text Card */}
                <div className="fabric-editorial-text-card">
                  <span className="fabric-row-kicker">Heritage 0{index + 1}</span>
                  <h3 className="fabric-row-title">{fabric.title}</h3>
                  <div className="fabric-row-divider" />
                  <p className="fabric-row-description">{fabric.description}</p>
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Explore the Textile Gallery</span>
            <svg width="20" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2,6 L22,6 M16,1 L22,6 L16,11" />
            </svg>
          </motion.button>
        </div>

      </div>
    </section>
  )
}

export default FabricSection
