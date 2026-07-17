const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// Ensure upload directory exists with proper permissions
const uploadDir = path.join(__dirname, '../../uploads/temp');
const ensureUploadDir = () => {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
      logger.info(`📁 Created upload directory: ${uploadDir}`);
    }
    // Check write permissions
    fs.accessSync(uploadDir, fs.constants.W_OK);
    return true;
  } catch (error) {
    logger.error(`❌ Upload directory error: ${error.message}`);
    return false;
  }
};

if (!ensureUploadDir()) {
  logger.warn('⚠️ Upload directory may not be writable');
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Sanitize filename
    const sanitizedName = file.fieldname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, sanitizedName + '-' + uniqueSuffix + ext);
  }
});

// File filter with better validation
const fileFilter = (req, file, cb) => {
  // Allowed types
  const allowedTypes = {
    images: /jpeg|jpg|png|gif|webp|svg|bmp|tiff|ico/,
    videos: /mp4|mov|avi|wmv|flv|mkv|webm|m4v|3gp/,
    documents: /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv/
  };

  const extname = path.extname(file.originalname).toLowerCase().substring(1);
  const mimetype = file.mimetype;

  // Check if file type is allowed
  const isAllowed = Object.values(allowedTypes).some(pattern => 
    pattern.test(extname) || pattern.test(mimetype)
  );

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${extname || mimetype}`), false);
  }
};

// Create multer instance with limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Max 10 files per request
    fieldSize: 10 * 1024 * 1024 // 10MB field size
  },
  fileFilter: fileFilter
});

// Middleware for single image upload
const uploadSingleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// Middleware for multiple images upload
const uploadMultipleImages = (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// Middleware for video upload
const uploadVideo = (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// Middleware for document upload
const uploadDocument = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// Middleware for mixed files
const uploadMixed = (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 },
    { name: 'document', maxCount: 5 }
  ])(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'FILE_TOO_LARGE':
        return sendApiResponse(res, 400, false, 'File too large. Maximum size is 50MB');
      case 'LIMIT_FILE_COUNT':
        return sendApiResponse(res, 400, false, 'Too many files. Maximum is 10');
      case 'LIMIT_FILE_SIZE':
        return sendApiResponse(res, 400, false, 'File too large. Maximum size is 50MB');
      case 'LIMIT_FIELD_SIZE':
        return sendApiResponse(res, 400, false, 'Field data too large');
      case 'LIMIT_UNEXPECTED_FILE':
        return sendApiResponse(res, 400, false, 'Unexpected file field');
      default:
        logger.error(`Multer error: ${err.code} - ${err.message}`);
        return sendApiResponse(res, 400, false, `Upload error: ${err.message}`);
    }
  }
  if (err) {
    logger.error(`Upload error: ${err.message}`);
    return sendApiResponse(res, 400, false, err.message);
  }
  next();
};

// Validate file type
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return sendApiResponse(res, 400, false, 'No file uploaded');
    }

    const fileList = Array.isArray(files) ? files : [files];
    
    for (const file of fileList) {
      const ext = path.extname(file.originalname).toLowerCase();
      const mimetype = file.mimetype;

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
          const cleanExt = ext.startsWith('.') ? ext.substring(1) : ext;
          if (cleanExt === type) {
            isValid = true;
            break;
          }
        }
      }

      if (!isValid) {
        return sendApiResponse(res, 400, false, 
          `Invalid file type: ${file.originalname}. Allowed: ${allowedTypes.join(', ')}`
        );
      }
    }

    next();
  };
};

// Cleanup temporary files
const cleanupTempFiles = async (ageHours = 1) => {
  try {
    if (!fs.existsSync(uploadDir)) return;
    
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = ageHours * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        logger.error(`Error cleaning up ${filePath}: ${err.message}`);
      }
    }

    if (deletedCount > 0) {
      logger.info(`🧹 Cleaned up ${deletedCount} temp files older than ${ageHours} hour(s)`);
    }
  } catch (error) {
    logger.error(`❌ Cleanup error: ${error.message}`);
  }
};

// Run cleanup every hour
const cleanupInterval = setInterval(() => cleanupTempFiles(1), 3600000);

// Cleanup on process exit
process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
});

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
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return sendApiResponse(res, 400, false, 'No file uploaded');
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    const fileList = Array.isArray(files) ? files : [files];

    for (const file of fileList) {
      if (file.size > maxBytes) {
        return sendApiResponse(res, 400, false, 
          `File ${file.originalname} exceeds ${maxSizeMB}MB limit (${getFileSize(file.size)})`
        );
      }
    }

    next();
  };
};

// Get upload statistics
const getUploadStats = async () => {
  try {
    if (!fs.existsSync(uploadDir)) {
      return { exists: false, fileCount: 0, totalSize: 0 };
    }

    const files = fs.readdirSync(uploadDir);
    let totalSize = 0;
    let oldestFile = null;
    let newestFile = null;

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      if (!oldestFile || stats.mtime < oldestFile.mtime) {
        oldestFile = { name: file, mtime: stats.mtime };
      }
      if (!newestFile || stats.mtime > newestFile.mtime) {
        newestFile = { name: file, mtime: stats.mtime };
      }
    }

    return {
      exists: true,
      fileCount: files.length,
      totalSize: getFileSize(totalSize),
      oldestFile,
      newestFile
    };
  } catch (error) {
    logger.error(`❌ Upload stats error: ${error.message}`);
    return null;
  }
};

module.exports = {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
  uploadVideo,
  uploadDocument,
  uploadMixed,
  handleMulterError: (err, req, res, next) => {
    if (err) {
      return sendApiResponse(res, 400, false, err.message);
    }
    next();
  },
  validateFileType,
  validateFileSize,
  getFileSize,
  cleanupTempFiles,
  getUploadStats
};