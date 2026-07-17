const Blog = require('../models/Blog');
const Share = require('../models/Share');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// @desc    Share a blog
// @route   POST /api/shares/:blogId
// @access  Public
const shareBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { platform = 'direct' } = req.body || {};
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    // Check if already shared from this IP (for this blog)
    const existingShare = await Share.findOne({
      blog: blogId,
      ipAddress: ip
    });

    if (existingShare) {
      // Update share count
      existingShare.platform = platform;
      existingShare.sharedAt = Date.now();
      await existingShare.save();
      
      // Don't increment count again if already shared
      return sendApiResponse(res, 200, true, 'Share updated', {
        count: blog.shareCount,
        alreadyShared: true
      });
    }

    // Create new share
    await Share.create({
      blog: blogId,
      ipAddress: ip,
      deviceInfo: userAgent,
      platform
    });

    // Increment share count
    blog.shareCount += 1;
    await blog.save();

    sendApiResponse(res, 200, true, 'Blog shared successfully', {
      count: blog.shareCount,
      alreadyShared: false
    });
  } catch (error) {
    logger.error(`Share blog error: ${error.message}`);
    next(error);
  }
};

// @desc    Get blog share count
// @route   GET /api/shares/:blogId/count
// @access  Public
const getShareCount = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId).select('shareCount');
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    sendApiResponse(res, 200, true, 'Share count fetched', {
      count: blog.shareCount
    });
  } catch (error) {
    logger.error(`Get share count error: ${error.message}`);
    next(error);
  }
};

// @desc    Get share analytics (Admin only)
// @route   GET /api/admin/shares/analytics
// @access  Private/Admin
const getShareAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const shares = await Share.find({
      sharedAt: { $gte: startDate }
    });

    const analytics = {
      total: shares.length,
      byPlatform: {},
      byDay: {}
    };

    shares.forEach(share => {
      // By platform
      if (!analytics.byPlatform[share.platform]) {
        analytics.byPlatform[share.platform] = 0;
      }
      analytics.byPlatform[share.platform]++;

      // By day
      const day = share.sharedAt.toISOString().split('T')[0];
      if (!analytics.byDay[day]) {
        analytics.byDay[day] = 0;
      }
      analytics.byDay[day]++;
    });

    sendApiResponse(res, 200, true, 'Share analytics fetched', analytics);
  } catch (error) {
    logger.error(`Get share analytics error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  shareBlog,
  getShareCount,
  getShareAnalytics
};