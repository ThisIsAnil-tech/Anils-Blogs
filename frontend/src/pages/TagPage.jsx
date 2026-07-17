import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import BlogGrid from '../components/blog/BlogGrid'
import { tagService } from '../services/tagService'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useNotification } from '../hooks/useNotification'

const TagPage = () => {
    const { slug } = useParams()
    const [tag, setTag] = useState(null)
    const [blogs, setBlogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const { addNotification } = useNotification()

    const fetchTagBlogs = useCallback(async (pageNum = 1, append = false) => {
        if (!slug) return

        try {
            setLoading(true)
            const response = await tagService.getTagBlogs(slug, pageNum, 12)

            if (response.success) {
                const { blogs: newBlogs, pagination } = response.data
                setBlogs(prev => append ? [...prev, ...newBlogs] : newBlogs)
                setHasMore(pageNum < pagination.pages)
            }
        } catch (error) {
            addNotification('Failed to load tag blogs', 'error')
        } finally {
            setLoading(false)
        }
    }, [slug, addNotification])

    const fetchMore = useCallback((nextPage) => {
        fetchTagBlogs(nextPage, true)
    }, [fetchTagBlogs])

    const { lastElementRef, resetPagination } = useInfiniteScroll(
        fetchMore,
        hasMore,
        loading
    )

    useEffect(() => {
        const loadTag = async () => {
            try {
                const response = await tagService.getTagBySlug(slug)
                if (response.success) {
                    setTag(response.data)
                }
            } catch (error) {
                addNotification('Tag not found', 'error')
            }
        }

        loadTag()
    }, [slug, addNotification])

    useEffect(() => {
        setPage(1)
        resetPagination()
        fetchTagBlogs(1, false)
    }, [slug, fetchTagBlogs, resetPagination])

    if (!tag) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-96"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">#{tag.name}</h1>
                {tag.description && (
                    <p className="text-gray-600 dark:text-gray-400">{tag.description}</p>
                )}
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
                        No blogs with this tag yet.
                    </p>
                </div>
            )}
        </div>
    )
}

export default TagPage