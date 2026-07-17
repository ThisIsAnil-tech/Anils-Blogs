import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Public Pages
import HomePage from '../pages/HomePage'
import BlogListPage from '../pages/BlogListPage'
import BlogDetailPage from '../pages/BlogDetailPage'
import CategoryPage from '../pages/CategoryPage'
import TagPage from '../pages/TagPage'
import LoginPage from '../pages/LoginPage'

// Admin Pages
import AdminDashboardPage from '../pages/AdminDashboardPage'
import AdminBlogListPage from '../pages/AdminBlogListPage'
import AdminBlogCreatePage from '../pages/AdminBlogCreatePage'
import AdminBlogEditPage from '../pages/AdminBlogEditPage'
import AdminCategoriesPage from '../pages/AdminCategoriesPage'
import AdminTagsPage from '../pages/AdminTagsPage'
import AdminCommentsPage from '../pages/AdminCommentsPage'
import AdminSubscribersPage from '../pages/AdminSubscribersPage'
import AdminSettingsPage from '../pages/AdminSettingsPage'
import AdminProfilePage from '../pages/AdminProfilePage'

// Route Guards
import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'

// Layout
import Layout from '../components/layout/Layout'
import AdminLayout from '../components/admin/AdminLayout'

const AppRoutes = () => {
    const { isAuthenticated } = useAuth()

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes with Main Layout */}
                <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/blogs" element={<BlogListPage />} />
                    <Route path="/blogs/:slug" element={<BlogDetailPage />} />
                    <Route path="/categories/:slug" element={<CategoryPage />} />
                    <Route path="/tags/:slug" element={<TagPage />} />
                </Route>

                {/* Auth Routes (Login) */}
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Admin Routes with Admin Layout */}
                <Route element={<PrivateRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/admin/blogs" element={<AdminBlogListPage />} />
                        <Route path="/admin/blogs/create" element={<AdminBlogCreatePage />} />
                        <Route path="/admin/blogs/:id/edit" element={<AdminBlogEditPage />} />
                        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                        <Route path="/admin/tags" element={<AdminTagsPage />} />
                        <Route path="/admin/comments" element={<AdminCommentsPage />} />
                        <Route path="/admin/subscribers" element={<AdminSubscribersPage />} />
                        <Route path="/admin/settings" element={<AdminSettingsPage />} />
                        <Route path="/admin/profile" element={<AdminProfilePage />} />
                    </Route>
                </Route>

                {/* 404 Not Found */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes