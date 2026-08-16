// src/pages/Notifications.jsx
// ✅ PAEC THEME - Green & Gold Colors

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
  cardBg: '#FFFFFF',
}

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
      return <LocalShippingIcon sx={{ color: '#00bcd4' }} />;
    default:
      return <InfoIcon sx={{ color: colors.sidebar }} />;
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
      return '#00bcd4';
    default:
      return colors.sidebar;
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
            background: colors.sidebar,
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

  if (isLoading && notifications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: colors.sidebar }} />
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
                bgcolor: colors.accentGold,
                color: 'white',
                fontWeight: 700,
              }
            }}
          >
            <NotificationsIcon sx={{ fontSize: 32, color: colors.sidebar }} />
          </Badge>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.sidebar }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: colors.lightText }}>
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
                bgcolor: soundEnabled ? `${colors.sidebar}14` : 'transparent',
                color: soundEnabled ? colors.sidebar : colors.lightText,
                border: `1px solid ${soundEnabled ? colors.sidebar : colors.borderColor}`,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: soundEnabled ? `${colors.sidebar}22` : 'rgba(0,0,0,0.04)',
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
                borderColor: colors.sidebar,
                color: colors.sidebar,
                '&:hover': {
                  borderColor: colors.accentGold,
                  color: colors.accentGold,
                  bgcolor: `${colors.accentGold}14`
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
                bgcolor: colors.sidebar,
                '&:hover': {
                  bgcolor: colors.sidebarHover,
                },
                boxShadow: `0 4px 16px ${colors.sidebar}44`
              }}
            >
              Mark All Read
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs - THEMED */}
      <Paper sx={{ 
        mb: 3, 
        borderRadius: 2,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
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
            },
            '& .Mui-selected': {
              color: colors.sidebar,
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.accentGold,
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
                    bgcolor: colors.sidebar, 
                    color: 'white',
                    height: 20,
                    fontWeight: 600,
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
                    color: 'white',
                    height: 20,
                    fontWeight: 600,
                    '& .MuiChip-label': { px: 1, fontSize: '11px' }
                  }} 
                />
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Notifications List - THEMED */}
      <Paper sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
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
            <NotificationsOffIcon sx={{ fontSize: 48, color: colors.lightText, mb: 2 }} />
            <Typography variant="h6" sx={{ color: colors.lightText }}>
              No notifications
            </Typography>
            <Typography variant="body2" sx={{ color: colors.lightText }}>
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
                    bgcolor: notification.is_read ? 'transparent' : `${colors.sidebar}08`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: notification.is_read ? 'rgba(0, 0, 0, 0.02)' : `${colors.sidebar}14`,
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
                      color: getNotificationColor(notification.type),
                      boxShadow: `0 2px 8px ${getNotificationColor(notification.type)}33`
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: notification.is_read ? 400 : 600,
                          color: colors.darkText
                        }}>
                          {notification.title}
                        </Typography>
                        {!notification.is_read && (
                          <Chip 
                            label="New" 
                            size="small" 
                            sx={{ 
                              bgcolor: colors.accentGold, 
                              color: 'white',
                              height: 20,
                              fontWeight: 600,
                              '& .MuiChip-label': { fontSize: '10px', px: 1 }
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ color: colors.lightText, mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Typography variant="caption" sx={{ color: colors.lightText }}>
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
                            color: colors.sidebar,
                            '&:hover': { 
                              color: colors.accentGold,
                              bgcolor: `${colors.accentGold}14`
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
                            color: colors.sidebar,
                            bgcolor: `${colors.sidebar}14`
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

      {/* Menu - THEMED */}
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
          }
        }}
      >
        {selectedNotification && !selectedNotification.is_read && (
          <MenuItem 
            onClick={() => {
              handleMarkAsRead(selectedNotification.id);
              handleMenuClose();
            }}
            sx={{ '&:hover': { bgcolor: `${colors.sidebar}14` } }}
          >
            <CheckCircleIcon sx={{ mr: 1, fontSize: 20, color: colors.sidebar }} />
            Mark as read
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => handleDeleteClick(selectedNotification)}
          sx={{ '&:hover': { bgcolor: `${colors.error}14` } }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20, color: colors.error }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog - THEMED */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
          }
        }}
      >
        <DialogTitle sx={{ color: colors.error }}>
          <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Delete Notification
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: colors.darkText }}>
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
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.darkText }}>
                {notificationToDelete.title}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                {notificationToDelete.message}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 1 }}>
                {formatTime(notificationToDelete.created_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: colors.lightText }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(notificationToDelete?.id)} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ boxShadow: `0 4px 16px ${colors.error}44` }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar - THEMED */}
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
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Notifications;