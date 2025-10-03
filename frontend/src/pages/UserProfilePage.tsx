import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
  Stack,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { apiClient } from '../services/apiClient';

interface ProfileFormData {
  name: string;
  email: string;
  companyName: string;
  contactNumber: string;
  bio: string;
  website: string;
}

const UserProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    companyName: user?.profile?.companyName || '',
    contactNumber: user?.profile?.contactNumber || '',
    bio: user?.profile?.bio || '',
    website: user?.profile?.website || '',
  });

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiClient.put('/users/profile', {
        name: formData.name,
        profile: {
          companyName: formData.companyName,
          contactNumber: formData.contactNumber,
          bio: formData.bio,
          website: formData.website,
        }
      });
      if (response.success) {
        updateUser(response.data);
        showNotification('success', 'Success', 'Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      showNotification('error', 'Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      companyName: user?.profile?.companyName || '',
      contactNumber: user?.profile?.contactNumber || '',
      bio: user?.profile?.bio || '',
      website: user?.profile?.website || '',
    });
    setIsEditing(false);
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanDisplayName = (plan: string) => {
    const planNames: Record<string, string> = {
      free: 'Free Plan',
      basic: 'Basic Plan',
      professional: 'Professional Plan',
      enterprise: 'Enterprise Plan'
    };
    return planNames[plan] || plan;
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Please log in to view your profile.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              mr: 3,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {user.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            <Chip
              label={getPlanDisplayName(user.subscription?.currentPlan || 'free')}
              color="primary"
              size="small"
            />
          </Box>
          <Button
            variant={isEditing ? "outlined" : "contained"}
            startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
            onClick={isEditing ? handleCancel : () => setIsEditing(true)}
            sx={{ mr: 1 }}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
          {isEditing && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              Save
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Profile Information */}
        <Typography variant="h5" gutterBottom>
          Profile Information
        </Typography>

        <Stack spacing={3} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              variant={isEditing ? "outlined" : "filled"}
            />
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              disabled={true}
              variant="filled"
              helperText="Email cannot be changed"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              disabled={!isEditing}
              variant={isEditing ? "outlined" : "filled"}
            />
            <TextField
              fullWidth
              label="Contact Number"
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              disabled={!isEditing}
              variant={isEditing ? "outlined" : "filled"}
            />
          </Box>

          <TextField
            fullWidth
            label="Website"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            disabled={!isEditing}
            variant={isEditing ? "outlined" : "filled"}
            placeholder="https://www.example.com"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing}
            variant={isEditing ? "outlined" : "filled"}
            placeholder="Tell us about yourself and your company..."
          />
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Account Information */}
        <Typography variant="h5" gutterBottom>
          Account Information
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
          gap: 3,
          mt: 2 
        }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Account Status
              </Typography>
              <Chip 
                label={user.emailVerified ? 'Verified' : 'Unverified'} 
                color={user.emailVerified ? 'success' : 'warning'}
                size="small"
              />
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Subscription Plan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getPlanDisplayName(user.subscription?.currentPlan || 'free')}
              </Typography>
              <Typography variant="caption" display="block">
                Status: {user.subscription?.status || 'Active'}
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Member Since
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(user.createdAt)}
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(user.updatedAt)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Usage Statistics */}
        {user.subscription?.usage && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h5" gutterBottom>
              Usage Statistics
            </Typography>
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Proposal Generation
                </Typography>
                <Typography variant="h6" color="primary">
                  {user.subscription.usage.proposalsGenerated} / {user.subscription.usage.monthlyLimit}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  This month (resets {formatDate(user.subscription.usage.lastResetDate)})
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default UserProfilePage;