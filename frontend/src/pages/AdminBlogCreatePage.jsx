import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BlogForm from '../components/admin/Blogs/BlogForm'
import { blogService } from '../services/blogService'
import { categoryService } from '../services/categoryService'
import { tagService } from '../services/tagService'
import { useNotification } from '../hooks/useNotification'

const AdminBlogCreatePage = () => {
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(false)
    const { addNotification } = useNotification()

    useEffect(() => {
        const loadData = async () => {
            try {
                const [categoriesRes, tagsRes] = await Promise.all([
                    categoryService.getCategories(),
                    tagService.getTags(),
                ])

                if (categoriesRes.success) setCategories(categoriesRes.data)
                if (tagsRes.success) setTags(tagsRes.data)
            } catch (error) {
                addNotification('Failed to load form data', 'error')
            }
        }
        loadData()
    }, [addNotification])

    const handleSubmit = async (data) => {
        try {
            setLoading(true)
            const response = await blogService.createBlog(data)
            if (response.success) {
                addNotification('Blog created successfully!', 'success')
                navigate('/admin/blogs')
            }
        } catch (error) {
            addNotification('Failed to create blog', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Create New Blog</h1>
            <BlogForm
                categories={categories}
                tags={tags}
                onSubmit={handleSubmit}
                loading={loading}
            />
        </div>
    )
}

export default AdminBlogCreatePage