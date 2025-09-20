const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tender title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'],
    index: 'text'
  },
  
  description: {
    type: String,
    required: [true, 'Tender description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
    index: 'text'
  },
  
  // Basic Information
  tenderNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: [
      'construction',
      'it_software',
      'consulting',
      'manufacturing',
      'healthcare',
      'education',
      'transportation',
      'energy',
      'agriculture',
      'defense',
      'telecommunications',
      'finance',
      'other'
    ],
    index: true
  },
  
  subcategory: {
    type: String,
    trim: true,
    index: true
  },
  
  // Financial Information
  budget: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    type: {
      type: String,
      enum: ['fixed', 'estimated', 'range'],
      default: 'estimated'
    },
    range: {
      min: Number,
      max: Number
    }
  },
  
  // Location Information
  location: {
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      trim: true,
      index: true
    },
    city: {
      type: String,
      trim: true,
      index: true
    },
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  
  // Timeline Information
  publishedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  submissionDeadline: {
    type: Date,
    required: [true, 'Submission deadline is required'],
    index: true
  },
  
  projectStartDate: {
    type: Date
  },
  
  projectEndDate: {
    type: Date
  },
  
  duration: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'months'
    }
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['draft', 'published', 'open', 'closed', 'awarded', 'cancelled'],
    default: 'published',
    index: true
  },
  
  // Requirements and Specifications
  requirements: {
    technical: [{
      requirement: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      description: String
    }],
    
    qualifications: [{
      type: String,
      trim: true
    }],
    
    certifications: [{
      name: String,
      required: {
        type: Boolean,
        default: false
      },
      description: String
    }],
    
    experience: {
      minimum: {
        type: Number,
        min: 0
      },
      preferred: {
        type: Number,
        min: 0
      },
      unit: {
        type: String,
        enum: ['months', 'years'],
        default: 'years'
      }
    },
    
    documents: [{
      name: String,
      required: {
        type: Boolean,
        default: false
      },
      description: String,
      format: String
    }]
  },
  
  // Evaluation Criteria
  evaluationCriteria: [{
    criteria: String,
    weight: {
      type: Number,
      min: 0,
      max: 100
    },
    description: String
  }],
  
  // Contact Information
  contactInfo: {
    name: String,
    email: String,
    phone: String,
    organization: String,
    address: String
  },
  
  // Source Information
  source: {
    website: String,
    originalUrl: String,
    scrapedAt: Date,
    lastUpdated: Date
  },
  
  // Analysis and AI Data
  aiAnalysis: {
    complexity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    
    keyTerms: [{
      term: String,
      weight: Number
    }],
    
    suggestedSkills: [{
      skill: String,
      relevance: Number
    }],
    
    similarTenders: [{
      tenderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tender'
      },
      similarity: Number
    }],
    
    embedding: [Number], // Vector embedding for similarity search
    
    analysisDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Engagement Metrics
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    proposals: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    avgProposalValue: Number,
    lastViewed: Date
  },
  
  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Award Information (if awarded)
  award: {
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    awardAmount: Number,
    awardDate: Date,
    awardReason: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and search
tenderSchema.index({ 
  title: 'text', 
  description: 'text',
  'requirements.technical.requirement': 'text',
  'requirements.qualifications': 'text'
});

tenderSchema.index({ category: 1, status: 1 });
tenderSchema.index({ 'location.country': 1, 'location.state': 1 });
tenderSchema.index({ submissionDeadline: 1, status: 1 });
tenderSchema.index({ publishedDate: -1 });
tenderSchema.index({ 'budget.amount': 1 });
tenderSchema.index({ createdAt: -1 });

// Compound indexes for common queries
tenderSchema.index({ 
  category: 1, 
  'location.country': 1, 
  status: 1, 
  submissionDeadline: 1 
});

// Virtual for days until deadline
tenderSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.submissionDeadline) return null;
  
  const now = new Date();
  const deadline = new Date(this.submissionDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for status display
tenderSchema.virtual('statusDisplay').get(function() {
  if (this.status === 'open' && this.daysUntilDeadline < 0) {
    return 'expired';
  }
  return this.status;
});

// Virtual for budget display
tenderSchema.virtual('budgetDisplay').get(function() {
  if (!this.budget.amount) return 'Not specified';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.budget.currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  if (this.budget.type === 'range' && this.budget.range) {
    return `${formatter.format(this.budget.range.min)} - ${formatter.format(this.budget.range.max)}`;
  }
  
  return formatter.format(this.budget.amount);
});

// Pre-save middleware to update status based on deadline
tenderSchema.pre('save', function(next) {
  if (this.status === 'open' && this.submissionDeadline) {
    const now = new Date();
    if (this.submissionDeadline < now) {
      this.status = 'closed';
    }
  }
  next();
});

// Instance method to check if tender is active
tenderSchema.methods.isActive = function() {
  return this.status === 'open' && this.submissionDeadline > new Date();
};

// Instance method to check if user can submit proposal
tenderSchema.methods.canSubmitProposal = function() {
  return this.isActive() && this.status !== 'awarded' && this.status !== 'cancelled';
};

// Instance method to increment view count
tenderSchema.methods.incrementViews = function() {
  return this.updateOne({ 
    $inc: { 'metrics.views': 1 },
    $set: { 'metrics.lastViewed': new Date() }
  });
};

// Instance method to increment proposal count
tenderSchema.methods.incrementProposals = function() {
  return this.updateOne({ 
    $inc: { 'metrics.proposals': 1 }
  });
};

// Static method to find active tenders
tenderSchema.statics.findActive = function() {
  return this.find({
    status: 'open',
    submissionDeadline: { $gt: new Date() }
  });
};

// Static method to find tenders by category
tenderSchema.statics.findByCategory = function(category) {
  return this.find({ category: category, status: 'open' });
};

// Static method to find tenders by location
tenderSchema.statics.findByLocation = function(country, state = null) {
  const query = { 
    'location.country': country,
    status: 'open'
  };
  
  if (state) {
    query['location.state'] = state;
  }
  
  return this.find(query);
};

// Static method to find tenders by budget range
tenderSchema.statics.findByBudgetRange = function(minBudget, maxBudget) {
  return this.find({
    'budget.amount': { 
      $gte: minBudget, 
      $lte: maxBudget 
    },
    status: 'open'
  });
};

// Static method for advanced search
tenderSchema.statics.advancedSearch = function(filters) {
  const query = {};
  
  // Text search
  if (filters.q) {
    query.$text = { $search: filters.q };
  }
  
  // Category filter
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }
  
  // Location filter
  if (filters.country) {
    query['location.country'] = filters.country;
  }
  if (filters.state) {
    query['location.state'] = filters.state;
  }
  
  // Budget filter
  if (filters.minBudget || filters.maxBudget) {
    query['budget.amount'] = {};
    if (filters.minBudget) {
      query['budget.amount'].$gte = parseFloat(filters.minBudget);
    }
    if (filters.maxBudget) {
      query['budget.amount'].$lte = parseFloat(filters.maxBudget);
    }
  }
  
  // Status filter
  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = { $in: ['open', 'published'] };
  }
  
  // Deadline filter
  if (filters.deadline) {
    const days = parseInt(filters.deadline);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    query.submissionDeadline = { $lte: futureDate, $gt: new Date() };
  } else {
    query.submissionDeadline = { $gt: new Date() };
  }
  
  return this.find(query);
};

const Tender = mongoose.model('Tender', tenderSchema);

module.exports = Tender;
