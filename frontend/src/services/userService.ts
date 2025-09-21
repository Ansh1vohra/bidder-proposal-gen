import { apiClient } from './apiClient';
import { User, ApiResponse } from '../types';

export class UserService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response: ApiResponse<User> = await apiClient.get('/users/profile');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get user profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response: ApiResponse<User> = await apiClient.put('/users/profile', updates);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update profile');
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const response: ApiResponse<{ profilePictureUrl: string }> = await apiClient.uploadFile(
      '/users/profile-picture',
      file,
      onProgress
    );
    
    if (response.success && response.data) {
      return response.data.profilePictureUrl;
    }
    
    throw new Error(response.message || 'Failed to upload profile picture');
  }

  /**
   * Update company information
   */
  async updateCompanyInfo(companyData: {
    companyName?: string;
    website?: string;
    industry?: string;
    employeeCount?: string;
    description?: string;
    specializations?: string[];
  }): Promise<User> {
    const response: ApiResponse<User> = await apiClient.put('/users/company', companyData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update company information');
  }

  /**
   * Update skills and experience
   */
  async updateSkillsAndExperience(data: {
    skills?: string[];
    experience?: string[];
    certifications?: string[];
    portfolio?: any[];
  }): Promise<User> {
    const response: ApiResponse<User> = await apiClient.put('/users/skills', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update skills and experience');
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: {
    email?: boolean;
    push?: boolean;
    frequency?: 'immediate' | 'daily' | 'weekly';
  }): Promise<User> {
    const response: ApiResponse<User> = await apiClient.put('/users/notifications', preferences);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update notification preferences');
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: {
    preferredIndustries?: string[];
    locationPreferences?: string[];
    budgetRange?: { min: number; max: number };
    language?: string;
    timezone?: string;
  }): Promise<User> {
    const response: ApiResponse<User> = await apiClient.put('/users/preferences', preferences);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update preferences');
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalProposals: number;
    acceptedProposals: number;
    successRate: number;
    totalTenders: number;
    activeTenders: number;
    totalValue: number;
    joinedDate: Date;
    lastActivity: Date;
  }> {
    const response: ApiResponse<any> = await apiClient.get('/users/stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get user statistics');
  }

  /**
   * Get user activity log
   */
  async getActivityLog(page: number = 1, limit: number = 20): Promise<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: Date;
      metadata?: any;
    }>;
    pagination: any;
  }> {
    const response: ApiResponse<any> = await apiClient.get(
      `/users/activity?page=${page}&limit=${limit}`
    );
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get activity log');
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    const response: ApiResponse = await apiClient.delete('/users/account', {
      data: { password }
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete account');
    }
  }

  /**
   * Export user data
   */
  async exportUserData(): Promise<void> {
    await apiClient.downloadFile('/users/export-data', 'user-data-export.json');
  }

  /**
   * Get API usage statistics
   */
  async getApiUsage(): Promise<{
    currentMonth: {
      requests: number;
      limit: number;
    };
    lastMonth: {
      requests: number;
    };
    apiKey?: string;
  }> {
    const response: ApiResponse<any> = await apiClient.get('/users/api-usage');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get API usage');
  }

  /**
   * Generate new API key
   */
  async generateApiKey(): Promise<string> {
    const response: ApiResponse<{ apiKey: string }> = await apiClient.post('/users/generate-api-key');
    
    if (response.success && response.data) {
      return response.data.apiKey;
    }
    
    throw new Error(response.message || 'Failed to generate API key');
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(): Promise<void> {
    const response: ApiResponse = await apiClient.delete('/users/api-key');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to revoke API key');
    }
  }
}

export const userService = new UserService();
