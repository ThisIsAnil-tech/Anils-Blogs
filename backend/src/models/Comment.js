const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: [true, 'Blog reference is required']
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [5000, 'Comment cannot exceed 5000 characters']
    },
    author: {
      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
      },
      website: {
        type: String,
        trim: true,
        match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 'Please provide a valid URL']
      }
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required']
    },
    deviceInfo: {
      device: String,
      browser: String,
      os: String,
      userAgent: String
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }
    ],
    likes: {
      type: Number,
      default: 0
    },
    likedBy: [
      {
        ip: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isApproved: {
      type: Boolean,
      default: false
    },
    isSpam: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'spam'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
CommentSchema.index({ blog: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });
CommentSchema.index({ ipAddress: 1 });
CommentSchema.index({ status: 1 });

// Update blog comment count
CommentSchema.post('save', async function () {
  if (this.isApproved && !this.isDeleted) {
    const Blog = mongoose.model('Blog');
    await Blog.findByIdAndUpdate(this.blog, {
      $inc: { commentCount: 1 }
    });
  }
});

CommentSchema.post('remove', async function () {
  if (this.isApproved && !this.isDeleted) {
    const Blog = mongoose.model('Blog');
    await Blog.findByIdAndUpdate(this.blog, {
      $inc: { commentCount: -1 }
    });
  }
});

// Virtual for nested replies
CommentSchema.virtual('replyCount').get(function () {
  return this.replies ? this.replies.length : 0;
});

// Method to check if user can edit
CommentSchema.methods.canEdit = function (ipAddress) {
  return this.ipAddress === ipAddress;
};

// Method to check if user can delete
CommentSchema.methods.canDelete = function (ipAddress) {
  return this.ipAddress === ipAddress;
};

// Static method to get blog comments
CommentSchema.statics.getBlogComments = async function (blogId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const comments = await this.find({
    blog: blogId,
    status: 'approved',
    isDeleted: false,
    parentComment: null
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('replies');

  const total = await this.countDocuments({
    blog: blogId,
    status: 'approved',
    isDeleted: false,
    parentComment: null
  });

  return {
    comments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('Comment', CommentSchema);