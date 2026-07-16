const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {boolean} File exists
 */
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

/**
 * Get file size in bytes
 * @param {string} filePath - Path to file
 * @returns {number} File size
 */
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
};

/**
 * Get file extension
 * @param {string} fileName - File name
 * @returns {string} File extension
 */
const getFileExtension = (fileName) => {
  return path.extname(fileName).toLowerCase();
};

/**
 * Get file name without extension
 * @param {string} fileName - File name
 * @returns {string} File name without extension
 */
const getFileNameWithoutExt = (fileName) => {
  return path.basename(fileName, path.extname(fileName));
};

/**
 * Format file size to human readable
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Human readable size
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get MIME type from file extension
 * @param {string} extension - File extension
 * @returns {string} MIME type
 */
const getMimeType = (extension) => {
  const mimeTypes = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * Generate unique file name
 * @param {string} fileName - Original file name
 * @param {string} prefix - Prefix for file name
 * @returns {string} Unique file name
 */
const generateUniqueFileName = (fileName, prefix = '') => {
  const ext = getFileExtension(fileName);
  const name = getFileNameWithoutExt(fileName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const uniqueName = `${name}-${timestamp}-${random}${ext}`;
  return prefix ? `${prefix}-${uniqueName}` : uniqueName;
};

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 * @returns {boolean} Directory created or already exists
 */
const ensureDirectory = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Delete file
 * @param {string} filePath - Path to file
 * @returns {boolean} File deleted
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Read file as text
 * @param {string} filePath - Path to file
 * @returns {string|null} File content or null
 */
const readFileText = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
};

/**
 * Write text to file
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @returns {boolean} File written
 */
const writeFileText = (filePath, content) => {
  try {
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch {
    return false;
  }
};

/**
 * Copy file
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {boolean} File copied
 */
const copyFile = (sourcePath, destPath) => {
  try {
    ensureDirectory(path.dirname(destPath));
    fs.copyFileSync(sourcePath, destPath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Move file
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @returns {boolean} File moved
 */
const moveFile = (sourcePath, destPath) => {
  try {
    ensureDirectory(path.dirname(destPath));
    fs.renameSync(sourcePath, destPath);
    return true;
  } catch {
    return false;
  }
};

/**
 * List files in directory
 * @param {string} dirPath - Directory path
 * @param {boolean} recursive - Include subdirectories
 * @returns {Array<string>} List of files
 */
const listFiles = (dirPath, recursive = false) => {
  try {
    const files = fs.readdirSync(dirPath);
    const result = [];
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && recursive) {
        result.push(...listFiles(filePath, true));
      } else if (stat.isFile()) {
        result.push(filePath);
      }
    }
    
    return result;
  } catch {
    return [];
  }
};

/**
 * Get file stats
 * @param {string} filePath - Path to file
 * @returns {Object|null} File stats or null
 */
const getFileStats = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch {
    return null;
  }
};

/**
 * Get file checksum
 * @param {string} filePath - Path to file
 * @param {string} algorithm - Hash algorithm (default: 'md5')
 * @returns {string|null} File checksum or null
 */
const getFileChecksum = (filePath, algorithm = 'md5') => {
  try {
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash(algorithm);
    hash.update(content);
    return hash.digest('hex');
  } catch {
    return null;
  }
};

/**
 * Check if file is image
 * @param {string} fileName - File name
 * @returns {boolean} Is image
 */
const isImageFile = (fileName) => {
  const ext = getFileExtension(fileName);
  return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.tiff'].includes(ext);
};

/**
 * Check if file is video
 * @param {string} fileName - File name
 * @returns {boolean} Is video
 */
const isVideoFile = (fileName) => {
  const ext = getFileExtension(fileName);
  return ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm', '.m4v'].includes(ext);
};

/**
 * Check if file is document
 * @param {string} fileName - File name
 * @returns {boolean} Is document
 */
const isDocumentFile = (fileName) => {
  const ext = getFileExtension(fileName);
  return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext);
};

module.exports = {
  fileExists,
  getFileSize,
  getFileExtension,
  getFileNameWithoutExt,
  formatFileSize,
  getMimeType,
  generateUniqueFileName,
  ensureDirectory,
  deleteFile,
  readFileText,
  writeFileText,
  copyFile,
  moveFile,
  listFiles,
  getFileStats,
  getFileChecksum,
  isImageFile,
  isVideoFile,
  isDocumentFile
};