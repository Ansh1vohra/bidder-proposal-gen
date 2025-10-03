import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  CloudUpload,
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
  const [showBomDialog, setShowBomDialog] = useState(false);
  const [expanded, setExpanded] = useState<string | false>('overview');
  const [bom, setBom] = useState<Array<{ item: string; qty: number; unit: string; description?: string; price?: number }>>([]);

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

  const handleUploadModel = async (file: File) => {
    // Demo: create a sample BOM from uploaded file name
    const base = file.name.replace(/\.[^.]+$/, '').slice(0, 20) || 'Model';
    const demoBom = [
      { item: `${base}-FRAME-001`, qty: 12, unit: 'pcs', description: 'Primary structural frame components - galvanized steel', price: 450.00 },
      { item: `${base}-BOLT-M8-025`, qty: 96, unit: 'pcs', description: 'Hex bolts M8 x 25mm - grade 8.8 steel', price: 2.50 },
      { item: `${base}-PLATE-10MM`, qty: 8, unit: 'pcs', description: 'Steel plates 10mm thickness - S355 grade', price: 125.00 },
      { item: `${base}-CABLE-5M-001`, qty: 20, unit: 'm', description: 'Electrical cabling 5mm² - copper conductor', price: 15.00 },
      { item: `${base}-PAINT-PROT`, qty: 4, unit: 'L', description: 'Protective coating - epoxy primer', price: 85.00 },
      { item: `${base}-GASKET-SEAL`, qty: 24, unit: 'pcs', description: 'Weather sealing gaskets - EPDM rubber', price: 8.50 },
      { item: `${base}-WELD-ROD`, qty: 5, unit: 'kg', description: 'Welding rods E7018 - 3.2mm diameter', price: 45.00 },
      { item: `${base}-FASTENER-KIT`, qty: 3, unit: 'sets', description: 'Fastener kit - stainless steel hardware', price: 120.00 },
    ];
    setBom(demoBom);
  };

  const fileInputId = 'tender-3d-upload';

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
              <label htmlFor={fileInputId}>
                <input id={fileInputId} type="file" accept=".obj,.fbx,.stl,.gltf,.glb" hidden onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadModel(file);
                }} />
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  sx={{
                    mt: 1,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontWeight: 700,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    }
                  }}
                  component="span"
                >
                  📁 Upload 3D Model
                </Button>
              </label>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowApplyDialog(true)}
                disabled={isExpired || loading}
                startIcon={<Assignment />}
                sx={{ 
                  minWidth: 180,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 700,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  }
                }}
              >
                {isExpired ? 'Expired' : 'Generate AI Proposal'}
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

      {/* BOM Section (after 3D upload) */}
      {bom.length > 0 && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                📋 Bill of Materials (AI Generated)
              </Typography>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => setShowBomDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 600,
                }}
              >
                View Detailed BOM
              </Button>
            </Box>
            <Table size="small" sx={{ '& .MuiTableCell-root': { fontWeight: 500 } }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: 'rgba(0,0,0,0.05)', fontWeight: 700 } }}>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bom.slice(0, 3).map((r, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.item}</TableCell>
                    <TableCell>{r.qty}</TableCell>
                    <TableCell>{r.unit}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>${r.price?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {bom.length > 3 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      ... and {bom.length - 3} more items (view detailed BOM for complete list)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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

      {/* AI Proposal Generation Dialog */}
      <Dialog open={showApplyDialog} onClose={() => setShowApplyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 700,
        }}>
          🤖 Generate AI Proposal
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              "{tender.title}"
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our advanced AI will analyze this tender and generate a comprehensive, tailored proposal 
              that includes technical specifications, timeline, budget estimates, and compliance documentation.
            </Typography>
          </Box>

          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
              ✅ What's Included in Your AI Proposal:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Executive Summary tailored to procurement requirements
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Technical solution matching exact specifications
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Detailed project timeline with milestones
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Competitive pricing analysis and budget breakdown
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Risk assessment and mitigation strategies
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Quality assurance and compliance documentation
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Company credentials and past project references
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.dark', mb: 1 }}>
              🚀 AI Generation Process:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip label="1. Analyze Requirements" size="small" color="primary" variant="outlined" />
              <Chip label="2. Generate Content" size="small" color="primary" variant="outlined" />
              <Chip label="3. Format & Review" size="small" color="primary" variant="outlined" />
              <Chip label="4. Export Ready" size="small" color="success" variant="outlined" />
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Estimated Generation Time:</strong> 30-45 seconds
              <br />
              <strong>Output Formats:</strong> PDF, DOCX, and interactive web view
            </Typography>
          </Alert>

          <Typography variant="caption" color="text.secondary">
            By proceeding, you acknowledge that this AI-generated proposal will be customized based on the tender requirements 
            and your company profile. You can review and edit the proposal before final submission.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setShowApplyDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={() => { 
              setShowApplyDialog(false); 
              onApply?.(tender); 
            }} 
            variant="contained"
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600,
              px: 4,
            }}
          >
            🚀 Generate AI Proposal
          </Button>
        </DialogActions>
      </Dialog>

      {/* BOM Detail Dialog */}
      <Dialog open={showBomDialog} onClose={() => setShowBomDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontWeight: 700,
        }}>
          📋 Detailed Bill of Materials
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" paragraph>
              AI-generated Bill of Materials based on 3D model analysis and industry standards.
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Total Items</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{bom.length}</Typography>
              </Card>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Estimated Cost</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ${bom.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0).toFixed(2)}
                </Typography>
              </Card>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Lead Time</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>4-6 weeks</Typography>
              </Card>
            </Box>
          </Box>

          <Table>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: 'rgba(16, 185, 129, 0.1)', fontWeight: 700 } }}>
                <TableCell>Item Code</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bom.map((item, idx) => (
                <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                    {item.item}
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{item.qty}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    ${item.price?.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.dark' }}>
                    ${((item.price || 0) * item.qty).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)' }}>
                <TableCell colSpan={5} sx={{ fontWeight: 700, textAlign: 'right' }}>
                  Total Estimated Cost:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'success.dark' }}>
                  ${bom.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This BOM is AI-generated for estimation purposes. 
              Final specifications and pricing may vary based on supplier negotiations and detailed engineering review.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setShowBomDialog(false)} variant="outlined">
            Close
          </Button>
          <Button variant="contained" sx={{ fontWeight: 600 }}>
            Export BOM
          </Button>
          <Button variant="contained" color="success" sx={{ fontWeight: 600 }}>
            Include in Proposal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenderDetail;
