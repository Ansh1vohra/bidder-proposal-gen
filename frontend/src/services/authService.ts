import { apiClient } from './apiClient';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthTokens, 
  ApiResponse 
} from '../types';

export class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response: ApiResponse<{ user: User; tokens: AuthTokens }> = await apiClient.post('/auth/login', credentials);
    
    if (response.success && response.data) {
      apiClient.setTokens(response.data.tokens);
      return response.data;
    }
    
    throw new Error(response.message || 'Login failed');
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response: ApiResponse<{ user: User; tokens: AuthTokens }> = await apiClient.post('/auth/register', userData);
    
    if (response.success && response.data) {
      apiClient.setTokens(response.data.tokens);
      return response.data;
    }
    
    throw new Error(response.message || 'Registration failed');
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server request fails
      console.warn('Logout request failed:', error);
    } finally {
      apiClient.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response: ApiResponse<User> = await apiClient.get('/auth/profile');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get user profile');
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response: ApiResponse<AuthTokens> = await apiClient.post('/auth/refresh', {
      refreshToken,
    });
    
    if (response.success && response.data) {
      apiClient.setTokens(response.data);
      return response.data;
    }
    
    throw new Error(response.message || 'Token refresh failed');
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const response: ApiResponse = await apiClient.post('/auth/forgot-password', { email });
    
    if (!response.success) {
      throw new Error(response.message || 'Password reset request failed');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response: ApiResponse = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Password reset failed');
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response: ApiResponse = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Password change failed');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    const response: ApiResponse = await apiClient.post('/auth/verify-email', { token });
    
    if (!response.success) {
      throw new Error(response.message || 'Email verification failed');
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    const response: ApiResponse = await apiClient.post('/auth/resend-verification');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to resend verification email');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Store user data locally
   */
  storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear stored user data
   */
  clearStoredUser(): void {
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();
