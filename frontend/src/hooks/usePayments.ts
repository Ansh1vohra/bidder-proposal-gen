import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => paymentService.getSubscriptionPlans(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => paymentService.getSubscriptionStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: ({
      planId,
      paymentMethodId,
      billingPeriod,
    }: {
      planId: string;
      paymentMethodId: string;
      billingPeriod?: 'monthly' | 'yearly';
    }) => paymentService.createSubscription(planId, paymentMethodId, billingPeriod),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      if (data.user) {
        updateUser(data.user);
      }
      showNotification(
        'success',
        'Subscription Created',
        'Your subscription has been created successfully.'
      );
    },
    onError: (error: Error) => {
      showNotification('error', 'Subscription Failed', error.message);
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: () => paymentService.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      showNotification(
        'success',
        'Subscription Cancelled',
        'Your subscription has been cancelled successfully.'
      );
    },
    onError: (error: Error) => {
      showNotification('error', 'Cancellation Failed', error.message);
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({
      newPlanId,
      billingPeriod,
    }: {
      newPlanId: string;
      billingPeriod?: 'monthly' | 'yearly';
    }) => paymentService.updateSubscription(newPlanId, billingPeriod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      showNotification(
        'success',
        'Subscription Updated',
        'Your subscription has been updated successfully.'
      );
    },
    onError: (error: Error) => {
      showNotification('error', 'Update Failed', error.message);
    },
  });
};

export const usePaymentHistory = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['payment-history', page, limit],
    queryFn: () => paymentService.getPaymentHistory(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (paymentMethodId: string) => paymentService.updatePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      showNotification(
        'success',
        'Payment Method Updated',
        'Your payment method has been updated successfully.'
      );
    },
    onError: (error: Error) => {
      showNotification('error', 'Update Failed', error.message);
    },
  });
};

export const useInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => paymentService.getInvoice(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDownloadInvoice = () => {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (invoiceId: string) => paymentService.downloadInvoice(invoiceId),
    onSuccess: () => {
      showNotification('success', 'Download Started', 'Invoice download has started.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Download Failed', error.message);
    },
  });
};

export const useBillingPortal = () => {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: () => paymentService.getBillingPortalUrl(),
    onSuccess: (url) => {
      window.open(url, '_blank');
    },
    onError: (error: Error) => {
      showNotification('error', 'Portal Access Failed', error.message);
    },
  });
};

export const useValidatePromoCode = () => {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (code: string) => paymentService.validatePromoCode(code),
    onError: (error: Error) => {
      showNotification('error', 'Invalid Code', error.message);
    },
  });
};

export const useApplyPromoCode = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (code: string) => paymentService.applyPromoCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      showNotification(
        'success',
        'Promo Code Applied',
        'Your promotion code has been applied successfully.'
      );
    },
    onError: (error: Error) => {
      showNotification('error', 'Application Failed', error.message);
    },
  });
};

export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usage-stats'],
    queryFn: () => paymentService.getUsageStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
