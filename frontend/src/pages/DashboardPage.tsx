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
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            {change && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                <Typography variant="body2" color="success.main">
                  {change}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
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

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your proposals today.
        </Typography>
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
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Subscription Usage
              </Typography>
              <Chip 
                label={user.subscription?.currentPlan?.toUpperCase() || 'FREE'} 
                color={user.subscription?.currentPlan === 'free' ? 'default' : 'primary'}
                size="small"
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
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Proposals Generated
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={((user.subscription?.usage?.proposalsGenerated || 0) / (user.subscription?.usage?.monthlyLimit || 1)) * 100}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2">
                    {user.subscription?.usage?.proposalsGenerated || 0} / {user.subscription?.usage?.monthlyLimit || 0}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Plan Status
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                  {user.subscription?.endDate && (
                    <span style={{ fontWeight: 400, color: 'text.secondary' }}>
                      {' '}until {formatDate(user.subscription.endDate)}
                    </span>
                  )}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3
        }}
      >
        {/* Recent Tenders */}
        <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Tenders
                </Typography>
                <Button variant="outlined" size="small" startIcon={<Visibility />}>
                  View All
                </Button>
              </Box>
              {recentTenders.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No tenders available
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {recentTenders.map((tender: Tender) => (
                    <Box
                      key={tender._id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 2,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
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
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Recent Proposals
              </Typography>
              <Button variant="contained" size="small" startIcon={<Add />}>
                New Proposal
              </Button>
            </Box>
            {recentProposals.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  No proposals yet
                </Typography>
                <Button variant="outlined" startIcon={<Add />}>
                  Create Your First Proposal
                </Button>
              </Box>
            ) : (
              <Box>
                {recentProposals.map((proposal: Proposal) => (
                  <Box
                    key={proposal._id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 2,
                      '&:last-child': { mb: 0 },
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
