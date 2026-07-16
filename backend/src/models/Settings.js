const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'My Blog'
    },
    siteDescription: {
      type: String,
      default: 'A blog management system'
    },
    siteKeywords: {
      type: String,
      default: 'blog, cms, content management'
    },
    siteLogo: {
      type: String,
      default: null
    },
    siteFavicon: {
      type: String,
      default: null
    },
    siteFooterText: {
      type: String,
      default: 'All rights reserved'
    },
    siteTimezone: {
      type: String,
      default: 'UTC'
    },
    siteLocale: {
      type: String,
      default: 'en'
    },
    social: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String,
      github: String,
      pinterest: String,
      tiktok: String,
      snapchat: String,
      socialSharingEnabled: {
        type: Boolean,
        default: true
      }
    },
    email: {
      smtpHost: String,
      smtpPort: Number,
      smtpUser: String,
      smtpPassword: String,
      smtpSecure: {
        type: Boolean,
        default: false
      },
      fromEmail: String,
      fromName: String,
      replyToEmail: String,
      emailVerificationEnabled: {
        type: Boolean,
        default: true
      },
      notificationsEnabled: {
        type: Boolean,
        default: true
      }
    },
    security: {
      jwtSecret: String,
      jwtExpiresIn: {
        type: String,
        default: '30d'
      },
      rateLimitWindow: {
        type: Number,
        default: 15
      },
      rateLimitMax: {
        type: Number,
        default: 100
      },
      corsEnabled: {
        type: Boolean,
        default: true
      },
      corsOrigins: [String],
      helmetEnabled: {
        type: Boolean,
        default: true
      },
      compressionEnabled: {
        type: Boolean,
        default: true
      },
      sessionTimeout: {
        type: Number,
        default: 3600
      },
      maxLoginAttempts: {
        type: Number,
        default: 5
      },
      lockoutDuration: {
        type: Number,
        default: 30
      }
    },
    analytics: {
      googleAnalyticsId: String,
      facebookPixelId: String,
      hotjarId: String,
      analyticsEnabled: {
        type: Boolean,
        default: true
      },
      ipTrackingEnabled: {
        type: Boolean,
        default: true
      },
      sessionTrackingEnabled: {
        type: Boolean,
        default: true
      },
      anonymizeIP: {
        type: Boolean,
        default: false
      },
      dataRetentionDays: {
        type: Number,
        default: 365
      }
    },
    backup: {
      backupEnabled: {
        type: Boolean,
        default: false
      },
      backupFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly'
      },
      backupTime: {
        type: String,
        default: '00:00'
      },
      backupRetention: {
        type: Number,
        default: 30
      },
      backupLocation: {
        type: String,
        default: './backups/database'
      },
      backupStorage: {
        type: String,
        enum: ['local', 'cloud', 'both'],
        default: 'local'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settings', SettingsSchema);