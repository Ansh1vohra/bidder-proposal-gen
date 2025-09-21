import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Fab,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  InputLabel,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  Upload,
  CreateNewFolder,
  MoreVert,
  Download,
  Share,
  Delete,
  Edit,
  FileCopy,
  Star,
  StarBorder,
  Folder,
  FolderOpen,
  Description,
  PictureAsPdf,
  Image,
  TableChart,
  Archive,
  InsertDriveFile,
  NavigateNext,
  CloudUpload,
  Refresh,
  Close,
} from '@mui/icons-material';
import { formatFileSize, formatDate } from '../../utils/formatUtils';
import FileUpload from './FileUpload';
import DocumentViewer from './DocumentViewer';
import ExportManager from './ExportManager';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedDate: Date;
  createdDate: Date;
  mimeType?: string;
  extension?: string;
  tags: string[];
  starred: boolean;
  shared: boolean;
  downloadUrl?: string;
  thumbnailUrl?: string;
  path: string[];
  description?: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
}

interface FileManagerProps {
  files: FileItem[];
  currentPath: string[];
  onNavigate: (path: string[]) => void;
  onFileSelect: (file: FileItem) => void;
  onFileAction: (action: string, files: FileItem[]) => void;
  onUpload: (files: File[], path: string[]) => Promise<void>;
  onCreateFolder: (name: string, path: string[]) => Promise<void>;
  selectedFile?: FileItem;
  loading?: boolean;
  error?: string;
}

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'size' | 'modified' | 'type';
type SortOrder = 'asc' | 'desc';

