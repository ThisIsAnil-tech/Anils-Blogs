import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const tagService = {
    // Public endpoints
    getTags: async () => {
        const response = await api.get(API_ENDPOINTS.TAGS.BASE)
        return response.data
    },

    getPopularTags: async () => {
        const response = await api.get(API_ENDPOINTS.TAGS.POPULAR)
        return response.data
    },

    getTagBySlug: async (slug) => {
        const response = await api.get(`${API_ENDPOINTS.TAGS.BASE}/${slug}`)
        return response.data
    },

    getTagBlogs: async (slug, page = 1, limit = 12) => {
        const response = await api.get(
            API_ENDPOINTS.TAGS.BLOGS.replace(':slug', slug),
            { params: { page, limit } }
        )
        return response.data
    },

    // Admin endpoints
    createTag: async (data) => {
        const response = await api.post(API_ENDPOINTS.TAGS.BASE, data)
        return response.data
    },

    updateTag: async (id, data) => {
        const response = await api.put(`${API_ENDPOINTS.TAGS.BASE}/${id}`, data)
        return response.data
    },

    deleteTag: async (id) => {
        const response = await api.delete(`${API_ENDPOINTS.TAGS.BASE}/${id}`)
        return response.data
    },
}