import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../hooks/useNotification'

const AdminProfilePage = () => {
    const { user, updateProfile, changePassword } = useAuth()
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        bio: user?.bio || '',
    })
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [loading, setLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const { addNotification } = useNotification()

    const handleProfileSubmit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const result = await updateProfile(profileData)
            if (!result.success) {
                addNotification('Failed to update profile', 'error')
            }
        } catch (error) {
            addNotification('Failed to update profile', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addNotification('Passwords do not match', 'error')
            return
        }

        if (passwordData.newPassword.length < 8) {
            addNotification('Password must be at least 8 characters', 'error')
            return
        }

        try {
            setPasswordLoading(true)
            const result = await changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            )
            if (result.success) {
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                })
            }
        } catch (error) {
            addNotification('Failed to change password', 'error')
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleProfileChange = (e) => {
        const { name, value } = e.target
        setProfileData(prev => ({ ...prev, [name]: value }))
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <h1 className="text-3xl font-bold">Profile Settings</h1>

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold">Profile Information</h2>

                <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                        type="text"
                        value={user?.username || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                        name="bio"
                        value={profileData.bio || ''}
                        onChange={handleProfileChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Update Profile'}
                </button>
            </form>

            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold">Change Password</h2>

                <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
            </form>
        </div>
    )
}

export default AdminProfilePage