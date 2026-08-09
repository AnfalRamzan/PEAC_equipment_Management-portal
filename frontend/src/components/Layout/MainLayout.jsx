// src/components/Layout/MainLayout.jsx - REMOVED SETTINGS

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Logout,
  PersonAdd,
  ExitToApp,
  Dashboard,
  LocalHospital,
  MedicalServices,
  ErrorOutline,
  Build,
  Handyman,
  Settings as SettingsIcon,
  Description,
  CalendarToday,
  ShoppingCart,
  LocalShipping,
  Assessment,
  Inventory,
  People,
  Gavel,
  EmojiObjects,
  Category,
} from '@mui/icons-material';
import { useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser, updateProfileImage, refreshUser } from '../../redux/slices/authSlice';
import { fetchUnreadCount, fetchNotifications } from '../../redux/slices/notificationSlice';
import NotificationsDropdown from '../Notifications/NotificationsDropdown';
import GlobalSearch from '../GlobalSearch';
import NotificationSound from '../NotificationSound';
import { toast } from 'react-toastify';

const drawerWidth = 260;

// ============================================================
// ✅ CSS ANIMATIONS
// ============================================================
const badgeStyles = `
@keyframes badgePulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
}

@keyframes bellRing {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(-15deg); }
    50% { transform: rotate(15deg); }
    75% { transform: rotate(-10deg); }
    100% { transform: rotate(0deg); }
}

.bell-ring {
    animation: bellRing 0.6s ease-in-out 3;
}
`;

// ============================================================
// ✅ SOUND EFFECT FUNCTION
// ============================================================
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
      } catch (e) {
        console.log('🔊 Sound not available');
      }
    });
  } catch(e) {
    console.log('🔊 Sound not available');
  }
};

