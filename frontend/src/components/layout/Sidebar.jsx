import React from 'react'
import { Link } from 'react-router-dom'
import { FiHome, FiFileText, FiTag, FiFolder, FiMessageSquare, FiUsers, FiSettings, FiUser } from 'react-icons/fi'

const Sidebar = ({ isOpen, onClose }) => {
    const menuItems = [
        { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/admin/blogs', icon: FiFileText, label: 'Blogs' },
        { path: '/admin/categories', icon: FiFolder, label: 'Categories' },
        { path: '/admin/tags', icon: FiTag, label: 'Tags' },
        { path: '/admin/comments', icon: FiMessageSquare, label: 'Comments' },
        { path: '/admin/subscribers', icon: FiUsers, label: 'Subscribers' },
        { path: '/admin/settings', icon: FiSettings, label: 'Settings' },
        { path: '/admin/profile', icon: FiUser, label: 'Profile' },
    ]

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <Link to="/admin/dashboard" className="text-2xl font-bold">
                        Admin Panel
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
                    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <Link to="/admin/dashboard" className="text-2xl font-bold" onClick={onClose}>
                                Admin Panel
                            </Link>
                        </div>
                        <nav className="p-4 space-y-1 overflow-y-auto">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}

export default Sidebar