import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import { GridView, ViewList, Add, Refresh } from '@mui/icons-material';
import { Proposal } from '../../types';
import ProposalCard from './ProposalCard';

interface ProposalListProps {
  proposals: Proposal[];
  loading?: boolean;
  error?: string;
  onProposalView?: (proposal: Proposal) => void;
  onProposalEdit?: (proposal: Proposal) => void;
  onProposalDownload?: (proposal: Proposal) => void;
  onProposalDelete?: (proposal: Proposal) => void;
  onProposalSubmit?: (proposal: Proposal) => void;
  onCreateNew?: () => void;
  onRefresh?: () => void;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  showFilters?: boolean;
}

type ProposalStatus = 'all' | 'draft' | 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  loading = false,
  error,
  onProposalView,
  onProposalEdit,
  onProposalDownload,
  onProposalDelete,
  onProposalSubmit,
  onCreateNew,
  onRefresh,
  pagination,
  showFilters = true,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus>('all');

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'grid' | 'list' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleStatusChange = (event: React.SyntheticEvent, newValue: ProposalStatus) => {
    setStatusFilter(newValue);
  };

  // Filter proposals by status
  const filteredProposals = proposals.filter(proposal => {
    if (statusFilter === 'all') return true;
    return proposal.status === statusFilter;
  });

  // Sort proposals
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    switch (sortBy) {
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'submitted':
        if (!a.submittedAt && !b.submittedAt) return 0;
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      case 'budget':
        const aBudget = a.content?.budget?.totalAmount || 0;
        const bBudget = b.content?.budget?.totalAmount || 0;
        return bBudget - aBudget;
      default:
        return 0;
    }
  });

  // Get status counts
  const getStatusCounts = () => {
    const counts = proposals.reduce((acc, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      all: proposals.length,
      draft: counts.draft || 0,
      submitted: counts.submitted || 0,
      under_review: counts.under_review || 0,
      shortlisted: counts.shortlisted || 0,
      accepted: counts.accepted || 0,
      rejected: counts.rejected || 0,
      withdrawn: counts.withdrawn || 0,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          My Proposals
        </Typography>
        <Stack direction="row" spacing={2}>
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
          {onCreateNew && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateNew}
            >
              Create Proposal
            </Button>
          )}
        </Stack>
      </Box>

      {/* Status Tabs */}
      {showFilters && (
        <Box mb={3}>
          <Tabs
            value={statusFilter}
            onChange={handleStatusChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  All
                  <Chip label={statusCounts.all} size="small" />
                </Box>
              }
              value="all"
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Draft
                  <Chip label={statusCounts.draft} size="small" color="default" />
                </Box>
              }
              value="draft"
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Submitted
                  <Chip label={statusCounts.submitted} size="small" color="primary" />
                </Box>
              }
              value="submitted"
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Under Review
                  <Chip label={statusCounts.under_review} size="small" color="info" />
                </Box>
              }
              value="under_review"
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Shortlisted
                  <Chip label={statusCounts.shortlisted} size="small" color="warning" />
                </Box>
              }
              value="shortlisted"
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Accepted
                  <Chip label={statusCounts.accepted} size="small" color="success" />
                </Box>
              }
              value="accepted"
            />
            <Tab
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Rejected
                  <Chip label={statusCounts.rejected} size="small" color="error" />
                </Box>
              }
              value="rejected"
            />
          </Tabs>
        </Box>
      )}

      {/* Controls */}
      {showFilters && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography variant="h6" component="h2">
            {filteredProposals.length} proposal{filteredProposals.length !== 1 ? 's' : ''}{' '}
            {statusFilter !== 'all' && `(${statusFilter.replace('_', ' ')})`}
          </Typography>

          <Box
            display="flex"
            alignItems="center"
            gap={2}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {/* Sort Options */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="created">Recently Created</MenuItem>
                <MenuItem value="updated">Recently Updated</MenuItem>
                <MenuItem value="submitted">Recently Submitted</MenuItem>
                <MenuItem value="status">Status</MenuItem>
                <MenuItem value="budget">Budget</MenuItem>
              </Select>
            </FormControl>

            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="grid" aria-label="grid view">
                <GridView />
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {filteredProposals.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {statusFilter === 'all' 
              ? 'No proposals found'
              : `No ${statusFilter.replace('_', ' ')} proposals`
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {statusFilter === 'all'
              ? 'Create your first proposal to get started'
              : 'Try adjusting your filters or create a new proposal'
            }
          </Typography>
          {onCreateNew && statusFilter === 'all' && (
            <Button variant="contained" startIcon={<Add />} onClick={onCreateNew}>
              Create Your First Proposal
            </Button>
          )}
        </Box>
      ) : (
        <>
          {/* Proposal Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: viewMode === 'grid' ? 'repeat(2, 1fr)' : '1fr',
                md: viewMode === 'grid' ? 'repeat(2, 1fr)' : '1fr',
                lg: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr',
              },
              gap: 3,
              mb: pagination ? 4 : 0,
            }}
          >
            {sortedProposals.map((proposal) => (
              <ProposalCard
                key={proposal._id}
                proposal={proposal}
                onView={onProposalView}
                onEdit={onProposalEdit}
                onDownload={onProposalDownload}
                onDelete={onProposalDelete}
                onSubmit={onProposalSubmit}
                compact={viewMode === 'list'}
              />
            ))}
          </Box>

          {/* Pagination */}
          {pagination && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.pageSize)}
                page={pagination.current}
                onChange={(event, page) => pagination.onPageChange(page)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ProposalList;
