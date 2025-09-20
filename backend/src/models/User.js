const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  userType: {
    type: String,
    enum: ['bidder', 'admin'],
    default: 'bidder',
    required: true
  },
  
  // Profile Information
  profile: {
    companyName: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    
    contactNumber: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid contact number']
    },
    
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    
    // Business Information
    businessType: {
      type: String,
      enum: ['individual', 'company', 'partnership', 'corporation'],
      default: 'individual'
    },
    
    specializations: [{
      type: String,
      trim: true
    }],
    
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner'
    },
    
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 100
    },
    
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
      certificateUrl: String
    }],
    
    previousProjects: [{
      title: String,
      description: String,
      value: Number,
      completedDate: Date,
      clientName: String,
      category: String
    }],
    
    // Preferences for recommendations
    preferences: {
      categories: [{
        type: String,
        trim: true
      }],
      
      locations: [{
        type: String,
        trim: true
      }],
      
      budgetRange: {
        min: {
          type: Number,
          default: 0
        },
        max: {
          type: Number,
          default: 1000000
        }
      },
      
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        tenderAlerts: {
          type: Boolean,
          default: true
        },
        proposalUpdates: {
          type: Boolean,
          default: true
        },
        paymentReminders: {
          type: Boolean,
          default: true
        }
      }
    }
  },
  
  // Subscription Information
  subscription: {
    stripeCustomerId: String,
    currentPlan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    
    subscriptionId: String,
    priceId: String,
    
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'unpaid', 'incomplete'],
      default: 'active'
    },
    
    startDate: Date,
    endDate: Date,
    
    usage: {
      proposalsGenerated: {
        type: Number,
        default: 0
      },
      monthlyLimit: {
        type: Number,
        default: 3 // Free plan limit
      },
      lastResetDate: {
        type: Date,
        default: Date.now
      }
    },
    
    paymentHistory: [{
      amount: Number,
      currency: String,
      status: String,
      date: Date,
      invoiceId: String,
      description: String
    }]
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'active'
  },
  
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Security
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }],
  
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ 'subscription.stripeCustomerId': 1 });
userSchema.index({ 'profile.specializations': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to reset monthly usage
userSchema.pre('save', function(next) {
  const now = new Date();
  const lastReset = this.subscription.usage.lastResetDate;
  
  // Reset monthly usage if it's a new month
  if (lastReset && 
      (now.getMonth() !== lastReset.getMonth() || 
       now.getFullYear() !== lastReset.getFullYear())) {
    this.subscription.usage.proposalsGenerated = 0;
    this.subscription.usage.lastResetDate = now;
  }
  
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to check if user can generate proposals
userSchema.methods.canGenerateProposal = function() {
  const limits = {
    free: 3,
    basic: 20,
    professional: 50,
    enterprise: -1 // unlimited
  };
  
  const limit = limits[this.subscription.currentPlan];
  if (limit === -1) return true; // unlimited
  
  return this.subscription.usage.proposalsGenerated < limit;
};

// Instance method to increment proposal usage
userSchema.methods.incrementProposalUsage = function() {
  return this.updateOne({
    $inc: { 'subscription.usage.proposalsGenerated': 1 }
  });
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return token;
};

// Static method to find user by email verification token
userSchema.statics.findByEmailVerificationToken = function(token) {
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

// Static method to find user by password reset token
userSchema.statics.findByPasswordResetToken = function(token) {
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
