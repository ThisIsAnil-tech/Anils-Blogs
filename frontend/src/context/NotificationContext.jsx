import React, { createContext, useState, useContext, useCallback } from 'react'
import toast from 'react-hot-toast'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([])

    const addNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now()
        const notification = { id, message, type, duration }

        setNotifications(prev => [...prev, notification])

        // Show toast
        switch (type) {
            case 'success':
                toast.success(message, { duration })
                break
            case 'error':
                toast.error(message, { duration })
                break
            case 'warning':
                toast.custom(message, { duration })
                break
            default:
                toast(message, { duration })
        }

        // Auto remove after duration
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }, duration)

        return id
    }, [])

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const clearNotifications = useCallback(() => {
        setNotifications([])
    }, [])

    const value = {
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
    }

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}