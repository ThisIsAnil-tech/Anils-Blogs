import api from './api'
import { API_ENDPOINTS } from '../utils/constants'

export const shareService = {
    shareBlog: async (blogId, platform) => {
        const response = await api.post(
            API_ENDPOINTS.SHARES.SHARE.replace(':blogId', blogId),
            { platform }
        )
        return response.data
    },

    getShareCount: async (blogId) => {
        const response = await api.get(API_ENDPOINTS.SHARES.COUNT.replace(':blogId', blogId))
        return response.data
    },
}