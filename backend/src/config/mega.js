const mega = require('megajs');
const { Readable } = require('stream');
const logger = require('../utils/logger');

let megaStorage = null;
let blogFolder = null;

const initializeMega = async () => {
  try {
    megaStorage = new mega.Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD,
      keepalive: true
    });

    await new Promise((resolve, reject) => {
      megaStorage.on('ready', () => {
        logger.info('✅ MEGA.nz connected successfully');
        resolve();
      });
      megaStorage.on('error', (err) => {
        reject(err);
      });
    });

    // Get or create blog folder
    let folder = megaStorage.root.children.find(
      child => child.name === process.env.MEGA_BLOG_FOLDER && child.directory
    );

    if (!folder) {
      folder = await new Promise((resolve, reject) => {
        megaStorage.root.createFolder(process.env.MEGA_BLOG_FOLDER, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      logger.info(`📁 Created MEGA folder: ${process.env.MEGA_BLOG_FOLDER}`);
    }

    blogFolder = folder;
    return { megaStorage, blogFolder };
  } catch (error) {
    logger.error(`❌ MEGA.nz connection failed: ${error.message}`);
    throw error;
  }
};

const uploadBlogContent = async (blogId, title, content) => {
  try {
    const fileName = `${blogId}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    const contentBuffer = Buffer.from(content, 'utf-8');
    const readableStream = Readable.from(contentBuffer);

    const file = await new Promise((resolve, reject) => {
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

    logger.info(`📄 MEGA file uploaded: ${fileName}`);
    
    return {
      fileId: file.nodeId,
      fileName: file.name,
      size: contentBuffer.length
    };
  } catch (error) {
    logger.error(`MEGA upload error: ${error.message}`);
    throw error;
  }
};

const getBlogContent = async (fileId) => {
  try {
    const file = megaStorage.root.children.find(
      child => child.nodeId === fileId && !child.directory
    );

    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    const content = await new Promise((resolve, reject) => {
      file.download((err, data) => {
        if (err) reject(err);
        else resolve(data.toString('utf-8'));
      });
    });

    return content;
  } catch (error) {
    logger.error(`MEGA get content error: ${error.message}`);
    throw error;
  }
};

const updateBlogContent = async (fileId, content) => {
  try {
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
    }

    // Upload new content
    const contentBuffer = Buffer.from(content, 'utf-8');
    const readableStream = Readable.from(contentBuffer);
    const fileName = `updated_${Date.now()}.txt`;

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

    logger.info(`📄 MEGA file updated: ${fileName}`);
    
    return {
      fileId: newFile.nodeId,
      fileName: newFile.name,
      size: content.length
    };
  } catch (error) {
    logger.error(`MEGA update error: ${error.message}`);
    throw error;
  }
};

const deleteBlogFile = async (fileId) => {
  try {
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
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`MEGA delete error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initializeMega,
  uploadBlogContent,
  getBlogContent,
  updateBlogContent,
  deleteBlogFile
};