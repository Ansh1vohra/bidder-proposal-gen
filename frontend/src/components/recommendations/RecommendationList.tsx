import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  Button,
  Paper,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Card,
  CardContent,
} from '@mui/material';
import {
  ViewList,
  ViewModule,
  FilterList,
  Sort,
  Refresh,
  TrendingUp,
  Star,
} from '@mui/icons-material';
import { Tender } from '../../types';
import RecommendationCard from './RecommendationCard';

interface TenderRecommendation {
  tender: Tender;
  matchScore: number;
  matchReasons: string[];
  isBookmarked?: boolean;
}

interface RecommendationListProps {
  recommendations: TenderRecommendation[];
  loading?: boolean;
  onRefresh?: () => void;
  onViewTender?: (tender: Tender) => void;
  onBookmarkTender?: (tender: Tender) => void;
  onApplyToTender?: (tender: Tender) => void;
}

type SortOption = 'match_score' | 'deadline' | 'budget' | 'date_added';
type ViewMode = 'grid' | 'list';

const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  loading = false,
  onRefresh,
  onViewTender,
  onBookmarkTender,
  onApplyToTender,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('match_score');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = recommendations.filter(rec => {
      // Filter by minimum match score
      if (rec.matchScore < minMatchScore) return false;
      
      // Filter by status
      if (statusFilter !== 'all' && rec.tender.status !== statusFilter) return false;
      
      return true;
    });

    // Sort recommendations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'match_score':
          return b.matchScore - a.matchScore;
        case 'deadline':
          if (!a.tender.submissionDeadline) return 1;
          if (!b.tender.submissionDeadline) return -1;
          return new Date(a.tender.submissionDeadline).getTime() - new Date(b.tender.submissionDeadline).getTime();
        case 'budget':
          const aValue = a.tender.estimatedValue?.max || a.tender.estimatedValue?.min || 0;
          const bValue = b.tender.estimatedValue?.max || b.tender.estimatedValue?.min || 0;
          return bValue - aValue;
        case 'date_added':
          return new Date(b.tender.createdAt).getTime() - new Date(a.tender.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [recommendations, sortBy, minMatchScore, statusFilter]);

  const getMatchScoreStats = () => {
    if (recommendations.length === 0) return { avg: 0, high: 0, excellent: 0 };
    
    const scores = recommendations.map(r => r.matchScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const high = scores.filter(s => s >= 70).length;
    const excellent = scores.filter(s => s >= 90).length;
    
    return { avg: Math.round(avg), high, excellent };
  };

  const stats = getMatchScoreStats();

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={280}
              sx={{ mb: 2, borderRadius: 2 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          No recommendations available
        </Typography>
        <Typography variant="body2">
          We'll analyze your profile and preferences to find matching tenders. 
          Complete your profile for better recommendations.
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ mt: 2 }}
          onClick={onRefresh}
        >
          Refresh Recommendations
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Stats Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Recommendation Overview
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 3,
            '@media (max-width: 600px)': {
              gridTemplateColumns: '1fr',
            }
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {recommendations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Recommendations
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                {stats.excellent}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Excellent Matches (90%+)
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                {stats.high}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Good Matches (70%+)
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                {stats.avg}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Match Score
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                startAdornment={<Sort sx={{ mr: 1, fontSize: 18 }} />}
              >
                <MenuItem value="match_score">Match Score</MenuItem>
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="budget">Budget</MenuItem>
                <MenuItem value="date_added">Date Added</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closing_soon">Closing Soon</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Min Match Score: {minMatchScore}%
              </Typography>
              <Slider
                value={minMatchScore}
                onChange={(_, value) => setMinMatchScore(value as number)}
                step={10}
                marks
                min={0}
                max={100}
                size="small"
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="grid" aria-label="grid view">
                <ViewModule />
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Results Count */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Showing {filteredAndSortedRecommendations.length} of {recommendations.length} recommendations
        </Typography>
      </Box>

      {/* Recommendations Grid/List */}
      {filteredAndSortedRecommendations.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body1">
            No recommendations match your current filters. Try adjusting the filters above.
          </Typography>
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' 
              ? {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)'
                }
              : '1fr',
            gap: 3,
          }}
        >
          {filteredAndSortedRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.tender._id}
              tender={recommendation.tender}
              matchScore={recommendation.matchScore}
              matchReasons={recommendation.matchReasons}
              isBookmarked={recommendation.isBookmarked}
              onView={onViewTender}
              onBookmark={onBookmarkTender}
              onApply={onApplyToTender}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default RecommendationList;
