import { apiClient } from './apiClient';
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
    const plans: SubscriptionPlan[] = [
      {
        id: 'free',
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        features: [
          'View watermarked proposal demos',
          'Basic tender search',
          'Limited tender recommendations',
          'Community support'
        ],
        proposalsLimit: 0
      },
      {
        id: 'basic',
        name: 'Basic',
        price: { monthly: 29, yearly: 290 },
        features: [
          'Generate up to 10 proposals/month',
          'Download proposals in PDF/DOCX',
          'Advanced tender search',
          'AI-powered recommendations',
          'Email support'
        ],
        proposalsLimit: 10
      },
      {
        id: 'premium',
        name: 'Premium',
        price: { monthly: 79, yearly: 790 },
        features: [
          'Generate up to 50 proposals/month',
          'All Basic features',
          'Custom proposal templates',
          'Advanced analytics',
          'Priority support',
          'API access'
        ],
        proposalsLimit: 50,
        popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: { monthly: 199, yearly: 1990 },
        features: [
          'Unlimited proposals',
          'All Premium features',
          'White-label solution',
          'Custom integrations',
          'Dedicated account manager',
          'SLA guarantee'
        ],
        proposalsLimit: -1 // unlimited
      }
    ];

    return plans;
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
    await apiClient.downloadFile(`/payments/invoice/${invoiceId}/download`, `invoice-${invoiceId}.pdf`);
  }

  /**
   * Get billing portal URL (for Stripe Customer Portal)
   */
  async getBillingPortalUrl(): Promise<string> {
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
    const response: ApiResponse<any> = await apiClient.get('/payments/usage-stats');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to get usage statistics');
  }
}

export const paymentService = new PaymentService();
