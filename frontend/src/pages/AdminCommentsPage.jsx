import React, { useState, useEffect } from 'react'
import { formatDate } from '../utils/helpers'
import { commentService } from '../services/commentService'
import { useNotification } from '../hooks/useNotification'

const AdminCommentsPage = () => {
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const { addNotification } = useNotification()

    useEffect(() => {
        loadComments()
    }, [filter])

    const loadComments = async () => {
        try {
            setLoading(true)
            let response
            if (filter === 'pending') {
                response = await commentService.getPendingComments()
            } else {
                // Fetch all comments or filtered by status
                response = await commentService.getComments({ status: filter })
            }

            if (response.success) {
                setComments(response.data || [])
            }
        } catch (error) {
            addNotification('Failed to load comments', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id) => {
        try {
            await commentService.approveComment(id)
            addNotification('Comment approved', 'success')
            loadComments()
        } catch (error) {
            addNotification('Failed to approve comment', 'error')
        }
    }

    const handleReject = async (id) => {
        try {
            await commentService.rejectComment(id)
            addNotification('Comment rejected', 'success')
            loadComments()
        } catch (error) {
            addNotification('Failed to reject comment', 'error')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return
        try {
            await commentService.deleteComment(id)
            addNotification('Comment deleted', 'success')
            loadComments()
        } catch (error) {
            addNotification('Failed to delete comment', 'error')
        }
    }

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
            <h1 className="text-3xl font-bold">Moderate Comments</h1>

            {/* Filter */}
            <div className="flex gap-2">
                {['pending', 'approved', 'rejected'].map((status) => (
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
            {comments.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                    No {filter} comments
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div
                            key={comment._id}
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
                        >
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
                                                onClick={() => handleApprove(comment._id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(comment._id)}
                                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleDelete(comment._id)}
                                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                    >
                                        Delete
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

export default AdminCommentsPage