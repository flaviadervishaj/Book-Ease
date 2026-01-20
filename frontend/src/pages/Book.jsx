import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { FormSkeleton } from '../components/LoadingSkeleton'
import { CalendarIcon } from '../components/Icons'
import './Book.css'

const Book = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingServices, setLoadingServices] = useState(true)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetchServices()
    const serviceId = searchParams.get('service')
    if (serviceId) {
      setSelectedService(serviceId)
    }
  }, [])

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots()
    } else {
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }, [selectedService, selectedDate])

  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      setServices(response.data.services)
      
      const serviceId = searchParams.get('service')
      if (serviceId && response.data.services.length > 0) {
        const service = response.data.services.find(s => s.id === parseInt(serviceId))
        if (service) {
          setSelectedService(service.id.toString())
        }
      }
      setLoadingServices(false)
    } catch (error) {
      toast.error('Failed to load services')
      setLoadingServices(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return

    setLoadingSlots(true)
    setSelectedSlot(null)
    setError('')
    try {
      const response = await api.get('/availability', {
        params: {
          service_id: selectedService,
          date: selectedDate
        }
      })
      setAvailableSlots(response.data.available_slots || [])
      if (response.data.available_slots && response.data.available_slots.length === 0) {
        setError('No available time slots for this date. Please try another date.')
      }
    } catch (error) {
      let errorMsg = 'Failed to load available time slots'
      if (error.response) {
        errorMsg = error.response.data?.error || error.response.data?.message || errorMsg
      } else if (error.request) {
        errorMsg = 'Unable to connect to server. Please check your internet connection.'
      }
      toast.error(errorMsg)
      setError(errorMsg)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedSlot) {
      toast.error('Please select a service and time slot')
      return
    }

    setLoading(true)
    setError('')
    setShowConfirm(false)

    try {
      // Ensure datetime is in proper ISO format
      let datetimeToSend = selectedSlot.datetime
      
      // If datetime doesn't have timezone info, add it
      if (datetimeToSend && !datetimeToSend.includes('Z') && !datetimeToSend.includes('+') && !datetimeToSend.includes('-')) {
        // Parse and convert to ISO format with timezone
        const dt = new Date(datetimeToSend)
        datetimeToSend = dt.toISOString()
      }

      const response = await api.post('/appointments', {
        service_id: parseInt(selectedService),
        start_time: datetimeToSend
      })
      
      if (response.data) {
        toast.success('Appointment booked successfully!')
        // Small delay to show success message before navigation
        setTimeout(() => {
          navigate('/my-appointments')
        }, 500)
      } else {
        throw new Error('No response data received')
      }
    } catch (error) {
      let errorMsg = 'Failed to book appointment'
      
      if (error.response) {
        // Handle different error status codes
        if (error.response.status === 422 || error.response.status === 400) {
          errorMsg = error.response.data?.error || error.response.data?.message || 'Invalid booking data. Please check your selection.'
        } else if (error.response.status === 401) {
          errorMsg = 'Please log in to book an appointment'
          // Redirect to login if unauthorized
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else if (error.response.status === 404) {
          errorMsg = error.response.data?.error || 'Service not found'
        } else {
          errorMsg = error.response.data?.error || error.response.data?.message || `Booking failed: ${error.response.status}`
        }
      } else if (error.request) {
        errorMsg = 'Unable to connect to server. Please check your internet connection.'
      } else {
        errorMsg = error.message || 'An unexpected error occurred'
      }
      
      setError(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
      // Allow user to try again by keeping the dialog closed but allowing them to click Book Now again
    }
  }

  const getDayName = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const selectedServiceData = services.find(s => s.id === parseInt(selectedService))

  if (loadingServices) {
    return (
      <div className="book-page">
        <FormSkeleton />
      </div>
    )
  }

  return (
    <div className="book-page">
      <div className="page-header">
        <div>
          <h1>Book Appointment</h1>
          <p className="page-subtitle">Select a service, date, and available time slot</p>
        </div>
      </div>

      <div className="booking-container">
        <div className="booking-steps">
          <div className="step">
            <div className="step-header">
              <span className="step-number">1</span>
              <h3>Select Service</h3>
            </div>
            <div className="input-group">
              <select
                value={selectedService || ''}
                onChange={(e) => {
                  setSelectedService(e.target.value)
                  setSelectedDate('')
                  setSelectedSlot(null)
                  setError('')
                }}
                className="service-select"
              >
                <option value="">Choose a service...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.price} ({service.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>
            {selectedServiceData && (
              <div className="service-preview">
                <div className="preview-item">
                  <span>Duration:</span>
                  <strong>{selectedServiceData.duration_minutes} minutes</strong>
                </div>
                <div className="preview-item">
                  <span>Price:</span>
                  <strong>${selectedServiceData.price}</strong>
                </div>
              </div>
            )}
          </div>

          {selectedService && (
            <div className="step">
              <div className="step-header">
                <span className="step-number">2</span>
                <h3>Select Date</h3>
              </div>
              <div className="input-group">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedSlot(null)
                    setError('')
                  }}
                  min={today}
                  max={maxDateStr}
                  className="date-input"
                  style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                />
                {selectedDate && (
                  <div className="date-info">
                    <span className="day-name">{getDayName(selectedDate)}</span>
                    <span className="date-display">{new Date(selectedDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedService && selectedDate && (
            <div className="step">
              <div className="step-header">
                <span className="step-number">3</span>
                <h3>Select Time</h3>
              </div>
              {error && !loadingSlots && (
                <div className="error-message" style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)', color: '#ff6b6b' }}>
                  {error}
                </div>
              )}
              {loadingSlots ? (
                <div className="loading">Loading available slots...</div>
              ) : availableSlots.length === 0 ? (
                <div className="no-slots">
                  <div className="no-slots-icon">
                    <CalendarIcon />
                  </div>
                  <p><strong>No available time slots for this date.</strong></p>
                  <p className="hint">Try selecting a different date or check back later.</p>
                  <button
                    onClick={() => {
                      setSelectedDate('')
                      setError('')
                    }}
                    className="btn btn-secondary"
                    style={{ marginTop: '12px' }}
                  >
                    Change Date
                  </button>
                </div>
              ) : (
                <>
                  <p className="slots-info">
                    {availableSlots.length} {availableSlots.length === 1 ? 'slot' : 'slots'} available
                  </p>
                  <div className="time-slots">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.datetime}
                        onClick={() => {
                          handleSlotSelect(slot)
                          setError('')
                        }}
                        disabled={loading}
                        className={`time-slot-btn ${selectedSlot?.datetime === slot.datetime ? 'selected' : ''}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {selectedServiceData && (
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">Service:</span>
                <strong className="summary-value">{selectedServiceData.name}</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Duration:</span>
                <strong className="summary-value">{selectedServiceData.duration_minutes} minutes</strong>
              </div>
              <div className="summary-item">
                <span className="summary-label">Price:</span>
                <strong className="summary-value price">${selectedServiceData.price}</strong>
              </div>
              {selectedDate && (
                <div className="summary-item">
                  <span className="summary-label">Date:</span>
                  <strong className="summary-value">{new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}</strong>
                </div>
              )}
              {selectedSlot && (
                <div className="summary-item">
                  <span className="summary-label">Time:</span>
                  <strong className="summary-value">{selectedSlot.time}</strong>
                </div>
              )}
              {selectedSlot && (
                <div className="summary-total">
                  <div className="summary-item">
                    <span className="summary-label">Total:</span>
                    <strong className="summary-value total-price">${selectedServiceData.price}</strong>
                  </div>
                </div>
              )}
            </div>
            {selectedSlot && (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '16px' }}
              >
                Book Now
              </button>
            )}
          </div>
        )}

        {error && !loadingSlots && (
          <div className="error-message" style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)', color: '#ff6b6b' }}>
            {error}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => {
          if (!loading) {
            setShowConfirm(false)
          }
        }}
        onConfirm={handleConfirmBooking}
        title="Confirm Booking"
        message={
          selectedServiceData && selectedSlot
            ? `Book ${selectedServiceData.name} on ${new Date(selectedDate).toLocaleDateString()} at ${selectedSlot.time}?`
            : 'Confirm this booking?'
        }
        confirmText="Confirm"
        cancelText="Cancel"
        type="success"
        loading={loading}
      />
    </div>
  )
}

export default Book
