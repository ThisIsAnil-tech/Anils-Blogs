import React from 'react'
import { Link } from 'react-router-dom'
import StatsCard from './StatsCard'

const Dashboard = ({ stats, recentActivity, loading, onClearCache }) => {
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

    const statItems = [
        { title: 'Total Blogs', value: stats.totalBlogs || 0, subtitle: `${stats.publishedBlogs || 0} published`, icon: '📝' },
        { title: 'Total Views', value: stats.totalViews || 0, subtitle: 'All time views', icon: '👁️' },
        { title: 'Total Likes', value: stats.totalLikes || 0, subtitle: 'All time likes', icon: '❤️' },
        { title: 'Comments', value: stats.totalComments || 0, subtitle: `${stats.pendingComments || 0} pending`, icon: '💬' },
        { title: 'Subscribers', value: stats.totalSubscribers || 0, subtitle: 'Newsletter subscribers', icon: '📧' },
        { title: 'Published', value: stats.publishedBlogs || 0, subtitle: 'Active blog posts', icon: '✅' },
        { title: 'Drafts', value: stats.draftBlogs || 0, subtitle: 'In progress', icon: '✏️' },
        { title: 'Pending Comments', value: stats.pendingComments || 0, subtitle: 'Awaiting moderation', icon: '⏳' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your blog.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map((item, index) => (
                    <StatsCard key={index} {...item} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <Link to="/admin/blogs/create" className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                        + Create New Blog
                    </Link>
                    <Link to="/admin/comments" className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Moderate Comments {stats.pendingComments > 0 && `(${stats.pendingComments})`}
                    </Link>
                    <Link to="/admin/subscribers" className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        View Subscribers
                    </Link>
                    <Link to="/admin/settings" className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Blog Settings
                    </Link>
                    <button onClick={onClearCache} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Clear Cache
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                {recentActivity?.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                ) : (
                    <div className="space-y-4">
                        {recentActivity?.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
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

export default Dashboard