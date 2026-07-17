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
    fs.accessSync(uploadDir, fs.constants.W_OK);
    return true;
  } catch (error) {
    logger.error(`❌ Upload directory error: ${error.message}`);
    return false;
  }
};

ensureUploadDir();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const sanitizedName = file.fieldname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, sanitizedName + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    images: /jpeg|jpg|png|gif|webp|svg|bmp|tiff|ico/,
    videos: /mp4|mov|avi|wmv|flv|mkv|webm|m4v|3gp/,
    documents: /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv/
  };

  const extname = path.extname(file.originalname).toLowerCase().substring(1);
  const mimetype = file.mimetype;

  const isAllowed = Object.values(allowedTypes).some(pattern => 
    pattern.test(extname) || pattern.test(mimetype)
  );

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${extname || mimetype}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10,
    fieldSize: 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// Multer middleware wrappers (these return the actual middleware functions)
const uploadSingleImage = upload.single('image');
const uploadMultipleImages = upload.array('images', 10);
const uploadVideo = upload.single('video');
const uploadDocument = upload.single('document');
const uploadMixed = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 5 }
]);

// Error handler middleware
const handleUploadError = (err, req, res, next) => {
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

// File type validation middleware - RETURNS A FUNCTION
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
          if (mimetype === type) {
            isValid = true;
            break;
          }
        } else {
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

// File size validation middleware - RETURNS A FUNCTION
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
          `File ${file.originalname} exceeds ${maxSizeMB}MB limit`
        );
      }
    }

    next();
  };
};

// Cleanup function
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

process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
});

const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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