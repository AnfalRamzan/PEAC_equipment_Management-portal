// src/pages/Notifications.jsx
// ✅ SUPER_ADMIN and ENGINEER can access
// ❌ HOSPITAL_ADMIN - Access Denied

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
      return <ErrorIcon sx={{ color: '#f44336' }} />;
    case 'repair':
      return <BuildIcon sx={{ color: '#ff9800' }} />;
    case 'maintenance':
      return <BuildIcon sx={{ color: '#2196f3' }} />;
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase':
      return <ShoppingCartIcon sx={{ color: '#4caf50' }} />;
    case 'procurement':
      return <LocalShippingIcon sx={{ color: '#9c27b0' }} />;
    case 'warning':
      return <WarningIcon sx={{ color: '#ff9800' }} />;
    case 'amc':
      return <LocalShippingIcon sx={{ color: '#00bcd4' }} />;
    default:
      return <InfoIcon sx={{ color: '#0B5FA5' }} />;
  }
};

// ============================================================
// ✅ GET COLOR BASED ON NOTIFICATION TYPE
// ============================================================
const getNotificationColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'error':
      return '#f44336';
    case 'repair':
      return '#ff9800';
    case 'maintenance':
      return '#2196f3';
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase':
      return '#4caf50';
    case 'procurement':
      return '#9c27b0';
    case 'warning':
      return '#ff9800';
    case 'amc':
      return '#00bcd4';
    default:
      return '#0B5FA5';
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
  
  // ✅ HOSPITAL_ADMIN - Access Denied
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
  
  // Reference to track previous notifications count
  const prevNotificationsRef = useRef([]);

  // ============================================================
  // ✅ LOAD NOTIFICATIONS ON MOUNT
  // ============================================================
  useEffect(() => {
    loadNotifications();
    
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // ✅ PLAY SOUND ON NEW NOTIFICATIONS
  // ============================================================
  useEffect(() => {
    // Only play sound if sound is enabled and there are notifications
    if (!soundEnabled || notifications.length === 0) return;
    
    // Check if there are new notifications
    const prevIds = prevNotificationsRef.current.map(n => n.id);
    const currentIds = notifications.map(n => n.id);
    
    // Find new notifications (not in previous list)
    const newNotifications = notifications.filter(n => !prevIds.includes(n.id));
    
    if (newNotifications.length > 0) {
      // Check if any new notification is recent (within last 10 seconds)
      const now = new Date();
      const hasRecent = newNotifications.some(n => {
        const notifTime = new Date(n.created_at);
        const diffSeconds = (now - notifTime) / 1000;
        return diffSeconds < 10;
      });
      
      if (hasRecent) {
        console.log('🔔 New notification detected! Playing sound...');
        playNotificationSound();
        
        // Show toast for new notification
        const latest = newNotifications[0];
        toast.info(`🔔 ${latest.title}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
    
    // Update previous notifications reference
    prevNotificationsRef.current = notifications;
  }, [notifications, soundEnabled]);

  // ============================================================
  // ✅ LOAD NOTIFICATIONS FUNCTION
  // ============================================================
  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications()).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // ============================================================
  // ✅ HANDLE TAB CHANGE
  // ============================================================
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // ============================================================
  // ✅ HANDLE MARK AS READ
  // ============================================================
  const handleMarkAsRead = async (id) => {
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
  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      showSnackbar('All notifications marked as read', 'success');
    } catch (error) {
      showSnackbar('Failed to mark all as read', 'error');
    }
  };

  // ============================================================
  // ✅ HANDLE DELETE
  // ============================================================
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

  // ============================================================
  // ✅ HANDLE MENU OPEN/CLOSE
  // ============================================================
  const handleMenuOpen = (event, notification) => {
    setMenuAnchor(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNotification(null);
  };

  // ============================================================
  // ✅ HANDLE DELETE CLICK
  // ============================================================
  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // ============================================================
  // ✅ SHOW SNACKBAR
  // ============================================================
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ============================================================
  // ✅ GET FILTERED NOTIFICATIONS
  // ============================================================
  const getFilteredNotifications = () => {
    if (tabValue === 0) {
      return notifications;
    } else if (tabValue === 1) {
      return notifications.filter(n => n.is_read === 0);
    }
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  // ============================================================
  // ✅ RENDER LOADING STATE
  // ============================================================
  if (isLoading && notifications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ============================================================
  // ✅ RENDER ERROR STATE
  // ============================================================
  if (error && notifications.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
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

  // ============================================================
  // ✅ MAIN RENDER
  // ============================================================
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge 
            badgeContent={unreadCount} 
            color="secondary"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#C9A227',
                color: 'white',
              }
            }}
          >
            <NotificationsIcon sx={{ fontSize: 32, color: '#0B5FA5' }} />
          </Badge>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#0B5FA5' }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Sound Toggle */}
          <Tooltip title={soundEnabled ? 'Sound On' : 'Sound Off'}>
            <IconButton
              onClick={() => setSoundEnabled(!soundEnabled)}
              sx={{ 
                bgcolor: soundEnabled ? 'rgba(11, 95, 165, 0.08)' : 'transparent',
                color: soundEnabled ? '#0B5FA5' : '#999',
                border: '1px solid',
                borderColor: soundEnabled ? '#0B5FA5' : '#ddd',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: soundEnabled ? 'rgba(11, 95, 165, 0.15)' : 'rgba(0,0,0,0.04)',
                }
              }}
            >
              {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>
          
          {/* Refresh Button */}
          <Tooltip title="Refresh">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadNotifications}
              size="small"
              sx={{ 
                borderColor: '#0B5FA5',
                color: '#0B5FA5',
                '&:hover': {
                  borderColor: '#0B5FA5',
                  bgcolor: 'rgba(11, 95, 165, 0.08)'
                }
              }}
            >
              Refresh
            </Button>
          </Tooltip>
          
          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <Button
              variant="contained"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
              sx={{
                bgcolor: '#0B5FA5',
                '&:hover': {
                  bgcolor: '#094a80'
                }
              }}
            >
              Mark All Read
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
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
            },
            '& .Mui-selected': {
              color: '#0B5FA5',
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#0B5FA5',
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
                    bgcolor: '#0B5FA5', 
                    color: 'white',
                    height: 20,
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
                    bgcolor: '#C9A227', 
                    color: 'white',
                    height: 20,
                    '& .MuiChip-label': { px: 1, fontSize: '11px' }
                  }} 
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Notifications List */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {filteredNotifications.length === 0 ? (
          <Box sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200
          }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
                    bgcolor: notification.is_read ? 'transparent' : 'rgba(11, 95, 165, 0.04)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: notification.is_read ? 'rgba(0, 0, 0, 0.02)' : 'rgba(11, 95, 165, 0.08)',
                    },
                    cursor: 'pointer',
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
                      color: getNotificationColor(notification.type)
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: notification.is_read ? 400 : 600 }}>
                          {notification.title}
                        </Typography>
                        {!notification.is_read && (
                          <Chip 
                            label="New" 
                            size="small" 
                            sx={{ 
                              bgcolor: '#C9A227', 
                              color: 'white',
                              height: 20,
                              '& .MuiChip-label': { fontSize: '10px', px: 1 }
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
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
                          sx={{ color: '#0B5FA5' }}
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
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
                
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Menu */}
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
      >
        {selectedNotification && !selectedNotification.is_read && (
          <MenuItem onClick={() => {
            handleMarkAsRead(selectedNotification.id);
            handleMenuClose();
          }}>
            <CheckCircleIcon sx={{ mr: 1, fontSize: 20, color: '#0B5FA5' }} />
            Mark as read
          </MenuItem>
        )}
        <MenuItem onClick={() => handleDeleteClick(selectedNotification)}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20, color: '#f44336' }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#f44336' }}>
          <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Delete Notification
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this notification? This action cannot be undone.
          </DialogContentText>
          {notificationToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {notificationToDelete.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notificationToDelete.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {formatTime(notificationToDelete.created_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleDelete(notificationToDelete?.id)} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Notifications;
