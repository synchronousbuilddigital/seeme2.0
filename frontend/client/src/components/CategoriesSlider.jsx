import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '../config/api'
import { getImageUrl } from '../utils/imageHelper'
import { cachedFetch } from '../utils/cachedFetch'
import './CategoriesSlider.css'

const CategoriesSlider = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const categoryDefaults = {
    '2-piece-sets': {
      title: 'Summer Dress Collection',
      subtitle: 'Fit with the latest trends',
      description: 'Fit with the latest trends',
      image: '/images/categories_straight.jpg',
      features: ['Tailored Silhouette', 'Fluid Trousers', 'Premium Comfort']
    },
    '3-piece-sets': {
      title: 'Autumn Essentials',
      subtitle: 'Warm and cozy for the colder months',
      description: 'Warm and cozy for the colder months',
      image: '/images/ruby_bridal_sharara.png',
      features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta']
    },
    'co-ord-sets': {
      title: 'Winter Collection',
      subtitle: 'Colorful for the festive season',
      description: 'Colorful for the festive season',
      image: '/images/categories_straight.jpg',
      features: ['Avant-garde Cut', 'Symmetric Drapes', 'Modern Aesthetic']
    },
    'anarkali-sets': {
      title: 'Spring Accessories',
      subtitle: 'Hidden treasures for the spring season',
      description: 'Hidden treasures for the spring season',
      image: '/images/ruby_bridal_sharara.png',
      features: ['Grand Flare', 'Pure Dupatta', 'Heritage Weave']
    }
  }

  const navigate = useNavigate()

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const prodData = await cachedFetch(API_ENDPOINTS.PRODUCTS)
        const activeProducts = prodData.success && prodData.data
          ? prodData.data.filter(p => p.isActive)
          : []

        const settingsData = await cachedFetch(API_ENDPOINTS.SITE_SETTINGS, { forceRefresh: true })

        let categoryList = []

        if (settingsData.success && settingsData.data && settingsData.data.categorySlides && settingsData.data.categorySlides.length > 0) {
          categoryList = settingsData.data.categorySlides
        } else {
          categoryList = [
            {
              slug: '2-piece-sets',
              title: '2-Piece Sets',
              subtitle: 'Fit with the latest trends',
              description: 'Fit with the latest trends',
              features: ['Tailored Tunic', 'Fluid Trousers', 'Premium Comfort'],
              image: '/images/categories_straight.jpg',
              order: 0
            },
            {
              slug: '3-piece-sets',
              title: '3-Piece Sets',
              subtitle: 'Warm and cozy for the colder months',
              description: 'Warm and cozy for the colder months',
              features: ['Heritage Kurta', 'Symmetric Pants', 'Adorned Dupatta'],
              image: '/images/ruby_bridal_sharara.png',
              order: 1
            },
            {
              slug: 'co-ord-sets',
              title: 'Co-ord Sets',
              subtitle: 'Colorful for the festive season',
              description: 'Colorful for the festive season',
              features: ['Avant-garde Structure', 'Symmetric Drapes', 'Modern Aesthetic'],
              image: '/images/categories_straight.jpg',
              order: 2
            }
            
          ]
        }

        const mappedCategories = categoryList.map((cat, index) => {
          const normCatSlug = cat.slug ? cat.slug.toLowerCase().replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '') : ''
          const matchingProds = activeProducts.filter(p => {
            if (!p.category) return false
            const normPCat = p.category.toLowerCase().replace(/sets?$/g, '').replace(/[^a-z0-9]/g, '')
            return normPCat === normCatSlug || p.category.toLowerCase() === cat.slug?.toLowerCase()
          })
          const matchedProduct = matchingProds[0]
          const fallback = categoryDefaults[cat.slug?.toLowerCase()]

          const prodImg = matchedProduct && (matchedProduct.images?.[0] || matchedProduct.image)
          const poolImg = activeProducts[index % activeProducts.length]?.images?.[0] || activeProducts[index % activeProducts.length]?.image

          return {
            ...cat,
            indexCode: `0${index + 1}`,
            productCount: matchingProds.length || (cat.slug === '2-piece-sets' ? 14 : cat.slug === '3-piece-sets' ? 18 : 12),
            features: cat.features && cat.features.length ? cat.features : (fallback?.features || ['Luxury Tailoring', 'Pure Fabrics', 'Editorial Cut']),
            subtitle: cat.subtitle || fallback?.subtitle || 'Atelier Collection',
            description: cat.description || fallback?.description || 'Exquisite artisanal creations.',
            image: cat.image || prodImg || poolImg || 'https://res.cloudinary.com/dnuucbhwa/image/upload/v1779637240/seemee/categories/hws0gj5ey5hwxrbamgfu.png'
          }
        })

        setCategories(mappedCategories)
      } catch (err) {
        console.error('Error fetching category assets:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  if (loading || categories.length === 0) return null

  return (
    <section className="categories-runway-section" id="categories">
      <div className="categories-container">
        {/* Header Section */}
        <motion.div
          className="categories-header"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="categories-header-left">
            <span className="categories-badge-tag">✦ SEEMEE ATELIER</span>
            <h2 className="categories-title">
              Signature <span>Categories</span>
            </h2>
            <p className="categories-subtitle">
              Explore 2-piece tunics, 3-piece regal ensembles & sleek co-ord sets.
            </p>
          </div>
        </motion.div>

        {/* Categories Grid - 4 Columns matching reference screenshot */}
        <motion.div className="categories-ref-grid" layout>
          <AnimatePresence mode="popLayout">
            {categories.map((cat, idx) => {
              return (
                <motion.div
                  key={cat._id || cat.slug || idx}
                  className="ref-category-card"
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.25, 1, 0.5, 1] }}
                  whileHover={{ y: -8 }}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                >
                  <div className="ref-card-media-box">
                    <img
                      src={getImageUrl(cat.image)}
                      alt={cat.title}
                      onError={(e) => { e.target.src = '/images/categories_straight.jpg' }}
                      loading="lazy"
                    />

                    {/* Dark gradient overlay for clear white text readability */}
                    <div className="ref-card-gradient" />

                    {/* Bottom overlay section - full content shown on hover */}
                    <div className="ref-card-bottom">
                      <div className="ref-card-text">
                        {cat.productCount ? (
                          <span className="ref-card-meta">✦ {cat.productCount} Designs</span>
                        ) : null}
                        <h3 className="ref-card-title">{cat.title}</h3>
                        <p className="ref-card-subtitle">
                          {cat.description || cat.subtitle}
                        </p>
                        {cat.features && cat.features.length > 0 && (
                          <div className="ref-card-chips">
                            {cat.features.slice(0, 2).map((feat, fIdx) => (
                              <span key={fIdx} className="ref-chip-item">{feat}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Translucent glass circular up-right arrow button */}
                      <div className="ref-arrow-button">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

export default CategoriesSlider

