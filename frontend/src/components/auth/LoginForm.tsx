import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
  GitHub
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { validateForm, required, email, minLength } from '../../utils/validation';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onForgotPassword
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>('');

  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear login error
    if (loginError) {
      setLoginError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData, {
      email: (value: string) => required(value) || email(value),
      password: (value: string) => required(value) || minLength(6)(value)
    });

    setErrors(validationErrors);

    // Check if there are any errors
    if (Object.values(validationErrors).some(error => error)) {
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      await login(formData.email, formData.password);
      showNotification('success', 'Login Successful', 'Welcome back!');
      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setLoginError(errorMessage);
      showNotification('error', 'Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setLoginError('');

    try {
      // Note: Social login will be implemented when backend endpoints are ready
      showNotification('info', 'Coming Soon', `${provider} login will be available soon!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `${provider} login failed. Please try again.`;
      setLoginError(errorMessage);
      showNotification('error', 'Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        boxShadow: theme.shadows[8],
        borderRadius: 2
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account to continue
          </Typography>
        </Box>

        {loginError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loginError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            margin="normal"
            autoComplete="email"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!errors.password}
            helperText={errors.password}
            margin="normal"
            autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box textAlign="right" mt={1} mb={3}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onForgotPassword}
              sx={{ textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 2, mb: 3, py: 1.5 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Or continue with
            </Typography>
          </Divider>

          <Box display="flex" gap={2} mb={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              sx={{ py: 1.5 }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHub />}
              onClick={() => handleSocialLogin('github')}
              disabled={isLoading}
              sx={{ py: 1.5 }}
            >
              GitHub
            </Button>
          </Box>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link
                component="button"
                type="button"
                onClick={onSwitchToRegister}
                sx={{ textDecoration: 'none', fontWeight: 600 }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
