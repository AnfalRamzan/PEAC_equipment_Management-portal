// src/components/Layout/MainLayout.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - PREMIUM GLASS EFFECT

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

const drawerWidth = 250;

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS
// ============================================================
const colors = {
  // Dark Navy Base
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyDark: '#0A0F1E',
  darkNavyHover: '#1E3A5F',
  
  // Light Cyan Accents
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  
  // Sidebar - Glass effect with Dark Navy
  sidebar: 'rgba(15, 23, 42, 0.92)',
  sidebarHover: 'rgba(30, 58, 95, 0.7)',
  active: 'rgba(30, 58, 95, 0.8)',
  
  // Text - Cyan tinted for better readability
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  
  // Gold accent (keeping PAEC branding)
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  
  // Other
  mainBg: '#F1F5F9',
  white: '#FFFFFF',
  darkText: '#0F172A',
  lightText: '#64748B',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Glass effects
  glassBorder: 'rgba(103, 232, 249, 0.1)',
  glassBg: 'rgba(15, 23, 42, 0.7)',
  glassShine: 'rgba(103, 232, 249, 0.03)',
  shadowColor: 'rgba(0, 0, 0, 0.6)',
  glowCyan: 'rgba(103, 232, 249, 0.15)',
};

// ============================================================
// ✅ CSS ANIMATIONS WITH CYAN GLOW
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
    50% { opacity: 0.9; }
    100% { opacity: 0.3; }
}

@keyframes cyanGlowPulse {
    0% { 
        box-shadow: 0 0 15px rgba(103, 232, 249, 0.2);
        opacity: 0.6;
    }
    50% { 
        box-shadow: 0 0 35px rgba(103, 232, 249, 0.5);
        opacity: 1;
    }
    100% { 
        box-shadow: 0 0 15px rgba(103, 232, 249, 0.2);
        opacity: 0.6;
    }
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

@keyframes glassShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
}

