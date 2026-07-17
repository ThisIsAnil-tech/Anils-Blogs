/**
 * Postman-like API Integration Test Suite
 * Executing all backend routes sequentially to verify full functionality.
 */

require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/database');

let token = '';
let adminHeaders = {};
let tempBlogId = '';
let tempBlogSlug = '';
let tempCategoryId = '';
let tempCategorySlug = 'test-category-' + Date.now();
let tempTagId = '';
let tempTagSlug = 'test-tag-' + Date.now();
let tempCommentId = '';
let tempSubscriberToken = '';

const stats = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper for logging
function logTest(name, passed, details = '') {
  stats.total++;
  if (passed) {
    stats.passed++;
    console.log(`  ✅ [PASS] ${name} ${details}`);
  } else {
    stats.failed++;
    console.error(`  ❌ [FAIL] ${name} ${details}`);
  }
}

async function runTests() {
  console.log('🏁 Starting API Integration Tests...\n');

  // 1. Establish Database Connection
  try {
    await connectDB();
    console.log('✅ DB Connected. Running tests...\n');
    
    // DB Slate Cleanup before starting
    console.log('🧹 Cleaning up database from any previous test runs...');
    await mongoose.connection.db.collection('subscribers').deleteMany({ username: 'Subscriber Test' });
    await mongoose.connection.db.collection('categories').deleteMany({ name: /Test Category/ });
    await mongoose.connection.db.collection('tags').deleteMany({ name: /Test Tag/ });
    await mongoose.connection.db.collection('blogs').deleteMany({ title: /Integration Test Blog/ });
    console.log('🧹 Cleanup done. Starting execution...\n');
  } catch (err) {
    console.error('❌ Failed to connect to DB:', err.message);
    process.exit(1);
  }

  try {
    // ============================================
    // HEALTH CHECK & DOCS
    // ============================================
    console.log('--- Health Check & Docs ---');
    
    // GET /health
    const healthRes = await request(app).get('/health');
    logTest('GET /health', healthRes.status === 200 && healthRes.body.status === 'success', `(Status: ${healthRes.status})`);

    // GET /api-docs
    const docsRes = await request(app).get('/api-docs');
    logTest('GET /api-docs', docsRes.status === 200 && docsRes.body.success === true, `(Status: ${docsRes.status})`);

    // ============================================
    // AUTHENTICATION
    // ============================================
    console.log('\n--- Authentication ---');

    // POST /api/v1/auth/login
    const loginPayload = {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'iamsoperfect'
    };
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send(loginPayload);
      
    const loginPassed = loginRes.status === 200 && loginRes.body.success === true && loginRes.body.data.token;
    logTest('POST /api/v1/auth/login', loginPassed, `(Status: ${loginRes.status})`);
    
    if (loginPassed) {
      token = loginRes.body.data.token;
      adminHeaders = {
        'Authorization': `Bearer ${token}`
      };
    } else {
      console.warn('⚠️ Login failed, auth-dependent tests may fail.');
    }

    // GET /api/v1/auth/profile
    const profileRes = await request(app)
      .get('/api/v1/auth/profile')
      .set(adminHeaders);
    logTest('GET /api/v1/auth/profile', profileRes.status === 200 && profileRes.body.success === true, `(Status: ${profileRes.status})`);

    // PUT /api/v1/auth/profile
    const updateProfileRes = await request(app)
      .put('/api/v1/auth/profile')
      .set(adminHeaders)
      .send({
        fullName: 'Admin User Updated',
        bio: 'Updated bio information'
      });
    logTest('PUT /api/v1/auth/profile', updateProfileRes.status === 200 && updateProfileRes.body.success === true, `(Status: ${updateProfileRes.status})`);

    // ============================================
    // CATEGORIES
    // ============================================
    console.log('\n--- Categories ---');

    // POST /api/v1/categories
    const createCatRes = await request(app)
      .post('/api/v1/categories')
      .set(adminHeaders)
      .send({
        name: 'Test Category ' + Date.now(),
        slug: tempCategorySlug,
        description: 'Temporary category for integration tests'
      });
    const catCreated = createCatRes.status === 201 && createCatRes.body.success === true;
    logTest('POST /api/v1/categories (Create)', catCreated, `(Status: ${createCatRes.status})`);
    if (catCreated) {
      tempCategoryId = createCatRes.body.data._id;
      tempCategorySlug = createCatRes.body.data.slug;
    }

    // GET /api/v1/categories
    const getCatsRes = await request(app).get('/api/v1/categories');
    logTest('GET /api/v1/categories (List)', getCatsRes.status === 200 && getCatsRes.body.success === true, `(Status: ${getCatsRes.status})`);

    // GET /api/v1/categories/:slug
    const getCatRes = await request(app).get(`/api/v1/categories/${tempCategorySlug}`);
    logTest('GET /api/v1/categories/:slug', getCatRes.status === 200 && getCatRes.body.success === true, `(Status: ${getCatRes.status})`);

    // PUT /api/v1/categories/:id
    if (tempCategoryId) {
      const updateCatRes = await request(app)
        .put(`/api/v1/categories/${tempCategoryId}`)
        .set(adminHeaders)
        .send({
          name: 'Test Category Updated',
          description: 'Updated category description'
        });
      logTest('PUT /api/v1/categories/:id (Update)', updateCatRes.status === 200 && updateCatRes.body.success === true, `(Status: ${updateCatRes.status})`);
    }

    // ============================================
    // TAGS
    // ============================================
    console.log('\n--- Tags ---');

    // POST /api/v1/tags
    const createTagRes = await request(app)
      .post('/api/v1/tags')
      .set(adminHeaders)
      .send({
        name: 'Test Tag ' + Date.now(),
        slug: tempTagSlug,
        description: 'Temporary tag for integration tests'
      });
    const tagCreated = createTagRes.status === 201 && createTagRes.body.success === true;
    logTest('POST /api/v1/tags (Create)', tagCreated, `(Status: ${createTagRes.status})`);
    if (tagCreated) {
      tempTagId = createTagRes.body.data._id;
      tempTagSlug = createTagRes.body.data.slug;
    }

    // GET /api/v1/tags
    const getTagsRes = await request(app).get('/api/v1/tags');
    logTest('GET /api/v1/tags (List)', getTagsRes.status === 200 && getTagsRes.body.success === true, `(Status: ${getTagsRes.status})`);

    // GET /api/v1/tags/:slug
    const getTagRes = await request(app).get(`/api/v1/tags/${tempTagSlug}`);
    logTest('GET /api/v1/tags/:slug', getTagRes.status === 200 && getTagRes.body.success === true, `(Status: ${getTagRes.status})`);

    // PUT /api/v1/tags/:id
    if (tempTagId) {
      const updateTagRes = await request(app)
        .put(`/api/v1/tags/${tempTagId}`)
        .set(adminHeaders)
        .send({
          name: 'Test Tag Updated',
          description: 'Updated tag description'
        });
      logTest('PUT /api/v1/tags/:id (Update)', updateTagRes.status === 200 && updateTagRes.body.success === true, `(Status: ${updateTagRes.status})`);
    }

    // ============================================
    // BLOGS
    // ============================================
    console.log('\n--- Blogs ---');

    // POST /api/v1/admin/blogs
    const blogTitle = 'Integration Test Blog ' + Date.now();
    tempBlogSlug = 'integration-test-blog-' + Date.now();
    const longContent = 'This is a blog created by the integration test suite. '.repeat(6);
    const createBlogRes = await request(app)
      .post('/api/v1/admin/blogs')
      .set(adminHeaders)
      .send({
        title: blogTitle,
        content: longContent,
        excerpt: 'This is a blog excerpt created by the integration test suite.',
        featuredImage: 'https://example.com/featured-image.jpg',
        slug: tempBlogSlug,
        category: tempCategoryId || undefined,
        tags: tempTagId ? [tempTagId] : [],
        status: 'published',
        readTime: 5
      });
    const blogCreated = createBlogRes.status === 201 && createBlogRes.body.success === true;
    logTest('POST /api/v1/admin/blogs (Create)', blogCreated, `(Status: ${createBlogRes.status})`);
    if (blogCreated) {
      tempBlogId = createBlogRes.body.data._id;
    }

    // GET /api/v1/blogs
    const getBlogsRes = await request(app).get('/api/v1/blogs');
    logTest('GET /api/v1/blogs (List)', getBlogsRes.status === 200 && getBlogsRes.body.success === true, `(Status: ${getBlogsRes.status})`);

    // GET /api/v1/blogs/recent
    const getRecentRes = await request(app).get('/api/v1/blogs/recent');
    logTest('GET /api/v1/blogs/recent', getRecentRes.status === 200 && getRecentRes.body.success === true, `(Status: ${getRecentRes.status})`);

    // GET /api/v1/blogs/popular
    const getPopularRes = await request(app).get('/api/v1/blogs/popular');
    logTest('GET /api/v1/blogs/popular', getPopularRes.status === 200 && getPopularRes.body.success === true, `(Status: ${getPopularRes.status})`);

    // GET /api/v1/blogs/:slug
    if (tempBlogSlug) {
      const getBlogRes = await request(app).get(`/api/v1/blogs/${tempBlogSlug}`);
      logTest('GET /api/v1/blogs/:slug', getBlogRes.status === 200 && getBlogRes.body.success === true, `(Status: ${getBlogRes.status})`);
    }

    // PUT /api/v1/admin/blogs/:id
    if (tempBlogId) {
      const updateBlogRes = await request(app)
        .put(`/api/v1/admin/blogs/${tempBlogId}`)
        .set(adminHeaders)
        .send({
          title: blogTitle + ' Updated',
          content: 'Updated content of the integration test blog. '.repeat(6)
        });
      logTest('PUT /api/v1/admin/blogs/:id (Update)', updateBlogRes.status === 200 && updateBlogRes.body.success === true, `(Status: ${updateBlogRes.status})`);
    }

    // ============================================
    // COMMENTS
    // ============================================
    console.log('\n--- Comments ---');

    if (tempBlogId) {
      // POST /api/v1/comments/:blogId
      const createCommentRes = await request(app)
        .post(`/api/v1/comments/${tempBlogId}`)
        .send({
          content: 'This is a test comment from integration testing.',
          authorName: 'Test Commenter',
          authorEmail: 'commenter@test.com'
        });
      const commentCreated = createCommentRes.status === 201 && createCommentRes.body.success === true;
      logTest('POST /api/v1/comments/:blogId (Create)', commentCreated, `(Status: ${createCommentRes.status})`);
      if (commentCreated) {
        tempCommentId = createCommentRes.body.data._id;
      }

      // GET /api/v1/comments/:blogId
      const getCommentsRes = await request(app).get(`/api/v1/comments/${tempBlogId}`);
      logTest('GET /api/v1/comments/:blogId (List)', getCommentsRes.status === 200 && getCommentsRes.body.success === true, `(Status: ${getCommentsRes.status})`);

      // GET /api/v1/admin/comments/pending
      const getPendingRes = await request(app)
        .get('/api/v1/admin/comments/pending')
        .set(adminHeaders);
      logTest('GET /api/v1/admin/comments/pending', getPendingRes.status === 200 && getPendingRes.body.success === true, `(Status: ${getPendingRes.status})`);

      // PUT /api/v1/admin/comments/:id/approve
      if (tempCommentId) {
        const approveCommentRes = await request(app)
          .put(`/api/v1/admin/comments/${tempCommentId}/approve`)
          .set(adminHeaders);
        logTest('PUT /api/v1/admin/comments/:id/approve', approveCommentRes.status === 200 && approveCommentRes.body.success === true, `(Status: ${approveCommentRes.status})`);
      }
    } else {
      console.warn('⚠️ Skipped comment tests because blog creation failed.');
    }

    // ============================================
    // LIKES & SHARES
    // ============================================
    console.log('\n--- Likes & Shares ---');

    if (tempBlogId) {
      // POST /api/v1/likes/:blogId (Toggle Like)
      const toggleLikeRes = await request(app).post(`/api/v1/likes/${tempBlogId}`);
      logTest('POST /api/v1/likes/:blogId (Toggle Like)', toggleLikeRes.status === 200 && toggleLikeRes.body.success === true, `(Status: ${toggleLikeRes.status})`);

      // GET /api/v1/likes/:blogId/check
      const checkLikeRes = await request(app).get(`/api/v1/likes/${tempBlogId}/check`);
      logTest('GET /api/v1/likes/:blogId/check', checkLikeRes.status === 200 && checkLikeRes.body.success === true, `(Status: ${checkLikeRes.status})`);

      // GET /api/v1/likes/:blogId/count
      const likeCountRes = await request(app).get(`/api/v1/likes/${tempBlogId}/count`);
      logTest('GET /api/v1/likes/:blogId/count', likeCountRes.status === 200 && likeCountRes.body.success === true, `(Status: ${likeCountRes.status})`);

      // POST /api/v1/shares/:blogId (Share)
      const shareRes = await request(app).post(`/api/v1/shares/${tempBlogId}`);
      logTest('POST /api/v1/shares/:blogId (Share)', shareRes.status === 200 && shareRes.body.success === true, `(Status: ${shareRes.status})`);

      // GET /api/v1/shares/:blogId/count
      const shareCountRes = await request(app).get(`/api/v1/shares/${tempBlogId}/count`);
      logTest('GET /api/v1/shares/:blogId/count', shareCountRes.status === 200 && shareCountRes.body.success === true, `(Status: ${shareCountRes.status})`);
    } else {
      console.warn('⚠️ Skipped likes/shares tests because blog creation failed.');
    }

    // ============================================
    // SUBSCRIBERS
    // ============================================
    console.log('\n--- Subscribers ---');

    // POST /api/v1/subscribers (Subscribe)
    const subscriberEmail = 'subscriber-' + Date.now() + '@test.com';
    const subRes = await request(app)
      .post('/api/v1/subscribers')
      .send({
        email: subscriberEmail,
        username: 'Subscriber Test'
      });
    const subCreated = subRes.status === 201 && subRes.body.success === true;
    logTest('POST /api/v1/subscribers (Subscribe)', subCreated, `(Status: ${subRes.status})`);
    if (subCreated) {
      tempSubscriberToken = subRes.body.data.verificationToken;
    }

    // GET /api/v1/subscribers/preferences/:token
    if (tempSubscriberToken) {
      const getPrefRes = await request(app).get(`/api/v1/subscribers/preferences/${tempSubscriberToken}`);
      logTest('GET /api/v1/subscribers/preferences/:token', getPrefRes.status === 200 && getPrefRes.body.success === true, `(Status: ${getPrefRes.status})`);

      // PUT /api/v1/subscribers/preferences/:token
      const updatePrefRes = await request(app)
        .put(`/api/v1/subscribers/preferences/${tempSubscriberToken}`)
        .send({
          newsletter: false,
          blogNotifications: true
        });
      logTest('PUT /api/v1/subscribers/preferences/:token', updatePrefRes.status === 200 && updatePrefRes.body.success === true, `(Status: ${updatePrefRes.status})`);
    }

    // ============================================
    // SEARCH
    // ============================================
    console.log('\n--- Search ---');

    // GET /api/v1/search
    const searchRes = await request(app).get('/api/v1/search?q=Integration');
    logTest('GET /api/v1/search', searchRes.status === 200 && searchRes.body.success === true, `(Status: ${searchRes.status})`);

    // GET /api/v1/search/suggestions
    const suggRes = await request(app).get('/api/v1/search/suggestions?q=Int');
    logTest('GET /api/v1/search/suggestions', suggRes.status === 200 && suggRes.body.success === true, `(Status: ${suggRes.status})`);

    // POST /api/v1/search/advanced
    const advSearchRes = await request(app)
      .post('/api/v1/search/advanced')
      .send({
        query: 'Integration',
        status: 'published'
      });
    logTest('POST /api/v1/search/advanced', advSearchRes.status === 200 && advSearchRes.body.success === true, `(Status: ${advSearchRes.status})`);

    // ============================================
    // SETTINGS
    // ============================================
    console.log('\n--- Settings ---');

    // GET /api/v1/settings
    const getSettingsRes = await request(app)
      .get('/api/v1/settings')
      .set(adminHeaders);
    logTest('GET /api/v1/settings', getSettingsRes.status === 200 && getSettingsRes.body.success === true, `(Status: ${getSettingsRes.status})`);

    // PUT /api/v1/settings
    if (getSettingsRes.status === 200 && getSettingsRes.body.success === true) {
      const updateSettingsRes = await request(app)
        .put('/api/v1/settings')
        .set(adminHeaders)
        .send({
          blogName: 'Anil Blogs Update Test',
          blogDescription: 'Updated description'
        });
      logTest('PUT /api/v1/settings', updateSettingsRes.status === 200 && updateSettingsRes.body.success === true, `(Status: ${updateSettingsRes.status})`);
    }

    // ============================================
    // CLEANUP TEMPORARY RESOURCES
    // ============================================
    console.log('\n--- Cleanup Resources ---');

    // DELETE /api/v1/comments/:id
    if (tempCommentId) {
      const delCommentRes = await request(app)
        .delete(`/api/v1/comments/${tempCommentId}`)
        .set(adminHeaders);
      logTest('DELETE /api/v1/comments/:id', delCommentRes.status === 200 && delCommentRes.body.success === true, `(Status: ${delCommentRes.status})`);
    }

    // DELETE /api/v1/admin/blogs/:id
    if (tempBlogId) {
      const delBlogRes = await request(app)
        .delete(`/api/v1/admin/blogs/${tempBlogId}`)
        .set(adminHeaders);
      logTest('DELETE /api/v1/admin/blogs/:id', delBlogRes.status === 200 && delBlogRes.body.success === true, `(Status: ${delBlogRes.status})`);
    }

    // DELETE /api/v1/categories/:id
    if (tempCategoryId) {
      const delCatRes = await request(app)
        .delete(`/api/v1/categories/${tempCategoryId}`)
        .set(adminHeaders);
      logTest('DELETE /api/v1/categories/:id', delCatRes.status === 200 && delCatRes.body.success === true, `(Status: ${delCatRes.status})`);
    }

    // DELETE /api/v1/tags/:id
    if (tempTagId) {
      const delTagRes = await request(app)
        .delete(`/api/v1/tags/${tempTagId}`)
        .set(adminHeaders);
      logTest('DELETE /api/v1/tags/:id', delTagRes.status === 200 && delTagRes.body.success === true, `(Status: ${delTagRes.status})`);
    }

    // Clean up subscriber from DB
    await mongoose.connection.db.collection('subscribers').deleteMany({ username: 'Subscriber Test' });
    console.log('🧹 Post-test subscriber cleanup executed.');

  } catch (err) {
    console.error('💥 Test run error occurred:', err);
  } finally {
    // Disconnect DB
    await mongoose.connection.close();
    console.log('\n--- Test Run Summary ---');
    console.log(`Total: ${stats.total}`);
    console.log(`Passed: ${stats.passed}`);
    console.log(`Failed: ${stats.failed}`);
    
    if (stats.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
