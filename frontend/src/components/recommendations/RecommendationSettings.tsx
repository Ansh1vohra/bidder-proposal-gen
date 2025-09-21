import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  TextField,
  Button,
  Divider,
  Stack,
  Chip,
  Autocomplete,
  Switch,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Settings,
  Save,
  Refresh,
  NotificationsActive,
  LocationOn,
  Business,
  AttachMoney,
  Schedule,
  Info,
  Delete,
} from '@mui/icons-material';

interface RecommendationPreferences {
  categories: string[];
  keywords: string[];
  budgetRange: [number, number];
  locations: string[];
  organizationTypes: string[];
  minMatchScore: number;
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
    immediateAlerts: boolean;
  };
  filters: {
    excludeKeywords: string[];
    maxDistance: number; // in km
    preferredDeadlineDays: number; // minimum days before deadline
  };
}

interface RecommendationSettingsProps {
  preferences: RecommendationPreferences;
  onSave: (preferences: RecommendationPreferences) => void;
  onRefreshRecommendations?: () => void;
  loading?: boolean;
}

const defaultCategories = [
  'IT Services',
  'Construction',
  'Healthcare',
  'Education',
  'Transportation',
  'Security Services',
  'Consulting',
  'Manufacturing',
  'Maintenance',
  'Cleaning Services',
  'Legal Services',
  'Finance',
  'Marketing',
  'Research & Development',
];

const organizationTypeOptions = [
  'Government',
  'Public Sector',
  'Private Company',
  'NGO',
  'Educational Institution',
  'Healthcare Organization',
  'Municipal Corporation',
];

