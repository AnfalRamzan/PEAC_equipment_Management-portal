import React from 'react'
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Badge,
  IconButton
} from '@mui/material'
import {
  Notifications,
  Error,
  Build,
  CalendarToday,
  CheckCircle,
  Close
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { markAsRead, markAllAsRead } from '../../redux/slices/notificationSlice'

const NotificationsDropdown = ({ open, anchorEl, onClose }) => {
  const dispatch = useDispatch()
  const { items, unreadCount } = useSelector((state) => state.notifications)

  const getIcon = (type) => {
    switch (type) {
      case 'Error':
        return <Error color="error" />
      case 'Repair':
        return <Build color="primary" />
      case 'Maintenance':
        return <CalendarToday color="warning" />
      case 'System':
        return <Notifications color="info" />
      default:
        return <Notifications />
    }
  }

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id))
  }

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead())
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      PaperProps={{
        sx: {
          width: 380,
          maxHeight: 500,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notifications
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="secondary" sx={{ ml: 1 }} />
          )}
        </Typography>
        <Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Divider />
      {items.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Notifications sx={{ fontSize: 48, color: '#6c757d' }} />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            No notifications
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {items.slice(0, 10).map((notification) => (
            <ListItem
              key={notification.id}
              sx={{
                bgcolor: notification.is_read ? 'transparent' : '#f0f7ff',
                '&:hover': { bgcolor: '#e8f0fe' },
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0'
              }}
              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
            >
              <ListItemIcon>
                {getIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={notification.is_read ? 400 : 600}>
                    {notification.title}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(notification.created_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      {items.length > 10 && (
        <>
          <Divider />
          <Box sx={{ p: 1, textAlign: 'center' }}>
            <Button size="small" color="primary">
              View All
            </Button>
          </Box>
        </>
      )}
    </Popover>
  )
}

export default NotificationsDropdown