import { simulateLatency } from '../../config/appConfig';
import { demoUser, demoTenders, demoProposals, demoPlans } from './mockData';
import { Proposal, ProposalAnalytics, Tender, TenderAnalytics, TenderRecommendation } from '../../types';

export const mockAuthService = {
  async login() {
    return simulateLatency({ user: demoUser, tokens: { accessToken: 'demo_access', refreshToken: 'demo_refresh', expiresIn: 3600 } });
  },
  async register() {
    return simulateLatency({ user: demoUser, tokens: { accessToken: 'demo_access', refreshToken: 'demo_refresh', expiresIn: 3600 } });
  },
  async logout() { return simulateLatency(undefined); },
  async getCurrentUser() { return simulateLatency(demoUser); },
};

export const mockTenderService = {
  async getTenders() {
    return simulateLatency({ tenders: demoTenders, pagination: { currentPage: 1, totalPages: 1, totalItems: demoTenders.length, itemsPerPage: demoTenders.length } });
  },
  async getTenderById(id: string) {
    const t = demoTenders.find(t => t._id === id) || demoTenders[0];
    return simulateLatency(t);
  },
  async getMyTenders() {
    return simulateLatency({ tenders: demoTenders.slice(0, 5), pagination: { currentPage: 1, totalPages: 1, totalItems: 5, itemsPerPage: 5 } });
  },
  async getTrendingTenders(limit = 10) { return simulateLatency(demoTenders.slice(0, limit)); },
  async searchTenders() { return simulateLatency(demoTenders.slice(0, 8)); },
  async getTenderStats() {
    return simulateLatency({ total: 120, active: 48, draft: 22, closed: 50, byIndustry: [{ industry: 'Construction', count: 60 }, { industry: 'IT Services', count: 40 }], byLocation: [{ location: 'NY', count: 35 }, { location: 'CA', count: 45 }] });
  },
  async getCategories() { return simulateLatency(['Construction', 'IT Services', 'Consulting', 'Healthcare']); },
  async getIndustries() { return simulateLatency(['Construction', 'IT Services', 'Energy', 'Transportation']); },
  async createTender(data: any) { return simulateLatency({ ...demoTenders[0], ...data, _id: 'tender_new' }); },
  async updateTender(id: string, updates: any) { return simulateLatency({ ...(demoTenders.find(t => t._id === id) || demoTenders[0]), ...updates }); },
  async deleteTender() { return simulateLatency(undefined); },
  async getTenderAnalytics(): Promise<TenderAnalytics> {
    return simulateLatency({
      totalViews: 1234,
      uniqueViews: 876,
      totalApplications: 56,
      averageResponseTime: 3.8,
      competitionLevel: 'medium',
      successProbability: 0.42,
      viewsOverTime: [
        { date: '2025-01-01', views: 120 },
        { date: '2025-02-01', views: 160 },
      ],
      applicationsByIndustry: [
        { industry: 'Construction', count: 28 },
        { industry: 'IT Services', count: 28 },
      ],
    });
  },
  async closeTender(id: string) { return simulateLatency({ ...(demoTenders.find(t => t._id === id) || demoTenders[0]), status: 'closed' as const }); },
};

const longAITextBase =
  'This AI-generated proposal presents a comprehensive, outcome-oriented delivery model leveraging industry best practices, risk-managed execution, and measurable KPIs. ' +
  'Our phased approach de-risks critical path activities, accelerates value realization, and ensures transparency via governance cadences. ' +
  'We incorporate stakeholder co-design, rigorous validation gates, and continuous quality assurance to deliver resilient, scalable results aligned to your objectives. ' +
  'By combining domain expertise with reusable accelerators and automation, we reduce total cost of ownership and improve time-to-value.\n\n' +
  'Key Differentiators: (1) Evidence-based planning with defensible estimates; (2) Modular architecture enabling iterative scale-up; (3) Robust change management plan; ' +
  '(4) Secure-by-design principles; (5) Outcome metrics with clear acceptance criteria.\n\n' +
  'Methodology & Approach: Our delivery is organized into Discovery, Design, Build, Integrate, and Stabilize phases. Each phase includes entry/exit criteria, quality gates, and stakeholder checkpoints. ' +
  'We adopt agile practices with two-week sprints, backlog refinement, sprint reviews, and retrospectives to ensure continuous improvement.\n\n' +
  'Risk Management: We maintain a living risk register with probability, impact, mitigation owners, and response strategies. Top risks include scope volatility, third-party constraints, and environmental dependencies. ' +
  'Mitigations include early vendor engagement, technical spikes, and buffer allocation for integration complexities.\n\n' +
  'Team & Roles: A cross-functional squad including a Delivery Lead, Solution Architect, Business Analyst, QA Lead, Security SME, and Data Specialist collaborates with your stakeholders for shared ownership and rapid decision-making.\n\n' +
  'Governance & Reporting: Weekly status updates, KPI dashboards (schedule adherence, defect density, velocity), and executive steercos provide clear visibility and accountability.\n\n' +
  'SLAs & Quality: We target >99.5% availability for applicable services, <2% defect escape rate, and performance SLAs aligned with business load profiles.\n\n' +
  'Compliance & Security: The solution adheres to relevant standards (e.g., ISO 27001, SOC 2) and implements least-privilege access, encryption in transit/at rest, and auditable change controls.\n\n' +
  'Sustainability & Value: We design for maintainability, observability, and cost efficiency, with telemetry to measure outcomes and inform continuous optimization.';

