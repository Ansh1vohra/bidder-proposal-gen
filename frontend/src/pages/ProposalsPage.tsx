import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ProposalList from '../components/proposals/ProposalList';
import { useProposals } from '../hooks/useProposals';

const ProposalsPage: React.FC = () => {
  const { data, isLoading, error } = useProposals();

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
      />
    </Container>
  );
};

export default ProposalsPage;
