import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './Categories.css'

const Fabrics = () => {
  const navigate = useNavigate()
  const [hoveredIndex, setHoveredIndex] = useState(null)
  
  const fabrics = [
    {
      id: 1,
      title: 'Silk',
      label: 'The Luster',
      description: 'Hand-woven Banarasi and raw silks with a natural, regal sheen.',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 2,
      title: 'Cotton',
      label: 'The Breath',
      description: 'Fine Egyptian cotton blends for effortless all-day comfort.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 3,
      title: 'Georgette',
      label: 'The Motion',
      description: 'Ethereal, flowing drapes that create a silhouette of pure grace.',
      image: 'https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 4,
      title: 'Velvet',
      label: 'The Heritage',
      description: 'Deep, plush textures that echo the majesty of royal artisanal traditions.',
      image: 'https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?auto=format&fit=crop&q=80&w=1200'
    }
  ]

  return (
    <section className="fabrics-theme-section" id="fabrics">
      <div className="theme-container">
        <header className="theme-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="header-content"
          >
            <span className="theme-eyebrow">Artisanal Materials</span>
            <h2 className="theme-title">Our <span>Fabric</span> Soul</h2>
            <div className="theme-divider"></div>
          </motion.div>
        </header>

        <div className="theme-grid">
          {fabrics.map((fabric, index) => (
            <motion.div
              key={fabric.id}
              className="theme-card"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate('/fabrics')}
            >
              <div className="theme-media">
                <img src={fabric.image} alt={fabric.title} />
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div 
                      className="theme-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="overlay-content">
                        <span className="overlay-label">{fabric.label}</span>
                        <h3 className="overlay-title">{fabric.title}</h3>
                        <p className="overlay-desc">{fabric.description}</p>
                        <div className="overlay-btn">Explore Texture</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="theme-footer">
                <span className="card-num">0{index + 1}</span>
                <span className="card-name">{fabric.title}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="theme-explore">
          <motion.button 
            className="theme-btn"
            whileHover={{ gap: '2rem' }}
            onClick={() => navigate('/fabrics')}
          >
            View Full Atelier Collection
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </motion.button>
        </footer>
      </div>
    </section>
  )
}

export default Fabrics
