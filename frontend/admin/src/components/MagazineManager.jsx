import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest } from '../utils/apiClient'
import { getImageUrl } from '../utils/imageHelper'
import './MagazineManager.css'

const defaultStories = [
  {
    chapter: 'CHAPTER 01',
    title: 'Silk and the River City',
    subtitle: 'The Banaras Loom as a Living Chronicle',
    description: 'The Banarasi loom turns repetition into ritual. Every shuttle movement carries a tempo that has outlived trends, and every finished textile becomes a reminder that cloth can contain geography, labor, and inheritance at once. This chapter follows the loom room from daylight to dusk, moving past dye vats, thread books, and folded lengths of silk waiting for their last inspection.',
    image: '',
    category: 'Craftsmanship',
    author: 'Julian Thorne',
    quote: 'A woven fabric can be read the way a city is read: slowly, by layers.',
    readTime: '7 MIN READ',
    date: 'MAY 2026',
    sections: [
      'The first paragraph introduces the loom room and the steady rhythm that shapes the cloth before it even leaves the frame.',
      'The second section studies the pattern books, where traditional references are reworked into a modern sequence of color and texture.',
      'The final section follows the garment into the wardrobe, where the textile becomes part of a contemporary silhouette.'
    ],
    highlights: ['Banarasi pattern books', 'Textile density and drape', 'Heritage weave reinterpreted for today'],
    marginalia: 'Reading cue: Notice how the story moves from architecture to intimacy, as if the weave were drawing a floor plan.',
    order: 0
  },
  {
    chapter: 'CHAPTER 02',
    title: 'The Banarasi Weaving Legacy',
    subtitle: 'A Symphony of Gold and Pure Silk Threads',
    description: 'From the looms of Varanasi to the modern wardrobe. Discover how we preserve the intricate patterns of traditional Banarasi silk while adapting them for the contemporary woman. A celebration of texture, heritage, and the dedicated hands that guide every metallic thread through the loom to form legendary motifs.',
    image: '',
    category: 'Heritage',
    author: 'Elena Rossi',
    quote: 'We do not just weave silk; we weave the stories of generations.',
    readTime: '8 MIN READ',
    date: 'APRIL 2026',
    sections: [
      'The opening spread traces the first sketch, where the motif is scaled, softened, and translated into thread.',
      'The middle pages move through the handwork itself, where gold tones are layered, pressed, and secured by eye.',
      'The closing note records the finishing stage, when the garment is inspected, stored, and prepared like an archive piece.'
    ],
    highlights: ['Intricate floral patterns', 'Pure mulberry silk threads', 'Traditional metallic borders'],
    marginalia: 'Library note: This story reads like a conservator\'s log, preserving process as carefully as the garment itself.',
    order: 1
  },
  {
    chapter: 'CHAPTER 03',
    title: 'Atelier of Grandeur',
    subtitle: 'Step Inside the World of Precision Tailoring',
    description: 'Step inside the SEEMEE design studio where royal grandeur meets modern ease. Every cut is measured with spatial precision, every embroidery pattern is placed to silhouette the form, and every seam is hand-finished. We balance ancestral skills with contemporary tailoring, ensuring every single dress carries the human soul inside.',
    image: '',
    category: 'Atelier',
    author: 'Aria Varma',
    quote: 'The best craftsmanship never shouts. It is felt in the weight and drape of the fabric.',
    readTime: '6 MIN READ',
    date: 'MARCH 2026',
    sections: [
      'The opening spread explains the silhouette, showing how a classic frame is widened, refined, and made easier to wear.',
      'The middle section focuses on surface treatment, where embroidery and seams are placed to guide the eye rather than overwhelm it.',
      'The closing note speaks to wearability, reminding the reader that beauty must still live in the body that carries it.'
    ],
    highlights: ['Comfort-led bespoke tailoring', 'Hand-guided embroidery', 'Architectural pattern-cutting'],
    marginalia: 'Workshop note: The pattern reads like a diagram, but the garment reads like a gesture.',
    order: 2
  },
  {
    chapter: 'CHAPTER 04',
    title: 'The Architecture of the Loom',
    subtitle: 'Where Handloom Mechanics Meet Artistic Vision',
    description: 'A study of the mechanical elegance of hand-operated looms. The warp holds the tension of history while the weft introduces the variable paths of human touch. Here, we analyze how jacquard cards translate complex botanical drawings into textile relief, showing that the loom is both a machine and an extension of the weaver\'s imagination.',
    image: '',
    category: 'Mechanics',
    author: 'Kavya Singh',
    quote: 'Every thread is a choice, and every pick is a second in the weaver\'s day.',
    readTime: '7 MIN READ',
    date: 'FEBRUARY 2026',
    sections: [
      'The first passage explains warp preparation, where hundreds of silk threads are combed and aligned.',
      'The second section details the weft insertions and the rhythmic click-clack of the shuttle in motion.',
      'The final spread shows how the pattern emerges, row by row, as a physical archive of patience.'
    ],
    highlights: ['Hand-crafted wooden frames', 'Botanical card systems', 'Precision warp alignment'],
    marginalia: 'Studio note: The physical setup of the warp takes three weeks, before a single inch of silk is woven.',
    order: 3
  },
  {
    chapter: 'CHAPTER 05',
    title: 'The Weight of Velvet',
    subtitle: 'Nocturnal Elegance and the Draped Silhouette',
    description: 'As the sun sets, the richness of royal velvet takes center stage. Our nocturnal collection features deep emeralds and midnight tones, hand-embroidered with tilla work that captures the moon\'s reflection. Here, we explore the physical weight and drape of velvet, showing how it falls in heavy, majestic drapes while remaining incredibly soft and fluid.',
    image: '',
    category: 'Nocturnal',
    author: 'Mira Kapoor',
    quote: 'Velvet absorbs light and holds shadow, creating a deep dimension that silk cannot match.',
    readTime: '5 MIN READ',
    date: 'JANUARY 2026',
    sections: [
      'The opening note describes the pile of velvet, explaining how it feels against the skin.',
      'The second passage details the hand-applied tilla embroidery, where silver threads are locked into the velvet fabric.',
      'The final page reads like an invitation to slow luxury, celebrating velvet\'s timeless, majestic presence.'
    ],
    highlights: ['Deep jewel tones', 'Hand-stitched silver tilla', 'Nocturnal design aesthetic'],
    marginalia: 'Archive note: A well-made garment should be readable years later, not just memorable on the day it is worn.',
    order: 4
  }
]

