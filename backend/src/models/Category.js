const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name cannot exceed 50 characters']
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
    icon: {
      type: String,
      default: null
    },
    color: {
      type: String,
      default: '#667eea'
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
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
CategorySchema.pre('save', function (next) {
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
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ order: 1 });

// Virtual for blog count
CategorySchema.virtual('blogCount', {
  ref: 'Blog',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Virtual for subcategories
CategorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for full path
CategorySchema.virtual('path').get(function () {
  return this.parentCategory ? `${this.parentCategory}/${this.slug}` : this.slug;
});

// Static method to get active categories
CategorySchema.statics.getActive = async function () {
  return this.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .populate('subcategories');
};

// Static method to get categories with blog count
CategorySchema.statics.getWithCount = async function () {
  const categories = await this.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .populate('subcategories');

  const Blog = mongoose.model('Blog');
  const results = [];

  for (const category of categories) {
    const count = await Blog.countDocuments({ 
      category: category._id,
      status: 'published'
    });
    results.push({
      ...category.toObject(),
      blogCount: count
    });
  }

  return results;
};

module.exports = mongoose.model('Category', CategorySchema);