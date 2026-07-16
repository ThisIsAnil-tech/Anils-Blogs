const mongoose = require('mongoose');

const ShareSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: [true, 'Blog reference is required']
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required']
    },
    deviceInfo: {
      type: String,
      default: 'Unknown'
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    },
    platform: {
      type: String,
      enum: ['facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'direct', 'other'],
      default: 'direct'
    },
    location: {
      country: String,
      city: String
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    referrer: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
ShareSchema.index({ blog: 1, ipAddress: 1 }, { unique: true });
ShareSchema.index({ blog: 1 });
ShareSchema.index({ ipAddress: 1 });
ShareSchema.index({ sharedAt: -1 });
ShareSchema.index({ platform: 1 });

// Virtual for blog data
ShareSchema.virtual('blogData', {
  ref: 'Blog',
  localField: 'blog',
  foreignField: '_id',
  justOne: true
});

// Static method to get blog share count
ShareSchema.statics.getBlogShareCount = async function (blogId) {
  return this.countDocuments({ blog: blogId });
};

// Static method to check if IP shared blog
ShareSchema.statics.hasShared = async function (blogId, ipAddress) {
  const share = await this.findOne({ blog: blogId, ipAddress });
  return !!share;
};

// Static method to get shares by platform
ShareSchema.statics.getSharesByPlatform = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        sharedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$platform',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get shares analytics
ShareSchema.statics.getAnalytics = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        sharedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$sharedAt' } },
          platform: '$platform'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        platforms: {
          $push: {
            platform: '$_id.platform',
            count: '$count'
          }
        },
        totalShares: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Share', ShareSchema);