import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CreditCard,
  Security,
  Visibility,
  VisibilityOff,
  Lock,
  Info,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatUtils';

interface PaymentFormProps {
  planId: string;
  planName: string;
  amount: number;
  isYearly: boolean;
  onSubmit: (paymentData: PaymentFormData) => void;
  loading?: boolean;
  error?: string;
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  saveCard: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  planId,
  planName,
  amount,
  isYearly,
  onSubmit,
  loading = false,
  error,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    saveCard: false,
  });

  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value,
      },
    }));
    
    if (errors[`billingAddress.${field}`]) {
      setErrors(prev => ({ ...prev, [`billingAddress.${field}`]: '' }));
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Card number validation
    const cardDigits = formData.cardNumber.replace(/\s/g, '');
    if (!cardDigits) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardDigits.length < 13 || cardDigits.length > 19) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Expiry date validation
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Invalid expiry date';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = 'Invalid CVV';
    }

    // Cardholder name validation
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    // Billing address validation
    if (!formData.billingAddress.street.trim()) {
      newErrors['billingAddress.street'] = 'Street address is required';
    }
    if (!formData.billingAddress.city.trim()) {
      newErrors['billingAddress.city'] = 'City is required';
    }
    if (!formData.billingAddress.state.trim()) {
      newErrors['billingAddress.state'] = 'State is required';
    }
    if (!formData.billingAddress.zipCode.trim()) {
      newErrors['billingAddress.zipCode'] = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getCardType = (cardNumber: string) => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.startsWith('4')) return 'Visa';
    if (digits.startsWith('5') || digits.startsWith('2')) return 'Mastercard';
    if (digits.startsWith('3')) return 'American Express';
    return 'Unknown';
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Order Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Order Summary
          </Typography>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body1">{planName} Plan</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatCurrency(amount)}
            </Typography>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isYearly ? 'Billed annually' : 'Billed monthly'}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {formatCurrency(amount)}
            </Typography>
          </Stack>
          
          {isYearly && amount > 0 && (
            <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
              You save {formatCurrency(amount * 0.2)} with annual billing
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            <CreditCard sx={{ mr: 1, verticalAlign: 'middle' }} />
            Payment Information
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Card Number */}
            <TextField
              label="Card Number"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              error={!!errors.cardNumber}
              helperText={errors.cardNumber || `${getCardType(formData.cardNumber)} detected`}
              placeholder="1234 5678 9012 3456"
              inputProps={{ maxLength: 23 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCard />
                  </InputAdornment>
                ),
              }}
              fullWidth
              required
            />

            {/* Expiry and CVV */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Expiry Date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                error={!!errors.expiryDate}
                helperText={errors.expiryDate}
                placeholder="MM/YY"
                inputProps={{ maxLength: 5 }}
                fullWidth
                required
              />
              
              <TextField
                label="CVV"
                type={showCvv ? 'text' : 'password'}
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                error={!!errors.cvv}
                helperText={errors.cvv}
                placeholder="123"
                inputProps={{ maxLength: 4 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCvv(!showCvv)}
                        edge="end"
                        size="small"
                      >
                        {showCvv ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
                required
              />
            </Stack>

            {/* Cardholder Name */}
            <TextField
              label="Cardholder Name"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              error={!!errors.cardholderName}
              helperText={errors.cardholderName}
              placeholder="John Doe"
              fullWidth
              required
            />

            <Divider sx={{ my: 2 }} />

            {/* Billing Address */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Billing Address
            </Typography>

            <TextField
              label="Street Address"
              value={formData.billingAddress.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              error={!!errors['billingAddress.street']}
              helperText={errors['billingAddress.street']}
              fullWidth
              required
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={formData.billingAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                error={!!errors['billingAddress.city']}
                helperText={errors['billingAddress.city']}
                fullWidth
                required
              />
              
              <TextField
                label="State"
                value={formData.billingAddress.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                error={!!errors['billingAddress.state']}
                helperText={errors['billingAddress.state']}
                fullWidth
                required
              />
              
              <TextField
                label="ZIP Code"
                value={formData.billingAddress.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                error={!!errors['billingAddress.zipCode']}
                helperText={errors['billingAddress.zipCode']}
                fullWidth
                required
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={formData.billingAddress.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                label="Country"
              >
                <MenuItem value="US">United States</MenuItem>
                <MenuItem value="CA">Canada</MenuItem>
                <MenuItem value="GB">United Kingdom</MenuItem>
                <MenuItem value="AU">Australia</MenuItem>
                <MenuItem value="DE">Germany</MenuItem>
                <MenuItem value="FR">France</MenuItem>
              </Select>
            </FormControl>

            {/* Save Card Option */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.saveCard}
                  onChange={(e) => setFormData(prev => ({ ...prev, saveCard: e.target.checked }))}
                />
              }
              label="Save card for future payments"
            />

            {/* Security Notice */}
            <Alert severity="info" icon={<Security />}>
              <Typography variant="body2">
                Your payment information is encrypted and secure. We use industry-standard SSL encryption.
              </Typography>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
              sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
              fullWidth
            >
              {loading ? 'Processing Payment...' : `Pay ${formatCurrency(amount)}`}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              By completing this purchase, you agree to our Terms of Service and Privacy Policy.
              You can cancel your subscription at any time.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentForm;
