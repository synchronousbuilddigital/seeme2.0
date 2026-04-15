import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getImageUrl } from '../../../utils/imageHelper'
import './CarouselManager.css'

const CarouselManager = () => {
  const [carouselImages, setCarouselImages] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingImage, setEditingImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    image: '',
    title: '',
    subtitle: '',
    order: 0
  })

  useEffect(() => {
    fetchCarouselImages()
  }, [])

  const fetchCarouselImages = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/carousel/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setCarouselImages(data.data)
      }
    } catch (error) {
      console.error('Error fetching carousel images:', error)
    }
  }

  const handleImageUpload = async (file) => {
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadFormData
      })

      const data = await response.json()
      if (data.success) {
        setFormData(prev => ({ ...prev, image: data.data.url }))
        alert('Image uploaded successfully!')
      }
    } catch (error) {
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.image) {
      alert('Please upload an image')
      return
    }
    
    try {
      const token = localStorage.getItem('adminToken')
      const url = editingImage 
        ? `/api/carousel/${editingImage._id}`
        : '/api/carousel'
      
      const response = await fetch(url, {
        method: editingImage ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        fetchCarouselImages()
        resetForm()
        alert(editingImage ? 'Carousel image updated!' : 'Carousel image created!')
      } else {
        alert(data.message || 'Failed to save carousel image')
      }
    } catch (error) {
      alert('Failed to save carousel image')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this carousel image?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/carousel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        fetchCarouselImages()
        alert('Carousel image deleted!')
      }
    } catch (error) {
      alert('Failed to delete carousel image')
    }
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken')
      const image = carouselImages.find(img => img._id === id)
      
      const response = await fetch(`/api/carousel/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...image,
          isActive: !currentStatus
        })
      })

      const data = await response.json()
      if (data.success) {
        fetchCarouselImages()
      }
    } catch (error) {
      alert('Failed to toggle status')
    }
  }

  const resetForm = () => {
    setFormData({
      image: '',
      title: '',
      subtitle: '',
      order: carouselImages.length
    })
    setEditingImage(null)
    setShowForm(false)
  }

  const startEdit = (image) => {
    setFormData({
      image: image.image,
      title: image.title,
      subtitle: image.subtitle,
      order: image.order
    })
    setEditingImage(image)
    setShowForm(true)
  }

  const seedDefaultImages = async () => {
    if (!confirm('This will create 5 default carousel images. Continue?')) return

    const defaultImages = [
      {
        image: 'https://via.placeholder.com/400x600?text=Carousel+1',
        title: 'Anarkali',
        subtitle: 'Timeless Grace',
        order: 0
      },
      {
        image: 'https://via.placeholder.com/400x600?text=Carousel+2',
        title: 'Anarkali',
        subtitle: 'Contemporary Elegance',
        order: 1
      },
      {
        image: 'https://via.placeholder.com/400x600?text=Carousel+3',
        title: 'Palazzo',
        subtitle: 'Contemporary Comfort',
        order: 2
      },
      {
        image: 'https://via.placeholder.com/400x600?text=Carousel+4',
        title: 'Straight Cut',
        subtitle: 'Classic Sophistication',
        order: 3
      },
      {
        image: 'https://via.placeholder.com/400x600?text=Carousel+5',
        title: 'Sharara',
        subtitle: 'Regal Charm',
        order: 4
      }
    ]

    setUploading(true)
    try {
      const token = localStorage.getItem('adminToken')
      
      let successCount = 0
      let errorMessages = []

      for (const img of defaultImages) {
        try {
          const response = await fetch('/api/carousel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(img)
          })

          const data = await response.json()
          
          if (data.success) {
            successCount++
            console.log(`✅ Created carousel image ${img.order}: ${img.title}`)
          } else {
            errorMessages.push(`Order ${img.order} (${img.title}): ${data.message}`)
            console.error(`❌ Failed to create order ${img.order}:`, data)
          }
        } catch (err) {
          errorMessages.push(`Order ${img.order} (${img.title}): ${err.message}`)
          console.error(`❌ Error creating order ${img.order}:`, err)
        }
      }
      
      await fetchCarouselImages()
      
      if (successCount === 5) {
        alert(`✅ Success! Created all ${successCount} carousel images.`)
      } else if (successCount > 0) {
        alert(`⚠️ Partial success: Created ${successCount}/5 images.\n\nErrors:\n${errorMessages.join('\n')}\n\nCheck console for details.`)
      } else {
        alert(`❌ Failed to create carousel images.\n\nErrors:\n${errorMessages.join('\n')}\n\nMake sure the backend server is running!`)
      }
    } catch (error) {
      console.error('Seed error:', error)
      alert('Failed to seed carousel images: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="carousel-manager">
      <div className="manager-header">
        <div>
          <h1>Hero Carousel Management</h1>
          <p>Manage your homepage hero carousel images</p>
        </div>
        <div className="header-actions">
          {carouselImages.length === 0 && (
            <button 
              className="seed-btn" 
              onClick={seedDefaultImages}
              disabled={uploading}
            >
              {uploading ? '⏳ Creating...' : '🎨 Load Default Images'}
            </button>
          )}
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Carousel Image'}
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div 
          className="carousel-form-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>{editingImage ? 'Edit Carousel Image' : 'Add New Carousel Image'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="carousel-image">Image *</label>
              <input
                type="file"
                id="carousel-image"
                name="image"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0])}
                disabled={uploading}
              />
              {formData.image && (
                <div className="uploaded-image-preview">
                  <img src={getImageUrl(formData.image)} alt="Preview" />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="carousel-title">Title (Optional)</label>
                <input
                  type="text"
                  id="carousel-title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Palazzo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="carousel-subtitle">Subtitle (Optional)</label>
                <input
                  type="text"
                  id="carousel-subtitle"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                  placeholder="e.g., Contemporary Comfort"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Display Order *</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                min="0"
                required
              />
              <small className="form-hint">
                Lower numbers appear first. Current total: {carouselImages.length} images
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={uploading}>
                {uploading ? 'Uploading...' : editingImage ? 'Update Image' : 'Create Image'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="carousel-list">
        <h2>All Carousel Images ({carouselImages.length})</h2>
        <div className="carousel-grid">
          {carouselImages.map((image) => (
            <motion.div 
              key={image._id}
              className="carousel-card"
              whileHover={{ y: -5 }}
            >
              <div className="carousel-image">
                <img src={getImageUrl(image.image)} alt={image.title} />
                <span className="order-badge">Order: {image.order}</span>
                <span className={`status-badge ${image.isActive ? 'active' : 'inactive'}`}>
                  {image.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="carousel-info">
                <h3>{image.title || 'No Title'}</h3>
                <p className="subtitle">{image.subtitle || 'No Subtitle'}</p>
                <div className="carousel-actions">
                  <button onClick={() => startEdit(image)} className="edit-btn">Edit</button>
                  <button 
                    onClick={() => toggleActive(image._id, image.isActive)} 
                    className="toggle-btn"
                  >
                    {image.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(image._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CarouselManager
