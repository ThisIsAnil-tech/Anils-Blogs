const Tag = require('../models/Tag');
const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
const getTags = async (req, res, next) => {
  try {
    const { search } = req.query;
    
    // Try cache first
    const cacheKey = `tags:all:${search || 'all'}`;
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Tags fetched successfully (cached)', cached);
      }
    }

    let query = { isActive: true };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const tags = await Tag.find(query).sort({ name: 1 });

    // Cache for 1 hour
    if (cache.isEnabled()) {
      await cache.set(cacheKey, tags, 3600);
    }

    sendApiResponse(res, 200, true, 'Tags fetched successfully', tags);
  } catch (error) {
    logger.error(`Get tags error: ${error.message}`);
    next(error);
  }
};

// @desc    Get popular tags
// @route   GET /api/tags/popular
// @access  Public
const getPopularTags = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Try cache first
    const cacheKey = `tags:popular:${limit}`;
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Popular tags fetched successfully (cached)', cached);
      }
    }

    const tags = await Tag.getPopular(parseInt(limit));

    // Cache for 2 hours
    if (cache.isEnabled()) {
      await cache.set(cacheKey, tags, 7200);
    }

    sendApiResponse(res, 200, true, 'Popular tags fetched successfully', tags);
  } catch (error) {
    logger.error(`Get popular tags error: ${error.message}`);
    next(error);
  }
};

// @desc    Get tag by slug
// @route   GET /api/tags/:slug
// @access  Public
const getTagBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Try cache first
    const cacheKey = `tag:${slug}`;
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Tag fetched successfully (cached)', cached);
      }
    }

    const tag = await Tag.findOne({ slug, isActive: true });
    if (!tag) {
      return sendApiResponse(res, 404, false, 'Tag not found');
    }

    // Cache for 1 hour
    if (cache.isEnabled()) {
      await cache.set(cacheKey, tag, 3600);
    }

    sendApiResponse(res, 200, true, 'Tag fetched successfully', tag);
  } catch (error) {
    logger.error(`Get tag by slug error: ${error.message}`);
    next(error);
  }
};

// @desc    Get blogs with tag
// @route   GET /api/tags/:slug/blogs
// @access  Public
const getTagBlogs = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Try cache first
    const cacheKey = `tag:${slug}:blogs:page${page}:limit${limit}`;
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Tag blogs fetched successfully (cached)', cached);
      }
    }

    const tag = await Tag.findOne({ slug, isActive: true });
    if (!tag) {
      return sendApiResponse(res, 404, false, 'Tag not found');
    }

    const { skip, limit: limitNum } = getPagination(page, limit);

    const [blogs, total] = await Promise.all([
      Blog.find({
        tags: tag._id,
        status: 'published'
      })
        .sort({ publishDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'username fullName')
        .populate('category', 'name slug')
        .select('title slug featuredImage publishDate viewCount likeCount commentCount excerpt'),
      
      Blog.countDocuments({
        tags: tag._id,
        status: 'published'
      })
    ]);

    const result = {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };

    // Cache for 30 minutes
    if (cache.isEnabled()) {
      await cache.set(cacheKey, result, 1800);
    }

    sendApiResponse(res, 200, true, 'Tag blogs fetched successfully', result);
  } catch (error) {
    logger.error(`Get tag blogs error: ${error.message}`);
    next(error);
  }
};

// @desc    Create tag (Admin only)
// @route   POST /api/admin/tags
// @access  Private/Admin
const createTag = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendApiResponse(res, 400, false, 'Validation error', null, errors.array());
    }

    const { name, description, color, isActive, metaTitle, metaDescription } = req.body;

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingTag) {
      return sendApiResponse(res, 400, false, 'Tag with this name already exists');
    }

    const tag = await Tag.create({
      name,
      description,
      color,
      isActive: isActive !== undefined ? isActive : true,
      metaTitle,
      metaDescription
    });

    // Clear cache
    if (cache.isEnabled()) {
      await cache.delPattern('tags:*');
    }

    logger.info(`Tag created: ${tag.name} by ${req.user.username}`);
    sendApiResponse(res, 201, true, 'Tag created successfully', tag);
  } catch (error) {
    logger.error(`Create tag error: ${error.message}`);
    next(error);
  }
};

// @desc    Update tag (Admin only)
// @route   PUT /api/admin/tags/:id
// @access  Private/Admin
const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, isActive, metaTitle, metaDescription } = req.body;

    const tag = await Tag.findById(id);
    if (!tag) {
      return sendApiResponse(res, 404, false, 'Tag not found');
    }

    // Check if name already exists (excluding current tag)
    if (name && name !== tag.name) {
      const existingTag = await Tag.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      if (existingTag) {
        return sendApiResponse(res, 400, false, 'Tag with this name already exists');
      }
    }

    // Update fields
    if (name) tag.name = name;
    if (description !== undefined) tag.description = description;
    if (color) tag.color = color;
    if (isActive !== undefined) tag.isActive = isActive;
    if (metaTitle) tag.metaTitle = metaTitle;
    if (metaDescription) tag.metaDescription = metaDescription;

    await tag.save();

    // Clear cache
    if (cache.isEnabled()) {
      await cache.delPattern('tags:*');
      await cache.delPattern(`tag:${tag.slug}`);
    }

    logger.info(`Tag updated: ${tag.name} by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Tag updated successfully', tag);
  } catch (error) {
    logger.error(`Update tag error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete tag (Admin only)
// @route   DELETE /api/admin/tags/:id
// @access  Private/Admin
const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findById(id);
    if (!tag) {
      return sendApiResponse(res, 404, false, 'Tag not found');
    }

    // Check if tag is being used by any blog
    const blogCount = await Blog.countDocuments({ 
      tags: id, 
      status: 'published' 
    });

    if (blogCount > 0) {
      return sendApiResponse(res, 400, false, `Cannot delete tag with ${blogCount} blogs. Remove tag from blogs first.`);
    }

    await tag.deleteOne();

    // Clear cache
    if (cache.isEnabled()) {
      await cache.delPattern('tags:*');
      await cache.delPattern(`tag:${tag.slug}`);
    }

    logger.info(`Tag deleted: ${tag.name} by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Tag deleted successfully');
  } catch (error) {
    logger.error(`Delete tag error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getTags,
  getPopularTags,
  getTagBySlug,
  getTagBlogs,
  createTag,
  updateTag,
  deleteTag
};