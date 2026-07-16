const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploadImage = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: process.env.CLOUDINARY_FOLDER || 'blogs',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { width: options.width || 1200, crop: 'limit' }
      ],
      ...options
    });
    return result;
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    throw error;
  }
};

const uploadVideo = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'video',
      folder: process.env.CLOUDINARY_FOLDER || 'blogs',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
        { width: options.width || 1920, crop: 'limit' }
      ],
      ...options
    });
    return result;
  } catch (error) {
    logger.error(`Cloudinary video upload error: ${error.message}`);
    throw error;
  }
};

const deleteMedia = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`);
    throw error;
  }
};

const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    crop: 'limit',
    ...options
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  deleteMedia,
  getOptimizedUrl
};