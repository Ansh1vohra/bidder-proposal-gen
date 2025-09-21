import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Avatar,
  Alert,
  Button,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Assignment,
  Send,
  Visibility,
  Star,
  CheckCircle,
  Cancel,
  Warning,
  Schedule,
  Assessment,
  Edit,
  Download,
} from '@mui/icons-material';
import { Proposal, Tender } from '../../types';
import { formatDate } from '../../utils/formatUtils';

interface ProposalStatusProps {
  proposal: Proposal;
  onEdit?: (proposal: Proposal) => void;
  onDownload?: (proposal: Proposal) => void;
  onWithdraw?: (proposal: Proposal) => void;
  showActions?: boolean;
}

interface StatusStep {
  label: string;
  description: string;
  icon: React.ReactElement;
  color: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'inherit';
  completed: boolean;
  active: boolean;
  date?: Date;
}

const ProposalStatus: React.FC<ProposalStatusProps> = ({
  proposal,
  onEdit,
  onDownload,
  onWithdraw,
  showActions = true,
}) => {
  const tender = typeof proposal.tenderId === 'object' ? proposal.tenderId : null;

  const getStatusSteps = (): StatusStep[] => {
    const steps: StatusStep[] = [
      {
        label: 'Draft Created',
        description: 'Proposal created and saved as draft',
        icon: <Edit />,
        color: 'inherit',
        completed: true,
        active: false,
        date: proposal.createdAt,
      },
      {
        label: 'Submitted',
        description: 'Proposal submitted for review',
        icon: <Send />,
        color: proposal.status === 'draft' ? 'inherit' : 'primary',
        completed: proposal.status !== 'draft',
        active: proposal.status === 'submitted',
        date: proposal.submittedAt,
      },
      {
        label: 'Under Review',
        description: 'Proposal is being evaluated',
        icon: <Assessment />,
        color: proposal.status === 'under_review' ? 'primary' : 'inherit',
        completed: ['shortlisted', 'accepted', 'rejected'].includes(proposal.status),
        active: proposal.status === 'under_review',
      },
      {
        label: 'Decision',
        description: getDecisionDescription(),
        icon: getDecisionIcon(),
        color: proposal.status === 'accepted' ? 'success' : proposal.status === 'rejected' ? 'error' : 'primary',
        completed: ['accepted', 'rejected', 'shortlisted'].includes(proposal.status),
        active: ['accepted', 'rejected', 'shortlisted'].includes(proposal.status),
        date: proposal.evaluation?.evaluatedAt,
      },
    ];

    return steps;
  };

  function getDecisionDescription(): string {
    switch (proposal.status) {
      case 'accepted':
        return 'Proposal accepted - Congratulations!';
      case 'rejected':
        return 'Proposal not selected';
      case 'shortlisted':
        return 'Shortlisted for final review';
      case 'withdrawn':
        return 'Proposal withdrawn';
      default:
        return 'Awaiting decision';
    }
  }

  function getDecisionIcon(): React.ReactElement {
    switch (proposal.status) {
      case 'accepted':
        return <CheckCircle />;
      case 'rejected':
        return <Cancel />;
      case 'shortlisted':
        return <Star />;
      case 'withdrawn':
        return <Warning />;
      default:
        return <Schedule />;
    }
  }

  function getDecisionColor(): 'primary' | 'success' | 'error' | 'warning' | 'info' | 'default' | 'secondary' {
    switch (proposal.status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'shortlisted':
        return 'warning';
      case 'withdrawn':
        return 'error';
      default:
        return 'default';
    }
  }

  const getStatusAlert = () => {
    switch (proposal.status) {
      case 'accepted':
        return (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Congratulations! Your proposal has been accepted.
            </Typography>
            <Typography variant="body2">
              You should expect to hear from the procurement team soon regarding next steps.
            </Typography>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your proposal was not selected for this tender.
            </Typography>
            {proposal.evaluation?.feedback && (
              <Typography variant="body2">
                Feedback: {proposal.evaluation.feedback}
              </Typography>
            )}
          </Alert>
        );
      case 'shortlisted':
        return (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Great news! Your proposal has been shortlisted.
            </Typography>
            <Typography variant="body2">
              You may be contacted for additional information or presentations.
            </Typography>
          </Alert>
        );
      case 'withdrawn':
        return (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              This proposal has been withdrawn.
            </Typography>
            <Typography variant="body2">
              You withdrew this proposal from consideration.
            </Typography>
          </Alert>
        );
      default:
        return null;
    }
  };

  const canWithdraw = ['submitted', 'under_review'].includes(proposal.status);
  const canEdit = proposal.status === 'draft';

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                Proposal Status
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Proposal #{proposal._id.slice(-6)} • {tender?.title || 'Tender'}
              </Typography>
            </Box>
            
            <Chip
              label={proposal.status.replace('_', ' ').toUpperCase()}
              color={getDecisionColor()}
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {showActions && (
            <Stack direction="row" spacing={2} mt={2}>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => onDownload?.(proposal)}
              >
                View Proposal
              </Button>
              
              {canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => onEdit?.(proposal)}
                >
                  Edit Proposal
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => onDownload?.(proposal)}
              >
                Download PDF
              </Button>

              {canWithdraw && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Warning />}
                  onClick={() => onWithdraw?.(proposal)}
                >
                  Withdraw
                </Button>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Status Alert */}
      {getStatusAlert()}

      {/* Status Timeline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Proposal Timeline
          </Typography>
          
          <List>
            {getStatusSteps().map((step, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: step.completed ? `${step.color}.main` : 'grey.300',
                        color: 'white',
                        width: 40,
                        height: 40
                      }}
                    >
                      {step.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="h6" 
                        component="span"
                        sx={{ 
                          fontWeight: step.active ? 600 : 500,
                          color: step.completed ? 'text.primary' : 'text.secondary'
                        }}
                      >
                        {step.label}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          color={step.completed ? 'text.secondary' : 'text.disabled'}
                          sx={{ mb: 0.5 }}
                        >
                          {step.description}
                        </Typography>
                        {step.date && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(step.date)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  {step.active && (
                    <Chip
                      label="Current"
                      size="small"
                      color="primary"
                      sx={{ ml: 2 }}
                    />
                  )}
                </ListItem>
                {index < getStatusSteps().length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Evaluation Details */}
      {proposal.evaluation && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Evaluation Details
            </Typography>

            {proposal.evaluation.score && (
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Score
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {proposal.evaluation.score}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    / 100
                  </Typography>
                </Box>
              </Box>
            )}

            {proposal.evaluation.criteria && proposal.evaluation.criteria.length > 0 && (
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Evaluation Criteria
                </Typography>
                {proposal.evaluation.criteria.map((criterion, index) => (
                  <Box key={index} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {criterion.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {criterion.score} / {criterion.maxScore}
                      </Typography>
                    </Box>
                    {criterion.comments && (
                      <Typography variant="body2" color="text.secondary">
                        {criterion.comments}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {proposal.evaluation.feedback && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Evaluator Feedback
                </Typography>
                <Typography variant="body1">
                  {proposal.evaluation.feedback}
                </Typography>
              </Box>
            )}

            {proposal.evaluation.evaluatedAt && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Evaluated on {formatDate(proposal.evaluation.evaluatedAt)}
                  {proposal.evaluation.evaluatedBy && ` by ${proposal.evaluation.evaluatedBy}`}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Statistics
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Version
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {proposal.version || 1}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Downloads
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {proposal.downloadCount || 0}
              </Typography>
            </Box>

            {proposal.lastDownloadedAt && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Downloaded
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDate(proposal.lastDownloadedAt)}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProposalStatus;
