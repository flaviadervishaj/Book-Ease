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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on 401 Unauthorized, not on other errors
    if (error.response?.status === 401) {
      // Check if we're already on login page to avoid redirect loops
      if (!window.location.pathname.includes('/login')) {
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
