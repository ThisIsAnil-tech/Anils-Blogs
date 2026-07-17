import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const searchService = {
    search: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.SEARCH.BASE, { params })
        return response.data
    },

    getSuggestions: async (query) => {
        const response = await api.get(API_ENDPOINTS.SEARCH.SUGGESTIONS, {
            params: { q: query },
        })
        return response.data
    },

    advancedSearch: async (data) => {
        const response = await api.post(API_ENDPOINTS.SEARCH.ADVANCED, data)
        return response.data
    },
}