import React, { useState, useEffect } from 'react'
import { tagService } from '../services/tagService'
import { useNotification } from '../hooks/useNotification'

const AdminTagsPage = () => {
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    })
    const { addNotification } = useNotification()

    useEffect(() => {
        loadTags()
    }, [])

    const loadTags = async () => {
        try {
            setLoading(true)
            const response = await tagService.getTags()
            if (response.success) {
                setTags(response.data)
            }
        } catch (error) {
            addNotification('Failed to load tags', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingId) {
                await tagService.updateTag(editingId, formData)
                addNotification('Tag updated successfully', 'success')
            } else {
                await tagService.createTag(formData)
                addNotification('Tag created successfully', 'success')
            }
            setFormData({ name: '', description: '' })
            setEditingId(null)
            loadTags()
        } catch (error) {
            addNotification('Failed to save tag', 'error')
        }
    }

    const handleEdit = (tag) => {
        setEditingId(tag._id)
        setFormData({
            name: tag.name,
            description: tag.description || '',
        })
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tag?')) return
        try {
            await tagService.deleteTag(id)
            addNotification('Tag deleted successfully', 'success')
            loadTags()
        } catch (error) {
            addNotification('Failed to delete tag', 'error')
        }
    }

    const handleCancel = () => {
        setEditingId(null)
        setFormData({ name: '', description: '' })
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
            <h1 className="text-3xl font-bold">Manage Tags</h1>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Tag Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                        {editingId ? 'Update Tag' : 'Create Tag'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Posts</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tags.map((tag) => (
                            <tr key={tag._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                <td className="px-6 py-4 font-medium">#{tag.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tag.slug}</td>
                                <td className="px-6 py-4 text-sm">{tag.description || '-'}</td>
                                <td className="px-6 py-4 text-sm">{tag.count || 0}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(tag)}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tag._id)}
                                            className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminTagsPage