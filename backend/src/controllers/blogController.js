const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Subscriber = require('../models/Subscriber');
const { validationResult } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const { uploadBlogContent, getBlogContent, updateBlogContent, deleteBlogFile } = require('../config/mega');
const logger = require('../utils/logger');

// ============================================
// Public Blog Controllers
// ============================================

// @desc    Get all blogs (public)
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, sort = '-publishDate', category, tag, search } = req.query;
    
    // Detect if mobile (for mobile limit)
    const isMobile = req.headers['user-agent']?.toLowerCase().includes('mobile') || false;
    const actualLimit = isMobile ? (parseInt(limit) || 4) : (parseInt(limit) || 12);
    
    const { skip, limit: limitNum } = getPagination(page, actualLimit);

    // Build query
    const query = { status: 'published' };
    
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) query.category = categoryDoc._id;
    }
    
    if (tag) {
      const tagDoc = await Tag.findOne({ slug: tag });
      if (tagDoc) query.tags = tagDoc._id;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username fullName')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Blog.countDocuments(query);

    sendApiResponse(res, 200, true, 'Blogs fetched successfully', {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Get blogs error: ${error.message}`);
    next(error);
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, status: 'published' })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username fullName');

    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    // Increment view count
    blog.viewCount += 1;
    
    // Track view by IP
    const ip = req.ip || req.connection.remoteAddress;
    blog.views.push({
      ip,
      timestamp: new Date(),
      device: req.headers['user-agent'],
      browser: req.headers['user-agent']
    });
    
    await blog.save();

    // Get content from MEGA
    let content = '';
    try {
      content = await getBlogContent(blog.megaFileId);
    } catch (error) {
      logger.error(`MEGA content fetch error: ${error.message}`);
      content = 'Content temporarily unavailable';
    }

    sendApiResponse(res, 200, true, 'Blog fetched successfully', {
      ...blog.toObject(),
      content
    });
  } catch (error) {
    logger.error(`Get blog by slug error: ${error.message}`);
    next(error);
  }
};

// @desc    Get popular blogs
// @route   GET /api/blogs/popular
// @access  Public
const getPopularBlogs = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const blogs = await Blog.find({ status: 'published' })
      .sort({ viewCount: -1, likeCount: -1 })
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username fullName');

    sendApiResponse(res, 200, true, 'Popular blogs fetched successfully', blogs);
  } catch (error) {
    logger.error(`Get popular blogs error: ${error.message}`);
    next(error);
  }
};

// @desc    Get recent blogs
// @route   GET /api/blogs/recent
// @access  Public
const getRecentBlogs = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const blogs = await Blog.find({ status: 'published' })
      .sort({ publishDate: -1 })
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username fullName');

    sendApiResponse(res, 200, true, 'Recent blogs fetched successfully', blogs);
  } catch (error) {
    logger.error(`Get recent blogs error: ${error.message}`);
    next(error);
  }
};

// ============================================
// Admin Blog Controllers
// ============================================

// @desc    Create blog (Admin only)
// @route   POST /api/admin/blogs
// @access  Private/Admin
const createBlog = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendApiResponse(res, 400, false, 'Validation error', errors.array());
    }

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      featuredImage,
      images = [],
      videos = [],
      status = 'draft',
      publishDate,
      scheduleDate,
      isFeatured = false,
      isSticky = false,
      seoSettings,
      settings
    } = req.body;

    // Upload content to MEGA
    const megaFile = await uploadBlogContent(
      `blog_${Date.now()}`,
      title,
      content
    );

    // Create blog
    const blog = await Blog.create({
      title,
      excerpt,
      megaFileId: megaFile.fileId,
      megaFileName: megaFile.fileName,
      featuredImage,
      images,
      videos,
      category,
      tags,
      author: req.user.id,
      status,
      publishDate: status === 'published' ? (publishDate || new Date()) : undefined,
      scheduleDate: status === 'scheduled' ? scheduleDate : undefined,
      isFeatured,
      isSticky,
      seoSettings,
      settings
    });

    // Populate references
    await blog.populate('category', 'name slug');
    await blog.populate('tags', 'name slug');
    await blog.populate('author', 'username fullName');

    sendApiResponse(res, 201, true, 'Blog created successfully', blog);
  } catch (error) {
    logger.error(`Create blog error: ${error.message}`);
    next(error);
  }
};

// @desc    Update blog (Admin only)
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      featuredImage,
      images,
      videos,
      status,
      publishDate,
      scheduleDate,
      isFeatured,
      isSticky,
      seoSettings,
      settings
    } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    // Update MEGA content if content changed
    if (content && content !== '') {
      const updatedMegaFile = await updateBlogContent(blog.megaFileId, content);
      blog.megaFileId = updatedMegaFile.fileId;
      blog.megaFileName = updatedMegaFile.fileName;
    }

    // Update fields
    if (title) blog.title = title;
    if (excerpt) blog.excerpt = excerpt;
    if (category) blog.category = category;
    if (tags) blog.tags = tags;
    if (featuredImage) blog.featuredImage = featuredImage;
    if (images) blog.images = images;
    if (videos) blog.videos = videos;
    if (status) blog.status = status;
    if (publishDate) blog.publishDate = publishDate;
    if (scheduleDate) blog.scheduleDate = scheduleDate;
    if (isFeatured !== undefined) blog.isFeatured = isFeatured;
    if (isSticky !== undefined) blog.isSticky = isSticky;
    if (seoSettings) blog.seoSettings = seoSettings;
    if (settings) blog.settings = settings;

    await blog.save();

    // Populate references
    await blog.populate('category', 'name slug');
    await blog.populate('tags', 'name slug');
    await blog.populate('author', 'username fullName');

    sendApiResponse(res, 200, true, 'Blog updated successfully', blog);
  } catch (error) {
    logger.error(`Update blog error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete blog (Admin only)
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    // Delete from MEGA
    await deleteBlogFile(blog.megaFileId);

    // Delete blog
    await blog.deleteOne();

    sendApiResponse(res, 200, true, 'Blog deleted successfully');
  } catch (error) {
    logger.error(`Delete blog error: ${error.message}`);
    next(error);
  }
};

// ============================================
// Notification Controller
// ============================================

// @desc    Notify subscribers (Admin only)
// @route   POST /api/admin/blogs/:id/notify
// @access  Private/Admin
const notifySubscribers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    // Get active subscribers
    const subscribers = await Subscriber.find({ 
      status: 'active', 
      isVerified: true 
    });

    if (subscribers.length === 0) {
      return sendApiResponse(res, 200, true, 'No subscribers to notify');
    }

    // Send notifications using email service
    const { sendBulkNotification } = require('../config/email');
    const results = await sendBulkNotification(subscribers, blog);

    sendApiResponse(res, 200, true, 'Notifications sent', {
      total: subscribers.length,
      sent: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    });
  } catch (error) {
    logger.error(`Notify subscribers error: ${error.message}`);
    next(error);
  }
};

// ============================================
// Cache Management
// ============================================

// @desc    Clear blog cache
// @route   POST /api/admin/cache/clear
// @access  Private/Admin
const clearBlogCache = async (req, res, next) => {
  try {
    // If Redis is enabled, clear cache
    const { cache } = require('../config/redis');
    if (cache.isEnabled()) {
      await cache.delPattern('blogs:*');
      await cache.delPattern('blog:*');
      await cache.delPattern('blogs:popular*');
      await cache.delPattern('blogs:recent*');
      logger.info('Blog caches cleared');
      return sendApiResponse(res, 200, true, 'Cache cleared successfully');
    }
    
    sendApiResponse(res, 200, true, 'Cache not enabled');
  } catch (error) {
    logger.error(`Clear cache error: ${error.message}`);
    next(error);
  }
};

// ============================================
// Export All Controllers
// ============================================

module.exports = {
  // Public controllers
  getBlogs,
  getBlogBySlug,
  getPopularBlogs,
  getRecentBlogs,
  // Admin controllers
  createBlog,
  updateBlog,
  deleteBlog,
  notifySubscribers,
  clearBlogCache
};