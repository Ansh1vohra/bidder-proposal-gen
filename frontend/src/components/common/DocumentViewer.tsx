import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Visibility,
  Download,
  Share,
  FullscreenExit,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Print,
  Close,
  PictureAsPdf,
  Image,
  Description,
  VideoFile,
  InsertDriveFile,
} from '@mui/icons-material';
import { formatFileSize, formatDate } from '../../utils/formatUtils';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  description?: string;
  thumbnail?: string;
}

interface DocumentViewerProps {
  document: Document;
  onDownload?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  showActions?: boolean;
  embedded?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onDownload,
  onShare,
  onDelete,
  showActions = true,
  embedded = false,
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileIcon = (fileType: string, size: number = 24) => {
    const iconProps = { sx: { fontSize: size } };
    
    if (fileType.includes('pdf')) return <PictureAsPdf {...iconProps} sx={{ ...iconProps.sx, color: 'error.main' }} />;
    if (fileType.includes('image')) return <Image {...iconProps} sx={{ ...iconProps.sx, color: 'info.main' }} />;
    if (fileType.includes('video')) return <VideoFile {...iconProps} sx={{ ...iconProps.sx, color: 'warning.main' }} />;
    if (fileType.includes('text') || fileType.includes('document')) return <Description {...iconProps} sx={{ ...iconProps.sx, color: 'primary.main' }} />;
    return <InsertDriveFile {...iconProps} sx={{ ...iconProps.sx, color: 'text.secondary' }} />;
  };

  const canPreview = (fileType: string) => {
    return fileType.includes('image') || 
           fileType.includes('pdf') || 
           fileType.includes('text') ||
           fileType === 'application/json';
  };

  const isImage = (fileType: string) => fileType.includes('image');
  const isPDF = (fileType: string) => fileType.includes('pdf');
  const isText = (fileType: string) => fileType.includes('text') || fileType === 'application/json';

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Fallback: direct download
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.click();
    }
  };

  const handlePrint = () => {
    if (isPDF(document.type)) {
      const printWindow = window.open(document.url);
      printWindow?.print();
    } else if (isImage(document.type)) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head><title>Print ${document.name}</title></head>
          <body style="margin:0;padding:20px;text-align:center;">
            <img src="${document.url}" style="max-width:100%;height:auto;" />
          </body>
        </html>
      `);
      printWindow?.print();
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!canPreview(document.type)) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 300,
          textAlign: 'center',
          p: 3
        }}>
          {getFileIcon(document.type, 64)}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Preview not available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This file type cannot be previewed in the browser.
          </Typography>
          <Button variant="contained" startIcon={<Download />} onClick={handleDownload}>
            Download to view
          </Button>
        </Box>
      );
    }

    const previewStyle = {
      width: '100%',
      height: 'auto',
      maxHeight: embedded ? '400px' : '80vh',
      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
      transition: 'transform 0.3s ease',
    };

    if (isImage(document.type)) {
      return (
        <Box sx={{ textAlign: 'center', overflow: 'auto', p: 1 }}>
          <img
            src={document.url}
            alt={document.name}
            style={previewStyle}
            onLoad={() => setLoading(false)}
            onError={() => setError('Failed to load image')}
          />
        </Box>
      );
    }

    if (isPDF(document.type)) {
      return (
        <Box sx={{ height: embedded ? '500px' : '80vh' }}>
          <iframe
            src={`${document.url}#toolbar=1&navpanes=1&scrollbar=1`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
            onLoad={() => setLoading(false)}
            onError={() => setError('Failed to load PDF')}
          />
        </Box>
      );
    }

    if (isText(document.type)) {
      return (
        <Box sx={{ p: 2, height: embedded ? '400px' : '60vh', overflow: 'auto' }}>
          <iframe
            src={document.url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              fontSize: `${zoom}%`,
            }}
            onLoad={() => setLoading(false)}
            onError={() => setError('Failed to load document')}
          />
        </Box>
      );
    }

    return null;
  };

  const PreviewControls = () => (
    <Stack direction="row" spacing={1} alignItems="center">
      {isImage(document.type) && (
        <>
          <Tooltip title="Zoom out">
            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 25}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" sx={{ minWidth: '60px', textAlign: 'center' }}>
            {zoom}%
          </Typography>
          
          <Tooltip title="Zoom in">
            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 300}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Rotate left">
            <IconButton size="small" onClick={handleRotateLeft}>
              <RotateLeft />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate right">
            <IconButton size="small" onClick={handleRotateRight}>
              <RotateRight />
            </IconButton>
          </Tooltip>
        </>
      )}
      
      {(isPDF(document.type) || isImage(document.type)) && (
        <>
          <Divider orientation="vertical" flexItem />
          <Tooltip title="Print">
            <IconButton size="small" onClick={handlePrint}>
              <Print />
            </IconButton>
          </Tooltip>
        </>
      )}
      
      {!embedded && (
        <>
          <Divider orientation="vertical" flexItem />
          <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton size="small" onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </>
      )}
    </Stack>
  );

  const DocumentInfo = () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        {getFileIcon(document.type, 32)}
        <Box flex={1}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {document.name}
          </Typography>
          {document.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {document.description}
            </Typography>
          )}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip label={formatFileSize(document.size)} size="small" />
            <Chip label={`Uploaded ${formatDate(document.uploadedAt)}`} size="small" />
            {document.uploadedBy && (
              <Chip label={`By ${document.uploadedBy}`} size="small" />
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );

  const ActionButtons = () => (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleDownload}
        size="small"
      >
        Download
      </Button>
      
      {onShare && (
        <Button
          variant="outlined"
          startIcon={<Share />}
          onClick={() => onShare(document)}
          size="small"
        >
          Share
        </Button>
      )}
      
      {canPreview(document.type) && !embedded && (
        <Button
          variant="outlined"
          startIcon={<Visibility />}
          onClick={() => setFullscreen(true)}
          size="small"
        >
          View
        </Button>
      )}
    </Stack>
  );

  if (embedded) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <DocumentInfo />
              {showActions && <ActionButtons />}
            </Stack>
            
            {canPreview(document.type) && (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">Preview</Typography>
                  <PreviewControls />
                </Stack>
                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                  {renderPreview()}
                </Paper>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <DocumentInfo />
            {showActions && <ActionButtons />}
          </Stack>
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: { bgcolor: 'background.default' }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {document.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <PreviewControls />
              <IconButton onClick={() => setFullscreen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            {renderPreview()}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button startIcon={<Download />} onClick={handleDownload}>
            Download
          </Button>
          {onShare && (
            <Button startIcon={<Share />} onClick={() => onShare(document)}>
              Share
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentViewer;
