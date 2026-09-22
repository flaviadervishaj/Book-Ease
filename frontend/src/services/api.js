import axios from 'axios'


const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const clearStoredSession = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  delete api.defaults.headers.common.Authorization
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error.response?.data?.code
    const authenticationCodes = new Set([
      'TOKEN_EXPIRED',
      'INVALID_TOKEN',
      'MISSING_TOKEN',
      'TOKEN_REVOKED',
    ])

    if (error.response?.status === 401 && authenticationCodes.has(code)) {
      clearStoredSession()
      window.dispatchEvent(new Event('auth:expired'))
    }

    return Promise.reject(error)
  },
)

export const updateAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    clearStoredSession()
  }
}

export default api
