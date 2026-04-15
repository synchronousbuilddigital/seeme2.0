import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getImageUrl } from '../../../utils/imageHelper'
import './MagazineManager.css'

const MagazineManager = () => {
  const [magazines, setMagazines] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingMagazine, setEditingMagazine] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    order: 0
  })

  useEffect(() => {
    fetchMagazines()
  }, [])

  const fetchMagazines = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/magazine/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setMagazines(data.data)
      }
    } catch (error) {
      console.error('Error fetching magazines:', error)
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
      const url = editingMagazine 
        ? `/api/magazine/${editingMagazine._id}`
        : '/api/magazine'
      
      const response = await fetch(url, {
        method: editingMagazine ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        fetchMagazines()
        resetForm()
        alert(editingMagazine ? 'Magazine updated!' : 'Magazine created!')
      }
    } catch (error) {
      alert('Failed to save magazine')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this magazine item?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/magazine/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        fetchMagazines()
        alert('Magazine deleted!')
      }
    } catch (error) {
      alert('Failed to delete magazine')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      order: magazines.length  // Auto-assign next order number
    })
    setEditingMagazine(null)
    setShowForm(false)
  }

  const seedDefaultMagazines = async () => {
    if (!confirm('This will create 4 default magazine items. Continue?')) return

    const defaultMagazines = [
      {
        title: 'Timeless Elegance',
        description: 'Crafted with passion, designed for grace. Every stitch tells a story of tradition and artistry.',
        image: 'https://via.placeholder.com/600x800?text=Magazine+1',
        order: 0
      },
      {
        title: 'Heritage Redefined',
        description: 'Where ancient craftsmanship meets contemporary style, creating pieces that transcend time.',
        image: 'https://via.placeholder.com/600x800?text=Magazine+2',
        order: 1
      },
      {
        title: 'Artisan Excellence',
        description: 'Hand-picked fabrics, intricate embroidery, and attention to detail that defines luxury.',
        image: 'https://via.placeholder.com/600x800?text=Magazine+3',
        order: 2
      },
      {
        title: 'Your Story, Our Creation',
        description: 'Each piece is a celebration of individuality, designed to make you feel extraordinary.',
        image: 'https://via.placeholder.com/600x800?text=Magazine+4',
        order: 3
      }
    ]

    setUploading(true)
    try {
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        alert('❌ Not authenticated. Please login again.')
        setUploading(false)
        return
      }

      let successCount = 0
      let errorMessages = []

      for (const mag of defaultMagazines) {
        try {
          const response = await fetch('/api/magazine', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mag)
          })

          const data = await response.json()
          
          if (data.success) {
            successCount++
            console.log(`✅ Created: ${mag.title}`)
          } else {
            errorMessages.push(`${mag.title}: ${data.message}`)
            console.error(`❌ Failed: ${mag.title}`, data)
          }
        } catch (err) {
          errorMessages.push(`${mag.title}: ${err.message}`)
          console.error(`❌ Error creating ${mag.title}:`, err)
        }
      }
      
      await fetchMagazines()
      
      if (successCount === 4) {
        alert(`✅ Success! Created ${successCount} magazine items.`)
      } else if (successCount > 0) {
        alert(`⚠️ Partial success: Created ${successCount}/4 magazines.\n\nErrors:\n${errorMessages.join('\n')}`)
      } else {
        alert(`❌ Failed to create magazines.\n\nErrors:\n${errorMessages.join('\n')}\n\nMake sure the backend server is running!`)
      }
    } catch (error) {
      console.error('Seed error:', error)
      if (error.message.includes('Failed to fetch')) {
        alert('❌ SERVER NOT RUNNING!\n\nPlease start the backend server:\n\n1. Open terminal\n2. Run: cd server\n3. Run: npm start\n\nThen try again.')
      } else {
        alert('Failed to seed magazines: ' + error.message)
      }
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (magazine) => {
    setFormData({
      title: magazine.title,
      description: magazine.description,
      image: magazine.image,
      order: magazine.order
    })
    setEditingMagazine(magazine)
    setShowForm(true)
  }

  return (
    <div className="magazine-manager">
      <div className="manager-header">
        <div>
          <h1>Magazine Management</h1>
          <p>Manage your magazine stories and content</p>
        </div>
        <div className="header-actions">
          {magazines.length === 0 && (
            <button 
              className="seed-btn" 
              onClick={seedDefaultMagazines}
              disabled={uploading}
            >
              {uploading ? '⏳ Creating...' : '📚 Load Default Magazines'}
            </button>
          )}
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Magazine Item'}
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div 
          className="magazine-form-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>{editingMagazine ? 'Edit Magazine Item' : 'Add New Magazine Item'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="magazine-title">Title *</label>
              <input
                type="text"
                id="magazine-title"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="e.g., Artisan Excellence"
              />
            </div>

            <div className="form-group">
              <label htmlFor="magazine-description">Description *</label>
              <textarea
                id="magazine-description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="4"
                required
                placeholder="Tell the story behind this piece..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="magazine-image">Image *</label>
              <input
                type="file"
                id="magazine-image"
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

            <div className="form-group">
              <label>Display Order (Auto-assigned)</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                min="0"
              />
              <small className="form-hint">
                Order {formData.order}: <strong>{formData.order % 2 === 0 ? 'Image RIGHT, Text LEFT' : 'Image LEFT, Text RIGHT'}</strong>
                <br/>
                Current total: {magazines.length} magazine items
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={uploading}>
                {uploading ? 'Uploading...' : editingMagazine ? 'Update Magazine' : 'Create Magazine'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="magazines-list">
        <h2>All Magazine Items ({magazines.length})</h2>
        <div className="magazines-grid">
          {magazines.map((magazine, index) => (
            <motion.div 
              key={magazine._id}
              className="magazine-card"
              whileHover={{ y: -5 }}
            >
              <div className="magazine-image">
                <img src={getImageUrl(magazine.image)} alt={magazine.title} />
                <span className="order-badge">Order: {magazine.order}</span>
                <span className={`layout-badge ${magazine.order % 2 === 0 ? 'even' : 'odd'}`}>
                  {magazine.order % 2 === 0 ? 'Image Right' : 'Image Left'}
                </span>
              </div>
              <div className="magazine-info">
                <h3>{magazine.title}</h3>
                <p className="description">{magazine.description}</p>
                <div className="magazine-actions">
                  <button onClick={() => startEdit(magazine)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(magazine._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MagazineManager
