const mega = require('megajs');
const { Readable } = require('stream');
const logger = require('../utils/logger');

let megaStorage = null;
let blogFolder = null;
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

const initializeMega = async () => {
  try {
    const email = process.env.MEGA_EMAIL;
    const password = process.env.MEGA_PASSWORD;

    if (!email || !password) {
      logger.warn('MEGA.nz credentials not provided. MEGA features disabled.');
      return null;
    }

    if (isConnected && megaStorage) {
      logger.debug('MEGA.nz already connected');
      return { megaStorage, blogFolder };
    }

    if (connectionAttempts >= MAX_RETRIES) {
      logger.warn(`MEGA.nz connection failed after ${MAX_RETRIES} attempts. Disabling MEGA features.`);
      return null;
    }

    connectionAttempts++;
    logger.info(`📡 Connecting to MEGA.nz... (attempt ${connectionAttempts})`);

    megaStorage = new mega.Storage({
      email: email,
      password: password,
      keepalive: true,
      autologin: true
    });

    // Wait for ready event with timeout
    const readyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MEGA.nz connection timeout after 30 seconds'));
      }, 30000);

      megaStorage.on('ready', () => {
        clearTimeout(timeout);
        logger.info('✅ MEGA.nz connected successfully');
        isConnected = true;
        connectionAttempts = 0;
        resolve();
      });

      megaStorage.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    await readyPromise;

    // Get or create blog folder
    const folderName = process.env.MEGA_BLOG_FOLDER || 'blogs';
    
    let folder = megaStorage.root.children.find(
      child => child.name === folderName && child.directory
    );

    if (!folder) {
      logger.info(`📁 Creating MEGA folder: ${folderName}`);
      folder = await new Promise((resolve, reject) => {
        megaStorage.root.createFolder(folderName, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      logger.info(`📁 Created MEGA folder: ${folderName}`);
    }

    blogFolder = folder;
    logger.info(`✅ MEGA folder ready: ${folderName} (${blogFolder.nodeId})`);
    
    return { megaStorage, blogFolder };
  } catch (error) {
    logger.error(`❌ MEGA.nz connection failed: ${error.message}`);
    isConnected = false;
    
    if (connectionAttempts < MAX_RETRIES) {
      logger.info(`Retrying MEGA.nz connection in 5 seconds... (${connectionAttempts}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return initializeMega();
    }
    
    return null;
  }
};

// Check if MEGA is available
const isMegaAvailable = () => {
  return isConnected && megaStorage && blogFolder;
};

const uploadBlogContent = async (blogId, title, content) => {
  try {
    if (!isMegaAvailable()) {
      throw new Error('MEGA.nz is not available');
    }

    const fileName = `${blogId}_${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.txt`;
    const contentBuffer = Buffer.from(content, 'utf-8');
    const readableStream = Readable.from(contentBuffer);

    logger.info(`📤 Uploading to MEGA: ${fileName} (${contentBuffer.length} bytes)`);

    const file = await new Promise((resolve, reject) => {
      const uploadStream = blogFolder.upload(
        {
          name: fileName,
          size: contentBuffer.length
        },
        readableStream,
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );

      // Handle upload errors
      uploadStream.on('error', (err) => {
        reject(err);
      });
    });

    if (!file || !file.nodeId) {
      throw new Error('Upload failed - no file ID returned');
    }

    logger.info(`📄 MEGA file uploaded: ${fileName} (ID: ${file.nodeId})`);
    
    return {
      fileId: file.nodeId,
      fileName: file.name || fileName,
      size: contentBuffer.length
    };
  } catch (error) {
    logger.error(`❌ MEGA upload error: ${error.message}`);
    throw new Error(`MEGA upload failed: ${error.message}`);
  }
};

const getBlogContent = async (fileId) => {
  try {
    if (!isMegaAvailable()) {
      throw new Error('MEGA.nz is not available');
    }

    if (!fileId) {
      throw new Error('File ID is required');
    }

    const file = megaStorage.root.children.find(
      child => child.nodeId === fileId && !child.directory
    );

    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    logger.debug(`📥 Downloading from MEGA: ${file.name || fileId}`);

    const content = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Download timeout after 30 seconds'));
      }, 30000);

      file.download((err, data) => {
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve(data.toString('utf-8'));
      });
    });

    logger.debug(`📄 MEGA content downloaded: ${content.length} bytes`);
    return content;
  } catch (error) {
    logger.error(`❌ MEGA get content error: ${error.message}`);
    throw new Error(`MEGA get content failed: ${error.message}`);
  }
};

const updateBlogContent = async (fileId, content) => {
  try {
    if (!isMegaAvailable()) {
      throw new Error('MEGA.nz is not available');
    }

    // Delete old file
    const file = megaStorage.root.children.find(
      child => child.nodeId === fileId && !child.directory
    );

    if (file) {
      await new Promise((resolve, reject) => {
        file.delete((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info(`🗑️ MEGA file deleted: ${file.name}`);
    }

    // Upload new content
    const fileName = `updated_${Date.now()}.txt`;
    const contentBuffer = Buffer.from(content, 'utf-8');
    const readableStream = Readable.from(contentBuffer);

    const newFile = await new Promise((resolve, reject) => {
      blogFolder.upload(
        {
          name: fileName,
          size: contentBuffer.length
        },
        readableStream,
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    logger.info(`📄 MEGA file updated: ${fileName} (ID: ${newFile.nodeId})`);
    
    return {
      fileId: newFile.nodeId,
      fileName: newFile.name || fileName,
      size: content.length
    };
  } catch (error) {
    logger.error(`❌ MEGA update error: ${error.message}`);
    throw new Error(`MEGA update failed: ${error.message}`);
  }
};

const deleteBlogFile = async (fileId) => {
  try {
    if (!isMegaAvailable()) {
      logger.warn('MEGA.nz not available. Cannot delete file.');
      return false;
    }

    if (!fileId) {
      logger.warn('File ID is required for deletion');
      return false;
    }

    const file = megaStorage.root.children.find(
      child => child.nodeId === fileId && !child.directory
    );

    if (!file) {
      logger.warn(`File with ID ${fileId} not found`);
      return false;
    }

    await new Promise((resolve, reject) => {
      file.delete((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info(`🗑️ MEGA file deleted: ${file.name || fileId}`);
    return true;
  } catch (error) {
    logger.error(`❌ MEGA delete error: ${error.message}`);
    return false;
  }
};

// List files in blog folder
const listBlogFiles = async () => {
  try {
    if (!isMegaAvailable()) {
      throw new Error('MEGA.nz is not available');
    }

    const files = blogFolder.children
      .filter(child => !child.directory)
      .map(child => ({
        id: child.nodeId,
        name: child.name,
        size: child.size,
        created: child.created,
        modified: child.modified
      }));

    return files;
  } catch (error) {
    logger.error(`❌ MEGA list files error: ${error.message}`);
    return [];
  }
};

// Get storage usage
const getStorageUsage = async () => {
  try {
    if (!isMegaAvailable()) {
      throw new Error('MEGA.nz is not available');
    }

    const account = megaStorage.account;
    return {
      used: account.used,
      total: account.total,
      percentage: (account.used / account.total) * 100
    };
  } catch (error) {
    logger.error(`❌ MEGA storage usage error: ${error.message}`);
    return null;
  }
};

module.exports = {
  initializeMega,
  uploadBlogContent,
  getBlogContent,
  updateBlogContent,
  deleteBlogFile,
  listBlogFiles,
  getStorageUsage,
  isMegaAvailable
};