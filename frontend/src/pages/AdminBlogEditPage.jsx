import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BlogForm from '../components/admin/Blogs/BlogForm'
import { blogService } from '../services/blogService'
import { categoryService } from '../services/categoryService'
import { tagService } from '../services/tagService'
import { useNotification } from '../hooks/useNotification'

const AdminBlogEditPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [blog, setBlog] = useState(null)
    const [categories, setCategories] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const { addNotification } = useNotification()

    useEffect(() => {
        const loadData = async () => {
            try {
                const [blogRes, categoriesRes, tagsRes] = await Promise.all([
                    blogService.getBlogById(id),
                    categoryService.getCategories(),
                    tagService.getTags(),
                ])

                if (blogRes.success) setBlog(blogRes.data)
                if (categoriesRes.success) setCategories(categoriesRes.data)
                if (tagsRes.success) setTags(tagsRes.data)
            } catch (error) {
                addNotification('Failed to load blog data', 'error')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id, addNotification])

    const handleSubmit = async (data) => {
        try {
            setSubmitting(true)
            const response = await blogService.updateBlog(id, data)
            if (response.success) {
                addNotification('Blog updated successfully!', 'success')
                navigate('/admin/blogs')
            }
        } catch (error) {
            addNotification('Failed to update blog', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-64"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
        )
    }

    if (!blog) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Blog Not Found</h2>
                <button
                    onClick={() => navigate('/admin/blogs')}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Back to Blogs
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Edit Blog</h1>
            <BlogForm
                initialData={blog}
                categories={categories}
                tags={tags}
                onSubmit={handleSubmit}
                loading={submitting}
            />
        </div>
    )
}

export default AdminBlogEditPage