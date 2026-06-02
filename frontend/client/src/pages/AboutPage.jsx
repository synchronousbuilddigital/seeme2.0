import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from '../hooks/useInView'
import { getOptimizedImageUrl } from '../utils/imageHelper'
import './AboutPage.css'

const AboutPage = () => {
  const navigate = useNavigate()
  const [heroRef, heroInView] = useInView({ once: true, threshold: 0.02 })
  const [storyRef, storyInView] = useInView({ once: true, threshold: 0.02 })
  const [journeyRef, journeyInView] = useInView({ once: true, threshold: 0.02 })
  const [valuesRef, valuesInView] = useInView({ once: true, threshold: 0.02 })
  const [metricsRef, metricsInView] = useInView({ once: true, threshold: 0.02 })
  const [bannerRef, bannerInView] = useInView({ once: true, threshold: 0.02 })

  // State for interactive journey tabs
  const [activeStage, setActiveStage] = useState(0)
  
  // State for metrics hover details
  const [hoveredMetric, setHoveredMetric] = useState(null)

  // State for active core values pillar accordion
  const [activePillar, setActivePillar] = useState(0)

  const journeyStages = [
    {
      number: "01",
      title: "Sourcing Natural Silks & Cottons",
      shortDesc: "Selecting only the finest, long-staple mulberry silks and organic native cottons.",
      detailedDesc: "Our journey begins at the source. We work directly with eco-conscious farmers to harvest pure mulberry silk and native Indian cotton. Every thread is selected for its high tensile strength, natural luster, and breathability, ensuring that the base of each SeeMee garment is of royal heritage caliber.",
      image: "/images/magazine/gold_thread_archive.png",
      stat: "100% Organic Base"
    },
    {
      number: "02",
      title: "The Rhythmic Art of Handloom Weaving",
      shortDesc: "Spinning on traditional wooden pit looms, preserving heritage Banarasi patterns.",
      detailedDesc: "Weaving is the heartbeat of SeeMee. In historic clusters like Varanasi and Maheshwar, our master weavers sit at traditional wooden handlooms, aligning weft and warp in perfect harmony. A single Banarasi sari can take upwards of three weeks of painstaking manual work to complete, forming patterns that machine looms can never replicate.",
      image: "/images/magazine/banarasi_silk_loom.png",
      stat: "Up to 3 Weeks Per Warp"
    },
    {
      number: "03",
      title: "Ornate Zardozi & Aari Embroidery",
      shortDesc: "Intricate metallic needlework hand-crafted by multi-generational artisans.",
      detailedDesc: "Our garments are kissed by gold. Artisans practice Zardozi—the royal Persian art of metallic embroidery—laying down shimmering gold and silver threads, pearls, and precious beads on rich velvet and silk bases. Passed down from father to son, this delicate craft is an extraordinary test of focus, artistry, and heritage precision.",
      image: "/images/magazine/artisan_craftsmanship.png",
      stat: "150+ Hours Needlework"
    },
    {
      number: "04",
      title: "Couture Tailoring & Ethical Quality Curation",
      shortDesc: "Meticulous finishing and pattern drape tailored for the modern global woman.",
      detailedDesc: "Every SeeMee design is hand-finished with meticulous couture seams and premium drape. Our master tailors ensure that while each garment boasts the grandeur of royal Indian silhouettes, it feels weightless, comfortable, and flawlessly structured for the dynamic lifestyle of the modern woman.",
      image: "/images/hero/anarkali_luxury.png",
      stat: "Heirloom Quality Standard"
    }
  ]

  const values = [
    {
      title: "Artisanal Integrity",
      desc: "Every piece is a dialogue between tradition and the modern soul, crafted by master artisans who have kept heritage alive for generations.",
      details: "We reject mass-produced mediocrity. Each garment carries the actual signature of the weaver who wove it, establishing a direct emotional link between modern wardrobe and age-old clusters.",
      image: "/images/magazine/banarasi_weaving.png",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "Sustainable Soul",
      desc: "Our commitment to the earth is as deep as our roots. We use eco-conscious materials and ethical practices to ensure luxury doesn't cost the future.",
      details: "By championing solar-powered spinning charkhas, natural organic dyes, and zero-waste cutting patterns, we ensure that premium couture acts as a positive force for regional ecology.",
      image: "/images/about/artisan.png",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "Cultural Canvas",
      desc: "SeeMee is more than fashion; it is a canvas where Indian ethnic history meets contemporary silhouettes for the global woman.",
      details: "We adapt legendary regional weaves—from the lightweight Chanderi of Madhya Pradesh to the intricate Jamdani of Bengal—to modern structural fits suited for international settings.",
      image: "/images/magazine/anarkali_editorial.png",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ]

  const metrics = [
    {
      value: "500+",
      label: "Artisans Empowered",
      context: "Direct employment provided to rural weavers and embroiderers across India, securing fair living wages.",
      cluster: "Varanasi, Lucknow & Kanchipuram"
    },
    {
      value: "12+",
      label: "Weaving Clusters Saved",
      context: "Actively restoring traditional handloom cooperatives facing extinction due to synthetic power-looms.",
      cluster: "Chanderi, Maheshwar & Bengal"
    },
    {
      value: "100%",
      label: "Ethical & Traceable",
      context: "Every thread is fully transparent, sourced with complete ecological and human dignity.",
      cluster: "Verified Artisanal Hubs"
    },
    {
      value: "150h",
      label: "Couture Devotion",
      context: "The average manual hours spent handcrafting a singular bridal or heirloom heavy weave ensemble.",
      cluster: "Authentic Zardozi Work"
    }
  ]

  return (
    <div className="about-page premium-redesign">
      {/* Elegant Back Navigation */}
      <div className="editorial-back-nav">
        <button onClick={() => navigate(-1)} className="editorial-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back</span>
        </button>
      </div>
      {/* Decorative Brand Monogram Background */}
      <div className="watermark-logo">SEEMEE</div>

      {/* Editorial Hero Section */}
      <section ref={heroRef} className="about-hero-premium">
        <div className="hero-atmosphere">
          <div className="dust-particle p1"></div>
          <div className="dust-particle p2"></div>
          <div className="dust-particle p3"></div>
        </div>

        <motion.div
          className="hero-image-container"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={heroInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src="/images/about/hero.png"
            alt="SeeMee Premium Heritage"
            className="hero-img-parallax"
          />
          <div className="hero-radial-vignette"></div>
          <div className="hero-bottom-shading"></div>
        </motion.div>

        <div className="hero-overlay-content">
          <motion.div
            className="hero-tagline-wrapper"
            initial={{ y: 25, opacity: 0 }}
            animate={heroInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <span className="hero-pre-label">ESTABLISHED IN 2026</span>
            <div className="gold-divider-mini"></div>
            <span className="hero-pre-label">THE ATELIER OF LUXURY</span>
          </motion.div>

          <h1 className="hero-main-title">
            <span className="title-block">
              <motion.span
                initial={{ y: "100%", opacity: 0 }}
                animate={heroInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.7, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                The Soul of
              </motion.span>
            </span>
            <span className="title-block">
              <motion.span
                initial={{ y: "100%", opacity: 0 }}
                animate={heroInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.9, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block accent-gold-cursive"
              >
                Heritage Culture
              </motion.span>
            </span>
          </h1>

          <motion.div 
            className="hero-scroll-indicator"
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 0.8 } : {}}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <span className="scroll-text">DISCOVER THE LEGACY</span>
            <div className="scroll-mouse">
              <div className="mouse-wheel"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Elegant Narrative Section */}
      <section ref={storyRef} className="about-narrative-section">
        <div className="container">
          <div className="narrative-grid">
            <motion.div
              className="narrative-text-box"
              initial={{ y: 40, opacity: 0 }}
              animate={storyInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="editorial-eyebrow">OUR CHRONICLE</span>
              <h2 className="editorial-h2">
                A Rhapsody of <br />
                <span className="serif-italic-accent">Thread & Time</span>
              </h2>
              
              <div className="floral-divider-svg">
                <svg width="60" height="20" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C30 5 30 15 50 10C70 5 70 15 90 10" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round"/>
                  <circle cx="50" cy="10" r="3" fill="#D4AF37"/>
                </svg>
              </div>

              <p className="narrative-lead">
                <span className="drop-cap">B</span>orn within the ancient rhythm of India’s artisanal clusters, SeeMee stands as a living testament to the divine patience of handcrafted luxury.
              </p>

              <div className="narrative-body">
                <p>
                  We believe garments are not merely textiles worn for an hour; they are tactile libraries of human history. Our brand was founded with a singular, quiet purpose: to honor the complex artistic heritage of Zardozi metalwork, Lucknowi Aari, and fine handloom weaves, translating their royal elegance into silhouettes that move effortlessly with the modern woman.
                </p>
                <p>
                  Each SeeMee garment requires hundreds of hours of delicate manual focus. By choosing pure mulberry silk, organic khadi cotton, and authentic golden wire work, we refuse the hurried speed of industrial fast-fashion in favor of the rhythmic, human-centered pulse of the loom.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="narrative-collage-box"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={storyInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <div className="collage-frame-large">
                <img
                  src="/images/about/artisan.png"
                  alt="Traditional Loom Craft"
                  className="collage-image main"
                />
                <div className="frame-gold-border"></div>
              </div>
              <motion.div 
                className="collage-frame-small"
                animate={storyInView ? { y: [-10, 10, -10] } : {}}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/images/about.jpg"
                  alt="Delicate Weaving"
                  className="collage-image accent"
                />
                <div className="accent-glass-badge">HANDWOVEN</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Artisan's Journey (Tabbed Walkthrough) */}
      <section ref={journeyRef} className="about-journey-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="editorial-eyebrow">THE CREATIVE CHRONOLOGY</span>
            <h2 className="editorial-h2 text-center">
              From Sacred Raw Fiber <br />
              <span className="serif-italic-accent">to Timeless Heirloom</span>
            </h2>
            <p className="header-desc text-center">
              Explore our intensive, four-tiered artisanal process where raw earth meets imperial refinement.
            </p>
          </div>

          <div className="journey-interactive-grid">
            {/* Left Side: Steps List */}
            <div className="journey-steps-selector">
              {journeyStages.map((stage, idx) => (
                <button
                  key={idx}
                  className={`journey-step-btn ${activeStage === idx ? 'active' : ''}`}
                  onClick={() => setActiveStage(idx)}
                >
                  <div className="step-num">{stage.number}</div>
                  <div className="step-btn-content">
                    <h3 className="step-btn-title">{stage.title}</h3>
                    <p className="step-btn-short">{stage.shortDesc}</p>
                    <span className="step-btn-stat">{stage.stat}</span>
                  </div>
                  <div className="active-border-gold"></div>
                </button>
              ))}
            </div>

            {/* Right Side: Interactive Image and Expanded Content */}
            <div className="journey-stage-display">
              <div className="display-card-inner">
                <div className="display-image-frame">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeStage}
                      src={journeyStages[activeStage].image}
                      alt={journeyStages[activeStage].title}
                      initial={{ scale: 1.08, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="stage-display-img"
                    />
                  </AnimatePresence>
                  <div className="stage-image-overlay"></div>
                  <div className="stage-card-badge">
                    {journeyStages[activeStage].stat}
                  </div>
                </div>

                <div className="display-content-card">
                  <span className="display-index">STAGE {journeyStages[activeStage].number}</span>
                  <h4 className="display-title">{journeyStages[activeStage].title}</h4>
                  <p className="display-description">
                    {journeyStages[activeStage].detailedDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Pull Quote Section */}
      <section className="about-editorial-quote-section">
        <div className="quote-parallax-bg"></div>
        <div className="container">
          <motion.div
            className="quote-content-wrapper"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
          >
            <span className="quote-icon">“</span>
            <blockquote className="premium-quote-text">
              Luxury is never in the speed of the machine, but in the patience of the hand that coaxes threads into poetry.
            </blockquote>
            <div className="gold-divider-mini central"></div>
            <cite className="premium-quote-author">— THE SEEMEE ETHOS</cite>
          </motion.div>
        </div>
      </section>

      {/* Glassmorphic Core Values Section */}
      <section ref={valuesRef} className="about-values-section">
        <div className="container">
          <div className="section-header-centered">
            <span className="editorial-eyebrow">OUR FOUNDATIONAL VALUES</span>
            <h2 className="editorial-h2 text-center">
              The Three Core <br />
              <span className="serif-italic-accent">Pillars of SeeMee</span>
            </h2>
          </div>

          <div className="pillars-accordion-container">
            {values.map((val, i) => (
              <motion.div
                key={i}
                className={`pillar-accordion-panel ${activePillar === i ? 'active' : ''}`}
                onMouseEnter={() => setActivePillar(i)}
                initial={{ opacity: 0, y: 40 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Background Image Panel */}
                <div className="pillar-panel-bg-wrapper">
                  <img
                    src={val.image}
                    alt={val.title}
                    className="pillar-panel-bg"
                  />
                  <div className="pillar-panel-overlay"></div>
                </div>

                {/* Collapsed State Label */}
                <div className="pillar-collapsed-content">
                  <span className="pillar-collapsed-num">0{i + 1}</span>
                  <h3 className="pillar-collapsed-title">{val.title}</h3>
                  <div className="pillar-collapsed-line"></div>
                </div>

                {/* Expanded Content Card */}
                <div className="pillar-expanded-content">
                  <span className="pillar-expanded-num">PILLAR 0{i + 1}</span>
                  <div className="pillar-expanded-header">
                    <div className="pillar-expanded-icon">{val.icon}</div>
                    <h3 className="pillar-expanded-title">{val.title}</h3>
                  </div>
                  <p className="pillar-expanded-desc">{val.desc}</p>
                  <p className="pillar-expanded-details">{val.details}</p>
                  
                  {/* Decorative seal detail */}
                  <div className="pillar-decorative-seal">
                    <span className="seal-text">SEEMEE • ATELIER</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Metrics Grid */}
      <section ref={metricsRef} className="about-metrics-section">
        <div className="container">
          <div className="metrics-outer-card">
            <div className="metrics-intro-text">
              <span className="editorial-eyebrow">OUR CULTURAL IMPACT</span>
              <h2 className="editorial-h2 reverse-color">
                Refining Lives, <br />
                Preserving Heritages
              </h2>
              <p className="intro-paragraph">
                Our operations go far beyond high fashion. We serve as a direct bridge to native cooperatives, ensuring that our success actively funds rural schooling, health care, and the continuation of ancestral loom crafting techniques.
              </p>
            </div>

            <div className="metrics-interactive-grid">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className={`metric-item-card ${hoveredMetric === idx ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredMetric(idx)}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
                  <div className="metric-header">
                    <span className="metric-number-val">{metric.value}</span>
                    <span className="metric-label-val">{metric.label}</span>
                  </div>
                  
                  <div className="metric-interactive-area">
                    <p className="metric-desc-text">{metric.context}</p>
                    <div className="metric-cluster-pill">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {metric.cluster}
                    </div>
                  </div>
                  
                  {/* Fine Line Design Accents */}
                  <div className="card-corner top-left"></div>
                  <div className="card-corner bottom-right"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Artisan Atelier Immersive Banner */}
      <section ref={bannerRef} className="about-artisans-immersive">
        <div className="immersive-banner-wrapper">
          <img
            src="/images/magazine/banarasi_weaving.png"
            alt="Handcrafting Weaves"
            className="immersive-banner-bg"
          />
          <div className="immersive-banner-overlay"></div>
          
          <motion.div
            className="immersive-banner-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={bannerInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="banner-badge">DIRECT SUSTAINABILITY</span>
            <h2>Supporting 500+ <br /> <span className="serif-italic-accent">Native Artisans</span></h2>
            <div className="gold-divider-mini central"></div>
            <p>
              Every single hand-drawn needlework pattern and loom spin directly funds village development projects, supporting female weaver cooperatives and traditional artisans across 12+ historic craft centers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Premium invitation CTA */}
      <section className="about-cta-premium">
        <div className="cta-atmosphere-blobs">
          <div className="blob b1"></div>
          <div className="blob b2"></div>
        </div>
        
        <div className="container">
          <div className="cta-bordered-envelope">
            <span className="cta-eyebrow">AN INVITATION</span>
            <h3 className="cta-title">Become Part of the Legacy</h3>
            <p className="cta-description">
              Step into the heritage of tomorrow. Indulge in silhouettes woven by the meticulous patience of ancestral hands.
            </p>
            
            <div className="cta-button-group">
              <motion.button
                className="luxury-gold-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/collections'}
              >
                <span className="btn-label-text">Explore the Collections</span>
                <span className="btn-arrow-slide">
                  <svg width="22" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 7H21.5M21.5 7L15.5 1M21.5 7L15.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
