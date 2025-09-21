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
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Assignment,
  Edit,
  Visibility,
  Download,
  Delete,
  Send,
  Schedule,
  AttachMoney,
  CheckCircle,
  Warning,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { Proposal, Tender } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

interface ProposalCardProps {
  proposal: Proposal;
  onView?: (proposal: Proposal) => void;
  onEdit?: (proposal: Proposal) => void;
  onDownload?: (proposal: Proposal) => void;
  onDelete?: (proposal: Proposal) => void;
  onSubmit?: (proposal: Proposal) => void;
  showActions?: boolean;
  compact?: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onView,
  onEdit,
  onDownload,
  onDelete,
  onSubmit,
  showActions = true,
  compact = false,
}) => {
  const tender = typeof proposal.tenderId === 'object' ? proposal.tenderId : null;
  const tenderTitle = tender?.title || 'Tender Information Unavailable';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'submitted':
      case 'under_review':
        return 'primary';
      case 'shortlisted':
        return 'info';
      case 'withdrawn':
        return 'warning';
      case 'draft':
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle />;
      case 'rejected':
        return <Cancel />;
      case 'submitted':
      case 'under_review':
        return <Pending />;
      case 'shortlisted':
        return <Assignment />;
      case 'withdrawn':
        return <Warning />;
      case 'draft':
      default:
        return <Edit />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'Under Review';
      case 'shortlisted':
        return 'Shortlisted';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getCompletionScore = () => {
    const sections = [
      proposal.content?.executiveSummary,
      proposal.content?.requirementsUnderstanding,
      proposal.content?.proposedSolution,
      proposal.content?.companyQualifications,
    ];
    
    const completedSections = sections.filter(section => section && section.trim()).length;
    return Math.round((completedSections / sections.length) * 100);
  };

  const isDraft = proposal.status === 'draft';
  const canEdit = isDraft;
  const canSubmit = isDraft && getCompletionScore() >= 75;

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
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography
              variant={compact ? "subtitle1" : "h6"}
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
              {tenderTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Proposal #{proposal._id.slice(-6)}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Avatar
              sx={{
                bgcolor: `${getStatusColor(proposal.status)}.light`,
                color: `${getStatusColor(proposal.status)}.main`,
                width: 32,
                height: 32,
              }}
            >
              {getStatusIcon(proposal.status)}
            </Avatar>
            <Chip
              label={getStatusLabel(proposal.status)}
              color={getStatusColor(proposal.status)}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Key Information */}
        <Box mb={2}>
          {/* Budget */}
          {proposal.content?.budget?.totalAmount && (
            <Box display="flex" alignItems="center" mb={1}>
              <AttachMoney sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(
                  proposal.content.budget.totalAmount,
                  proposal.content.budget.currency || 'USD'
                )}
              </Typography>
            </Box>
          )}

          {/* Timeline */}
          {proposal.content?.timeline?.totalDuration && (
            <Box display="flex" alignItems="center" mb={1}>
              <Schedule sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2">
                {proposal.content.timeline.totalDuration}
              </Typography>
            </Box>
          )}

          {/* Dates */}
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(proposal.createdAt)}
            {proposal.submittedAt && (
              <> • Submitted: {formatDate(proposal.submittedAt)}</>
            )}
          </Typography>
        </Box>

        {/* Completion Progress (for drafts) */}
        {isDraft && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Completion
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {getCompletionScore()}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getCompletionScore()}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}

        {/* Evaluation Score */}
        {proposal.evaluation?.score && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Evaluation Score
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600, mr: 1 }}>
                {proposal.evaluation.score}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                / 100
              </Typography>
            </Box>
          </Box>
        )}

        {/* Executive Summary Preview */}
        {proposal.content?.executiveSummary && !compact && (
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {proposal.content.executiveSummary}
            </Typography>
          </Box>
        )}
      </CardContent>

      {showActions && (
        <>
          <Divider />
          <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<Visibility />}
                onClick={() => onView?.(proposal)}
              >
                View
              </Button>
              
              {canEdit && (
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => onEdit?.(proposal)}
                >
                  Edit
                </Button>
              )}

              <IconButton
                size="small"
                onClick={() => onDownload?.(proposal)}
                disabled={isDraft && getCompletionScore() < 50}
              >
                <Download />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1}>
              {canSubmit && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Send />}
                  onClick={() => onSubmit?.(proposal)}
                >
                  Submit
                </Button>
              )}

              {isDraft && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete?.(proposal)}
                >
                  <Delete />
                </IconButton>
              )}
            </Stack>
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default ProposalCard;
