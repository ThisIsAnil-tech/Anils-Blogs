const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const imageTypes = /jpeg|jpg|png|gif|webp|svg|bmp|tiff/;
  // Allowed video types
  const videoTypes = /mp4|mov|avi|wmv|flv|mkv|webm|m4v/;
  // Allowed document types
  const docTypes = /pdf|doc|docx|txt|rtf/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  const isValidImage = imageTypes.test(extname) || imageTypes.test(mimetype);
  const isValidVideo = videoTypes.test(extname) || videoTypes.test(mimetype);
  const isValidDoc = docTypes.test(extname) || docTypes.test(mimetype);

  if (isValidImage || isValidVideo || isValidDoc) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos, and documents are allowed'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single image upload
const uploadSingleImage = upload.single('image');

// Middleware for multiple images upload
const uploadMultipleImages = upload.array('images', 10);

// Middleware for video upload
const uploadVideo = upload.single('video');

// Middleware for document upload
const uploadDocument = upload.single('document');

// Middleware for mixed files
const uploadMixed = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 5 }
]);

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return sendApiResponse(res, 400, false, 'File too large. Maximum size is 50MB');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return sendApiResponse(res, 400, false, 'Too many files. Maximum is 10');
    }
    return sendApiResponse(res, 400, false, `Upload error: ${err.message}`);
  }
  if (err) {
    return sendApiResponse(res, 400, false, err.message);
  }
  next();
};

// Validate file type
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.file) {
      return sendApiResponse(res, 400, false, 'No file uploaded');
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const mimetype = req.file.mimetype;

    let isValid = false;
    for (const type of allowedTypes) {
      if (type.includes('/')) {
        // MIME type check
        if (mimetype === type) {
          isValid = true;
          break;
        }
      } else {
        // Extension check
        if (ext === type || ext === '.' + type) {
          isValid = true;
          break;
        }
      }
    }

    if (!isValid) {
      return sendApiResponse(res, 400, false, `Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    next();
  };
};

// Cleanup temporary files
const cleanupTempFiles = async () => {
  try {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up temp file: ${file}`);
      }
    }
  } catch (error) {
    logger.error(`Cleanup error: ${error.message}`);
  }
};

// Run cleanup every hour
setInterval(cleanupTempFiles, 3600000);

// Get file size in human readable format
const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file size
const validateFileSize = (maxSizeMB) => {
  return (req, res, next) => {
    if (!req.file) {
      return sendApiResponse(res, 400, false, 'No file uploaded');
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (req.file.size > maxBytes) {
      return sendApiResponse(res, 400, false, `File size exceeds ${maxSizeMB}MB limit`);
    }

    next();
  };
};

module.exports = {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
  uploadVideo,
  uploadDocument,
  uploadMixed,
  handleUploadError,
  validateFileType,
  validateFileSize,
  getFileSize,
  cleanupTempFiles
};