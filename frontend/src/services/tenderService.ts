import { apiClient } from './apiClient';
import { 
  Tender, 
  ApiResponse, 
  SearchFilters, 
  TenderAnalytics 
} from '../types';

export class TenderService {
  /**
   * Get all tenders with filtering and pagination
   */
  async getTenders(filters: SearchFilters = {}): Promise<{
    tenders: Tender[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.query) params.append('search', filters.query);
    if (filters.industry?.length) params.append('industry', filters.industry.join(','));
    if (filters.location?.length) params.append('location', filters.location.join(','));
    if (filters.budgetMin) params.append('budgetMin', filters.budgetMin.toString());
    if (filters.budgetMax) params.append('budgetMax', filters.budgetMax.toString());
    if (filters.status?.length) params.append('status', filters.status.join(','));
    if (filters.category?.length) params.append('category', filters.category.join(','));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response: ApiResponse<{
      tenders: Tender[];
      pagination: any;
    }> = await apiClient.get(`/tenders?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch tenders');
  }

  /**
   * Get tender by ID
   */
  async getTenderById(id: string): Promise<Tender> {
    const response: ApiResponse<{ tender: Tender }> = await apiClient.get(`/tenders/${id}`);
    
    if (response.success && response.data) {
      return response.data.tender;
    }
    
    throw new Error(response.message || 'Failed to fetch tender');
  }

  /**
   * Create new tender
   */
  async createTender(tenderData: Partial<Tender>): Promise<Tender> {
    const response: ApiResponse<{ tender: Tender }> = await apiClient.post('/tenders', tenderData);
    
    if (response.success && response.data) {
      return response.data.tender;
    }
    
    throw new Error(response.message || 'Failed to create tender');
  }

  /**
   * Update tender
   */
  async updateTender(id: string, updates: Partial<Tender>): Promise<Tender> {
    const response: ApiResponse<{ tender: Tender }> = await apiClient.put(`/tenders/${id}`, updates);
    
    if (response.success && response.data) {
      return response.data.tender;
    }
    
    throw new Error(response.message || 'Failed to update tender');
  }

  /**
   * Delete tender
   */
  async deleteTender(id: string): Promise<void> {
    const response: ApiResponse = await apiClient.delete(`/tenders/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete tender');
    }
  }

  /**
   * Search tenders with AI-powered search
   */
  async searchTenders(query: string, limit: number = 10): Promise<Tender[]> {
    const response: ApiResponse<{ tenders: Tender[] }> = await apiClient.post('/tenders/search', {
      query,
      limit,
    });
    
    if (response.success && response.data) {
      return response.data.tenders;
    }
    
    throw new Error(response.message || 'Search failed');
  }

  /**
   * Get trending tenders
   */
  async getTrendingTenders(limit: number = 10): Promise<Tender[]> {
    const response: ApiResponse<{ tenders: Tender[] }> = await apiClient.get(`/tenders/trending?limit=${limit}`);
    
    if (response.success && response.data) {
      return response.data.tenders;
    }
    
    throw new Error(response.message || 'Failed to fetch trending tenders');
  }

  /**
   * Get user's created tenders
   */
  async getMyTenders(page: number = 1, limit: number = 10, status?: string): Promise<{
    tenders: Tender[];
    pagination: any;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }

    const response: ApiResponse<{
      tenders: Tender[];
      pagination: any;
    }> = await apiClient.get(`/tenders/my?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch your tenders');
  }

  /**
   * Get tender analytics
   */
  async getTenderAnalytics(id: string): Promise<TenderAnalytics> {
    const response: ApiResponse<TenderAnalytics> = await apiClient.get(`/tenders/${id}/analytics`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch tender analytics');
  }

  /**
   * Close tender
   */
  async closeTender(id: string): Promise<Tender> {
    const response: ApiResponse<{ tender: Tender }> = await apiClient.post(`/tenders/${id}/close`);
    
    if (response.success && response.data) {
      return response.data.tender;
    }
    
    throw new Error(response.message || 'Failed to close tender');
  }

  /**
   * Get tender statistics
   */
  async getTenderStats(): Promise<{
    total: number;
    active: number;
    draft: number;
    closed: number;
    byIndustry: Array<{ industry: string; count: number }>;
    byLocation: Array<{ location: string; count: number }>;
  }> {
    const response: ApiResponse<any> = await apiClient.get('/tenders/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch tender statistics');
  }

  /**
   * Get tender categories
   */
  async getCategories(): Promise<string[]> {
    const response: ApiResponse<{ categories: string[] }> = await apiClient.get('/tenders/categories');
    
    if (response.success && response.data) {
      return response.data.categories;
    }
    
    throw new Error(response.message || 'Failed to fetch categories');
  }

  /**
   * Get tender industries
   */
  async getIndustries(): Promise<string[]> {
    const response: ApiResponse<{ industries: string[] }> = await apiClient.get('/tenders/industries');
    
    if (response.success && response.data) {
      return response.data.industries;
    }
    
    throw new Error(response.message || 'Failed to fetch industries');
  }
}

export const tenderService = new TenderService();
