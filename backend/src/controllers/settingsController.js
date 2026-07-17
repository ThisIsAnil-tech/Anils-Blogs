const Settings = require('../models/Settings');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');
const { cache } = require('../config/redis');

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res, next) => {
  try {
    // Try cache first
    const cacheKey = 'settings:all';
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Settings fetched successfully (cached)', cached);
      }
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({});
      logger.info('Default settings created');
    }

    // Cache for 1 hour
    if (cache.isEnabled()) {
      await cache.set(cacheKey, settings, 3600);
    }

    sendApiResponse(res, 200, true, 'Settings fetched successfully', settings);
  } catch (error) {
    logger.error(`Get settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    const {
      siteName,
      siteDescription,
      siteKeywords,
      siteLogo,
      siteFavicon,
      siteFooterText,
      siteTimezone,
      siteLocale
    } = req.body;

    if (siteName) settings.siteName = siteName;
    if (siteDescription !== undefined) settings.siteDescription = siteDescription;
    if (siteKeywords !== undefined) settings.siteKeywords = siteKeywords;
    if (siteLogo) settings.siteLogo = siteLogo;
    if (siteFavicon) settings.siteFavicon = siteFavicon;
    if (siteFooterText !== undefined) settings.siteFooterText = siteFooterText;
    if (siteTimezone) settings.siteTimezone = siteTimezone;
    if (siteLocale) settings.siteLocale = siteLocale;

    await settings.save();

    // Clear cache
    if (cache.isEnabled()) {
      await cache.del('settings:all');
    }

    logger.info(`Settings updated by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Settings updated successfully', settings);
  } catch (error) {
    logger.error(`Update settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Get social settings
// @route   GET /api/admin/settings/social
// @access  Private/Admin
const getSocialSettings = async (req, res, next) => {
  try {
    const cacheKey = 'settings:social';
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Social settings fetched (cached)', cached);
      }
    }

    const settings = await Settings.findOne().select('social');
    const result = settings?.social || {};
    
    if (cache.isEnabled()) {
      await cache.set(cacheKey, result, 3600);
    }

    sendApiResponse(res, 200, true, 'Social settings fetched', result);
  } catch (error) {
    logger.error(`Get social settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Update social settings
// @route   PUT /api/admin/settings/social
// @access  Private/Admin
const updateSocialSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    const { 
      facebook, 
      twitter, 
      instagram, 
      linkedin, 
      youtube, 
      github, 
      pinterest, 
      tiktok, 
      snapchat, 
      socialSharingEnabled 
    } = req.body;

    settings.social = {
      facebook,
      twitter,
      instagram,
      linkedin,
      youtube,
      github,
      pinterest,
      tiktok,
      snapchat,
      socialSharingEnabled: socialSharingEnabled !== undefined ? socialSharingEnabled : true
    };

    await settings.save();

    // Clear cache
    if (cache.isEnabled()) {
      await cache.del('settings:social');
      await cache.del('settings:all');
    }

    logger.info(`Social settings updated by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Social settings updated successfully', settings.social);
  } catch (error) {
    logger.error(`Update social settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Get email settings
// @route   GET /api/admin/settings/email
// @access  Private/Admin
const getEmailSettings = async (req, res, next) => {
  try {
    const cacheKey = 'settings:email';
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Email settings fetched (cached)', cached);
      }
    }

    const settings = await Settings.findOne().select('email');
    const result = settings?.email || {};
    
    if (cache.isEnabled()) {
      await cache.set(cacheKey, result, 3600);
    }

    sendApiResponse(res, 200, true, 'Email settings fetched', result);
  } catch (error) {
    logger.error(`Get email settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Update email settings
// @route   PUT /api/admin/settings/email
// @access  Private/Admin
const updateEmailSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      fromEmail,
      fromName,
      replyToEmail,
      emailVerificationEnabled,
      notificationsEnabled
    } = req.body;

    settings.email = {
      smtpHost,
      smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
      smtpUser,
      smtpPassword,
      smtpSecure: smtpSecure !== undefined ? smtpSecure : false,
      fromEmail,
      fromName,
      replyToEmail,
      emailVerificationEnabled: emailVerificationEnabled !== undefined ? emailVerificationEnabled : true,
      notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true
    };

    await settings.save();

    if (cache.isEnabled()) {
      await cache.del('settings:email');
      await cache.del('settings:all');
    }

    logger.info(`Email settings updated by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Email settings updated successfully', settings.email);
  } catch (error) {
    logger.error(`Update email settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Get security settings
// @route   GET /api/admin/settings/security
// @access  Private/Admin
const getSecuritySettings = async (req, res, next) => {
  try {
    const cacheKey = 'settings:security';
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Security settings fetched (cached)', cached);
      }
    }

    const settings = await Settings.findOne().select('security');
    const result = settings?.security || {};
    
    if (cache.isEnabled()) {
      await cache.set(cacheKey, result, 3600);
    }

    sendApiResponse(res, 200, true, 'Security settings fetched', result);
  } catch (error) {
    logger.error(`Get security settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Update security settings
// @route   PUT /api/admin/settings/security
// @access  Private/Admin
const updateSecuritySettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    const {
      jwtSecret,
      jwtExpiresIn,
      rateLimitWindow,
      rateLimitMax,
      corsEnabled,
      corsOrigins,
      helmetEnabled,
      compressionEnabled,
      sessionTimeout,
      maxLoginAttempts,
      lockoutDuration
    } = req.body;

    settings.security = {
      jwtSecret,
      jwtExpiresIn: jwtExpiresIn || '30d',
      rateLimitWindow: rateLimitWindow ? parseInt(rateLimitWindow) : 15,
      rateLimitMax: rateLimitMax ? parseInt(rateLimitMax) : 100,
      corsEnabled: corsEnabled !== undefined ? corsEnabled : true,
      corsOrigins: corsOrigins || [],
      helmetEnabled: helmetEnabled !== undefined ? helmetEnabled : true,
      compressionEnabled: compressionEnabled !== undefined ? compressionEnabled : true,
      sessionTimeout: sessionTimeout ? parseInt(sessionTimeout) : 3600,
      maxLoginAttempts: maxLoginAttempts ? parseInt(maxLoginAttempts) : 5,
      lockoutDuration: lockoutDuration ? parseInt(lockoutDuration) : 30
    };

    await settings.save();

    if (cache.isEnabled()) {
      await cache.del('settings:security');
      await cache.del('settings:all');
    }

    logger.info(`Security settings updated by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Security settings updated successfully', settings.security);
  } catch (error) {
    logger.error(`Update security settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Get analytics settings
// @route   GET /api/admin/settings/analytics
// @access  Private/Admin
const getAnalyticsSettings = async (req, res, next) => {
  try {
    const cacheKey = 'settings:analytics';
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Analytics settings fetched (cached)', cached);
      }
    }

    const settings = await Settings.findOne().select('analytics');
    const result = settings?.analytics || {};
    
    if (cache.isEnabled()) {
      await cache.set(cacheKey, result, 3600);
    }

    sendApiResponse(res, 200, true, 'Analytics settings fetched', result);
  } catch (error) {
    logger.error(`Get analytics settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Update analytics settings
// @route   PUT /api/admin/settings/analytics
// @access  Private/Admin
const updateAnalyticsSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    const {
      googleAnalyticsId,
      facebookPixelId,
      hotjarId,
      analyticsEnabled,
      ipTrackingEnabled,
      sessionTrackingEnabled,
      anonymizeIP,
      dataRetentionDays
    } = req.body;

    settings.analytics = {
      googleAnalyticsId,
      facebookPixelId,
      hotjarId,
      analyticsEnabled: analyticsEnabled !== undefined ? analyticsEnabled : true,
      ipTrackingEnabled: ipTrackingEnabled !== undefined ? ipTrackingEnabled : true,
      sessionTrackingEnabled: sessionTrackingEnabled !== undefined ? sessionTrackingEnabled : true,
      anonymizeIP: anonymizeIP !== undefined ? anonymizeIP : false,
      dataRetentionDays: dataRetentionDays ? parseInt(dataRetentionDays) : 365
    };

    await settings.save();

    if (cache.isEnabled()) {
      await cache.del('settings:analytics');
      await cache.del('settings:all');
    }

    logger.info(`Analytics settings updated by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Analytics settings updated successfully', settings.analytics);
  } catch (error) {
    logger.error(`Update analytics settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Get backup settings
// @route   GET /api/admin/settings/backup
// @access  Private/Admin
const getBackupSettings = async (req, res, next) => {
  try {
    const cacheKey = 'settings:backup';
    if (cache.isEnabled()) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return sendApiResponse(res, 200, true, 'Backup settings fetched (cached)', cached);
      }
    }

    const settings = await Settings.findOne().select('backup');
    const result = settings?.backup || {};
    
    if (cache.isEnabled()) {
      await cache.set(cacheKey, result, 3600);
    }

    sendApiResponse(res, 200, true, 'Backup settings fetched', result);
  } catch (error) {
    logger.error(`Get backup settings error: ${error.message}`);
    next(error);
  }
};

// @desc    Update backup settings
// @route   PUT /api/admin/settings/backup
// @access  Private/Admin
const updateBackupSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    const {
      backupEnabled,
      backupFrequency,
      backupTime,
      backupRetention,
      backupLocation,
      backupStorage
    } = req.body;

    settings.backup = {
      backupEnabled: backupEnabled !== undefined ? backupEnabled : false,
      backupFrequency: backupFrequency || 'weekly',
      backupTime: backupTime || '00:00',
      backupRetention: backupRetention ? parseInt(backupRetention) : 30,
      backupLocation: backupLocation || './backups/database',
      backupStorage: backupStorage || 'local'
    };

    await settings.save();

    if (cache.isEnabled()) {
      await cache.del('settings:backup');
      await cache.del('settings:all');
    }

    logger.info(`Backup settings updated by ${req.user.username}`);
    sendApiResponse(res, 200, true, 'Backup settings updated successfully', settings.backup);
  } catch (error) {
    logger.error(`Update backup settings error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSocialSettings,
  updateSocialSettings,
  getEmailSettings,
  updateEmailSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getAnalyticsSettings,
  updateAnalyticsSettings,
  getBackupSettings,
  updateBackupSettings
};