const Tag = require('../models/Tag');
const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const logger = require('../utils/logger');

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
const getTags = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const tags = await Tag.find(query).sort({ name: 1 });

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
    const tags = await Tag.getPopular(parseInt(limit));

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

    const tag = await Tag.findOne({ slug, isActive: true });
    if (!tag) {
      return sendApiResponse(res, 404, false, 'Tag not found');
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

    const tag = await Tag.findOne({ slug, isActive: true });
    if (!tag) {
      return sendApiResponse(res, 404, false, 'Tag not found');
    }

    const { skip, limit: limitNum } = getPagination(page, limit);

    const blogs = await Blog.find({
      tags: tag._id,
      status: 'published'
    })
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'username fullName')
      .populate('category', 'name slug');

    const total = await Blog.countDocuments({
      tags: tag._id,
      status: 'published'
    });

    sendApiResponse(res, 200, true, 'Tag blogs fetched successfully', {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
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
      return sendApiResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, description, color, isActive, metaTitle, metaDescription } = req.body;

    const tag = await Tag.create({
      name,
      description,
      color,
      isActive,
      metaTitle,
      metaDescription
    });

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

    if (name) tag.name = name;
    if (description !== undefined) tag.description = description;
    if (color) tag.color = color;
    if (isActive !== undefined) tag.isActive = isActive;
    if (metaTitle) tag.metaTitle = metaTitle;
    if (metaDescription) tag.metaDescription = metaDescription;

    await tag.save();

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

    await tag.deleteOne();

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