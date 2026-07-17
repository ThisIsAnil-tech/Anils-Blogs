import { format } from 'date-fns'

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
    if (!date) return 'N/A'
    try {
        return format(new Date(date), formatStr)
    } catch {
        return 'Invalid Date'
    }
}

export const formatDateTime = (date) => {
    return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export const truncateText = (text, maxLength = 150) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

export const generateSlug = (text) => {
    if (!text) return ''
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export const getInitials = (name) => {
    if (!name) return 'U'
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export const getReadTime = (content) => {
    if (!content) return 1
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export const extractExcerpt = (content, maxLength = 200) => {
    if (!content) return ''
    const plainText = content.replace(/<[^>]+>/g, '').trim()
    return truncateText(plainText, maxLength)
}

export const debounce = (fn, delay = 300) => {
    let timeoutId
    return (...args) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
    }
}

export const throttle = (fn, limit = 300) => {
    let inThrottle = false
    return (...args) => {
        if (!inThrottle) {
            fn(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

export const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message
    }
    if (error.message) {
        return error.message
    }
    return 'An unexpected error occurred'
}

export const isAuthenticated = () => {
    return !!localStorage.getItem('authToken')
}

export const getAuthToken = () => {
    return localStorage.getItem('authToken')
}

export const getUser = () => {
    const user = localStorage.getItem('authUser')
    return user ? JSON.parse(user) : null
}

export const generateRandomId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export const copyToClipboard = (text) => {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text)
    }
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        try {
            document.execCommand('copy')
            resolve()
        } catch (err) {
            reject(err)
        } finally {
            document.body.removeChild(textarea)
        }
    })
}

export const getShareUrl = (platform, url, title) => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)

    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    }

    return shareUrls[platform] || ''
}

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
        return imagePath
    }
    return `${import.meta.env.VITE_API_URL}${imagePath}`
}