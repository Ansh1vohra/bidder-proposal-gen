import { apiClient } from './apiClient';
import { 
  TenderRecommendation, 
  BidderRecommendation, 
  ApiResponse 
} from '../types';

export class RecommendationService {
  /**
   * Get personalized tender recommendations
   */
  async getTenderRecommendations(
    limit: number = 10,
    industries?: string[],
    locations?: string[],
    budgetMin?: number,
    budgetMax?: number,
    algorithm: 'similarity' | 'history' | 'hybrid' = 'hybrid'
  ): Promise<TenderRecommendation[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      algorithm,
    });
    
    if (industries?.length) {
      params.append('industries', industries.join(','));
    }
    
    if (locations?.length) {
      params.append('locations', locations.join(','));
    }
    
    if (budgetMin) {
      params.append('budgetMin', budgetMin.toString());
    }
    
    if (budgetMax) {
      params.append('budgetMax', budgetMax.toString());
    }

    const response: ApiResponse<{ recommendations: TenderRecommendation[] }> = 
      await apiClient.get(`/recommendations/tenders?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data.recommendations;
    }
    
    throw new Error(response.message || 'Failed to get tender recommendations');
  }

  /**
   * Get bidder recommendations for a tender
   */
  async getBidderRecommendations(
    tenderId: string,
    limit: number = 10,
    minExperience?: number,
    industries?: string[]
  ): Promise<BidderRecommendation[]> {
    const params = new URLSearchParams({
      tenderId,
      limit: limit.toString(),
    });
    
    if (minExperience) {
      params.append('minExperience', minExperience.toString());
    }
    
    if (industries?.length) {
      params.append('industries', industries.join(','));
    }

    const response: ApiResponse<{ recommendations: BidderRecommendation[] }> = 
      await apiClient.get(`/recommendations/bidders?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data.recommendations;
    }
    
    throw new Error(response.message || 'Failed to get bidder recommendations');
  }

  /**
   * Update user preferences for better recommendations
   */
  async updatePreferences(preferences: {
    industries?: string[];
    locations?: string[];
    budgetRange?: { min: number; max: number };
    skills?: string[];
    experience?: string[];
  }): Promise<void> {
    const response: ApiResponse = await apiClient.post('/recommendations/update-preferences', preferences);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update preferences');
    }
  }

  /**
   * Get AI-powered content suggestions for proposal sections
   */
  async getContentSuggestions(
    tenderId: string,
    section: string,
    currentContent?: string,
    context?: any
  ): Promise<string[]> {
    const response: ApiResponse<{ suggestions: string[] }> = await apiClient.post('/recommendations/content-suggestions', {
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
   * Get similar tenders based on content analysis
   */
  async getSimilarTenders(tenderId: string, limit: number = 5): Promise<any[]> {
    const response: ApiResponse<{ tenders: any[] }> = await apiClient.get(
      `/recommendations/similar-tenders/${tenderId}?limit=${limit}`
    );
    
    if (response.success && response.data) {
      return response.data.tenders;
    }
    
    throw new Error(response.message || 'Failed to get similar tenders');
  }

  /**
   * Get trending keywords and topics
   */
  async getTrendingTopics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<Array<{
    keyword: string;
    frequency: number;
    growth: number;
    category: string;
  }>> {
    const response: ApiResponse<{ topics: any[] }> = await apiClient.get(
      `/recommendations/trending-topics?timeframe=${timeframe}`
    );
    
    if (response.success && response.data) {
      return response.data.topics;
    }
    
    throw new Error(response.message || 'Failed to get trending topics');
  }

  /**
   * Get market insights and competition analysis
   */
  async getMarketInsights(industry?: string, location?: string): Promise<{
    competitionLevel: 'low' | 'medium' | 'high';
    averageBudget: number;
    successFactors: string[];
    topSkills: string[];
    marketTrends: string[];
  }> {
    const params = new URLSearchParams();
    if (industry) params.append('industry', industry);
    if (location) params.append('location', location);

    const response: ApiResponse<any> = await apiClient.get(
      `/recommendations/market-insights?${params.toString()}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get market insights');
  }

  /**
   * Get personalized learning recommendations
   */
  async getLearningRecommendations(): Promise<Array<{
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
    url?: string;
  }>> {
    const response: ApiResponse<{ recommendations: any[] }> = await apiClient.get('/recommendations/learning');
    
    if (response.success && response.data) {
      return response.data.recommendations;
    }
    
    throw new Error(response.message || 'Failed to get learning recommendations');
  }

  /**
   * Rate a recommendation (for improving AI)
   */
  async rateRecommendation(
    recommendationId: string,
    rating: number,
    feedback?: string
  ): Promise<void> {
    const response: ApiResponse = await apiClient.post('/recommendations/rate', {
      recommendationId,
      rating,
      feedback,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to rate recommendation');
    }
  }

  /**
   * Get recommendation performance metrics
   */
  async getRecommendationMetrics(): Promise<{
    accuracy: number;
    clickThroughRate: number;
    conversionRate: number;
    totalRecommendations: number;
    successfulRecommendations: number;
  }> {
    const response: ApiResponse<any> = await apiClient.get('/recommendations/metrics');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get recommendation metrics');
  }
}

export const recommendationService = new RecommendationService();
