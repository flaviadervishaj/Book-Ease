import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import api from '../../services/api'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import { StatsIcon, CheckIcon, XIcon, RefreshIcon } from '../../components/Icons'
import { formatDate } from '../../utils/dateUtils'
import './Admin.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsResponse, appointmentsResponse] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/appointments?status=confirmed')
      ])
      
      setStats(statsResponse.data)
      setRecentAppointments(appointmentsResponse.data.appointments.slice(0, 5))
      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
        </div>
        <CardSkeleton count={4} />
      </div>
    )
  }

  if (!stats) {
    return <div className="error-message">Failed to load dashboard data</div>
  }

  const statusData = Object.entries(stats.bookings_by_status || {}).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count
  }))

  const COLORS = ['#ff6b6b', '#f8b500', '#51cf66', '#ef4444']

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="page-subtitle">Overview of your booking platform</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary"
          >
            {refreshing ? 'Refreshing...' : <><RefreshIcon /> Refresh</>}
          </button>
          <Link to="/admin/services" className="btn btn-secondary">
            Manage Services
          </Link>
          <Link to="/admin/appointments" className="btn btn-primary">
            View All Appointments
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <StatsIcon />
          </div>
          <div className="stat-content">
            <h3>Total Bookings</h3>
            <div className="stat-value">{stats.total_bookings || 0}</div>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <CheckIcon />
          </div>
          <div className="stat-content">
            <h3>Confirmed</h3>
            <div className="stat-value">{stats.bookings_by_status?.confirmed || 0}</div>
          </div>
        </div>
        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <XIcon />
          </div>
          <div className="stat-content">
            <h3>Cancelled</h3>
            <div className="stat-value">{stats.bookings_by_status?.cancelled || 0}</div>
          </div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">
            <CheckIcon />
          </div>
          <div className="stat-content">
            <h3>Completed</h3>
            <div className="stat-value">{stats.bookings_by_status?.completed || 0}</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>Bookings by Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No data available</div>
          )}
        </div>

        <div className="chart-card">
          <h2>Bookings Per Day (Last 7 Days)</h2>
          {stats.bookings_per_day && stats.bookings_per_day.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.bookings_per_day}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                />
                <Bar dataKey="count" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No bookings in the last 7 days</div>
          )}
        </div>
      </div>

      <div className="info-section">
        {stats.popular_service && (
          <div className="info-card">
            <h2>Most Popular Service</h2>
            <div className="popular-service">
              <span className="service-name">{stats.popular_service.name}</span>
              <span className="service-count-badge">{stats.popular_service.count} bookings</span>
            </div>
          </div>
        )}

        {recentAppointments.length > 0 && (
          <div className="info-card">
            <div className="card-header">
              <h2>Recent Appointments</h2>
              <Link to="/admin/appointments" className="view-all-link">
                View All →
              </Link>
            </div>
            <div className="recent-appointments-list">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="recent-appointment-item">
                  <div className="recent-appointment-info">
                    <strong>{appointment.service_name}</strong>
                    <span className="recent-appointment-date">
                      {formatDate(appointment.start_time)} at {new Date(appointment.start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <span className={`status-badge status-${appointment.status}`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
