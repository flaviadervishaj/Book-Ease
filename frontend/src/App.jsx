import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Services from './pages/Services'
import Book from './pages/Book'
import MyAppointments from './pages/MyAppointments'
import AdminDashboard from './pages/admin/Dashboard'
import AdminServices from './pages/admin/Services'
import AdminAppointments from './pages/admin/Appointments'
import AdminWorkingHours from './pages/admin/WorkingHours'
import Layout from './components/Layout'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/services" replace />} />
              <Route path="services" element={<Services />} />
              <Route path="book" element={<Book />} />
              <Route path="my-appointments" element={<MyAppointments />} />
              <Route
                path="admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/services"
                element={
                  <AdminRoute>
                    <AdminServices />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/appointments"
                element={
                  <AdminRoute>
                    <AdminAppointments />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/working-hours"
                element={
                  <AdminRoute>
                    <AdminWorkingHours />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