@keyframes cyanBorderPulse {
    0% { border-color: rgba(103, 232, 249, 0.1); }
    50% { border-color: rgba(103, 232, 249, 0.4); }
    100% { border-color: rgba(103, 232, 249, 0.1); }
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
          background: colors.darkNavy,
          color: colors.lightCyan,
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
  // ✅ DRAWER WIDTH
  // ============================================================
  const getDrawerWidth = () => {
    if (isMobile) return 240;
    if (isTablet) return 220;
    return 250;
  };

  // ============================================================
  // ✅ DRAWER CONTENT - DARK NAVY + LIGHT CYAN
  // ============================================================
  const drawer = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'transparent',
        backdropFilter: 'blur(16px) saturate(200%)',
        WebkitBackdropFilter: 'blur(16px) saturate(200%)',
        background: `linear-gradient(180deg, 
          rgba(15, 23, 42, 0.95) 0%,
          rgba(30, 58, 95, 0.88) 30%,
          rgba(10, 15, 30, 0.96) 60%,
          rgba(15, 23, 42, 0.95) 100%)`,
        overflow: 'hidden',
        width: '100%',
        borderRight: `1px solid rgba(103, 232, 249, 0.12)`,
        boxShadow: `
          4px 0 50px rgba(0, 0, 0, 0.7), 
          inset 0 0 120px rgba(103, 232, 249, 0.02),
          inset 0 0 200px rgba(0, 0, 0, 0.3)
        `,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 50% 0%, rgba(103, 232, 249, 0.05) 0%, transparent 60%)`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '2px',
          height: '100%',
          background: `linear-gradient(180deg, 
            transparent, 
            rgba(103, 232, 249, 0.25), 
            rgba(201, 162, 39, 0.1), 
            transparent)`,
          animation: 'glowPulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        },
        '& .glass-shimmer': {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, 
            transparent 25%, 
            rgba(103, 232, 249, 0.03) 50%, 
            transparent 75%)`,
          backgroundSize: '200% 200%',
          animation: 'glassShimmer 8s ease-in-out infinite',
          pointerEvents: 'none',
        },
        '& .cyan-glow': {
          position: 'absolute',
          top: '40%',
          left: '30%',
          width: '60%',
          height: '60%',
          background: `radial-gradient(circle, rgba(103, 232, 249, 0.04) 0%, transparent 70%)`,
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(80px)',
        },
      }}
    >
      {/* Overlays */}
      <Box className="glass-shimmer" />
      <Box className="cyan-glow" />

      {/* Logo Section - Cyan accent */}
      <Box
        sx={{
          p: { xs: 1, sm: 1.5 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: `1px solid rgba(103, 232, 249, 0.08)`,
          flexShrink: 0,
          minHeight: { xs: 80, sm: 100 },
          position: 'relative',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: '8%',
            right: '8%',
            height: '1px',
            background: `linear-gradient(90deg, 
              transparent, 
              rgba(103, 232, 249, 0.3), 
              rgba(201, 162, 39, 0.15), 
              transparent)`,
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <img
            src="/logoo.png"
            alt="PAEC Logo"
            style={{
              width: isMobile ? 85 : 110,
              height: isMobile ? 85 : 110,
              objectFit: 'contain',
              backgroundColor: 'transparent',
              filter: 'brightness(1.2) drop-shadow(0 0 40px rgba(103, 232, 249, 0.2))',
            }}
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              left: -30,
              right: -30,
              bottom: -30,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(103, 232, 249, 0.06) 0%, transparent 70%)`,
              animation: 'glowPulse 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>

      {/* ✅ MENU - DARK NAVY + LIGHT CYAN */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          py: { xs: 0.3, sm: 0.5 },
          px: { xs: 0.3, sm: 0.5 },
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(5px)',
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
                mx: { xs: 0.3, sm: 0.4 },
                mb: 0.15,
                borderRadius: 2,
                color: colors.secondaryText,
                py: { xs: 0.5, sm: 0.6 },
                px: { xs: 1, sm: 1.5 },
                minHeight: { xs: 36, sm: 40 },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: 'rgba(30, 58, 95, 0.6)',
                  backdropFilter: 'blur(15px)',
                  color: '#FFFFFF',
                  transform: 'translateX(4px) scale(1.02)',
                  boxShadow: '0 4px 25px rgba(0,0,0,0.3)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    height: '70%',
                    width: '3px',
                    background: colors.lightCyan,
                    boxShadow: `0 0 30px ${colors.lightCyanGlowStrong}`,
                    borderRadius: '0 2px 2px 0',
                  },
                  '& .MuiListItemIcon-root': {
                    color: colors.lightCyan,
                    transform: 'scale(1.1)',
                    filter: `drop-shadow(0 0 15px ${colors.lightCyanGlow})`,
                  },
                },
                '&.Mui-selected': {
                  color: '#FFFFFF',
                  background: `linear-gradient(135deg, 
                    rgba(30, 58, 95, 0.7) 0%, 
                    rgba(103, 232, 249, 0.08) 35%, 
                    rgba(15, 23, 42, 0.8) 70%, 
                    rgba(30, 58, 95, 0.6) 100%)`,
                  backgroundSize: '200% 200%',
                  animation: 'gradientShine 3s ease-in-out infinite',
                  backdropFilter: 'blur(20px)',
                  boxShadow: `
                    inset 0 0 50px rgba(103, 232, 249, 0.03),
                    0 4px 25px rgba(0,0,0,0.3),
                    0 0 40px rgba(103, 232, 249, 0.04)
                  `,
                  transform: 'scale(1.02)',
                  border: `1px solid rgba(103, 232, 249, 0.15)`,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '15%',
                    height: '70%',
                    width: '3px',
                    background: colors.lightCyan,
                    boxShadow: `0 0 40px ${colors.lightCyanGlowStrong}`,
                    borderRadius: '0 2px 2px 0',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 2,
                    background: `radial-gradient(circle at 50% 50%, rgba(103, 232, 249, 0.03) 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  },
                  '& .MuiListItemIcon-root': {
                    color: colors.lightCyan,
                    animation: 'iconFloat 3s ease-in-out infinite',
                    filter: `drop-shadow(0 0 20px ${colors.lightCyanGlow})`,
                  },
                  '& .MuiTypography-root': {
                    fontWeight: 600,
                    textShadow: `0 0 30px rgba(103, 232, 249, 0.1)`,
                  },
                  '&:hover': {
                    background: `linear-gradient(135deg, 
                      rgba(30, 58, 95, 0.8) 0%, 
                      rgba(103, 232, 249, 0.12) 35%, 
                      rgba(15, 23, 42, 0.9) 70%, 
                      rgba(30, 58, 95, 0.7) 100%)`,
                  },
                },
              }}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon
                sx={{
                  color: colors.secondaryText,
                  minWidth: { xs: 32, sm: 36 },
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {React.isValidElement(item.icon) ? (
                  React.cloneElement(item.icon, {
                    sx: {
                      fontSize: { xs: 18, sm: 20 },
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
                  fontSize: { xs: '12px', sm: '13px', md: '14px' },
                  fontWeight: 500,
                  noWrap: true,
                  letterSpacing: '0.3px',
                  transition: 'all 0.3s ease',
                }}
                sx={{ margin: 0, flex: 1, minWidth: 0 }}
              />
              {window.location.pathname === item.path && (
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: colors.lightCyan,
                    flexShrink: 0,
                    ml: 0.5,
                    boxShadow: `0 0 35px ${colors.lightCyanGlowStrong}`,
                    animation: 'cyanGlowPulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ flex: 1 }} />
      </Box>
    </Box>
  );

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
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 1px 30px rgba(0,0,0,0.06)',
          borderBottom: `1px solid rgba(103, 232, 249, 0.15)`,
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3 },
            minHeight: { xs: 64, sm: 72 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                display: { sm: 'none' },
                color: '#0F172A',
                '&:hover': {
                  color: colors.lightCyan,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                color: '#0F172A',
                fontWeight: 700,
                fontSize: { xs: '15px', sm: '18px', md: '21px' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '0.5px',
                '&::after': {
                  content: '""',
                  display: 'block',
                  width: '30%',
                  height: '2px',
                  background: `linear-gradient(90deg, #0F172A, ${colors.lightCyan})`,
                  borderRadius: '2px',
                  marginTop: '2px',
                },
              }}
            >
              PAEC Equipment Management
            </Typography>
          </Box>

          <GlobalSearch />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No notifications'}>
              <IconButton
                onClick={handleNotificationOpen}
                sx={{
                  padding: { xs: 1, sm: 1.2 },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: `rgba(103, 232, 249, 0.1)`,
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
                      bgcolor: colors.lightCyan,
                      color: '#0F172A',
                      fontSize: { xs: '9px', sm: '10px' },
                      fontWeight: 800,
                      minWidth: { xs: 16, sm: 20 },
                      height: { xs: 16, sm: 20 },
                      borderRadius: '50%',
                      boxShadow: `0 0 20px ${colors.lightCyanGlowStrong}`,
                      border: `2px solid white`,
                      padding: '0 4px',
                      animation: unreadCount > 0 ? 'badgePulse 2s ease-in-out infinite' : 'none',
                    },
                  }}
                >
                  <Notifications sx={{ fontSize: { xs: 24, sm: 30 }, color: '#0F172A' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <IconButton onClick={handleMenuOpen} sx={{ p: { xs: 0.5, sm: 0.5 } }}>
              <Avatar
                src={profileImageUrl}
                sx={{
                  bgcolor: '#0F172A',
                  width: { xs: 34, sm: 42 },
                  height: { xs: 34, sm: 42 },
                  fontSize: { xs: '13px', sm: '15px' },
                  fontWeight: 600,
                  border: `2px solid ${colors.lightCyan}`,
                  boxShadow: `0 0 20px ${colors.lightCyanGlow}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 30px ${colors.lightCyanGlowStrong}`,
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
                  boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
                  minWidth: 180,
                  border: `1px solid rgba(103, 232, 249, 0.1)`,
                  backdropFilter: 'blur(10px)',
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                }
              }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
                <ListItemIcon>
                  <AccountCircle sx={{ color: '#0F172A' }} fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>

              {isAdmin && (
                <MenuItem onClick={handleUsersClick} sx={{ '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
                  <ListItemIcon>
                    <PersonAdd sx={{ color: '#0F172A' }} fontSize="small" />
                  </ListItemIcon>
                  Users
                </MenuItem>
              )}

              <Divider sx={{ borderColor: 'rgba(103, 232, 249, 0.1)' }} />
              <MenuItem onClick={handleLogout} sx={{ color: colors.error, '&:hover': { bgcolor: `${colors.error}06` } }}>
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
              width: 240,
              overflow: 'hidden',
              bgcolor: 'transparent',
              backdropFilter: 'blur(16px) saturate(200%)',
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
              bgcolor: 'transparent',
              overflow: 'hidden',
              backdropFilter: 'blur(16px) saturate(200%)',
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
          p: { xs: 2, sm: 2.5, md: 3.5 },
          width: { sm: `calc(100% - ${getDrawerWidth()}px)` },
          ml: { sm: `${getDrawerWidth()}px` },
          mt: { xs: '64px', sm: '72px' },
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 72px)' },
          bgcolor: '#F1F5F9',
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