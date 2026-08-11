// src/components/Layout/MainLayout.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - PREMIUM GLITTER EFFECT SIDEBAR
// ✅ Balanced spacing, NO SCROLL, Click highlights prominently

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
  School,
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
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyDark: '#0A0F1E',
  darkNavyHover: '#1E3A5F',
  
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  
  sidebar: 'rgba(15, 23, 42, 0.92)',
  sidebarHover: 'rgba(30, 58, 95, 0.7)',
  active: 'rgba(30, 58, 95, 0.8)',
  
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  
  mainBg: '#F1F5F9',
  white: '#FFFFFF',
  darkText: '#0F172A',
  lightText: '#64748B',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  glassBorder: 'rgba(103, 232, 249, 0.1)',
  glassBg: 'rgba(15, 23, 42, 0.7)',
  glassShine: 'rgba(103, 232, 249, 0.03)',
  shadowColor: 'rgba(0, 0, 0, 0.6)',
  glowCyan: 'rgba(103, 232, 249, 0.15)',
};

// ============================================================
// ✅ PREMIUM GLITTER & SHINE ANIMATIONS
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

@keyframes glitterShine {
    0% {
        background-position: -300% center;
        opacity: 0;
    }
    10% {
        opacity: 1;
    }
    50% {
        opacity: 0.8;
    }
    90% {
        opacity: 1;
    }
    100% {
        background-position: 300% center;
        opacity: 0;
    }
}

@keyframes shimmerFloat {
    0% {
        transform: translateX(-100%) rotate(-5deg);
        opacity: 0;
    }
    20% {
        opacity: 0.6;
    }
    50% {
        opacity: 1;
    }
    80% {
        opacity: 0.6;
    }
    100% {
        transform: translateX(200%) rotate(-5deg);
        opacity: 0;
    }
}

@keyframes sparkle {
    0% {
        transform: scale(0) rotate(0deg);
        opacity: 0;
    }
    30% {
        transform: scale(1.2) rotate(30deg);
        opacity: 1;
    }
    60% {
        transform: scale(0.8) rotate(60deg);
        opacity: 0.8;
    }
    100% {
        transform: scale(0) rotate(90deg);
        opacity: 0;
    }
}

@keyframes goldSparkle {
    0% {
        transform: scale(0) rotate(0deg);
        opacity: 0;
        box-shadow: 0 0 0px rgba(201, 162, 39, 0);
    }
    50% {
        transform: scale(1.5) rotate(180deg);
        opacity: 1;
        box-shadow: 0 0 30px rgba(201, 162, 39, 0.6);
    }
    100% {
        transform: scale(0) rotate(360deg);
        opacity: 0;
        box-shadow: 0 0 0px rgba(201, 162, 39, 0);
    }
}

@keyframes cyanSparkle {
    0% {
        transform: scale(0) rotate(0deg);
        opacity: 0;
        box-shadow: 0 0 0px rgba(103, 232, 249, 0);
    }
    50% {
        transform: scale(1.5) rotate(180deg);
        opacity: 1;
        box-shadow: 0 0 30px rgba(103, 232, 249, 0.6);
    }
    100% {
        transform: scale(0) rotate(360deg);
        opacity: 0;
        box-shadow: 0 0 0px rgba(103, 232, 249, 0);
    }
}

@keyframes sidebarGlow {
    0% {
        box-shadow: 
            0 0 40px rgba(103, 232, 249, 0.02),
            inset 0 0 80px rgba(103, 232, 249, 0.01);
    }
    50% {
        box-shadow: 
            0 0 60px rgba(103, 232, 249, 0.06),
            inset 0 0 100px rgba(103, 232, 249, 0.03);
    }
    100% {
        box-shadow: 
            0 0 40px rgba(103, 232, 249, 0.02),
            inset 0 0 80px rgba(103, 232, 249, 0.01);
    }
}

@keyframes menuItemGlow {
    0% {
        border-color: rgba(103, 232, 249, 0.1);
        box-shadow: 0 0 20px rgba(103, 232, 249, 0);
    }
    50% {
        border-color: rgba(103, 232, 249, 0.3);
        box-shadow: 0 0 30px rgba(103, 232, 249, 0.05);
    }
    100% {
        border-color: rgba(103, 232, 249, 0.1);
        box-shadow: 0 0 20px rgba(103, 232, 249, 0);
    }
}