const FileManager: React.FC<FileManagerProps> = ({
  files,
  currentPath,
  onNavigate,
  onFileSelect,
  onFileAction,
  onUpload,
  onCreateFolder,
  selectedFile,
  loading = false,
  error,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuFile, setMenuFile] = useState<FileItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return currentPath.includes(file.name) ? <FolderOpen /> : <Folder />;
    }

    switch (file.extension?.toLowerCase()) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: 'error.main' }} />;
      case 'doc':
      case 'docx':
        return <Description sx={{ color: 'primary.main' }} />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <TableChart sx={{ color: 'success.main' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image sx={{ color: 'warning.main' }} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive sx={{ color: 'secondary.main' }} />;
      default:
        return <InsertDriveFile />;
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = filterTags.length === 0 || 
                         filterTags.every(tag => file.tags.includes(tag));
      return matchesSearch && matchesTags;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      // Folders first
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'size':
          compareValue = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          compareValue = a.modifiedDate.getTime() - b.modifiedDate.getTime();
          break;
        case 'type':
          compareValue = (a.extension || '').localeCompare(b.extension || '');
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [files, searchQuery, filterTags, sortField, sortOrder]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    files.forEach(file => file.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [files]);

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      onNavigate([...currentPath, file.name]);
    } else {
      onFileSelect(file);
      if (file.mimeType?.startsWith('image/') || file.extension === 'pdf') {
        setViewerOpen(true);
      }
    }
  };

  const handleFileSelect = (file: FileItem, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      setSelectedFiles(prev => {
        const exists = prev.find(f => f.id === file.id);
        return exists ? prev.filter(f => f.id !== file.id) : [...prev, file];
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleActionMenu = (event: React.MouseEvent, file: FileItem) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget as HTMLElement);
    setMenuFile(file);
  };

  const handleMenuAction = (action: string) => {
    if (menuFile) {
      onFileAction(action, [menuFile]);
    }
    setActionMenuAnchor(null);
    setMenuFile(null);
  };

  const handleBulkAction = (action: string) => {
    if (selectedFiles.length > 0) {
      onFileAction(action, selectedFiles);
      setSelectedFiles([]);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await onCreateFolder(newFolderName.trim(), currentPath);
      setCreateFolderOpen(false);
      setNewFolderName('');
    }
  };

  const renderFileList = () => (
    <List>
      {filteredAndSortedFiles.map((file) => (
        <ListItem
          key={file.id}
          component="div"
          sx={{
            borderRadius: 1,
            mb: 0.5,
            cursor: 'pointer',
            backgroundColor: selectedFiles.some(f => f.id === file.id) ? 'action.selected' : 'transparent',
            '&:hover': { backgroundColor: 'action.hover' },
          }}
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleActionMenu(e, file)}
        >
          <ListItemIcon>
            <IconButton
              size="small"
              onClick={(e) => handleFileSelect(file, e)}
              sx={{ mr: 1 }}
            >
              {getFileIcon(file)}
            </IconButton>
          </ListItemIcon>

          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {file.name}
                </Typography>
                {file.starred && <Star sx={{ fontSize: 16, color: 'warning.main' }} />}
                {file.shared && <Share sx={{ fontSize: 16, color: 'info.main' }} />}
                {file.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Stack>
            }
            secondary={
              <Stack direction="row" spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  {file.type === 'file' && file.size ? formatFileSize(file.size) : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(file.modifiedDate)}
                </Typography>
                {file.description && (
                  <Typography variant="caption" color="text.secondary">
                    {file.description}
                  </Typography>
                )}
              </Stack>
            }
          />

          <ListItemSecondaryAction>
            <IconButton
              size="small"
              onClick={(e) => handleActionMenu(e, file)}
            >
              <MoreVert />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  const renderFileGrid = () => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: 2,
      }}
    >
      {filteredAndSortedFiles.map((file) => (
        <Card
          key={file.id}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { 
              transform: 'translateY(-2px)',
              boxShadow: 4,
            },
            border: selectedFiles.some(f => f.id === file.id) ? 2 : 0,
            borderColor: 'primary.main',
          }}
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleActionMenu(e, file)}
        >
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              {file.thumbnailUrl ? (
                <Avatar
                  src={file.thumbnailUrl}
                  sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
                  variant="rounded"
                />
              ) : (
                <Avatar
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    mx: 'auto', 
                    mb: 1,
                    backgroundColor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                  }}
                  variant="rounded"
                >
                  {getFileIcon(file)}
                </Avatar>
              )}

              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.name}
              </Typography>

              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                {file.starred && <Star sx={{ fontSize: 14, color: 'warning.main' }} />}
                {file.shared && <Share sx={{ fontSize: 14, color: 'info.main' }} />}
              </Stack>

              {file.type === 'file' && file.size && (
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
              )}

              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 0.5, 
                mt: 1, 
                justifyContent: 'center' 
              }}>
                {file.tags.slice(0, 2).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
                {file.tags.length > 2 && (
                  <Chip label={`+${file.tags.length - 2}`} size="small" variant="outlined" />
                )}
              </Box>
            </CardContent>
          </Card>
      ))}
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            File Manager
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CreateNewFolder />}
              onClick={() => setCreateFolderOpen(true)}
            >
              New Folder
            </Button>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Files
            </Button>
          </Stack>
        </Stack>

        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2 }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={() => onNavigate([])}
            sx={{ textDecoration: 'none' }}
          >
            Home
          </Link>
          {currentPath.map((folder, index) => (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={() => onNavigate(currentPath.slice(0, index + 1))}
              sx={{ textDecoration: 'none' }}
            >
              {folder}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Controls */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
          />

          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortField}
                label="Sort by"
                onChange={(e) => setSortField(e.target.value as SortField)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="size">Size</MenuItem>
                <MenuItem value="modified">Modified</MenuItem>
                <MenuItem value="type">Type</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              <Sort sx={{ 
                transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }} />
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? <ViewModule /> : <ViewList />}
            </Button>
          </Stack>
        </Stack>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filter by tags:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  clickable
                  color={filterTags.includes(tag) ? 'primary' : 'default'}
                  onClick={() => {
                    setFilterTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                />
              ))}
              {filterTags.length > 0 && (
                <Button
                  size="small"
                  onClick={() => setFilterTags([])}
                >
                  Clear Filters
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.50' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<Download />}
                onClick={() => handleBulkAction('download')}
              >
                Download
              </Button>
              <Button
                size="small"
                startIcon={<FileCopy />}
                onClick={() => handleBulkAction('copy')}
              >
                Copy
              </Button>
              <Button
                size="small"
                startIcon={<Share />}
                onClick={() => handleBulkAction('share')}
              >
                Share
              </Button>
              <Button
                size="small"
                startIcon={<Delete />}
                onClick={() => handleBulkAction('delete')}
                color="error"
              >
                Delete
              </Button>
              <Button
                size="small"
                onClick={() => setExportOpen(true)}
              >
                Export
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* File List/Grid */}
      <Paper sx={{ minHeight: 400 }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading files...</Typography>
          </Box>
        ) : filteredAndSortedFiles.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" gutterBottom>
              No files found
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload your first file
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {viewMode === 'list' ? renderFileList() : renderFileGrid()}
          </Box>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleMenuAction('download')}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          Download
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('share')}>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon>
          Share
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('copy')}>
          <ListItemIcon><FileCopy fontSize="small" /></ListItemIcon>
          Copy
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('rename')}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          Rename
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleMenuAction('star')}
          disabled={menuFile?.starred}
        >
          <ListItemIcon><Star fontSize="small" /></ListItemIcon>
          Add to Starred
        </MenuItem>
        <MenuItem 
          onClick={() => handleMenuAction('unstar')}
          disabled={!menuFile?.starred}
        >
          <ListItemIcon><StarBorder fontSize="small" /></ListItemIcon>
          Remove from Starred
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleMenuAction('delete')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUpload
            onFileUpload={async (files: File[]) => {
              await onUpload(files, currentPath);
              setUploadDialogOpen(false);
              return files.map((file, index) => ({
                id: (Date.now() + index).toString(),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadProgress: 100,
                status: 'completed' as const,
              }));
            }}
            acceptedTypes={['*']}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog 
        open={createFolderOpen} 
        onClose={() => setCreateFolderOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            margin="dense"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFolder}
            variant="contained"
            disabled={!newFolderName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog 
        open={viewerOpen} 
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedFile?.name}
            </Typography>
            <IconButton onClick={() => setViewerOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedFile && (
            <DocumentViewer
              document={{
                id: selectedFile.id,
                name: selectedFile.name,
                type: selectedFile.mimeType || 'application/octet-stream',
                size: selectedFile.size || 0,
                url: selectedFile.downloadUrl || '#',
                uploadedAt: selectedFile.createdDate,
                uploadedBy: 'User',
                description: selectedFile.description,
                thumbnail: selectedFile.thumbnailUrl,
              }}
              embedded
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Export Manager */}
      <Dialog 
        open={exportOpen} 
        onClose={() => setExportOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Export Files</DialogTitle>
        <DialogContent>
          <ExportManager
            items={selectedFiles.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type === 'folder' ? 'document' : 'document',
              size: file.size,
              selected: true,
            }))}
            onExport={async (items, options) => {
              // Handle export logic
              return {
                id: Date.now().toString(),
                name: `Export_${Date.now()}`,
                status: 'completed',
                progress: 100,
                downloadUrl: '#',
              };
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="upload"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <Upload />
      </Fab>
    </Box>
  );
};

export default FileManager;