// ============================================================
// ✅ BROWSER NOTIFICATION FUNCTIONS
// ============================================================
const sendBrowserNotification = (title, message, options = {}) => {
  try {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }
    const notification = new Notification(title, {
      body: message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'paec-notification',
      requireInteraction: true,
      silent: true,
      vibrate: [200, 100, 200],
      ...options
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    setTimeout(() => notification.close(), 10000);
    return true;
  } catch (error) {
    console.error('🔔 Error sending notification:', error);
    return false;
  }
};

// ============================================================
// ✅ MENU ITEMS WITH ROLE-BASED PERMISSIONS
// ============================================================
const menuItems = [
  // ✅ Common for all roles
  { 
    text: 'Dashboard', 
    icon: <Dashboard sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/dashboard', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'] 
  },
  { 
    text: 'Equipment', 
    icon: <MedicalServices sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/equipment', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  { 
    text: 'Error Logs', 
    icon: <ErrorOutline sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/errors', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'] 
  },
  { 
    text: 'Repairs', 
    icon: <Build sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/repairs', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'] 
  },
  { 
    text: 'Knowledge Base', 
    icon: <EmojiObjects sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/knowledge-base', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'] 
  },
  
  // ✅ Admin only (Super Admin + Hospital Admin)
  { 
    text: 'Hospitals', 
    icon: <LocalHospital sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/hospitals', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  { 
    text: 'Maintenance', 
    icon: <Handyman sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/maintenance', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  { 
    text: 'Spare Parts', 
    icon: <Inventory sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/spare-parts', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  { 
    text: 'Service Documentation', 
    icon: <Description sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/service-documentation', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  { 
    text: 'AMC Contracts', 
    icon: <Gavel sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/amc', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  { 
    text: 'Purchase Orders', 
    icon: <ShoppingCart sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/purchase-orders', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  { 
    text: 'Equipment Procurement', 
    icon: <LocalShipping sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/procurement', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  
  // ✅ REPORTS - All roles can access
  { 
    text: 'Reports', 
    icon: <Assessment sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/reports', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ENGINEER'] 
  },
  
  // ✅ Users - Admin only
  { 
    text: 'Users', 
    icon: <People sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/users', 
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] 
  },
  
  // ✅ Super Admin Only - SETTINGS REMOVED
  { 
    text: 'Equipment Categories', 
    icon: <Category sx={{ fontSize: 22, color: 'white' }} />, 
    path: '/equipment-categories', 
    roles: ['SUPER_ADMIN'] 
  },
  // ❌ SETTINGS REMOVED - No longer in menu
];

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [bellRing, setBellRing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('notificationSound') !== 'false';
  });
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(() => {
    return localStorage.getItem('browserNotifications') !== 'false';
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount, notifications } = useSelector((state) => state.notifications);

  // ============================================================
  // ✅ HELPER: Get full image URL
  // ============================================================
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  // ============================================================
  // ✅ Get user's profile image URL
  // ============================================================
  const profileImageUrl = user?.profile_image ? getFullImageUrl(user.profile_image) : null;

  // ============================================================
  // ✅ GET FILTERED MENU ITEMS BASED ON USER ROLE
  // ============================================================
  const getFilteredMenuItems = () => {
    const userRole = user?.role || 'ENGINEER';
    return menuItems.filter(item => item.roles.includes(userRole));
  };

  const filteredMenuItems = getFilteredMenuItems();

  // ============================================================
  // ✅ TRACK PREVIOUS UNREAD COUNT
  // ============================================================
  const prevUnreadCount = useRef(unreadCount);

  // ============================================================
  // ✅ FETCH UNREAD COUNT ON MOUNT
  // ============================================================
  useEffect(() => {
    if (user) {
      console.log('🔔 Fetching initial unread count...');
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  // ============================================================
  // ✅ LISTEN FOR PROFILE IMAGE UPDATES VIA STORAGE EVENT
  // ============================================================
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          const updatedUser = JSON.parse(e.newValue);
          if (updatedUser) {
            console.log('🔄 Storage event: User updated in other tab:', updatedUser);
            dispatch(refreshUser());
          }
        } catch (error) {
          console.error('Error parsing user from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

  // ============================================================
  // ✅ REFRESH USER DATA PERIODICALLY
  // ============================================================
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        const currentProfileImage = user?.profile_image;
        const storedProfileImage = storedUser.profile_image;
        
        if (storedProfileImage !== currentProfileImage) {
          console.log('🔄 Profile image changed in localStorage, updating Redux...');
          dispatch(updateProfileImage(storedProfileImage));
        }
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [dispatch, user?.profile_image]);

  // ============================================================
  // ✅ POLL FOR NEW NOTIFICATIONS EVERY 10 SECONDS
  // ============================================================
  useEffect(() => {
    if (!user) return;
    
    console.log('🔔 Starting notification polling...');
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 10000);
    
    return () => {
      console.log('🔔 Stopping notification polling...');
      clearInterval(interval);
    };
  }, [dispatch, user]);

  // ============================================================
  // ✅ HANDLE NEW NOTIFICATIONS
  // ============================================================
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      console.log(`🔴 New notification! Unread count: ${prevUnreadCount.current} -> ${unreadCount}`);
      
      setBellRing(true);
      setTimeout(() => setBellRing(false), 1500);
      
      if (soundEnabled) {
        playNotificationSound();
      }
      
      const lastNotif = notifications?.[0];
      if (browserNotificationsEnabled && lastNotif) {
        const title = lastNotif.title || 'New Notification';
        const message = lastNotif.message || 'You have a new notification';
        sendBrowserNotification(title, message);
      }
      
      toast.info('🔔 You have a new notification!', {
        position: 'top-right',
        autoClose: 4000,
        style: {
          background: '#0B5FA5',
          color: 'white',
        },
      });
    }
    
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, notifications, soundEnabled, browserNotificationsEnabled]);

  // ============================================================
  // ✅ SAVE PREFERENCES
  // ============================================================
  useEffect(() => {
    localStorage.setItem('notificationSound', soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('browserNotifications', browserNotificationsEnabled);
  }, [browserNotificationsEnabled]);

  // ============================================================
  // ✅ HANDLERS
  // ============================================================
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
    handleMenuClose();
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleUsersClick = () => {
    navigate('/users');
    handleMenuClose();
  };

  // ❌ Settings handler removed

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  // ============================================================
  // ✅ DRAWER CONTENT
  // ============================================================
  const drawer = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0B5FA5',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          minHeight: { xs: 80, sm: 100 },
        }}
      >
        <img
          src="/logo.png"
          alt="PAEC Logo"
          style={{
            width: isMobile ? 70 : 90,
            height: isMobile ? 70 : 90,
            objectFit: 'contain',
          }}
        />
      </Box>

      {/* Menu Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: { xs: 1, sm: 2 },
          px: { xs: 0.5, sm: 1 },
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '4px',
            transition: 'background 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255,255,255,0.5)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.3) rgba(255,255,255,0.1)',
        }}
      >
        <List sx={{ p: 0 }}>
          {filteredMenuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mx: { xs: 0.5, sm: 1 },
                mb: 0.5,
                borderRadius: 2,
                color: 'white',
                py: { xs: 1, sm: 1.2 },
                px: { xs: 1, sm: 2 },
                minHeight: { xs: 44, sm: 48 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'scale(1.02)',
                },
                '&.Mui-selected': {
                  bgcolor: '#C9A227',
                  '&:hover': {
                    bgcolor: '#C9A227',
                  },
                },
              }}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon
                sx={{
                  color: 'white',
                  minWidth: { xs: 36, sm: 40 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {React.isValidElement(item.icon) ? (
                  React.cloneElement(item.icon, {
                    sx: {
                      fontSize: 22,
                      color: 'white',
                      ...(item.icon.props.sx || {}),
                    }
                  })
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: { xs: '12px', sm: '13px', md: '14px' },
                  fontWeight: 500,
                  noWrap: true,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                sx={{
                  margin: 0,
                  flex: 1,
                  minWidth: 0,
                  width: '100%',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  // ============================================================
  // ✅ DRAWER WIDTH
  // ============================================================
  const getDrawerWidth = () => {
    if (isMobile) return drawerWidth;
    if (isTablet) return 240;
    return drawerWidth;
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN';

  // ============================================================
  // ✅ RENDER
  // ============================================================
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <style>{badgeStyles}</style>
      <NotificationSound />
      
      {/* ============================================================ */}
      {/* ✅ APP BAR - NAVBAR WITH PROFILE IMAGE */}
      {/* ============================================================ */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${getDrawerWidth()}px)` },
          ml: { sm: `${getDrawerWidth()}px` },
          bgcolor: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #e9ecef',
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            px: { xs: 1.5, sm: 3 },
            minHeight: { xs: 64, sm: 72 },
          }}
        >
          {/* LEFT: Menu + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="primary"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                color: '#0B5FA5',
                fontWeight: 700,
                fontSize: { xs: '18px', sm: '22px', md: '24px' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              PAEC Equipment Management
            </Typography>
          </Box>

          {/* CENTER: Global Search */}
          <GlobalSearch />

          {/* RIGHT: Big Bell + Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            
            {/* 🔔 BELL WITH BADGE */}
            <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No notifications'}>
              <IconButton
                color="primary"
                onClick={handleNotificationOpen}
                data-notification-icon="true"
                sx={{
                  padding: { xs: 1, sm: 1.5 },
                  position: 'relative',
                  border: '2px solid transparent',
                  borderRadius: '50%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    backgroundColor: 'rgba(11, 95, 165, 0.08)',
                    border: '2px solid #0B5FA5',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  max={99}
                  className={bellRing ? 'bell-ring' : ''}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#dc3545',
                      color: 'white',
                      fontSize: { xs: '9px', sm: '10px' },
                      fontWeight: 700,
                      minWidth: { xs: 16, sm: 20 },
                      height: { xs: 16, sm: 20 },
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                      border: '2px solid white',
                      padding: '0 4px',
                      animation: unreadCount > 0 ? 'badgePulse 2s ease-in-out infinite' : 'none',
                    },
                  }}
                >
                  <Notifications 
                    sx={{ 
                      fontSize: { xs: 28, sm: 36 },
                      color: '#0B5FA5',
                      animation: bellRing ? 'bellRing 0.6s ease-in-out 3' : 'none',
                    }} 
                  />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* ✅👤 AVATAR - Profile picture from Redux with proper image URL */}
            <IconButton onClick={handleMenuOpen} sx={{ p: { xs: 0.5, sm: 0.75 } }}>
              <Avatar
                src={profileImageUrl}
                sx={{
                  bgcolor: '#0B5FA5',
                  width: { xs: 38, sm: 44 },
                  height: { xs: 38, sm: 44 },
                  fontSize: { xs: '16px', sm: '18px' },
                  fontWeight: 600,
                  border: '2px solid #0B5FA5',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    border: '2px solid #C9A227',
                  },
                }}
              >
                {!user?.profile_image && (user?.full_name?.charAt(0) || 'U')}
              </Avatar>
            </IconButton>

            {/* PROFILE MENU */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>

              {isAdmin && (
                <MenuItem onClick={handleUsersClick}>
                  <ListItemIcon>
                    <PersonAdd fontSize="small" />
                  </ListItemIcon>
                  Users
                </MenuItem>
              )}

              {/* ❌ Settings Menu Item REMOVED */}

              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToApp fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications Dropdown */}
      <NotificationsDropdown
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
      />

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: getDrawerWidth() },
          flexShrink: { sm: 0 },
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              overflow: 'hidden',
              bgcolor: '#0B5FA5',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: getDrawerWidth(),
              border: 'none',
              bgcolor: '#0B5FA5',
              overflow: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${getDrawerWidth()}px)` },
          ml: { sm: `${getDrawerWidth()}px` },
          mt: { xs: '56px', sm: '64px' },
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          bgcolor: '#F5F7FA',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 10000 }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MainLayout;