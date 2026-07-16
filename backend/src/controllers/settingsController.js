const Settings = require('../models/Settings');
const { sendApiResponse } = require('../utils/helpers/apiResponse');
const logger = require('../utils/logger');

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({});
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
    const settings = await Settings.findOne().select('social');
    
    sendApiResponse(res, 200, true, 'Social settings fetched', settings?.social || {});
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

    const { facebook, twitter, instagram, linkedin, youtube, github, pinterest, tiktok, snapchat, socialSharingEnabled } = req.body;

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
      socialSharingEnabled
    };

    await settings.save();

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
    const settings = await Settings.findOne().select('email');
    
    sendApiResponse(res, 200, true, 'Email settings fetched', settings?.email || {});
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
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      fromEmail,
      fromName,
      replyToEmail,
      emailVerificationEnabled,
      notificationsEnabled
    };

    await settings.save();

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
    const settings = await Settings.findOne().select('security');
    
    sendApiResponse(res, 200, true, 'Security settings fetched', settings?.security || {});
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
    };

    await settings.save();

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
    const settings = await Settings.findOne().select('analytics');
    
    sendApiResponse(res, 200, true, 'Analytics settings fetched', settings?.analytics || {});
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
      analyticsEnabled,
      ipTrackingEnabled,
      sessionTrackingEnabled,
      anonymizeIP,
      dataRetentionDays
    };

    await settings.save();

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
    const settings = await Settings.findOne().select('backup');
    
    sendApiResponse(res, 200, true, 'Backup settings fetched', settings?.backup || {});
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
      backupEnabled,
      backupFrequency,
      backupTime,
      backupRetention,
      backupLocation,
      backupStorage
    };

    await settings.save();

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