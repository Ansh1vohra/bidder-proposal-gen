import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import {
  ExpandMore,
  AutoFixHigh,
  Preview,
  Save,
  Send,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { Tender, Proposal } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  aiGenerated?: boolean;
  status: 'empty' | 'draft' | 'generated' | 'reviewed' | 'approved';
}

interface ProposalGeneratorProps {
  tender: Tender;
  existingProposal?: Proposal;
  onSave?: (proposal: Partial<Proposal>) => void;
  onSubmit?: (proposal: Partial<Proposal>) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const defaultSections: ProposalSection[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    content: '',
    required: true,
    status: 'empty',
  },
  {
    id: 'company_overview',
    title: 'Company Overview',
    content: '',
    required: true,
    status: 'empty',
  },
  {
    id: 'approach_methodology',
    title: 'Approach & Methodology',
    content: '',
    required: true,
    status: 'empty',
  },
  {
    id: 'technical_solution',
    title: 'Technical Solution',
    content: '',
    required: true,
    status: 'empty',
  },
  {
    id: 'timeline_milestones',
    title: 'Timeline & Milestones',
    content: '',
    required: true,
    status: 'empty',
  },
  {
    id: 'budget_pricing',
    title: 'Budget & Pricing',
    content: '',
    required: true,
    status: 'empty',
  },
  {
    id: 'team_qualifications',
    title: 'Team & Qualifications',
    content: '',
    required: true,
    status: 'empty',
  },
  {
    id: 'risk_management',
    title: 'Risk Management',
    content: '',
    required: false,
    status: 'empty',
  },
  {
    id: 'quality_assurance',
    title: 'Quality Assurance',
    content: '',
    required: false,
    status: 'empty',
  },
  {
    id: 'references',
    title: 'References & Case Studies',
    content: '',
    required: false,
    status: 'empty',
  },
];

