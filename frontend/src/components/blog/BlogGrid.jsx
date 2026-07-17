import React from 'react'
import BlogCard from './BlogCard'
import { SkeletonCard } from '../common/Skeleton'

const BlogGrid = ({ blogs, loading = false, columns = { sm: 1, md: 2, lg: 4 }, lastElementRef = null }) => {
    // Determine column classes based on props
    const getColumnClasses = () => {
        const classes = []
        if (columns.sm === 1) classes.push('grid-cols-1')
        if (columns.md === 2) classes.push('md:grid-cols-2')
        if (columns.lg === 4) classes.push('lg:grid-cols-4')
        return classes.join(' ')
    }

    // Skeleton loading state
    if (loading && blogs.length === 0) {
        return (
            <div className={`grid gap-6 ${getColumnClasses()}`}>
                {[...Array(8)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        )
    }

    if (blogs.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No blogs found</p>
            </div>
        )
    }

    return (
        <div className={`grid gap-6 ${getColumnClasses()}`}>
            {blogs.map((blog, index) => {
                // Attach lastElementRef to the last item for infinite scroll
                if (index === blogs.length - 1 && lastElementRef) {
                    return (
                        <div key={blog._id || index} ref={lastElementRef}>
                            <BlogCard blog={blog} />
                        </div>
                    )
                }
                return <BlogCard key={blog._id || index} blog={blog} />
            })}
        </div>
    )
}

export default BlogGrid