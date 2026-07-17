import React from 'react'
import { Link } from 'react-router-dom'
import { formatDate, getReadTime, getImageUrl } from '../../utils/helpers'
import LikeButton from '../interactions/LikeButton'
import ShareButtons from '../interactions/ShareButtons'
import CommentSection from '../interactions/CommentSection'
import RelatedPosts from './RelatedPosts'
import Badge from '../common/Badge'

const BlogDetail = ({ blog, relatedPosts = [] }) => {
    if (!blog) return null

    const shareUrl = window.location.href
    const readTime = getReadTime(blog.content)

    return (
        <article className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">{blog.title}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>By {blog.author?.fullName || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{formatDate(blog.publishDate)}</span>
                    <span>•</span>
                    <span>{readTime} min read</span>
                </div>

                {blog.category && (
                    <Link to={`/categories/${blog.category.slug}`} className="inline-block mt-4">
                        <Badge variant="primary" size="md">
                            {blog.category.name}
                        </Badge>
                    </Link>
                )}

                {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {blog.tags.map((tag) => (
                            <Link key={tag._id} to={`/tags/${tag.slug}`}>
                                <Badge variant="default" size="sm">
                                    #{tag.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                )}
            </header>

            {/* Featured Image */}
            {blog.featuredImage && (
                <div className="mb-8">
                    <img
                        src={getImageUrl(blog.featuredImage)}
                        alt={blog.title}
                        className="w-full h-auto rounded-lg"
                        loading="lazy"
                    />
                </div>
            )}

            {/* Content */}
            <div
                className="prose prose-lg dark:prose-invert max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Interactions */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-6">
                    <LikeButton blogId={blog._id} />
                    <ShareButtons url={shareUrl} title={blog.title} />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Views: {blog.viewCount || 0}
                </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
                    <RelatedPosts posts={relatedPosts} />
                </section>
            )}

            {/* Comments Section */}
            <section className="mt-12">
                <CommentSection blogId={blog._id} />
            </section>
        </article>
    )
}

export default BlogDetail