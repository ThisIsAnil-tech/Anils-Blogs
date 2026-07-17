const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

// @desc    Search blogs
// @route   GET /api/search
// @access  Public
const searchBlogs = async (req, res, next) => {
  try {
    const { 
      q, 
      category, 
      tag, 
      sort = 'relevance', 
      page = 1, 
      limit = 12, 
      dateFrom, 
      dateTo, 
      status 
    } = req.query;

    // Try cache first for common searches
    const cacheKey = `search:${q}:${category || 'none'}:${tag || 'none'}:${sort}:${page}:${limit}`;
    if (cache.isEnabled() && q.length > 2) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Search results fetched (cached)', cached);
      }
    }

    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { status: 'published' };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { 'seoSettings.keywords': { $regex: q, $options: 'i' } }
      ];
    }

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) query.category = categoryDoc._id;
    }

    if (tag) {
      const tagDoc = await Tag.findOne({ slug: tag });
      if (tagDoc) query.tags = tagDoc._id;
    }

    if (dateFrom || dateTo) {
      query.publishDate = {};
      if (dateFrom) query.publishDate.$gte = new Date(dateFrom);
      if (dateTo) query.publishDate.$lte = new Date(dateTo);
    }

    if (status && req.user && req.user.role === 'admin') {
      query.status = status;
    }

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

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .populate('author', 'username fullName')
        .select('title slug featuredImage publishDate viewCount likeCount commentCount excerpt'),
      
      Blog.countDocuments(query)
    ]);

    const result = {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      query: q
    };

    // Cache for 10 minutes if search term is long enough
    if (cache.isEnabled() && q.length > 2 && parseInt(page) <= 3) {
      await cache.set(cacheKey, result, 600);
    }

    sendApiResponse(res, 200, true, 'Search results fetched', result);
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

    // Try cache first
    const cacheKey = `suggestions:${q}:${type}:${limit}`;
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Suggestions fetched (cached)', cached);
      }
    }

    const suggestions = [];

    if (type === 'all' || type === 'blogs') {
      const blogs = await Blog.find({
        status: 'published',
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { 'seoSettings.keywords': { $regex: q, $options: 'i' } }
        ]
      })
        .limit(parseInt(limit))
        .select('title slug featuredImage');

      blogs.forEach(blog => {
        suggestions.push({
          type: 'blog',
          title: blog.title,
          slug: blog.slug,
          url: `/blogs/${blog.slug}`,
          image: blog.featuredImage
        });
      });
    }

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

    // Sort suggestions by relevance (exact matches first)
    suggestions.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      const bExact = b.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      return aExact - bExact;
    });

    const limitedSuggestions = suggestions.slice(0, parseInt(limit));

    // Cache for 1 hour
    if (cache.isEnabled()) {
      await cache.set(cacheKey, limitedSuggestions, 3600);
    }

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

    const searchQuery = { status: 'published' };

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { 'seoSettings.keywords': { $regex: query, $options: 'i' } }
      ];
    }

    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        const categories = await Category.find({
          slug: { $in: filters.categories }
        });
        if (categories.length > 0) {
          searchQuery.category = { $in: categories.map(c => c._id) };
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        const tags = await Tag.find({
          slug: { $in: filters.tags }
        });
        if (tags.length > 0) {
          searchQuery.tags = { $in: tags.map(t => t._id) };
        }
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

      if (filters.minViews) {
        searchQuery.viewCount = { $gte: parseInt(filters.minViews) };
      }

      if (filters.minLikes) {
        searchQuery.likeCount = { $gte: parseInt(filters.minLikes) };
      }
    }

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

    const [blogs, total] = await Promise.all([
      Blog.find(searchQuery)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug')
        .populate('tags', 'name slug')
        .populate('author', 'username fullName')
        .select('title slug featuredImage publishDate viewCount likeCount commentCount excerpt'),
      
      Blog.countDocuments(searchQuery)
    ]);

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