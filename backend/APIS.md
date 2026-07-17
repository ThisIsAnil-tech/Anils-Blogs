# Blog Management System - API Documentation

All routes are prefixed by the base API path: `/api/v1` (with the exception of `/health` and `/api-docs`).

---

## Table of Contents
1. [General / System](#1-general--system)
2. [Authentication](#2-authentication)
3. [Categories](#3-categories)
4. [Tags](#4-tags)
5. [Blogs (Public Access)](#5-blogs-public-access)
6. [Blog Management (Admin Access)](#6-blog-management-admin-access)
7. [Comments](#7-comments)
8. [Likes & Shares](#8-likes--shares)
9. [Subscribers](#9-subscribers)
10. [Search](#10-search)
11. [Settings](#11-settings)

---

## 1. General / System

### Get System Health
* **URL**: `/health`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Server is healthy",
    "timestamp": "2026-07-17T10:45:00.000Z",
    "uptime": 120.34,
    "environment": "development"
  }
  ```

### Get API Directory Info
* **URL**: `/api-docs` or `/api/docs`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "API Documentation",
    "version": "1.0.0",
    "baseUrl": "/api/v1"
  }
  ```

---

## 2. Authentication

### Admin Login
* **URL**: `/api/v1/auth/login`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "6a59b826d23118432f97421e",
        "username": "admin",
        "email": "admin@example.com",
        "fullName": "Admin User",
        "role": "admin",
        "isActive": true
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### Get Admin Profile
* **URL**: `/api/v1/auth/profile`
* **Method**: `GET`
* **Auth Required**: Yes (Bearer Token)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Profile fetched successfully",
    "data": {
      "_id": "6a59b826d23118432f97421e",
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "role": "admin",
      "isActive": true,
      "bio": "Administrator bio description..."
    }
  }
  ```

### Update Admin Profile
* **URL**: `/api/v1/auth/profile`
* **Method**: `PUT`
* **Auth Required**: Yes (Bearer Token)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "fullName": "Updated Admin User",
    "bio": "An updated bio description."
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "_id": "6a59b826d23118432f97421e",
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "Updated Admin User",
      "role": "admin",
      "bio": "An updated bio description."
    }
  }
  ```

### Change Password
* **URL**: `/api/v1/auth/change-password`
* **Method**: `PUT`
* **Auth Required**: Yes (Bearer Token)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "currentPassword": "password123",
    "newPassword": "newsecurepassword123"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

### Admin Logout
* **URL**: `/api/v1/auth/logout`
* **Method**: `POST`
* **Auth Required**: Yes (Bearer Token)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 3. Categories

### List All Active Categories
* **URL**: `/api/v1/categories`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Categories fetched successfully",
    "data": [
      {
        "_id": "6a59b826d23118432f97421e",
        "name": "Technology",
        "slug": "technology",
        "description": "Technology category description...",
        "isActive": true
      }
    ]
  }
  ```

### Get Category By Slug
* **URL**: `/api/v1/categories/:slug`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Category fetched successfully",
    "data": {
      "_id": "6a59b826d23118432f97421e",
      "name": "Technology",
      "slug": "technology",
      "description": "Technology category description..."
    }
  }
  ```

### Get Blogs in Category
* **URL**: `/api/v1/categories/:slug/blogs`
* **Method**: `GET`
* **Auth Required**: No
* **Query Parameters**:
  * `page` (number, default: 1)
  * `limit` (number, default: 12)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Category blogs fetched successfully",
    "data": {
      "blogs": [
        {
          "_id": "6a59b828d23118432f974220",
          "title": "Welcome to JS world",
          "slug": "welcome-to-js-world",
          "excerpt": "A short description about JS...",
          "publishDate": "2026-07-17T10:45:00.000Z"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 12,
        "pages": 1
      }
    }
  }
  ```

### Create Category
* **URL**: `/api/v1/categories`
* **Method**: `POST`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "name": "Development",
    "description": "Web Development category",
    "color": "#667eea"
  }
  ```
* **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Category created successfully",
    "data": {
      "_id": "6a59b826d23118432f97421e",
      "name": "Development",
      "slug": "development",
      "description": "Web Development category",
      "color": "#667eea",
      "isActive": true
    }
  }
  ```

### Update Category
* **URL**: `/api/v1/categories/:id`
* **Method**: `PUT`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "name": "Updated Category Name",
    "description": "Updated description text"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Category updated successfully",
    "data": {
      "_id": "6a59b826d23118432f97421e",
      "name": "Updated Category Name",
      "slug": "updated-category-name",
      "description": "Updated description text"
    }
  }
  ```

### Delete Category
* **URL**: `/api/v1/categories/:id`
* **Method**: `DELETE`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Category deleted successfully"
  }
  ```

---

## 4. Tags

### List All Active Tags
* **URL**: `/api/v1/tags`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Tags fetched successfully",
    "data": [
      {
        "_id": "6a59b827d23118432f97421f",
        "name": "JavaScript",
        "slug": "javascript",
        "isActive": true
      }
    ]
  }
  ```

### Get Popular Tags
* **URL**: `/api/v1/tags/popular`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Popular tags fetched successfully",
    "data": [
      {
        "_id": "6a59b827d23118432f97421f",
        "name": "JavaScript",
        "slug": "javascript",
        "count": 5
      }
    ]
  }
  ```

### Get Tag By Slug
* **URL**: `/api/v1/tags/:slug`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Tag fetched successfully",
    "data": {
      "_id": "6a59b827d23118432f97421f",
      "name": "JavaScript",
      "slug": "javascript"
    }
  }
  ```

### Get Blogs with Tag
* **URL**: `/api/v1/tags/:slug/blogs`
* **Method**: `GET`
* **Auth Required**: No
* **Query Parameters**:
  * `page` (number, default: 1)
  * `limit` (number, default: 12)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Blogs with tag fetched successfully",
    "data": {
      "blogs": [
        {
          "_id": "6a59b828d23118432f974220",
          "title": "Welcome to JS world",
          "slug": "welcome-to-js-world"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 12,
        "pages": 1
      }
    }
  }
  ```

### Create Tag
* **URL**: `/api/v1/tags`
* **Method**: `POST`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "name": "React",
    "description": "React related articles"
  }
  ```
* **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Tag created successfully",
    "data": {
      "_id": "6a59b827d23118432f97421f",
      "name": "React",
      "slug": "react",
      "description": "React related articles"
    }
  }
  ```

### Update Tag
* **URL**: `/api/v1/tags/:id`
* **Method**: `PUT`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "name": "React Hooks"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Tag updated successfully",
    "data": {
      "_id": "6a59b827d23118432f97421f",
      "name": "React Hooks",
      "slug": "react-hooks"
    }
  }
  ```

### Delete Tag
* **URL**: `/api/v1/tags/:id`
* **Method**: `DELETE`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Tag deleted successfully"
  }
  ```

---

## 5. Blogs (Public Access)

### Get Published Blogs (List)
* **URL**: `/api/v1/blogs`
* **Method**: `GET`
* **Auth Required**: No
* **Query Parameters**:
  * `page` (number, default: 1)
  * `limit` (number, default: 12)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Blogs fetched successfully",
    "data": {
      "blogs": [
        {
          "_id": "6a59b828d23118432f974220",
          "title": "Welcome to JS world",
          "slug": "welcome-to-js-world",
          "excerpt": "Introduction to Javascript...",
          "featuredImage": "https://example.com/js.jpg",
          "publishDate": "2026-07-17T10:45:00.000Z",
          "viewCount": 2,
          "likeCount": 1,
          "commentCount": 0
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 12,
        "pages": 1
      }
    }
  }
  ```

### Get Recent Blogs
* **URL**: `/api/v1/blogs/recent`
* **Method**: `GET`
* **Auth Required**: No
* **Query Parameters**:
  * `limit` (number, default: 10)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Recent blogs fetched successfully",
    "data": [
      {
        "_id": "6a59b828d23118432f974220",
        "title": "Welcome to JS world",
        "slug": "welcome-to-js-world"
      }
    ]
  }
  ```

### Get Popular Blogs
* **URL**: `/api/v1/blogs/popular`
* **Method**: `GET`
* **Auth Required**: No
* **Query Parameters**:
  * `limit` (number, default: 10)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Popular blogs fetched successfully",
    "data": [
      {
        "_id": "6a59b828d23118432f974220",
        "title": "Welcome to JS world",
        "slug": "welcome-to-js-world",
        "viewCount": 105
      }
    ]
  }
  ```

### Get Blog By Slug (Read Post)
* **URL**: `/api/v1/blogs/:slug`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Blog fetched successfully",
    "data": {
      "_id": "6a59b828d23118432f974220",
      "title": "Welcome to JS world",
      "slug": "welcome-to-js-world",
      "content": "This is a blog created by the integration test suite. This is a blog created by the integration test suite...",
      "excerpt": "Introduction to Javascript...",
      "featuredImage": "https://example.com/js.jpg"
    }
  }
  ```

---

## 6. Blog Management (Admin Access)

### Create Blog
* **URL**: `/api/v1/admin/blogs`
* **Method**: `POST`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "title": "A New Blog Title",
    "content": "This is a new blog post content of at least 200 characters long. This is a new blog post content of at least 200 characters long...",
    "excerpt": "Blog excerpt overview text.",
    "featuredImage": "https://example.com/featured-image.jpg",
    "category": "6a59b826d23118432f97421e",
    "tags": ["6a59b827d23118432f97421f"],
    "status": "published",
    "readTime": 5
  }
  ```
* **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Blog created successfully",
    "data": {
      "_id": "6a59b828d23118432f974220",
      "title": "A New Blog Title",
      "slug": "a-new-blog-title",
      "excerpt": "Blog excerpt overview text.",
      "status": "published",
      "author": "6a59b826d23118432f97421e"
    }
  }
  ```

### Update Blog
* **URL**: `/api/v1/admin/blogs/:id`
* **Method**: `PUT`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "title": "An Updated Blog Title",
    "content": "Updated content of the integration test blog. Updated content of the integration test blog. Updated content of the integration test blog..."
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Blog updated successfully",
    "data": {
      "_id": "6a59b828d23118432f974220",
      "title": "An Updated Blog Title",
      "slug": "an-updated-blog-title"
    }
  }
  ```

