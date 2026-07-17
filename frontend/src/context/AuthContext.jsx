import React, { createContext, useState, useContext, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('authUser')

        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
            setIsAuthenticated(true)
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        try {
            setLoading(true)
            const response = await authService.login(username, password)

            if (response.success) {
                const { token, user } = response.data
                setToken(token)
                setUser(user)
                setIsAuthenticated(true)

                localStorage.setItem('authToken', token)
                localStorage.setItem('authUser', JSON.stringify(user))

                toast.success('Login successful!')
                return { success: true }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed')
            return { success: false, error: error.response?.data?.message }
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        try {
            await authService.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setToken(null)
            setUser(null)
            setIsAuthenticated(false)
            localStorage.removeItem('authToken')
            localStorage.removeItem('authUser')
            toast.success('Logged out successfully')
        }
    }

    const updateProfile = async (data) => {
        try {
            const response = await authService.updateProfile(data)
            if (response.success) {
                const updatedUser = response.data
                setUser(updatedUser)
                localStorage.setItem('authUser', JSON.stringify(updatedUser))
                toast.success('Profile updated successfully')
                return { success: true }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await authService.changePassword(currentPassword, newPassword)
            if (response.success) {
                toast.success('Password changed successfully')
                return { success: true }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password change failed')
            return { success: false, error: error.response?.data?.message }
        }
    }

    const value = {
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        updateProfile,
        changePassword,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}