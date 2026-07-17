import React, { useState } from 'react'
import { formatDate } from '../../../utils/helpers'
import { FiCheck, FiX, FiTrash2 } from 'react-icons/fi'

const CommentModeration = ({ comments, loading, onApprove, onReject, onDelete }) => {
    const [filter, setFilter] = useState('pending')

    const filteredComments = comments.filter(c => filter === 'all' || c.status === filter)

    if (loading) {
        return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div></div>
    }

    return (
        <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
                {['pending', 'approved', 'rejected', 'all'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg transition-colors ${filter === status
                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Comments List */}
            {filteredComments.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                    No {filter} comments
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredComments.map((comment) => (
                        <div key={comment._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="font-medium">{comment.authorName}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded ${comment.status === 'approved'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : comment.status === 'rejected'
                                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                            }`}>
                                            {comment.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                                    {comment.blog && (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            On: {comment.blog.title}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {comment.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => onApprove(comment._id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                            >
                                                <FiCheck size={16} /> Approve
                                            </button>
                                            <button
                                                onClick={() => onReject(comment._id)}
                                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                                            >
                                                <FiX size={16} /> Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => onDelete(comment._id)}
                                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                                    >
                                        <FiTrash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default CommentModeration