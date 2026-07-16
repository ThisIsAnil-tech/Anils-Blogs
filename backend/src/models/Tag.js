const mongoose = require('mongoose');
const slugify = require('slugify');

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Tag name must be at least 2 characters'],
      maxlength: [30, 'Tag name cannot exceed 30 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: ''
    },
    color: {
      type: String,
      default: '#667eea'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create slug before saving
TagSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true
    });
  }
  next();
});

// Indexes
TagSchema.index({ slug: 1 });
TagSchema.index({ isActive: 1 });

// Virtual for blog count
TagSchema.virtual('blogCount', {
  ref: 'Blog',
  localField: '_id',
  foreignField: 'tags',
  count: true
});

// Static method to get active tags
TagSchema.statics.getActive = async function () {
  return this.find({ isActive: true })
    .sort({ name: 1 });
};

// Static method to get tags with blog count
TagSchema.statics.getWithCount = async function () {
  const tags = await this.find({ isActive: true })
    .sort({ name: 1 });

  const Blog = mongoose.model('Blog');
  const results = [];

  for (const tag of tags) {
    const count = await Blog.countDocuments({ 
      tags: tag._id,
      status: 'published'
    });
    results.push({
      ...tag.toObject(),
      blogCount: count
    });
  }

  return results;
};

// Static method to get popular tags
TagSchema.statics.getPopular = async function (limit = 10) {
  const Blog = mongoose.model('Blog');
  
  const tags = await this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'blogs',
        localField: '_id',
        foreignField: 'tags',
        as: 'blogs'
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        color: 1,
        count: { $size: '$blogs' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return tags;
};

module.exports = mongoose.model('Tag', TagSchema);