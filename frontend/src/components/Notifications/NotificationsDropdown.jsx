import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
  Badge,
  Tooltip,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Build as BuildIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead,
  fetchUnreadCount 
} from '../../redux/slices/notificationSlice';
import { toast } from 'react-toastify';

// ============================================================
// ✅ SOUND EFFECT FUNCTION
// ============================================================
const playNotificationSound = () => {
  try {
    // Try to play audio file first
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Fallback: Use Web Audio API beep
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
      } catch (e) {
        console.log('🔊 Sound not available');
      }
    });
  } catch(e) {
    console.log('🔊 Sound not available');
  }
};

// ============================================================
// ✅ GET NOTIFICATION ICON
// ============================================================
const getNotificationIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'error': 
      return <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />;
    case 'repair': 
      return <BuildIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
    case 'maintenance': 
      return <BuildIcon sx={{ color: '#2196f3', fontSize: 20 }} />;
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase': 
      return <ShoppingCartIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
    case 'procurement': 
      return <LocalShippingIcon sx={{ color: '#9c27b0', fontSize: 20 }} />;
    case 'warning': 
      return <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
    case 'amc':
      return <LocalShippingIcon sx={{ color: '#00bcd4', fontSize: 20 }} />;
    default: 
      return <InfoIcon sx={{ color: '#0B5FA5', fontSize: 20 }} />;
  }
};

