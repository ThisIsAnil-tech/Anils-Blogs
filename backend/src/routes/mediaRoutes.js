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
const { idValidation } = require('../middleware/validation');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All media routes are protected (Admin only)
router.use(protect);
router.use(isAdmin);
router.use(uploadLimiter);

// Upload single image
router.post(
  '/image',
  uploadSingleImage,
  validateFileType(['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg']),
  validateFileSize(10),
  handleUploadError,
  uploadImageFile
);

// Upload multiple images
router.post(
  '/images',
  uploadMultiple,
  validateFileType(['jpeg', 'jpg', 'png', 'gif', 'webp']),
  validateFileSize(10),
  handleUploadError,
  uploadMultipleImages
);

// Upload video
router.post(
  '/video',
  uploadVideo,
  validateFileType(['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm']),
  validateFileSize(50),
  handleUploadError,
  uploadVideoFile
);

// Delete media
router.delete('/:publicId', idValidation, deleteMediaFile);

module.exports = router;