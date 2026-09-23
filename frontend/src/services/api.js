import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const errorData = error.response?.data || {}
    
    // NEVER logout on booking/appointments endpoints - these are user actions
    // Only logout on actual authentication failures (expired/invalid token)
    const isBookingEndpoint = url.includes('/appointments') || url.includes('/availability')
    
    if (status === 401) {
      // Check if error is actually authentication-related
      const errorMsg = errorData?.error || ''
      const isAuthError = errorData?.code === 'TOKEN_EXPIRED' || 
                         errorData?.code === 'INVALID_TOKEN' || 
                         errorData?.code === 'MISSING_TOKEN' ||
                         errorMsg.toLowerCase().includes('token') ||
                         errorMsg.toLowerCase().includes('unauthorized') ||
                         errorMsg.toLowerCase().includes('authorization')
      
      // Don't logout if it's a booking endpoint - just show error
      if (isAuthError && !isBookingEndpoint && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Update token in headers when it changes
export const updateAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export default api
