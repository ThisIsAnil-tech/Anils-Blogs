import React, { useState, useEffect } from 'react'
import { formatDate } from '../utils/helpers'
import { subscriberService } from '../services/subscriberService'
import { useNotification } from '../hooks/useNotification'

const AdminSubscribersPage = () => {
    const [subscribers, setSubscribers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const { addNotification } = useNotification()

    useEffect(() => {
        loadSubscribers()
    }, [])

    const loadSubscribers = async () => {
        try {
            setLoading(true)
            const response = await subscriberService.getSubscribers()
            if (response.success) {
                setSubscribers(response.data || [])
            }
        } catch (error) {
            addNotification('Failed to load subscribers', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subscriber?')) return
        try {
            await subscriberService.deleteSubscriber(id)
            addNotification('Subscriber deleted', 'success')
            loadSubscribers()
        } catch (error) {
            addNotification('Failed to delete subscriber', 'error')
        }
    }

    const filteredSubscribers = subscribers.filter(sub =>
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Subscribers</h1>

            {/* Search */}
            <input
                type="text"
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
            />

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Verified</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subscribed</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSubscribers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-600 dark:text-gray-400">
                                    No subscribers found
                                </td>
                            </tr>
                        ) : (
                            filteredSubscribers.map((sub) => (
                                <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                    <td className="px-6 py-4 font-medium">{sub.username || '-'}</td>
                                    <td className="px-6 py-4">{sub.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded ${sub.isVerified
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                            }`}>
                                            {sub.isVerified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(sub.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(sub._id)}
                                            className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
                Total: {filteredSubscribers.length} subscribers
            </div>
        </div>
    )
}

export default AdminSubscribersPage