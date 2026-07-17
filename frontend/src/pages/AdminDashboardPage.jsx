import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatsCard from '../components/admin/Dashboard/StatsCard'
import { blogService } from '../services/blogService'
import { commentService } from '../services/commentService'
import { subscriberService } from '../services/subscriberService'
import { useNotification } from '../hooks/useNotification'

const AdminDashboardPage = () => {
    const [stats, setStats] = useState({
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        pendingComments: 0,
        totalSubscribers: 0,
    })
    const [recentActivity, setRecentActivity] = useState([])
    const [loading, setLoading] = useState(true)
    const { addNotification } = useNotification()

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true)

                // Fetch all data in parallel
                const [blogsRes, commentsRes, subscribersRes] = await Promise.all([
                    blogService.getAdminBlogs({ limit: 100 }),
                    commentService.getPendingComments(),
                    subscriberService.getSubscribers(),
                ])

                let totalBlogs = 0
                let publishedBlogs = 0
                let draftBlogs = 0
                let totalViews = 0
                let totalLikes = 0

                if (blogsRes.success && blogsRes.data) {
                    const blogs = blogsRes.data.blogs || []
                    totalBlogs = blogs.length
                    publishedBlogs = blogs.filter(b => b.status === 'published').length
                    draftBlogs = blogs.filter(b => b.status === 'draft').length
                    totalViews = blogs.reduce((sum, b) => sum + (b.viewCount || 0), 0)
                    totalLikes = blogs.reduce((sum, b) => sum + (b.likeCount || 0), 0)
                }

                let pendingComments = 0
                let totalComments = 0

                if (commentsRes.success) {
                    const pending = commentsRes.data || []
                    pendingComments = pending.length
                    // We'll need a separate endpoint for total comments
                }

                let totalSubscribers = 0
                if (subscribersRes.success) {
                    const subscribers = subscribersRes.data || []
                    totalSubscribers = subscribers.length
                }

                setStats({
                    totalBlogs,
                    publishedBlogs,
                    draftBlogs,
                    totalViews,
                    totalLikes,
                    totalComments,
                    pendingComments,
                    totalSubscribers,
                })

                // Set recent activity (combine latest blogs and comments)
                const recent = []
                if (blogsRes.success && blogsRes.data.blogs) {
                    const recentBlogs = blogsRes.data.blogs.slice(0, 5).map(b => ({
                        type: 'blog',
                        title: b.title,
                        date: b.createdAt || b.publishDate,
                        status: b.status,
                        id: b._id,
                    }))
                    recent.push(...recentBlogs)
                }
                setRecentActivity(recent.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10))

            } catch (error) {
                addNotification('Failed to load dashboard data', 'error')
            } finally {
                setLoading(false)
            }
        }

        loadDashboardData()
    }, [addNotification])

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 h-32 rounded-lg"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your blog.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Blogs"
                    value={stats.totalBlogs}
                    subtitle={`${stats.publishedBlogs} published, ${stats.draftBlogs} drafts`}
                    icon="📝"
                />
                <StatsCard
                    title="Total Views"
                    value={stats.totalViews}
                    subtitle="All time views"
                    icon="👁️"
                />
                <StatsCard
                    title="Total Likes"
                    value={stats.totalLikes}
                    subtitle="All time likes"
                    icon="❤️"
                />
                <StatsCard
                    title="Comments"
                    value={stats.totalComments}
                    subtitle={`${stats.pendingComments} pending moderation`}
                    icon="💬"
                />
                <StatsCard
                    title="Subscribers"
                    value={stats.totalSubscribers}
                    subtitle="Newsletter subscribers"
                    icon="📧"
                />
                <StatsCard
                    title="Published"
                    value={stats.publishedBlogs}
                    subtitle="Active blog posts"
                    icon="✅"
                />
                <StatsCard
                    title="Drafts"
                    value={stats.draftBlogs}
                    subtitle="In progress"
                    icon="✏️"
                />
                <StatsCard
                    title="Pending Comments"
                    value={stats.pendingComments}
                    subtitle="Awaiting moderation"
                    icon="⏳"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <Link
                        to="/admin/blogs/create"
                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                        + Create New Blog
                    </Link>
                    <Link
                        to="/admin/comments"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Moderate Comments {stats.pendingComments > 0 && `(${stats.pendingComments})`}
                    </Link>
                    <Link
                        to="/admin/subscribers"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        View Subscribers
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Blog Settings
                    </Link>
                    <button
                        onClick={async () => {
                            try {
                                await blogService.clearCache()
                                addNotification('Cache cleared successfully', 'success')
                            } catch (error) {
                                addNotification('Failed to clear cache', 'error')
                            }
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Clear Cache
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                {recentActivity.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                ) : (
                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                                <div>
                                    <span className="font-medium">{activity.title}</span>
                                    {activity.type === 'blog' && activity.status && (
                                        <span className={`ml-2 text-xs px-2 py-1 rounded ${activity.status === 'published'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                            }`}>
                                            {activity.status}
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(activity.date).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminDashboardPage