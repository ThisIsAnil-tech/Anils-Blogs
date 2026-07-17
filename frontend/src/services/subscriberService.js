import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const subscriberService = {
    // Public endpoints
    subscribe: async (data) => {
        const response = await api.post(API_ENDPOINTS.SUBSCRIBERS.BASE, data)
        return response.data
    },

    verifyEmail: async (token) => {
        const response = await api.get(API_ENDPOINTS.SUBSCRIBERS.VERIFY.replace(':token', token))
        return response.data
    },

    unsubscribe: async (email) => {
        const response = await api.post(API_ENDPOINTS.SUBSCRIBERS.UNSUBSCRIBE, { email })
        return response.data
    },

    getPreferences: async (token) => {
        const response = await api.get(
            API_ENDPOINTS.SUBSCRIBERS.PREFERENCES.replace(':token', token)
        )
        return response.data
    },

    updatePreferences: async (token, preferences) => {
        const response = await api.put(
            API_ENDPOINTS.SUBSCRIBERS.PREFERENCES.replace(':token', token),
            { preferences }
        )
        return response.data
    },

    // Admin endpoints
    getSubscribers: async () => {
        const response = await api.get(API_ENDPOINTS.SUBSCRIBERS.BASE + '/all')
        return response.data
    },

    deleteSubscriber: async (id) => {
        const response = await api.delete(`${API_ENDPOINTS.SUBSCRIBERS.BASE}/${id}`)
        return response.data
    },
}