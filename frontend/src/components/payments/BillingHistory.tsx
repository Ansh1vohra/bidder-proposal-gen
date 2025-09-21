import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Download,
  Receipt,
  CreditCard,
  Search,
  FilterList,
  CheckCircle,
  Error,
  Schedule,
  Refresh,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatUtils';

interface PaymentRecord {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  planName: string;
  invoiceUrl?: string;
  paymentMethod: {
    type: 'card' | 'bank_transfer' | 'paypal';
    last4?: string;
    brand?: string;
  };
  billingPeriod: {
    start: Date;
    end: Date;
  };
}

interface BillingHistoryProps {
  payments: PaymentRecord[];
  loading?: boolean;
  onDownloadInvoice?: (paymentId: string) => void;
  onRefresh?: () => void;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({
  payments,
  loading = false,
  onDownloadInvoice,
  onRefresh,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const getStatusColor = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'pending':
        return <Schedule />;
      case 'failed':
        return <Error />;
      case 'refunded':
        return <Refresh />;
      default:
        return <Receipt />;
    }
  };

  const getPaymentMethodDisplay = (paymentMethod: PaymentRecord['paymentMethod']) => {
    switch (paymentMethod.type) {
      case 'card':
        return `${paymentMethod.brand || 'Card'} •••• ${paymentMethod.last4}`;
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'paypal':
        return 'PayPal';
      default:
        return 'Unknown';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const paginatedPayments = filteredPayments.slice(
    page * rowsPerPage,
    page + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTotalSpent = () => {
    return payments
      .filter(p => p.status === 'completed')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getThisYearSpent = () => {
    const currentYear = new Date().getFullYear();
    return payments
      .filter(p => p.status === 'completed' && new Date(p.date).getFullYear() === currentYear)
      .reduce((total, payment) => total + payment.amount, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Billing History
          </Typography>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={60} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, 
        gap: 2, 
        mb: 3 
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {formatCurrency(getTotalSpent())}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Spent
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {formatCurrency(getThisYearSpent())}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This Year
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
              {payments.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Transactions
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Billing History
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              size="small"
            >
              Refresh
            </Button>
          </Stack>

          {/* Filters */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ mb: 3 }}
            alignItems="center"
          >
            <TextField
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {filteredPayments.length === 0 ? (
            <Alert severity="info">
              <Typography variant="body1">
                {payments.length === 0 
                  ? "No billing history found. Your payment history will appear here after your first transaction."
                  : "No transactions match your current filters."}
              </Typography>
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow 
                        key={payment.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <TableCell>
                          {formatDate(payment.date)}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {payment.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {payment.planName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CreditCard sx={{ fontSize: 16 }} />
                            <Typography variant="body2">
                              {getPaymentMethodDisplay(payment.paymentMethod)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            color={getStatusColor(payment.status)}
                            size="small"
                            icon={getStatusIcon(payment.status)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPayment(payment);
                                }}
                              >
                                <Receipt />
                              </IconButton>
                            </Tooltip>
                            {payment.invoiceUrl && onDownloadInvoice && (
                              <Tooltip title="Download Invoice">
                                <IconButton 
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDownloadInvoice(payment.id);
                                  }}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredPayments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog 
        open={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Payment Details
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Transaction ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedPayment.id}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedPayment.date)} at {new Date(selectedPayment.date).toLocaleTimeString()}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(selectedPayment.amount)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.description}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Plan
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.planName}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Billing Period
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedPayment.billingPeriod.start)} - {formatDate(selectedPayment.billingPeriod.end)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment Method
                </Typography>
                <Typography variant="body1">
                  {getPaymentMethodDisplay(selectedPayment.paymentMethod)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                  color={getStatusColor(selectedPayment.status)}
                  icon={getStatusIcon(selectedPayment.status)}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPayment(null)}>
            Close
          </Button>
          {selectedPayment?.invoiceUrl && onDownloadInvoice && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                onDownloadInvoice(selectedPayment.id);
                setSelectedPayment(null);
              }}
            >
              Download Invoice
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingHistory;
