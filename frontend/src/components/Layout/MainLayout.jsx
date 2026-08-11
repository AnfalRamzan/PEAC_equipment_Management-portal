// src/components/Layout/MainLayout.jsx
// ✅ LARGER TEXT - NO SCROLL

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
  Description,
  ShoppingCart,
  LocalShipping,
  Assessment,
  Inventory,
  Gavel,
  EmojiObjects,
} from '@mui/icons-material';
import { useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateProfileImage, refreshUser } from '../../redux/slices/authSlice';
import { fetchUnreadCount, fetchNotifications } from '../../redux/slices/notificationSlice';
import NotificationsDropdown from '../Notifications/NotificationsDropdown';
import GlobalSearch from '../GlobalSearch';
import NotificationSound from '../NotificationSound';
import { toast } from 'react-toastify';

const drawerWidth = 240;

// ============================================================
// ✅ PAEC THEME COLORS
// ============================================================
const colors = {
  sidebar: '#01411C',
  sidebarHover: '#0B542B',
  active: '#0E6335',
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  text: '#FFFFFF',
  secondaryText: '#B8C8BE',
  mainBg: '#F0F2F5',
  white: '#FFFFFF',
  darkText: '#1A2A3A',
  lightText: '#5A7A8A',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#ED6C02',
  info: '#0B5FA5',
  borderColor: 'rgba(1, 65, 28, 0.08)',
  shadowColor: 'rgba(1, 65, 28, 0.08)',
};

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

@keyframes glowPulse {
    0% { opacity: 0.3; }
    50% { opacity: 0.8; }
    100% { opacity: 0.3; }
}

@keyframes iconFloat {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
    100% { transform: translateY(0px); }
}

