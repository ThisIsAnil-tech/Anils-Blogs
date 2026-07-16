const { body, param, query } = require('express-validator');

/**
 * General settings validation
 */
const generalSettingsValidator = [
  body('siteName')
    .optional()
    .isString().withMessage('Site name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Site name must be between 2 and 100 characters'),
  
  body('siteDescription')
    .optional()
    .isString().withMessage('Site description must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Site description cannot exceed 200 characters'),
  
  body('siteKeywords')
    .optional()
    .isString().withMessage('Site keywords must be a string')
    .trim()
    .isLength({ max: 200 }).withMessage('Site keywords cannot exceed 200 characters'),
  
  body('siteLogo')
    .optional()
    .isURL().withMessage('Site logo must be a valid URL'),
  
  body('siteFavicon')
    .optional()
    .isURL().withMessage('Site favicon must be a valid URL'),
  
  body('siteFooterText')
    .optional()
    .isString().withMessage('Site footer text must be a string')
    .trim(),
  
  body('siteTimezone')
    .optional()
    .isString().withMessage('Site timezone must be a string')
    .trim(),
  
  body('siteLocale')
    .optional()
    .isString().withMessage('Site locale must be a string')
    .trim()
    .isLength({ min: 2, max: 5 }).withMessage('Site locale must be between 2 and 5 characters')
];

/**
 * Social settings validation
 */
const socialSettingsValidator = [
  body('facebook')
    .optional()
    .isURL().withMessage('Facebook URL must be valid')
    .trim(),
  
  body('twitter')
    .optional()
    .isURL().withMessage('Twitter URL must be valid')
    .trim(),
  
  body('instagram')
    .optional()
    .isURL().withMessage('Instagram URL must be valid')
    .trim(),
  
  body('linkedin')
    .optional()
    .isURL().withMessage('LinkedIn URL must be valid')
    .trim(),
  
  body('youtube')
    .optional()
    .isURL().withMessage('YouTube URL must be valid')
    .trim(),
  
  body('github')
    .optional()
    .isURL().withMessage('GitHub URL must be valid')
    .trim(),
  
  body('pinterest')
    .optional()
    .isURL().withMessage('Pinterest URL must be valid')
    .trim(),
  
  body('tiktok')
    .optional()
    .isURL().withMessage('TikTok URL must be valid')
    .trim(),
  
  body('snapchat')
    .optional()
    .isURL().withMessage('Snapchat URL must be valid')
    .trim(),
  
  body('socialSharingEnabled')
    .optional()
    .isBoolean().withMessage('Social sharing enabled must be a boolean')
];

/**
 * Email settings validation
 */
const emailSettingsValidator = [
  body('smtpHost')
    .optional()
    .isString().withMessage('SMTP host must be a string')
    .trim(),
  
  body('smtpPort')
    .optional()
    .isInt({ min: 1, max: 65535 }).withMessage('SMTP port must be between 1 and 65535')
    .toInt(),
  
  body('smtpUser')
    .optional()
    .isString().withMessage('SMTP user must be a string')
    .trim(),
  
  body('smtpPassword')
    .optional()
    .isString().withMessage('SMTP password must be a string'),
  
  body('smtpSecure')
    .optional()
    .isBoolean().withMessage('SMTP secure must be a boolean'),
  
  body('fromEmail')
    .optional()
    .isEmail().withMessage('From email must be a valid email address')
    .normalizeEmail(),
  
  body('fromName')
    .optional()
    .isString().withMessage('From name must be a string')
    .trim()
    .isLength({ max: 100 }).withMessage('From name cannot exceed 100 characters'),
  
  body('replyToEmail')
    .optional()
    .isEmail().withMessage('Reply to email must be a valid email address')
    .normalizeEmail(),
  
  body('emailVerificationEnabled')
    .optional()
    .isBoolean().withMessage('Email verification enabled must be a boolean'),
  
  body('notificationsEnabled')
    .optional()
    .isBoolean().withMessage('Notifications enabled must be a boolean')
];

/**
 * Security settings validation
 */
