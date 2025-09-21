import React from 'react';
import {
  Box,
  Drawer,
  Typography,
  Divider,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  TextField,
  Button,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { Close, FilterList } from '@mui/icons-material';
import { SearchFilters } from './TenderSearch';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface TenderFilterProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  options: {
    categories: FilterOption[];
    industries: FilterOption[];
    locations: FilterOption[];
    tenderTypes: FilterOption[];
    statuses: FilterOption[];
  };
  priceRange?: {
    min: number;
    max: number;
  };
}

const TenderFilter: React.FC<TenderFilterProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange,
  options,
  priceRange = { min: 0, max: 1000000 },
}) => {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  const renderCheckboxGroup = (
    title: string,
    filterKey: keyof SearchFilters,
    options: FilterOption[]
  ) => (
    <Box mb={3}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <FormGroup>
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={filters[filterKey] === option.value}
                onChange={(e) => 
                  updateFilter(filterKey, e.target.checked ? option.value : undefined)
                }
                size="small"
              />
            }
            label={
              <Box display="flex" justifyContent="space-between" width="100%">
                <Typography variant="body2">{option.label}</Typography>
                {option.count && (
                  <Typography variant="caption" color="text.secondary">
                    ({option.count})
                  </Typography>
                )}
              </Box>
            }
          />
        ))}
      </FormGroup>
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          p: 3,
        },
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <FilterList sx={{ mr: 1 }} />
          <Typography variant="h6">Filters</Typography>
          {getActiveFilterCount() > 0 && (
            <Chip
              label={getActiveFilterCount()}
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Active Filters
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {filters.category && (
              <Chip
                label={`Category: ${filters.category}`}
                size="small"
                onDelete={() => updateFilter('category', undefined)}
              />
            )}
            {filters.industry && (
              <Chip
                label={`Industry: ${filters.industry}`}
                size="small"
                onDelete={() => updateFilter('industry', undefined)}
              />
            )}
            {filters.location && (
              <Chip
                label={`Location: ${filters.location}`}
                size="small"
                onDelete={() => updateFilter('location', undefined)}
              />
            )}
            {filters.tenderType && (
              <Chip
                label={`Type: ${filters.tenderType}`}
                size="small"
                onDelete={() => updateFilter('tenderType', undefined)}
              />
            )}
            {filters.status && (
              <Chip
                label={`Status: ${filters.status}`}
                size="small"
                onDelete={() => updateFilter('status', undefined)}
              />
            )}
          </Stack>
          <Button
            variant="text"
            size="small"
            onClick={clearFilters}
            sx={{ mt: 1, p: 0 }}
          >
            Clear All
          </Button>
          <Divider sx={{ mt: 2, mb: 3 }} />
        </Box>
      )}

      {/* Category Filter */}
      {renderCheckboxGroup('Category', 'category', options.categories)}

      <Divider sx={{ mb: 3 }} />

      {/* Industry Filter */}
      {renderCheckboxGroup('Industry', 'industry', options.industries)}

      <Divider sx={{ mb: 3 }} />

      {/* Location Filter */}
      {renderCheckboxGroup('Location', 'location', options.locations)}

      <Divider sx={{ mb: 3 }} />

      {/* Tender Type Filter */}
      {renderCheckboxGroup('Tender Type', 'tenderType', options.tenderTypes)}

      <Divider sx={{ mb: 3 }} />

      {/* Status Filter */}
      {renderCheckboxGroup('Status', 'status', options.statuses)}

      <Divider sx={{ mb: 3 }} />

      {/* Price Range */}
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Estimated Value Range
        </Typography>
        <Box px={1}>
          <Slider
            value={[filters.minValue || priceRange.min, filters.maxValue || priceRange.max]}
            onChange={(event, newValue) => {
              const [min, max] = newValue as number[];
              updateFilter('minValue', min === priceRange.min ? undefined : min);
              updateFilter('maxValue', max === priceRange.max ? undefined : max);
            }}
            valueLabelDisplay="auto"
            min={priceRange.min}
            max={priceRange.max}
            step={10000}
            valueLabelFormat={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <TextField
              label="Min"
              type="number"
              size="small"
              value={filters.minValue || ''}
              onChange={(e) => updateFilter('minValue', e.target.value ? Number(e.target.value) : undefined)}
              sx={{ width: '48%' }}
              InputProps={{
                startAdornment: '$',
              }}
            />
            <TextField
              label="Max"
              type="number"
              size="small"
              value={filters.maxValue || ''}
              onChange={(e) => updateFilter('maxValue', e.target.value ? Number(e.target.value) : undefined)}
              sx={{ width: '48%' }}
              InputProps={{
                startAdornment: '$',
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Deadline Filter */}
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Submission Deadline
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={filters.deadlineFrom ? filters.deadlineFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => updateFilter('deadlineFrom', e.target.value ? new Date(e.target.value) : undefined)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={filters.deadlineTo ? filters.deadlineTo.toISOString().split('T')[0] : ''}
            onChange={(e) => updateFilter('deadlineTo', e.target.value ? new Date(e.target.value) : undefined)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box mt="auto" pt={3}>
        <Button
          fullWidth
          variant="outlined"
          onClick={clearFilters}
          sx={{ mb: 2 }}
        >
          Clear All Filters
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
        >
          Apply Filters
        </Button>
      </Box>
    </Drawer>
  );
};

export default TenderFilter;
