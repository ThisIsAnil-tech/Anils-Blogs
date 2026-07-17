import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const BlogEditor = ({ initialData = {}, onSubmit, loading }) => {
    const navigate = useNavigate()
    const [content, setContent] = useState('')
    const [title, setTitle] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [featuredImage, setFeaturedImage] = useState('')
    const [status, setStatus] = useState('draft')

    useEffect(() => {
        if (initialData) {
            setContent(initialData.content || '')
            setTitle(initialData.title || '')
            setExcerpt(initialData.excerpt || '')
            setFeaturedImage(initialData.featuredImage || '')
            setStatus(initialData.status || 'draft')
        }
    }, [initialData])

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            title,
            content,
            excerpt,
            featuredImage,
            status,
        })
    }

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean'],
        ],
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    className="bg-white dark:bg-gray-800 rounded-lg"
                    placeholder="Write your blog content here..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    placeholder="Brief summary of your blog..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                <input
                    type="url"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none bg-white dark:bg-gray-800"
                >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : initialData?._id ? 'Update Blog' : 'Create Blog'}
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/admin/blogs')}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default BlogEditor