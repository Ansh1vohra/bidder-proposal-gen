import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  IconButton,
  Avatar,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Business,
  Schedule,
  AttachMoney,
  LocationOn,
  Bookmark,
  BookmarkBorder,
  GetApp,
  Share,
  Flag,
  ExpandMore,
  Assignment,
  CheckCircle,
  Warning,
  Info,
  ArrowBack,
  Description,
  Person,
  Phone,
  Email,
  Language,
} from '@mui/icons-material';
import { Tender } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

interface TenderDetailProps {
  tender: Tender;
  onBack?: () => void;
  onApply?: (tender: Tender) => void;
  onSave?: (tender: Tender) => void;
  onShare?: (tender: Tender) => void;
  onReport?: (tender: Tender) => void;
  isSaved?: boolean;
  loading?: boolean;
}

const TenderDetail: React.FC<TenderDetailProps> = ({
  tender,
  onBack,
  onApply,
  onSave,
  onShare,
  onReport,
  isSaved = false,
  loading = false,
}) => {
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [expanded, setExpanded] = useState<string | false>('overview');

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false);
  };

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

  const handleApply = () => {
    setShowApplyDialog(false);
    onApply?.(tender);
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          onClick={onBack}
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBack sx={{ mr: 0.5, fontSize: 16 }} />
          Tenders
        </Link>
        <Typography color="text.primary">{tender.title}</Typography>
      </Breadcrumbs>

      {/* Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Title and Actions */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box flex={1} mr={2}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
                {tender.title}
              </Typography>
              
              {/* Organization */}
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.light' }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {typeof tender.createdBy === 'object' ? tender.createdBy.name : 'Organization'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Government Agency
                  </Typography>
                </Box>
              </Box>

              {/* Tags */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={tender.category} size="small" />
                <Chip label={tender.industry} size="small" />
                <Chip label={tender.tenderType} size="small" variant="outlined" />
                <Chip 
                  label={getStatusText()} 
                  color={getStatusColor()} 
                  size="small" 
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
              <Box display="flex" gap={1}>
                <IconButton onClick={() => onSave?.(tender)} color={isSaved ? 'primary' : 'default'}>
                  {isSaved ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
                <IconButton onClick={() => onShare?.(tender)}>
                  <Share />
                </IconButton>
                <IconButton onClick={() => onReport?.(tender)}>
                  <Flag />
                </IconButton>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowApplyDialog(true)}
                disabled={isExpired || loading}
                startIcon={<Assignment />}
                sx={{ minWidth: 150 }}
              >
                {isExpired ? 'Expired' : 'Apply Now'}
              </Button>
            </Box>
          </Box>

          {/* Key Information Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 3,
              mt: 3,
            }}
          >
            {/* Budget */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estimated Value
              </Typography>
              <Box display="flex" alignItems="center">
                <AttachMoney sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {tender.estimatedValue
                    ? `${formatCurrency(tender.estimatedValue.min || 0, tender.estimatedValue.currency)}${
                        tender.estimatedValue.max ? ` - ${formatCurrency(tender.estimatedValue.max, tender.estimatedValue.currency)}` : '+'
                      }`
                    : 'TBD'}
                </Typography>
              </Box>
            </Box>

            {/* Location */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Location
              </Typography>
              <Box display="flex" alignItems="center">
                <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {typeof tender.location === 'string' 
                    ? tender.location 
                    : `${tender.location.city}, ${tender.location.state}`}
                </Typography>
              </Box>
            </Box>

            {/* Deadline */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Submission Deadline
              </Typography>
              <Box display="flex" alignItems="center">
                <Schedule sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatDate(tender.submissionDeadline)}
                </Typography>
              </Box>
            </Box>

            {/* Posted Date */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Posted
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatDate(tender.createdAt)}
              </Typography>
            </Box>
          </Box>

          {/* Status Alert */}
          {isExpired ? (
            <Alert severity="error" sx={{ mt: 3 }}>
              This tender has expired and is no longer accepting submissions.
            </Alert>
          ) : daysLeft <= 7 ? (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Deadline approaching!</strong> Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to submit your proposal.
              </Typography>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {/* Content Accordions */}
      <Box>
        {/* Overview */}
        <Accordion 
          expanded={expanded === 'overview'} 
          onChange={handleAccordionChange('overview')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center">
              <Description sx={{ mr: 1 }} />
              <Typography variant="h6">Overview</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              {tender.description}
            </Typography>
            
            {/* Additional sections can be added here when they exist in the Tender interface */}
          </AccordionDetails>
        </Accordion>

        {/* Requirements */}
        <Accordion 
          expanded={expanded === 'requirements'} 
          onChange={handleAccordionChange('requirements')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center">
              <Assignment sx={{ mr: 1 }} />
              <Typography variant="h6">Requirements</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {tender.requirements?.technical && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Technical Requirements
                </Typography>
                <List>
                  {tender.requirements.technical.map((req, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {req.priority === 'critical' ? (
                          <Warning color="error" />
                        ) : req.priority === 'high' ? (
                          <Warning color="warning" />
                        ) : (
                          <Info color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={req.requirement}
                        secondary={`Priority: ${req.priority.toUpperCase()}${req.description ? ` - ${req.description}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {tender.requirements?.qualifications && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Required Qualifications
                </Typography>
                <List>
                  {tender.requirements.qualifications.map((qual, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={qual} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {tender.requirements?.certifications && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Required Certifications
                </Typography>
                <List>
                  {tender.requirements.certifications.map((cert, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {cert.required ? (
                          <Warning color="warning" />
                        ) : (
                          <Info color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={cert.name}
                        secondary={`${cert.required ? 'Required' : 'Preferred'}${cert.description ? ` - ${cert.description}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {tender.requirements?.experience && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Experience Requirements
                </Typography>
                <Typography variant="body1">
                  Minimum: {tender.requirements.experience.minimum} {tender.requirements.experience.unit}
                  {tender.requirements.experience.preferred && (
                    <>
                      <br />
                      Preferred: {tender.requirements.experience.preferred} {tender.requirements.experience.unit}
                    </>
                  )}
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Documents */}
        {tender.requirements?.documents && (
          <Accordion 
            expanded={expanded === 'documents'} 
            onChange={handleAccordionChange('documents')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <GetApp sx={{ mr: 1 }} />
                <Typography variant="h6">Documents</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {tender.requirements.documents.map((doc, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Description />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={`${doc.required ? 'Required' : 'Optional'}${doc.description ? ` - ${doc.description}` : ''}`}
                    />
                    <Button size="small" startIcon={<GetApp />}>
                      Download
                    </Button>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Contact Information */}
        <Accordion 
          expanded={expanded === 'contact'} 
          onChange={handleAccordionChange('contact')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center">
              <Person sx={{ mr: 1 }} />
              <Typography variant="h6">Contact Information</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {tender.contactInfo ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {tender.contactInfo.name || 'Procurement Officer'}
                </Typography>
                <List>
                  {tender.contactInfo.email && (
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText primary={tender.contactInfo.email} />
                    </ListItem>
                  )}
                  {tender.contactInfo.phone && (
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText primary={tender.contactInfo.phone} />
                    </ListItem>
                  )}
                </List>
              </Box>
            ) : (
              <Typography color="text.secondary">
                Contact information not available.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Apply Confirmation Dialog */}
      <Dialog open={showApplyDialog} onClose={() => setShowApplyDialog(false)}>
        <DialogTitle>Apply for Tender</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to start the application process for "{tender.title}".
            This will take you to the proposal creation page where you can prepare your submission.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApplyDialog(false)}>Cancel</Button>
          <Button onClick={handleApply} variant="contained">
            Continue to Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenderDetail;