const RecommendationSettings: React.FC<RecommendationSettingsProps> = ({
  preferences,
  onSave,
  onRefreshRecommendations,
  loading = false,
}) => {
  const [localPreferences, setLocalPreferences] = useState<RecommendationPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleNestedChange = (parent: keyof RecommendationPreferences, field: string, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localPreferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !localPreferences.keywords.includes(keyword)) {
      handleChange('keywords', [...localPreferences.keywords, keyword]);
    }
  };

  const removeKeyword = (keyword: string) => {
    handleChange('keywords', localPreferences.keywords.filter(k => k !== keyword));
  };

  const addExcludeKeyword = (keyword: string) => {
    if (keyword && !localPreferences.filters.excludeKeywords.includes(keyword)) {
      handleNestedChange('filters', 'excludeKeywords', [
        ...localPreferences.filters.excludeKeywords,
        keyword
      ]);
    }
  };

  const removeExcludeKeyword = (keyword: string) => {
    handleNestedChange('filters', 'excludeKeywords',
      localPreferences.filters.excludeKeywords.filter(k => k !== keyword)
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Recommendation Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customize your tender recommendations to match your preferences and capabilities.
        </Typography>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Don't forget to save your preferences.
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Categories */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
              Categories of Interest
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the tender categories you're interested in
            </Typography>
            
            <FormGroup>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
                {defaultCategories.map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Checkbox
                        checked={localPreferences.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange('categories', [...localPreferences.categories, category]);
                          } else {
                            handleChange('categories', localPreferences.categories.filter(c => c !== category));
                          }
                        }}
                      />
                    }
                    label={category}
                  />
                ))}
              </Box>
            </FormGroup>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Keywords & Skills
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add keywords related to your expertise and services
            </Typography>
            
            <Stack spacing={2}>
              <Autocomplete
                freeSolo
                options={[]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add keywords"
                    placeholder="Type and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value) {
                          addKeyword(value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                )}
              />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {localPreferences.keywords.map((keyword) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    onDelete={() => removeKeyword(keyword)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Budget Range */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
              Budget Range
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set your preferred tender budget range (in USD)
            </Typography>
            
            <Box sx={{ px: 2 }}>
              <Slider
                value={localPreferences.budgetRange}
                onChange={(_, value) => handleChange('budgetRange', value)}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                min={0}
                max={10000000}
                step={10000}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 1000000, label: '$1M' },
                  { value: 5000000, label: '$5M' },
                  { value: 10000000, label: '$10M+' },
                ]}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
              Preferred Locations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add locations where you prefer to work
            </Typography>
            
            <Stack spacing={2}>
              <Autocomplete
                multiple
                freeSolo
                value={localPreferences.locations}
                onChange={(_, value) => handleChange('locations', value)}
                options={[]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add locations"
                    placeholder="Add cities, states, or countries"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Organization Types */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Organization Types
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the types of organizations you prefer to work with
            </Typography>
            
            <FormGroup>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
                {organizationTypeOptions.map((type) => (
                  <FormControlLabel
                    key={type}
                    control={
                      <Checkbox
                        checked={localPreferences.organizationTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange('organizationTypes', [...localPreferences.organizationTypes, type]);
                          } else {
                            handleChange('organizationTypes', localPreferences.organizationTypes.filter(t => t !== type));
                          }
                        }}
                      />
                    }
                    label={type}
                  />
                ))}
              </Box>
            </FormGroup>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Advanced Filters
            </Typography>
            
            <Stack spacing={3}>
              {/* Minimum Match Score */}
              <Box>
                <Typography variant="body2" gutterBottom>
                  Minimum Match Score: {localPreferences.minMatchScore}%
                </Typography>
                <Slider
                  value={localPreferences.minMatchScore}
                  onChange={(_, value) => handleChange('minMatchScore', value)}
                  step={5}
                  marks
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Excluded Keywords */}
              <Box>
                <Typography variant="body2" gutterBottom>
                  Exclude Keywords
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Tenders containing these keywords will be excluded from recommendations
                </Typography>
                
                <Stack spacing={2}>
                  <Autocomplete
                    freeSolo
                    options={[]}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Add keywords to exclude"
                        placeholder="Type and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              addExcludeKeyword(value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    )}
                  />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {localPreferences.filters.excludeKeywords.map((keyword) => (
                      <Chip
                        key={keyword}
                        label={keyword}
                        onDelete={() => removeExcludeKeyword(keyword)}
                        color="error"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Stack>
              </Box>

              {/* Deadline Preference */}
              <Box>
                <Typography variant="body2" gutterBottom>
                  Minimum Days Before Deadline: {localPreferences.filters.preferredDeadlineDays}
                </Typography>
                <Slider
                  value={localPreferences.filters.preferredDeadlineDays}
                  onChange={(_, value) => handleNestedChange('filters', 'preferredDeadlineDays', value)}
                  step={1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 7, label: '1 week' },
                    { value: 30, label: '1 month' },
                    { value: 90, label: '3 months' },
                  ]}
                  min={0}
                  max={90}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              <NotificationsActive sx={{ mr: 1, verticalAlign: 'middle' }} />
              Notification Settings
            </Typography>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.notificationSettings.emailNotifications}
                    onChange={(e) => handleNestedChange('notificationSettings', 'emailNotifications', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.notificationSettings.pushNotifications}
                    onChange={(e) => handleNestedChange('notificationSettings', 'pushNotifications', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.notificationSettings.weeklyDigest}
                    onChange={(e) => handleNestedChange('notificationSettings', 'weeklyDigest', e.target.checked)}
                  />
                }
                label="Weekly Digest Email"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={localPreferences.notificationSettings.immediateAlerts}
                    onChange={(e) => handleNestedChange('notificationSettings', 'immediateAlerts', e.target.checked)}
                  />
                }
                label="Immediate Alerts for High Matches (90%+)"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset Changes
            </Button>
            
            <Stack direction="row" spacing={2}>
              {onRefreshRecommendations && (
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={onRefreshRecommendations}
                  disabled={loading}
                >
                  Refresh Recommendations
                </Button>
              )}
              
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!hasChanges || loading}
              >
                Save Preferences
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default RecommendationSettings;