const securitySettingsValidator = [
  body('jwtSecret')
    .optional()
    .isString().withMessage('JWT secret must be a string')
    .isLength({ min: 32 }).withMessage('JWT secret must be at least 32 characters'),
  
  body('jwtExpiresIn')
    .optional()
    .isString().withMessage('JWT expires in must be a string')
    .matches(/^\d+[dhm]$/).withMessage('JWT expires in must be in format: 1d, 2h, 30m'),
  
  body('rateLimitWindow')
    .optional()
    .isInt({ min: 1 }).withMessage('Rate limit window must be a positive integer')
    .toInt(),
  
  body('rateLimitMax')
    .optional()
    .isInt({ min: 1 }).withMessage('Rate limit max must be a positive integer')
    .toInt(),
  
  body('corsEnabled')
    .optional()
    .isBoolean().withMessage('CORS enabled must be a boolean'),
  
  body('corsOrigins')
    .optional()
    .isArray().withMessage('CORS origins must be an array'),
  
  body('corsOrigins.*')
    .optional()
    .isString().withMessage('CORS origin must be a string')
    .trim(),
  
  body('helmetEnabled')
    .optional()
    .isBoolean().withMessage('Helmet enabled must be a boolean'),
  
  body('compressionEnabled')
    .optional()
    .isBoolean().withMessage('Compression enabled must be a boolean'),
  
  body('sessionTimeout')
    .optional()
    .isInt({ min: 1 }).withMessage('Session timeout must be a positive integer')
    .toInt(),
  
  body('maxLoginAttempts')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Max login attempts must be between 1 and 10')
    .toInt(),
  
  body('lockoutDuration')
    .optional()
    .isInt({ min: 1 }).withMessage('Lockout duration must be a positive integer')
    .toInt()
];

/**
 * Analytics settings validation
 */
const analyticsSettingsValidator = [
  body('googleAnalyticsId')
    .optional()
    .isString().withMessage('Google Analytics ID must be a string')
    .trim()
    .matches(/^(UA-\d+-\d+|G-[A-Z0-9]+)$/).withMessage('Invalid Google Analytics ID'),
  
  body('facebookPixelId')
    .optional()
    .isString().withMessage('Facebook Pixel ID must be a string')
    .trim()
    .matches(/^\d+$/).withMessage('Invalid Facebook Pixel ID'),
  
  body('hotjarId')
    .optional()
    .isString().withMessage('Hotjar ID must be a string')
    .trim()
    .matches(/^\d+$/).withMessage('Invalid Hotjar ID'),
  
  body('analyticsEnabled')
    .optional()
    .isBoolean().withMessage('Analytics enabled must be a boolean'),
  
  body('ipTrackingEnabled')
    .optional()
    .isBoolean().withMessage('IP tracking enabled must be a boolean'),
  
  body('sessionTrackingEnabled')
    .optional()
    .isBoolean().withMessage('Session tracking enabled must be a boolean'),
  
  body('anonymizeIP')
    .optional()
    .isBoolean().withMessage('Anonymize IP must be a boolean'),
  
  body('dataRetentionDays')
    .optional()
    .isInt({ min: 1 }).withMessage('Data retention days must be a positive integer')
    .toInt()
];

/**
 * Backup settings validation
 */
const backupSettingsValidator = [
  body('backupEnabled')
    .optional()
    .isBoolean().withMessage('Backup enabled must be a boolean'),
  
  body('backupFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid backup frequency'),
  
  body('backupTime')
    .optional()
    .isString().withMessage('Backup time must be a string')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid backup time format (HH:MM)'),
  
  body('backupRetention')
    .optional()
    .isInt({ min: 1 }).withMessage('Backup retention must be a positive integer')
    .toInt(),
  
  body('backupLocation')
    .optional()
    .isString().withMessage('Backup location must be a string')
    .trim(),
  
  body('backupStorage')
    .optional()
    .isIn(['local', 'cloud', 'both']).withMessage('Invalid backup storage option')
];

module.exports = {
  generalSettingsValidator,
  socialSettingsValidator,
  emailSettingsValidator,
  securitySettingsValidator,
  analyticsSettingsValidator,
  backupSettingsValidator
};