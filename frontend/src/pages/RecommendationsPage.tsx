import React from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';

const RecommendationsPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Recommendations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered tender recommendations based on your profile and preferences
        </Typography>
      </Box>

      <Alert severity="info">
        Recommendation system is being configured. Check back soon for personalized tender suggestions!
      </Alert>
    </Container>
  );
};

export default RecommendationsPage;
