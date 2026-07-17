import axios from 'axios'
import { getAuthToken } from '../utils/helpers'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken')
            localStorage.removeItem('authUser')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api