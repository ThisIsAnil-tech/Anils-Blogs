const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['view', 'like', 'share', 'comment', 'subscriber', 'click', 'scroll', 'time'],
      required: true
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      sparse: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    },
    deviceInfo: {
      device: String,
      browser: String,
      os: String
    },
    location: {
      country: String,
      countryCode: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number
    },
    referrer: {
      type: String,
      default: null
    },
    landingPage: {
      type: String,
      default: null
    },
    sessionId: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    value: {
      type: Number,
      default: 1
    },
    timestamp: {
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

// Indexes for better performance
AnalyticsSchema.index({ blog: 1, timestamp: -1 });
AnalyticsSchema.index({ type: 1, timestamp: -1 });
AnalyticsSchema.index({ ipAddress: 1, timestamp: -1 });
AnalyticsSchema.index({ 'location.country': 1 });
AnalyticsSchema.index({ sessionId: 1 });
AnalyticsSchema.index({ timestamp: -1 });

// Static method to get analytics by type
AnalyticsSchema.statics.getByType = async function (type, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        type,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          blog: '$blog'
        },
        count: { $sum: '$value' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        total: { $sum: '$count' },
        uniqueBlogs: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get unique visitors
AnalyticsSchema.statics.getUniqueVisitors = async function (startDate, endDate) {
  const visitors = await this.distinct('ipAddress', {
    timestamp: { $gte: startDate, $lte: endDate }
  });
  return visitors.length;
};

// Static method to get top referrers
AnalyticsSchema.statics.getTopReferrers = async function (startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        referrer: { $ne: null },
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$referrer',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
};

// Static method to get device breakdown
AnalyticsSchema.statics.getDeviceBreakdown = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          device: '$deviceInfo.device',
          browser: '$deviceInfo.browser',
          os: '$deviceInfo.os'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get geographic distribution
AnalyticsSchema.statics.getGeoDistribution = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        'location.country': { $ne: null },
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          country: '$location.country',
          countryCode: '$location.countryCode',
          city: '$location.city'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get hourly distribution
AnalyticsSchema.statics.getHourlyDistribution = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          dayOfWeek: { $dayOfWeek: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.hour',
        counts: {
          $push: {
            day: '$_id.dayOfWeek',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to get session duration
AnalyticsSchema.statics.getAverageSessionDuration = async function (startDate, endDate) {
  const sessions = await this.aggregate([
    {
      $match: {
        sessionId: { $ne: null },
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$sessionId',
        firstEvent: { $min: '$timestamp' },
        lastEvent: { $max: '$timestamp' },
        eventCount: { $sum: 1 }
      }
    },
    {
      $project: {
        duration: { $subtract: ['$lastEvent', '$firstEvent'] },
        eventCount: 1
      }
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
        avgEvents: { $avg: '$eventCount' }
      }
    }
  ]);

  return sessions[0] || { avgDuration: 0, avgEvents: 0 };
};

// Static method to get bounce rate
AnalyticsSchema.statics.getBounceRate = async function (startDate, endDate) {
  const sessions = await this.aggregate([
    {
      $match: {
        sessionId: { $ne: null },
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$sessionId',
        eventCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        bouncedSessions: {
          $sum: {
            $cond: [{ $eq: ['$eventCount', 1] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (sessions.length === 0) return { bounceRate: 0, totalSessions: 0, bouncedSessions: 0 };
  
  const data = sessions[0];
  return {
    bounceRate: (data.bouncedSessions / data.totalSessions) * 100,
    totalSessions: data.totalSessions,
    bouncedSessions: data.bouncedSessions
  };
};

// Static method to get conversion funnel
AnalyticsSchema.statics.getConversionFunnel = async function (startDate, endDate) {
  const funnel = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          sessionId: '$sessionId',
          type: '$type'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.sessionId',
        events: {
          $push: {
            type: '$_id.type',
            count: '$count'
          }
        }
      }
    },
    {
      $unwind: '$events'
    },
    {
      $group: {
        _id: '$events.type',
        sessions: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        type: '$_id',
        sessions: { $size: '$sessions' },
        _id: 0
      }
    }
  ]);

  return funnel;
};

module.exports = mongoose.model('Analytics', AnalyticsSchema);