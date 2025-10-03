import React, { useState } from 'react';
import { Container, Typography, Box, Dialog, DialogContent, CircularProgress } from '@mui/material';
import TenderList from '../components/tenders/TenderList';
import TenderSearch from '../components/tenders/TenderSearch';
import { useTenders } from '../hooks/useTenders';
import TenderDetail from '../components/tenders/TenderDetail';
import { Tender, Proposal } from '../types';
import { proposalService } from '../services/proposalService';
import ProposalViewer from '../components/proposals/ProposalViewer';

const TendersPage: React.FC = () => {
  const { data, isLoading, error } = useTenders();
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [generatedProposal, setGeneratedProposal] = useState<Proposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Browse Tenders
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Discover relevant tender opportunities matching your expertise with AI-powered insights
          </Typography>
        </Box>

        <TenderSearch onSearch={() => {}} />
        
        <Box sx={{ mt: 3 }}>
          <TenderList 
            tenders={data?.tenders || []}
            loading={isLoading}
            error={error?.message}
            onTenderView={(t) => setSelectedTender(t)}
            onTenderApply={async (t) => {
              setIsGenerating(true);
              setGeneratedProposal(null);
              try {
                const p = await proposalService.generateProposal(t._id);
                setGeneratedProposal(p);
              } catch (e) {
                console.error(e);
              } finally {
                setIsGenerating(false);
              }
            }}
          />
        </Box>

        {/* Tender details modal */}
        <Dialog open={!!selectedTender} onClose={() => setSelectedTender(null)} maxWidth="md" fullWidth>
          <DialogContent>
            {selectedTender && (
              <TenderDetail 
                tender={selectedTender}
                onBack={() => setSelectedTender(null)}
                onApply={() => setSelectedTender(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Generated AI proposal modal with enhanced content */}
        <Dialog open={isGenerating || !!generatedProposal} onClose={() => setGeneratedProposal(null)} maxWidth="lg" fullWidth>
          <DialogContent sx={{ p: 0 }}>
            {isGenerating && (
              <Box 
                display="flex" 
                flexDirection="column"
                alignItems="center" 
                justifyContent="center" 
                minHeight="400px"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textAlign: 'center',
                }}
              >
                <CircularProgress sx={{ color: 'white', mb: 3 }} size={60} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  🤖 Generating AI Proposal...
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                  Our AI is analyzing the tender requirements and crafting a tailored proposal
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  This usually takes 30-45 seconds
                </Typography>
              </Box>
            )}
            {!isGenerating && generatedProposal && (
              <ProposalViewer proposal={generatedProposal} />
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TendersPage;
