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
  LocalShipping,
  Assessment,
  Inventory,
  Gavel,
  EmojiObjects,
  School,
  RateReview,
} from '@mui/icons-material';
import { useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateProfileImage, refreshUser } from '../../redux/slices/authSlice';
import { fetchUnreadCount, fetchNotifications } from '../../redux/slices/notificationSlice';
import NotificationsDropdown from '../Notifications/NotificationsDropdown';
import GlobalSearch from '../GlobalSearch';
import NotificationSound from '../NotificationSound';
import { toast } from 'react-toastify';

// ============================================================
// ✅ API URL
// ============================================================
const API_URL = 'http://localhost:5000/api';

// ============================================================
// ✅ DYNAMIC DRAWER WIDTH
// ============================================================
const getDrawerWidth = (isMobile, isTablet, isSmallDesktop) => {
  if (isMobile) return 210;
  if (isTablet) return 200;
  if (isSmallDesktop) return 220;
  return 240;
};

// ============================================================
// ✅ FONT FAMILY
// ============================================================
const FONT_FAMILY = "'Satoshi', 'Segoe UI', 'Roboto', sans-serif";

// ============================================================
// ✅ COLORS
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
// ✅ ANIMATIONS
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
    0% { box-shadow: 0 0 15px rgba(103, 232, 249, 0.2); opacity: 0.6; }
    50% { box-shadow: 0 0 35px rgba(103, 232, 249, 0.5); opacity: 1; }
    100% { box-shadow: 0 0 15px rgba(103, 232, 249, 0.2); opacity: 0.6; }
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
.bell-ring { animation: bellRing 0.6s ease-in-out 3; }
.gradient-shine { animation: gradientShine 3s ease-in-out infinite; }
`;

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [bellRing, setBellRing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isSmallDesktop = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notifications);

  // ============================================================
  // ✅ HELPER: Get full image URL
  // ============================================================
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return `http://localhost:5000${url}`;
    return url;
  };

  const profileImageUrl = user?.profile_image ? getFullImageUrl(user.profile_image) : null;
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
          if (updatedUser) dispatch(refreshUser());
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
  }, [unreadCount]);

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

  const handleUsersClick = () => {
    navigate('/users');
    handleMenuClose();
  };

  const handleNotificationOpen = (event) => setNotificationAnchor(event.currentTarget);
  const handleNotificationClose = () => setNotificationAnchor(null);

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
    { text: 'Training', icon: <School />, path: '/training' },
    { text: 'Preventive Maintenance', icon: <Handyman />, path: '/maintenance' },
    { text: 'Spare Parts', icon: <Inventory />, path: '/spare-parts' },
    { text: 'Documentation', icon: <Description />, path: '/service-documentation' },
    { text: 'AMC Contracts', icon: <Gavel />, path: '/amc' },
    { text: 'Procurement', icon: <LocalShipping />, path: '/procurement' },
  ];

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER';

  const finalMenuItems = isAdmin
    ? [...menuItems, { text: 'Feedback', icon: <RateReview />, path: '/feedback' }]
    : menuItems;

  // ============================================================
  // ✅ DYNAMIC DRAWER WIDTH
  // ============================================================
  const drawerWidth = getDrawerWidth(isMobile, isTablet, isSmallDesktop);

  // ============================================================
  // ✅ RESPONSIVE SIZES
  // ============================================================
  const getResponsiveSizes = () => {
    if (isMobile) {
      return {
        logoSize: 55,
        logoPadding: 0.4,
        logoMinHeight: 55,
        menuPy: 0.05,
        menuPx: 0.05,
        listItemPy: 0.15,
        listItemPx: 0.5,
        listItemMinHeight: 24,
        iconSize: 14,
        textSize: '8.5px',
        listGap: 0.3,
        mx: 0.15,
        borderRadius: 1,
        indicatorSize: 5,
        selectedScale: 1.01,
      };
    }
    if (isTablet) {
      return {
        logoSize: 60,
        logoPadding: 0.4,
        logoMinHeight: 58,
        menuPy: 0.08,
        menuPx: 0.08,
        listItemPy: 0.2,
        listItemPx: 0.6,
        listItemMinHeight: 26,
        iconSize: 15,
        textSize: '9px',
        listGap: 0.4,
        mx: 0.2,
        borderRadius: 1.1,
        indicatorSize: 5,
        selectedScale: 1.01,
      };
    }
    if (isSmallDesktop) {
      return {
        logoSize: 70,
        logoPadding: 0.5,
        logoMinHeight: 65,
        menuPy: 0.1,
        menuPx: 0.1,
        listItemPy: 0.22,
        listItemPx: 0.8,
        listItemMinHeight: 28,
        iconSize: 17,
        textSize: '10px',
        listGap: 0.5,
        mx: 0.25,
        borderRadius: 1.2,
        indicatorSize: 6,
        selectedScale: 1.02,
      };
    }
    return {
      logoSize: 80,
      logoPadding: 0.6,
      logoMinHeight: 72,
      menuPy: 0.12,
      menuPx: 0.12,
      listItemPy: 0.25,
      listItemPx: 1,
      listItemMinHeight: 30,
      iconSize: 18,
      textSize: '10.5px',
      listGap: 0.6,
      mx: 0.3,
      borderRadius: 1.3,
      indicatorSize: 7,
      selectedScale: 1.02,
    };
  };

  const sizes = getResponsiveSizes();

  // ============================================================
  // ✨ DRAWER
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
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: sizes.logoPadding,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: `1px solid rgba(103, 232, 249, 0.08)`,
          flexShrink: 0,
          minHeight: sizes.logoMinHeight,
          position: 'relative',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          zIndex: 3,
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <img
            src="/logoo.png"
            alt="Medical Equipment Portal Logo"
            style={{
              width: sizes.logoSize,
              height: sizes.logoSize,
              objectFit: 'contain',
              backgroundColor: 'transparent',
              filter: 'brightness(1.2) drop-shadow(0 0 40px rgba(103, 232, 249, 0.2)) drop-shadow(0 0 80px rgba(103, 232, 249, 0.1))',
              transition: 'all 0.3s ease',
            }}
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
        </Box>
      </Box>

      {/* Menu */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          py: sizes.menuPy,
          px: sizes.menuPx,
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
            gap: sizes.listGap,
          }}
        >
          {finalMenuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                mx: sizes.mx,
                mb: 0,
                borderRadius: sizes.borderRadius,
                color: colors.secondaryText,
                py: sizes.listItemPy,
                px: sizes.listItemPx,
                minHeight: sizes.listItemMinHeight,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: 'rgba(30, 58, 95, 0.6)',
                  backdropFilter: 'blur(15px)',
                  color: '#FFFFFF',
                  transform: isMobile ? 'translateX(1px) scale(1.01)' : 'translateX(3px) scale(1.01)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                  '& .MuiListItemIcon-root': {
                    color: colors.lightCyan,
                    transform: 'scale(1.05)',
                    filter: `drop-shadow(0 0 15px ${colors.lightCyanGlow})`,
                  },
                  '& .MuiTypography-root': {
                    fontWeight: 600,
                    fontFamily: FONT_FAMILY,
                  },
                },
                '&.Mui-selected': {
                  color: '#FFFFFF',
                  background: `
                    linear-gradient(135deg, 
                      rgba(30, 58, 95, 0.85) 0%, 
                      rgba(103, 232, 249, 0.12) 25%,
                      rgba(30, 58, 95, 0.75) 50%,
                      rgba(201, 162, 39, 0.06) 75%,
                      rgba(30, 58, 95, 0.85) 100%
                    )
                  `,
                  backgroundSize: '200% 200%',
                  animation: 'gradientShine 3s ease-in-out infinite',
                  backdropFilter: 'blur(25px)',
                  boxShadow: `
                    inset 0 0 40px rgba(103, 232, 249, 0.04),
                    0 4px 20px rgba(0,0,0,0.35),
                    0 0 40px rgba(103, 232, 249, 0.04),
                    inset 0 0 60px rgba(103, 232, 249, 0.02)
                  `,
                  transform: `scale(${sizes.selectedScale})`,
                  border: `1.5px solid rgba(103, 232, 249, 0.2)`,
                  borderRadius: sizes.borderRadius,
                  '& .MuiListItemIcon-root': {
                    color: colors.lightCyan,
                    animation: 'iconFloat 3s ease-in-out infinite',
                    filter: `drop-shadow(0 0 25px ${colors.lightCyanGlow}) drop-shadow(0 0 50px ${colors.lightCyan})`,
                  },
                  '& .MuiTypography-root': {
                    fontWeight: 700,
                    fontSize: sizes.textSize,
                    textShadow: `
                      0 0 20px rgba(103, 232, 249, 0.15), 
                      0 0 40px rgba(103, 232, 249, 0.05)
                    `,
                    letterSpacing: '0.5px',
                    fontFamily: FONT_FAMILY,
                  },
                },
              }}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon
                sx={{
                  color: window.location.pathname === item.path ? colors.lightCyan : colors.secondaryText,
                  minWidth: { xs: 20, sm: 22, md: 26 },
                  transition: 'all 0.2s ease',
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
                      fontSize: { xs: 13, sm: 14, md: sizes.iconSize },
                      transition: 'all 0.2s ease',
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
                  fontFamily: FONT_FAMILY,
                  fontSize: { xs: '7.5px', sm: '8.5px', md: sizes.textSize },
                  fontWeight: window.location.pathname === item.path ? 700 : 500,
                  noWrap: true,
                  letterSpacing: window.location.pathname === item.path ? '0.5px' : '0.3px',
                  transition: 'all 0.2s ease',
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
                      width: sizes.indicatorSize,
                      height: sizes.indicatorSize,
                      borderRadius: '50%',
                      bgcolor: colors.lightCyan,
                      flexShrink: 0,
                      ml: 0.3,
                      boxShadow: `
                        0 0 20px ${colors.lightCyanGlowStrong}, 
                        0 0 40px ${colors.lightCyan},
                        0 0 60px ${colors.lightCyan}
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
                      width: 2.5,
                      height: '50%',
                      bgcolor: colors.lightCyan,
                      borderRadius: '0 4px 4px 0',
                      boxShadow: `
                        0 0 20px ${colors.lightCyanGlowStrong},
                        0 0 40px ${colors.lightCyan}
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
                fontFamily: FONT_FAMILY,
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
              MEDICAL EQUIPMENT PORTAL
            </Typography>
          </Box>

          <GlobalSearch />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            {/* ✅ NOTIFICATION ICON - REMOVED */}
            {/* <Tooltip title=...> ... </Tooltip> */}

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
                  fontFamily: FONT_FAMILY,
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
              {isAdmin && (
                <>
                  <MenuItem onClick={handleUsersClick} sx={{
                    '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' },
                    fontFamily: FONT_FAMILY,
                  }}>
                    <ListItemIcon>
                      <PersonAdd sx={{ color: '#0F172A' }} fontSize="small" />
                    </ListItemIcon>
                    Users
                  </MenuItem>
                  <Divider sx={{ borderColor: 'rgba(103, 232, 249, 0.1)' }} />
                </>
              )}

              <MenuItem onClick={handleLogout} sx={{
                color: colors.error,
                '&:hover': { bgcolor: `${colors.error}06` },
                fontFamily: FONT_FAMILY,
              }}>
                <ListItemIcon>
                  <ExitToApp sx={{ color: colors.error }} fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ✅ NOTIFICATION DROPDOWN - REMOVED */}
      {/* <NotificationsDropdown ... /> */}

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 210,
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
              width: drawerWidth,
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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