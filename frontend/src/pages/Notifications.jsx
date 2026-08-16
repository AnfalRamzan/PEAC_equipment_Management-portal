// src/pages/Notifications.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Equipment page
// ✅ UPDATED: Stats cards design matches Equipment page
// ✅ UPDATED: Header with Refresh, Mark All Read buttons
// ✅ ADDED: Animations

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Fade,
  Grow,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
  Build as BuildIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  NotificationsOff as NotificationsOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  MedicalServices,
  Engineering,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  fetchUnreadCount 
} from '../redux/slices/notificationSlice';
import { toast } from 'react-toastify';
import AccessDenied from '../components/Auth/AccessDenied';

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS - Matching Equipment page
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
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  darkText: '#0F172A',
  lightText: '#64748B',
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  mainBg: '#F1F5F9',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
}

// ✅ Animation Styles - Same as Equipment page
const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes prominentGlow {
  0% {
    box-shadow: 0 0 20px rgba(103, 232, 249, 0.2), 0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(103, 232, 249, 0.4), 0 0 80px rgba(103, 232, 249, 0.2);
    border-color: rgba(103, 232, 249, 0.6);
  }
  100% {
    box-shadow: 0 0 20px rgba(103, 232, 249, 0.2), 0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
}

@keyframes gradientShine {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`

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
// ✅ GET ICON BASED ON NOTIFICATION TYPE
// ============================================================
const getNotificationIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'error':
      return <ErrorIcon sx={{ color: colors.error }} />;
    case 'repair':
      return <BuildIcon sx={{ color: colors.warning }} />;
    case 'maintenance':
      return <BuildIcon sx={{ color: colors.info }} />;
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase':
      return <ShoppingCartIcon sx={{ color: colors.success }} />;
    case 'procurement':
      return <LocalShippingIcon sx={{ color: '#9c27b0' }} />;
    case 'warning':
      return <WarningIcon sx={{ color: colors.warning }} />;
    case 'amc':
      return <LocalShippingIcon sx={{ color: colors.lightCyanDark }} />;
    default:
      return <InfoIcon sx={{ color: colors.darkNavy }} />;
  }
};

// ============================================================
// ✅ GET COLOR BASED ON NOTIFICATION TYPE
// ============================================================
const getNotificationColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'error':
      return colors.error;
    case 'repair':
      return colors.warning;
    case 'maintenance':
      return colors.info;
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase':
      return colors.success;
    case 'procurement':
      return '#9c27b0';
    case 'warning':
      return colors.warning;
    case 'amc':
      return colors.lightCyanDark;
    default:
      return colors.darkNavy;
  }
};

// ============================================================
// ✅ FORMAT TIME
// ============================================================
const formatTime = (dateString) => {
  if (!dateString) return 'Just now';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Notifications." />;
  }
  
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading, error } = useSelector(
    (state) => state.notifications
  );
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const prevNotificationsRef = useRef([]);

  useEffect(() => {
    loadNotifications();
    
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!soundEnabled || notifications.length === 0) return;
    
    const prevIds = prevNotificationsRef.current.map(n => n.id);
    const currentIds = notifications.map(n => n.id);
    
    const newNotifications = notifications.filter(n => !prevIds.includes(n.id));
    
    if (newNotifications.length > 0) {
      const now = new Date();
      const hasRecent = newNotifications.some(n => {
        const notifTime = new Date(n.created_at);
        const diffSeconds = (now - notifTime) / 1000;
        return diffSeconds < 10;
      });
      
      if (hasRecent) {
        console.log('🔔 New notification detected! Playing sound...');
        playNotificationSound();
        
        const latest = newNotifications[0];
        toast.info(`🔔 ${latest.title}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: colors.darkNavy,
            color: colors.text,
          },
        });
      }
    }
    
    prevNotificationsRef.current = notifications;
  }, [notifications, soundEnabled]);

  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications()).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await dispatch(markAsRead(id)).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      showSnackbar('Notification marked as read', 'success');
    } catch (error) {
      showSnackbar('Failed to mark as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      showSnackbar('All notifications marked as read', 'success');
    } catch (error) {
      showSnackbar('Failed to mark all as read', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteNotification(id)).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      showSnackbar('Notification deleted', 'success');
      setDeleteDialogOpen(false);
    } catch (error) {
      showSnackbar('Failed to delete notification', 'error');
    }
  };

  const handleMenuOpen = (event, notification) => {
    setMenuAnchor(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNotification(null);
  };

  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getFilteredNotifications = () => {
    if (tabValue === 0) {
      return notifications;
    } else if (tabValue === 1) {
      return notifications.filter(n => n.is_read === 0);
    }
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  // ✅ Stats Cards Data - Same design as Equipment page
  const statsCards = [
    {
      title: 'Total Notifications',
      value: notifications.length,
      icon: <NotificationsIcon />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Unread',
      value: unreadCount,
      icon: <NotificationsIcon />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Read',
      value: notifications.length - unreadCount,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
  ];

  if (isLoading && notifications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: colors.darkNavy }} />
      </Box>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          sx={{ borderRadius: 2, border: `1px solid ${colors.error}33` }}
          action={
            <Button color="inherit" size="small" onClick={loadNotifications}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
      borderRadius: 0,
      position: 'relative',
    }}>
      <style>{animationStyles}</style>

      {/* ============================================================
          HEADER - Same as Equipment page
          ============================================================ */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        flexWrap: 'wrap', 
        gap: 2,
        animation: 'fadeInUp 0.6s ease-out',
      }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: colors.darkNavy,
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
              '&::after': {
                content: '""',
                display: 'block',
                width: '40px',
                height: '3px',
                background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.darkNavy})`,
                borderRadius: '2px',
                marginTop: '4px',
              }
            }}
          >
            Notifications
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Sound Toggle */}
          <Tooltip title={soundEnabled ? 'Sound On' : 'Sound Off'}>
            <IconButton
              onClick={() => setSoundEnabled(!soundEnabled)}
              sx={{ 
                border: `1px solid ${soundEnabled ? colors.lightCyan : colors.borderColor}`,
                color: soundEnabled ? colors.lightCyan : colors.lightText,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: soundEnabled ? colors.lightCyan : 'rgba(0,0,0,0.04)',
                  color: soundEnabled ? colors.darkNavy : colors.darkNavy,
                  borderColor: colors.lightCyan,
                }
              }}
            >
              {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>
          
          {/* ✅ REFRESH BUTTON - BORDER STYLE */}
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={loadNotifications} 
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              textTransform: 'none',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                transform: 'translateY(-2px)',
              },
              '&:active': {
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                transform: 'scale(0.96)',
              }
            }}
          >
            Refresh
          </Button>
          
          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <Button
              variant="contained"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Mark All Read
            </Button>
          )}
        </Box>
      </Box>

      {/* ============================================================
          STATS CARDS - Same design as Equipment page
          ============================================================ */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={4} key={index}>
            <Grow in timeout={300 + index * 100}>
              <Card sx={{ 
                borderRadius: 3,
                border: `1px solid ${colors.borderColor}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
                  borderColor: colors.lightCyan,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold})`,
                  borderRadius: '3px 3px 0 0',
                }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: colors.lightText,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontSize: '0.6rem',
                        }}
                      >
                        {card.title}
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700,
                          color: colors.darkNavy,
                          fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
                          mt: 0.5,
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        background: card.bg,
                        borderRadius: '14px',
                        p: 1.2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 42,
                        height: 42,
                        color: card.color,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {React.cloneElement(card.icon, { 
                        sx: { 
                          fontSize: 22,
                          color: card.color,
                        } 
                      })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* ============================================================
          TABS
          ============================================================ */}
      <Paper sx={{ 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.7s ease-out',
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              minHeight: 48,
              color: colors.lightText,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            },
            '& .Mui-selected': {
              color: colors.darkNavy,
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.lightCyan,
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                All
                <Chip 
                  label={notifications.length} 
                  size="small" 
                  sx={{ 
                    bgcolor: colors.darkNavy,
                    color: colors.text,
                    height: 22,
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: 2,
                    '& .MuiChip-label': { px: 1, fontSize: '11px' }
                  }} 
                />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Unread
                <Chip 
                  label={unreadCount} 
                  size="small" 
                  sx={{ 
                    bgcolor: colors.accentGold,
                    color: colors.text,
                    height: 22,
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: 2,
                    '& .MuiChip-label': { px: 1, fontSize: '11px' }
                  }} 
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* ============================================================
          NOTIFICATIONS LIST
          ============================================================ */}
      <Paper sx={{ 
        borderRadius: 3, 
        overflow: 'hidden',
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.8s ease-out',
      }}>
        {filteredNotifications.length === 0 ? (
          <Box sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200
          }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: colors.lightText, opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              No notifications
            </Typography>
            <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              {tabValue === 0 ? 'You have no notifications' : 'All notifications are read'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    px: 3,
                    py: 2,
                    bgcolor: notification.is_read ? 'transparent' : `${colors.darkNavy}06`,
                    transition: 'all 0.2s ease',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                    '&:hover': {
                      bgcolor: notification.is_read ? 'rgba(0, 0, 0, 0.02)' : `${colors.darkNavy}12`,
                    },
                    cursor: 'pointer',
                    '&:last-child': { borderBottom: 0 }
                  }}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: `${getNotificationColor(notification.type)}20`,
                      color: getNotificationColor(notification.type),
                      boxShadow: `0 2px 8px ${getNotificationColor(notification.type)}33`,
                      border: `2px solid ${getNotificationColor(notification.type)}30`,
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: notification.is_read ? 500 : 700,
                          color: colors.darkNavy,
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                        }}>
                          {notification.title}
                        </Typography>
                        {!notification.is_read && (
                          <Chip 
                            label="New" 
                            size="small" 
                            sx={{ 
                              bgcolor: colors.lightCyan,
                              color: colors.darkNavy,
                              height: 20,
                              fontWeight: 600,
                              borderRadius: 2,
                              '& .MuiChip-label': { fontSize: '10px', px: 1 }
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ color: colors.lightText, mt: 0.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                            {formatTime(notification.created_at)}
                          </Typography>
                          {notification.type && (
                            <Chip 
                              label={notification.type} 
                              size="small"
                              sx={{ 
                                height: 20,
                                fontSize: '10px',
                                bgcolor: `${getNotificationColor(notification.type)}20`,
                                color: getNotificationColor(notification.type),
                                fontWeight: 500,
                                borderRadius: 2,
                                '& .MuiChip-label': { fontSize: '10px', px: 1 }
                              }}
                            />
                          )}
                        </Box>
                      </>
                    }
                  />
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!notification.is_read && (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          sx={{ 
                            color: colors.darkNavy,
                            '&:hover': { 
                              color: colors.lightCyanDark,
                              bgcolor: 'rgba(103, 232, 249, 0.08)'
                            }
                          }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="More">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, notification);
                        }}
                        sx={{ 
                          color: colors.lightText,
                          '&:hover': { 
                            color: colors.darkNavy,
                            bgcolor: 'rgba(103, 232, 249, 0.08)'
                          }
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
                
                {index < filteredNotifications.length - 1 && <Divider sx={{ borderColor: colors.borderColor }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* ============================================================
          MENU
          ============================================================ */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 3,
          }
        }}
      >
        {selectedNotification && !selectedNotification.is_read && (
          <MenuItem 
            onClick={() => {
              handleMarkAsRead(selectedNotification.id);
              handleMenuClose();
            }}
            sx={{ 
              '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.08)' },
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            }}
          >
            <CheckCircleIcon sx={{ mr: 1, fontSize: 20, color: colors.darkNavy }} />
            Mark as read
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => handleDeleteClick(selectedNotification)}
          sx={{ 
            '&:hover': { bgcolor: `${colors.error}14` },
            fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
          }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20, color: colors.error }} />
          Delete
        </MenuItem>
      </Menu>

      {/* ============================================================
          DELETE CONFIRMATION DIALOG
          ============================================================ */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: colors.error,
          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
          fontWeight: 600,
        }}>
          <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Delete Notification
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: colors.darkText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
            Are you sure you want to delete this notification? This action cannot be undone.
          </DialogContentText>
          {notificationToDelete && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: colors.mainBg, 
              borderRadius: 2,
              border: `1px solid ${colors.borderColor}`
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {notificationToDelete.title}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {notificationToDelete.message}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {formatTime(notificationToDelete.created_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ 
              color: colors.darkNavy,
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(notificationToDelete?.id)} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          SNACKBAR
          ============================================================ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { color: 'white' },
            '& .MuiAlert-message': {
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Notifications;