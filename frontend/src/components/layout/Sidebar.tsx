import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Assignment,
  Payment,
  Recommend,
  Search,
  Analytics,
  Settings,
  Help,
  Upgrade,
  Star,
  TrendingUp,
  History,
  Bookmark,
  Notifications,
  AccountCircle,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: string;
  disabled?: boolean;
  premium?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant = 'permanent' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
    },
    {
      id: 'tenders',
      label: 'Browse Tenders',
      icon: <Search />,
      path: '/tenders',
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Recommend />,
      path: '/recommendations',
      badge: '5',
    },
    {
      id: 'proposals',
      label: 'My Proposals',
      icon: <Assignment />,
      path: '/proposals',
    },
    {
      id: 'saved-tenders',
      label: 'Saved Tenders',
      icon: <Bookmark />,
      path: '/saved-tenders',
    },
    {
      id: 'history',
      label: 'History',
      icon: <History />,
      path: '/history',
    },
  ];

  const analyticsItems: NavigationItem[] = [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <Analytics />,
      path: '/analytics',
      premium: true,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <TrendingUp />,
      path: '/performance',
      premium: true,
    },
  ];

  const settingsItems: NavigationItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <AccountCircle />,
      path: '/profile',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings />,
      path: '/settings',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Notifications />,
      path: '/notifications',
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: <Payment />,
      path: '/subscription',
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: <Help />,
      path: '/help',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isPremiumFeature = (item: NavigationItem) => {
    return item.premium && user?.subscription?.currentPlan === 'free';
  };

  const renderNavigationItem = (item: NavigationItem) => (
    <ListItem key={item.id} disablePadding>
      <ListItemButton
        onClick={() => handleNavigation(item.path)}
        disabled={item.disabled || isPremiumFeature(item)}
        sx={{
          borderRadius: 1,
          mx: 1,
          mb: 0.5,
          backgroundColor: isActive(item.path) ? 'primary.main' : 'transparent',
          color: isActive(item.path) ? 'primary.contrastText' : 'inherit',
          '&:hover': {
            backgroundColor: isActive(item.path) 
              ? 'primary.main' 
              : 'action.hover',
          },
          '&.Mui-disabled': {
            opacity: 0.6,
          },
        }}
      >
        <ListItemIcon
          sx={{
            color: isActive(item.path) ? 'inherit' : 'action.active',
            minWidth: 40,
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText primary={item.label} />
        {item.badge && (
          <Chip
            label={item.badge}
            size="small"
            color="primary"
            sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
          />
        )}
        {item.premium && user?.subscription?.currentPlan === 'free' && (
          <Star sx={{ ml: 1, color: 'warning.main', fontSize: 16 }} />
        )}
      </ListItemButton>
    </ListItem>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Proposal Generator
        </Typography>
        {user && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Welcome back,
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user.name}
            </Typography>
            <Chip
              label={user.subscription?.currentPlan || 'Free'}
              size="small"
              color={user.subscription?.currentPlan === 'free' ? 'default' : 'primary'}
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {/* Main Navigation */}
        <List sx={{ px: 1 }}>
          {navigationItems.map(renderNavigationItem)}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Analytics Section */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            ANALYTICS
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {analyticsItems.map(renderNavigationItem)}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Settings Section */}
        <Box sx={{ px: 2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            SETTINGS
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {settingsItems.map(renderNavigationItem)}
        </List>
      </Box>

      {/* Upgrade Banner for Free Users */}
      {user?.subscription?.currentPlan === 'free' && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Upgrade sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Upgrade to Premium
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
              Unlock advanced analytics and unlimited proposals
            </Typography>
            <Box
              component="button"
              onClick={() => handleNavigation('/subscription')}
              sx={{
                width: '100%',
                py: 1,
                bgcolor: 'background.paper',
                color: 'primary.main',
                border: 'none',
                borderRadius: 1,
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Upgrade Now
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant={variant}
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
