import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const likeService = {
    toggleLike: async (blogId) => {
        const response = await api.post(API_ENDPOINTS.LIKES.TOGGLE.replace(':blogId', blogId))
        return response.data
    },

    checkLiked: async (blogId) => {
        const response = await api.get(API_ENDPOINTS.LIKES.CHECK.replace(':blogId', blogId))
        return response.data
    },

    getLikeCount: async (blogId) => {
        const response = await api.get(API_ENDPOINTS.LIKES.COUNT.replace(':blogId', blogId))
        return response.data
    },
}