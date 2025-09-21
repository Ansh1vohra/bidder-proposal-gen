import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Business,
  Schedule,
  AttachMoney,
  LocationOn,
  Bookmark,
  BookmarkBorder,
  Visibility,
  GetApp,
} from '@mui/icons-material';
import { Tender } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatUtils';
import { truncate } from '../../utils/stringUtils';

interface TenderCardProps {
  tender: Tender;
  onView?: (tender: Tender) => void;
  onSave?: (tender: Tender) => void;
  onApply?: (tender: Tender) => void;
  isSaved?: boolean;
  showActions?: boolean;
}

const TenderCard: React.FC<TenderCardProps> = ({
  tender,
  onView,
  onSave,
  onApply,
  isSaved = false,
  showActions = true,
}) => {
  const isExpired = new Date(tender.submissionDeadline) < new Date();
  const daysLeft = Math.ceil(
    (new Date(tender.submissionDeadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  const getStatusColor = () => {
    if (isExpired) return 'error';
    if (daysLeft <= 7) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (isExpired) return 'Expired';
    if (daysLeft === 0) return 'Due Today';
    if (daysLeft === 1) return '1 Day Left';
    return `${daysLeft} Days Left`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      {/* Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {tender.title}
          </Typography>
          {showActions && (
            <IconButton
              size="small"
              onClick={() => onSave?.(tender)}
              color={isSaved ? 'primary' : 'default'}
              sx={{ ml: 1, flexShrink: 0 }}
            >
              {isSaved ? <Bookmark /> : <BookmarkBorder />}
            </IconButton>
          )}
        </Box>

        {/* Organization */}
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.light' }}>
            <Business />
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {typeof tender.createdBy === 'object' ? tender.createdBy.name : 'Organization'}
          </Typography>
        </Box>

        {/* Description */}
        {tender.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {truncate(tender.description, 150)}
          </Typography>
        )}

        {/* Key Information */}
        <Box sx={{ mb: 2 }}>
          {/* Budget */}
          {tender.estimatedValue && (
            <Box display="flex" alignItems="center" mb={1}>
              <AttachMoney sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {tender.estimatedValue.min && tender.estimatedValue.max
                  ? `${formatCurrency(tender.estimatedValue.min, tender.estimatedValue.currency)} - ${formatCurrency(tender.estimatedValue.max, tender.estimatedValue.currency)}`
                  : tender.estimatedValue.min
                  ? `From ${formatCurrency(tender.estimatedValue.min, tender.estimatedValue.currency)}`
                  : 'Budget TBD'}
              </Typography>
            </Box>
          )}

          {/* Location */}
          {tender.location && (
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2">
                {typeof tender.location === 'string' ? tender.location : tender.location.city}
              </Typography>
            </Box>
          )}

          {/* Deadline */}
          <Box display="flex" alignItems="center" mb={1}>
            <Schedule sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2">
              Due: {formatDate(tender.submissionDeadline)}
            </Typography>
          </Box>
        </Box>

        {/* Category */}
        {tender.category && (
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
            <Chip
              label={tender.category}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
            {tender.industry && (
              <Chip
                label={tender.industry}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        )}
      </CardContent>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      {/* Footer */}
      <CardContent sx={{ pt: 2, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="caption" color="text.secondary">
            Posted {formatDate(tender.createdAt)}
          </Typography>
        </Box>
      </CardContent>

      {showActions && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => onView?.(tender)}
            sx={{ mr: 1 }}
          >
            View Details
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => onApply?.(tender)}
            disabled={isExpired}
            sx={{ ml: 'auto' }}
          >
            {isExpired ? 'Expired' : 'Apply Now'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default TenderCard;