@keyframes selectedPulse {
    0% {
        box-shadow: 0 0 20px rgba(103, 232, 249, 0.2);
    }
    50% {
        box-shadow: 0 0 40px rgba(103, 232, 249, 0.5);
    }
    100% {
        box-shadow: 0 0 20px rgba(103, 232, 249, 0.2);
    }
}

.bell-ring {
    animation: bellRing 0.6s ease-in-out 3;
}

.gradient-shine {
    animation: gradientShine 3s ease-in-out infinite;
}

.glitter-shine {
    animation: glitterShine 4s ease-in-out infinite;
}

.shimmer-float {
    animation: shimmerFloat 3s ease-in-out infinite;
}

.sparkle-effect {
    animation: sparkle 2s ease-in-out infinite;
}

.gold-sparkle {
    animation: goldSparkle 3s ease-in-out infinite;
}

.cyan-sparkle {
    animation: cyanSparkle 2.5s ease-in-out infinite;
}

.sidebar-glow {
    animation: sidebarGlow 4s ease-in-out infinite;
}

.menu-item-glow {
    animation: menuItemGlow 3s ease-in-out infinite;
}

.selected-pulse {
    animation: selectedPulse 2s ease-in-out infinite;
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
// ✅ MENU ITEMS - ALL ITEMS INCLUDING PROCUREMENT
// ============================================================
const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Hospitals', icon: <LocalHospital />, path: '/hospitals' },
  { text: 'Equipment', icon: <MedicalServices />, path: '/equipment' },
  { text: 'Error Logs', icon: <ErrorOutline />, path: '/errors' },
  { text: 'Repairs', icon: <Build />, path: '/repairs' },
  { text: 'Knowledge Base', icon: <EmojiObjects />, path: '/knowledge-base' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Training', icon: <School />, path: '/training' },
  { text: 'Maintenance', icon: <Handyman />, path: '/maintenance' },
  { text: 'Spare Parts', icon: <Inventory />, path: '/spare-parts' },
  { text: 'Service Doc.', icon: <Description />, path: '/service-documentation' },
  { text: 'AMC Contracts', icon: <Gavel />, path: '/amc' },
  { text: 'Purchase Orders', icon: <ShoppingCart />, path: '/purchase-orders' },
  { text: 'Procurement', icon: <LocalShipping />, path: '/procurement' },
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
    return menuItems;
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
  // ✨ SIDEBAR - BALANCED SPACING, NO SCROLL, PROMINENT CLICK
  // ============================================================
  const drawer = (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'transparent',
        backdropFilter: 'blur(20px) saturate(200%)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        background: `
          linear-gradient(180deg, 
            rgba(15, 23, 42, 0.95) 0%,
            rgba(30, 58, 95, 0.88) 25%,
            rgba(10, 15, 30, 0.96) 50%,
            rgba(30, 58, 95, 0.88) 75%,
            rgba(15, 23, 42, 0.95) 100%
          )
        `,
        overflow: 'hidden',
        width: '100%',
        borderRight: `1px solid rgba(103, 232, 249, 0.12)`,
        boxShadow: `
          4px 0 80px rgba(0, 0, 0, 0.8), 
          inset 0 0 150px rgba(103, 232, 249, 0.03),
          inset 0 0 200px rgba(0, 0, 0, 0.3),
          0 0 60px rgba(103, 232, 249, 0.02)
        `,
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `
            4px 0 100px rgba(0, 0, 0, 0.9), 
            inset 0 0 200px rgba(103, 232, 249, 0.05),
            0 0 80px rgba(103, 232, 249, 0.04),
            4px 0 60px rgba(103, 232, 249, 0.03)
          `,
        },
        '& .glitter-overlay': {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(105deg,
              transparent 30%,
              rgba(103, 232, 249, 0.02) 35%,
              rgba(103, 232, 249, 0.04) 40%,
              rgba(201, 162, 39, 0.02) 42%,
              rgba(103, 232, 249, 0.05) 45%,
              rgba(103, 232, 249, 0.02) 48%,
              rgba(201, 162, 39, 0.02) 50%,
              rgba(103, 232, 249, 0.04) 52%,
              rgba(103, 232, 249, 0.02) 55%,
              transparent 60%
            )
          `,
          backgroundSize: '300% 100%',
          animation: 'glitterShine 6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '& .shimmer-overlay': {
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `
            radial-gradient(
              ellipse at 30% 50%,
              rgba(103, 232, 249, 0.04) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse at 70% 80%,
              rgba(201, 162, 39, 0.02) 0%,
              transparent 40%
            ),
            radial-gradient(
              ellipse at 50% 20%,
              rgba(103, 232, 249, 0.03) 0%,
              transparent 30%
            )
          `,
          animation: 'shimmerFloat 8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '& .sparkle-1': {
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: '4px',
          height: '4px',
          background: colors.lightCyan,
          borderRadius: '50%',
          boxShadow: `0 0 20px ${colors.lightCyan}, 0 0 40px ${colors.lightCyan}`,
          animation: 'cyanSparkle 3.5s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 2,
        },
        '& .sparkle-2': {
          position: 'absolute',
          top: '40%',
          right: '5%',
          width: '3px',
          height: '3px',
          background: colors.accentGold,
          borderRadius: '50%',
          boxShadow: `0 0 20px ${colors.accentGold}, 0 0 40px ${colors.accentGold}`,
          animation: 'goldSparkle 4.2s ease-in-out infinite 1s',
          pointerEvents: 'none',
          zIndex: 2,
        },
        '& .sparkle-3': {
          position: 'absolute',
          bottom: '30%',
          right: '8%',
          width: '3px',
          height: '3px',
          background: colors.lightCyan,
          borderRadius: '50%',
          boxShadow: `0 0 20px ${colors.lightCyan}, 0 0 40px ${colors.lightCyan}`,
          animation: 'cyanSparkle 2.8s ease-in-out infinite 2s',
          pointerEvents: 'none',
          zIndex: 2,
        },
        '& .sparkle-4': {
          position: 'absolute',
          bottom: '55%',
          right: '15%',
          width: '2px',
          height: '2px',
          background: colors.accentGold,
          borderRadius: '50%',
          boxShadow: `0 0 15px ${colors.accentGold}, 0 0 30px ${colors.accentGold}`,
          animation: 'goldSparkle 3.8s ease-in-out infinite 0.5s',
          pointerEvents: 'none',
          zIndex: 2,
        },
        '& .sparkle-5': {
          position: 'absolute',
          top: '70%',
          right: '12%',
          width: '3px',
          height: '3px',
          background: colors.lightCyanBright,
          borderRadius: '50%',
          boxShadow: `0 0 20px ${colors.lightCyanBright}, 0 0 40px ${colors.lightCyanBright}`,
          animation: 'cyanSparkle 3.2s ease-in-out infinite 1.5s',
          pointerEvents: 'none',
          zIndex: 2,
        },
        '& .glow-border': {
          position: 'absolute',
          top: 0,
          right: 0,
          width: '3px',
          height: '100%',
          background: `
            linear-gradient(180deg,
              transparent 0%,
              rgba(103, 232, 249, 0.3) 15%,
              rgba(201, 162, 39, 0.2) 30%,
              rgba(103, 232, 249, 0.4) 50%,
              rgba(201, 162, 39, 0.2) 70%,
              rgba(103, 232, 249, 0.3) 85%,
              transparent 100%
            )
          `,
          boxShadow: '0 0 40px rgba(103, 232, 249, 0.1)',
          animation: 'menuItemGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 2,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 50% 0%, rgba(103, 232, 249, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 100% 50%, rgba(201, 162, 39, 0.03) 0%, transparent 40%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1px',
          height: '100%',
          background: `linear-gradient(180deg, 
            transparent, 
            rgba(103, 232, 249, 0.15), 
            rgba(201, 162, 39, 0.08), 
            rgba(103, 232, 249, 0.15), 
            transparent
          )`,
          animation: 'glowPulse 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 2,
        },
        '& .glass-shimmer': {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(135deg,
              transparent 0%,
              rgba(103, 232, 249, 0.02) 20%,
              rgba(103, 232, 249, 0.04) 40%,
              rgba(201, 162, 39, 0.02) 50%,
              rgba(103, 232, 249, 0.04) 60%,
              rgba(103, 232, 249, 0.02) 80%,
              transparent 100%
            )
          `,
          backgroundSize: '200% 200%',
          animation: 'glassShimmer 8s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        },
        '& .cyan-glow': {
          position: 'absolute',
          top: '30%',
          left: '20%',
          width: '70%',
          height: '50%',
          background: `
            radial-gradient(
              ellipse at center,
              rgba(103, 232, 249, 0.05) 0%,
              transparent 60%
            )
          `,
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(100px)',
          zIndex: 0,
        },
        '& .gold-glow': {
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '40%',
          height: '30%',
          background: `
            radial-gradient(
              ellipse at center,
              rgba(201, 162, 39, 0.03) 0%,
              transparent 60%
            )
          `,
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(80px)',
          zIndex: 0,
        },
      }}
    >
      <Box className="glitter-overlay" />
      <Box className="shimmer-overlay" />
      <Box className="sparkle-1" />
      <Box className="sparkle-2" />
      <Box className="sparkle-3" />
      <Box className="sparkle-4" />
      <Box className="sparkle-5" />
      <Box className="glow-border" />
      <Box className="glass-shimmer" />
      <Box className="cyan-glow" />
      <Box className="gold-glow" />

      {/* Logo Section */}
      <Box
        sx={{
          p: { xs: 0.6, sm: 0.8 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: `1px solid rgba(103, 232, 249, 0.08)`,
          flexShrink: 0,
          minHeight: { xs: 65, sm: 75 },
          position: 'relative',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          zIndex: 3,
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
              transparent
            )`,
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <img
            src="/logoo.png"
            alt="PAEC Logo"
            style={{
              width: isMobile ? 55 : 70,
              height: isMobile ? 55 : 70,
              objectFit: 'contain',
              backgroundColor: 'transparent',
              filter: 'brightness(1.2) drop-shadow(0 0 40px rgba(103, 232, 249, 0.2)) drop-shadow(0 0 80px rgba(103, 232, 249, 0.1))',
              transition: 'all 0.3s ease',
            }}
            onError={(e) => {
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
              background: `
                radial-gradient(
                  circle at center,
                  rgba(103, 232, 249, 0.05) 0%,
                  rgba(201, 162, 39, 0.02) 30%,
                  transparent 70%
                )
              `,
              animation: 'glowPulse 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>

      {/* ✅ MENU - BALANCED SPACING, NO SCROLL, PROMINENT ON CLICK */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          py: { xs: 0.2, sm: 0.3 },
          px: { xs: 0.2, sm: 0.3 },
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(5px)',
          position: 'relative',
          zIndex: 3,
        }}
      >
        <List 
          sx={{ 
            p: 0, 
            m: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
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
                mb: 0,
                borderRadius: 1.5,
                color: colors.secondaryText,
                py: { xs: 0.35, sm: 0.4 },
                px: { xs: 1, sm: 1.2 },
                minHeight: { xs: 30, sm: 34 },
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                // ✅ Hover effect
                '&:hover': {
                  bgcolor: 'rgba(30, 58, 95, 0.6)',
                  backdropFilter: 'blur(15px)',
                  color: '#FFFFFF',
                  transform: 'translateX(4px) scale(1.02)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  '& .MuiListItemIcon-root': {
                    color: colors.lightCyan,
                    transform: 'scale(1.1)',
                    filter: `drop-shadow(0 0 20px ${colors.lightCyanGlow})`,
                  },
                  '& .MuiTypography-root': {
                    fontWeight: 700,
                  },
                },
                // ✅ Selected state - PROMINENT
                '&.Mui-selected': {
                  color: '#FFFFFF',
                  background: `
                    linear-gradient(135deg, 
                      rgba(30, 58, 95, 0.85) 0%, 
                      rgba(103, 232, 249, 0.15) 25%,
                      rgba(30, 58, 95, 0.75) 50%,
                      rgba(201, 162, 39, 0.08) 75%,
                      rgba(30, 58, 95, 0.85) 100%
                    )
                  `,
                  backgroundSize: '200% 200%',
                  animation: 'gradientShine 3s ease-in-out infinite',
                  backdropFilter: 'blur(25px)',
                  boxShadow: `
                    inset 0 0 60px rgba(103, 232, 249, 0.06),
                    0 4px 25px rgba(0,0,0,0.4),
                    0 0 50px rgba(103, 232, 249, 0.06),
                    inset 0 0 80px rgba(103, 232, 249, 0.03)
                  `,
                  transform: 'scale(1.03)',
                  border: `1.5px solid rgba(103, 232, 249, 0.25)`,
                  borderRadius: 2,
                  // ✅ Glow border on selected
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -1,
                    borderRadius: 2,
                    padding: '1.5px',
                    background: `linear-gradient(135deg, ${colors.lightCyan}, ${colors.accentGold}, ${colors.lightCyan})`,
                    backgroundSize: '300% 300%',
                    animation: 'gradientShine 3s ease-in-out infinite',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                    zIndex: 0,
                  },
                  '& .MuiListItemIcon-root': {
                    color: colors.lightCyan,
                    animation: 'iconFloat 3s ease-in-out infinite',
                    filter: `drop-shadow(0 0 30px ${colors.lightCyanGlow}) drop-shadow(0 0 60px ${colors.lightCyan})`,
                  },
                  '& .MuiTypography-root': {
                    fontWeight: 800,
                    fontSize: { xs: '11px', sm: '12px', md: '13px' },
                    textShadow: `
                      0 0 30px rgba(103, 232, 249, 0.2), 
                      0 0 60px rgba(103, 232, 249, 0.08)
                    `,
                    letterSpacing: '0.5px',
                  },
                  '&:hover': {
                    background: `
                      linear-gradient(135deg, 
                        rgba(30, 58, 95, 0.9) 0%, 
                        rgba(103, 232, 249, 0.2) 25%,
                        rgba(30, 58, 95, 0.8) 50%,
                        rgba(201, 162, 39, 0.1) 75%,
                        rgba(30, 58, 95, 0.9) 100%
                      )
                    `,
                    transform: 'scale(1.05)',
                    boxShadow: `
                      inset 0 0 80px rgba(103, 232, 249, 0.08),
                      0 4px 30px rgba(0,0,0,0.5),
                      0 0 60px rgba(103, 232, 249, 0.08),
                      inset 0 0 100px rgba(103, 232, 249, 0.04)
                    `,
                  },
                },
              }}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon
                sx={{
                  color: window.location.pathname === item.path ? colors.lightCyan : colors.secondaryText,
                  minWidth: { xs: 28, sm: 32 },
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {React.isValidElement(item.icon) ? (
                  React.cloneElement(item.icon, {
                    sx: {
                      fontSize: { xs: 17, sm: 19 },
                      transition: 'all 0.25s ease',
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
                  fontSize: { xs: '10.5px', sm: '11.5px', md: '12.5px' },
                  fontWeight: window.location.pathname === item.path ? 800 : 600,
                  noWrap: true,
                  letterSpacing: window.location.pathname === item.path ? '0.5px' : '0.3px',
                  transition: 'all 0.25s ease',
                }}
                sx={{ 
                  margin: 0, 
                  flex: 1, 
                  minWidth: 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              {window.location.pathname === item.path && (
                <>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: colors.lightCyan,
                      flexShrink: 0,
                      ml: 0.5,
                      boxShadow: `
                        0 0 30px ${colors.lightCyanGlowStrong}, 
                        0 0 60px ${colors.lightCyan},
                        0 0 90px ${colors.lightCyan}
                      `,
                      animation: 'cyanGlowPulse 1.5s ease-in-out infinite',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      right: -2,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: '60%',
                      bgcolor: colors.lightCyan,
                      borderRadius: '0 4px 4px 0',
                      boxShadow: `
                        0 0 30px ${colors.lightCyanGlowStrong},
                        0 0 60px ${colors.lightCyan}
                      `,
                      animation: 'cyanGlowPulse 1.5s ease-in-out infinite',
                      zIndex: 3,
                    }}
                  />
                </>
              )}
            </ListItem>
          ))}
        </List>
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