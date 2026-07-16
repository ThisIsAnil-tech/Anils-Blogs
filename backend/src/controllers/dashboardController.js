const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const Subscriber = require('../models/Subscriber');
const Like = require('../models/Like');
const Share = require('../models/Share');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalBlogs,
      publishedBlogs,
      totalComments,
      totalLikes,
      totalShares,
      totalSubscribers,
      activeSubscribers,
      totalViews
    ] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Comment.countDocuments({ status: 'approved', isDeleted: false }),
      Like.countDocuments(),
      Share.countDocuments(),
      Subscriber.countDocuments(),
      Subscriber.countDocuments({ status: 'active', isVerified: true }),
      Blog.aggregate([
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ])
    ]);

    // Recent blogs
    const recentBlogs = await Blog.find({ status: 'published' })
      .sort({ publishDate: -1 })
      .limit(5)
      .select('title slug featuredImage publishDate viewCount likeCount commentCount');

    // Recent comments
    const recentComments = await Comment.find({ status: 'approved', isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('blog', 'title slug');

    sendApiResponse(res, 200, true, 'Dashboard stats fetched', {
      stats: {
        totalBlogs,
        publishedBlogs,
        draftBlogs: totalBlogs - publishedBlogs,
        totalComments,
        totalLikes,
        totalShares,
        totalSubscribers,
        activeSubscribers,
        totalViews: totalViews[0]?.total || 0
      },
      recentBlogs,
      recentComments
    });
  } catch (error) {
    logger.error(`Get dashboard stats error: ${error.message}`);
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get views over time
    const viewsData = await Blog.aggregate([
      { $unwind: '$views' },
      { $match: { 'views.timestamp': { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$views.timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get likes over time
    const likesData = await Like.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get shares over time
    const sharesData = await Share.aggregate([
      { $match: { sharedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$sharedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get comments over time
    const commentsData = await Comment.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'approved' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get subscriber growth
    const subscriberData = await Subscriber.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top blogs
    const topBlogs = await Blog.find({ status: 'published' })
      .sort({ viewCount: -1, likeCount: -1 })
      .limit(10)
      .select('title slug viewCount likeCount commentCount shareCount');

    sendApiResponse(res, 200, true, 'Analytics data fetched', {
      period: days + ' days',
      data: {
        views: viewsData,
        likes: likesData,
        shares: sharesData,
        comments: commentsData,
        subscribers: subscriberData,
        topBlogs
      }
    });
  } catch (error) {
    logger.error(`Get analytics error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics
};