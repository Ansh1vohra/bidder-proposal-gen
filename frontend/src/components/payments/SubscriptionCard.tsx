import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Star,
  CheckCircle,
  Cancel,
  Upgrade,
  Info,
  AccessTime,
  TrendingUp,
  Security,
  Speed,
  Support,
} from '@mui/icons-material';
import { User } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

interface SubscriptionCardProps {
  user: User;
  onUpgrade?: () => void;
  onManage?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

const planDetails = {
  free: {
    name: 'Free Plan',
    color: 'default' as const,
    features: [
      '3 proposals per month',
      'Basic AI suggestions',
      'Email support',
      'Standard templates'
    ],
    limitations: [
      'Limited tender recommendations',
      'No priority support',
      'No custom branding'
    ]
  },
  basic: {
    name: 'Basic Plan',
    color: 'primary' as const,
    features: [
      '25 proposals per month',
      'Enhanced AI recommendations',
      'Priority email support',
      'Custom templates',
      'Basic analytics'
    ],
    limitations: [
      'Limited customization',
      'No phone support'
    ]
  },
  professional: {
    name: 'Professional Plan',
    color: 'secondary' as const,
    features: [
      '100 proposals per month',
      'Advanced AI insights',
      'Phone & email support',
      'Custom branding',
      'Advanced analytics',
      'Export capabilities',
      'Team collaboration'
    ],
    limitations: []
  },
  enterprise: {
    name: 'Enterprise Plan',
    color: 'warning' as const,
    features: [
      'Unlimited proposals',
      'Custom AI training',
      'Dedicated support manager',
      'White-label solution',
      'Advanced integrations',
      'Custom workflows',
      'SLA guarantees',
      'On-premise deployment'
    ],
    limitations: []
  }
};

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  user,
  onUpgrade,
  onManage,
  onCancel,
  showActions = true,
}) => {
  const subscription = user.subscription;
  const plan = planDetails[subscription.currentPlan];
  
  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active':
        return 'success';
      case 'past_due':
      case 'unpaid':
        return 'warning';
      case 'cancelled':
      case 'incomplete':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (subscription.status) {
      case 'active':
        return <CheckCircle />;
      case 'past_due':
      case 'unpaid':
        return <AccessTime />;
      case 'cancelled':
      case 'incomplete':
        return <Cancel />;
      default:
        return <Info />;
    }
  };

  const getUsagePercentage = () => {
    if (subscription.usage.monthlyLimit === 0) return 0;
    return (subscription.usage.proposalsGenerated / subscription.usage.monthlyLimit) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'primary';
  };

  const isExpiringSoon = () => {
    if (!subscription.endDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7;
  };

  const canUpgrade = () => {
    return subscription.currentPlan !== 'enterprise' && subscription.status === 'active';
  };

  return (
    <Card sx={{ height: 'fit-content' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Current Subscription
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={plan.name}
                  color={plan.color}
                  icon={subscription.currentPlan === 'enterprise' ? <Star /> : undefined}
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={subscription.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor()}
                  icon={getStatusIcon()}
                  size="small"
                />
              </Stack>
            </Box>
            
            {subscription.currentPlan !== 'free' && (
              <Tooltip title="Manage subscription">
                <IconButton onClick={onManage} size="small">
                  <Info />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Expiry Warning */}
          {isExpiringSoon() && subscription.endDate && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Your subscription expires on {formatDate(subscription.endDate)}.
                {' '}
                <Button size="small" onClick={onUpgrade}>
                  Renew now
                </Button>
              </Typography>
            </Alert>
          )}

          {/* Past Due Alert */}
          {subscription.status === 'past_due' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Your payment is past due. Please update your payment method to continue using the service.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Usage Progress */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Proposals Usage
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subscription.usage.proposalsGenerated} / {subscription.usage.monthlyLimit === 0 ? '∞' : subscription.usage.monthlyLimit}
            </Typography>
          </Stack>
          
          {subscription.usage.monthlyLimit > 0 ? (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.min(getUsagePercentage(), 100)}
                color={getUsageColor()}
                sx={{ mb: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {subscription.usage.monthlyLimit - subscription.usage.proposalsGenerated > 0
                  ? `${subscription.usage.monthlyLimit - subscription.usage.proposalsGenerated} proposals remaining`
                  : 'Usage limit reached'}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              ✓ Unlimited proposals
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Features */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Plan Features
          </Typography>
          <List dense>
            {plan.features.map((feature: string, index: number) => (
              <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={feature}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Validity Period */}
        {subscription.endDate && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Valid until: {formatDate(subscription.endDate)}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        {showActions && (
          <Stack spacing={1}>
            {canUpgrade() && (
              <Button
                variant="contained"
                startIcon={<Upgrade />}
                onClick={onUpgrade}
                fullWidth
              >
                Upgrade Plan
              </Button>
            )}
            
            {subscription.currentPlan !== 'free' && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={onManage}
                  size="small"
                  fullWidth
                >
                  Manage
                </Button>
                
                {subscription.status === 'active' && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={onCancel}
                    size="small"
                    fullWidth
                  >
                    Cancel
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        )}

        {/* Plan Comparison Link */}
        {subscription.currentPlan === 'free' && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Need more features?{' '}
              <Button size="small" onClick={onUpgrade}>
                Compare plans
              </Button>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
