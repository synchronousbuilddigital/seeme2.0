import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from '../hooks/useInView'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './AboutPage.css'

const AboutPage = () => {
  const [heroRef, heroInView] = useInView({ once: true, threshold: 0.1 })
  const [storyRef, storyInView] = useInView({ once: true, threshold: 0.2 })
  const [valuesRef, valuesInView] = useInView({ once: true, threshold: 0.2 })
  
  const values = [
    {
      title: "Artisanal Integrity",
      desc: "Every piece is a dialogue between tradition and the modern soul, crafted by master artisans who have kept heritage alive for generations.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      title: "Sustainable Soul",
      desc: "Our commitment to the earth is as deep as our roots. We use eco-conscious materials and ethical practices to ensure luxury doesn't cost the future.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    {
      title: "Cultural Canvas",
      desc: "SeeMee is more than fashion; it is a canvas where Indian ethnic history meets contemporary silhouettes for the global woman.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )
    }
  ]

  return (
    <div className="about-page">
      {/* Editorial Hero Section */}
      <section ref={heroRef} className="about-hero">
        <motion.div 
          className="hero-image-wrapper"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={heroInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <img 
            src="/images/about/hero.png" 
            alt="SeeMee Heritage" 
            className="hero-img"
          />
          <div className="hero-overlay"></div>
        </motion.div>
        
        <div className="hero-content">
          <motion.span 
            className="hero-label"
            initial={{ y: 20, opacity: 0 }}
            animate={heroInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            ESTABLISHED 2026
          </motion.span>
          <motion.h1 
            className="hero-title"
            initial={{ y: 30, opacity: 0 }}
            animate={heroInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.7, duration: 1 }}
          >
            The Soul of <br/> <span className="italic">Heritage</span>
          </motion.h1>
        </div>
      </section>

      {/* The Story Section */}
      <section ref={storyRef} className="about-story">
        <div className="container">
          <div className="story-grid">
            <motion.div 
              className="story-text"
              initial={{ x: -50, opacity: 0 }}
              animate={storyInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 1 }}
            >
              <h2 className="section-title">Our Narrative</h2>
              <p className="lead-text">
                Born in the heart of artisanal clusters, SeeMee is a testament to the enduring beauty of Indian ethnic craftsmanship. 
              </p>
              <div className="main-text">
                <p>
                  We believe that clothing is an extension of one's history. Our journey began with a simple vision: to bridge the gap between traditional techniques like Zardozi and Banarasi weaving and the dynamic lifestyle of the modern woman.
                </p>
                <p>
                  Each silhouette we create is a labor of love, requiring hundreds of hours of manual precision. We don't just sell fashion; we preserve the rhythmic heartbeat of the handloom and the shimmer of metallic threads that have adorned royalty for centuries.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="story-visual"
              initial={{ x: 50, opacity: 0 }}
              animate={storyInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="image-stack">
                <img 
                  src="/images/about/artisan.png" 
                  alt="Artisan at work" 
                  className="stack-img main"
                />
                <div className="stack-accent"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pull Quote Section */}
      <section className="about-quote">
        <div className="container">
          <motion.blockquote 
            className="editorial-quote"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            "Luxury is not in the price, but in the patience of the hand that crafts it."
            <footer className="quote-footer">— The SEEMEE Ethos</footer>
          </motion.blockquote>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className="about-values">
        <div className="container">
          <h2 className="section-title text-center">Core Pillars</h2>
          <div className="values-grid">
            {values.map((val, i) => (
              <motion.div 
                key={i}
                className="value-card"
                initial={{ y: 30, opacity: 0 }}
                animate={valuesInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: i * 0.2 }}
              >
                <div className="value-icon">{val.icon}</div>
                <h3 className="value-title">{val.title}</h3>
                <p className="value-desc">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Artisans Section */}
      <section className="about-artisans">
        <div className="artisan-banner">
          <img 
            src="https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?auto=format&fit=crop&q=80&w=1500" 
            alt="Artisanal Cluster" 
            className="banner-img"
          />
          <div className="banner-content">
            <h2>Supporting 500+ <br/> <span className="italic">Native Artisans</span></h2>
            <p>Every purchase directly supports rural weaving clusters across India.</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="about-cta">
        <div className="container text-center">
          <h3>Become Part of the Story</h3>
          <p>Explore our latest collections and find your heritage.</p>
          <motion.button 
            className="luxury-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/collections'}
          >
            Shop the Collection
          </motion.button>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
