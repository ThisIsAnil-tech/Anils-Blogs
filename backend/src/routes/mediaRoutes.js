const express = require('express');
const router = express.Router();
const {
  uploadImageFile,
  uploadMultipleImages,
  uploadVideoFile,
  deleteMediaFile
} = require('../controllers/mediaController');
const {
  uploadSingleImage,
  uploadMultipleImages: uploadMultiple,
  uploadVideo,
  handleUploadError,
  validateFileType,
  validateFileSize
} = require('../middleware/upload');
const { protect, isAdmin } = require('../middleware/auth');
const { publicIdValidation } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All media routes are protected (Admin only)
router.use(protect);
router.use(isAdmin);
router.use(uploadLimiter);

// Upload single image
router.post(
  '/image',
  uploadSingleImage,
  (req, res, next) => validateFileType(['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'])(req, res, next),
  (req, res, next) => validateFileSize(10)(req, res, next),
  (req, res, next) => handleUploadError(null, req, res, next),
  uploadImageFile
);

// Upload multiple images
router.post(
  '/images',
  uploadMultiple,
  (req, res, next) => validateFileType(['jpeg', 'jpg', 'png', 'gif', 'webp'])(req, res, next),
  (req, res, next) => validateFileSize(10)(req, res, next),
  (req, res, next) => handleUploadError(null, req, res, next),
  uploadMultipleImages
);

// Upload video
router.post(
  '/video',
  uploadVideo,
  (req, res, next) => validateFileType(['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'])(req, res, next),
  (req, res, next) => validateFileSize(50)(req, res, next),
  (req, res, next) => handleUploadError(null, req, res, next),
  uploadVideoFile
);

// Delete media
router.delete('/:publicId', publicIdValidation, deleteMediaFile);

module.exports = router;