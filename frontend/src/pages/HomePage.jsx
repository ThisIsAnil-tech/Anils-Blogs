import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import BlogGrid from '../components/blog/BlogGrid'
import SearchBar from '../components/filters/SearchBar'
import CategoryFilter from '../components/filters/CategoryFilter'
import TagCloud from '../components/filters/TagCloud'
import NewsletterForm from '../components/subscription/NewsletterForm'
import { blogService } from '../services/blogService'
import { categoryService } from '../services/categoryService'
import { tagService } from '../services/tagService'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useNotification } from '../hooks/useNotification'

const HomePage = () => {
    const [blogs, setBlogs] = useState([])
    const [categories, setCategories] = useState([])
    const [popularTags, setPopularTags] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const { addNotification } = useNotification()

    const fetchBlogs = useCallback(async (pageNum = 1, append = false) => {
        try {
            setLoading(true)
            const params = { page: pageNum, limit: 12 }

            if (searchTerm) params.q = searchTerm
            if (selectedCategory) params.category = selectedCategory

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
    }, [searchTerm, selectedCategory, addNotification])

    const fetchMore = useCallback((nextPage) => {
        fetchBlogs(nextPage, true)
    }, [fetchBlogs])

    const { lastElementRef, resetPagination } = useInfiniteScroll(
        fetchMore,
        hasMore,
        loading
    )

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [categoriesRes, tagsRes] = await Promise.all([
                    categoryService.getCategories(),
                    tagService.getPopularTags(),
                ])

                if (categoriesRes.success) {
                    setCategories(categoriesRes.data)
                }
                if (tagsRes.success) {
                    setPopularTags(tagsRes.data)
                }
            } catch (error) {
                console.error('Failed to load initial data:', error)
            }
        }

        loadInitialData()
    }, [])

    useEffect(() => {
        setPage(1)
        resetPagination()
        fetchBlogs(1, false)
    }, [searchTerm, selectedCategory, fetchBlogs, resetPagination])

    const handleSearch = (term) => {
        setSearchTerm(term)
    }

    const handleCategorySelect = (categorySlug) => {
        setSelectedCategory(categorySlug === selectedCategory ? '' : categorySlug)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="text-center py-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Welcome to Our Blog
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Discover insightful articles, tutorials, and stories from our community
                </p>
            </section>

            {/* Filters */}
            <div className="mb-8 space-y-4">
                <SearchBar onSearch={handleSearch} />
                <div className="flex flex-wrap items-center gap-4">
                    <CategoryFilter
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={handleCategorySelect}
                    />
                    <TagCloud tags={popularTags} />
                </div>
            </div>

            {/* Blog Grid */}
            <BlogGrid
                blogs={blogs}
                loading={loading}
                lastElementRef={lastElementRef}
            />

            {/* Loading More Indicator */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                </div>
            )}

            {/* No Results */}
            {!loading && blogs.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        No blogs found. Try adjusting your filters.
                    </p>
                </div>
            )}

            {/* Newsletter Subscription */}
            <section className="mt-16 py-12 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Get the latest posts delivered straight to your inbox
                    </p>
                    <NewsletterForm />
                </div>
            </section>
        </div>
    )
}

export default HomePage