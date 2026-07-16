const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const logger = require('../utils/logger');

// @desc    Search blogs
// @route   GET /api/search
// @access  Public
const searchBlogs = async (req, res, next) => {
  try {
    const { q, category, tag, sort = 'relevance', page = 1, limit = 12, dateFrom, dateTo, status } = req.query;

    const { skip, limit: limitNum } = getPagination(page, limit);

    // Build query
    const query = { status: 'published' };

    // Search term
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) query.category = categoryDoc._id;
    }

    // Tag filter
    if (tag) {
      const tagDoc = await Tag.findOne({ slug: tag });
      if (tagDoc) query.tags = tagDoc._id;
    }

    // Date range
    if (dateFrom || dateTo) {
      query.publishDate = {};
      if (dateFrom) query.publishDate.$gte = new Date(dateFrom);
      if (dateTo) query.publishDate.$lte = new Date(dateTo);
    }

    // Status (for admin search)
    if (status && req.user && req.user.role === 'admin') {
      query.status = status;
    }

    // Sort
    let sortOption = { publishDate: -1 };
    switch (sort) {
      case 'relevance':
        sortOption = { $text: { $score: { $meta: 'textScore' } } };
        break;
      case 'date':
        sortOption = { publishDate: -1 };
        break;
      case 'views':
        sortOption = { viewCount: -1 };
        break;
      case 'likes':
        sortOption = { likeCount: -1 };
        break;
      case 'comments':
        sortOption = { commentCount: -1 };
        break;
      default:
        sortOption = { publishDate: -1 };
    }

    const blogs = await Blog.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username fullName');

    const total = await Blog.countDocuments(query);

    sendApiResponse(res, 200, true, 'Search results fetched', {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      query: q
    });
  } catch (error) {
    logger.error(`Search blogs error: ${error.message}`);
    next(error);
  }
};

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Public
const searchSuggestions = async (req, res, next) => {
  try {
    const { q, limit = 10, type = 'all' } = req.query;

    if (!q || q.length < 1) {
      return sendApiResponse(res, 200, true, 'Suggestions fetched', []);
    }

    const suggestions = [];

    // Blog title suggestions
    if (type === 'all' || type === 'blogs') {
      const blogs = await Blog.find({
        status: 'published',
        title: { $regex: q, $options: 'i' }
      })
        .limit(parseInt(limit))
        .select('title slug');

      blogs.forEach(blog => {
        suggestions.push({
          type: 'blog',
          title: blog.title,
          slug: blog.slug,
          url: `/blogs/${blog.slug}`
        });
      });
    }

    // Category suggestions
    if (type === 'all' || type === 'categories') {
      const categories = await Category.find({
        isActive: true,
        name: { $regex: q, $options: 'i' }
      })
        .limit(5)
        .select('name slug');

      categories.forEach(category => {
        suggestions.push({
          type: 'category',
          title: category.name,
          slug: category.slug,
          url: `/categories/${category.slug}`
        });
      });
    }

    // Tag suggestions
    if (type === 'all' || type === 'tags') {
      const tags = await Tag.find({
        isActive: true,
        name: { $regex: q, $options: 'i' }
      })
        .limit(5)
        .select('name slug');

      tags.forEach(tag => {
        suggestions.push({
          type: 'tag',
          title: tag.name,
          slug: tag.slug,
          url: `/tags/${tag.slug}`
        });
      });
    }

    // Limit total suggestions
    const limitedSuggestions = suggestions.slice(0, parseInt(limit));

    sendApiResponse(res, 200, true, 'Suggestions fetched', limitedSuggestions);
  } catch (error) {
    logger.error(`Search suggestions error: ${error.message}`);
    next(error);
  }
};

// @desc    Advanced search
// @route   POST /api/search/advanced
// @access  Public
const advancedSearch = async (req, res, next) => {
  try {
    const { query, filters, sort, page = 1, limit = 12 } = req.body;

    const { skip, limit: limitNum } = getPagination(page, limit);

    // Build query
    const searchQuery = { status: 'published' };

    // Search term
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ];
    }

    // Apply filters
    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        const categories = await Category.find({
          slug: { $in: filters.categories }
        });
        searchQuery.category = { $in: categories.map(c => c._id) };
      }

      if (filters.tags && filters.tags.length > 0) {
        const tags = await Tag.find({
          slug: { $in: filters.tags }
        });
        searchQuery.tags = { $in: tags.map(t => t._id) };
      }

      if (filters.dateRange) {
        searchQuery.publishDate = {};
        if (filters.dateRange.from) {
          searchQuery.publishDate.$gte = new Date(filters.dateRange.from);
        }
        if (filters.dateRange.to) {
          searchQuery.publishDate.$lte = new Date(filters.dateRange.to);
        }
      }

      if (filters.status && req.user && req.user.role === 'admin') {
        searchQuery.status = filters.status;
      }

      if (filters.isFeatured !== undefined) {
        searchQuery.isFeatured = filters.isFeatured;
      }
    }

    // Sort
    let sortOption = { publishDate: -1 };
    if (sort) {
      switch (sort.field) {
        case 'relevance':
          sortOption = { $text: { $score: { $meta: 'textScore' } } };
          break;
        case 'title':
          sortOption = { title: sort.order === 'asc' ? 1 : -1 };
          break;
        case 'publishDate':
          sortOption = { publishDate: sort.order === 'asc' ? 1 : -1 };
          break;
        case 'viewCount':
          sortOption = { viewCount: sort.order === 'asc' ? 1 : -1 };
          break;
        case 'likeCount':
          sortOption = { likeCount: sort.order === 'asc' ? 1 : -1 };
          break;
        case 'commentCount':
          sortOption = { commentCount: sort.order === 'asc' ? 1 : -1 };
          break;
        default:
          sortOption = { publishDate: -1 };
      }
    }

    const blogs = await Blog.find(searchQuery)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'username fullName');

    const total = await Blog.countDocuments(searchQuery);

    sendApiResponse(res, 200, true, 'Advanced search results fetched', {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Advanced search error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  searchBlogs,
  searchSuggestions,
  advancedSearch
};