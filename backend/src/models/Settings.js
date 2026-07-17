const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'My Blog',
      trim: true,
      maxlength: 100
    },
    siteDescription: {
      type: String,
      default: 'A blog management system',
      trim: true,
      maxlength: 200
    },
    siteKeywords: {
      type: String,
      default: 'blog, cms, content management',
      trim: true
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
      default: 'All rights reserved',
      trim: true
    },
    siteTimezone: {
      type: String,
      default: 'UTC'
    },
    siteLocale: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar']
    },
    social: {
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      youtube: { type: String, trim: true },
      github: { type: String, trim: true },
      pinterest: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      snapchat: { type: String, trim: true },
      socialSharingEnabled: {
        type: Boolean,
        default: true
      }
    },
    email: {
      smtpHost: { type: String, trim: true },
      smtpPort: { type: Number, min: 1, max: 65535 },
      smtpUser: { type: String, trim: true },
      smtpPassword: { type: String },
      smtpSecure: {
        type: Boolean,
        default: false
      },
      fromEmail: { type: String, trim: true, lowercase: true },
      fromName: { type: String, trim: true, maxlength: 100 },
      replyToEmail: { type: String, trim: true, lowercase: true },
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
      jwtSecret: { type: String },
      jwtExpiresIn: {
        type: String,
        default: '30d',
        enum: ['1d', '7d', '15d', '30d', '60d', '90d']
      },
      rateLimitWindow: {
        type: Number,
        default: 15,
        min: 1,
        max: 60
      },
      rateLimitMax: {
        type: Number,
        default: 100,
        min: 1,
        max: 1000
      },
      corsEnabled: {
        type: Boolean,
        default: true
      },
      corsOrigins: {
        type: [String],
        default: []
      },
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
        default: 3600,
        min: 60,
        max: 86400
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        min: 1,
        max: 10
      },
      lockoutDuration: {
        type: Number,
        default: 30,
        min: 1,
        max: 60
      }
    },
    analytics: {
      googleAnalyticsId: { type: String, trim: true },
      facebookPixelId: { type: String, trim: true },
      hotjarId: { type: String, trim: true },
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
        default: 365,
        min: 1,
        max: 730
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
        default: '00:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      backupRetention: {
        type: Number,
        default: 30,
        min: 1,
        max: 365
      },
      backupLocation: {
        type: String,
        default: './backups/database',
        trim: true
      },
      backupStorage: {
        type: String,
        enum: ['local', 'cloud', 'both'],
        default: 'local'
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full site URL
SettingsSchema.virtual('siteUrl').get(function() {
  return process.env.APP_URL || 'http://localhost:5000';
});

// Virtual for social links array
SettingsSchema.virtual('socialLinks').get(function() {
  const links = [];
  const social = this.social || {};
  
  Object.entries(social).forEach(([key, value]) => {
    if (key !== 'socialSharingEnabled' && value) {
      links.push({ platform: key, url: value });
    }
  });
  
  return links;
});

// Virtual for active social platforms
SettingsSchema.virtual('activeSocialPlatforms').get(function() {
  const platforms = [];
  const social = this.social || {};
  
  Object.entries(social).forEach(([key, value]) => {
    if (key !== 'socialSharingEnabled' && value) {
      platforms.push(key);
    }
  });
  
  return platforms;
});

// Method to get security headers
SettingsSchema.methods.getSecurityHeaders = function() {
  const security = this.security || {};
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': security.helmetEnabled ? 'max-age=31536000; includeSubDomains' : null,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
};

// Method to get CORS configuration
SettingsSchema.methods.getCorsConfig = function() {
  const security = this.security || {};
  if (!security.corsEnabled) {
    return { origin: false };
  }
  
  return {
    origin: security.corsOrigins && security.corsOrigins.length > 0 
      ? security.corsOrigins 
      : '*',
    credentials: true,
    maxAge: 86400
  };
};

// Static method to get default settings
SettingsSchema.statics.getDefaults = function() {
  return {
    siteName: 'My Blog',
    siteDescription: 'A blog management system',
    siteKeywords: 'blog, cms, content management',
    siteFooterText: 'All rights reserved',
    siteTimezone: 'UTC',
    siteLocale: 'en',
    social: {
      socialSharingEnabled: true
    },
    email: {
      smtpSecure: false,
      emailVerificationEnabled: true,
      notificationsEnabled: true
    },
    security: {
      jwtExpiresIn: '30d',
      rateLimitWindow: 15,
      rateLimitMax: 100,
      corsEnabled: true,
      helmetEnabled: true,
      compressionEnabled: true,
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      lockoutDuration: 30
    },
    analytics: {
      analyticsEnabled: true,
      ipTrackingEnabled: true,
      sessionTrackingEnabled: true,
      anonymizeIP: false,
      dataRetentionDays: 365
    },
    backup: {
      backupEnabled: false,
      backupFrequency: 'weekly',
      backupTime: '00:00',
      backupRetention: 30,
      backupLocation: './backups/database',
      backupStorage: 'local'
    }
  };
};

// Static method to get settings with validation
SettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema);