const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const { getPagination } = require('../utils/helpers/paginationHelper');
const logger = require('../utils/logger');

// @desc    Get comments for a blog
// @route   GET /api/comments/:blogId
// @access  Public
const getComments = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const { skip, limit: limitNum } = getPagination(page, limit);

    const comments = await Comment.find({
      blog: blogId,
      status: 'approved',
      isDeleted: false,
      parentComment: null
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('replies');

    const total = await Comment.countDocuments({
      blog: blogId,
      status: 'approved',
      isDeleted: false,
      parentComment: null
    });

    sendApiResponse(res, 200, true, 'Comments fetched successfully', {
      comments,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Get comments error: ${error.message}`);
    next(error);
  }
};

// @desc    Add comment to blog
// @route   POST /api/comments/:blogId
// @access  Public
const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendApiResponse(res, 400, false, 'Validation error', errors.array());
    }

    const { blogId } = req.params;
    const { content, authorName, authorEmail, authorWebsite, parentComment } = req.body;

    // Check if blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return sendApiResponse(res, 404, false, 'Blog not found');
    }

    // Check if blog allows comments
    if (blog.settings && blog.settings.allowComments === false) {
      return sendApiResponse(res, 403, false, 'Comments are disabled for this blog');
    }

    // Get IP and device info
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Create comment
    const comment = await Comment.create({
      blog: blogId,
      content,
      author: {
        name: authorName,
        email: authorEmail,
        website: authorWebsite
      },
      ipAddress: ip,
      deviceInfo: {
        userAgent
      },
      parentComment: parentComment || null,
      status: 'pending' // Requires approval
    });

    // If parent comment exists, add reply to parent
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }

    // Populate author info
    await comment.populate('replies');

    sendApiResponse(res, 201, true, 'Comment added successfully (pending approval)', comment);
  } catch (error) {
    logger.error(`Add comment error: ${error.message}`);
    next(error);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Public (by IP)
const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) {
      return sendApiResponse(res, 404, false, 'Comment not found');
    }

    // Check if user can edit (by IP)
    const ip = req.ip || req.connection.remoteAddress;
    if (!comment.canEdit(ip)) {
      return sendApiResponse(res, 403, false, 'You cannot edit this comment');
    }

    // Update comment
    comment.content = content;
    comment.editedAt = Date.now();
    comment.editHistory.push({
      content: comment.content,
      editedAt: Date.now()
    });
    await comment.save();

    sendApiResponse(res, 200, true, 'Comment updated successfully', comment);
  } catch (error) {
    logger.error(`Update comment error: ${error.message}`);
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Public (by IP) or Admin
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return sendApiResponse(res, 404, false, 'Comment not found');
    }

    // Check if user can delete (by IP) or is admin
    const ip = req.ip || req.connection.remoteAddress;
    const isAdmin = req.user && req.user.role === 'admin';
    
    if (!isAdmin && !comment.canDelete(ip)) {
      return sendApiResponse(res, 403, false, 'You cannot delete this comment');
    }

    // Soft delete
    comment.isDeleted = true;
    comment.content = '[Deleted]';
    await comment.save();

    sendApiResponse(res, 200, true, 'Comment deleted successfully');
  } catch (error) {
    logger.error(`Delete comment error: ${error.message}`);
    next(error);
  }
};

// @desc    Approve comment (Admin only)
// @route   PUT /api/admin/comments/:id/approve
// @access  Private/Admin
const approveComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return sendApiResponse(res, 404, false, 'Comment not found');
    }

    comment.status = 'approved';
    comment.isApproved = true;
    await comment.save();

    // Update blog comment count
    await Blog.findByIdAndUpdate(comment.blog, {
      $inc: { commentCount: 1 }
    });

    sendApiResponse(res, 200, true, 'Comment approved successfully', comment);
  } catch (error) {
    logger.error(`Approve comment error: ${error.message}`);
    next(error);
  }
};

// @desc    Reject comment (Admin only)
// @route   PUT /api/admin/comments/:id/reject
// @access  Private/Admin
const rejectComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return sendApiResponse(res, 404, false, 'Comment not found');
    }

    comment.status = 'rejected';
    await comment.save();

    sendApiResponse(res, 200, true, 'Comment rejected successfully', comment);
  } catch (error) {
    logger.error(`Reject comment error: ${error.message}`);
    next(error);
  }
};

// @desc    Get pending comments (Admin only)
// @route   GET /api/admin/comments/pending
// @access  Private/Admin
const getPendingComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const { skip, limit: limitNum } = getPagination(page, limit);

    const comments = await Comment.find({ 
      status: 'pending',
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('blog', 'title slug');

    const total = await Comment.countDocuments({
      status: 'pending',
      isDeleted: false
    });

    sendApiResponse(res, 200, true, 'Pending comments fetched successfully', {
      comments,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error(`Get pending comments error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
  getPendingComments
};