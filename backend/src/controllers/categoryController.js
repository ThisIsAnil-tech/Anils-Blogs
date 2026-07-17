const Category = require('../models/Category');
const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    // Try cache first
    const cacheKey = 'categories:all';
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Categories fetched successfully (cached)', cached);
      }
    }

    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .populate('subcategories');

    // Cache for 1 hour
    if (cache.isEnabled()) {
      await cache.set(cacheKey, categories, 3600);
    }

    sendApiResponse(res, 200, true, 'Categories fetched successfully', categories);
  } catch (error) {
    logger.error(`Get categories error: ${error.message}`);
    next(error);
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/:slug
// @access  Public
const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Try cache first
    const cacheKey = `category:${slug}`;
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Category fetched successfully (cached)', cached);
      }
    }

    const category = await Category.findOne({ slug, isActive: true })
      .populate('subcategories');

    if (!category) {
      return sendApiResponse(res, 404, false, 'Category not found');
    }

    // Cache for 1 hour
    if (cache.isEnabled()) {
      await cache.set(cacheKey, category, 3600);
    }

    sendApiResponse(res, 200, true, 'Category fetched successfully', category);
  } catch (error) {
    logger.error(`Get category by slug error: ${error.message}`);
    next(error);
  }
};

// @desc    Get blogs in category
// @route   GET /api/categories/:slug/blogs
// @access  Public
const getCategoryBlogs = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Try cache first
    const cacheKey = `category:${slug}:blogs:page${page}:limit${limit}`;
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Category blogs fetched successfully (cached)', cached);
      }
    }

    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      return sendApiResponse(res, 404, false, 'Category not found');
    }

    const { skip, limit: limitNum } = getPagination(page, limit);

    const [blogs, total] = await Promise.all([
      Blog.find({
        category: category._id,
        status: 'published'
      })
        .sort({ publishDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'username fullName')
        .populate('tags', 'name slug')
        .select('title slug featuredImage publishDate viewCount likeCount commentCount excerpt'),
      
      Blog.countDocuments({
        category: category._id,
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

    sendApiResponse(res, 200, true, 'Category blogs fetched successfully', result);
  } catch (error) {
    logger.error(`Get category blogs error: ${error.message}`);
    next(error);
  }
};

// @desc    Create category (Admin only)
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendApiResponse(res, 400, false, 'Validation error', null, errors.array());
    }

    const { 
      name, 
      description, 
      icon, 
      color, 
      parentCategory, 
      isActive, 
      order, 
      metaTitle, 
      metaDescription 
    } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return sendApiResponse(res, 400, false, 'Category with this name already exists');
    }

    const category = await Category.create({
      name,
      description,
      icon,
      color,
      parentCategory,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      metaTitle,
      metaDescription
    });

    // Clear cache
    if (cache.isEnabled()) {
      await cache.delPattern('categories:*');
    }

    logger.info(`Category created: ${category.name} by ${req.user.username}`);
    sendApiResponse(res, 201, true, 'Category created successfully', category);
  } catch (error) {
    logger.error(`Create category error: ${error.message}`);
    next(error);
  }
};

// @desc    Update category (Admin only)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      icon, 
      color, 
      parentCategory, 
      isActive, 
      order, 
      metaTitle, 
      metaDescription 
    } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return sendApiResponse(res, 404, false, 'Category not found');
    }

    // Check if name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      if (existingCategory) {
        return sendApiResponse(res, 400, false, 'Category with this name already exists');
      }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color) category.color = color;
    if (parentCategory !== undefined) category.parentCategory = parentCategory;
    if (isActive !== undefined) category.isActive = isActive;
    if (order !== undefined) category.order = order;
    if (metaTitle) category.metaTitle = metaTitle;
    if (metaDescription) category.metaDescription = metaDescription;

    await category.save();

    // Clear cache
    if (cache.isEnabled()) {
      await cache.delPattern('categories:*');
      await cache.delPattern(`category:${category.slug}`);
    }

    logger.info(`Category updated: ${category.name} by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Category updated successfully', category);
  } catch (error) {
    logger.error(`Update category error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete category (Admin only)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return sendApiResponse(res, 404, false, 'Category not found');
    }

    // Check if category has blogs
    const blogCount = await Blog.countDocuments({ 
      category: id, 
      status: 'published' 
    });

    if (blogCount > 0) {
      return sendApiResponse(res, 400, false, `Cannot delete category with ${blogCount} blogs. Remove or reassign blogs first.`);
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: id });
    if (subcategoryCount > 0) {
      return sendApiResponse(res, 400, false, `Cannot delete category with ${subcategoryCount} subcategories. Delete or reassign subcategories first.`);
    }

    await category.deleteOne();

    // Clear cache
    if (cache.isEnabled()) {
      await cache.delPattern('categories:*');
      await cache.delPattern(`category:${category.slug}`);
    }

    logger.info(`Category deleted: ${category.name} by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Category deleted successfully');
  } catch (error) {
    logger.error(`Delete category error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  getCategoryBlogs,
  createCategory,
  updateCategory,
  deleteCategory
};