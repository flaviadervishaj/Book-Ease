import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useToast } from '../contexts/ToastContext'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { formatDate, getRelativeTime } from '../utils/dateUtils'
import { CalendarIcon, ClockIcon } from '../components/Icons'
import './MyAppointments.css'

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, appointmentId: null })
  const [rescheduleDialog, setRescheduleDialog] = useState({ isOpen: false, appointment: null })
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter])

  const fetchAppointments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await api.get('/appointments', { params })
      setAppointments(response.data.appointments || [])
      setLoading(false)
    } catch (error) {
      let errorMsg = 'Failed to load appointments'
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Please log in to view appointments'
        } else {
          errorMsg = error.response.data?.error || error.response.data?.message || `Failed to load appointments: ${error.response.status}`
        }
      } else if (error.request) {
        errorMsg = 'Unable to connect to server. Please check your internet connection.'
      } else {
        errorMsg = error.message || 'An unexpected error occurred'
      }
      
      setError(errorMsg)
      toast.error(errorMsg)
      setAppointments([])
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelDialog.appointmentId) return

    try {
      await api.put(`/appointments/${cancelDialog.appointmentId}`, { status: 'cancelled' })
      toast.success('Appointment cancelled successfully')
      setCancelDialog({ isOpen: false, appointmentId: null })
      fetchAppointments()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to cancel appointment'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const handleReschedule = async (newStartTime) => {
    if (!rescheduleDialog.appointment) return

    try {
      await api.put(`/appointments/${rescheduleDialog.appointment.id}`, {
        start_time: newStartTime
      })
      toast.success('Appointment rescheduled successfully')
      setRescheduleDialog({ isOpen: false, appointment: null })
      fetchAppointments()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to reschedule appointment'
      toast.error(errorMsg)
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusCounts = () => {
    const counts = {
      all: appointments.length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return <div className="loading">Loading appointments...</div>
  }

  return (
    <div className="appointments-page">
      <div className="page-header">
        <div>
          <h1>My Appointments</h1>
          <p className="page-subtitle">Manage your booked appointments</p>
        </div>
        <button
          onClick={() => navigate('/book')}
          className="btn btn-primary"
        >
          + Book New Appointment
        </button>
      </div>

      <div className="status-filters">
        <button
          className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All ({statusCounts.all})
        </button>
        <button
          className={`filter-btn ${statusFilter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('confirmed')}
        >
          Confirmed ({statusCounts.confirmed})
        </button>
        <button
          className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setStatusFilter('cancelled')}
        >
          Cancelled ({statusCounts.cancelled})
        </button>
        <button
          className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('completed')}
        >
          Completed ({statusCounts.completed})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CalendarIcon />
          </div>
          <h3>No appointments found</h3>
          <p>
            {statusFilter === 'all'
              ? "You don't have any appointments yet. Book your first appointment!"
              : `No ${statusFilter} appointments found.`}
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => navigate('/book')}
              className="btn btn-primary"
            >
              Book Your First Appointment
            </button>
          )}
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => {
            const isPast = new Date(appointment.start_time) < new Date()
            const isToday = new Date(appointment.start_time).toDateString() === new Date().toDateString()
            
            return (
              <div 
                key={appointment.id} 
                className={`appointment-card ${isPast ? 'past' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="appointment-header">
                  <div className="appointment-title">
                    <h3>{appointment.service_name}</h3>
                    {isToday && <span className="today-badge">Today</span>}
                    {isPast && appointment.status === 'confirmed' && (
                      <span className="past-badge">Past</span>
                    )}
                  </div>
                  <span className={`status-badge status-${appointment.status}`}>
                    {appointment.status}
                  </span>
                </div>
                
                <div className="appointment-details">
                  <div className="detail-row">
                    <span className="detail-icon">
                      <CalendarIcon />
                    </span>
                    <div className="detail-content">
                      <div className="detail-label">Date & Time</div>
                      <div className="detail-value">{formatDateTime(appointment.start_time)}</div>
                      <div className="detail-relative">{getRelativeTime(appointment.start_time)}</div>
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-icon">
                      <ClockIcon />
                    </span>
                    <div className="detail-content">
                      <div className="detail-label">Duration</div>
                      <div className="detail-value">
                        {formatDateTime(appointment.start_time)} - {new Date(appointment.end_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {appointment.status === 'confirmed' && !isPast && (
                  <div className="appointment-actions">
                    <button
                      onClick={() => setCancelDialog({ isOpen: true, appointmentId: appointment.id })}
                      className="btn btn-danger"
                    >
                      Cancel Appointment
                    </button>
                    <button
                      onClick={() => navigate(`/book?service=${appointment.service_id}&reschedule=${appointment.id}`)}
                      className="btn btn-secondary"
                    >
                      Reschedule
                    </button>
                  </div>
                )}
                
                {appointment.status === 'cancelled' && (
                  <div className="cancelled-notice">
                    This appointment was cancelled
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmationDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, appointmentId: null })}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        type="danger"
      />
    </div>
  )
}

export default MyAppointments
