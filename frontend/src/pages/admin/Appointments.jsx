import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { formatDateTime, getRelativeTime } from '../../utils/dateUtils'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import { CalendarIcon } from '../../components/Icons'
import './Admin.css'

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, dateFilter])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchQuery])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (dateFilter) {
        params.date = dateFilter
      }
      const response = await api.get('/appointments', { params })
      setAppointments(response.data.appointments)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to load appointments')
      setLoading(false)
    }
  }

  const filterAppointments = () => {
    if (!searchQuery) {
      setFilteredAppointments(appointments)
      return
    }
    const query = searchQuery.toLowerCase()
    setFilteredAppointments(
      appointments.filter(
        appointment =>
          appointment.service_name?.toLowerCase().includes(query) ||
          appointment.client_email?.toLowerCase().includes(query) ||
          appointment.user?.email?.toLowerCase().includes(query)
      )
    )
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.put(`/appointments/${appointmentId}`, { status: newStatus })
      toast.success('Appointment status updated')
      fetchAppointments()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update appointment'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const getStatusCounts = () => {
    return {
      all: appointments.length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="admin-appointments">
        <div className="page-header">
          <h1>All Appointments</h1>
        </div>
        <CardSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className="admin-appointments">
      <div className="page-header">
        <div>
          <h1>All Appointments</h1>
          <p className="page-subtitle">Manage all customer appointments</p>
        </div>
        <div className="header-stats">
          <span className="stat-badge">{appointments.length} Total</span>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by service or client email..."
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
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-filter"
            placeholder="Filter by date"
          />
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
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <CalendarIcon />
          </div>
          <h3>
            {searchQuery || dateFilter || statusFilter !== 'all'
              ? 'No appointments found'
              : 'No appointments yet'}
          </h3>
          <p>
            {searchQuery || dateFilter || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Appointments will appear here once customers start booking'}
          </p>
          {(searchQuery || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setDateFilter('')
                setStatusFilter('all')
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="appointments-table">
          <div className="table-header-info">
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </div>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Client</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => {
                const isPast = new Date(appointment.start_time) < new Date()
                const isToday = new Date(appointment.start_time).toDateString() === new Date().toDateString()
                
                return (
                  <tr 
                    key={appointment.id}
                    className={`${isPast ? 'past-row' : ''} ${isToday ? 'today-row' : ''}`}
                  >
                    <td>
                      <strong>{appointment.service_name}</strong>
                    </td>
                    <td>
                      <div className="client-info">
                        <div>{appointment.client_email || appointment.user?.email || 'N/A'}</div>
                        {isToday && <span className="today-indicator">Today</span>}
                      </div>
                    </td>
                    <td>
                      <div className="datetime-cell">
                        <div>{formatDateTime(appointment.start_time)}</div>
                        <div className="relative-time">{getRelativeTime(appointment.start_time)}</div>
                      </div>
                    </td>
                    <td>
                      {new Date(appointment.start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(appointment.end_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className={`status-badge status-${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminAppointments
