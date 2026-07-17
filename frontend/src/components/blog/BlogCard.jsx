import React from 'react'
import { Link } from 'react-router-dom'
import { formatDate, getImageUrl, truncateText } from '../../utils/helpers'
import Badge from '../common/Badge'

const BlogCard = ({ blog }) => {
    const { _id, title, slug, excerpt, featuredImage, publishDate, viewCount, likeCount, commentCount, category, tags } = blog

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full">
            {/* Image */}
            {featuredImage && (
                <Link to={`/blogs/${slug}`} className="block overflow-hidden">
                    <img
                        src={getImageUrl(featuredImage)}
                        alt={title}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                </Link>
            )}

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                {/* Category Badge */}
                {category && (
                    <Link to={`/categories/${category.slug}`} className="mb-2">
                        <Badge variant="primary" size="sm">
                            {category.name}
                        </Badge>
                    </Link>
                )}

                {/* Title */}
                <Link to={`/blogs/${slug}`} className="block">
                    <h3 className="text-xl font-bold mb-2 hover:underline line-clamp-2">
                        {title}
                    </h3>
                </Link>

                {/* Excerpt */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                    {truncateText(excerpt || '', 120)}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span>{formatDate(publishDate)}</span>
                    <div className="flex items-center gap-3">
                        {viewCount > 0 && <span>👁️ {viewCount}</span>}
                        {likeCount > 0 && <span>❤️ {likeCount}</span>}
                        {commentCount > 0 && <span>💬 {commentCount}</span>}
                    </div>
                </div>

                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {tags.slice(0, 3).map((tag) => (
                            <Link
                                key={tag._id}
                                to={`/tags/${tag.slug}`}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                #{tag.name}
                            </Link>
                        ))}
                        {tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{tags.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Read More */}
                <Link
                    to={`/blogs/${slug}`}
                    className="mt-4 text-sm font-medium text-black dark:text-white hover:underline inline-block"
                >
                    Read Full Blog →
                </Link>
            </div>
        </div>
    )
}

export default BlogCard