### Delete Blog
* **URL**: `/api/v1/admin/blogs/:id`
* **Method**: `DELETE`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Blog deleted successfully"
  }
  ```

### Notify Subscribers About New Blog
* **URL**: `/api/v1/admin/blogs/:id/notify`
* **Method**: `POST`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Notification emails sent successfully"
  }
  ```

### Clear Cache
* **URL**: `/api/v1/admin/cache/clear`
* **Method**: `POST`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Cache cleared successfully"
  }
  ```

---

## 7. Comments

### Get Blog Comments
* **URL**: `/api/v1/comments/:blogId`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Comments fetched successfully",
    "data": [
      {
        "_id": "6a59b829d23118432f974224",
        "content": "This is a test comment from integration testing.",
        "authorName": "Test Commenter",
        "status": "approved",
        "blog": "6a59b828d23118432f974220"
      }
    ]
  }
  ```

### Add Comment
* **URL**: `/api/v1/comments/:blogId`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "content": "This is a test comment from integration testing.",
    "authorName": "Test Commenter",
    "authorEmail": "commenter@test.com"
  }
  ```
* **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Comment added successfully",
    "data": {
      "_id": "6a59b829d23118432f974224",
      "content": "This is a test comment from integration testing.",
      "authorName": "Test Commenter",
      "status": "pending",
      "blog": "6a59b828d23118432f974220"
    }
  }
  ```

### Update Comment
* **URL**: `/api/v1/comments/:id`
* **Method**: `PUT`
* **Auth Required**: No (Validated by comment authorship credentials)
* **Request Body**:
  ```json
  {
    "content": "Updated comment content text."
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Comment updated successfully"
  }
  ```

### Delete Comment
* **URL**: `/api/v1/comments/:id`
* **Method**: `DELETE`
* **Auth Required**: No (Validated by comment authorship / admin access)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```

### Get Pending Comments
* **URL**: `/api/v1/admin/comments/pending`
* **Method**: `GET`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Pending comments fetched successfully",
    "data": [
      {
        "_id": "6a59b829d23118432f974224",
        "content": "This is a test comment from integration testing.",
        "authorName": "Test Commenter",
        "status": "pending"
      }
    ]
  }
  ```

### Approve Comment
* **URL**: `/api/v1/admin/comments/:id/approve`
* **Method**: `PUT`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Comment approved successfully",
    "data": {
      "_id": "6a59b829d23118432f974224",
      "status": "approved"
    }
  }
  ```

### Reject Comment
* **URL**: `/api/v1/admin/comments/:id/reject`
* **Method**: `PUT`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Comment rejected successfully"
  }
  ```

---

## 8. Likes & Shares

### Toggle Like Status
* **URL**: `/api/v1/likes/:blogId`
* **Method**: `POST`
* **Auth Required**: No (Matches on user IP address)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Blog liked",
    "data": {
      "liked": true,
      "count": 1
    }
  }
  ```

### Check If Liked
* **URL**: `/api/v1/likes/:blogId/check`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Like status fetched",
    "data": {
      "liked": true
    }
  }
  ```

### Get Like Count
* **URL**: `/api/v1/likes/:blogId/count`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Like count fetched",
    "data": {
      "count": 1
    }
  }
  ```

### Share Blog
* **URL**: `/api/v1/shares/:blogId`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "platform": "twitter"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Blog shared successfully",
    "data": {
      "count": 1,
      "alreadyShared": false
    }
  }
  ```

### Get Share Count
* **URL**: `/api/v1/shares/:blogId/count`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Share count fetched",
    "data": {
      "count": 1
    }
  }
  ```

---

## 9. Subscribers

### Subscribe to Newsletter
* **URL**: `/api/v1/subscribers`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "username": "Subscriber Test",
    "email": "subscriber@test.com"
  }
  ```
* **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Subscribed successfully",
    "data": {
      "_id": "6a59b82cd23118432f974228",
      "username": "Subscriber Test",
      "email": "subscriber@test.com",
      "verificationToken": "3587e224e7a884fa88d9..."
    }
  }
  ```

### Verify Subscriber Email
* **URL**: `/api/v1/subscribers/verify/:token`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Email verified successfully"
  }
  ```

### Unsubscribe
* **URL**: `/api/v1/subscribers/unsubscribe`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "email": "subscriber@test.com"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Unsubscribed successfully"
  }
  ```

### Get Subscriber Preferences
* **URL**: `/api/v1/subscribers/preferences/:token`
* **Method**: `GET`
* **Auth Required**: No
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Preferences fetched successfully",
    "data": {
      "newsletter": true,
      "blogNotifications": true
    }
  }
  ```

### Update Subscriber Preferences
* **URL**: `/api/v1/subscribers/preferences/:token`
* **Method**: `PUT`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "preferences": {
      "newsletter": false,
      "blogNotifications": true
    }
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Preferences updated successfully"
  }
  ```

---

## 10. Search

### Search Blogs
* **URL**: `/api/v1/search`
* **Method**: `GET`
* **Auth Required**: No
* **Query Parameters**:
  * `q` (string, search query)
  * `category` (string, category slug)
  * `tag` (string, tag slug)
  * `sort` (string, e.g. `relevance`, `date`, `views`)
  * `page` (number)
  * `limit` (number)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Search results fetched",
    "data": {
      "blogs": [
        {
          "_id": "6a59b828d23118432f974220",
          "title": "Welcome to JS world",
          "slug": "welcome-to-js-world",
          "excerpt": "Introduction to JS..."
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 12,
        "pages": 1
      }
    }
  }
  ```

### Search Suggestions
* **URL**: `/api/v1/search/suggestions`
* **Method**: `GET`
* **Auth Required**: No
* **Query Parameters**:
  * `q` (string, term prefix)
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Suggestions fetched",
    "data": [
      {
        "type": "blog",
        "title": "Welcome to JS world",
        "slug": "welcome-to-js-world",
        "url": "/blogs/welcome-to-js-world"
      }
    ]
  }
  ```

### Advanced Search
* **URL**: `/api/v1/search/advanced`
* **Method**: `POST`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "query": "JavaScript",
    "filters": {
      "categories": ["technology"],
      "tags": ["javascript"]
    }
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Search results fetched",
    "data": {
      "blogs": [
        {
          "_id": "6a59b828d23118432f974220",
          "title": "Welcome to JS world",
          "slug": "welcome-to-js-world"
        }
      ]
    }
  }
  ```

---

## 11. Settings

### Get Blog Settings
* **URL**: `/api/v1/settings`
* **Method**: `GET`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Settings fetched successfully",
    "data": {
      "blogName": "Anil Blogs",
      "blogDescription": "A personal developer blog space",
      "contactEmail": "admin@example.com"
    }
  }
  ```

### Update Blog Settings
* **URL**: `/api/v1/settings`
* **Method**: `PUT`
* **Auth Required**: Yes (Admin only)
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Request Body**:
  ```json
  {
    "blogName": "Anil Blogs Update Test",
    "blogDescription": "Updated description text"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Settings updated successfully"
  }
  ```
