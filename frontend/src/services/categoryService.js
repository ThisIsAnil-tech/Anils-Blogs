import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const categoryService = {
    // Public endpoints
    getCategories: async () => {
        const response = await api.get(API_ENDPOINTS.CATEGORIES.BASE)
        return response.data
    },

    getCategoryBySlug: async (slug) => {
        const response = await api.get(`${API_ENDPOINTS.CATEGORIES.BASE}/${slug}`)
        return response.data
    },

    getCategoryBlogs: async (slug, page = 1, limit = 12) => {
        const response = await api.get(
            API_ENDPOINTS.CATEGORIES.BLOGS.replace(':slug', slug),
            { params: { page, limit } }
        )
        return response.data
    },

    // Admin endpoints
    createCategory: async (data) => {
        const response = await api.post(API_ENDPOINTS.CATEGORIES.BASE, data)
        return response.data
    },

    updateCategory: async (id, data) => {
        const response = await api.put(`${API_ENDPOINTS.CATEGORIES.BASE}/${id}`, data)
        return response.data
    },

    deleteCategory: async (id) => {
        const response = await api.delete(`${API_ENDPOINTS.CATEGORIES.BASE}/${id}`)
        return response.data
    },
}