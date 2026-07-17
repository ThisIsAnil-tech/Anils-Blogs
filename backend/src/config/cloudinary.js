const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Validate Cloudinary config
const validateCloudinaryConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.warn(`⚠️ Missing Cloudinary config: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

if (!validateCloudinaryConfig()) {
  logger.warn('⚠️ Cloudinary will be disabled');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const isCloudinaryAvailable = () => {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && 
            process.env.CLOUDINARY_API_KEY && 
            process.env.CLOUDINARY_API_SECRET);
};

const uploadImage = async (file, options = {}) => {
  try {
    if (!isCloudinaryAvailable()) {
      throw new Error('Cloudinary is not configured');
    }

    if (!file) {
      throw new Error('No file provided for upload');
    }

    logger.debug(`Uploading image to Cloudinary: ${typeof file === 'string' ? file : 'buffer'}`);

    const result = await cloudinary.uploader.upload(file, {
      folder: process.env.CLOUDINARY_FOLDER || 'blogs',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
        { width: options.width || 1200, crop: 'limit' }
      ],
      ...options
    });

    logger.info(`✅ Image uploaded to Cloudinary: ${result.public_id} (${result.bytes} bytes)`);
    return result;
  } catch (error) {
    logger.error(`❌ Cloudinary upload error: ${error.message}`);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

const uploadVideo = async (file, options = {}) => {
  try {
    if (!isCloudinaryAvailable()) {
      throw new Error('Cloudinary is not configured');
    }

    if (!file) {
      throw new Error('No file provided for upload');
    }

    logger.debug(`Uploading video to Cloudinary: ${typeof file === 'string' ? file : 'buffer'}`);

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

    logger.info(`✅ Video uploaded to Cloudinary: ${result.public_id} (${result.bytes} bytes)`);
    return result;
  } catch (error) {
    logger.error(`❌ Cloudinary video upload error: ${error.message}`);
    throw new Error(`Video upload failed: ${error.message}`);
  }
};

const deleteMedia = async (publicId, resourceType = 'image') => {
  try {
    if (!isCloudinaryAvailable()) {
      throw new Error('Cloudinary is not configured');
    }

    if (!publicId) {
      throw new Error('Public ID is required for deletion');
    }

    logger.debug(`Deleting from Cloudinary: ${publicId} (${resourceType})`);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    if (result.result === 'ok') {
      logger.info(`✅ Deleted from Cloudinary: ${publicId}`);
    } else {
      logger.warn(`⚠️ Cloudinary deletion result: ${result.result} for ${publicId}`);
    }

    return result;
  } catch (error) {
    logger.error(`❌ Cloudinary delete error: ${error.message}`);
    throw new Error(`Media deletion failed: ${error.message}`);
  }
};

const getOptimizedUrl = (publicId, options = {}) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      crop: 'limit',
      secure: true,
      ...options
    });
  } catch (error) {
    logger.error(`❌ Cloudinary URL generation error: ${error.message}`);
    return null;
  }
};

const uploadBuffer = async (buffer, options = {}) => {
  try {
    if (!isCloudinaryAvailable()) {
      throw new Error('Cloudinary is not configured');
    }

    if (!buffer) {
      throw new Error('No buffer provided for upload');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || 'blogs',
          ...options
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error) {
    logger.error(`❌ Cloudinary buffer upload error: ${error.message}`);
    throw new Error(`Buffer upload failed: ${error.message}`);
  }
};

// Get Cloudinary usage statistics
const getUsage = async () => {
  try {
    if (!isCloudinaryAvailable()) {
      return null;
    }

    // Note: This requires admin API access
    const result = await cloudinary.api.usage();
    return {
      used: result.used,
      limit: result.limit,
      usagePercentage: (result.used / result.limit) * 100
    };
  } catch (error) {
    logger.error(`❌ Cloudinary usage error: ${error.message}`);
    return null;
  }
};

// Generate image transformations
const transformImage = (publicId, transformations = {}) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    return cloudinary.url(publicId, {
      transformation: [
        { width: transformations.width, height: transformations.height, crop: transformations.crop || 'limit' },
        { quality: transformations.quality || 'auto' },
        { fetch_format: transformations.format || 'auto' }
      ],
      secure: true
    });
  } catch (error) {
    logger.error(`❌ Cloudinary transform error: ${error.message}`);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  deleteMedia,
  getOptimizedUrl,
  uploadBuffer,
  getUsage,
  transformImage,
  isCloudinaryAvailable
};