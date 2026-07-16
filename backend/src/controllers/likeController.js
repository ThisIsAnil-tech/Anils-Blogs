const Blog = require('../models/Blog');
const Like = require('../models/Like');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// @desc    Like a blog
// @route   POST /api/likes/:blogId
// @access  Public
const toggleLike = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    // Check if already liked from this IP
    const existingLike = await Like.findOne({
      blog: blogId,
      ipAddress: ip
    });

    if (existingLike) {
      // Unlike (remove like)
      await existingLike.deleteOne();
      blog.likeCount = Math.max(0, blog.likeCount - 1);
      await blog.save();

      return sendApiResponse(res, 200, true, 'Blog unliked', { liked: false, count: blog.likeCount });
    }

    // Create new like
    await Like.create({
      blog: blogId,
      ipAddress: ip,
      deviceInfo: userAgent
    });

    // Increment like count
    blog.likeCount += 1;
    await blog.save();

    sendApiResponse(res, 200, true, 'Blog liked', { liked: true, count: blog.likeCount });
  } catch (error) {
    logger.error(`Toggle like error: ${error.message}`);
    next(error);
  }
};

// @desc    Check if user liked blog
// @route   GET /api/likes/:blogId/check
// @access  Public
const checkLikeStatus = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const ip = req.ip || req.connection.remoteAddress;

    const like = await Like.findOne({
      blog: blogId,
      ipAddress: ip
    });

    sendApiResponse(res, 200, true, 'Like status fetched', {
      liked: !!like
    });
  } catch (error) {
    logger.error(`Check like status error: ${error.message}`);
    next(error);
  }
};

// @desc    Get blog like count
// @route   GET /api/likes/:blogId/count
// @access  Public
const getLikeCount = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    const blog = await Blog.findById(blogId).select('likeCount');
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    sendApiResponse(res, 200, true, 'Like count fetched', {
      count: blog.likeCount
    });
  } catch (error) {
    logger.error(`Get like count error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  toggleLike,
  checkLikeStatus,
  getLikeCount
};