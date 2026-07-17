import React from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/helpers'

const BlogMeta = ({ blog, showAuthor = true, showDate = true, showCategory = true, showTags = true }) => {
    if (!blog) return null

    return (
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            {showAuthor && blog.author && (
                <span>By {blog.author.fullName || 'Anonymous'}</span>
            )}

            {showDate && blog.publishDate && (
                <>
                    {showAuthor && <span>•</span>}
                    <span>{formatDate(blog.publishDate)}</span>
                </>
            )}

            {showCategory && blog.category && (
                <>
                    <span>•</span>
                    <Link
                        to={`/categories/${blog.category.slug}`}
                        className="hover:underline"
                    >
                        {blog.category.name}
                    </Link>
                </>
            )}

            {showTags && blog.tags && blog.tags.length > 0 && (
                <>
                    <span>•</span>
                    <div className="flex flex-wrap gap-1">
                        {blog.tags.map((tag) => (
                            <Link
                                key={tag._id}
                                to={`/tags/${tag.slug}`}
                                className="hover:underline"
                            >
                                #{tag.name}
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default BlogMeta