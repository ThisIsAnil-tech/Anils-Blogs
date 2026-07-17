import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const settingsService = {
    getSettings: async () => {
        const response = await api.get(API_ENDPOINTS.SETTINGS.BASE)
        return response.data
    },

    updateSettings: async (data) => {
        const response = await api.put(API_ENDPOINTS.SETTINGS.BASE, data)
        return response.data
    },
}