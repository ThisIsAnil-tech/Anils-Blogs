const mongoose = require('mongoose');
const crypto = require('crypto');

const SubscriberSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [50, 'Username cannot exceed 50 characters'],
      match: [/^[a-zA-Z0-9_\s]+$/, 'Username can only contain letters, numbers, underscores and spaces']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required']
    },
    deviceInfo: {
      device: {
        type: String,
        required: true
      },
      browser: {
        type: String,
        required: true
      },
      browserVersion: {
        type: String,
        required: true
      },
      os: {
        type: String,
        required: true
      },
      osVersion: String,
      userAgent: {
        type: String,
        required: true
      },
      screenResolution: String,
      language: String,
      timezone: String
    },
    location: {
      country: String,
      countryCode: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
      timezone: String
    },
    preferences: {
      categories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category'
        }
      ],
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'monthly'],
        default: 'immediate'
      },
      notificationTypes: {
        newBlog: {
          type: Boolean,
          default: true
        },
        blogUpdates: {
          type: Boolean,
          default: false
        },
        newsletters: {
          type: Boolean,
          default: true
        },
        comments: {
          type: Boolean,
          default: false
        }
      }
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'unsubscribed', 'bounced', 'spam'],
      default: 'active'
    },
    verificationToken: {
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    },
    unsubscribeToken: {
      type: String
    },
    unsubscribeReason: {
      type: String,
      enum: ['spam', 'too_many_emails', 'not_interested', 'other', ''],
      default: ''
    },
    subscriptionDate: {
      type: Date,
      default: Date.now
    },
    lastEmailSent: {
      type: Date
    },
    lastInteraction: {
      type: Date
    },
    emailOpenCount: {
      type: Number,
      default: 0
    },
    emailClickCount: {
      type: Number,
      default: 0
    },
    totalEmailsReceived: {
      type: Number,
      default: 0
    },
    bouncedEmails: {
      type: Number,
      default: 0
    },
    complaintReports: {
      type: Number,
      default: 0
    },
    referrer: {
      type: String,
      trim: true
    },
    landingPage: {
      type: String,
      trim: true
    },
    sessionId: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
SubscriberSchema.index({ email: 1 }, { unique: true, sparse: true });
SubscriberSchema.index({ ipAddress: 1 });
SubscriberSchema.index({ status: 1 });
SubscriberSchema.index({ createdAt: -1 });
SubscriberSchema.index({ 'location.country': 1 });

// Ensure either email or ip is present
SubscriberSchema.pre('validate', function (next) {
  if (!this.email && !this.ipAddress) {
    next(new Error('Either email or IP address is required'));
  }
  next();
});

// Generate verification token
SubscriberSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return token;
};

// Generate unsubscribe token
SubscriberSchema.methods.generateUnsubscribeToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.unsubscribeToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return token;
};

// Virtual for full location
SubscriberSchema.virtual('fullLocation').get(function () {
  if (!this.location) return null;
  const parts = [];
  if (this.location.city) parts.push(this.location.city);
  if (this.location.region) parts.push(this.location.region);
  if (this.location.country) parts.push(this.location.country);
  return parts.join(', ');
});

// Virtual for engagement rate
SubscriberSchema.virtual('engagementRate').get(function () {
  if (this.totalEmailsReceived === 0) return 0;
  const interactions = this.emailOpenCount + this.emailClickCount;
  return (interactions / this.totalEmailsReceived) * 100;
});

// Static method to get active subscribers
SubscriberSchema.statics.getActive = async function () {
  return this.find({ 
    status: 'active',
    isVerified: true
  }).sort({ createdAt: -1 });
};

// Static method to get subscriber stats
SubscriberSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments();
  const active = await this.countDocuments({ status: 'active', isVerified: true });
  const unverified = await this.countDocuments({ isVerified: false });

  return {
    total,
    active,
    unverified,
    stats: stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {})
  };
};

module.exports = mongoose.model('Subscriber', SubscriberSchema);