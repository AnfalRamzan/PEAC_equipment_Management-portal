import axios from 'axios'
import { store } from '../redux/store'        // ✅ ADDED: Redux store import
import { logout } from '../redux/slices/authSlice'  // ✅ ADDED: logout action import

const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
})

// ✅ Request Interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('========================================')
    console.log('📤 REQUEST:', config.method.toUpperCase(), config.url)
    console.log('🔑 TOKEN from localStorage:', token ? token.substring(0, 30) + '...' : 'NO TOKEN')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Authorization header added:', config.headers.Authorization.substring(0, 40) + '...')
    } else {
      console.log('❌ No token found in localStorage')
    }
    console.log('========================================')
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// ✅ Response Interceptor - Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    console.log('📥 RESPONSE:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data)
    
    // ✅ Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      console.log('🔴 401 Unauthorized - Logging out user')
      
      // ✅ Clear token from localStorage
      localStorage.removeItem('token')
      
      // ✅ Dispatch logout action to clear Redux state
      store.dispatch(logout())
      
      // ✅ Redirect to login page
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default api