const mongoose = require('mongoose');
const slugify = require('slugify');

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    excerpt: {
      type: String,
      required: [true, 'Blog excerpt is required'],
      maxlength: [300, 'Excerpt cannot exceed 300 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    featuredImage: {
      type: String,
      required: [true, 'Featured image is required']
    },
    images: [
      {
        url: String,
        publicId: String,
        alt: String,
        width: Number,
        height: Number,
        format: String,
        size: Number
      }
    ],
    videos: [
      {
        url: String,
        publicId: String,
        thumbnail: String,
        duration: Number,
        format: String,
        size: Number
      }
    ],
    megaFileId: {
      type: String,
      required: [true, 'MEGA file ID is required']
    },
    megaFileName: {
      type: String,
      required: [true, 'MEGA file name is required']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
      }
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft'
    },
    publishDate: {
      type: Date
    },
    scheduleDate: {
      type: Date
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isSticky: {
      type: Boolean,
      default: false
    },
    viewCount: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      min: 1,
      default: 3
    },
    wordCount: {
      type: Number,
      default: 0
    },
    seoSettings: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String,
      ogTitle: String,
      ogDescription: String,
      twitterCard: String,
      canonicalUrl: String,
      noIndex: {
        type: Boolean,
        default: false
      },
      noFollow: {
        type: Boolean,
        default: false
      }
    },
    settings: {
      allowComments: {
        type: Boolean,
        default: true
      },
      showInHomePage: {
        type: Boolean,
        default: true
      },
      showInArchive: {
        type: Boolean,
        default: true
      }
    },
    views: [
      {
        ip: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        device: String,
        browser: String,
        country: String,
        city: String,
        referrer: String,
        timeSpent: Number,
        scrollDepth: Number,
        pageCount: Number
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create slug before saving
BlogSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes for better performance
BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishDate: -1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ viewCount: -1 });
BlogSchema.index({ likeCount: -1 });
BlogSchema.index({ createdAt: -1 });

// Virtual for full URL
BlogSchema.virtual('url').get(function () {
  return `${process.env.APP_URL}/blogs/${this.slug}`;
});

// Virtual for formatted publish date
BlogSchema.virtual('formattedDate').get(function () {
  return this.publishDate ? this.publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;
});

// Virtual for relative time
BlogSchema.virtual('relativeTime').get(function () {
  if (!this.publishDate) return null;
  const diff = Date.now() - this.publishDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);
  const months = Math.floor(diff / 2592000000);
  const years = Math.floor(diff / 31536000000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
});

// Static method to get popular blogs
BlogSchema.statics.getPopular = async function (limit = 10) {
  return this.find({ status: 'published' })
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .populate('tags', 'name slug');
};

// Static method to get recent blogs
BlogSchema.statics.getRecent = async function (limit = 12) {
  return this.find({ status: 'published' })
    .sort({ publishDate: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .populate('tags', 'name slug');
};

module.exports = mongoose.model('Blog', BlogSchema);