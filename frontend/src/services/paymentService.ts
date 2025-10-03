import { apiClient } from './apiClient';
import { IS_DEMO } from '../config/appConfig';
import { mockPaymentService } from './mocks/mockServices';
import { 
  Payment, 
  SubscriptionPlan, 
  ApiResponse, 
  User 
} from '../types';

export class PaymentService {
  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (IS_DEMO) return mockPaymentService.getSubscriptionPlans();
    // Fallback to demo plans if backend is not used
    return mockPaymentService.getSubscriptionPlans();
  }

  /**
   * Create subscription
   */
  async createSubscription(
    planId: string, 
    paymentMethodId: string, 
    billingPeriod: 'monthly' | 'yearly' = 'monthly'
  ): Promise<{ 
    subscription: any; 
    paymentIntent?: any; 
    user: User;
  }> {
    if (IS_DEMO) return mockPaymentService.createSubscription();
    const response: ApiResponse<{ 
      subscription: any; 
      paymentIntent?: any; 
      user: User;
    }> = await apiClient.post('/payments/create-subscription', {
      planId,
      paymentMethodId,
      billingPeriod,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create subscription');
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(): Promise<{
    subscription: any;
    usage: {
      proposalsGenerated: number;
      proposalsLimit: number;
      resetDate: Date;
    };
  }> {
    if (IS_DEMO) return mockPaymentService.getSubscriptionStatus();
    const response: ApiResponse<any> = await apiClient.get('/payments/subscription-status');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get subscription status');
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    if (IS_DEMO) return mockPaymentService.cancelSubscription();
    const response: ApiResponse = await apiClient.post('/payments/cancel-subscription');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    newPlanId: string, 
    billingPeriod: 'monthly' | 'yearly' = 'monthly'
  ): Promise<any> {
    if (IS_DEMO) return mockPaymentService.updateSubscription();
    const response: ApiResponse<any> = await apiClient.post('/payments/update-subscription', {
      planId: newPlanId,
      billingPeriod,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to update subscription');
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(page: number = 1, limit: number = 10): Promise<{
    payments: Payment[];
    pagination: any;
  }> {
    if (IS_DEMO) return mockPaymentService.getPaymentHistory();
    const response: ApiResponse<{
      payments: Payment[];
      pagination: any;
    }> = await apiClient.get(`/payments/history?page=${page}&limit=${limit}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get payment history');
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(paymentMethodId: string): Promise<void> {
    if (IS_DEMO) return mockPaymentService.updatePaymentMethod();
    const response: ApiResponse = await apiClient.post('/payments/update-payment-method', {
      paymentMethodId,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update payment method');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    if (IS_DEMO) return mockPaymentService.getInvoice();
    const response: ApiResponse<any> = await apiClient.get(`/payments/invoice/${invoiceId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get invoice');
  }

  /**
   * Download invoice
   */
  async downloadInvoice(invoiceId: string): Promise<void> {
    if (IS_DEMO) return mockPaymentService.downloadInvoice();
    await apiClient.downloadFile(`/payments/invoice/${invoiceId}/download`, `invoice-${invoiceId}.pdf`);
  }

  /**
   * Get billing portal URL (for Stripe Customer Portal)
   */
  async getBillingPortalUrl(): Promise<string> {
    if (IS_DEMO) return mockPaymentService.getBillingPortalUrl();
    const response: ApiResponse<{ url: string }> = await apiClient.post('/payments/billing-portal');
    
    if (response.success && response.data) {
      return response.data.url;
    }
    
    throw new Error(response.message || 'Failed to get billing portal URL');
  }

  /**
   * Validate promotion code
   */
  async validatePromoCode(code: string): Promise<{
    valid: boolean;
    discount: number;
    expiresAt?: Date;
  }> {
    if (IS_DEMO) return mockPaymentService.validatePromoCode();
    const response: ApiResponse<any> = await apiClient.post('/payments/validate-promo', { code });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to validate promotion code');
  }

  /**
   * Apply promotion code to subscription
   */
  async applyPromoCode(code: string): Promise<void> {
    if (IS_DEMO) return mockPaymentService.applyPromoCode();
    const response: ApiResponse = await apiClient.post('/payments/apply-promo', { code });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to apply promotion code');
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    currentPeriod: {
      proposalsGenerated: number;
      proposalsLimit: number;
      periodStart: Date;
      periodEnd: Date;
    };
    historical: Array<{
      month: string;
      proposalsGenerated: number;
      cost: number;
    }>;
  }> {
    if (IS_DEMO) return mockPaymentService.getUsageStats();
    const response: ApiResponse<any> = await apiClient.get('/payments/usage-stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get usage statistics');
  }
}

export const paymentService = new PaymentService();
