import React, { useState } from 'react'
import { formatDate } from '../../../utils/helpers'
import { FiTrash2, FiMail } from 'react-icons/fi'

const SubscriberList = ({ subscribers, loading, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredSubscribers = subscribers.filter(sub =>
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div></div>
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Search subscribers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                />
            </div>

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
                                        <button onClick={() => onDelete(sub._id)} className="text-red-500 hover:text-red-700">
                                            <FiTrash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SubscriberList