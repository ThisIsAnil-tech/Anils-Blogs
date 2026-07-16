const { uploadImage, uploadVideo, deleteMedia } = require('../config/cloudinary');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

// @desc    Upload image
// @route   POST /api/admin/media/image
// @access  Private/Admin
const uploadImageFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendApiResponse(res, 400, false, 'Please upload an image');
    }

    const result = await uploadImage(req.file.path, {
      public_id: `image_${Date.now()}`,
      ...req.body
    });

    // Delete temp file
    await unlinkFile(req.file.path);

    sendApiResponse(res, 201, true, 'Image uploaded successfully', {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    });
  } catch (error) {
    logger.error(`Upload image error: ${error.message}`);
    // Clean up temp file
    if (req.file) {
      try {
        await unlinkFile(req.file.path);
      } catch (err) {
        logger.error(`Cleanup error: ${err.message}`);
      }
    }
    next(error);
  }
};

// @desc    Upload multiple images
// @route   POST /api/admin/media/images
// @access  Private/Admin
const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendApiResponse(res, 400, false, 'Please upload at least one image');
    }

    const results = [];
    for (const file of req.files) {
      try {
        const result = await uploadImage(file.path, {
          public_id: `image_${Date.now()}_${Math.random().toString(36).substring(7)}`
        });
        results.push({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes
        });
        await unlinkFile(file.path);
      } catch (error) {
        logger.error(`Upload individual image error: ${error.message}`);
        // Clean up failed upload
        try {
          await unlinkFile(file.path);
        } catch (err) {
          logger.error(`Cleanup error: ${err.message}`);
        }
      }
    }

    sendApiResponse(res, 201, true, 'Images uploaded successfully', results);
  } catch (error) {
    logger.error(`Upload multiple images error: ${error.message}`);
    // Clean up temp files
    if (req.files) {
      for (const file of req.files) {
        try {
          await unlinkFile(file.path);
        } catch (err) {
          logger.error(`Cleanup error: ${err.message}`);
        }
      }
    }
    next(error);
  }
};

// @desc    Upload video
// @route   POST /api/admin/media/video
// @access  Private/Admin
const uploadVideoFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendApiResponse(res, 400, false, 'Please upload a video');
    }

    const result = await uploadVideo(req.file.path, {
      public_id: `video_${Date.now()}`
    });

    // Delete temp file
    await unlinkFile(req.file.path);

    sendApiResponse(res, 201, true, 'Video uploaded successfully', {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      duration: result.duration,
      thumbnail: result.thumbnail_url
    });
  } catch (error) {
    logger.error(`Upload video error: ${error.message}`);
    if (req.file) {
      try {
        await unlinkFile(req.file.path);
      } catch (err) {
        logger.error(`Cleanup error: ${err.message}`);
      }
    }
    next(error);
  }
};

// @desc    Delete media
// @route   DELETE /api/admin/media/:publicId
// @access  Private/Admin
const deleteMediaFile = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    await deleteMedia(publicId, resourceType);

    sendApiResponse(res, 200, true, 'Media deleted successfully');
  } catch (error) {
    logger.error(`Delete media error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  uploadImageFile,
  uploadMultipleImages,
  uploadVideoFile,
  deleteMediaFile
};