// src/pages/Dashboard.jsx
// ✅ PAEC THEME - Subtle Background Color Behind Cards

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Skeleton,
  Alert,
  Snackbar,
  Button,
} from '@mui/material'
import {
  MedicalServices,
  ErrorOutline,
  CheckCircle,
  LocalHospital,
  Engineering,
  Build,
  Warning,
  CalendarToday,
  ShoppingCart,
  Inventory,
  Description,
} from '@mui/icons-material'
import { dashboardService } from '../api/services'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

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
  cardBg: '#FFFFFF',
  borderColor: 'rgba(1, 65, 28, 0.08)',
  shadowColor: 'rgba(1, 65, 28, 0.08)',
  // ✅ Dashboard Background Colors
  bgGradientStart: '#E8F5E9',
  bgGradientEnd: '#F5F5F5',
  // ✅ Card Area Background - Subtle color behind cards
  cardAreaBg: 'rgba(1, 65, 28, 0.03)',
  cardAreaBorder: 'rgba(1, 65, 28, 0.05)',
}

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const [stats, setStats] = useState({
    totalEquipment: 0,
    totalHospitals: 0,
    totalEngineers: 0,
    criticalErrors: 0,
    openErrors: 0,
    resolvedErrors: 0,
    pendingRepairs: 0,
    inProgressRepairs: 0,
    maintenanceDue: 0,
    criticalEquipment: 0,
    pendingPurchaseOrders: 0,
    sparePartsLow: 0,
    totalUsers: 0,
    totalReports: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // ✅ FETCH REAL DATA FROM API
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📊 Fetching dashboard stats for user:', user?.id, 'Role:', user?.role)
      
      const response = await dashboardService.getStats()
      
      console.log('📊 Dashboard API Response:', response.data)
      
      if (response.data && response.data.success) {
        setStats({
          totalEquipment: response.data.totalEquipment || 0,
          totalHospitals: response.data.totalHospitals || 0,
          totalEngineers: response.data.totalEngineers || 0,
          criticalErrors: response.data.criticalErrors || 0,
          openErrors: response.data.openErrors || 0,
          resolvedErrors: response.data.resolvedErrors || 0,
          pendingRepairs: response.data.pendingRepairs || 0,
          inProgressRepairs: response.data.inProgressRepairs || 0,
          maintenanceDue: response.data.maintenanceDue || 0,
          criticalEquipment: response.data.criticalEquipment || 0,
          pendingPurchaseOrders: response.data.pendingPurchaseOrders || 0,
          sparePartsLow: response.data.sparePartsLow || 0,
          totalUsers: response.data.totalUsers || 0,
          totalReports: response.data.totalReports || 0,
        })
      } else {
        console.warn('⚠️ API response not successful:', response.data)
      }
      
    } catch (err) {
      console.error('❌ Dashboard error:', err)
      console.error('❌ Error details:', err.response?.data || err.message)
      setError('Failed to load dashboard data')
      setSnackbar({ open: true, message: 'Failed to load dashboard data', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    const interval = setInterval(() => {
      console.log('🔄 Polling dashboard stats...')
      fetchDashboardData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // ============================================================
  // ✅ CARD CLICK HANDLERS
  // ============================================================
  const handleCardClick = (path, filter = '') => {
    navigate(path + filter)
  }

  // ============================================================
  // ✅ ALL CARDS
  // ============================================================
  const getCards = () => {
    return [
      { 
        title: 'Total Hospitals', 
        value: stats.totalHospitals, 
        icon: <LocalHospital />, 
        path: '/hospitals'
      },
      { 
        title: 'Total Engineers', 
        value: stats.totalEngineers, 
        icon: <Engineering />, 
        path: '/users?role=ENGINEER'
      },
      { 
        title: 'Total Equipment', 
        value: stats.totalEquipment, 
        icon: <MedicalServices />, 
        path: '/equipment'
      },
      { 
        title: 'Open Errors', 
        value: stats.openErrors, 
        icon: <ErrorOutline />, 
        path: '/errors?status=Pending,In Progress'
      },
      { 
        title: 'Critical Errors',
        value: stats.criticalErrors || 0, 
        icon: <Warning />, 
        path: '/errors?severity=Critical'
      },
      { 
        title: 'Resolved Errors', 
        value: stats.resolvedErrors, 
        icon: <CheckCircle />, 
        path: '/errors?status=Resolved,Closed'
      },
      { 
        title: 'Repairs In Progress',
        value: stats.inProgressRepairs, 
        icon: <Build />, 
        path: '/repairs?status=In Progress'
      },
      { 
        title: 'Pending Purchase Requests',
        value: stats.pendingPurchaseOrders, 
        icon: <ShoppingCart />, 
        path: '/purchase-orders?status=Pending'
      },
      { 
        title: 'Maintenance Due', 
        value: stats.maintenanceDue, 
        icon: <CalendarToday />, 
        path: '/maintenance?status=Overdue'
      },
      { 
        title: 'Spare Parts Low Stock', 
        value: stats.sparePartsLow, 
        icon: <Inventory />, 
        path: '/spare-parts?stock=low'
      },
      { 
        title: 'Total Reports', 
        value: stats.totalReports, 
        icon: <Description />, 
        path: '/reports'
      }
    ]
  }

  // ============================================================
  // ✅ STAT CARD
  // ============================================================
  const StatCard = ({ title, value, icon, path, index }) => {
    const iconBgGradient = `linear-gradient(135deg, ${colors.sidebar} 0%, ${colors.accentGold} 100%)`
    
    return (
      <Grow in timeout={300 + (index || 0) * 50}>
        <Card 
          sx={{ 
            height: '100%', 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            bgcolor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              transform: isMobile ? 'none' : 'translateY(-8px) scale(1.02)',
              boxShadow: `0 12px 40px ${colors.shadowColor}`,
              borderColor: colors.accentGold,
              '& .card-icon-wrapper': {
                transform: 'scale(1.15) rotate(-8deg)',
                boxShadow: `0 0 40px ${colors.accentGold}44`,
              },
              '& .card-title': {
                color: colors.sidebar,
              },
              '& .card-value': {
                color: colors.sidebar,
              },
              '& .card-decoration': {
                transform: 'scale(1.5)',
                opacity: 0.1,
              },
              '& .gold-dot': {
                opacity: 0.8,
                transform: 'scale(1.3)',
              }
            },
            touchAction: 'manipulation',
          }}
          onClick={() => path && handleCardClick(path)}
        >
          {/* Decorative Top Bar */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, 
            background: `linear-gradient(90deg, ${colors.sidebar}, ${colors.accentGold})`,
          }} />
          
          {/* Decorative Background Pattern */}
          <Box
            className="card-decoration"
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.sidebar}12 0%, transparent 70%)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
            }}
          />
          
          {/* Second Decorative Pattern */}
          <Box
            className="card-decoration"
            sx={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.sidebar}08 0%, transparent 70%)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              transitionDelay: '0.1s',
            }}
          />
          
          <CardContent sx={{ 
            p: { xs: 2, sm: 2.5, md: 3 },
            '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } },
            position: 'relative',
            zIndex: 1,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography 
                className="card-title"
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: colors.lightText,
                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' },
                  lineHeight: 1.3,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  transition: 'color 0.3s ease',
                }}
              >
                {title}
              </Typography>
              
              {/* Icon with Gold Gradient */}
              <Box
                className="card-icon-wrapper"
                sx={{
                  background: iconBgGradient,
                  borderRadius: '14px',
                  p: { xs: 0.8, sm: 1, md: 1.2 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 36, sm: 42, md: 48 },
                  height: { xs: 36, sm: 42, md: 48 },
                  flexShrink: 0,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: `0 4px 16px ${colors.accentGold}44`,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${colors.accentGold}33, transparent)`,
                    opacity: 0.3,
                    zIndex: -1,
                  }
                }}
              >
                {React.cloneElement(icon, { 
                  sx: { 
                    fontSize: { xs: 18, sm: 20, md: 24 },
                    color: 'white',
                  } 
                })}
              </Box>
            </Box>
            
            {/* Value */}
            <Typography 
              className="card-value"
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                color: colors.darkText,
                fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.2rem', lg: '2.5rem' },
                lineHeight: 1.1,
                transition: 'color 0.3s ease',
                letterSpacing: '-0.5px',
                mb: 0.5,
              }}
            >
              {value !== undefined && value !== null ? value : 0}
            </Typography>
            
            {/* Gold Accent Dots */}
            <Box sx={{
              display: 'flex',
              gap: 0.5,
              mt: 0.5,
            }}>
              <Box className="gold-dot" sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: colors.accentGold,
                opacity: 0.4,
                transition: 'all 0.3s ease',
              }} />
              <Box className="gold-dot" sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: colors.accentGold,
                opacity: 0.2,
                transition: 'all 0.3s ease',
                transitionDelay: '0.1s',
              }} />
              <Box className="gold-dot" sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: colors.accentGold,
                opacity: 0.1,
                transition: 'all 0.3s ease',
                transitionDelay: '0.2s',
              }} />
            </Box>
          </CardContent>
        </Card>
      </Grow>
    )
  }

  // ============================================================
  // ✅ LOADING SKELETON
  // ============================================================
  const LoadingSkeleton = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
        <Grid item xs={6} sm={4} md={3} key={i}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 3, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#E8ECEF', borderRadius: 1 }} />
                <Skeleton variant="rounded" width={42} height={42} sx={{ bgcolor: '#E8ECEF', borderRadius: 2 }} />
              </Box>
              <Skeleton variant="text" width="50%" height={45} sx={{ bgcolor: '#E8ECEF', borderRadius: 1 }} />
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                <Skeleton variant="circular" width={6} height={6} sx={{ bgcolor: '#E8ECEF' }} />
                <Skeleton variant="circular" width={6} height={6} sx={{ bgcolor: '#E8ECEF' }} />
                <Skeleton variant="circular" width={6} height={6} sx={{ bgcolor: '#E8ECEF' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  // ============================================================
  // ✅ RENDER
  // ============================================================
  if (loading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: colors.sidebar,
            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
            mb: 3,
            letterSpacing: '0.5px',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -6,
              left: 0,
              width: '50px',
              height: '3px',
              background: `linear-gradient(90deg, ${colors.accentGold}, ${colors.sidebar})`,
              borderRadius: '2px',
            }
          }}
        >
          Dashboard
        </Typography>
        <LoadingSkeleton />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Paper sx={{ 
          p: 3, 
          bgcolor: '#FFF5F5', 
          borderRadius: 3,
          border: '1px solid #FFCDD2',
        }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={fetchDashboardData}
            sx={{ 
              mt: 2,
              bgcolor: colors.sidebar,
              '&:hover': {
                bgcolor: colors.sidebarHover,
              },
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    )
  }

  const cards = getCards()

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      // ✅ Light gradient background
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
      borderRadius: 0,
      position: 'relative',
      // ✅ Subtle decorative pattern overlay
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 10% 20%, rgba(1, 65, 28, 0.02) 0%, transparent 50%),
                     radial-gradient(circle at 90% 80%, rgba(201, 162, 39, 0.02) 0%, transparent 50%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }
    }}>
      {/* Header */}
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          color: colors.sidebar,
          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
          mb: { xs: 2, sm: 3 },
          letterSpacing: '0.5px',
          position: 'relative',
          zIndex: 1,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -6,
            left: 0,
            width: '50px',
            height: '3px',
            background: `linear-gradient(90deg, ${colors.accentGold}, ${colors.sidebar})`,
            borderRadius: '2px',
          }
        }}
      >
        Dashboard
      </Typography>

      {/* ✅ Card Area with Subtle Background Color */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          p: { xs: 1.5, sm: 2, md: 2.5 },
          borderRadius: 4,
          // ✅ Subtle color behind cards
          background: colors.cardAreaBg,
          border: `1px solid ${colors.cardAreaBorder}`,
          backdropFilter: 'blur(2px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(1, 65, 28, 0.04)',
            borderColor: 'rgba(1, 65, 28, 0.08)',
          }
        }}
      >
        {/* Stats Cards */}
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {cards.map((card, index) => (
            <Grid 
              item 
              xs={6} 
              sm={4} 
              md={3} 
              key={index}
            >
              <StatCard {...card} index={index} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Empty State */}
      {cards.length === 0 && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          position: 'relative',
          zIndex: 1,
        }}>
          <Typography variant="h6" sx={{ color: colors.lightText }}>
            No dashboard data available
          </Typography>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: 'white',
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Dashboard