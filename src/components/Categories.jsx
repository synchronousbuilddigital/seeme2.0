import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Categories.css'

const Fabrics = () => {
  const navigate = useNavigate()
  const [fabrics, setFabrics] = useState([
    {
      id: 1,
      title: 'Premium Silk',
      description: 'Luxurious silk fabrics with natural sheen and smooth texture. Perfect for elegant ethnic wear that drapes beautifully and adds sophistication.',
      image: 'silk.jpg',
      order: 0
    },
    {
      id: 2,
      title: 'Pure Cotton',
      description: 'Soft, breathable cotton fabrics ideal for everyday comfort. Lightweight and perfect for all-season wear with easy maintenance.',
      image: 'cotton.jpg',
      order: 1
    },
    {
      id: 3,
      title: 'Georgette',
      description: 'Lightweight and flowing georgette fabrics with slightly crinkled texture. Ideal for creating graceful silhouettes and elegant drapes.',
      image: 'georgette.jpg',
      order: 2
    },
    {
      id: 4,
      title: 'Velvet',
      description: 'Rich and luxurious velvet fabrics with soft pile. Perfect for festive and special occasion wear with premium quality finish.',
      image: 'velvet.jpg',
      order: 3
    }
  ])

  useEffect(() => {
    // Fetch fabrics from API
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.fabrics && data.data.fabrics.length > 0) {
          // Ensure each fabric has a unique ID
          const fabricsWithIds = data.data.fabrics.map((fabric, idx) => ({
            ...fabric,
            id: fabric._id || fabric.id || `fabric-${idx}`
          }))
          setFabrics(fabricsWithIds.sort((a, b) => a.order - b.order))
        }
      })
      .catch(err => console.error('Error fetching fabrics:', err))
  }, [])
  return (
    <section className="fabrics-section" id="fabrics">
      <div className="fabrics-container">
        <div className="fabrics-header">
          <h2 className="fabrics-title">FABRICS</h2>
          <motion.button
            className="view-all-fabrics-btn"
            onClick={() => navigate('/fabrics')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore All Fabrics
          </motion.button>
        </div>

        <div className="fabrics-grid">
          {fabrics.map((fabric, index) => (
            <div 
              key={fabric.id} 
              className={`fabric-item ${index % 2 === 0 ? 'left-align' : 'right-align'}`}
            >
              <div className="fabric-circle">
                <img src={fabric.image} alt={fabric.title} />
              </div>
              <div className="fabric-info-box">
                <h3>{fabric.title.toUpperCase()}</h3>
                <p>{fabric.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Fabrics
