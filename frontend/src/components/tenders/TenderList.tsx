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
} from '@mui/material';
import { GridView, ViewList } from '@mui/icons-material';
import { Tender } from '../../types';
import TenderCard from './TenderCard';

interface TenderListProps {
  tenders: Tender[];
  loading?: boolean;
  error?: string;
  onTenderView?: (tender: Tender) => void;
  onTenderSave?: (tender: Tender) => void;
  onTenderApply?: (tender: Tender) => void;
  savedTenders?: string[];
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  showFilters?: boolean;
}

const TenderList: React.FC<TenderListProps> = ({
  tenders,
  loading = false,
  error,
  onTenderView,
  onTenderSave,
  onTenderApply,
  savedTenders = [],
  pagination,
  showFilters = true,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('deadline');

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'grid' | 'list' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const sortedTenders = [...tenders].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime();
      case 'posted':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'value':
        const aValue = a.estimatedValue?.min || 0;
        const bValue = b.estimatedValue?.min || 0;
        return bValue - aValue;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

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

  if (tenders.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No tenders found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search criteria or filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
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
            {tenders.length} tender{tenders.length !== 1 ? 's' : ''} found
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
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="posted">Recently Posted</MenuItem>
                <MenuItem value="value">Value</MenuItem>
                <MenuItem value="title">Title</MenuItem>
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

      {/* Tender Cards */}
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
        {sortedTenders.map((tender) => (
          <TenderCard
            key={tender._id}
            tender={tender}
            onView={onTenderView}
            onSave={onTenderSave}
            onApply={onTenderApply}
            isSaved={savedTenders.includes(tender._id)}
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
    </Box>
  );
};

export default TenderList;
