import React, { useState } from 'react'
import { FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'

const CategoryManager = ({ categories, loading, onCreate, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({ name: '', description: '', color: '#667eea' })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (editingId) {
            onUpdate(editingId, formData)
            setEditingId(null)
        } else {
            onCreate(formData)
        }
        setFormData({ name: '', description: '', color: '#667eea' })
    }

    const handleEdit = (category) => {
        setEditingId(category._id)
        setFormData({
            name: category.name,
            description: category.description || '',
            color: category.color || '#667eea',
        })
    }

    const handleCancel = () => {
        setEditingId(null)
        setFormData({ name: '', description: '', color: '#667eea' })
    }

    if (loading) {
        return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div></div>
    }

    return (
        <div className="space-y-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Category Name *"
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
                    <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="h-12 w-full border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                        {editingId ? 'Update Category' : 'Create Category'}
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
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Color</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {categories.map((category) => (
                            <tr key={category._id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                                <td className="px-6 py-4 font-medium">{category.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{category.slug}</td>
                                <td className="px-6 py-4 text-sm">{category.description || '-'}</td>
                                <td className="px-6 py-4">
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: category.color || '#667eea' }}></div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(category)} className="text-blue-500 hover:text-blue-700">
                                            <FiEdit2 size={18} />
                                        </button>
                                        <button onClick={() => onDelete(category._id)} className="text-red-500 hover:text-red-700">
                                            <FiTrash2 size={18} />
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

export default CategoryManager