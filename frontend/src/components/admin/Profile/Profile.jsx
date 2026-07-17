import React, { useState } from 'react'

const Profile = ({ user, onUpdateProfile, onChangePassword, loading }) => {
    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        bio: user?.bio || '',
    })
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleProfileSubmit = (e) => {
        e.preventDefault()
        onUpdateProfile(profileData)
    }

    const handlePasswordSubmit = (e) => {
        e.preventDefault()
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match')
            return
        }
        onChangePassword(passwordData.currentPassword, passwordData.newPassword)
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <h1 className="text-3xl font-bold">Profile Settings</h1>

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold">Profile Information</h2>

                <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input type="text" value={user?.username || ''} disabled className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea
                        value={profileData.bio || ''}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <button type="submit" disabled={loading} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">
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
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <button type="submit" disabled={loading} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">
                    {loading ? 'Changing...' : 'Change Password'}
                </button>
            </form>
        </div>
    )
}

export default Profile