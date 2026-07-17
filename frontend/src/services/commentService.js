import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const commentService = {
    // Public endpoints
    getComments: async (blogId) => {
        const response = await api.get(`${API_ENDPOINTS.COMMENTS.BASE}/${blogId}`)
        return response.data
    },

    addComment: async (blogId, data) => {
        const response = await api.post(`${API_ENDPOINTS.COMMENTS.BASE}/${blogId}`, data)
        return response.data
    },

    updateComment: async (id, data) => {
        const response = await api.put(`${API_ENDPOINTS.COMMENTS.BASE}/${id}`, data)
        return response.data
    },

    deleteComment: async (id) => {
        const response = await api.delete(`${API_ENDPOINTS.COMMENTS.BASE}/${id}`)
        return response.data
    },

    // Admin endpoints
    getPendingComments: async () => {
        const response = await api.get(API_ENDPOINTS.COMMENTS.PENDING)
        return response.data
    },

    approveComment: async (id) => {
        const response = await api.put(API_ENDPOINTS.COMMENTS.APPROVE.replace(':id', id))
        return response.data
    },

    rejectComment: async (id) => {
        const response = await api.put(API_ENDPOINTS.COMMENTS.REJECT.replace(':id', id))
        return response.data
    },
}