import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../../utils/helpers'
import { FiEdit2, FiTrash2, FiEye, FiSend } from 'react-icons/fi'

const BlogList = ({ blogs, loading, onDelete, onNotify, onStatusChange }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')

    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' || blog.status === filterStatus
        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 h-16 rounded"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Search blogs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            {/* Blog List */}
            {filteredBlogs.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                    No blogs found
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Views</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredBlogs.map((blog) => (
                                <tr key={blog._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/admin/blogs/${blog._id}/edit`}
                                            className="font-medium hover:underline"
                                        >
                                            {blog.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded ${blog.status === 'published'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : blog.status === 'draft'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                            }`}>
                                            {blog.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{blog.viewCount || 0}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(blog.publishDate || blog.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                to={`/blogs/${blog.slug}`}
                                                target="_blank"
                                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            >
                                                <FiEye size={18} />
                                            </Link>
                                            {blog.status === 'published' && (
                                                <button
                                                    onClick={() => onNotify(blog._id)}
                                                    className="p-1 text-blue-500 hover:text-blue-700"
                                                >
                                                    <FiSend size={18} />
                                                </button>
                                            )}
                                            <Link
                                                to={`/admin/blogs/${blog._id}/edit`}
                                                className="p-1 text-blue-500 hover:text-blue-700"
                                            >
                                                <FiEdit2 size={18} />
                                            </Link>
                                            <button
                                                onClick={() => onDelete(blog._id)}
                                                className="p-1 text-red-500 hover:text-red-700"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default BlogList