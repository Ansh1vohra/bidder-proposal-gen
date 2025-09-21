import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Fade,
  useTheme,
} from '@mui/material';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

const AuthPage: React.FC = () => {
  const theme = useTheme();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleSwitchToRegister = () => {
    setAuthMode('register');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  const handleForgotPassword = () => {
    setAuthMode('forgot-password');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={500}>
          <Box>
            {authMode === 'login' && (
              <LoginForm
                onSwitchToRegister={handleSwitchToRegister}
                onForgotPassword={handleForgotPassword}
              />
            )}
            
            {authMode === 'register' && (
              <RegisterForm
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
            
            {authMode === 'forgot-password' && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <h2>Reset Password</h2>
                <p>Forgot password functionality will be implemented here.</p>
                <button onClick={handleSwitchToLogin}>Back to Login</button>
              </Paper>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default AuthPage;