@keyframes gradientShine {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

.bell-ring {
    animation: bellRing 0.6s ease-in-out 3;
}

.gradient-shine {
    animation: gradientShine 3s ease-in-out infinite;
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
// ✅ MENU ITEMS
// ============================================================
const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Hospitals', icon: <LocalHospital />, path: '/hospitals' },
  { text: 'Equipment', icon: <MedicalServices />, path: '/equipment' },
  { text: 'Error Logs', icon: <ErrorOutline />, path: '/errors' },
  { text: 'Repairs', icon: <Build />, path: '/repairs' },
  { text: 'Knowledge Base', icon: <EmojiObjects />, path: '/knowledge-base' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Maintenance', icon: <Handyman />, path: '/maintenance' },
  { text: 'Spare Parts', icon: <Inventory />, path: '/spare-parts' },
  { text: 'Service Documentation', icon: <Description />, path: '/service-documentation' },
  { text: 'AMC Contracts', icon: <Gavel />, path: '/amc' },
  { text: 'Purchase Orders', icon: <ShoppingCart />, path: '/purchase-orders' },
  { text: 'Equipment Procurement', icon: <LocalShipping />, path: '/procurement' },
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

  const profileImageUrl = user?.profile_image ? getFullImageUrl(user.profile_image) : null;

  // ============================================================
  // ✅ GET FILTERED MENU ITEMS
  // ============================================================
  const getFilteredMenuItems = () => {
    const userRole = user?.role || 'ENGINEER';
    if (userRole === 'ENGINEER' || userRole === 'SUPER_ADMIN') {
      return menuItems;
    }
    return [];
  };

  const filteredMenuItems = getFilteredMenuItems();
  const prevUnreadCount = useRef(unreadCount);

  // ============================================================
  // ✅ EFFECTS
  // ============================================================
  useEffect(() => {
    if (user) {
      dispatch(fetchUnreadCount());
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          const updatedUser = JSON.parse(e.newValue);
          if (updatedUser) {
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

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        const currentProfileImage = user?.profile_image;
        const storedProfileImage = storedUser.profile_image;
        if (storedProfileImage !== currentProfileImage) {
          dispatch(updateProfileImage(storedProfileImage));
        }
      }
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, [dispatch, user?.profile_image]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch, user]);

  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setBellRing(true);
      setTimeout(() => setBellRing(false), 1500);
      
      if (soundEnabled) playNotificationSound();
      
      const lastNotif = notifications?.[0];
      if (browserNotificationsEnabled && lastNotif) {
        sendBrowserNotification(lastNotif.title || 'New Notification', lastNotif.message || 'You have a new notification');
      }
      
      toast.info('🔔 You have a new notification!', {
        position: 'top-right',
        autoClose: 4000,
        style: {
          background: colors.sidebar,
          color: colors.accentGold,
        },
      });
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, notifications, soundEnabled, browserNotificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationSound', soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('browserNotifications', browserNotificationsEnabled);
  }, [browserNotificationsEnabled]);

  // ============================================================
  // ✅ HANDLERS
  // ============================================================
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
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

  const handleNotificationOpen = (event) => setNotificationAnchor(event.currentTarget);
  const handleNotificationClose = () => setNotificationAnchor(null);

  // ============================================================
  // ✅ DRAWER CONTENT - LARGER TEXT, NO SCROLL
  // ============================================================
  const drawer = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: colors.sidebar,
        backgroundImage: `linear-gradient(180deg, ${colors.sidebar} 0%, ${colors.active} 40%, ${colors.sidebar} 100%)`,
        overflow: 'hidden',
        width: '100%',
        borderRight: `1px solid rgba(201, 162, 39, 0.08)`,
        boxShadow: '4px 0 30px rgba(0,0,0,0.3)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 0%, rgba(201, 162, 39, 0.03) 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1px',
          height: '100%',
          background: `linear-gradient(180deg, transparent, rgba(201, 162, 39, 0.2), transparent)`,
          animation: 'glowPulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: { xs: 0.8, sm: 1.2 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: `1px solid rgba(201, 162, 39, 0.08)`,
          flexShrink: 0,
          minHeight: { xs: 75, sm: 95 },
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <img
            src="/logoo.png"
            alt="PAEC Logo"
            style={{
              width: isMobile ? 80 : 105,
              height: isMobile ? 80 : 105,
              objectFit: 'contain',
              backgroundColor: 'transparent',
              filter: 'brightness(1.1) drop-shadow(0 0 25px rgba(201, 162, 39, 0.15))',
            }}
            onError={(e) => {
              console.warn('⚠️ logoo.png not found, falling back to logo.png');
              e.target.src = '/logo.png';
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -25,
              left: -25,
              right: -25,
              bottom: -25,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(201, 162, 39, 0.06) 0%, transparent 70%)`,
              animation: 'glowPulse 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>

      {/* ✅ COMPACT MENU - LARGER TEXT, NO SCROLL */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          py: { xs: 0.1, sm: 0.2 },
          px: { xs: 0.2, sm: 0.3 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <List sx={{ p: 0, m: 0 }}>
          {filteredMenuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mx: { xs: 0.1, sm: 0.2 },
                mb: 0.1,
                borderRadius: 1.5,
                color: colors.secondaryText,
                py: { xs: 0.4, sm: 0.5 },
                px: { xs: 0.8, sm: 1.2 },
                minHeight: { xs: 32, sm: 36 },
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  height: '70%',
                  width: '2px',
                  background: colors.accentGold,
                  transform: 'scaleX(0)',
                  transition: 'transform 0.3s ease',
                  boxShadow: `0 0 15px rgba(201, 162, 39, 0.3)`,
                },
                '&:hover': {
                  bgcolor: colors.sidebarHover,
                  color: colors.text,
                  transform: 'translateX(3px)',
                  '&::before': {
                    transform: 'scaleX(1)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: colors.accentGold,
                    transform: 'scale(1.05)',
                  },
                },
                '&.Mui-selected': {
                  color: colors.text,
                  background: `linear-gradient(135deg, ${colors.active} 0%, ${colors.accentGold}30 40%, ${colors.active} 80%, ${colors.active} 100%)`,
                  backgroundSize: '200% 200%',
                  animation: 'gradientShine 3s ease-in-out infinite',
                  boxShadow: `inset 0 0 30px rgba(201, 162, 39, 0.1)`,
                  transform: 'scale(1.02)',
                  '&::before': {
                    transform: 'scaleX(1)',
                    boxShadow: `0 0 30px rgba(201, 162, 39, 0.5)`,
                    width: '3px',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 1.5,
                    background: `radial-gradient(circle at 50% 50%, ${colors.accentGold}10 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  },
                  '& .MuiListItemIcon-root': {
                    color: colors.accentGold,
                    animation: 'iconFloat 3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 15px rgba(201, 162, 39, 0.4))',
                  },
                  '& .MuiTypography-root': {
                    fontWeight: 600,
                    textShadow: `0 0 20px rgba(201, 162, 39, 0.2)`,
                  },
                  '&:hover': {
                    background: `linear-gradient(135deg, ${colors.active} 0%, ${colors.accentGold}40 40%, ${colors.active} 80%, ${colors.active} 100%)`,
                  },
                },
              }}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon
                sx={{
                  color: colors.secondaryText,
                  minWidth: { xs: 28, sm: 32 },
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.isValidElement(item.icon) ? (
                  React.cloneElement(item.icon, {
                    sx: {
                      fontSize: { xs: 17, sm: 19 },
                      transition: 'all 0.3s ease',
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
                  fontSize: { xs: '11px', sm: '12px', md: '13px' },
                  fontWeight: 500,
                  noWrap: true,
                  letterSpacing: '0.2px',
                  transition: 'all 0.3s ease',
                }}
                sx={{ margin: 0, flex: 1, minWidth: 0 }}
              />
              {window.location.pathname === item.path && (
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    bgcolor: colors.accentGold,
                    flexShrink: 0,
                    ml: 0.5,
                    boxShadow: `0 0 20px rgba(201, 162, 39, 0.6)`,
                    animation: 'glowPulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
        
        {/* ✅ PUSH EXTRA SPACE TO BOTTOM - NO SCROLL */}
        <Box sx={{ flex: 1 }} />
      </Box>
      
      {/* ❌ FOOTER REMOVED */}
    </Box>
  );

  // ============================================================
  // ✅ DRAWER WIDTH
  // ============================================================
  const getDrawerWidth = () => {
    if (isMobile) return 230;
    if (isTablet) return 210;
    return 240;
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER';

  // ============================================================
  // ✅ RENDER
  // ============================================================
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <style>{badgeStyles}</style>
      <NotificationSound />
      
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${getDrawerWidth()}px)` },
          ml: { sm: `${getDrawerWidth()}px` },
          bgcolor: colors.white,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderBottom: `1px solid rgba(1, 65, 28, 0.06)`,
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            px: { xs: 1.5, sm: 3 },
            minHeight: { xs: 60, sm: 68 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { sm: 'none' },
                color: colors.sidebar,
                '&:hover': {
                  color: colors.accentGold,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                color: colors.sidebar,
                fontWeight: 700,
                fontSize: { xs: '14px', sm: '18px', md: '20px' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '0.3px',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -2,
                  left: 0,
                  width: '30%',
                  height: '2px',
                  background: `linear-gradient(90deg, ${colors.sidebar}, ${colors.accentGold})`,
                  borderRadius: '2px',
                },
              }}
            >
              PAEC Equipment Management
            </Typography>
          </Box>

          <GlobalSearch />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No notifications'}>
              <IconButton
                onClick={handleNotificationOpen}
                sx={{
                  padding: { xs: 0.8, sm: 1.2 },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: `rgba(1, 65, 28, 0.08)`,
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
                      bgcolor: colors.accentGold,
                      color: colors.sidebar,
                      fontSize: { xs: '8px', sm: '9px' },
                      fontWeight: 800,
                      minWidth: { xs: 14, sm: 18 },
                      height: { xs: 14, sm: 18 },
                      borderRadius: '50%',
                      boxShadow: `0 0 15px rgba(201, 162, 39, 0.3)`,
                      border: `2px solid ${colors.white}`,
                      padding: '0 3px',
                      animation: unreadCount > 0 ? 'badgePulse 2s ease-in-out infinite' : 'none',
                    },
                  }}
                >
                  <Notifications sx={{ fontSize: { xs: 22, sm: 28 }, color: colors.sidebar }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <IconButton onClick={handleMenuOpen} sx={{ p: { xs: 0.3, sm: 0.5 } }}>
              <Avatar
                src={profileImageUrl}
                sx={{
                  bgcolor: colors.sidebar,
                  width: { xs: 30, sm: 38 },
                  height: { xs: 30, sm: 38 },
                  fontSize: { xs: '12px', sm: '14px' },
                  fontWeight: 600,
                  border: `2px solid ${colors.accentGold}`,
                  boxShadow: `0 0 15px rgba(201, 162, 39, 0.1)`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 25px rgba(201, 162, 39, 0.2)`,
                  },
                }}
              >
                {!user?.profile_image && (user?.full_name?.charAt(0) || 'U')}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  minWidth: 160,
                  border: `1px solid ${colors.borderColor}`,
                }
              }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ '&:hover': { bgcolor: `${colors.sidebar}08` } }}>
                <ListItemIcon>
                  <AccountCircle sx={{ color: colors.sidebar }} fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>

              {isAdmin && (
                <MenuItem onClick={handleUsersClick} sx={{ '&:hover': { bgcolor: `${colors.sidebar}08` } }}>
                  <ListItemIcon>
                    <PersonAdd sx={{ color: colors.sidebar }} fontSize="small" />
                  </ListItemIcon>
                  Users
                </MenuItem>
              )}

              <Divider sx={{ borderColor: colors.borderColor }} />
              <MenuItem onClick={handleLogout} sx={{ color: colors.error, '&:hover': { bgcolor: `${colors.error}08` } }}>
                <ListItemIcon>
                  <ExitToApp sx={{ color: colors.error }} fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <NotificationsDropdown
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={handleNotificationClose}
      />

      <Box component="nav" sx={{ width: { sm: getDrawerWidth() }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 230,
              overflow: 'hidden',
              bgcolor: colors.sidebar,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: getDrawerWidth(),
              border: 'none',
              bgcolor: colors.sidebar,
              overflow: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

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
          bgcolor: colors.mainBg,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>

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