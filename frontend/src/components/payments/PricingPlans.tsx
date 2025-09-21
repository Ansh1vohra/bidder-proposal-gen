import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Container,
} from '@mui/material';
import {
  Check,
  Star,
  TrendingUp,
  Security,
  Speed,
  Support,
  Business,
  Close,
} from '@mui/icons-material';
import { User } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';

interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

interface PlanData {
  id: 'free' | 'basic' | 'premium' | 'enterprise';
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  proposals: number;
  color: 'default' | 'primary' | 'secondary' | 'warning';
  popular?: boolean;
  features: PlanFeature[];
  badge?: string;
}

interface PricingPlansProps {
  currentUser?: User;
  onSelectPlan: (planId: string, isYearly: boolean) => void;
  loading?: boolean;
  showCurrentPlan?: boolean;
}

const plans: PlanData[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    proposals: 3,
    color: 'default',
    features: [
      { name: '3 proposals per month', included: true },
      { name: 'Basic AI suggestions', included: true },
      { name: 'Email support', included: true },
      { name: 'Standard templates', included: true },
      { name: 'Basic tender search', included: true },
      { name: 'Priority support', included: false },
      { name: 'Custom branding', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Team collaboration', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For growing businesses',
    monthlyPrice: 29,
    yearlyPrice: 290,
    proposals: 25,
    color: 'primary',
    features: [
      { name: '25 proposals per month', included: true },
      { name: 'Enhanced AI recommendations', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Custom templates', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Advanced tender search', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Phone support', included: false },
      { name: 'Team collaboration', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For established businesses',
    monthlyPrice: 79,
    yearlyPrice: 790,
    proposals: 100,
    color: 'secondary',
    popular: true,
    badge: 'Most Popular',
    features: [
      { name: '100 proposals per month', included: true },
      { name: 'Advanced AI insights', included: true },
      { name: 'Phone & email support', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Export capabilities', included: true },
      { name: 'Team collaboration (5 users)', included: true },
      { name: 'API access', included: true },
      { name: 'Priority processing', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    proposals: 0, // Unlimited
    color: 'warning',
    badge: 'Best Value',
    features: [
      { name: 'Unlimited proposals', included: true },
      { name: 'Custom AI training', included: true },
      { name: 'Dedicated support manager', included: true },
      { name: 'White-label solution', included: true },
      { name: 'Advanced integrations', included: true },
      { name: 'Custom workflows', included: true },
      { name: 'SLA guarantees', included: true },
      { name: 'On-premise deployment', included: true },
      { name: 'Unlimited team members', included: true },
    ],
  },
];

const PricingPlans: React.FC<PricingPlansProps> = ({
  currentUser,
  onSelectPlan,
  loading = false,
  showCurrentPlan = true,
}) => {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setConfirmDialog(true);
  };

  const handleConfirmSelection = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan, isYearly);
      setConfirmDialog(false);
      setSelectedPlan(null);
    }
  };

  const getCurrentPlanId = () => {
    return currentUser?.subscription?.currentPlan || 'free';
  };

  const isCurrentPlan = (planId: string) => {
    return showCurrentPlan && getCurrentPlanId() === planId;
  };

  const getYearlySavings = (plan: PlanData) => {
    if (plan.monthlyPrice === 0) return 0;
    const monthlyTotal = plan.monthlyPrice * 12;
    return monthlyTotal - plan.yearlyPrice;
  };

  const getPlanPrice = (plan: PlanData) => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Choose Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Select the perfect plan for your business needs
          </Typography>
          
          {/* Billing Toggle */}
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
            <Typography variant="body1" color={!isYearly ? 'primary' : 'text.secondary'}>
              Monthly
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isYearly}
                  onChange={(e) => setIsYearly(e.target.checked)}
                  color="primary"
                />
              }
              label=""
            />
            <Typography variant="body1" color={isYearly ? 'primary' : 'text.secondary'}>
              Yearly
            </Typography>
            {isYearly && (
              <Chip 
                label="Save up to 20%" 
                color="success" 
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Stack>
        </Box>

        {/* Plans Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          {plans.map((plan) => (
            <Card
              key={plan.id}
              sx={{
                position: 'relative',
                height: 'fit-content',
                border: plan.popular ? 2 : 1,
                borderColor: plan.popular ? 'primary.main' : 'divider',
                boxShadow: plan.popular ? 4 : 1,
                transform: plan.popular ? 'scale(1.05)' : 'none',
                '&:hover': {
                  boxShadow: 6,
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1.02)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                  }}
                >
                  <Chip
                    label={plan.badge}
                    color={plan.popular ? 'primary' : 'warning'}
                    size="small"
                    icon={plan.popular ? <Star /> : <TrendingUp />}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              )}

              <CardContent sx={{ p: 3 }}>
                {/* Plan Header */}
                <Box textAlign="center" sx={{ mb: 3 }}>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {plan.description}
                  </Typography>
                  
                  {/* Price */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{ fontWeight: 700, color: plan.color === 'default' ? 'text.primary' : `${plan.color}.main` }}
                    >
                      {plan.monthlyPrice === 0 ? 'Free' : formatCurrency(getPlanPrice(plan))}
                    </Typography>
                    {plan.monthlyPrice > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        per {isYearly ? 'year' : 'month'}
                      </Typography>
                    )}
                    {isYearly && plan.monthlyPrice > 0 && (
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                        Save {formatCurrency(getYearlySavings(plan))} per year
                      </Typography>
                    )}
                  </Box>

                  {/* Proposals */}
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {plan.proposals === 0 ? 'Unlimited' : plan.proposals} proposals/month
                  </Typography>
                </Box>

                {/* Features */}
                <List dense sx={{ mb: 3 }}>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        {feature.included ? (
                          <Check sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <Close sx={{ fontSize: 16, color: 'text.disabled' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.name}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: feature.included ? 'text.primary' : 'text.disabled',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Action Button */}
                <Button
                  variant={plan.popular ? 'contained' : 'outlined'}
                  color={plan.color === 'default' ? 'primary' : plan.color}
                  fullWidth
                  size="large"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading || isCurrentPlan(plan.id)}
                  sx={{ fontWeight: 600 }}
                >
                  {isCurrentPlan(plan.id)
                    ? 'Current Plan'
                    : plan.monthlyPrice === 0
                    ? 'Get Started'
                    : 'Choose Plan'}
                </Button>

                {isCurrentPlan(plan.id) && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    sx={{ display: 'block', textAlign: 'center', mt: 1, fontWeight: 600 }}
                  >
                    ✓ Currently Active
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Additional Info */}
        <Box textAlign="center" sx={{ mt: 6 }}>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
            <Typography variant="body2">
              All plans include a 14-day free trial. Cancel anytime. No setup fees.
            </Typography>
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            Need a custom solution?{' '}
            <Button size="small">Contact our sales team</Button>
          </Typography>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Confirm Plan Selection
          </DialogTitle>
          <DialogContent>
            {selectedPlanData && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  You're about to subscribe to the <strong>{selectedPlanData.name}</strong> plan.
                </Typography>
                
                <Box sx={{ my: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{selectedPlanData.name} Plan</Typography>
                    <Typography variant="h6" color="primary">
                      {selectedPlanData.monthlyPrice === 0 
                        ? 'Free' 
                        : formatCurrency(getPlanPrice(selectedPlanData))}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {isYearly ? 'Billed annually' : 'Billed monthly'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {selectedPlanData.proposals === 0 ? 'Unlimited' : selectedPlanData.proposals} proposals per month
                  </Typography>
                </Box>

                {selectedPlanData.monthlyPrice > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    You can cancel your subscription at any time. Changes will take effect immediately.
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmSelection}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default PricingPlans;
