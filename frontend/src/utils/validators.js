export const validators = {
    required: (value) => {
        if (!value || value.trim() === '') {
            return 'This field is required'
        }
        return null
    },

    email: (value) => {
        if (!value) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address'
        }
        return null
    },

    minLength: (min) => (value) => {
        if (!value) return null
        if (value.length < min) {
            return `Minimum ${min} characters required`
        }
        return null
    },

    maxLength: (max) => (value) => {
        if (!value) return null
        if (value.length > max) {
            return `Maximum ${max} characters allowed`
        }
        return null
    },

    password: (value) => {
        if (!value) return null
        if (value.length < 8) {
            return 'Password must be at least 8 characters'
        }
        if (!/[A-Z]/.test(value)) {
            return 'Password must contain at least one uppercase letter'
        }
        if (!/[a-z]/.test(value)) {
            return 'Password must contain at least one lowercase letter'
        }
        if (!/[0-9]/.test(value)) {
            return 'Password must contain at least one number'
        }
        return null
    },

    confirmPassword: (password) => (value) => {
        if (value !== password) {
            return 'Passwords do not match'
        }
        return null
    },

    url: (value) => {
        if (!value) return null
        try {
            new URL(value)
            return null
        } catch {
            return 'Please enter a valid URL'
        }
    },

    phone: (value) => {
        if (!value) return null
        const phoneRegex = /^[0-9+\-\s()]{10,15}$/
        if (!phoneRegex.test(value)) {
            return 'Please enter a valid phone number'
        }
        return null
    },

    slug: (value) => {
        if (!value) return null
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        if (!slugRegex.test(value)) {
            return 'Slug must contain only lowercase letters, numbers, and hyphens'
        }
        return null
    },

    username: (value) => {
        if (!value) return null
        if (value.length < 3) {
            return 'Username must be at least 3 characters'
        }
        if (value.length > 20) {
            return 'Username must be less than 20 characters'
        }
        const usernameRegex = /^[a-zA-Z0-9_]+$/
        if (!usernameRegex.test(value)) {
            return 'Username can only contain letters, numbers, and underscores'
        }
        return null
    },
}

export const validate = (validations, value) => {
    for (const validation of validations) {
        const error = validation(value)
        if (error) return error
    }
    return null
}

export const validateForm = (fields) => {
    const errors = {}
    let isValid = true

    for (const [key, config] of Object.entries(fields)) {
        const error = validate(config.validations || [], config.value)
        if (error) {
            errors[key] = error
            isValid = false
        }
    }

    return { errors, isValid }
}