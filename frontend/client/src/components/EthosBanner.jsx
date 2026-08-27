import { motion } from 'framer-motion'
import './EthosBanner.css'

const EthosBanner = () => {
  return (
    <section className="seemee-ethos-banner">
      <div className="ethos-banner-overlay" />
      <div className="ethos-banner-container">
        <motion.div
          className="ethos-content-box"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Stylized Gold Quote Mark */}
          <div className="ethos-quote-mark">“</div>

          {/* Main Italicized Ethos Quote matching user screenshot */}
          <blockquote className="ethos-quote-text">
            Luxury is never in the speed of the machine, but in the patience of the hand that coaxes threads into poetry.
          </blockquote>

          {/* Gold Accent Divider Line */}
          <div className="ethos-gold-divider" />

          {/* Attribution */}
          <div className="ethos-attribution">
            — THE SEEMEE ETHOS
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default EthosBanner
