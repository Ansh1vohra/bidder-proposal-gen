import { apiClient } from './apiClient';
import { 
  Proposal, 
  ApiResponse, 
  ProposalAnalytics 
} from '../types';
import { IS_DEMO } from '../config/appConfig';
import { mockProposalService } from './mocks/mockServices';

export class ProposalService {
  /**
   * Generate AI proposal for a tender
   */
  async generateProposal(
    tenderId: string, 
    userRequirements?: any, 
    customSections?: any[]
  ): Promise<Proposal> {
    if (IS_DEMO) return mockProposalService.generateProposal();
    const response: ApiResponse<{ proposal: Proposal }> = await apiClient.post('/proposals/generate', {
      tenderId,
      userRequirements,
      customSections,
    });
    
    if (response.success && response.data) {
      return response.data.proposal;
    }
    
    throw new Error(response.message || 'Failed to generate proposal');
  }

  /**
   * Generate watermarked demo proposal for free users
   */
  async generateWatermarkedDemo(tenderId: string): Promise<Proposal> {
    if (IS_DEMO) return mockProposalService.generateWatermarkedDemo();
    const response: ApiResponse<{ proposal: Proposal }> = await apiClient.post('/proposals/generate-demo', {
      tenderId,
    });
    
    if (response.success && response.data) {
      return response.data.proposal;
    }
    
    throw new Error(response.message || 'Failed to generate demo proposal');
  }

  /**
   * Get user's proposals
   */
  async getProposals(
    page: number = 1, 
    limit: number = 10, 
    status?: string,
    tenderId?: string
  ): Promise<{
    proposals: Proposal[];
    pagination: any;
  }> {
    if (IS_DEMO) return mockProposalService.getProposals();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    if (tenderId) params.append('tenderId', tenderId);

    const response: ApiResponse<{
      proposals: Proposal[];
      pagination: any;
    }> = await apiClient.get(`/proposals?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch proposals');
  }

  /**
   * Get proposal by ID
   */
  async getProposalById(id: string): Promise<Proposal> {
    if (IS_DEMO) return mockProposalService.getProposalById(id);
    const response: ApiResponse<{ proposal: Proposal }> = await apiClient.get(`/proposals/${id}`);
    
    if (response.success && response.data) {
      return response.data.proposal;
    }
    
    throw new Error(response.message || 'Failed to fetch proposal');
  }

  /**
   * Update proposal content
   */
  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
    if (IS_DEMO) return mockProposalService.updateProposal(id, updates);
    const response: ApiResponse<{ proposal: Proposal }> = await apiClient.put(`/proposals/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.proposal;
    }
    
    throw new Error(response.message || 'Failed to update proposal');
  }

  /**
   * Submit proposal
   */
  async submitProposal(id: string): Promise<Proposal> {
    if (IS_DEMO) return mockProposalService.submitProposal(id);
    const response: ApiResponse<{ proposal: Proposal }> = await apiClient.post(`/proposals/${id}/submit`);
    
    if (response.success && response.data) {
      return response.data.proposal;
    }
    
    throw new Error(response.message || 'Failed to submit proposal');
  }

  /**
   * Withdraw proposal
   */
  async withdrawProposal(id: string): Promise<Proposal> {
    if (IS_DEMO) return mockProposalService.withdrawProposal(id);
    const response: ApiResponse<{ proposal: Proposal }> = await apiClient.post(`/proposals/${id}/withdraw`);
    
    if (response.success && response.data) {
      return response.data.proposal;
    }
    
    throw new Error(response.message || 'Failed to withdraw proposal');
  }

  /**
   * Delete proposal
   */
  async deleteProposal(id: string): Promise<void> {
    if (IS_DEMO) return mockProposalService.deleteProposal();
    const response: ApiResponse = await apiClient.delete(`/proposals/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete proposal');
    }
  }

  /**
   * Download proposal as PDF
   */
  async downloadProposal(id: string, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
    if (IS_DEMO) return mockProposalService.downloadProposal();
    await apiClient.downloadFile(`/proposals/${id}/download?format=${format}`, `proposal-${id}.${format}`);
  }

  /**
   * Get proposal analytics
   */
  async getProposalAnalytics(): Promise<ProposalAnalytics> {
    if (IS_DEMO) return mockProposalService.getProposalAnalytics();
    const response: ApiResponse<ProposalAnalytics> = await apiClient.get('/proposals/analytics');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch proposal analytics');
  }

  /**
   * Get proposal templates
   */
  async getTemplates(): Promise<any[]> {
    if (IS_DEMO) return mockProposalService.getTemplates();
    const response: ApiResponse<{ templates: any[] }> = await apiClient.get('/proposals/templates');
    
    if (response.success && response.data) {
      return response.data.templates;
    }
    
    throw new Error(response.message || 'Failed to fetch templates');
  }

  /**
   * Save proposal as template
   */
  async saveAsTemplate(proposalId: string, templateName: string): Promise<any> {
    if (IS_DEMO) return mockProposalService.saveAsTemplate();
    const response: ApiResponse<{ template: any }> = await apiClient.post(`/proposals/${proposalId}/save-template`, {
      name: templateName,
    });
    
    if (response.success && response.data) {
      return response.data.template;
    }
    
    throw new Error(response.message || 'Failed to save template');
  }

  /**
   * Get proposal feedback/evaluation
   */
  async getProposalFeedback(id: string): Promise<any> {
    if (IS_DEMO) return mockProposalService.getProposalFeedback();
    const response: ApiResponse<any> = await apiClient.get(`/proposals/${id}/feedback`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch proposal feedback');
  }

  /**
   * Get proposal comparison with competitors
   */
  async getProposalComparison(proposalId: string): Promise<any> {
    if (IS_DEMO) return mockProposalService.getProposalComparison();
    const response: ApiResponse<any> = await apiClient.get(`/proposals/${proposalId}/comparison`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch proposal comparison');
  }

  /**
   * Get AI-powered content suggestions
   */
  async getContentSuggestions(
    tenderId: string, 
    section: string, 
    currentContent?: string,
    context?: any
  ): Promise<string[]> {
    if (IS_DEMO) return mockProposalService.getContentSuggestions();
    const response: ApiResponse<{ suggestions: string[] }> = await apiClient.post('/proposals/suggestions', {
      tenderId,
      section,
      currentContent,
      context,
    });
    
    if (response.success && response.data) {
      return response.data.suggestions;
    }
    
    throw new Error(response.message || 'Failed to get content suggestions');
  }

  /**
   * Optimize proposal content with AI
   */
  async optimizeContent(
    proposalId: string, 
    section: string, 
    content: string
  ): Promise<string> {
    if (IS_DEMO) return mockProposalService.optimizeContent();
    const response: ApiResponse<{ optimizedContent: string }> = await apiClient.post(`/proposals/${proposalId}/optimize`, {
      section,
      content,
    });
    
    if (response.success && response.data) {
      return response.data.optimizedContent;
    }
    
    throw new Error(response.message || 'Failed to optimize content');
  }
}

export const proposalService = new ProposalService();
