export const formatters = {
    number: (value, options = {}) => {
        if (value === undefined || value === null) return '0'
        const num = Number(value)
        if (isNaN(num)) return '0'

        const formatOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            ...options,
        }

        return new Intl.NumberFormat('en-US', formatOptions).format(num)
    },

    currency: (value, currency = 'USD', locale = 'en-US') => {
        if (value === undefined || value === null) return '$0'
        const num = Number(value)
        if (isNaN(num)) return '$0'

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
        }).format(num)
    },

    percentage: (value, decimals = 0) => {
        if (value === undefined || value === null) return '0%'
        const num = Number(value)
        if (isNaN(num)) return '0%'

        return `${num.toFixed(decimals)}%`
    },

    fileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    timeAgo: (date) => {
        if (!date) return 'N/A'
        const now = new Date()
        const past = new Date(date)
        const diffMs = now - past
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)
        const diffMonth = Math.floor(diffDay / 30)
        const diffYear = Math.floor(diffDay / 365)

        if (diffSec < 60) return 'Just now'
        if (diffMin < 60) return `${diffMin}m ago`
        if (diffHour < 24) return `${diffHour}h ago`
        if (diffDay < 30) return `${diffDay}d ago`
        if (diffMonth < 12) return `${diffMonth}mo ago`
        return `${diffYear}y ago`
    },

    pluralize: (count, singular, plural = null) => {
        if (!plural) plural = singular + 's'
        return count === 1 ? singular : plural
    },

    capitalize: (str) => {
        if (!str) return ''
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },

    titleCase: (str) => {
        if (!str) return ''
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    },

    slugify: (str) => {
        if (!str) return ''
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    },

    stripHtml: (html) => {
        if (!html) return ''
        const tmp = document.createElement('DIV')
        tmp.innerHTML = html
        return tmp.textContent || tmp.innerText || ''
    },
}

// Export individual functions for convenience
export const { number, currency, percentage, fileSize, timeAgo, pluralize, capitalize, titleCase, slugify, stripHtml } = formatters