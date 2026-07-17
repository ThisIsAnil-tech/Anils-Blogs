export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/v1/auth/login',
        PROFILE: '/api/v1/auth/profile',
        CHANGE_PASSWORD: '/api/v1/auth/change-password',
        LOGOUT: '/api/v1/auth/logout',
    },
    BLOGS: {
        PUBLIC: '/api/v1/blogs',
        RECENT: '/api/v1/blogs/recent',
        POPULAR: '/api/v1/blogs/popular',
        ADMIN: '/api/v1/admin/blogs',
        NOTIFY: '/api/v1/admin/blogs/:id/notify',
    },
    CATEGORIES: {
        BASE: '/api/v1/categories',
        BLOGS: '/api/v1/categories/:slug/blogs',
    },
    TAGS: {
        BASE: '/api/v1/tags',
        POPULAR: '/api/v1/tags/popular',
        BLOGS: '/api/v1/tags/:slug/blogs',
    },
    COMMENTS: {
        BASE: '/api/v1/comments',
        PENDING: '/api/v1/admin/comments/pending',
        APPROVE: '/api/v1/admin/comments/:id/approve',
        REJECT: '/api/v1/admin/comments/:id/reject',
    },
    LIKES: {
        TOGGLE: '/api/v1/likes/:blogId',
        CHECK: '/api/v1/likes/:blogId/check',
        COUNT: '/api/v1/likes/:blogId/count',
    },
    SHARES: {
        SHARE: '/api/v1/shares/:blogId',
        COUNT: '/api/v1/shares/:blogId/count',
    },
    SUBSCRIBERS: {
        BASE: '/api/v1/subscribers',
        VERIFY: '/api/v1/subscribers/verify/:token',
        UNSUBSCRIBE: '/api/v1/subscribers/unsubscribe',
        PREFERENCES: '/api/v1/subscribers/preferences/:token',
    },
    SEARCH: {
        BASE: '/api/v1/search',
        SUGGESTIONS: '/api/v1/search/suggestions',
        ADVANCED: '/api/v1/search/advanced',
    },
    SETTINGS: {
        BASE: '/api/v1/settings',
    },
    SYSTEM: {
        HEALTH: '/health',
        DOCS: '/api-docs',
    },
}

export const BLOG_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
}

export const COMMENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
}

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    AUTH_USER: 'authUser',
    THEME: 'darkMode',
    PREFERENCES: 'userPreferences',
}

export const DEFAULT_PAGINATION = {
    PAGE: 1,
    LIMIT: 12,
}

export const SOCIAL_PLATFORMS = {
    TWITTER: 'twitter',
    FACEBOOK: 'facebook',
    LINKEDIN: 'linkedin',
    WHATSAPP: 'whatsapp',
    TELEGRAM: 'telegram',
}

export const ROUTES = {
    HOME: '/',
    BLOGS: '/blogs',
    BLOG_DETAIL: '/blogs/:slug',
    CATEGORY: '/categories/:slug',
    TAG: '/tags/:slug',
    LOGIN: '/login',
    ADMIN: '/admin',
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_BLOGS: '/admin/blogs',
    ADMIN_BLOG_CREATE: '/admin/blogs/create',
    ADMIN_BLOG_EDIT: '/admin/blogs/:id/edit',
    ADMIN_CATEGORIES: '/admin/categories',
    ADMIN_TAGS: '/admin/tags',
    ADMIN_COMMENTS: '/admin/comments',
    ADMIN_SUBSCRIBERS: '/admin/subscribers',
    ADMIN_SETTINGS: '/admin/settings',
    ADMIN_PROFILE: '/admin/profile',
}

export const SORT_OPTIONS = {
    DATE_DESC: 'date_desc',
    DATE_ASC: 'date_asc',
    VIEWS: 'views',
    LIKES: 'likes',
    RELEVANCE: 'relevance',
}

export const SORT_LABELS = {
    [SORT_OPTIONS.DATE_DESC]: 'Newest First',
    [SORT_OPTIONS.DATE_ASC]: 'Oldest First',
    [SORT_OPTIONS.VIEWS]: 'Most Viewed',
    [SORT_OPTIONS.LIKES]: 'Most Liked',
    [SORT_OPTIONS.RELEVANCE]: 'Relevance',
}