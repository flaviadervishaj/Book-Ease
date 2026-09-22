import { createContext, useContext, useEffect, useState } from 'react'
import api, { updateAuthToken } from '../services/api'


const AuthContext = createContext()

const clearSession = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  updateAuthToken(null)
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    const expireSession = () => {
      clearSession()
      if (isCurrent) setUser(null)
    }

    const restoreSession = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      updateAuthToken(token)
      try {
        const response = await api.get('/auth/me')
        if (isCurrent) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
          setUser(response.data.user)
        }
      } catch {
        expireSession()
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    window.addEventListener('auth:expired', expireSession)
    restoreSession()

    return () => {
      isCurrent = false
      window.removeEventListener('auth:expired', expireSession)
    }
  }, [])

  const submitAuth = async (endpoint, payload) => {
    try {
      const response = await api.post(`/auth/${endpoint}`, payload)
      const { access_token: token, user: authenticatedUser } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(authenticatedUser))
      updateAuthToken(token)
      setUser(authenticatedUser)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error
          || (error.request
            ? 'Unable to connect to the server. Please try again.'
            : 'An unexpected error occurred. Please try again.'),
      }
    }
  }

  const login = (email, password) => submitAuth('login', { email, password })
  const register = (email, password) => submitAuth('register', { email, password })

  const logout = () => {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
