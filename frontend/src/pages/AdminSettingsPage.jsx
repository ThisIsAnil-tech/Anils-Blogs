import React, { useState, useEffect } from 'react'
import { settingsService } from '../services/settingsService'
import { useNotification } from '../hooks/useNotification'

const AdminSettingsPage = () => {
    const [settings, setSettings] = useState({
        blogName: '',
        blogDescription: '',
        contactEmail: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { addNotification } = useNotification()

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const response = await settingsService.getSettings()
            if (response.success) {
                setSettings(response.data)
            }
        } catch (error) {
            addNotification('Failed to load settings', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            await settingsService.updateSettings(settings)
            addNotification('Settings updated successfully', 'success')
        } catch (error) {
            addNotification('Failed to update settings', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setSettings(prev => ({ ...prev, [name]: value }))
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-64"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Blog Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6 max-w-2xl">
                <div>
                    <label className="block text-sm font-medium mb-1">Blog Name</label>
                    <input
                        type="text"
                        name="blogName"
                        value={settings.blogName || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Blog Description</label>
                    <textarea
                        name="blogDescription"
                        value={settings.blogDescription || ''}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                    <input
                        type="email"
                        name="contactEmail"
                        value={settings.contactEmail || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </form>
        </div>
    )
}

export default AdminSettingsPage