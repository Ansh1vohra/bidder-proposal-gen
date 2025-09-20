const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Stripe Information
  stripe: {
    customerId: {
      type: String,
      required: [true, 'Stripe customer ID is required'],
      index: true
    },
    
    subscriptionId: {
      type: String,
      index: true
    },
    
    invoiceId: String,
    paymentIntentId: String,
    paymentMethodId: String,
    
    // For one-time payments
    chargeId: String
  },
  
  // Payment Details
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'upgrade', 'addon'],
    required: [true, 'Payment type is required'],
    index: true
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'],
    default: 'USD'
  },
  
  // Payment Status
  status: {
    type: String,
    enum: [
      'pending',
      'processing', 
      'succeeded', 
      'failed', 
      'cancelled', 
      'refunded',
      'partially_refunded'
    ],
    required: [true, 'Status is required'],
    default: 'pending',
    index: true
  },
  
  // Subscription Information
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      index: true
    },
    
    priceId: String,
    
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    
    // Subscription lifecycle
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'],
      index: true
    },
    
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    
    canceledAt: Date,
    cancelReason: String,
    
    // Trial information
    trialStart: Date,
    trialEnd: Date,
    
    // Proration information
    proratedAmount: Number,
    prorationDate: Date
  },
  
  // Payment Method Information
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank_account', 'wallet'],
      default: 'card'
    },
    
    // Card details (if applicable)
    card: {
      brand: String, // visa, mastercard, amex, etc.
      last4: String,
      expMonth: Number,
      expYear: Number,
      country: String
    },
    
    // Bank account details (if applicable)
    bankAccount: {
      bankName: String,
      accountType: String,
      last4: String,
      country: String
    }
  },
  
  // Transaction Details
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  metadata: {
    source: String, // web, mobile, api, etc.
    userAgent: String,
    ipAddress: String,
    
    // Custom metadata
    campaignId: String,
    promotionCode: String,
    referralCode: String
  },
  
  // Dates
  paymentDate: {
    type: Date,
    index: true
  },
  
  dueDate: Date,
  
  // Refund Information
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    status: String,
    requestedAt: Date,
    processedAt: Date,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Discount Information
  discounts: [{
    couponId: String,
    couponCode: String,
    discountType: {
      type: String,
      enum: ['percent', 'amount']
    },
    discountValue: Number,
    appliedAmount: Number
  }],
  
  // Tax Information
  tax: {
    taxAmount: Number,
    taxRate: Number,
    taxType: String,
    taxId: String,
    
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  
  // Usage-based billing (for future use)
  usage: [{
    metricName: String,
    quantity: Number,
    unitPrice: Number,
    totalAmount: Number,
    period: {
      start: Date,
      end: Date
    }
  }],
  
  // Webhook Events
  webhookEvents: [{
    eventId: String,
    eventType: String,
    processedAt: Date,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Administrative
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
    isInternal: {
      type: Boolean,
      default: true
    }
  }],
  
  // Error Information
  errors: [{
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
    occurredAt: {
      type: Date,
      default: Date.now
    }
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ 'stripe.customerId': 1 });
paymentSchema.index({ 'stripe.subscriptionId': 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ 'subscription.plan': 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Compound indexes
paymentSchema.index({ 
  userId: 1, 
  type: 1, 
  status: 1 
});

paymentSchema.index({
  'subscription.subscriptionStatus': 1,
  'subscription.currentPeriodEnd': 1
});

// Virtual for total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
  return this.refunds.reduce((total, refund) => {
    return refund.status === 'succeeded' ? total + refund.amount : total;
  }, 0);
});

// Virtual for net amount (amount - refunds)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.totalRefunded;
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(this.amount / 100); // Stripe uses cents
});

// Virtual for payment method display
paymentSchema.virtual('paymentMethodDisplay').get(function() {
  if (this.paymentMethod.type === 'card' && this.paymentMethod.card) {
    const card = this.paymentMethod.card;
    return `${card.brand.toUpperCase()} •••• ${card.last4}`;
  }
  
  if (this.paymentMethod.type === 'bank_account' && this.paymentMethod.bankAccount) {
    const bank = this.paymentMethod.bankAccount;
    return `${bank.bankName} •••• ${bank.last4}`;
  }
  
  return this.paymentMethod.type || 'Unknown';
});

// Virtual for subscription period display
paymentSchema.virtual('subscriptionPeriodDisplay').get(function() {
  if (!this.subscription.currentPeriodStart || !this.subscription.currentPeriodEnd) {
    return null;
  }
  
  const start = this.subscription.currentPeriodStart.toLocaleDateString();
  const end = this.subscription.currentPeriodEnd.toLocaleDateString();
  
  return `${start} - ${end}`;
});

// Pre-save middleware to set payment date
paymentSchema.pre('save', function(next) {
  if (this.status === 'succeeded' && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  next();
});

// Instance method to check if payment is successful
paymentSchema.methods.isSuccessful = function() {
  return this.status === 'succeeded';
};

// Instance method to check if payment can be refunded
paymentSchema.methods.canRefund = function() {
  return this.isSuccessful() && this.totalRefunded < this.amount;
};

// Instance method to add refund
paymentSchema.methods.addRefund = function(refundData) {
  this.refunds.push({
    ...refundData,
    requestedAt: new Date()
  });
  
  // Update status if fully refunded
  if (this.totalRefunded >= this.amount) {
    this.status = 'refunded';
  } else if (this.totalRefunded > 0) {
    this.status = 'partially_refunded';
  }
  
  return this.save();
};

// Instance method to add webhook event
paymentSchema.methods.addWebhookEvent = function(eventData) {
  this.webhookEvents.push({
    ...eventData,
    processedAt: new Date()
  });
  
  return this.save();
};

// Instance method to add note
paymentSchema.methods.addNote = function(text, userId, isInternal = true) {
  this.notes.push({
    text,
    createdBy: userId,
    isInternal
  });
  
  return this.save();
};

// Instance method to update subscription status
paymentSchema.methods.updateSubscriptionStatus = function(status, additionalData = {}) {
  this.subscription.subscriptionStatus = status;
  
  Object.keys(additionalData).forEach(key => {
    if (this.subscription[key] !== undefined) {
      this.subscription[key] = additionalData[key];
    }
  });
  
  return this.save();
};

// Static method to find payments by user
paymentSchema.statics.findByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'name email');
};

// Static method to find active subscriptions
paymentSchema.statics.findActiveSubscriptions = function() {
  return this.find({
    type: 'subscription',
    'subscription.subscriptionStatus': 'active'
  }).populate('userId', 'name email');
};

// Static method to find expiring subscriptions
paymentSchema.statics.findExpiringSubscriptions = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    type: 'subscription',
    'subscription.subscriptionStatus': 'active',
    'subscription.currentPeriodEnd': { $lte: futureDate }
  }).populate('userId', 'name email');
};

// Static method to get revenue statistics
paymentSchema.statics.getRevenueStats = function(startDate, endDate) {
  const match = {
    status: 'succeeded',
    paymentDate: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          type: '$type',
          plan: '$subscription.plan'
        },
        totalRevenue: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalRevenue' },
        totalPayments: { $sum: '$count' },
        byType: {
          $push: {
            type: '$_id.type',
            plan: '$_id.plan',
            revenue: '$totalRevenue',
            count: '$count',
            avgAmount: '$avgAmount'
          }
        }
      }
    }
  ]);
};

// Static method to get user payment history
paymentSchema.statics.getUserPaymentHistory = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('amount currency status paymentDate type subscription.plan description');
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
