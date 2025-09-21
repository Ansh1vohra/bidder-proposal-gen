import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Stack,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Star,
  Schedule,
  LocationOn,
  Business,
  AttachMoney,
  Visibility,
  BookmarkBorder,
  Bookmark,
  Info,
} from '@mui/icons-material';
import { Tender } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

interface RecommendationCardProps {
  tender: Tender;
  matchScore: number;
  matchReasons: string[];
  isBookmarked?: boolean;
  onView?: (tender: Tender) => void;
  onBookmark?: (tender: Tender) => void;
  onApply?: (tender: Tender) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  tender,
  matchScore,
  matchReasons,
  isBookmarked = false,
  onView,
  onBookmark,
  onApply,
}) => {
  const getMatchScoreColor = () => {
    if (matchScore >= 90) return 'success';
    if (matchScore >= 70) return 'warning';
    return 'error';
  };

  const getMatchScoreLabel = () => {
    if (matchScore >= 90) return 'Excellent Match';
    if (matchScore >= 70) return 'Good Match';
    if (matchScore >= 50) return 'Fair Match';
    return 'Low Match';
  };

  const getStatusColor = () => {
    switch (tender.status) {
      case 'active':
        return 'success';
      case 'evaluation':
        return 'warning';
      case 'closed':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDaysRemaining = () => {
    if (!tender.submissionDeadline) return null;
    const deadline = new Date(tender.submissionDeadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card 
      sx={{ 
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
        border: matchScore >= 90 ? 2 : 1,
        borderColor: matchScore >= 90 ? 'success.main' : 'divider',
      }}
    >
      {/* Match Score Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1,
        }}
      >
        <Tooltip title={`${matchScore}% match - ${getMatchScoreLabel()}`}>
          <Chip
            icon={<TrendingUp />}
            label={`${matchScore}%`}
            color={getMatchScoreColor()}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Tooltip>
      </Box>

      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box sx={{ pr: 8, mb: 2 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
            {tender.title}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
              <Business sx={{ fontSize: 14 }} />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {tender.contactInfo?.organization || 'Organization not specified'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {tender.location.city && tender.location.state
                ? `${tender.location.city}, ${tender.location.state}`
                : tender.location.country}
            </Typography>
          </Stack>
        </Box>

        {/* Tender Details */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {tender.estimatedValue && (tender.estimatedValue.min || tender.estimatedValue.max) && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Estimated Value
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {tender.estimatedValue.min && tender.estimatedValue.max
                  ? `${formatCurrency(tender.estimatedValue.min)} - ${formatCurrency(tender.estimatedValue.max)}`
                  : tender.estimatedValue.min
                  ? `From ${formatCurrency(tender.estimatedValue.min)}`
                  : `Up to ${formatCurrency(tender.estimatedValue.max!)}`}
              </Typography>
            </Box>
          )}
          
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Deadline
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {tender.submissionDeadline ? formatDate(tender.submissionDeadline) : 'Not specified'}
            </Typography>
            {daysRemaining !== null && daysRemaining >= 0 && (
              <Typography 
                variant="caption" 
                color={daysRemaining <= 7 ? 'error' : 'text.secondary'}
                sx={{ fontWeight: 500 }}
              >
                {daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Status
            </Typography>
            <Chip
              label={tender.status.replace('_', ' ').toUpperCase()}
              color={getStatusColor()}
              size="small"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        </Stack>

        {/* Match Score Progress */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Match Score
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {matchScore}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={matchScore}
            color={getMatchScoreColor()}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Match Reasons */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Why this matches you:
          </Typography>
          <Stack spacing={0.5}>
            {matchReasons.slice(0, 3).map((reason, index) => (
              <Typography
                key={index}
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.875rem' }}
              >
                • {reason}
              </Typography>
            ))}
            {matchReasons.length > 3 && (
              <Typography variant="body2" color="primary" sx={{ fontSize: '0.875rem' }}>
                +{matchReasons.length - 3} more reasons
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Tender Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {tender.description}
        </Typography>
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView?.(tender)}
          >
            View Details
          </Button>
          
          <IconButton
            size="small"
            onClick={() => onBookmark?.(tender)}
            color={isBookmarked ? 'primary' : 'default'}
          >
            {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
        </Stack>

        <Button
          variant="contained"
          size="small"
          onClick={() => onApply?.(tender)}
          disabled={tender.status === 'closed'}
          sx={{ minWidth: 80 }}
        >
          Apply
        </Button>
      </CardActions>
    </Card>
  );
};

export default RecommendationCard;
