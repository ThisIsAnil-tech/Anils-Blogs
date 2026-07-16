const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema(
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
    location: {
      country: String,
      city: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
LikeSchema.index({ blog: 1, ipAddress: 1 }, { unique: true });
LikeSchema.index({ blog: 1 });
LikeSchema.index({ ipAddress: 1 });
LikeSchema.index({ createdAt: -1 });

// Virtual for blog data
LikeSchema.virtual('blogData', {
  ref: 'Blog',
  localField: 'blog',
  foreignField: '_id',
  justOne: true
});

// Static method to get blog like count
LikeSchema.statics.getBlogLikeCount = async function (blogId) {
  return this.countDocuments({ blog: blogId });
};

// Static method to check if IP liked blog
LikeSchema.statics.hasLiked = async function (blogId, ipAddress) {
  const like = await this.findOne({ blog: blogId, ipAddress });
  return !!like;
};

// Static method to get likes analytics
LikeSchema.statics.getAnalytics = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          blog: '$blog'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        totalLikes: { $sum: '$count' },
        uniqueBlogs: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Like', LikeSchema);