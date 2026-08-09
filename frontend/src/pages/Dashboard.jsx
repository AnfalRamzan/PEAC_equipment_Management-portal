// src/pages/Dashboard.jsx - FIXED WITH REAL API DATA FETCH

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Skeleton,
  Alert,
  Snackbar
} from '@mui/material'
import {
  MedicalServices,
  ErrorOutline,
  CheckCircle,
  LocalHospital,
  Engineering,
  Build,
  Assignment,
  Person,
  Warning,
  CalendarToday,
  ShoppingCart,
  LocalShipping,
  Inventory,
  Handyman,
  Pending,
  DoneAll,
  Dashboard as DashboardIcon,
  People,
  ReceiptLong,
  Description,
  School,
  Gavel,
  SupervisorAccount
} from '@mui/icons-material'
import { dashboardService } from '../api/services'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  const [stats, setStats] = useState({
    // Super Admin & Hospital Admin Stats
    totalEquipment: 0,
    totalHospitals: 0,
    totalEngineers: 0,
    totalHospitalAdmins: 0,
    criticalErrors: 0,
    openErrors: 0,
    resolvedErrors: 0,
    
    // Hospital Admin Specific
    pendingRepairs: 0,
    inProgressRepairs: 0,
    maintenanceDue: 0,
    criticalEquipment: 0,
    pendingPurchaseOrders: 0,
    sparePartsLow: 0,
    
    // Engineer Specific
    myAssignedRepairs: 0,
    myPendingRepairs: 0,
    myInProgressRepairs: 0,
    myCompletedRepairs: 0,
    myMaintenanceTasks: 0,
    myReportedErrors: 0,
    
    // Common
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
      
      // ✅ Call the REAL API endpoint
      const response = await dashboardService.getStats()
      
      console.log('📊 Dashboard API Response:', response.data)
      
      // ✅ Update stats with real data from API
      if (response.data && response.data.success) {
        setStats({
          totalEquipment: response.data.totalEquipment || 0,
          totalHospitals: response.data.totalHospitals || 0,
          totalEngineers: response.data.totalEngineers || 0,
          totalHospitalAdmins: response.data.totalHospitalAdmins || 0,
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
          myAssignedRepairs: response.data.myAssignedRepairs || 0,
          myPendingRepairs: response.data.myPendingRepairs || 0,
          myInProgressRepairs: response.data.myInProgressRepairs || 0,
          myCompletedRepairs: response.data.myCompletedRepairs || 0,
          myMaintenanceTasks: response.data.myMaintenanceTasks || 0,
          myReportedErrors: response.data.myReportedErrors || 0
        })
      } else {
        console.warn('⚠️ API response not successful:', response.data)
        // Keep existing stats (don't reset to zero)
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

  // ✅ Fetch data on mount and every 30 seconds (real-time updates)
  useEffect(() => {
    fetchDashboardData()
    
    // ✅ Set up polling for real-time updates
    const interval = setInterval(() => {
      console.log('🔄 Polling dashboard stats...')
      fetchDashboardData()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  // ============================================================
  // ✅ CARD CLICK HANDLERS
  // ============================================================
  const handleCardClick = (path, filter = '') => {
    navigate(path + filter)
  }

  // ============================================================
  // ✅ GET CARDS BASED ON ROLE
  // ============================================================
  const getCards = () => {
    const role = user?.role
    
    if (role === 'SUPER_ADMIN') {
      return [
        { 
          title: 'Total Hospitals', 
          value: stats.totalHospitals, 
          icon: <LocalHospital />, 
          color: '#0B5FA5',
          path: '/hospitals'
        },
        { 
          title: 'Hospital Admins',
          value: stats.totalHospitalAdmins || 0, 
          icon: <SupervisorAccount />, 
          color: '#0B5FA5',
          path: '/users?role=HOSPITAL_ADMIN'
        },
        { 
          title: 'Total Engineers', 
          value: stats.totalEngineers, 
          icon: <Engineering />, 
          color: '#0B5FA5',
          path: '/users?role=ENGINEER'
        },
        { 
          title: 'Total Equipment', 
          value: stats.totalEquipment, 
          icon: <MedicalServices />, 
          color: '#0B5FA5',
          path: '/equipment'
        },
        { 
          title: 'Open Errors', 
          value: stats.openErrors, 
          icon: <ErrorOutline />, 
          color: '#0B5FA5',
          path: '/errors?status=Pending,In Progress'
        },
        { 
          title: 'Critical Errors',
          value: stats.criticalErrors || 0, 
          icon: <Warning />, 
          color: '#0B5FA5',
          path: '/errors?severity=Critical'
        },
        { 
          title: 'Resolved Errors', 
          value: stats.resolvedErrors, 
          icon: <CheckCircle />, 
          color: '#0B5FA5',
          path: '/errors?status=Resolved,Closed'
        },
        { 
          title: 'Repairs In Progress',
          value: stats.inProgressRepairs, 
          icon: <Build />, 
          color: '#0B5FA5',
          path: '/repairs?status=In Progress'
        },
        { 
          title: 'Pending Purchase Requests',
          value: stats.pendingPurchaseOrders, 
          icon: <ShoppingCart />, 
          color: '#0B5FA5',
          path: '/purchase-orders?status=Pending'
        },
        { 
          title: 'Maintenance Due', 
          value: stats.maintenanceDue, 
          icon: <CalendarToday />, 
          color: '#0B5FA5',
          path: '/maintenance?status=Overdue'
        },
        { 
          title: 'Spare Parts Low Stock', 
          value: stats.sparePartsLow, 
          icon: <Inventory />, 
          color: '#0B5FA5',
          path: '/spare-parts?stock=low'
        },
        { 
          title: 'Total Reports', 
          value: stats.totalReports, 
          icon: <Description />, 
          color: '#0B5FA5',
          path: '/reports'
        }
      ]
    }
    
    if (role === 'HOSPITAL_ADMIN') {
      return [
        { 
          title: 'Total Equipment', 
          value: stats.totalEquipment, 
          icon: <MedicalServices />, 
          color: '#0B5FA5',
          path: '/equipment'
        },
        { 
          title: 'Total Engineers', 
          value: stats.totalEngineers, 
          icon: <Engineering />, 
          color: '#0B5FA5',
          path: '/users?role=ENGINEER'
        },
        { 
          title: 'Open Errors', 
          value: stats.openErrors, 
          icon: <ErrorOutline />, 
          color: '#0B5FA5',
          path: '/errors?status=Pending,In Progress'
        },
        { 
          title: 'Critical Errors',
          value: stats.criticalErrors || 0, 
          icon: <Warning />, 
          color: '#0B5FA5',
          path: '/errors?severity=Critical'
        },
        { 
          title: 'Resolved Errors', 
          value: stats.resolvedErrors, 
          icon: <CheckCircle />, 
          color: '#0B5FA5',
          path: '/errors?status=Resolved,Closed'
        },
        { 
          title: 'Pending Repairs', 
          value: stats.pendingRepairs, 
          icon: <Pending />, 
          color: '#0B5FA5',
          path: '/repairs?status=Pending'
        },
        { 
          title: 'In Progress Repairs', 
          value: stats.inProgressRepairs, 
          icon: <Build />, 
          color: '#0B5FA5',
          path: '/repairs?status=In Progress'
        },
        { 
          title: 'Maintenance Due', 
          value: stats.maintenanceDue, 
          icon: <CalendarToday />, 
          color: '#0B5FA5',
          path: '/maintenance?status=Overdue'
        },
        { 
          title: 'Critical Equipment', 
          value: stats.criticalEquipment, 
          icon: <Warning />, 
          color: '#0B5FA5',
          path: '/equipment?status=Critical'
        },
        { 
          title: 'Pending Purchase Orders', 
          value: stats.pendingPurchaseOrders, 
          icon: <ShoppingCart />, 
          color: '#0B5FA5',
          path: '/purchase-orders?status=Pending'
        },
        { 
          title: 'Spare Parts Low Stock', 
          value: stats.sparePartsLow, 
          icon: <Inventory />, 
          color: '#0B5FA5',
          path: '/spare-parts?stock=low'
        }
      ]
    }
    
    if (role === 'ENGINEER') {
      return [
        { 
          title: 'Assigned Repairs', 
          value: stats.myAssignedRepairs, 
          icon: <Assignment />, 
          color: '#0B5FA5',
          path: '/repairs?status=Assigned'
        },
        { 
          title: 'Pending Repairs', 
          value: stats.myPendingRepairs, 
          icon: <Pending />, 
          color: '#0B5FA5',
          path: '/repairs?status=Pending'
        },
        { 
          title: 'In Progress Repairs', 
          value: stats.myInProgressRepairs, 
          icon: <Build />, 
          color: '#0B5FA5',
          path: '/repairs?status=In Progress'
        },
        { 
          title: 'Completed Repairs', 
          value: stats.myCompletedRepairs, 
          icon: <CheckCircle />, 
          color: '#0B5FA5',
          path: '/repairs?status=Completed'
        },
        { 
          title: 'Maintenance Tasks', 
          value: stats.myMaintenanceTasks, 
          icon: <Handyman />, 
          color: '#0B5FA5',
          path: '/maintenance'
        },
        { 
          title: 'Reported Errors', 
          value: stats.myReportedErrors, 
          icon: <ErrorOutline />, 
          color: '#0B5FA5',
          path: '/errors'
        }
      ]
    }
    
    // Default
    return [
      { 
        title: 'Welcome', 
        value: '👋', 
        icon: <DashboardIcon />, 
        color: '#0B5FA5',
        path: '/dashboard'
      }
    ]
  }

  // ============================================================
  // ✅ STAT CARD COMPONENT
  // ============================================================
  const StatCard = ({ title, value, icon, color, path, index }) => (
    <Grow in timeout={300 + (index || 0) * 50}>
      <Card 
        sx={{ 
          height: '100%', 
          borderRadius: 2, 
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
          '&:hover': {
            transform: isMobile ? 'none' : 'translateY(-4px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
          },
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'manipulation'
        }}
        onClick={() => path && handleCardClick(path)}
      >
        {/* Decorative top line */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 3, 
          bgcolor: color || '#0B5FA5',
          opacity: 0.6
        }} />
        
        <CardContent sx={{ 
          p: { xs: 1.5, sm: 2, md: 2.5 },
          '&:last-child': { pb: { xs: 1.5, sm: 2, md: 2.5 } }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
                lineHeight: 1.2
              }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                bgcolor: color || '#0B5FA5',
                borderRadius: '50%',
                p: { xs: 0.6, sm: 0.8, md: 1 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 28, sm: 32, md: 40 },
                height: { xs: 28, sm: 32, md: 40 },
                flexShrink: 0
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  fontSize: { xs: 14, sm: 16, md: 20 },
                  color: 'white'
                } 
              })}
            </Box>
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              color: '#2C3E50',
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem', lg: '2.125rem' },
              lineHeight: 1.2
            }}
          >
            {value !== undefined && value !== null ? value : 0}
          </Typography>
        </CardContent>
      </Card>
    </Grow>
  )

  // ============================================================
  // ✅ LOADING SKELETON
  // ============================================================
  const LoadingSkeleton = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Grid item xs={6} sm={4} md={3} key={i}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="circular" width={32} height={32} />
              </Box>
              <Skeleton variant="text" width="40%" height={40} />
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
            color: '#2C3E50',
            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
            mb: 3
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
        <Paper sx={{ p: 3, bgcolor: '#ffebee', borderRadius: 2 }}>
          <Alert severity="error">
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={fetchDashboardData}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    )
  }

  const cards = getCards()

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header - Only Dashboard Title */}
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          color: '#2C3E50',
          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
          mb: { xs: 2, sm: 3 }
        }}
      >
        Dashboard
      </Typography>

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

      {/* Empty State */}
      {cards.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="textSecondary">
            No dashboard data available
          </Typography>
        </Paper>
      )}

      {/* Snackbar for errors */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Dashboard