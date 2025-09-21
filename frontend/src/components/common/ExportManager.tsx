import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  Description,
  TableChart,
  Image,
  Archive,
  Check,
  Error as ErrorIcon,
  Info,
  CloudDownload,
} from '@mui/icons-material';
import { formatFileSize } from '../../utils/formatUtils';

interface ExportOptions {
  format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'json' | 'zip';
  includeImages: boolean;
  includeTables: boolean;
  includeCharts: boolean;
  includeMetadata: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
}

interface ExportItem {
  id: string;
  name: string;
  type: 'proposal' | 'tender' | 'document' | 'report';
  size?: number;
  selected: boolean;
}

interface ExportJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  estimatedSize?: number;
}

interface ExportManagerProps {
  items: ExportItem[];
  onExport: (selectedItems: ExportItem[], options: ExportOptions) => Promise<ExportJob>;
  onDownload?: (job: ExportJob) => void;
  currentJobs?: ExportJob[];
}

const ExportManager: React.FC<ExportManagerProps> = ({
  items,
  onExport,
  onDownload,
  currentJobs = [],
}) => {
  const [selectedItems, setSelectedItems] = useState<ExportItem[]>(items.filter(item => item.selected));
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeImages: true,
    includeTables: true,
    includeCharts: true,
    includeMetadata: true,
    compressionLevel: 'medium',
    pageSize: 'A4',
    orientation: 'portrait',
  });
  const [exporting, setExporting] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: 'error.main' }} />;
      case 'docx':
        return <Description sx={{ color: 'primary.main' }} />;
      case 'xlsx':
      case 'csv':
        return <TableChart sx={{ color: 'success.main' }} />;
      case 'zip':
        return <Archive sx={{ color: 'warning.main' }} />;
      default:
        return <Description />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'Portable Document Format - Best for sharing and printing';
      case 'docx':
        return 'Microsoft Word Document - Editable format';
      case 'xlsx':
        return 'Microsoft Excel Spreadsheet - For data analysis';
      case 'csv':
        return 'Comma Separated Values - Simple data format';
      case 'json':
        return 'JavaScript Object Notation - Raw data format';
      case 'zip':
        return 'Compressed Archive - Multiple files in one package';
      default:
        return '';
    }
  };

  const handleItemToggle = (item: ExportItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(selectedItems.length === items.length ? [] : [...items]);
  };

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const estimateExportSize = () => {
    const baseSize = selectedItems.reduce((total, item) => total + (item.size || 1024), 0);
    const compressionFactor = {
      low: 0.9,
      medium: 0.7,
      high: 0.5,
    }[exportOptions.compressionLevel];
    
    return Math.round(baseSize * compressionFactor);
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) return;

    setExporting(true);
    try {
      const job = await onExport(selectedItems, exportOptions);
      setCurrentJob(job);
      setExportDialog(true);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const getJobStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getJobIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <Check />;
      case 'failed':
        return <ErrorIcon />;
      case 'processing':
        return <CircularProgress size={16} />;
      case 'pending':
        return <Info />;
      default:
        return <Info />;
    }
  };

  return (
    <Box>
      {/* Export Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Export Documents
          </Typography>

          {/* Item Selection */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Select Items ({selectedItems.length} of {items.length})
              </Typography>
              <Button size="small" onClick={handleSelectAll}>
                {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Stack>

            <FormGroup>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: 1 
              }}>
                {items.map((item) => (
                  <FormControlLabel
                    key={item.id}
                    control={
                      <Checkbox
                        checked={selectedItems.some(i => i.id === item.id)}
                        onChange={() => handleItemToggle(item)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.type} {item.size && `• ${formatFileSize(item.size)}`}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>
            </FormGroup>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Export Options */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Export Options
          </Typography>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3 
          }}>
            {/* Format Selection */}
            <FormControl>
              <FormLabel component="legend">Export Format</FormLabel>
              <RadioGroup
                value={exportOptions.format}
                onChange={(e) => handleOptionChange('format', e.target.value)}
              >
                {['pdf', 'docx', 'xlsx', 'csv', 'json', 'zip'].map((format) => (
                  <FormControlLabel
                    key={format}
                    value={format}
                    control={<Radio />}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getFormatIcon(format)}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {format.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getFormatDescription(format)}
                          </Typography>
                        </Box>
                      </Stack>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {/* Content Options */}
            <Box>
              <FormLabel component="legend">Include Content</FormLabel>
              <FormGroup sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeImages}
                      onChange={(e) => handleOptionChange('includeImages', e.target.checked)}
                    />
                  }
                  label="Images and Graphics"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeTables}
                      onChange={(e) => handleOptionChange('includeTables', e.target.checked)}
                    />
                  }
                  label="Tables and Data"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeCharts}
                      onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                    />
                  }
                  label="Charts and Graphs"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                    />
                  }
                  label="Metadata and Properties"
                />
              </FormGroup>

              {/* PDF-specific options */}
              {exportOptions.format === 'pdf' && (
                <Box sx={{ mt: 2 }}>
                  <FormControl size="small" sx={{ mb: 1, minWidth: 120 }}>
                    <InputLabel>Page Size</InputLabel>
                    <Select
                      value={exportOptions.pageSize}
                      label="Page Size"
                      onChange={(e) => handleOptionChange('pageSize', e.target.value)}
                    >
                      <MenuItem value="A4">A4</MenuItem>
                      <MenuItem value="Letter">Letter</MenuItem>
                      <MenuItem value="Legal">Legal</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ ml: 1, minWidth: 120 }}>
                    <InputLabel>Orientation</InputLabel>
                    <Select
                      value={exportOptions.orientation}
                      label="Orientation"
                      onChange={(e) => handleOptionChange('orientation', e.target.value)}
                    >
                      <MenuItem value="portrait">Portrait</MenuItem>
                      <MenuItem value="landscape">Landscape</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Compression Options */}
              <Box sx={{ mt: 2 }}>
                <FormLabel component="legend">Compression Level</FormLabel>
                <RadioGroup
                  row
                  value={exportOptions.compressionLevel}
                  onChange={(e) => handleOptionChange('compressionLevel', e.target.value)}
                >
                  <FormControlLabel value="low" control={<Radio />} label="Low (Larger file)" />
                  <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                  <FormControlLabel value="high" control={<Radio />} label="High (Smaller file)" />
                </RadioGroup>
              </Box>
            </Box>
          </Box>

          {/* Export Summary */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Export Summary:</strong> {selectedItems.length} items • 
              {exportOptions.format.toUpperCase()} format • 
              Estimated size: {formatFileSize(estimateExportSize())}
            </Typography>
          </Alert>

          {/* Export Button */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={exporting ? <CircularProgress size={20} /> : <Download />}
              onClick={handleExport}
              disabled={selectedItems.length === 0 || exporting}
              sx={{ fontWeight: 600 }}
            >
              {exporting ? 'Preparing Export...' : 'Start Export'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Current Export Jobs */}
      {currentJobs.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Export Status
            </Typography>

            <List>
              {currentJobs.map((job) => (
                <ListItem
                  key={job.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {getJobIcon(job.status)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {job.name}
                        </Typography>
                        <Chip
                          label={job.status}
                          color={getJobStatusColor(job.status)}
                          size="small"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        {job.status === 'processing' && (
                          <LinearProgress
                            variant="determinate"
                            value={job.progress}
                            sx={{ mt: 1, mb: 1 }}
                          />
                        )}
                        {job.estimatedSize && (
                          <Typography variant="caption" color="text.secondary">
                            Estimated size: {formatFileSize(job.estimatedSize)}
                          </Typography>
                        )}
                        {job.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {job.error}
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                  
                  {job.status === 'completed' && job.downloadUrl && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CloudDownload />}
                      onClick={() => onDownload?.(job)}
                    >
                      Download
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Export Progress Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export in Progress</DialogTitle>
        <DialogContent>
          {currentJob && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                {getJobIcon(currentJob.status)}
                <Typography variant="h6">{currentJob.name}</Typography>
              </Stack>
              
              {currentJob.status === 'processing' && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={currentJob.progress} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {currentJob.progress}% complete
                  </Typography>
                </Box>
              )}
              
              {currentJob.status === 'completed' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Export completed successfully! Your download will begin shortly.
                </Alert>
              )}
              
              {currentJob.status === 'failed' && currentJob.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Export failed: {currentJob.error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>
            Close
          </Button>
          {currentJob?.status === 'completed' && currentJob.downloadUrl && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                onDownload?.(currentJob);
                setExportDialog(false);
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExportManager;
