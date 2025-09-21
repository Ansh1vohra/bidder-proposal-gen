import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Pages
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TendersPage from './pages/TendersPage';
import ProposalsPage from './pages/ProposalsPage';
import RecommendationsPage from './pages/RecommendationsPage';

// Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <div>Loading...</div>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Main Layout Component
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        isMobileMenuOpen={!sidebarOpen}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // Account for header height
          pl: sidebarOpen ? { xs: 0, md: 30 } : 0, // Account for sidebar width
          transition: 'padding-left 0.3s',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <DashboardPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/tenders"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <TendersPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/proposals"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <ProposalsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/recommendations"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <RecommendationsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
