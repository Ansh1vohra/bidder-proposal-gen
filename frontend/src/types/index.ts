export interface User {
  _id: string;
  email: string;
  name: string;
  userType: 'bidder' | 'admin';
  profile: {
    companyName?: string;
    contactNumber?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    industry?: string;
    website?: string;
    bio?: string;
    skills?: string[];
    experience?: string[];
    certifications?: string[];
    portfolio?: any[];
  };
  subscription: {
    stripeCustomerId?: string;
    currentPlan: 'free' | 'basic' | 'professional' | 'enterprise';
    subscriptionId?: string;
    priceId?: string;
    status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'incomplete' | 'inactive';
    startDate?: Date;
    endDate?: Date;
    usage: {
      proposalsGenerated: number;
      monthlyLimit: number;
      lastResetDate: Date;
    };
    paymentHistory?: Array<{
      amount: number;
      currency: string;
      status: string;
      date: Date;
      invoiceId: string;
      description: string;
    }>;
  };
  preferences: {
    preferredIndustries?: string[];
    locationPreferences?: string[];
    budgetRange?: {
      min?: number;
      max?: number;
    };
    notifications?: {
      email: boolean;
      push: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    };
    language: string;
    timezone: string;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tender {
  _id: string;
  title: string;
  description: string;
  category: string;
  industry: string;
  tenderType: 'open' | 'selective' | 'negotiated' | 'competitive';
  status: 'draft' | 'active' | 'evaluation' | 'awarded' | 'closed' | 'cancelled';
  submissionDeadline: Date;
  estimatedValue?: {
    min?: number;
    max?: number;
    currency: string;
  };
  location: {
    country: string;
    state?: string;
    city?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  createdBy: string | User;
  requirements: {
    technical?: Array<{
      requirement: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      description?: string;
    }>;
    qualifications?: string[];
    certifications?: Array<{
      name: string;
      required: boolean;
      description?: string;
    }>;
    experience?: {
      minimum?: number;
      preferred?: number;
      unit: 'months' | 'years';
    };
    documents?: Array<{
      name: string;
      required: boolean;
      description?: string;
      format?: string;
    }>;
  };
  evaluationCriteria?: Array<{
    criteria: string;
    weight: number;
    description?: string;
  }>;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    address?: string;
  };
  proposals: Array<{
    submittedBy: string | User;
    submittedAt: Date;
    status: 'submitted' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected';
  }>;
  tags?: string[];
  source?: {
    website?: string;
    originalUrl?: string;
    scrapedAt?: Date;
    lastUpdated?: Date;
  };
  searchableText?: string;
  embeddings?: number[];
  analytics?: {
    views: number;
    uniqueViews: number;
    applications: number;
    viewHistory: Array<{
      userId: string;
      viewedAt: Date;
      source: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  _id: string;
  tenderId: string | Tender;
  userId: string | User;
  content: {
    executiveSummary?: string;
    requirementsUnderstanding?: string;
    proposedSolution?: string;
    timeline?: {
      phases?: Array<{
        name: string;
        duration: string;
        deliverables: string[];
        milestones: string[];
      }>;
      totalDuration?: string;
      startDate?: Date;
      endDate?: Date;
    };
    budget?: {
      breakdown?: Array<{
        category: string;
        description: string;
        amount: number;
        currency: string;
      }>;
      totalAmount?: number;
      currency?: string;
      paymentTerms?: string;
    };
    companyQualifications?: string;
    riskManagement?: string;
    qualityAssurance?: string;
    additionalValue?: string;
    references?: Array<{
      projectName: string;
      clientName: string;
      description: string;
      value?: number;
      completionDate?: Date;
    }>;
  };
  aiGeneration?: {
    model: string;
    version: string;
    generatedAt: Date;
    confidence: number;
    processingTime: number;
    inputTokens: number;
    outputTokens: number;
  };
  userCustomization?: {
    requirements?: any;
    customSections?: any[];
    templates?: any[];
  };
  status: 'draft' | 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt?: Date;
  evaluation?: {
    score?: number;
    feedback?: string;
    evaluatedBy?: string;
    evaluatedAt?: Date;
    criteria?: Array<{
      name: string;
      score: number;
      maxScore: number;
      comments?: string;
    }>;
  };
  downloadCount: number;
  lastDownloadedAt?: Date;
  isWatermarked: boolean;
  version: number;
  searchableText?: string;
  embeddings?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  _id: string;
  userId: string | User;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: 'stripe';
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  billingPeriod: 'monthly' | 'yearly';
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  metadata?: any;
  failureReason?: string;
  refundAmount?: number;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenderRecommendation {
  tender: Tender;
  score: number;
  reasons: string[];
  matchedSkills: string[];
  estimatedCompetition: number;
  successProbability: number;
}

export interface BidderRecommendation {
  bidder: User;
  score: number;
  reasons: string[];
  matchedRequirements: string[];
  previousExperience: string[];
  estimatedBudget?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType: 'bidder' | 'admin';
  companyName?: string;
  contactNumber?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  proposalsLimit: number;
  popular?: boolean;
}

export interface SearchFilters {
  query?: string;
  industry?: string[];
  location?: string[];
  budgetMin?: number;
  budgetMax?: number;
  status?: string[];
  category?: string[];
  deadline?: {
    from?: Date;
    to?: Date;
  };
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TenderAnalytics {
  totalViews: number;
  uniqueViews: number;
  totalApplications: number;
  averageResponseTime: number;
  competitionLevel: 'low' | 'medium' | 'high';
  successProbability: number;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
  applicationsByIndustry: Array<{
    industry: string;
    count: number;
  }>;
}

export interface ProposalAnalytics {
  totalProposals: number;
  acceptanceRate: number;
  averageScore: number;
  responseTime: number;
  successByIndustry: Array<{
    industry: string;
    successRate: number;
    totalProposals: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    proposals: number;
    accepted: number;
  }>;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}
