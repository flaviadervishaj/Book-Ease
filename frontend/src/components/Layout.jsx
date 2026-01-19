import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Logo from './Logo'
import { SunIcon, MoonIcon, MenuIcon, CloseIcon } from './Icons'
import './Layout.css'

const Layout = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname.startsWith(path)
  
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <Link to="/services" className="logo">
              <Logo />
            </Link>
            
            <div className="nav-links">
              <Link
                to="/services"
                className={isActive('/services') ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                Services
              </Link>
              <Link
                to="/book"
                className={isActive('/book') ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                Book Appointment
              </Link>
              <Link
                to="/my-appointments"
                className={isActive('/my-appointments') ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                My Appointments
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className={isActive('/admin') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Admin
                </Link>
              )}
            </div>
            
            <div className="nav-actions">
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
              <div className="user-info">
                <span className="user-email">{user?.email}</span>
                <span className="user-role">{user?.role}</span>
                <button onClick={logout} className="btn btn-secondary">
                  Logout
                </button>
              </div>
              <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
            
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
              <div className="mobile-menu-header">
                <Logo />
                <button
                  className="mobile-menu-close"
                  onClick={closeMobileMenu}
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="mobile-menu-content">
                <Link
                  to="/services"
                  className={isActive('/services') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Services
                </Link>
                <Link
                  to="/book"
                  className={isActive('/book') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  Book Appointment
                </Link>
                <Link
                  to="/my-appointments"
                  className={isActive('/my-appointments') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  My Appointments
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={isActive('/admin') ? 'active' : ''}
                    onClick={closeMobileMenu}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
