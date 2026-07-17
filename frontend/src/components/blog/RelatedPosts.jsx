import React from 'react'
import { Link } from 'react-router-dom'
import { formatDate, getImageUrl } from '../../utils/helpers'

const RelatedPosts = ({ posts }) => {
    if (!posts || posts.length === 0) return null

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
                <Link
                    key={post._id}
                    to={`/blogs/${post.slug}`}
                    className="group bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                    {post.featuredImage && (
                        <img
                            src={getImageUrl(post.featuredImage)}
                            alt={post.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                        />
                    )}
                    <div className="p-4">
                        <h4 className="font-semibold group-hover:underline line-clamp-2">
                            {post.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(post.publishDate)}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    )
}

export default RelatedPosts