// ============================================================
// ✅ GET NOTIFICATION COLOR
// ============================================================
const getNotificationColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'error': return '#f44336';
    case 'repair': return '#ff9800';
    case 'maintenance': return '#2196f3';
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase': return '#4caf50';
    case 'procurement': return '#9c27b0';
    case 'warning': return '#ff9800';
    case 'amc': return '#00bcd4';
    default: return '#0B5FA5';
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const NotificationsDropdown = ({ open, anchorEl, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading } = useSelector(
    (state) => state.notifications
  );
  const dropdownRef = useRef();
  const prevNotificationsRef = useRef([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ============================================================
  // ✅ HANDLE CLICK OUTSIDE TO CLOSE
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If dropdown is open and click is outside the dropdown
      if (open && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Check if click is on the notification icon
        const notificationIcon = document.querySelector('[data-notification-icon]');
        if (notificationIcon && notificationIcon.contains(event.target)) {
          return; // Don't close if clicking the icon
        }
        onClose();
      }
    };

    // ✅ Handle escape key to close
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open, onClose]);

  // ============================================================
  // ✅ FETCH NOTIFICATIONS WHEN OPENED
  // ============================================================
  useEffect(() => {
    if (open) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }
  }, [open, dispatch]);

  // ============================================================
  // ✅ PLAY SOUND ON NEW NOTIFICATIONS
  // ============================================================
  useEffect(() => {
    if (!open || !soundEnabled || notifications.length === 0) return;

    // Check for new notifications
    const prevIds = prevNotificationsRef.current.map(n => n.id);
    const newNotifications = notifications.filter(n => !prevIds.includes(n.id));

    if (newNotifications.length > 0) {
      const now = new Date();
      const hasRecent = newNotifications.some(n => {
        const notifTime = new Date(n.created_at);
        const diffSeconds = (now - notifTime) / 1000;
        return diffSeconds < 10 && !n.is_read;
      });

      if (hasRecent) {
        console.log('🔔 New notification in dropdown! Playing sound...');
        playNotificationSound();
      }
    }

    // Update previous notifications reference
    prevNotificationsRef.current = notifications;
  }, [open, notifications, soundEnabled]);

  // ============================================================
  // ✅ HANDLE MARK AS READ
  // ============================================================
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await dispatch(markAsRead(id)).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      showSnackbar('Notification marked as read', 'success');
    } catch (error) {
      showSnackbar('Failed to mark as read', 'error');
    }
  };

  // ============================================================
  // ✅ HANDLE MARK ALL AS READ
  // ============================================================
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await dispatch(markAllAsRead()).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      showSnackbar('All notifications marked as read', 'success');
      toast.success('All notifications marked as read');
    } catch (error) {
      showSnackbar('Failed to mark all as read', 'error');
    }
  };

  // ============================================================
  // ✅ HANDLE NOTIFICATION CLICK
  // ============================================================
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      dispatch(markAsRead(notification.id));
    }
    
    // Navigate based on notification type
    if (notification.related_module) {
      navigate(`/${notification.related_module}`);
    }
    onClose(); // Close dropdown after clicking
  };

  // ============================================================
  // ✅ HANDLE VIEW ALL
  // ============================================================
  const handleViewAll = () => {
    navigate('/notifications');
    onClose(); // Close dropdown after navigating
  };

  // ============================================================
  // ✅ SHOW SNACKBAR
  // ============================================================
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ============================================================
  // ✅ TOGGLE SOUND
  // ============================================================
  const toggleSound = (e) => {
    e.stopPropagation();
    setSoundEnabled(!soundEnabled);
    showSnackbar(soundEnabled ? 'Sound disabled' : 'Sound enabled', 'info');
  };

  const displayedNotifications = notifications?.slice(0, 5) || [];

  return (
    <>
      <Paper
        ref={dropdownRef}
        sx={{
          position: 'fixed',
          top: { xs: '60px', sm: '68px' },
          right: { xs: '10px', sm: '20px' },
          width: { xs: 'calc(100% - 20px)', sm: 420 },
          maxHeight: 480,
          overflow: 'auto',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: open ? 'block' : 'none',
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#ccc',
            borderRadius: '4px'
          }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e9ecef',
          bgcolor: '#fafafa',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge 
              badgeContent={unreadCount} 
              color="secondary" 
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#C9A227',
                  color: 'white',
                  fontSize: '10px',
                  minWidth: 18,
                  height: 18,
                }
              }}
            >
              <NotificationsIcon sx={{ color: '#0B5FA5' }} />
            </Badge>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Sound Toggle */}
            <Tooltip title={soundEnabled ? 'Sound On' : 'Sound Off'}>
              <IconButton 
                size="small" 
                onClick={toggleSound}
                sx={{ 
                  color: soundEnabled ? '#0B5FA5' : '#999',
                  '&:hover': {
                    bgcolor: soundEnabled ? 'rgba(11,95,165,0.08)' : 'rgba(0,0,0,0.04)',
                  }
                }}
              >
                {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            {/* Mark All Read */}
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton 
                  size="small" 
                  onClick={handleMarkAllAsRead}
                  sx={{ color: '#0B5FA5' }}
                >
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Loading */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && displayedNotifications.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        )}

        {/* Notifications List */}
        <List sx={{ p: 0 }}>
          {displayedNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: notification.is_read ? 'transparent' : 'rgba(11, 95, 165, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: notification.is_read ? 'rgba(0,0,0,0.02)' : 'rgba(11, 95, 165, 0.08)',
                  }
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: `${getNotificationColor(notification.type)}20`,
                    color: getNotificationColor(notification.type),
                    width: 36,
                    height: 36,
                  }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: notification.is_read ? 400 : 600, 
                          flex: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      {!notification.is_read && (
                        <Chip 
                          label="New" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#C9A227', 
                            color: 'white',
                            height: 18,
                            '& .MuiChip-label': { fontSize: '9px', px: 0.5 }
                          }} 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ display: 'block' }}
                      >
                        {notification.message?.length > 60 
                          ? notification.message.substring(0, 60) + '...' 
                          : notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.created_at)}
                        </Typography>
                        {notification.type && (
                          <Chip 
                            label={notification.type} 
                            size="small"
                            sx={{ 
                              height: 16,
                              fontSize: '8px',
                              bgcolor: `${getNotificationColor(notification.type)}20`,
                              color: getNotificationColor(notification.type),
                              '& .MuiChip-label': { px: 0.5 }
                            }}
                          />
                        )}
                      </Box>
                    </>
                  }
                />
                
                {!notification.is_read && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    sx={{ color: '#0B5FA5' }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                )}
              </ListItem>
              {index < displayedNotifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {/* Footer */}
        <Box sx={{ 
          p: 1.5, 
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'center',
          bgcolor: '#fafafa',
          position: 'sticky',
          bottom: 0,
        }}>
          <Button 
            size="small" 
            onClick={handleViewAll}
            sx={{ 
              color: '#0B5FA5',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(11, 95, 165, 0.08)',
              }
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 10000 }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ fontSize: '0.875rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationsDropdown;