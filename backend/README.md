# Blog Management System - Backend API

This is the backend API for the Personal Blog Management System. It is built on top of Node.js using Express.js and MongoDB (Mongoose), featuring Redis caching, automated content archiving to MEGA.nz, media hosting via Cloudinary, and transaction emails via Resend.

---

## Features

* **Role-Based Auth & Access Control**: Secure login, profile management, and password modification for admins/editors.
* **Blog CRUD with Markdown**: Create, update, publish, draft, and archive blog articles.
* **Categories & Tags**: Hierarchical categories and tag classification with slugification.
* **Interactive Features**: Comments (with moderation & admin approval), Likes count, and Shares tracking.
* **Newsletter/Subscribers**: Subscriber tracking, email verification, preference updates, and automated notifications.
* **Advanced Search**: Regex-based search query suggestions and filter queries.
* **Global Settings Control**: Dynamic dashboard configurations, social media configuration, database backup paths, and security configurations.
* **Redis Caching**: Cache-aside caching layer (automatically skips and runs gracefully when Redis is disabled).
* **Automated Content Backups**: Integrates with MEGA.nz for blog markdown/content storage.

---

## Tech Stack

* **Runtime**: Node.js (v20+ recommended)
* **Framework**: Express.js
* **Database**: MongoDB (via Mongoose ODM)
* **Caching**: Redis
* **Cloud Storage**: Cloudinary (for images/videos) & MEGA.nz (for content backups)
* **Mailer**: Resend (email provider API)
* **Testing**: Supertest (integration testing)
* **Other Utilities**: Helmet (security headers), compression (gzip compression), express-rate-limit (rate limiting), winston (structured logging).

---

## Directory Structure

```
backend/
├── src/
│   ├── app.js               # Application setup & middleware orchestrator
│   ├── config/              # Configuration files (Database, MEGA, Redis, Email)
│   ├── controllers/         # Request handling & business logic controllers
│   ├── middleware/          # Security, rate-limiting, and error-handling middlewares
│   ├── models/              # Mongoose DB Schemas
│   ├── routes/              # Express API route endpoints
│   ├── services/            # Service layers (emails, notification helpers)
│   └── utils/               # Winston logs, input validators, helper libraries
├── logs/                    # Local HTTP & Error logs
├── uploads/                 # Temporary local media upload storage
├── test-api.js              # Comprehensive API integration test runner
├── APIS.md                  # Detailed endpoint request/response documentation
└── server.js                # Server entry point
```

---

## Prerequisites

Ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/) (v18.x or above)
* [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas cluster instance)
* Redis (Optional - will gracefully fallback if disabled)

---

## Installation & Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root of the `backend` folder (or edit the existing one) with the following settings:
   ```env
   NODE_ENV=development
   PORT=7800
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   
   # Cloudinary configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Resend Mail configuration
   RESEND_API_KEY=your_resend_api_key
   EMAIL_FROM=notifications@yourdomain.com
   ```

---

## Running the Application

### Development Mode (with Nodemon hot-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

On startup, the system automatically checks for the existence of an admin user. If none exists, it will automatically seed a default administrator using the `ADMIN_USERNAME` and `ADMIN_PASSWORD` (or fallback credentials `admin` / `password123` in development mode) configured in your environment.

---

## Running Integration Tests

The project includes a Postman-like automated integration test suite that tests all endpoints sequentially (Health check, Auth, Categories, Tags, Blogs, Comments, Likes, Shares, Search, Settings) against the active database:

```bash
node test-api.js
```

---

## API Endpoints Reference

For detailed documentation on all available REST API endpoints (including HTTP Methods, URLs, request headers, payload objects, and example responses), please refer to:

👉 **[APIS.md](file:///C:/GitHub/Working-GitHub/AnilBlogs/backend/APIS.md)**
