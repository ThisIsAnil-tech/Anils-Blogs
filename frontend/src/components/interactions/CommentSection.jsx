import React, { useState, useEffect } from 'react'
import { formatDate } from '../../utils/helpers'
import { commentService } from '../../services/commentService'
import { useNotification } from '../../hooks/useNotification'
import Input from '../common/Input'
import Button from '../common/Button'

const CommentSection = ({ blogId }) => {
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        authorName: '',
        authorEmail: '',
        content: '',
    })
    const { addNotification } = useNotification()

    useEffect(() => {
        loadComments()
    }, [blogId])

    const loadComments = async () => {
        try {
            setLoading(true)
            const response = await commentService.getComments(blogId)
            if (response.success) {
                setComments(response.data.filter(c => c.status === 'approved'))
            }
        } catch (error) {
            console.error('Failed to load comments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.authorName.trim() || !formData.content.trim()) {
            addNotification('Please fill in all required fields', 'error')
            return
        }

        try {
            setSubmitting(true)
            const response = await commentService.addComment(blogId, formData)

            if (response.success) {
                addNotification('Comment submitted for moderation', 'success')
                setFormData({
                    authorName: '',
                    authorEmail: '',
                    content: '',
                })
                loadComments()
            }
        } catch (error) {
            addNotification('Failed to submit comment', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold">
                Comments ({comments.length})
            </h3>

            {/* Comment List */}
            {comments.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No comments yet. Be the first!</p>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div
                            key={comment._id}
                            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{comment.authorName}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(comment.createdAt)}
                                </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <h4 className="text-lg font-semibold">Leave a Comment</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Name *"
                        name="authorName"
                        value={formData.authorName}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Email (optional)"
                        name="authorEmail"
                        type="email"
                        value={formData.authorEmail}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Comment *</label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                </div>

                <Button type="submit" loading={submitting}>
                    Submit Comment
                </Button>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your comment will be visible after moderation.
                </p>
            </form>
        </div>
    )
}

export default CommentSection