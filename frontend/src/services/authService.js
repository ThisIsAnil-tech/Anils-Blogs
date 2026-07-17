import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const authService = {
    login: async (username, password) => {
        const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
            username,
            password,
        })
        return response.data
    },

    getProfile: async () => {
        const response = await api.get(API_ENDPOINTS.AUTH.PROFILE)
        return response.data
    },

    updateProfile: async (data) => {
        const response = await api.put(API_ENDPOINTS.AUTH.PROFILE, data)
        return response.data
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            currentPassword,
            newPassword,
        })
        return response.data
    },

    logout: async () => {
        const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT)
        return response.data
    },
}