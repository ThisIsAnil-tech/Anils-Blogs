import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const blogService = {
    // Public endpoints
    getPublishedBlogs: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.BLOGS.PUBLIC, { params })
        return response.data
    },

    getRecentBlogs: async (limit = 10) => {
        const response = await api.get(API_ENDPOINTS.BLOGS.RECENT, { params: { limit } })
        return response.data
    },

    getPopularBlogs: async (limit = 10) => {
        const response = await api.get(API_ENDPOINTS.BLOGS.POPULAR, { params: { limit } })
        return response.data
    },

    getBlogBySlug: async (slug) => {
        const response = await api.get(`${API_ENDPOINTS.BLOGS.PUBLIC}/${slug}`)
        return response.data
    },

    getBlogById: async (id) => {
        const response = await api.get(`${API_ENDPOINTS.BLOGS.ADMIN}/${id}`)
        return response.data
    },

    getRelatedPosts: async (blogId, limit = 3) => {
        const response = await api.get(`${API_ENDPOINTS.BLOGS.PUBLIC}/${blogId}/related`, {
            params: { limit },
        })
        return response.data
    },

    // Admin endpoints
    getAdminBlogs: async (params = {}) => {
        const response = await api.get(API_ENDPOINTS.BLOGS.ADMIN, { params })
        return response.data
    },

    createBlog: async (data) => {
        const response = await api.post(API_ENDPOINTS.BLOGS.ADMIN, data)
        return response.data
    },

    updateBlog: async (id, data) => {
        const response = await api.put(`${API_ENDPOINTS.BLOGS.ADMIN}/${id}`, data)
        return response.data
    },

    deleteBlog: async (id) => {
        const response = await api.delete(`${API_ENDPOINTS.BLOGS.ADMIN}/${id}`)
        return response.data
    },

    notifySubscribers: async (id) => {
        const response = await api.post(
            API_ENDPOINTS.BLOGS.NOTIFY.replace(':id', id)
        )
        return response.data
    },

    clearCache: async () => {
        const response = await api.post(API_ENDPOINTS.BLOGS.ADMIN + '/cache/clear')
        return response.data
    },
}