import React from 'react'
import { Link } from 'react-router-dom'
import NewsletterForm from '../subscription/NewsletterForm'

const Footer = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">About</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            A modern blog platform built with React. Share your thoughts, stories, and ideas.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/blogs" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    Blogs
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    Admin Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Categories</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/categories/technology" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    Technology
                                </Link>
                            </li>
                            <li>
                                <Link to="/categories/lifestyle" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    Lifestyle
                                </Link>
                            </li>
                            <li>
                                <Link to="/categories/travel" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                    Travel
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Newsletter</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            Subscribe to get the latest posts.
                        </p>
                        <NewsletterForm />
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>&copy; {currentYear} MyBlog. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer