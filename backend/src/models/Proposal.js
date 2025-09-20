const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  // References
  tenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tender',
    required: [true, 'Tender ID is required'],
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Proposal Content
  content: {
    // Executive Summary
    executiveSummary: {
      type: String,
      trim: true,
      maxlength: [1000, 'Executive summary cannot exceed 1000 characters']
    },
    
    // Understanding of Requirements
    requirementsUnderstanding: {
      type: String,
      trim: true,
      maxlength: [2000, 'Requirements understanding cannot exceed 2000 characters']
    },
    
    // Proposed Solution/Approach
    proposedSolution: {
      type: String,
      trim: true,
      maxlength: [3000, 'Proposed solution cannot exceed 3000 characters']
    },
    
    // Timeline
    timeline: {
      phases: [{
        name: String,
        description: String,
        startDate: Date,
        endDate: Date,
        duration: Number, // in days
        deliverables: [String],
        milestones: [String]
      }],
      
      totalDuration: {
        value: Number,
        unit: {
          type: String,
          enum: ['days', 'weeks', 'months'],
          default: 'weeks'
        }
      },
      
      startDate: Date,
      endDate: Date
    },
    
    // Budget Breakdown
    budget: {
      totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: 0
      },
      
      currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
      },
      
      breakdown: [{
        category: String,
        description: String,
        amount: Number,
        percentage: Number
      }],
      
      paymentTerms: String,
      
      additionalCosts: [{
        description: String,
        amount: Number,
        optional: {
          type: Boolean,
          default: false
        }
      }]
    },
    
    // Company Qualifications
    qualifications: {
      companyOverview: String,
      relevantExperience: String,
      keyPersonnel: [{
        name: String,
        role: String,
        experience: String,
        qualifications: [String]
      }],
      
      pastProjects: [{
        projectName: String,
        clientName: String,
        projectValue: Number,
        completionDate: Date,
        description: String,
        relevanceScore: Number
      }],
      
      certifications: [{
        name: String,
        issuedBy: String,
        validUntil: Date
      }],
      
      awards: [{
        name: String,
        year: Number,
        description: String
      }]
    },
    
    // Risk Management
    riskManagement: {
      identifiedRisks: [{
        risk: String,
        probability: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        impact: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        mitigation: String
      }],
      
      contingencyPlan: String,
      insurance: String
    },
    
    // Quality Assurance
    qualityAssurance: {
      methodology: String,
      standards: [String],
      testing: String,
      deliverables: String,
      maintenance: String
    },
    
    // Additional Information
    additionalInfo: {
      valueAddedServices: [String],
      innovation: String,
      sustainability: String,
      localContent: String,
      references: [{
        clientName: String,
        contactPerson: String,
        email: String,
        phone: String,
        projectDescription: String
      }]
    },
    
    // Raw full text for search and analysis
    fullText: {
      type: String,
      index: 'text'
    }
  },
  
  // AI Generation Information
  aiGeneration: {
    model: {
      type: String,
      default: 'gemini-pro'
    },
    
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    
    generatedAt: {
      type: Date,
      default: Date.now
    },
    
    prompt: String,
    
    generationTime: Number, // in milliseconds
    
    version: {
      type: String,
      default: '1.0'
    }
  },
  
  // User Customizations
  customizations: {
    userEdits: [{
      section: String,
      originalContent: String,
      editedContent: String,
      editedAt: Date
    }],
    
    customSections: [{
      title: String,
      content: String,
      order: Number
    }],
    
    templateUsed: String,
    
    lastEditedAt: Date
  },
  
  // Proposal Status and Lifecycle
  status: {
    type: String,
    enum: ['draft', 'generated', 'reviewed', 'submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    default: 'draft',
    index: true
  },
  
  // Submission Information
  submission: {
    submittedAt: Date,
    submissionMethod: {
      type: String,
      enum: ['online', 'email', 'physical', 'portal'],
      default: 'online'
    },
    
    submissionReference: String,
    
    documentsSubmitted: [{
      name: String,
      fileUrl: String,
      uploadedAt: Date,
      fileSize: Number,
      mimeType: String
    }],
    
    confirmationReceived: {
      type: Boolean,
      default: false
    },
    
    confirmationDetails: {
      referenceNumber: String,
      receivedAt: Date,
      acknowledgedBy: String
    }
  },
  
  // Evaluation and Feedback
  evaluation: {
    score: {
      technical: Number,
      financial: Number,
      overall: Number,
      maxScore: Number
    },
    
    feedback: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      comments: String
    },
    
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    evaluatedAt: Date,
    
    ranking: Number,
    
    decision: {
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'shortlisted']
      },
      reason: String,
      decidedAt: Date,
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  
  // Analytics and Metrics
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    
    downloadCount: {
      type: Number,
      default: 0
    },
    
    timeSpentGenerating: Number, // in seconds
    timeSpentEditing: Number, // in seconds
    
    similarities: [{
      proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal'
      },
      similarity: Number,
      comparedAt: Date
    }],
    
    embedding: [Number], // Vector embedding for similarity analysis
    
    lastAnalyzed: Date
  },
  
  // Version Control
  versions: [{
    version: Number,
    content: mongoose.Schema.Types.Mixed,
    createdAt: Date,
    changes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  currentVersion: {
    type: Number,
    default: 1
  },
  
  // Collaboration (if multiple users work on same proposal)
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer'
    },
    addedAt: Date,
    permissions: {
      canEdit: {
        type: Boolean,
        default: false
      },
      canSubmit: {
        type: Boolean,
        default: false
      },
      canDelete: {
        type: Boolean,
        default: false
      }
    }
  }],
  
  // Notes and Comments
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    }
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
proposalSchema.index({ userId: 1, status: 1 });
proposalSchema.index({ tenderId: 1, status: 1 });
proposalSchema.index({ status: 1, createdAt: -1 });
proposalSchema.index({ 'submission.submittedAt': -1 });
proposalSchema.index({ 'content.fullText': 'text' });

// Compound indexes
proposalSchema.index({ 
  userId: 1, 
  tenderId: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    status: { $in: ['submitted', 'shortlisted', 'accepted'] } 
  }
});

// Virtual for completion percentage
proposalSchema.virtual('completionPercentage').get(function() {
  const requiredSections = [
    'content.executiveSummary',
    'content.proposedSolution',
    'content.budget.totalAmount'
  ];
  
  let completed = 0;
  requiredSections.forEach(section => {
    const value = section.split('.').reduce((obj, key) => obj && obj[key], this);
    if (value) completed++;
  });
  
  return Math.round((completed / requiredSections.length) * 100);
});

// Virtual for days until tender deadline
proposalSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.populated('tenderId') || !this.tenderId.submissionDeadline) return null;
  
  const now = new Date();
  const deadline = new Date(this.tenderId.submissionDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for proposal value display
proposalSchema.virtual('budgetDisplay').get(function() {
  if (!this.content.budget.totalAmount) return 'Not specified';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.content.budget.currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(this.content.budget.totalAmount);
});

// Pre-save middleware to update full text for search
proposalSchema.pre('save', function(next) {
  // Combine all text content for search
  const textParts = [
    this.content.executiveSummary,
    this.content.requirementsUnderstanding,
    this.content.proposedSolution,
    this.content.qualifications?.companyOverview,
    this.content.qualifications?.relevantExperience,
    this.content.riskManagement?.contingencyPlan,
    this.content.qualityAssurance?.methodology
  ].filter(Boolean);
  
  this.content.fullText = textParts.join(' ');
  next();
});

// Pre-save middleware to update version
proposalSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.currentVersion += 1;
    this.versions.push({
      version: this.currentVersion,
      content: this.content,
      createdAt: new Date(),
      changes: 'Content updated',
      createdBy: this.userId
    });
  }
  next();
});

// Instance method to check if proposal can be edited
proposalSchema.methods.canEdit = function() {
  return ['draft', 'generated', 'reviewed'].includes(this.status);
};

// Instance method to check if proposal can be submitted
proposalSchema.methods.canSubmit = function() {
  return this.canEdit() && this.completionPercentage >= 80;
};

// Instance method to submit proposal
proposalSchema.methods.submit = function() {
  if (!this.canSubmit()) {
    throw new Error('Proposal cannot be submitted in current state');
  }
  
  this.status = 'submitted';
  this.submission.submittedAt = new Date();
  this.submission.submissionReference = this.generateSubmissionReference();
  
  return this.save();
};

// Instance method to generate submission reference
proposalSchema.methods.generateSubmissionReference = function() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `PROP-${date}-${random}`;
};

// Instance method to withdraw proposal
proposalSchema.methods.withdraw = function() {
  if (this.status === 'submitted') {
    this.status = 'withdrawn';
    return this.save();
  }
  throw new Error('Only submitted proposals can be withdrawn');
};

// Instance method to add note
proposalSchema.methods.addNote = function(text, userId, isPrivate = true) {
  this.notes.push({
    text,
    createdBy: userId,
    isPrivate
  });
  return this.save();
};

// Static method to find proposals by user
proposalSchema.statics.findByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('tenderId', 'title category location.country submissionDeadline status')
    .sort({ updatedAt: -1 });
};

// Static method to find proposals by tender
proposalSchema.statics.findByTender = function(tenderId, status = null) {
  const query = { tenderId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('userId', 'name email profile.companyName')
    .sort({ 'submission.submittedAt': -1 });
};

// Static method to get user's proposal statistics
proposalSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$content.budget.totalAmount' }
      }
    }
  ]);
};

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
