import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
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
  TextField,
  InputAdornment,
  Tooltip,
  Chip
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  LocalHospital,
  MedicalServices,
  ErrorOutline,
  Build,
  Settings,
  AccountCircle,
  Notifications,
  Search,
  Logout,
  Description,
  School,
  CalendarToday,
  ShoppingCart,
  LocalShipping,
  Assessment,
  PersonAdd,
  ExitToApp
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { logout } from '../../redux/slices/authSlice'
import { fetchNotifications } from '../../redux/slices/notificationSlice'
import NotificationsDropdown from '../Notifications/NotificationsDropdown'

const drawerWidth = 260

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Hospitals', icon: <LocalHospital />, path: '/hospitals' },
  { text: 'Equipment', icon: <MedicalServices />, path: '/equipment' },
  { text: 'Error Logs', icon: <ErrorOutline />, path: '/errors' },
  { text: 'Repairs', icon: <Build />, path: '/repairs' },
  { text: 'Spare Parts', icon: <Settings />, path: '/spare-parts' },
  { text: 'Service Documentation', icon: <Description />, path: '/service-documentation' },
  { text: 'Knowledge Base', icon: <School />, path: '/knowledge-base' },
  { text: 'Annual Maintenance Contracts', icon: <CalendarToday />, path: '/amc' },
  { text: 'Purchase Orders', icon: <ShoppingCart />, path: '/purchase-orders' },
  { text: 'Equipment Procurement', icon: <LocalShipping />, path: '/procurement' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' }
]

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const theme = useTheme()
  
  const { user } = useSelector((state) => state.auth)
  const { unreadCount } = useSelector((state) => state.notifications)

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0B5FA5' }}>
      <Toolbar sx={{ bgcolor: '#0B5FA5', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
          PAEC Portal
        </Typography>
      </Toolbar>
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                },
                '&.Mui-selected': {
                  bgcolor: '#C9A227',
                  '&:hover': {
                    bgcolor: '#C9A227'
                  }
                }
              }}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '14px',
                  fontWeight: 500
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          © 2026 PAEC Equipment Management
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #e9ecef'
        }}
      >
        <Toolbar>
          <IconButton
            color="primary"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ color: '#0B5FA5', fontWeight: 700, flexGrow: 0, mr: 3 }}>
            Equipment Management
          </Typography>

          <TextField
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flexGrow: 1,
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8f9fa',
                '& fieldset': {
                  borderColor: '#e9ecef'
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#6c757d' }} />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton 
                color="primary" 
                onClick={handleNotificationOpen}
                sx={{ position: 'relative' }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="secondary"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#C9A227',
                      color: 'white'
                    }
                  }}
                >
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#0B5FA5',
                  width: 36,
                  height: 36,
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleMenuClose() }}>
                <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { navigate('/users'); handleMenuClose() }}>
                <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>
                Users
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><ExitToApp fontSize="small" /></ListItemIcon>
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

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth
            }
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
              width: drawerWidth,
              border: 'none',
              bgcolor: '#0B5FA5'
            }
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: '#F5F7FA'
        }}
      >
        <Outlet />
        
        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 4,
            pt: 2,
            borderTop: '1px solid #e9ecef',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '14px'
          }}
        >
          <Typography variant="body2">
            © 2026 PAEC Equipment Management Portal. All Rights Reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout