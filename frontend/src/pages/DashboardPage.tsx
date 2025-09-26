import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Bookmark,
  Analytics,
  Add,
  Visibility,
  Download,
  Star,
  CheckCircle,
  Search,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTenders } from '../hooks/useTenders';
import { useProposals } from '../hooks/useProposals';
import { formatCurrency, formatDate } from '../utils/formatUtils';
import { Tender, Proposal } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactElement;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color = 'primary' }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ zIndex: 1, position: 'relative' }}>
            <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
              {value}
            </Typography>
            {change && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  {change}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              color: `${color}.contrastText`,
              width: 56,
              height: 56,
              boxShadow: 2,
              zIndex: 1,
              position: 'relative'
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {/* Decorative gradient background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '60%',
            height: '100%',
            background: `linear-gradient(135deg, transparent 0%, ${
              color === 'primary' ? 'rgba(25, 118, 210, 0.08)' : 
              color === 'success' ? 'rgba(46, 125, 50, 0.08)' : 
              color === 'warning' ? 'rgba(237, 108, 2, 0.08)' : 
              'rgba(156, 39, 176, 0.08)'
            } 100%)`,
            zIndex: 0
          }}
        />
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: tenders } = useTenders();
  const { data: proposals } = useProposals();

  // Calculate real statistics from data
  const activeProposals = proposals?.proposals?.filter((p: Proposal) => p.status === 'submitted').length || 0;
  const wonProposals = proposals?.proposals?.filter((p: Proposal) => p.status === 'accepted').length || 0;
  const totalProposals = proposals?.proposals?.length || 0;
  const savedTenders = tenders?.tenders?.length || 0; // Assuming all fetched tenders are saved/relevant
  const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;

  const stats = [
    {
      title: 'Active Proposals',
      value: activeProposals,
      change: '+12%', // This could be calculated based on previous period data
      icon: <Assignment />,
      color: 'primary' as const,
    },
    {
      title: 'Won Proposals',
      value: wonProposals,
      change: '+8%', // This could be calculated based on previous period data
      icon: <CheckCircle />,
      color: 'success' as const,
    },
    {
      title: 'Saved Tenders',
      value: savedTenders,
      change: '+15%', // This could be calculated based on previous period data
      icon: <Bookmark />,
      color: 'warning' as const,
    },
    {
      title: 'Win Rate',
      value: `${winRate}%`,
      change: '+5%', // This could be calculated based on previous period data
      icon: <Analytics />,
      color: 'secondary' as const,
    },
  ];

  const recentTenders = tenders?.tenders?.slice(0, 5) || [];
  const recentProposals = proposals?.proposals?.slice(0, 5) || [];

  // Debug user object
  console.log('Dashboard user object:', user);

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box 
        mb={3} 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          mb: 4,
          p: 4,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome back, {user?.name || 'User'}! 👋
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Here's what's happening with your proposals today.
          </Typography>
        </Box>
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            zIndex: 0
          }}
        />
      </Box>

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </Box>

      {/* Subscription Usage */}
      {user?.subscription && (
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Subscription Overview
              </Typography>
              <Chip 
                label={user.subscription?.currentPlan?.toUpperCase() || 'FREE'} 
                color={user.subscription?.currentPlan === 'free' ? 'default' : 'primary'}
                size="medium"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                  Proposals Generated This Month
                </Typography>
                <Box mb={2}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {user.subscription?.usage?.proposalsGenerated || 0} / {user.subscription?.usage?.monthlyLimit === 0 ? '∞' : user.subscription?.usage?.monthlyLimit || 0}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={user.subscription?.usage?.monthlyLimit === 0 ? 0 : ((user.subscription?.usage?.proposalsGenerated || 0) / (user.subscription?.usage?.monthlyLimit || 1)) * 100}
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: 'rgba(255, 255, 255, 0.6)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                      }
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                  Subscription Status
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CheckCircle 
                    sx={{ 
                      color: user.subscription?.status === 'active' ? 'success.main' : 'text.secondary',
                      fontSize: 20 
                    }} 
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
                {user.subscription?.endDate && (
                  <Typography variant="body2" color="text.secondary">
                    Valid until {formatDate(user.subscription.endDate)}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: { xs: 2, sm: 3 }
        }}
      >
        {/* Recent Tenders */}
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Search sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    Recent Tenders
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Visibility />}
                  sx={{ borderRadius: 2 }}
                >
                  View All
                </Button>
              </Box>
              {recentTenders.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No tenders available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start exploring tenders to see them here
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {recentTenders.map((tender: Tender) => (
                    <Box
                      key={tender._id}
                      sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 2,
                        transition: 'all 0.2s ease-in-out',
                        '&:last-child': { mb: 0 },
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                          transform: 'translateY(-1px)',
                          boxShadow: 2
                        },
                        cursor: 'pointer'
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                        {tender.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {typeof tender.createdBy === 'object' ? tender.createdBy.name : 'Organization'}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tender.estimatedValue ? formatCurrency(tender.estimatedValue.min || 0, tender.estimatedValue.currency) : 'Budget not specified'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due: {formatDate(tender.submissionDeadline)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        {/* Recent Proposals */}
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Assignment sx={{ color: 'success.main' }} />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  Recent Proposals
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<Add />}
                sx={{ borderRadius: 2 }}
              >
                New Proposal
              </Button>
            </Box>
            {recentProposals.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" mb={2} gutterBottom>
                  No proposals yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Create your first proposal to get started
                </Typography>
                <Button variant="outlined" startIcon={<Add />} sx={{ borderRadius: 2 }}>
                  Create Your First Proposal
                </Button>
              </Box>
            ) : (
              <Box>
                {recentProposals.map((proposal: Proposal) => (
                  <Box
                    key={proposal._id}
                    sx={{
                      p: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:last-child': { mb: 0 },
                      '&:hover': {
                        borderColor: 'success.main',
                        bgcolor: 'action.hover',
                        transform: 'translateY(-1px)',
                        boxShadow: 2
                      },
                      cursor: 'pointer'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="subtitle2" gutterBottom>
                        Proposal #{proposal._id.slice(-6)}
                      </Typography>
                      <Chip
                        label={proposal.status}
                        size="small"
                        color={
                          proposal.status === 'accepted' ? 'success' :
                          proposal.status === 'rejected' ? 'error' :
                          proposal.status === 'submitted' ? 'primary' :
                          'default'
                        }
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {typeof proposal.tenderId === 'object' ? proposal.tenderId.title : 'Tender'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(proposal.createdAt)}
                      </Typography>
                      <Box>
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <Download fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h6" component="h2" gutterBottom>
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: 2
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            sx={{ py: 2 }}
          >
            Create Proposal
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Search />}
            sx={{ py: 2 }}
          >
            Browse Tenders
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Star />}
            sx={{ py: 2 }}
          >
            Get Recommendations
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Analytics />}
            sx={{ py: 2 }}
          >
            View Analytics
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
