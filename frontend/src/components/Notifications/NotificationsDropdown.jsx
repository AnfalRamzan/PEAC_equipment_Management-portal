// src/components/Notifications/NotificationsDropdown.jsx
// ✅ FIXED: Typography nesting issue resolved

import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Tooltip,
  Alert,
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
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  fetchUnreadCount 
} from '../../redux/slices/notificationSlice';
import { toast } from 'react-toastify';

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
};

const getNotificationIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'error': return <ErrorIcon sx={{ color: colors.error }} />;
    case 'repair': return <BuildIcon sx={{ color: colors.warning }} />;
    case 'maintenance': return <BuildIcon sx={{ color: colors.info }} />;
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase': return <ShoppingCartIcon sx={{ color: colors.success }} />;
    case 'procurement': return <LocalShippingIcon sx={{ color: '#9c27b0' }} />;
    case 'warning': return <WarningIcon sx={{ color: colors.warning }} />;
    case 'amc': return <LocalShippingIcon sx={{ color: '#00bcd4' }} />;
    default: return <InfoIcon sx={{ color: colors.sidebar }} />;
  }
};

const getNotificationColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'error': return colors.error;
    case 'repair': return colors.warning;
    case 'maintenance': return colors.info;
    case 'purchaseorder':
    case 'purchase-order':
    case 'purchase': return colors.success;
    case 'procurement': return '#9c27b0';
    case 'warning': return colors.warning;
    case 'amc': return '#00bcd4';
    default: return colors.sidebar;
  }
};

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

const NotificationsDropdown = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notifications);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const open = Boolean(anchorEl);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchNotifications());
    }
  }, [open, dispatch]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await dispatch(markAsRead(id)).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteNotification(id)).unwrap();
      await dispatch(fetchUnreadCount()).unwrap();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 20 && !loadingMore && hasMore) {
      // Load more if needed
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          sx={{
            color: colors.text,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="secondary"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: colors.accentGold,
                color: 'white',
                fontWeight: 700,
                fontSize: '10px',
                minWidth: '18px',
                height: '18px',
                border: `2px solid ${colors.sidebar}`,
              },
            }}
          >
            <NotificationsIcon sx={{ fontSize: 24 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
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
            width: 380,
            maxHeight: 450,
            borderRadius: 2,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            bgcolor: colors.white,
          },
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: `1px solid ${colors.borderColor}`,
          bgcolor: colors.sidebar,
          color: colors.text,
        }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon sx={{ fontSize: 20 }} />
            Notifications
            <Chip 
              label={unreadCount} 
              size="small" 
              sx={{ 
                bgcolor: colors.accentGold, 
                color: 'white',
                height: 20,
                fontSize: '10px',
                fontWeight: 600,
                '& .MuiChip-label': { px: 1 }
              }} 
            />
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
              onClick={handleMarkAllAsRead}
              sx={{ 
                color: colors.text,
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                fontSize: '12px',
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} sx={{ color: colors.sidebar }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            py: 4,
            px: 2,
          }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: colors.lightText, mb: 1 }} />
            <Typography variant="body1" sx={{ color: colors.lightText }}>
              No notifications
            </Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>
              You're all caught up!
            </Typography>
          </Box>
        ) : (
          <List 
            ref={listRef}
            onScroll={handleScroll}
            sx={{ 
              p: 0, 
              overflowY: 'auto',
              maxHeight: 350,
            }}
          >
            {notifications.slice(0, 20).map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: notification.is_read ? 'transparent' : `${colors.sidebar}08`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: notification.is_read ? 'rgba(0,0,0,0.02)' : `${colors.sidebar}14`,
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
                      width: 36,
                      height: 36,
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography 
                          variant="subtitle2" 
                          component="span"
                          sx={{ 
                            fontWeight: notification.is_read ? 400 : 600,
                            color: colors.darkText,
                            fontSize: '13px',
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.is_read && (
                          <Chip 
                            label="New" 
                            size="small" 
                            sx={{ 
                              bgcolor: colors.accentGold, 
                              color: 'white',
                              height: 18,
                              fontSize: '8px',
                              fontWeight: 600,
                              '& .MuiChip-label': { px: 1 }
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          component="span"
                          sx={{ 
                            color: colors.lightText,
                            fontSize: '12px',
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" component="span" sx={{ color: colors.lightText, fontSize: '10px' }}>
                            {formatTime(notification.created_at)}
                          </Typography>
                          {notification.type && (
                            <Chip 
                              label={notification.type} 
                              size="small"
                              sx={{ 
                                height: 16,
                                fontSize: '7px',
                                bgcolor: `${getNotificationColor(notification.type)}20`,
                                color: getNotificationColor(notification.type),
                                fontWeight: 500,
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
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
                            padding: '2px',
                            '&:hover': { 
                              color: colors.accentGold,
                              bgcolor: `${colors.accentGold}14`
                            }
                          }}
                        >
                          <CheckCircleIcon fontSize="small" sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        sx={{ 
                          color: colors.lightText,
                          padding: '2px',
                          '&:hover': { 
                            color: colors.error,
                            bgcolor: `${colors.error}14`
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
                {index < notifications.length - 1 && <Divider sx={{ borderColor: colors.borderColor }} />}
              </React.Fragment>
            ))}
            {notifications.length > 20 && (
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button size="small" sx={{ color: colors.sidebar, textTransform: 'none' }}>
                  View all
                </Button>
              </Box>
            )}
          </List>
        )}
      </Popover>
    </>
  );
};

export default NotificationsDropdown;