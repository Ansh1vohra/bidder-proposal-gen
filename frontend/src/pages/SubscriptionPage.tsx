import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  CreditCard as CreditCardIcon,
  History as HistoryIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

// Types for subscription plans
interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: PlanFeature[];
  recommended?: boolean;
  priceId: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  description: string;
  invoiceUrl?: string;
}

const SubscriptionPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Subscription plans configuration
  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Perfect for getting started',
      priceId: '',
      features: [
        { text: '3 proposal generations per month', included: true },
        { text: 'Basic tender matching', included: true },
        { text: 'Email support', included: true },
        { text: 'Advanced analytics', included: false },
        { text: 'Priority support', included: false },
        { text: 'Custom templates', included: false },
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 29.99,
      period: 'month',
      description: 'For growing businesses',
      priceId: process.env.REACT_APP_STRIPE_BASIC_PRICE_ID || 'price_basic',
      features: [
        { text: '25 proposal generations per month', included: true },
        { text: 'Advanced tender matching', included: true },
        { text: 'Email support', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Priority support', included: false },
        { text: 'Custom templates', included: false },
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99.99,
      period: 'month',
      description: 'For established companies',
      priceId: process.env.REACT_APP_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
      recommended: true,
      features: [
        { text: '100 proposal generations per month', included: true },
        { text: 'Advanced tender matching', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Phone support', included: true },
        { text: '5 custom templates', included: true },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299.99,
      period: 'month',
      description: 'For large organizations',
      priceId: process.env.REACT_APP_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
      features: [
        { text: 'Unlimited proposal generations', included: true },
        { text: 'Advanced tender matching', included: true },
        { text: '24/7 phone & email support', included: true },
        { text: 'Advanced analytics & reporting', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Unlimited custom templates', included: true },
      ],
    },
  ];

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payments/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan.id === 'free') return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          planName: plan.name.toLowerCase(),
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.url;
      } else {
        showNotification('error', 'Subscription Error', data.message || 'Failed to create subscription');
      }
    } catch (error) {
      showNotification('error', 'Subscription Error', 'Failed to process subscription');
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.subscription?.subscriptionId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          subscriptionId: user.subscription.subscriptionId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('success', 'Success', 'Subscription cancelled successfully');
        // Update user data
        updateUser({
          subscription: {
            ...user.subscription,
            status: 'cancelled'
          }
        });
      } else {
        showNotification('error', 'Cancellation Error', data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      showNotification('error', 'Cancellation Error', 'Failed to cancel subscription');
      console.error('Cancel subscription error:', error);
    } finally {
      setLoading(false);
      setShowCancelDialog(false);
    }
  };

  const getUsagePercentage = () => {
    if (!user?.subscription?.usage) return 0;
    const { proposalsGenerated, monthlyLimit } = user.subscription.usage;
    if (monthlyLimit === 0) return 0; // Unlimited
    return Math.min((proposalsGenerated / monthlyLimit) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Subscription Management
      </Typography>

      {/* Current Subscription Status */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Current Plan</Typography>
            <Chip 
              label={user?.subscription?.currentPlan?.toUpperCase() || 'FREE'} 
              color={user?.subscription?.currentPlan === 'free' ? 'default' : 'primary'}
              size="medium"
            />
          </Box>
          
          {user?.subscription && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Status: <strong>{user.subscription.status}</strong>
              </Typography>
              
              {user.subscription.usage && (
                <Box mt={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">
                      Proposals Generated This Month
                    </Typography>
                    <Typography variant="body2">
                      {user.subscription.usage.proposalsGenerated} / {user.subscription.usage.monthlyLimit === 0 ? '∞' : user.subscription.usage.monthlyLimit}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={getUsagePercentage()} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
              
              {user.subscription.currentPlan !== 'free' && (
                <Box mt={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setShowCancelDialog(true)}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Available Plans
      </Typography>
      
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        {plans.map((plan) => (
          <Box key={plan.id}>
            <Card 
              sx={{ 
                height: '100%', 
                position: 'relative',
                border: plan.recommended ? 2 : 1,
                borderColor: plan.recommended ? 'primary.main' : 'divider',
                '&:hover': {
                  boxShadow: 4,
                }
              }}
            >
              {plan.recommended && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <StarIcon fontSize="small" />
                  Recommended
                </Box>
              )}
              
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {plan.name}
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="h4" component="span" sx={{ fontWeight: 'bold' }}>
                    ${plan.price}
                  </Typography>
                  <Typography variant="body2" component="span" color="text.secondary">
                    /{plan.period}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                  {plan.description}
                </Typography>
                
                <List sx={{ flexGrow: 1, py: 0 }}>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon 
                          fontSize="small" 
                          color={feature.included ? 'success' : 'disabled'}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature.text}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: feature.included ? 'text.primary' : 'text.disabled',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Button
                  variant={plan.id === user?.subscription?.currentPlan ? 'outlined' : 'contained'}
                  fullWidth
                  disabled={plan.id === user?.subscription?.currentPlan || loading}
                  onClick={() => handleSubscribe(plan)}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : plan.id === user?.subscription?.currentPlan ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Free Plan'
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <HistoryIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Payment History</Typography>
            </Box>
            
            {paymentHistory.map((payment) => (
              <Box key={payment.id}>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={2}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {payment.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(payment.date)}
                    </Typography>
                  </Box>
                  
                  <Box textAlign="right">
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ${payment.amount / 100} {payment.currency.toUpperCase()}
                    </Typography>
                    <Chip 
                      label={payment.status}
                      size="small"
                      color={payment.status === 'paid' ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                <Divider />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
          </Alert>
          <Typography variant="body2">
            Your subscription will remain active until the end of your current billing period, and you won't be charged again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)} disabled={loading}>
            Keep Subscription
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionPage;