const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({
  tender,
  existingProposal,
  onSave,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [sections, setSections] = useState<ProposalSection[]>(defaultSections);
  const [proposalData, setProposalData] = useState({
    title: '',
    description: '',
    estimatedBudget: '',
    deliveryTimeline: '',
    coverLetter: '',
  });
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const steps = [
    'Basic Information',
    'Proposal Sections',
    'Review & Submit',
  ];

  // Initialize with existing proposal data
  useEffect(() => {
    if (existingProposal) {
      setProposalData({
        title: existingProposal.content?.executiveSummary?.split('\n')[0] || '',
        description: existingProposal.content?.requirementsUnderstanding || '',
        estimatedBudget: existingProposal.content?.budget?.totalAmount?.toString() || '',
        deliveryTimeline: existingProposal.content?.timeline?.totalDuration || '',
        coverLetter: existingProposal.content?.executiveSummary || '',
      });
      
      // Update sections with existing content
      setSections(prevSections =>
        prevSections.map(section => {
          let content = '';
          switch (section.id) {
            case 'executive_summary':
              content = existingProposal.content?.executiveSummary || '';
              break;
            case 'company_overview':
              content = existingProposal.content?.companyQualifications || '';
              break;
            case 'approach_methodology':
              content = existingProposal.content?.requirementsUnderstanding || '';
              break;
            case 'technical_solution':
              content = existingProposal.content?.proposedSolution || '';
              break;
            case 'risk_management':
              content = existingProposal.content?.riskManagement || '';
              break;
            case 'quality_assurance':
              content = existingProposal.content?.qualityAssurance || '';
              break;
            default:
              content = section.content;
          }
          return content
            ? { ...section, content, status: 'reviewed' as const }
            : section;
        })
      );
    }
  }, [existingProposal]);

  // Generate AI content for a section
  const generateAIContent = async (sectionId: string) => {
    setAiGenerating(sectionId);
    
    try {
      // This would integrate with your AI service
      const response = await fetch('/api/proposals/generate-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenderId: tender._id,
          sectionId,
          userProfile: user?.profile,
          tenderRequirements: tender.requirements,
          companyInfo: user?.profile?.companyName,
        }),
      });

      if (response.ok) {
        const { content } = await response.json();
        updateSectionContent(sectionId, content, true);
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      // For demo purposes, generate placeholder content
      const placeholderContent = generatePlaceholderContent(sectionId);
      updateSectionContent(sectionId, placeholderContent, true);
    } finally {
      setAiGenerating(null);
    }
  };

  // Generate placeholder content for demo
  const generatePlaceholderContent = (sectionId: string): string => {
    const templates = {
      executive_summary: `We are pleased to submit our proposal for "${tender.title}". With our extensive experience in ${tender.industry} and proven track record of successful project delivery, we are uniquely positioned to meet your requirements and exceed your expectations.`,
      company_overview: `Our company has been serving the ${tender.industry} sector for over [X] years, with a team of highly qualified professionals and a commitment to delivering exceptional results. We have successfully completed similar projects with a focus on quality, innovation, and client satisfaction.`,
      approach_methodology: `Our approach to this project involves a comprehensive methodology that ensures thorough understanding of requirements, systematic planning, iterative development, and continuous quality assurance. We will employ industry best practices and leverage our expertise to deliver optimal results.`,
      technical_solution: `Our technical solution addresses the specific requirements outlined in the tender documentation. We propose a robust, scalable, and efficient solution that incorporates the latest technologies and industry standards to meet your technical specifications.`,
      timeline_milestones: `We propose a phased approach with clearly defined milestones and deliverables. Our timeline is realistic and accounts for potential risks while ensuring timely delivery. Key milestones include project initiation, design phase, implementation, testing, and deployment.`,
      budget_pricing: `Our pricing is competitive and transparent, providing excellent value for money. The budget breakdown includes all necessary components with no hidden costs. We offer flexible payment terms and are committed to delivering within the proposed budget.`,
      team_qualifications: `Our project team consists of highly qualified professionals with relevant experience and certifications. Each team member brings specialized skills and expertise that directly contribute to project success. We provide detailed CVs and credentials for key personnel.`,
    };

    return templates[sectionId as keyof typeof templates] || 'Content will be generated based on tender requirements and your company profile.';
  };

  // Update section content
  const updateSectionContent = (sectionId: string, content: string, aiGenerated = false) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              content,
              aiGenerated,
              status: content ? (aiGenerated ? 'generated' as const : 'draft' as const) : 'empty' as const,
            }
          : section
      )
    );
  };

  // Validate proposal before submission
  const validateProposal = () => {
    const errors: string[] = [];

    if (!proposalData.title.trim()) {
      errors.push('Proposal title is required');
    }

    if (!proposalData.description.trim()) {
      errors.push('Proposal description is required');
    }

    const incompleteSections = sections.filter(section => 
      section.required && (!section.content || section.content.trim() === '')
    );

    if (incompleteSections.length > 0) {
      errors.push(`The following required sections are incomplete: ${incompleteSections.map(s => s.title).join(', ')}`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle save
  const handleSave = () => {
    const proposal = {
      tenderId: tender._id,
      content: {
        executiveSummary: sections.find(s => s.id === 'executive_summary')?.content || proposalData.coverLetter,
        requirementsUnderstanding: sections.find(s => s.id === 'approach_methodology')?.content || proposalData.description,
        proposedSolution: sections.find(s => s.id === 'technical_solution')?.content,
        companyQualifications: sections.find(s => s.id === 'company_overview')?.content,
        riskManagement: sections.find(s => s.id === 'risk_management')?.content,
        qualityAssurance: sections.find(s => s.id === 'quality_assurance')?.content,
        timeline: proposalData.deliveryTimeline ? {
          totalDuration: `${proposalData.deliveryTimeline} days`,
        } : undefined,
        budget: proposalData.estimatedBudget ? {
          totalAmount: Number(proposalData.estimatedBudget),
          currency: 'USD',
        } : undefined,
      },
      status: 'draft' as const,
    };

    onSave?.(proposal);
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validateProposal()) {
      return;
    }

    const proposal = {
      tenderId: tender._id,
      content: {
        executiveSummary: sections.find(s => s.id === 'executive_summary')?.content || proposalData.coverLetter,
        requirementsUnderstanding: sections.find(s => s.id === 'approach_methodology')?.content || proposalData.description,
        proposedSolution: sections.find(s => s.id === 'technical_solution')?.content,
        companyQualifications: sections.find(s => s.id === 'company_overview')?.content,
        riskManagement: sections.find(s => s.id === 'risk_management')?.content,
        qualityAssurance: sections.find(s => s.id === 'quality_assurance')?.content,
        timeline: proposalData.deliveryTimeline ? {
          totalDuration: `${proposalData.deliveryTimeline} days`,
        } : undefined,
        budget: proposalData.estimatedBudget ? {
          totalAmount: Number(proposalData.estimatedBudget),
          currency: 'USD',
        } : undefined,
      },
      status: 'submitted' as const,
    };

    onSubmit?.(proposal);
  };

  // Get completion percentage
  const getCompletionPercentage = () => {
    const requiredSections = sections.filter(s => s.required);
    const completedSections = requiredSections.filter(s => s.content.trim());
    const basicInfoComplete = proposalData.title && proposalData.description;
    
    const totalRequired = requiredSections.length + 1; // +1 for basic info
    const totalCompleted = completedSections.length + (basicInfoComplete ? 1 : 0);
    
    return Math.round((totalCompleted / totalRequired) * 100);
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            Create Proposal
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Proposal for: {tender.title}
          </Typography>
          
          {/* Progress Indicator */}
          <Box display="flex" alignItems="center" gap={2} mt={2}>
            <Typography variant="body2" color="text.secondary">
              Completion: {getCompletionPercentage()}%
            </Typography>
            <Box flexGrow={1} bgcolor="grey.200" borderRadius={1} height={8}>
              <Box
                bgcolor="primary.main"
                borderRadius={1}
                height="100%"
                width={`${getCompletionPercentage()}%`}
                sx={{ transition: 'width 0.3s ease' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix the following issues:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Main Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {/* Step 1: Basic Information */}
        <Step>
          <StepLabel>Basic Information</StepLabel>
          <StepContent>
            <Box sx={{ maxWidth: 600 }}>
              <TextField
                fullWidth
                label="Proposal Title"
                value={proposalData.title}
                onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Proposal Description"
                value={proposalData.description}
                onChange={(e) => setProposalData(prev => ({ ...prev, description: e.target.value }))}
                margin="normal"
                multiline
                rows={3}
                required
              />

              <TextField
                fullWidth
                label="Estimated Budget (USD)"
                type="number"
                value={proposalData.estimatedBudget}
                onChange={(e) => setProposalData(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Delivery Timeline (days)"
                type="number"
                value={proposalData.deliveryTimeline}
                onChange={(e) => setProposalData(prev => ({ ...prev, deliveryTimeline: e.target.value }))}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Cover Letter"
                value={proposalData.coverLetter}
                onChange={(e) => setProposalData(prev => ({ ...prev, coverLetter: e.target.value }))}
                margin="normal"
                multiline
                rows={4}
                placeholder="Introduce your company and explain why you're the best choice for this project..."
              />

              <Box mt={3}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  disabled={!proposalData.title || !proposalData.description}
                >
                  Continue to Sections
                </Button>
              </Box>
            </Box>
          </StepContent>
        </Step>

        {/* Step 2: Proposal Sections */}
        <Step>
          <StepLabel>Proposal Sections</StepLabel>
          <StepContent>
            <Box>
              <Typography variant="body1" paragraph>
                Build your proposal by completing the sections below. Use AI assistance to generate content based on the tender requirements.
              </Typography>

              {sections.map((section) => (
                <Accordion key={section.id} sx={{ mb: 1 }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{
                      bgcolor: section.content ? 'success.light' : section.required ? 'warning.light' : 'grey.50',
                      '&:hover': { bgcolor: section.content ? 'success.main' : section.required ? 'warning.main' : 'grey.100' },
                    }}
                  >
                    <Box display="flex" alignItems="center" width="100%">
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {section.title}
                      </Typography>
                      <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                        {section.required && (
                          <Chip label="Required" size="small" color="warning" />
                        )}
                        {section.aiGenerated && (
                          <Chip label="AI Generated" size="small" color="info" />
                        )}
                        {section.content && (
                          <Chip label="Complete" size="small" color="success" />
                        )}
                      </Stack>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box mb={2}>
                      <Button
                        variant="outlined"
                        startIcon={aiGenerating === section.id ? <CircularProgress size={20} /> : <AutoFixHigh />}
                        onClick={() => generateAIContent(section.id)}
                        disabled={aiGenerating === section.id}
                        sx={{ mb: 2 }}
                      >
                        {aiGenerating === section.id ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    </Box>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={section.content}
                      onChange={(e) => updateSectionContent(section.id, e.target.value)}
                      placeholder={`Write your ${section.title.toLowerCase()} here...`}
                    />
                  </AccordionDetails>
                </Accordion>
              ))}

              <Box mt={3} display="flex" gap={2}>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(2)}
                >
                  Continue to Review
                </Button>
              </Box>
            </Box>
          </StepContent>
        </Step>

        {/* Step 3: Review & Submit */}
        <Step>
          <StepLabel>Review & Submit</StepLabel>
          <StepContent>
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Review your proposal carefully before submitting. Once submitted, you may not be able to make changes.
              </Alert>

              {/* Summary */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Proposal Summary
                </Typography>
                <Typography><strong>Title:</strong> {proposalData.title}</Typography>
                <Typography><strong>Budget:</strong> {proposalData.estimatedBudget ? `$${proposalData.estimatedBudget}` : 'Not specified'}</Typography>
                <Typography><strong>Timeline:</strong> {proposalData.deliveryTimeline ? `${proposalData.deliveryTimeline} days` : 'Not specified'}</Typography>
                <Typography><strong>Sections Completed:</strong> {sections.filter(s => s.content).length} of {sections.length}</Typography>
              </Paper>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button variant="outlined" onClick={() => setActiveStep(1)}>
                  Back to Edit
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Preview />}
                  onClick={() => setShowPreview(true)}
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={loading || !proposalData.title || !proposalData.description}
                >
                  Submit Proposal
                </Button>
                {onCancel && (
                  <Button variant="text" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
              </Box>
            </Box>
          </StepContent>
        </Step>
      </Stepper>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        <DialogTitle>Proposal Preview</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h4" gutterBottom>{proposalData.title}</Typography>
          <Typography variant="body1" paragraph>{proposalData.description}</Typography>
          
          {proposalData.coverLetter && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>Cover Letter</Typography>
              <Typography variant="body1" paragraph>{proposalData.coverLetter}</Typography>
            </Box>
          )}

          {sections.filter(s => s.content).map((section) => (
            <Box key={section.id} mb={3}>
              <Typography variant="h6" gutterBottom>{section.title}</Typography>
              <Typography variant="body1" paragraph>{section.content}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalGenerator;
