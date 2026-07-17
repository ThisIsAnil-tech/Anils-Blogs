import React, { useState } from 'react'

const Settings = ({ settings, onUpdate, loading }) => {
    const [formData, setFormData] = useState({
        blogName: settings?.blogName || '',
        blogDescription: settings?.blogDescription || '',
        contactEmail: settings?.contactEmail || '',
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onUpdate(formData)
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold">Blog Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Blog Name</label>
                    <input
                        type="text"
                        value={formData.blogName}
                        onChange={(e) => setFormData({ ...formData, blogName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Blog Description</label>
                    <textarea
                        value={formData.blogDescription}
                        onChange={(e) => setFormData({ ...formData, blogDescription: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                    <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <button type="submit" disabled={loading} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </form>
        </div>
    )
}

export default Settings