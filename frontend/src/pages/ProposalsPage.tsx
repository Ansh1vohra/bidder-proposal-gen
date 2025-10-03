import React, { useState } from 'react';
import { Container, Typography, Box, Dialog, DialogContent } from '@mui/material';
import ProposalList from '../components/proposals/ProposalList';
import { useProposals } from '../hooks/useProposals';
import { Proposal } from '../types';
import ProposalViewer from '../components/proposals/ProposalViewer';

const ProposalsPage: React.FC = () => {
  const { data, isLoading, error } = useProposals();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Proposals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your submitted and draft proposals
        </Typography>
      </Box>

      <ProposalList 
        proposals={data?.proposals || []}
        loading={isLoading}
        error={error?.message}
        onProposalView={(p) => setSelectedProposal(p)}
      />

      <Dialog open={!!selectedProposal} onClose={() => setSelectedProposal(null)} maxWidth="md" fullWidth>
        <DialogContent>
          {selectedProposal && <ProposalViewer proposal={selectedProposal} />}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ProposalsPage;