const longAIText = `${longAITextBase}\n\n${longAITextBase}`;

export const mockProposalService = {
  async getProposals(): Promise<{ proposals: Proposal[]; pagination: any }> {
    const enriched: Proposal[] = demoProposals.map(p => ({
      ...p,
      content: {
        ...p.content,
        executiveSummary: (p.content.executiveSummary || '') + (p.content.executiveSummary ? '\n\n' : '') + longAIText,
        proposedSolution:
          p.content.proposedSolution ||
          'We propose a multi-phase implementation with discovery, design, build, integrate, and stabilize stages. Each phase includes outcomes, risks, mitigations, and exit criteria. ' +
          'We employ agile ceremonies for rapid feedback, and a robust CI/CD pipeline with automated testing to ensure quality and predictability.\n\n' +
          longAIText,
        requirementsUnderstanding:
          p.content.requirementsUnderstanding ||
          'We understand the need to deliver a scalable, secure, and maintainable solution that improves stakeholder experience while reducing operational overhead. ' +
          'Key drivers include regulatory compliance, performance at scale, and seamless integration with adjacent systems. ' +
          'Non-functional requirements (availability, latency, observability) will be first-class citizens throughout the lifecycle.\n\n' +
          longAIText,
        companyQualifications:
          p.content.companyQualifications ||
          'Our team has successfully delivered >50 projects in similar domains with measurable ROI improvements. References available upon request. ' +
          'We bring certified practitioners (PMP, CSM, TOGAF, CISSP) and repeatable accelerators that shorten timelines without compromising quality.\n\n' +
          longAIText,
        riskManagement:
          p.content.riskManagement ||
          'A proactive, data-driven risk management framework underpins delivery. We continuously triage risks, implement mitigations, and adapt plans through governance cadences.\n\n' +
          longAIText,
        additionalValue:
          p.content.additionalValue ||
          'We will transfer knowledge, provide enablement workshops, and co-create a playbook to institutionalize best practices beyond the engagement. ' +
          'We also include post-implementation value tracking to ensure sustained outcomes.\n\n' +
          longAIText,
      },
      isWatermarked: true,
    }));
    return simulateLatency({ proposals: enriched, pagination: { currentPage: 1, totalPages: 1, totalItems: enriched.length, itemsPerPage: enriched.length } });
  },
  async getProposalById(id: string): Promise<Proposal> {
    const base = demoProposals.find(p => p._id === id) || demoProposals[0];
    return simulateLatency({
      ...base,
      content: {
        ...base.content,
        executiveSummary: (base.content.executiveSummary || '') + (base.content.executiveSummary ? '\n\n' : '') + longAIText,
        proposedSolution: (base.content.proposedSolution || '') + (base.content.proposedSolution ? '\n\n' : '') + longAIText,
      },
      isWatermarked: true,
    });
  },
  async generateProposal(): Promise<Proposal> {
    const base = demoProposals[0];
    return simulateLatency({ ...base, status: 'draft' as const, isWatermarked: true });
  },
  async generateWatermarkedDemo(): Promise<Proposal> {
    const base = demoProposals[0];
    return simulateLatency({ ...base, isWatermarked: true });
  },
  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> { return simulateLatency({ ...demoProposals[0], ...updates }); },
  async submitProposal(id: string): Promise<Proposal> { return simulateLatency({ ...demoProposals[0], status: 'submitted' as const }); },
  async withdrawProposal(id: string): Promise<Proposal> { return simulateLatency({ ...demoProposals[0], status: 'draft' as const }); },
  async deleteProposal(): Promise<void> { return simulateLatency(undefined); },
  async downloadProposal(): Promise<void> { return simulateLatency(undefined); },
  async getProposalAnalytics(): Promise<ProposalAnalytics> {
    return simulateLatency({
      totalProposals: 24,
      acceptanceRate: 0.25,
      averageScore: 78,
      responseTime: 4.2,
      successByIndustry: [
        { industry: 'Construction', successRate: 0.28, totalProposals: 12 },
        { industry: 'IT Services', successRate: 0.22, totalProposals: 12 },
      ],
      monthlyTrends: [
        { month: 'Jan', proposals: 6, accepted: 2 },
        { month: 'Feb', proposals: 8, accepted: 2 },
        { month: 'Mar', proposals: 10, accepted: 2 },
      ],
    });
  },
  async getTemplates(): Promise<any[]> { return simulateLatency([{ id: 'tmpl_1', name: 'Standard Template' }]); },
  async saveAsTemplate(): Promise<any> { return simulateLatency({ id: 'tmpl_2', name: 'Saved Template' }); },
  async getProposalFeedback(): Promise<any> { return simulateLatency({ score: 82, suggestions: ['Clarify scope', 'Add risk mitigation'] }); },
  async getProposalComparison(): Promise<any> { return simulateLatency({ competitors: 5, rank: 2 }); },
  async getContentSuggestions(): Promise<string[]> { return simulateLatency(['Suggestion A', 'Suggestion B']); },
  async optimizeContent(): Promise<string> { return simulateLatency('Optimized content...'); },
};

