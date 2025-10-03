import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  Dashboard,
  Help,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getInitials } from '../../utils/stringUtils';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMobileMenuOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { notifications } = useNotification();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationOpen = Boolean(notificationAnchor);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const unreadNotifications = notifications.length; // Since we don't have read status, show all

  const menuId = 'primary-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>
        <AccountCircle sx={{ mr: 2 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <Dashboard sx={{ mr: 2 }} />
        Dashboard
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <Settings sx={{ mr: 2 }} />
        Settings
      </MenuItem>
      <MenuItem onClick={handleMenuClose}>
        <Help sx={{ mr: 2 }} />
        Help
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <Logout sx={{ mr: 2 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  const notificationMenuId = 'notification-menu';
  const renderNotificationMenu = (
    <Menu
      anchorEl={notificationAnchor}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={notificationMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isNotificationOpen}
      onClose={handleNotificationClose}
      PaperProps={{
        sx: { maxWidth: 300, maxHeight: 400 }
      }}
    >
      {notifications.length === 0 ? (
        <MenuItem>
          <Typography variant="body2" color="text.secondary">
            No notifications
          </Typography>
        </MenuItem>
      ) : (
        notifications.slice(0, 5).map((notification) => (
          <MenuItem
            key={notification.id}
            onClick={handleNotificationClose}
            sx={{
              whiteSpace: 'normal',
              maxWidth: 280,
            }}
          >
            <Box>
              <Typography variant="subtitle2" component="div">
                {notification.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notification.message}
              </Typography>
            </Box>
          </MenuItem>
        ))
      )}
      {notifications.length > 5 && (
        <MenuItem onClick={handleNotificationClose}>
          <Typography variant="body2" color="primary">
            View all notifications
          </Typography>
        </MenuItem>
      )}
    </Menu>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          backdropFilter: 'blur(20px)',
          borderBottom: 'none'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #ffffff 30%, #e0e7ff 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.5rem',
            }}
          >
            🚀 Civilytix AI
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton
              size="large"
              aria-label={`show ${unreadNotifications} new notifications`}
              color="inherit"
              onClick={handleNotificationOpen}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && user && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" component="div">
                    {user.name}
                  </Typography>
                  <Typography variant="caption">
                    {user.profile?.companyName || user.userType}
                  </Typography>
                </Box>
              )}

              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls={menuId}
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user ? getInitials(user.name) : <AccountCircle />}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMenu}
      {renderNotificationMenu}
    </>
  );
};

export default Header;
