import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from '../hooks/useInView'
import './AtelierHighlights.css'

const AtelierHighlights = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [ref, inView] = useInView({ once: true, threshold: 0.02 })

  const atelierPillars = [
    {
      title: 'Handloom Heritage',
      tagline: 'Woven by Hand, Tailored by Time',
      description: 'Our fabrics are sourced directly from traditional weavers across India. Using age-old handloom techniques, each thread is carefully aligned to create rich textures and breathable weaves that modern machinery can never replicate.',
      quote: '"Weaving is not just a technique; it is a conversation with the ancestors."',
      highlight: 'Pure Mulberry Silks & Fine Organic Cottons',
      image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=1200'
    },
    {
      title: 'Artisan Tailored',
      tagline: 'Architectural Silhouettes for Contemporary Grace',
      description: 'Every SeeMee outfit is structured around the natural form, ensuring fluid motion and effortless comfort. Our master cut-makers dedicate hours to draft perfect fits that balance regal flared drapes with contemporary clean lines.',
      quote: '"The beauty of a silhouette lies in the freedom of its movement."',
      highlight: 'Ergonomic Flares & Signature Custom Linings',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200'
    },
    {
      title: 'Hand Embroidery',
      tagline: 'A Canvas of Stitches and Metallic Gold Threads',
      description: 'Specialist embellishers spend up to 40 hours on a single garment, executing intricate Zardozi, Aari, and Kantha embroideries. The metallic tilla threads catch the light beautifully, adding a subtle, sophisticated sparkle.',
      quote: '"Our needles carry the weight of a thousand-year artistic lineage."',
      highlight: 'Genuine Gota Patti & Intricate Hand Tilla Embroidery',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200'
    },
    {
      title: 'Ethically Sourced',
      tagline: 'Sustainable Luxury Made to Last Generations',
      description: 'We prioritize fair-wage employment and environment-friendly dye practices. Our collections are produced in micro-batches to eliminate waste, preserving our ecological heritage while celebrating our cultural one.',
      quote: '"True luxury respects both the hands that craft and the earth that yields."',
      highlight: 'Zero-Waste Cutting & Certified Eco-Friendly Dyes',
      image: 'https://images.unsplash.com/photo-1590736969955-71cb94801759?auto=format&fit=crop&q=80&w=1200'
    }
  ]

  return (
    <section className="atelier-highlights-section" ref={ref}>
      {/* Background radial glow */}
      <div className="atelier-glow"></div>

      <div className="atelier-container">
        {/* Section Header */}
        <motion.div 
          className="atelier-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="atelier-subtitle">The Atelier Edit</span>
          <h2 className="atelier-title">OUR <span>CRAFTSMANSHIP</span></h2>
          <div className="title-accent-line"></div>
          <p className="atelier-intro">
            Step behind the scenes of our couture workshop, where fine details are elevated to art.
          </p>
        </motion.div>

        {/* Interactive Layout Split */}
        <div className="atelier-split">
          
          {/* Left Column: Pillars Navigation & Text Story */}
          <motion.div 
            className="atelier-narrative-box"
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.1 }}
          >
            {/* Nav Tabs */}
            <div className="atelier-nav-tabs">
              {atelierPillars.map((pillar, index) => (
                <button
                  key={index}
                  className={`atelier-tab-btn ${activeTab === index ? 'active' : ''}`}
                  onClick={() => setActiveTab(index)}
                >
                  <span className="tab-number">0{index + 1}</span>
                  <span className="tab-text">{pillar.title}</span>
                </button>
              ))}
            </div>

            {/* Pillar Content Showcase */}
            <div className="atelier-tab-body">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="pillar-detail-card"
                >
                  <span className="pillar-tagline">{atelierPillars[activeTab].tagline}</span>
                  <h3 className="pillar-heading">{atelierPillars[activeTab].title}</h3>
                  
                  <p className="pillar-description">{atelierPillars[activeTab].description}</p>
                  
                  <div className="pillar-quote-box">
                    <span className="quote-mark">“</span>
                    <p className="pillar-quote">{atelierPillars[activeTab].quote}</p>
                  </div>

                  <div className="pillar-highlight">
                    <span className="highlight-label">Signature Feature:</span>
                    <span className="highlight-value">{atelierPillars[activeTab].highlight}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Column: Visual Lookbook Frame */}
          <motion.div 
            className="atelier-lookbook"
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.2 }}
          >
            <div className="lookbook-frame">
              <div className="gold-offset-border"></div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  className="lookbook-image-container"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.8 }}
                >
                  <img 
                    src={atelierPillars[activeTab].image} 
                    alt={atelierPillars[activeTab].title} 
                  />
                  <div className="lookbook-overlay"></div>
                </motion.div>
              </AnimatePresence>

              {/* Float aesthetic stamp */}
              <div className="lookbook-badge">
                <span className="badge-text">SEEMEE ATELIER</span>
                <span className="badge-year">Est. 2024</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default AtelierHighlights
