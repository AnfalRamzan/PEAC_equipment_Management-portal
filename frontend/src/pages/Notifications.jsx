import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Badge
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Error,
  Build,
  CalendarToday,
  CheckCircle,
  DoneAll,
  Delete,
  Info,
  Warning
} from '@mui/icons-material'
import { notificationService } from '../api/services'
import { toast } from 'react-toastify'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationService.getAll()
      setNotifications(response.data.notifications || [])
    } catch (error) {
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      fetchNotifications()
      toast.success('Notification marked as read')
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      fetchNotifications()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notification?')) {
      try {
        await notificationService.delete(id)
        fetchNotifications()
        toast.success('Notification deleted')
      } catch (error) {
        toast.error('Failed to delete notification')
      }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Error':
        return <Error color="error" />
      case 'Repair':
        return <Build color="primary" />
      case 'Maintenance':
        return <CalendarToday color="warning" />
      case 'System':
        return <Info color="info" />
      default:
        return <NotificationsIcon color="action" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'Error':
        return 'error'
      case 'Repair':
        return 'primary'
      case 'Maintenance':
        return 'warning'
      case 'System':
        return 'info'
      default:
        return 'default'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const filteredNotifications = tabValue === 0 
    ? notifications 
    : notifications.filter(n => n.is_read)

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Notifications
        </Typography>
        <Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              startIcon={<DoneAll />}
              onClick={handleMarkAllAsRead}
              sx={{ mr: 1 }}
            >
              Mark All Read
            </Button>
          )}
          <Badge badgeContent={unreadCount} color="secondary" sx={{ mr: 2 }}>
            <NotificationsIcon sx={{ color: '#0B5FA5' }} />
          </Badge>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            pt: 1
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                All
                <Chip label={notifications.length} size="small" />
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Unread
                <Chip label={unreadCount} size="small" color="primary" />
              </Box>
            }
          />
          <Tab label="Read" />
        </Tabs>

        {filteredNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 64, color: '#6c757d' }} />
            <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
              No notifications
            </Typography>
            <Typography variant="body2" color="textSecondary">
              When you receive notifications, they will appear here
          </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.is_read ? 'transparent' : '#f0f7ff',
                    '&:hover': { bgcolor: '#e8f0fe' },
                    py: 2,
                    px: 3,
                    cursor: 'pointer'
                  }}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" fontWeight={notification.is_read ? 400 : 600}>
                          {notification.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={notification.type}
                            color={getNotificationColor(notification.type)}
                            size="small"
                          />
                          {!notification.is_read && (
                            <Chip
                              label="New"
                              size="small"
                              color="error"
                              sx={{ animation: 'pulse 2s infinite' }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Add CSS animation for pulse */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  )
}

export default Notifications