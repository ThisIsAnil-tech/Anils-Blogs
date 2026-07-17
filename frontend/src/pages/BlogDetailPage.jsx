import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDate, getReadTime, getImageUrl } from '../utils/helpers'
import LikeButton from '../components/interactions/LikeButton'
import ShareButtons from '../components/interactions/ShareButtons'
import CommentSection from '../components/interactions/CommentSection'
import RelatedPosts from '../components/blog/RelatedPosts'
import { blogService } from '../services/blogService'
import { useNotification } from '../hooks/useNotification'

const BlogDetailPage = () => {
    const { slug } = useParams()
    const [blog, setBlog] = useState(null)
    const [loading, setLoading] = useState(true)
    const [relatedPosts, setRelatedPosts] = useState([])
    const { addNotification } = useNotification()

    useEffect(() => {
        const loadBlog = async () => {
            try {
                setLoading(true)
                const response = await blogService.getBlogBySlug(slug)

                if (response.success) {
                    setBlog(response.data)

                    // Load related posts
                    const relatedRes = await blogService.getRelatedPosts(response.data._id)
                    if (relatedRes.success) {
                        setRelatedPosts(relatedRes.data)
                    }
                }
            } catch (error) {
                addNotification('Failed to load blog post', 'error')
            } finally {
                setLoading(false)
            }
        }

        loadBlog()
    }, [slug, addNotification])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded mb-8"></div>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!blog) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-3xl font-bold mb-4">Blog Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    The blog post you're looking for doesn't exist.
                </p>
                <Link to="/" className="text-blue-600 hover:underline">
                    Return to Home
                </Link>
            </div>
        )
    }

    const shareUrl = window.location.href
    const readTime = getReadTime(blog.content)

    return (
        <article className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Blog Header */}
            <header className="mb-8">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">{blog.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>By {blog.author?.fullName || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{formatDate(blog.publishDate)}</span>
                    <span>•</span>
                    <span>{readTime} min read</span>
                </div>

                {blog.category && (
                    <Link
                        to={`/categories/${blog.category.slug}`}
                        className="inline-block mt-4 px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-full text-sm"
                    >
                        {blog.category.name}
                    </Link>
                )}

                {blog.tags && blog.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {blog.tags.map((tag) => (
                            <Link
                                key={tag._id}
                                to={`/tags/${tag.slug}`}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                #{tag.name}
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

            {/* Blog Content */}
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

export default BlogDetailPage