export const mockRecommendationService = {
  async getTenderRecommendations(): Promise<TenderRecommendation[]> {
    const items: TenderRecommendation[] = demoTenders.slice(0, 6).map((t: Tender) => ({
      tender: t,
      score: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100,
      reasons: ['High semantic similarity', 'Recent activity in your industry'],
      matchedSkills: ['Project Management', 'Quality Assurance'],
      estimatedCompetition: Math.floor(Math.random() * 10) + 5,
      successProbability: Math.round((Math.random() * 0.3 + 0.5) * 100) / 100,
    }));
    return simulateLatency(items);
  },
  async getBidderRecommendations() { return simulateLatency([{ name: 'Bidder A', score: 0.82 }, { name: 'Bidder B', score: 0.76 }] as any); },
  async updatePreferences() { return simulateLatency(undefined); },
  async getContentSuggestions() { return simulateLatency(['Use modern materials', 'Highlight safety compliance']); },
  async getSimilarTenders() { return simulateLatency(demoTenders.slice(0, 3)); },
  async getTrendingTopics() { return simulateLatency([{ keyword: 'Sustainability', frequency: 124, growth: 18, category: 'Construction' }]); },
  async getMarketInsights() { return simulateLatency({ competitionLevel: 'medium' as const, averageBudget: 120000, successFactors: ['Experience', 'Cost'], topSkills: ['PM', 'Civ Eng'], marketTrends: ['Green building'] }); },
  async getLearningRecommendations() { return simulateLatency([{ title: 'Winning Proposals 101', description: 'Basics of proposal writing', category: 'Proposal', difficulty: 'beginner' as const, estimatedTime: '2h' }]); },
  async rateRecommendation() { return simulateLatency(undefined); },
  async getRecommendationMetrics() { return simulateLatency({ accuracy: 0.81, clickThroughRate: 0.24, conversionRate: 0.12, totalRecommendations: 320, successfulRecommendations: 38 }); },
};

export const mockPaymentService = {
  async getSubscriptionPlans() { return simulateLatency(demoPlans); },
  async createSubscription() { return simulateLatency({ subscription: { id: 'sub_demo', status: 'active' }, user: demoUser }); },
  async getSubscriptionStatus() { return simulateLatency({ subscription: { id: 'sub_demo', status: 'active', planId: 'premium' }, usage: { proposalsGenerated: 18, proposalsLimit: 50, resetDate: new Date(Date.now() + 12 * 24 * 3600 * 1000) } }); },
  async cancelSubscription() { return simulateLatency(undefined); },
  async updateSubscription() { return simulateLatency({ status: 'active' }); },
  async getPaymentHistory() { return simulateLatency({ payments: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 } }); },
  async updatePaymentMethod() { return simulateLatency(undefined); },
  async getInvoice() { return simulateLatency({ id: 'inv_demo' }); },
  async downloadInvoice() { return simulateLatency(undefined); },
  async getBillingPortalUrl() { return simulateLatency('https://example.com/billing'); },
  async validatePromoCode() { return simulateLatency({ valid: true, discount: 20, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) }); },
  async applyPromoCode() { return simulateLatency(undefined); },
  async getUsageStats() { return simulateLatency({ currentPeriod: { proposalsGenerated: 18, proposalsLimit: 50, periodStart: new Date(Date.now() - 15 * 24 * 3600 * 1000), periodEnd: new Date(Date.now() + 15 * 24 * 3600 * 1000) }, historical: [{ month: 'Jan', proposalsGenerated: 22, cost: 79 }, { month: 'Feb', proposalsGenerated: 18, cost: 79 }] }); },
};


