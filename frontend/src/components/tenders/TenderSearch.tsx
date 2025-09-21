import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip,
  Button,
  Collapse,
  Paper,
  Typography,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

export interface SearchFilters {
  query?: string;
  category?: string;
  industry?: string;
  location?: string;
  minValue?: number;
  maxValue?: number;
  tenderType?: string;
  status?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
}

interface TenderSearchProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  initialFilters?: SearchFilters;
  categories?: string[];
  industries?: string[];
  locations?: string[];
}

const tenderTypes = [
  { value: 'open', label: 'Open Tender' },
  { value: 'selective', label: 'Selective Tender' },
  { value: 'negotiated', label: 'Negotiated Tender' },
  { value: 'competitive', label: 'Competitive Tender' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'evaluation', label: 'Under Evaluation' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'closed', label: 'Closed' },
];

const TenderSearch: React.FC<TenderSearchProps> = ({
  onSearch,
  loading = false,
  initialFilters = {},
  categories = [],
  industries = [],
  locations = [],
}) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialFilters.query || '');

  // Simple debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      onSearch(searchFilters);
    }, 300),
    [onSearch]
  );

  // Update filters and trigger search
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    updateFilters({ query });
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = { query: '' };
    setFilters(clearedFilters);
    setSearchQuery('');
    onSearch(clearedFilters);
  };

  // Check if any advanced filters are active
  const hasAdvancedFilters = Boolean(
    filters.category ||
    filters.industry ||
    filters.location ||
    filters.minValue ||
    filters.maxValue ||
    filters.tenderType ||
    filters.status ||
    filters.deadlineFrom ||
    filters.deadlineTo
  );

  return (
    <Box>
      {/* Main Search Bar */}
      <Box display="flex" gap={1} mb={2}>
        <TextField
          fullWidth
          placeholder="Search tenders by title, description, or organization..."
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    updateFilters({ query: '' });
                  }}
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          variant={showAdvanced || hasAdvancedFilters ? 'contained' : 'outlined'}
          onClick={() => setShowAdvanced(!showAdvanced)}
          startIcon={<FilterList />}
          endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
          sx={{ minWidth: 'fit-content' }}
        >
          Filters
        </Button>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Advanced Filters
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
              mb: 3,
            }}
          >
            {/* Category */}
            <Autocomplete
              options={categories}
              value={filters.category || null}
              onChange={(event, value) => updateFilters({ category: value || undefined })}
              renderInput={(params) => (
                <TextField {...params} label="Category" size="small" />
              )}
            />

            {/* Industry */}
            <Autocomplete
              options={industries}
              value={filters.industry || null}
              onChange={(event, value) => updateFilters({ industry: value || undefined })}
              renderInput={(params) => (
                <TextField {...params} label="Industry" size="small" />
              )}
            />

            {/* Location */}
            <Autocomplete
              options={locations}
              value={filters.location || null}
              onChange={(event, value) => updateFilters({ location: value || undefined })}
              renderInput={(params) => (
                <TextField {...params} label="Location" size="small" />
              )}
            />

            {/* Tender Type */}
            <Autocomplete
              options={tenderTypes}
              getOptionLabel={(option) => option.label}
              value={tenderTypes.find(type => type.value === filters.tenderType) || null}
              onChange={(event, value) => updateFilters({ tenderType: value?.value || undefined })}
              renderInput={(params) => (
                <TextField {...params} label="Tender Type" size="small" />
              )}
            />

            {/* Status */}
            <Autocomplete
              options={statusOptions}
              getOptionLabel={(option) => option.label}
              value={statusOptions.find(status => status.value === filters.status) || null}
              onChange={(event, value) => updateFilters({ status: value?.value || undefined })}
              renderInput={(params) => (
                <TextField {...params} label="Status" size="small" />
              )}
            />

            {/* Min Value */}
            <TextField
              label="Min Value"
              type="number"
              size="small"
              value={filters.minValue || ''}
              onChange={(e) => updateFilters({ minValue: e.target.value ? Number(e.target.value) : undefined })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            {/* Max Value */}
            <TextField
              label="Max Value"
              type="number"
              size="small"
              value={filters.maxValue || ''}
              onChange={(e) => updateFilters({ maxValue: e.target.value ? Number(e.target.value) : undefined })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            {/* Deadline From */}
            <TextField
              label="Deadline From"
              type="date"
              size="small"
              value={filters.deadlineFrom ? filters.deadlineFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilters({ deadlineFrom: e.target.value ? new Date(e.target.value) : undefined })}
              InputLabelProps={{
                shrink: true,
              }}
            />

            {/* Deadline To */}
            <TextField
              label="Deadline To"
              type="date"
              size="small"
              value={filters.deadlineTo ? filters.deadlineTo.toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilters({ deadlineTo: e.target.value ? new Date(e.target.value) : undefined })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>

          {/* Active Filters */}
          {hasAdvancedFilters && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Filters:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {filters.category && (
                  <Chip
                    label={`Category: ${filters.category}`}
                    size="small"
                    onDelete={() => updateFilters({ category: undefined })}
                  />
                )}
                {filters.industry && (
                  <Chip
                    label={`Industry: ${filters.industry}`}
                    size="small"
                    onDelete={() => updateFilters({ industry: undefined })}
                  />
                )}
                {filters.location && (
                  <Chip
                    label={`Location: ${filters.location}`}
                    size="small"
                    onDelete={() => updateFilters({ location: undefined })}
                  />
                )}
                {filters.tenderType && (
                  <Chip
                    label={`Type: ${tenderTypes.find(t => t.value === filters.tenderType)?.label}`}
                    size="small"
                    onDelete={() => updateFilters({ tenderType: undefined })}
                  />
                )}
                {filters.status && (
                  <Chip
                    label={`Status: ${statusOptions.find(s => s.value === filters.status)?.label}`}
                    size="small"
                    onDelete={() => updateFilters({ status: undefined })}
                  />
                )}
                {(filters.minValue || filters.maxValue) && (
                  <Chip
                    label={`Value: $${filters.minValue || 0} - $${filters.maxValue || '∞'}`}
                    size="small"
                    onDelete={() => updateFilters({ minValue: undefined, maxValue: undefined })}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={clearFilters}>
              Clear All Filters
            </Button>
            <Button variant="contained" onClick={() => setShowAdvanced(false)}>
              Apply Filters
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default TenderSearch;
