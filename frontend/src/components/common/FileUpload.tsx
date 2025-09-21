import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Delete,
  InsertDriveFile,
  PictureAsPdf,
  Image,
  Description,
  VideoFile,
  Check,
  Error as ErrorIcon,
  Refresh,
  Info,
} from '@mui/icons-material';
import { formatFileSize } from '../../utils/formatUtils';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

interface FileUploadProps {
  onFileUpload: (files: File[]) => Promise<UploadedFile[]>;
  onFileDelete?: (fileId: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  uploadedFiles?: UploadedFile[];
  disabled?: boolean;
  title?: string;
  description?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onFileDelete,
  acceptedTypes = ['*'],
  maxFileSize = 50, // 50MB default
  maxFiles = 10,
  uploadedFiles = [],
  disabled = false,
  title = 'Upload Files',
  description = 'Drag and drop files here or click to browse',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdf sx={{ color: 'error.main' }} />;
    if (fileType.includes('image')) return <Image sx={{ color: 'info.main' }} />;
    if (fileType.includes('video')) return <VideoFile sx={{ color: 'warning.main' }} />;
    if (fileType.includes('text') || fileType.includes('document')) return <Description sx={{ color: 'primary.main' }} />;
    return <InsertDriveFile sx={{ color: 'text.secondary' }} />;
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'uploading':
        return 'info';
      default:
        return 'default';
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes('*')) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isTypeAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return type.slice(1) === fileExtension;
        }
        return file.type.includes(type);
      });
      
      if (!isTypeAccepted) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const handleFileSelection = useCallback(async (files: FileList) => {
    if (disabled || uploading) return;

    const fileArray = Array.from(files);
    
    // Check max files limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(`Upload failed:\n${errors.join('\n')}`);
      return;
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      await onFileUpload(validFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [disabled, uploading, uploadedFiles.length, maxFiles, onFileUpload, maxFileSize, acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!disabled && e.dataTransfer.files) {
      handleFileSelection(e.dataTransfer.files);
    }
  }, [disabled, handleFileSelection]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(e.target.files);
      // Reset input value to allow re-uploading same file
      e.target.value = '';
    }
  }, [handleFileSelection]);

  const handleDeleteFile = (fileId: string) => {
    if (onFileDelete) {
      onFileDelete(fileId);
    }
    setDeleteDialog(null);
  };

  const getTotalSize = () => {
    return uploadedFiles.reduce((total, file) => total + file.size, 0);
  };

  const getCompletedFiles = () => {
    return uploadedFiles.filter(file => file.status === 'completed');
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: isDragOver ? 2 : 1,
          borderColor: isDragOver ? 'primary.main' : 'divider',
          borderStyle: isDragOver ? 'solid' : 'dashed',
          bgcolor: isDragOver ? 'action.hover' : 'background.paper',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: disabled ? 'background.paper' : 'action.hover',
            borderColor: disabled ? 'divider' : 'primary.main',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled) {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AttachFile />}
          disabled={disabled || uploading}
          sx={{ mb: 2 }}
        >
          {uploading ? 'Uploading...' : 'Choose Files'}
        </Button>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Max file size: {maxFileSize}MB • Max files: {maxFiles}
          </Typography>
          {acceptedTypes.length > 0 && !acceptedTypes.includes('*') && (
            <Typography variant="caption" color="text.secondary" display="block">
              Accepted types: {acceptedTypes.join(', ')}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Uploaded Files ({uploadedFiles.length})
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Total: {formatFileSize(getTotalSize())}
                </Typography>
                <Chip
                  label={`${getCompletedFiles().length} completed`}
                  color="success"
                  size="small"
                />
              </Stack>
            </Stack>

            <List>
              {uploadedFiles.map((file) => (
                <ListItem
                  key={file.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  <ListItemIcon>
                    {getFileIcon(file.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {file.name}
                        </Typography>
                        <Chip
                          label={file.status}
                          color={getStatusColor(file.status)}
                          size="small"
                          icon={
                            file.status === 'completed' ? <Check /> :
                            file.status === 'failed' ? <ErrorIcon /> :
                            undefined
                          }
                        />
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                        {file.status === 'uploading' && (
                          <LinearProgress
                            variant="determinate"
                            value={file.uploadProgress}
                            sx={{ mt: 1 }}
                          />
                        )}
                        {file.error && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {file.error}
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {file.status === 'failed' && (
                        <Tooltip title="Retry upload">
                          <IconButton size="small" color="primary">
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {file.url && file.status === 'completed' && (
                        <Tooltip title="View file">
                          <IconButton
                            size="small"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Delete file">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog(file.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this file? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteDialog && handleDeleteFile(deleteDialog)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload;
