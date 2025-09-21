import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import TenderList from '../components/tenders/TenderList';
import TenderSearch from '../components/tenders/TenderSearch';
import { useTenders } from '../hooks/useTenders';

const TendersPage: React.FC = () => {
  const { data, isLoading, error } = useTenders();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Browse Tenders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover relevant tender opportunities matching your expertise
        </Typography>
      </Box>

      <TenderSearch onSearch={() => {}} />
      
      <Box sx={{ mt: 3 }}>
        <TenderList 
          tenders={data?.tenders || []}
          loading={isLoading}
          error={error?.message}
        />
      </Box>
    </Container>
  );
};

export default TendersPage;
