import { lazy, Suspense } from 'react'
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
import Layout from './components/Layout'
import './App.css'

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminServices = lazy(() => import('./pages/admin/Services'))
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'))
const AdminWorkingHours = lazy(() => import('./pages/admin/WorkingHours'))

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
          <Suspense fallback={<div className="loading">Loading...</div>}>
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
          </Suspense>
        </Router>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
