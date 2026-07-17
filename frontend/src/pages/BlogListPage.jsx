import React, { useState, useEffect, useCallback } from 'react'
import BlogGrid from '../components/blog/BlogGrid'
import SearchBar from '../components/filters/SearchBar'
import { blogService } from '../services/blogService'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useNotification } from '../hooks/useNotification'

const BlogListPage = () => {
    const [blogs, setBlogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const { addNotification } = useNotification()

    const fetchBlogs = useCallback(async (pageNum = 1, append = false) => {
        try {
            setLoading(true)
            const params = { page: pageNum, limit: 12 }
            if (searchTerm) params.q = searchTerm

            const response = await blogService.getPublishedBlogs(params)

            if (response.success) {
                const { blogs: newBlogs, pagination } = response.data
                setBlogs(prev => append ? [...prev, ...newBlogs] : newBlogs)
                setHasMore(pageNum < pagination.pages)
            }
        } catch (error) {
            addNotification('Failed to load blogs', 'error')
        } finally {
            setLoading(false)
        }
    }, [searchTerm, addNotification])

    const fetchMore = useCallback((nextPage) => {
        fetchBlogs(nextPage, true)
    }, [fetchBlogs])

    const { lastElementRef, resetPagination } = useInfiniteScroll(
        fetchMore,
        hasMore,
        loading
    )

    useEffect(() => {
        setPage(1)
        resetPagination()
        fetchBlogs(1, false)
    }, [searchTerm, fetchBlogs, resetPagination])

    const handleSearch = (term) => {
        setSearchTerm(term)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">All Blogs</h1>
                <SearchBar onSearch={handleSearch} placeholder="Search blogs..." />
            </div>

            <BlogGrid
                blogs={blogs}
                loading={loading}
                lastElementRef={lastElementRef}
            />

            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                </div>
            )}

            {!loading && blogs.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        No blogs found
                    </p>
                </div>
            )}
        </div>
    )
}

export default BlogListPage