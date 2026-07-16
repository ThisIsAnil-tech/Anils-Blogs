const Category = require('../models/Category');
const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const logger = require('../utils/logger');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .populate('subcategories');

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

    const category = await Category.findOne({ slug, isActive: true })
      .populate('subcategories');

    if (!category) {
      return sendApiResponse(res, 404, false, 'Category not found');
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

    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      return sendApiResponse(res, 404, false, 'Category not found');
    }

    const { skip, limit: limitNum } = getPagination(page, limit);

    const blogs = await Blog.find({
      category: category._id,
      status: 'published'
    })
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'username fullName')
      .populate('tags', 'name slug');

    const total = await Blog.countDocuments({
      category: category._id,
      status: 'published'
    });

    sendApiResponse(res, 200, true, 'Category blogs fetched successfully', {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
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
      return sendApiResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { name, description, icon, color, parentCategory, isActive, order, metaTitle, metaDescription } = req.body;

    const category = await Category.create({
      name,
      description,
      icon,
      color,
      parentCategory,
      isActive,
      order,
      metaTitle,
      metaDescription
    });

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
    const { name, description, icon, color, parentCategory, isActive, order, metaTitle, metaDescription } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return sendApiResponse(res, 404, false, 'Category not found');
    }

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

    await category.deleteOne();

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