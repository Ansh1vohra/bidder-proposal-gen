import { User, Tender, Proposal, SubscriptionPlan } from '../../types';

export const demoUser: User = {
  _id: 'user_demo_001',
  email: 'alex.demo@example.com',
  name: 'Alex Johnson',
  userType: 'bidder',
  profile: {
    companyName: 'Civilytix Demo Co.',
    contactNumber: '+1 (555) 123-4567',
    address: { city: 'New York', country: 'USA' },
    industry: 'Construction',
  },
  subscription: {
    currentPlan: 'professional',
    status: 'active',
    startDate: new Date(Date.now() - 20 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    usage: {
      proposalsGenerated: 18,
      monthlyLimit: 50,
      lastResetDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
    },
  },
  preferences: {
    preferredIndustries: ['Construction', 'IT Services'],
    language: 'en',
    timezone: 'America/New_York',
    notifications: { email: true, push: false, frequency: 'daily' },
  },
  status: 'active',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const demoTenders: Tender[] = Array.from({ length: 12 }).map((_, i) => ({
  _id: `tender_${1000 + i}`,
  title: `Infrastructure Upgrade Project #${i + 1}`,
  description: 'Request for proposal to upgrade municipal infrastructure, including roads and utilities.',
  category: 'Infrastructure',
  industry: i % 2 === 0 ? 'Construction' : 'IT Services',
  tenderType: i % 3 === 0 ? 'open' : 'selective',
  status: 'active',
  submissionDeadline: new Date(Date.now() + (i + 3) * 24 * 3600 * 1000),
  estimatedValue: { min: 50000 + i * 10000, max: 150000 + i * 20000, currency: 'USD' },
  location: { country: 'USA', state: 'NY', city: 'New York' },
  createdBy: { _id: `org_${i}`, email: 'org@example.com', name: i % 2 === 0 ? 'City Council' : 'State Authority', userType: 'admin', profile: { }, subscription: { currentPlan: 'free', status: 'inactive', usage: { proposalsGenerated: 0, monthlyLimit: 0, lastResetDate: new Date() } }, preferences: { language: 'en', timezone: 'UTC', notifications: { email: true, push: false, frequency: 'weekly' } }, status: 'active', emailVerified: true, createdAt: new Date(), updatedAt: new Date() } as unknown as User,
  requirements: {
    technical: [
      { requirement: 'ISO 9001 Certification', priority: 'high', description: 'Quality Management' },
    ],
    qualifications: ['5+ years experience', 'Financial statements'],
    certifications: [{ name: 'Safety Compliance', required: true }],
    experience: { minimum: 5, unit: 'years' },
    documents: [{ name: 'Company Profile', required: true }],
  },
  evaluationCriteria: [{ criteria: 'Cost', weight: 40 }, { criteria: 'Quality', weight: 60 }],
  contactInfo: { name: 'Procurement Office', email: 'procurement@example.com' },
  proposals: [],
  createdAt: new Date(Date.now() - (i + 1) * 24 * 3600 * 1000),
  updatedAt: new Date(),
}));

export const demoProposals: Proposal[] = Array.from({ length: 10 }).map((_, i) => ({
  _id: `proposal_${2000 + i}`,
  tenderId: demoTenders[i],
  userId: demoUser,
  content: {
    executiveSummary: `Executive Summary for Proposal #${i + 1}...`,
    proposedSolution: 'Detailed approach and methodology...',
    timeline: { totalDuration: '8 weeks' },
    budget: { totalAmount: 25000 + i * 1000, currency: 'USD' },
  },
  status: i % 5 === 0 ? 'accepted' : i % 3 === 0 ? 'submitted' : 'draft',
  downloadCount: 3 + i,
  isWatermarked: false,
  version: 1,
  createdAt: new Date(Date.now() - (i + 2) * 24 * 3600 * 1000),
  updatedAt: new Date(),
}));

export const demoPlans: SubscriptionPlan[] = [
  { id: 'free', name: 'Free', price: { monthly: 0, yearly: 0 }, features: ['Demo proposals', 'Basic search'], proposalsLimit: 0 },
  { id: 'basic', name: 'Basic', price: { monthly: 29, yearly: 290 }, features: ['10 proposals/month', 'Downloads'], proposalsLimit: 10 },
  { id: 'professional', name: 'Professional', price: { monthly: 79, yearly: 790 }, features: ['50 proposals/month', 'Templates', 'Analytics'], proposalsLimit: 50, popular: true },
  { id: 'enterprise', name: 'Enterprise', price: { monthly: 199, yearly: 1990 }, features: ['Unlimited', 'White-label', 'Integrations'], proposalsLimit: -1 },
];


