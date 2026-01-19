import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Logo from '../components/Logo'
import { SunIcon, MoonIcon } from '../components/Icons'
import './Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/services')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    
    if (!password) {
      setError('Please enter your password')
      return
    }
    
    setLoading(true)

    const result = await login(email.trim(), password)
    
    if (result.success) {
      navigate('/services')
    } else {
      setError(result.error || 'Invalid email or password. Please try again.')
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-gradient"></div>
      </div>
      
      <div className="auth-wrapper">
        <div className="auth-theme-toggle">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>

        <div className="auth-card">
          <div className="auth-logo">
            <Logo />
          </div>

          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue to BookEase</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="auth-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
