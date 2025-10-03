import React from 'react';
import { Box, Typography, Divider, Chip, Card, CardContent, Stack, Button, Paper, List, ListItem, ListItemIcon, ListItemText, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Download, Print, Shield, RocketLaunch, Timeline, Insights, CheckCircle, Security, Schedule, MonetizationOn } from '@mui/icons-material';
import { proposalService } from '../../services/proposalService';
import { Proposal, Tender } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatUtils';

interface ProposalViewerProps {
  proposal: Proposal;
}

const Watermark: React.FC = () => {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gridAutoRows: '120px',
        opacity: 0.06,
      }}
    >
      {Array.from({ length: 48 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-30deg)',
            fontWeight: 900,
            fontSize: { xs: 22, md: 28 },
            color: 'text.primary',
            userSelect: 'none',
          }}
        >
          CIVILYTIX
        </Box>
      ))}
    </Box>
  );
};

const ProposalViewer: React.FC<ProposalViewerProps> = ({ proposal }) => {
  const tender: Tender | null = typeof proposal.tenderId === 'object' ? proposal.tenderId : null;

  // Dummy enhanced content
  const dummyContent = {
    executiveSummary: `Civilytix AI presents a comprehensive solution for ${tender?.title || 'this project'} that leverages cutting-edge technology and industry best practices. Our proposal demonstrates deep understanding of the project requirements and delivers value through innovative approaches, cost optimization, and accelerated delivery timelines.

Key Highlights:
• 15+ years of combined experience in similar projects
• 98% client satisfaction rate with on-time delivery
• Advanced AI-driven project management and risk mitigation
• Certified ISO 9001:2015 quality management systems
• Strong local partnerships for supply chain optimization`,

    proposedSolution: `Our solution architecture is built on three core pillars:

1. TECHNICAL EXCELLENCE
We propose a modular, scalable approach using industry-standard technologies and methodologies. Our team will implement best practices for quality assurance, documentation, and knowledge transfer.

2. AGILE DELIVERY
Utilizing Agile/Scrum methodologies with 2-week sprints, ensuring continuous client feedback and rapid adaptation to changing requirements. Daily standups, weekly demos, and transparent progress tracking.

3. RISK MITIGATION
Comprehensive risk assessment with proactive mitigation strategies:
- Technical risks: Prototype validation and proof-of-concept development
- Schedule risks: Buffer allocation and parallel workstreams
- Quality risks: Automated testing and peer review processes`,

    timeline: {
      totalDuration: '16 weeks',
      phases: [
        { name: 'Discovery & Planning', duration: '2 weeks', description: 'Requirements analysis, stakeholder interviews, technical assessment' },
        { name: 'Design & Architecture', duration: '3 weeks', description: 'System design, technical specifications, approval workflows' },
        { name: 'Development Phase 1', duration: '4 weeks', description: 'Core functionality development, initial testing' },
        { name: 'Development Phase 2', duration: '4 weeks', description: 'Advanced features, integration, performance optimization' },
        { name: 'Testing & QA', duration: '2 weeks', description: 'Comprehensive testing, bug fixes, performance validation' },
        { name: 'Deployment & Handover', duration: '1 week', description: 'Production deployment, training, documentation handover' }
      ]
    },

    budget: {
      totalAmount: 285000,
      currency: 'USD',
      breakdown: [
        { category: 'Development', amount: 185000, percentage: 65 },
        { category: 'Project Management', amount: 35000, percentage: 12 },
        { category: 'Testing & QA', amount: 25000, percentage: 9 },
        { category: 'Documentation', amount: 15000, percentage: 5 },
        { category: 'Training & Support', amount: 25000, percentage: 9 }
      ]
    },

    qualifications: [
      'ISO 9001:2015 Quality Management Certification',
      'CMMI Level 3 Maturity for Development',
      'SOC 2 Type II Compliance for Security',
      'Agile/Scrum Master Certifications',
      'Industry-specific certifications and partnerships'
    ],

    riskMitigation: [
      { risk: 'Technical Complexity', mitigation: 'Proof-of-concept development and technical spikes', impact: 'Medium' },
      { risk: 'Resource Availability', mitigation: 'Cross-trained team members and backup resources', impact: 'Low' },
      { risk: 'Scope Creep', mitigation: 'Clear change management process and approval workflows', impact: 'Medium' },
      { risk: 'Third-party Dependencies', mitigation: 'Early vendor engagement and alternative options', impact: 'Low' }
    ]
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Watermark />
      <Box sx={{ position: 'relative' }}>
        {/* Hero Header */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.2 }}>
                  CIVILYTIX AI PROPOSAL
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                  {tender?.title || 'AI-Generated Proposal'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Proposal #{proposal._id.slice(-6)} • Created {formatDate(proposal.createdAt)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={proposal.status.replace('_', ' ')}
                  color={proposal.status === 'accepted' ? 'success' : proposal.status === 'rejected' ? 'error' : 'default'}
                  size="small"
                  sx={{ textTransform: 'capitalize', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Download />}
                  onClick={() => proposalService.downloadProposal(proposal._id)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                  Download
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Print />}
                  onClick={() => window.print()}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                  Print
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Shield fontSize="small" />
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Security-first • Compliance-ready
                  </Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <RocketLaunch fontSize="small" />
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Accelerated delivery with QA gates
                  </Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Insights fontSize="small" />
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    KPI-driven outcomes and transparency
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
              📄 Executive Summary
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {proposal.content?.executiveSummary || dummyContent.executiveSummary}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Timeline fontSize="small" color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                🔧 Proposed Solution
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, whiteSpace: 'pre-line' }}>
              {proposal.content?.proposedSolution || dummyContent.proposedSolution}
            </Typography>
          </CardContent>
        </Card>

        {/* Project Timeline */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Schedule fontSize="small" color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                📅 Implementation Timeline
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total Duration: {proposal.content?.timeline?.totalDuration || dummyContent.timeline.totalDuration}
            </Typography>
            
            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {dummyContent.timeline.phases.map((phase, index) => (
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }} key={index}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Phase {index + 1}: {phase.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Duration: {phase.duration}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {phase.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Budget Breakdown */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <MonetizationOn fontSize="small" color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                💰 Budget Summary
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'success.main' }}>
              {formatCurrency(
                proposal.content?.budget?.totalAmount || dummyContent.budget.totalAmount,
                proposal.content?.budget?.currency || dummyContent.budget.currency
              )}
            </Typography>
            
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dummyContent.budget.breakdown.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.amount, dummyContent.budget.currency)}
                    </TableCell>
                    <TableCell align="right">{item.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Company Qualifications */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Security fontSize="small" color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                🏆 Company Qualifications
              </Typography>
            </Stack>
            <List dense>
              {dummyContent.qualifications.map((qualification, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircle color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={qualification} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Shield fontSize="small" color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                ⚠️ Risk Assessment & Mitigation
              </Typography>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Risk</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mitigation Strategy</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Impact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dummyContent.riskMitigation.map((risk, index) => (
                  <TableRow key={index}>
                    <TableCell>{risk.risk}</TableCell>
                    <TableCell>{risk.mitigation}</TableCell>
                    <TableCell>
                      <Chip 
                        label={risk.impact} 
                        size="small" 
                        color={risk.impact === 'Low' ? 'success' : risk.impact === 'Medium' ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary">
          Generated by Civilytix AI • Confidential • For demonstration purposes
        </Typography>
      </Box>
      {/* Text watermark overlay */}
      <Watermark />
    </Box>
  );
};

export default ProposalViewer;