const MagazineManager = () => {
  const [magazineStories, setMagazineStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingStory, setEditingStory] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [formTab, setFormTab] = useState('general') // 'general' | 'content' | 'media'
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const emptyStory = {
    chapter: 'CHAPTER 01',
    title: '',
    subtitle: '',
    category: 'Craftsmanship',
    author: 'SEEMEE Atelier',
    date: 'MAY 2026',
    readTime: '5 MIN READ',
    quote: '',
    description: '',
    image: '',
    sectionsInput: '',
    highlightsInput: '',
    marginalia: '',
    order: 0
  }

  useEffect(() => {
    fetchMagazines()
  }, [])

  const fetchMagazines = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(API_ENDPOINTS.MAGAZINE_ALL, { auth: true })
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setMagazineStories(data.data)
      } else {
        const settingsRes = await apiRequest(API_ENDPOINTS.SITE_SETTINGS)
        if (settingsRes?.success && Array.isArray(settingsRes.data?.magazineStories) && settingsRes.data.magazineStories.length > 0) {
          setMagazineStories(settingsRes.data.magazineStories)
        } else {
          setMagazineStories(defaultStories)
        }
      }
    } catch (error) {
      console.error('Error fetching magazine stories:', error)
      showNotification('Failed to fetch magazine stories', 'error')
      setMagazineStories(defaultStories)
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
  }

  const closeModal = () => {
    setEditingStory(null)
    setIsAdding(false)
    setEditingIndex(null)
    setFormTab('general')
  }

  const handleEdit = (story, index) => {
    setEditingIndex(index)
    setIsAdding(false)
    setFormTab('general')
    setEditingStory({
      ...story,
      sectionsInput: Array.isArray(story.sections) ? story.sections.join('\n\n') : (story.sections || ''),
      highlightsInput: Array.isArray(story.highlights) ? story.highlights.join(', ') : (story.highlights || '')
    })
  }

  const handleAddNew = () => {
    const nextChapterNum = String(magazineStories.length + 1).padStart(2, '0')
    setEditingIndex(null)
    setIsAdding(true)
    setFormTab('general')
    setEditingStory({
      ...emptyStory,
      chapter: `CHAPTER ${nextChapterNum}`,
      order: magazineStories.length
    })
  }

  const handleDelete = async (indexToDelete) => {
    if (!window.confirm('Are you sure you want to delete this magazine booklet story?')) return

    try {
      const targetStory = magazineStories[indexToDelete]
      if (targetStory?._id) {
        const res = await apiRequest(`${API_ENDPOINTS.MAGAZINE}/${targetStory._id}`, {
          method: 'DELETE',
          auth: true
        })
        if (res?.success) {
          setMagazineStories(prev => prev.filter((_, idx) => idx !== indexToDelete))
          showNotification('Magazine story deleted successfully')
          return
        }
      }

      // Fallback for settings array
      const updatedStories = magazineStories.filter((_, idx) => idx !== indexToDelete)
      await apiRequest(API_ENDPOINTS.SITE_SETTINGS, {
        method: 'PUT',
        auth: true,
        body: { magazineStories: updatedStories }
      })
      setMagazineStories(updatedStories)
      showNotification('Magazine story deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      showNotification('Failed to delete magazine story', 'error')
    }
  }

  // Fast client-side image downscaling/compression before network POST
  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (file.size < 400 * 1024 || !file.type.startsWith('image/')) {
        return resolve(file)
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const MAX_SIZE = 1600
          let width = img.width
          let height = img.height

          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            } else {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file)
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            },
            'image/webp',
            0.82
          )
        }
        img.onerror = () => resolve(file)
      }
      reader.onerror = () => resolve(file)
    })
  }

  const handleImageUpload = async (rawFile) => {
    if (!rawFile) return

    if (!rawFile.type.startsWith('image/')) {
      showNotification('Please select a valid image file', 'error')
      return
    }
    
    setUploading(true)
    setUploadProgress(25)

    try {
      // Instant client-side downscaling & WebP compression
      const file = await compressImage(rawFile)
      setUploadProgress(65)

      const formData = new FormData()
      formData.append('folder', 'seemee/magazine')
      formData.append('image', file)

      const data = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: formData
      })

      setUploadProgress(100)

      let uploadedUrl = ''
      if (data?.success) {
        if (data.data?.url) uploadedUrl = data.data.url
        else if (Array.isArray(data.data) && data.data[0]?.url) uploadedUrl = data.data[0].url
        else if (data.url) uploadedUrl = data.url
      }

      if (uploadedUrl) {
        setEditingStory(prev => prev ? ({ ...prev, image: uploadedUrl }) : null)
        showNotification('Cover photo uploaded!')
      } else {
        showNotification('Upload completed, but no image URL received.', 'error')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showNotification('Failed to upload image: ' + error.message, 'error')
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 250)
    }
  }

  const handleQuickImageUpload = async (rawFile, targetStory) => {
    if (!rawFile || !targetStory) return

    if (!rawFile.type.startsWith('image/')) {
      showNotification('Please select a valid image file', 'error')
      return
    }

    try {
      showNotification('Uploading cover photo...', 'info')
      const file = await compressImage(rawFile)

      const formData = new FormData()
      formData.append('folder', 'seemee/magazine')
      formData.append('image', file)

      const data = await apiRequest(API_ENDPOINTS.UPLOAD.IMAGE, {
        method: 'POST',
        auth: true,
        isFormData: true,
        body: formData
      })

      let uploadedUrl = ''
      if (data?.success) {
        if (data.data?.url) uploadedUrl = data.data.url
        else if (Array.isArray(data.data) && data.data[0]?.url) uploadedUrl = data.data[0].url
        else if (data.url) uploadedUrl = data.url
      }

      if (uploadedUrl) {
        if (targetStory._id) {
          const updateRes = await apiRequest(`${API_ENDPOINTS.MAGAZINE}/${targetStory._id}`, {
            method: 'PUT',
            auth: true,
            body: { ...targetStory, image: uploadedUrl }
          })
          if (updateRes.success) {
            await fetchMagazines()
            showNotification('Cover photo updated!')
          }
        } else {
          const updateRes = await apiRequest(API_ENDPOINTS.MAGAZINE, {
            method: 'POST',
            auth: true,
            body: { ...targetStory, image: uploadedUrl }
          })
          if (updateRes.success) {
            await fetchMagazines()
            showNotification('Cover photo updated!')
          }
        }
      } else {
        showNotification('Upload failed to parse returned URL.', 'error')
      }
    } catch (error) {
      showNotification('Failed to upload image: ' + error.message, 'error')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editingStory || !editingStory.title || !editingStory.description) {
      showNotification('Please fill in required fields (Title & Description)', 'error')
      return
    }

    setIsSaving(true)
    try {
      const formattedStory = {
        ...editingStory,
        sections: typeof editingStory.sectionsInput === 'string'
          ? editingStory.sectionsInput.split('\n\n').map(s => s.trim()).filter(Boolean)
          : (editingStory.sections || []),
        highlights: typeof editingStory.highlightsInput === 'string'
          ? editingStory.highlightsInput.split(',').map(h => h.trim()).filter(Boolean)
          : (editingStory.highlights || [])
      }

      delete formattedStory.sectionsInput
      delete formattedStory.highlightsInput

      let res
      if (formattedStory._id) {
        res = await apiRequest(`${API_ENDPOINTS.MAGAZINE}/${formattedStory._id}`, {
          method: 'PUT',
          auth: true,
          body: formattedStory
        })
      } else {
        res = await apiRequest(API_ENDPOINTS.MAGAZINE, {
          method: 'POST',
          auth: true,
          body: formattedStory
        })
      }

      if (res?.success) {
        await fetchMagazines()
        closeModal()
        showNotification(isAdding ? 'Chapter created successfully!' : 'Chapter updated successfully!')
      } else {
        // Fallback for settings update if _id is not present
        const currentList = [...magazineStories]
        if (isAdding) {
          currentList.push(formattedStory)
        } else if (editingIndex !== null && editingIndex >= 0 && editingIndex < currentList.length) {
          currentList[editingIndex] = formattedStory
        }

        const settingsData = await apiRequest(API_ENDPOINTS.SITE_SETTINGS, {
          method: 'PUT',
          auth: true,
          body: { magazineStories: currentList }
        })

        if (settingsData.success) {
          await fetchMagazines()
          closeModal()
          showNotification(isAdding ? 'Chapter created successfully!' : 'Chapter updated successfully!')
        } else {
          showNotification(settingsData.message || 'Failed to save story', 'error')
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      showNotification('Failed to save story: ' + error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="magazine-loading-shell">
        <div className="mag-spinner"></div>
        <p>Loading Magazine Atelier Archive...</p>
      </div>
    )
  }

  const stories = magazineStories.length > 0 ? magazineStories : defaultStories

  const filteredStories = stories.filter(story => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (story.title && story.title.toLowerCase().includes(term)) ||
      (story.chapter && story.chapter.toLowerCase().includes(term)) ||
      (story.category && story.category.toLowerCase().includes(term)) ||
      (story.author && story.author.toLowerCase().includes(term))
    )
  })

  return (
    <div className="editorial-magazine-manager">
      <AnimatePresence>
        {notification.show && (
          <motion.div
            className={`admin-toast-luxury ${notification.type}`}
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
          >
            <span className="toast-icon">✦</span>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redesigned Glassmorphic Header */}
      <div className="mag-header-card">
        <div className="header-left-col">
          <div className="brand-chip">
            <span className="star">✦</span>
            <span>JOURNAL & BOOKLET ATELIER</span>
          </div>
          <h1 className="mag-section-title">Storefront Magazine Spreads</h1>
          <p className="mag-section-desc">
            Curate chapter photography, editorial marginalia, and hand-woven storytelling for the Storefront Magazine 3D Booklet.
          </p>
        </div>

        <div className="header-actions-col">
          <div className="chapter-count-pill">
            <span className="num">{stories.length}</span>
            <span className="lbl">Active Chapters</span>
          </div>
          <button className="create-chapter-btn" onClick={handleAddNew}>
            + Create New Chapter
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mag-toolbar">
        <div className="mag-search-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="search"
            placeholder="Search chapters by title, category, author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mag-search-input"
          />
        </div>
        <div className="mag-toolbar-info">
          Showing <strong>{filteredStories.length}</strong> of {stories.length} chapters
        </div>
      </div>

      {/* Editorial Stories Cards Grid */}
      <div className="editorial-stories-grid">
        {filteredStories.map((story, index) => (
          <motion.div
            key={story._id || `story-${index}`}
            className="editorial-story-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            {/* Aspect Ratio Media Preview */}
            <div className="story-media-box">
              {story.image ? (
                <>
                  <img src={getImageUrl(story.image)} alt={story.title} className="story-cover-img" />
                  <div className="story-overlay-gradient"></div>
                </>
              ) : (
                <div className="no-cover-placeholder">
                  <span className="placeholder-icon">✦</span>
                  <span className="placeholder-text">NO COVER IMAGE</span>
                  <span className="placeholder-sub">Click to Upload Photo</span>
                </div>
              )}
              
              <div className="chapter-gold-chip">
                {story.chapter || `CHAPTER 0${index + 1}`}
              </div>

              {/* Quick Image Replacement Hover Overlay */}
              <div className="card-hover-actions">
                <label className="quick-upload-btn" title="Upload / Replace Image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                  <span>{story.image ? 'Change Image' : 'Upload Cover Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleQuickImageUpload(e.target.files[0], story)}
                  />
                </label>
              </div>
            </div>

            {/* Story Content Details */}
            <div className="story-card-body">
              <div className="category-meta-line">
                <span className="cat-chip">{story.category || 'Craftsmanship'}</span>
                <span className="read-time">{story.readTime || '5 MIN'}</span>
              </div>

              <h3 className="story-card-title">{story.title}</h3>
              <p className="story-card-subtitle">{story.subtitle}</p>
              
              <p className="story-card-excerpt">{story.description}</p>

              {story.quote && (
                <div className="story-quote-preview">
                  <span className="quote-mark">“</span>
                  <p>{story.quote}</p>
                </div>
              )}

              <div className="story-card-footer">
                <div className="author-pill">
                  <span className="author-icon">✍</span>
                  <span className="author-name">{story.author || 'SEEMEE Atelier'}</span>
                </div>
                <span className="story-date">{story.date || '2026'}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="story-card-actions">
              <button className="btn-story-edit" onClick={() => handleEdit(story, index)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit Chapter</span>
              </button>
              <button className="btn-story-delete" onClick={() => handleDelete(index)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </motion.div>
        ))}

        {filteredStories.length === 0 && (
          <div className="mag-empty-state">
            <div className="empty-feather-icon">✦</div>
            <h3>No Chapters Found</h3>
            <p>No magazine stories match your search criteria. Try a different keyword or create a new chapter.</p>
          </div>
        )}
      </div>

      {/* Redesigned Tabbed Form Drawer */}
      <AnimatePresence>
        {Boolean(editingStory) && (
          <div className="modal-overlay" onClick={closeModal}>
            <motion.div
              className="editorial-drawer"
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 120 }}
              transition={{ damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-topbar">
                <div>
                  <span className="drawer-subtitle">{isAdding ? 'NEW CREATION' : 'EDITING SPREAD'}</span>
                  <h2 className="drawer-title">{isAdding ? 'New Magazine Chapter' : editingStory?.title || 'Edit Chapter'}</h2>
                </div>
                <button type="button" className="drawer-close-btn" onClick={closeModal}>&times;</button>
              </div>

              {/* Form Navigation Tabs */}
              <div className="drawer-tabs">
                <button className={formTab === 'general' ? 'tab-btn active' : 'tab-btn'} onClick={() => setFormTab('general')}>
                  General Info
                </button>
                <button className={formTab === 'content' ? 'tab-btn active' : 'tab-btn'} onClick={() => setFormTab('content')}>
                  Story Content
                </button>
                <button className={formTab === 'media' ? 'tab-btn active' : 'tab-btn'} onClick={() => setFormTab('media')}>
                  Cover & Media
                </button>
              </div>

              {editingStory && (
                <form onSubmit={handleSave} className="drawer-form-body">
                  {formTab === 'general' && (
                    <div className="form-tab-pane">
                      <div className="form-grid-2">
                        <div className="input-group">
                          <label>Chapter Tag *</label>
                          <input
                            type="text"
                            value={editingStory.chapter || ''}
                            onChange={(e) => setEditingStory({ ...editingStory, chapter: e.target.value })}
                            required
                            placeholder="e.g. CHAPTER 01"
                          />
                        </div>
                        <div className="input-group">
                          <label>Category *</label>
                          <input
                            type="text"
                            value={editingStory.category || ''}
                            onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
                            required
                            placeholder="e.g. Heritage, Atelier, Craftsmanship"
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Story Title *</label>
                        <input
                          type="text"
                          value={editingStory.title || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                          required
                          placeholder="e.g. Silk and the River City"
                        />
                      </div>

                      <div className="input-group">
                        <label>Subtitle / Headline</label>
                        <input
                          type="text"
                          value={editingStory.subtitle || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, subtitle: e.target.value })}
                          placeholder="e.g. The Banaras Loom as a Living Chronicle"
                        />
                      </div>

                      <div className="form-grid-2">
                        <div className="input-group">
                          <label>Author Name</label>
                          <input
                            type="text"
                            value={editingStory.author || ''}
                            onChange={(e) => setEditingStory({ ...editingStory, author: e.target.value })}
                            placeholder="e.g. Julian Thorne"
                          />
                        </div>
                        <div className="input-group">
                          <label>Publication Date</label>
                          <input
                            type="text"
                            value={editingStory.date || ''}
                            onChange={(e) => setEditingStory({ ...editingStory, date: e.target.value })}
                            placeholder="MAY 2026"
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>Read Time Display</label>
                        <input
                          type="text"
                          value={editingStory.readTime || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, readTime: e.target.value })}
                          placeholder="e.g. 7 MIN READ"
                        />
                      </div>
                    </div>
                  )}

                  {formTab === 'content' && (
                    <div className="form-tab-pane">
                      <div className="input-group">
                        <label>Editorial Quote</label>
                        <input
                          type="text"
                          value={editingStory.quote || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, quote: e.target.value })}
                          placeholder='e.g. "A woven fabric can be read the way a city is read..."'
                        />
                      </div>

                      <div className="input-group">
                        <label>Story Overview / Excerpt *</label>
                        <textarea
                          rows="4"
                          value={editingStory.description || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, description: e.target.value })}
                          required
                          placeholder="Detailed overview for the booklet spread..."
                        />
                      </div>

                      <div className="input-group">
                        <label>Spreads / Paragraph Sections (Separate paragraphs with a blank line)</label>
                        <textarea
                          rows="5"
                          value={editingStory.sectionsInput || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, sectionsInput: e.target.value })}
                          placeholder="Paragraph 1...\n\nParagraph 2..."
                        />
                      </div>

                      <div className="input-group">
                        <label>Key Highlights / Bullet Tags (Comma separated)</label>
                        <input
                          type="text"
                          value={editingStory.highlightsInput || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, highlightsInput: e.target.value })}
                          placeholder="Banarasi pattern books, Heritage weaves, Mulberry Silk"
                        />
                      </div>

                      <div className="input-group">
                        <label>Marginalia / Reader Note</label>
                        <input
                          type="text"
                          value={editingStory.marginalia || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, marginalia: e.target.value })}
                          placeholder="e.g. Reading cue: Notice how the story moves from architecture to intimacy..."
                        />
                      </div>
                    </div>
                  )}

                  {formTab === 'media' && (
                    <div className="form-tab-pane">
                      <div className="input-group">
                        <label>Chapter Cover Image *</label>

                        {/* Image Dropzone / Preview */}
                        <div
                          className={`media-upload-dropzone ${uploading ? 'uploading' : ''}`}
                          onClick={() => !uploading && document.getElementById('mag-img-file').click()}
                        >
                          {uploading ? (
                            <div className="upload-progress-box">
                              <div className="gold-spinner"></div>
                              <p>Uploading high-res editorial photo...</p>
                              <div className="progress-bar">
                                <motion.div
                                  className="progress-fill"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="progress-text">{uploadProgress}% Complete</span>
                            </div>
                          ) : editingStory.image ? (
                            <div className="active-img-preview">
                              <img src={getImageUrl(editingStory.image)} alt="Chapter Cover" />
                              <div className="preview-overlay">
                                <span>Click to Replace Photo</span>
                              </div>
                            </div>
                          ) : (
                            <div className="empty-upload-prompt">
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                              <p className="prompt-main">Drop Chapter Image Here</p>
                              <p className="prompt-sub">Supports JPG, PNG, WEBP up to 10MB</p>
                            </div>
                          )}
                          <input
                            id="mag-img-file"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageUpload(e.target.files[0])}
                          />
                        </div>
                      </div>

                      <div className="input-group mt-3">
                        <label>Or Enter Web Image URL</label>
                        <input
                          type="text"
                          value={editingStory.image || ''}
                          onChange={(e) => setEditingStory({ ...editingStory, image: e.target.value })}
                          placeholder="https://example.com/image.jpg or /images/magazine/photo.png"
                        />
                      </div>
                    </div>
                  )}

                  <div className="drawer-footer-row">
                    <button type="button" className="btn-cancel" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-save-gold" disabled={isSaving}>
                      {isSaving ? 'Saving Chapter...' : 'Save Chapter Spreads'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MagazineManager
