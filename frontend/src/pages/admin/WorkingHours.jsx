import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { CopyIcon } from '../../components/Icons'
import './Admin.css'

const WorkingHours = () => {
  const [workingHours, setWorkingHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(null)
  const toast = useToast()

  const days = [
    { value: 0, name: 'Monday', short: 'Mon' },
    { value: 1, name: 'Tuesday', short: 'Tue' },
    { value: 2, name: 'Wednesday', short: 'Wed' },
    { value: 3, name: 'Thursday', short: 'Thu' },
    { value: 4, name: 'Friday', short: 'Fri' },
    { value: 5, name: 'Saturday', short: 'Sat' },
    { value: 6, name: 'Sunday', short: 'Sun' }
  ]

  useEffect(() => {
    fetchWorkingHours()
  }, [])

  const fetchWorkingHours = async () => {
    try {
      const response = await api.get('/admin/working-hours')
      const hours = response.data.working_hours
      
      // Initialize with all days
      const allDays = days.map(day => {
        const existing = hours.find(wh => wh.day_of_week === day.value)
        return existing || {
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_available: false
        }
      })
      
      setWorkingHours(allDays)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching working hours:', error)
      toast.error('Failed to load working hours')
      setLoading(false)
    }
  }

  const handleChange = (dayIndex, field, value) => {
    const updated = [...workingHours]
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value
    }
    setWorkingHours(updated)
  }

  const handleSave = async (day) => {
    setError('')
    setSaving(day.day_of_week)

    // Validation
    if (day.is_available && day.start_time >= day.end_time) {
      setError(`End time must be after start time for ${days[day.day_of_week].name}`)
      setSaving(null)
      return
    }

    try {
      await api.post('/admin/working-hours', {
        day_of_week: day.day_of_week,
        start_time: day.start_time,
        end_time: day.end_time,
        is_available: day.is_available
      })
      toast.success(`Working hours for ${days[day.day_of_week].name} saved`)
      setSaving(null)
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save working hours'
      setError(errorMsg)
      toast.error(errorMsg)
      setSaving(null)
    }
  }

  const handleCopyDay = (sourceDayIndex) => {
    const sourceDay = workingHours[sourceDayIndex]
    const updated = workingHours.map((day, index) => {
      if (index === sourceDayIndex) return day
      return {
        ...day,
        start_time: sourceDay.start_time,
        end_time: sourceDay.end_time,
        is_available: sourceDay.is_available
      }
    })
    setWorkingHours(updated)
  }

  const handleSetAll = (startTime, endTime, isAvailable) => {
    const updated = workingHours.map(day => ({
      ...day,
      start_time: startTime,
      end_time: endTime,
      is_available: isAvailable
    }))
    setWorkingHours(updated)
  }

  if (loading) {
    return <div className="loading">Loading working hours...</div>
  }

  const availableDays = workingHours.filter(day => day.is_available).length

  return (
    <div className="admin-working-hours">
      <div className="page-header">
        <div>
          <h1>Working Hours</h1>
          <p className="page-subtitle">Set business hours for each day of the week</p>
        </div>
        <div className="header-stats">
          <span className="stat-badge">{availableDays} days available</span>
        </div>
      </div>

      <div className="bulk-actions">
        <h3>Quick Actions</h3>
        <div className="bulk-buttons">
          <button
            onClick={() => handleSetAll('09:00', '17:00', true)}
            className="btn btn-secondary"
          >
            Set All: 9 AM - 5 PM
          </button>
          <button
            onClick={() => handleSetAll('10:00', '18:00', true)}
            className="btn btn-secondary"
          >
            Set All: 10 AM - 6 PM
          </button>
          <button
            onClick={() => handleSetAll('08:00', '16:00', true)}
            className="btn btn-secondary"
          >
            Set All: 8 AM - 4 PM
          </button>
          <button
            onClick={() => handleSetAll('', '', false)}
            className="btn btn-danger"
          >
            Close All Days
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="working-hours-list">
        {workingHours.map((day, index) => (
          <div 
            key={day.day_of_week} 
            className={`working-hours-card ${day.is_available ? 'available' : 'closed'}`}
          >
            <div className="day-header">
              <div className="day-info">
                <h3>{days[day.day_of_week].name}</h3>
                <span className="day-short">{days[day.day_of_week].short}</span>
              </div>
              <div className="day-controls">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={day.is_available}
                    onChange={(e) => handleChange(index, 'is_available', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {day.is_available ? 'Open' : 'Closed'}
                  </span>
                </label>
                {index > 0 && (
                  <button
                    onClick={() => handleCopyDay(index - 1)}
                    className="btn-icon"
                    title="Copy from previous day"
                  >
                    <CopyIcon />
                  </button>
                )}
              </div>
            </div>

            {day.is_available && (
              <div className="time-inputs">
                <div className="input-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={day.start_time}
                    onChange={(e) => handleChange(index, 'start_time', e.target.value)}
                    disabled={saving === day.day_of_week}
                  />
                </div>
                <div className="input-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={day.end_time}
                    onChange={(e) => handleChange(index, 'end_time', e.target.value)}
                    disabled={saving === day.day_of_week}
                  />
                </div>
                <button
                  onClick={() => handleSave(day)}
                  disabled={saving === day.day_of_week}
                  className="btn btn-primary"
                >
                  {saving === day.day_of_week ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            
            {!day.is_available && (
              <div className="closed-message">
                <span>Closed</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WorkingHours
