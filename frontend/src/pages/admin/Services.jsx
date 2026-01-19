import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import ConfirmationDialog from '../../components/ConfirmationDialog'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import { DocumentIcon } from '../../components/Icons'
import './Admin.css'

const AdminServices = () => {
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, serviceId: null })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: '',
    address: '',
    image_url: ''
  })
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    filterServices()
  }, [services, searchQuery])

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      setServices(response.data.services)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Failed to load services')
      setLoading(false)
    }
  }

  const filterServices = () => {
    if (!searchQuery) {
      setFilteredServices(services)
      return
    }
    const query = searchQuery.toLowerCase()
    setFilteredServices(
      services.filter(
        service =>
          service.name.toLowerCase().includes(query) ||
          (service.description && service.description.toLowerCase().includes(query))
      )
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0')
      return
    }
    if (formData.duration_minutes < 1) {
      setError('Duration must be at least 1 minute')
      return
    }

    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, formData)
        toast.success('Service updated successfully')
      } else {
        await api.post('/services', formData)
        toast.success('Service created successfully')
      }
      setShowForm(false)
      setEditingService(null)
      setFormData({ name: '', description: '', duration_minutes: 30, price: '' })
      fetchServices()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save service'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price.toString(),
      address: service.address || '',
      image_url: service.image_url || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!deleteDialog.serviceId) return

    try {
      await api.delete(`/services/${deleteDialog.serviceId}`)
      toast.success('Service deleted successfully')
      setDeleteDialog({ isOpen: false, serviceId: null })
      fetchServices()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete service'
      toast.error(errorMsg)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingService(null)
    setFormData({ name: '', description: '', duration_minutes: 30, price: '', address: '', image_url: '' })
    setError('')
  }

  if (loading) {
    return (
      <div className="admin-services">
        <div className="page-header">
          <h1>Manage Services</h1>
        </div>
        <CardSkeleton count={3} />
      </div>
    )
  }

  const serviceToDelete = services.find(s => s.id === deleteDialog.serviceId)

  return (
    <div className="admin-services">
      <div className="page-header">
        <div>
          <h1>Manage Services</h1>
          <p className="page-subtitle">Add, edit, or remove services</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Add Service
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
            <button onClick={handleCancel} className="close-btn">×</button>
          </div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="input-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Haircut, Consultation"
                  required
                />
              </div>
              <div className="input-group">
                <label>Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                  required
                />
                <small className="input-hint">Common: 30, 60, 90 minutes</small>
              </div>
              <div className="input-group">
                <label>Price per Minute</label>
                <div className="calculated-value">
                  ${formData.price && formData.duration_minutes 
                    ? (parseFloat(formData.price) / formData.duration_minutes).toFixed(2)
                    : '0.00'}
                </div>
              </div>
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe what this service includes..."
              />
            </div>
            <div className="input-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Main Street, Downtown District, Floor 2, Suite 201"
              />
              <small className="input-hint">Full address where this service is provided</small>
            </div>
            <div className="input-group">
              <label>Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              <small className="input-hint">URL to a high-quality image for this service</small>
              {formData.image_url && (
                <div className="image-preview">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingService ? 'Update' : 'Create'} Service
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="services-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear"
            >
              ×
            </button>
          )}
        </div>
        <div className="services-count">
          {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <DocumentIcon />
          </div>
          <h3>{searchQuery ? 'No services found' : 'No services yet'}</h3>
          <p>
            {searchQuery
              ? 'Try a different search term'
              : 'Get started by adding your first service!'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Add First Service
            </button>
          )}
        </div>
      ) : (
        <div className="services-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>
                    <strong>{service.name}</strong>
                  </td>
                  <td className="description-cell">
                    {service.description || <span className="text-muted">—</span>}
                  </td>
                  <td>{service.duration_minutes} min</td>
                  <td>
                    <strong className="price-cell">${service.price}</strong>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => handleEdit(service)}
                        className="btn btn-secondary btn-sm"
                        title="Edit service"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, serviceId: service.id })}
                        className="btn btn-danger btn-sm"
                        title="Delete service"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, serviceId: null })}
        onConfirm={handleDelete}
        title="Delete Service"
        message={
          serviceToDelete
            ? `Are you sure you want to delete "${serviceToDelete.name}"? This action cannot be undone and will affect all related appointments.`
            : 'Are you sure you want to delete this service?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

export default AdminServices
