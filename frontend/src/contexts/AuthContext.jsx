import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.response) {
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message ||
                           `Login failed: ${error.response.status} ${error.response.statusText}`
        return {
          success: false,
          error: errorMessage
        }
      } else if (error.request) {
        return {
          success: false,
          error: 'Unable to connect to server. Please check your internet connection.'
        }
      } else {
        return {
          success: false,
          error: error.message || 'An unexpected error occurred. Please try again.'
        }
      }
    }
  }

  const register = async (email, password, role = 'client') => {
    try {
      const response = await api.post('/auth/register', { email, password, role })
      const { access_token, user } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      
      if (error.response) {
        const errorMessage = error.response.data?.error || 
                           error.response.data?.message ||
                           `Registration failed: ${error.response.status} ${error.response.statusText}`
        return {
          success: false,
          error: errorMessage
        }
      } else if (error.request) {
        return {
          success: false,
          error: 'Unable to connect to server. Please check your internet connection.'
        }
      } else {
        return {
          success: false,
          error: error.message || 'An unexpected error occurred. Please try again.'
        }
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
