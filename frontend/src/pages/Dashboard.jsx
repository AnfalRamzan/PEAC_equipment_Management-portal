// src/pages/Dashboard.jsx
// ✅ UPDATED: Cards become prominent on click with glow & scale effect

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
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS
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
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  darkText: '#0F172A',
  lightText: '#64748B',
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  cardAreaBg: 'rgba(103, 232, 249, 0.04)',
  cardAreaBorder: 'rgba(103, 232, 249, 0.08)',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

// ✅ PROMINENT CLICK ANIMATIONS
const prominentStyles = `
@keyframes prominentPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(103, 232, 249, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 232, 249, 0);
    transform: scale(1);
  }
}

@keyframes prominentGlow {
  0% {
    box-shadow: 
      0 0 20px rgba(103, 232, 249, 0.2),
      0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(103, 232, 249, 0.4),
      0 0 80px rgba(103, 232, 249, 0.2),
      inset 0 0 40px rgba(103, 232, 249, 0.05);
    border-color: rgba(103, 232, 249, 0.6);
  }
  100% {
    box-shadow: 
      0 0 20px rgba(103, 232, 249, 0.2),
      0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
}

@keyframes prominentGoldGlow {
  0% {
    box-shadow: 
      0 0 20px rgba(201, 162, 39, 0.15),
      0 0 40px rgba(201, 162, 39, 0.05);
    border-color: rgba(201, 162, 39, 0.2);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(201, 162, 39, 0.3),
      0 0 80px rgba(201, 162, 39, 0.15);
    border-color: rgba(201, 162, 39, 0.5);
  }
  100% {
    box-shadow: 
      0 0 20px rgba(201, 162, 39, 0.15),
      0 0 40px rgba(201, 162, 39, 0.05);
    border-color: rgba(201, 162, 39, 0.2);
  }
}

@keyframes prominentRing {
  0% {
    box-shadow: 
      0 0 0 0 rgba(103, 232, 249, 0.6),
      0 0 0 10px rgba(103, 232, 249, 0);
  }
  100% {
    box-shadow: 
      0 0 0 30px rgba(103, 232, 249, 0),
      0 0 0 0 rgba(103, 232, 249, 0.6);
  }
}

@keyframes prominentShine {
  0% {
    background-position: -300% center;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  90% {
    opacity: 1;
  }
  100% {
    background-position: 300% center;
    opacity: 0;
  }
}

.prominent-active {
  animation: prominentGlow 1.5s ease-in-out 3;
}

.prominent-active-gold {
  animation: prominentGoldGlow 1.5s ease-in-out 3;
}

.prominent-ring {
  animation: prominentRing 0.8s ease-out 1;
}

.prominent-shine {
  animation: prominentShine 2s ease-in-out 1;
}
`

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
    totalReports: 0,
    myAssignedRepairs: 0,
    myMaintenanceTasks: 0,
    myReportedErrors: 0,
    totalErrors: 0,
    totalRepairs: 0,
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  // ✅ Track which card is clicked for prominent effect
  const [clickedCardIndex, setClickedCardIndex] = useState(null)
  const [prominentActive, setProminentActive] = useState(false)

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
          myAssignedRepairs: response.data.myAssignedRepairs || 0,
          myMaintenanceTasks: response.data.myMaintenanceTasks || 0,
          myReportedErrors: response.data.myReportedErrors || 0,
          totalErrors: response.data.totalErrors || 0,
          totalRepairs: response.data.totalRepairs || 0,
        })
        
        console.log('✅ Stats updated:', stats)
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

  // ✅ Handle card click with prominent effect
  const handleCardClick = (path, filter = '', index) => {
    // ✅ Set clicked card index for prominent effect
    setClickedCardIndex(index)
    setProminentActive(true)
    
    // ✅ Remove prominent effect after 3 seconds
    setTimeout(() => {
      setProminentActive(false)
      setClickedCardIndex(null)
    }, 3000)
    
    // ✅ Navigate to the path
    navigate(path + filter)
  }

  const getCards = () => {
    const userRole = user?.role || 'ENGINEER'
    const isAdmin = userRole === 'SUPER_ADMIN'
    const isEngineer = userRole === 'ENGINEER'
    
    // ✅ Base cards for ALL users
    const cards = [
      { 
        title: 'Total Equipment', 
        value: stats.totalEquipment, 
        icon: <MedicalServices />, 
        path: '/equipment',
        color: colors.lightCyan,
        show: true
      },
    ]

    // ✅ Engineer-specific cards
    if (isEngineer) {
      cards.push(
        { 
          title: 'My Assigned Repairs', 
          value: stats.myAssignedRepairs || 0, 
          icon: <Engineering />, 
          path: '/repairs?assigned=true',
          color: colors.lightCyan,
          show: true
        },
        { 
          title: 'My Reported Errors', 
          value: stats.myReportedErrors || 0, 
          icon: <ErrorOutline />, 
          path: '/errors?reported=true',
          color: colors.lightCyan,
          show: true
        },
        { 
          title: 'Total Errors', 
          value: stats.totalErrors || 0, 
          icon: <ErrorOutline />, 
          path: '/errors',
          color: colors.warning,
          show: true
        },
        { 
          title: 'Total Repairs', 
          value: stats.totalRepairs || 0, 
          icon: <Build />, 
          path: '/repairs',
          color: colors.info,
          show: true
        },
        { 
          title: 'Critical Errors',
          value: stats.criticalErrors || 0, 
          icon: <Warning />, 
          path: '/errors?severity=Critical',
          color: colors.error,
          show: true
        },
        { 
          title: 'Maintenance Due', 
          value: stats.maintenanceDue || 0, 
          icon: <CalendarToday />, 
          path: '/maintenance?status=Overdue',
          color: colors.warning,
          show: true
        }
      )
    }

    // ✅ Admin-only cards
    if (isAdmin) {
      cards.push(
        { 
          title: 'Total Hospitals', 
          value: stats.totalHospitals || 0, 
          icon: <LocalHospital />, 
          path: '/hospitals',
          color: colors.lightCyan,
          show: true
        },
        { 
          title: 'Total Engineers', 
          value: stats.totalEngineers || 0, 
          icon: <Engineering />, 
          path: '/users?role=ENGINEER',
          color: colors.lightCyanBright,
          show: true
        },
        { 
          title: 'Total Errors', 
          value: stats.totalErrors || 0, 
          icon: <ErrorOutline />, 
          path: '/errors',
          color: colors.warning,
          show: true
        },
        { 
          title: 'Total Repairs', 
          value: stats.totalRepairs || 0, 
          icon: <Build />, 
          path: '/repairs',
          color: colors.info,
          show: true
        },
        { 
          title: 'Critical Errors',
          value: stats.criticalErrors || 0, 
          icon: <Warning />, 
          path: '/errors?severity=Critical',
          color: colors.error,
          show: true
        },
        { 
          title: 'Maintenance Due', 
          value: stats.maintenanceDue || 0, 
          icon: <CalendarToday />, 
          path: '/maintenance?status=Overdue',
          color: colors.warning,
          show: true
        },
        { 
          title: 'Pending Purchase Orders',
          value: stats.pendingPurchaseOrders || 0, 
          icon: <ShoppingCart />, 
          path: '/purchase-orders?status=Pending',
          color: colors.lightCyan,
          show: true
        },
        { 
          title: 'Spare Parts Low Stock', 
          value: stats.sparePartsLow || 0, 
          icon: <Inventory />, 
          path: '/spare-parts?stock=low',
          color: colors.error,
          show: true
        },
        { 
          title: 'Total Reports', 
          value: stats.totalReports || 0, 
          icon: <Description />, 
          path: '/reports',
          color: colors.lightCyanBright,
          show: true
        }
      )
    }

    return cards.filter(card => card.show)
  }

  const StatCard = ({ title, value, icon, path, index, color }) => {
    const iconBgGradient = `linear-gradient(135deg, ${colors.darkNavy} 0%, ${colors.lightCyan} 100%)`
    
    // ✅ Check if this card is clicked
    const isClicked = clickedCardIndex === index && prominentActive
    
    return (
      <Grow in timeout={300 + (index || 0) * 50}>
        <Card 
          sx={{ 
            height: '100%', 
            borderRadius: 3, 
            boxShadow: isClicked 
              ? `0 0 40px rgba(103, 232, 249, 0.4), 0 0 80px rgba(103, 232, 249, 0.2), 0 8px 40px rgba(15, 23, 42, 0.15)`
              : '0 4px 20px rgba(15, 23, 42, 0.06)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            bgcolor: isClicked ? 'rgba(103, 232, 249, 0.05)' : colors.cardBg,
            border: isClicked 
              ? `2px solid ${colors.lightCyan}`
              : `1px solid ${colors.borderColor}`,
            position: 'relative',
            overflow: 'hidden',
            transform: isClicked ? 'scale(1.04)' : 'scale(1)',
            // ✅ Prominent animation classes
            ...(isClicked && {
              animation: 'prominentGlow 1.5s ease-in-out 3',
            }),
            '&:hover': {
              transform: isMobile ? 'none' : 'translateY(-8px) scale(1.02)',
              boxShadow: `0 12px 40px rgba(103, 232, 249, 0.15)`,
              borderColor: colors.lightCyan,
              '& .card-icon-wrapper': {
                transform: 'scale(1.15) rotate(-8deg)',
                boxShadow: `0 0 40px ${colors.lightCyanGlowStrong}`,
              },
              '& .card-title': {
                color: colors.darkNavy,
              },
              '& .card-value': {
                color: colors.darkNavy,
              },
              '& .card-decoration': {
                transform: 'scale(1.5)',
                opacity: 0.1,
              },
              '& .cyan-dot': {
                opacity: 0.8,
                transform: 'scale(1.3)',
              },
              '& .glow-effect': {
                opacity: 1,
              }
            },
            // ✅ Clicked state - more prominent
            ...(isClicked && {
              '& .card-icon-wrapper': {
                transform: 'scale(1.2) rotate(-8deg)',
                boxShadow: `0 0 60px ${colors.lightCyanGlowStrong}`,
              },
              '& .card-title': {
                color: colors.darkNavy,
                fontWeight: 700,
              },
              '& .card-value': {
                color: colors.darkNavy,
              },
              '& .card-decoration': {
                transform: 'scale(2)',
                opacity: 0.15,
              },
              '& .cyan-dot': {
                opacity: 1,
                transform: 'scale(1.5)',
              },
              '& .glow-effect': {
                opacity: 1,
              },
              '& .prominent-overlay': {
                opacity: 1,
              },
              '& .prominent-ring': {
                animation: 'prominentRing 0.8s ease-out 1',
              },
              '& .prominent-shine': {
                animation: 'prominentShine 2s ease-in-out 1',
              },
            }),
            touchAction: 'manipulation',
          }}
          onClick={() => handleCardClick(path, '', index)}
          className={isClicked ? 'prominent-active' : ''}
        >
          {/* ✅ Prominent Shine Overlay */}
          <Box
            className="prominent-shine"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                linear-gradient(105deg,
                  transparent 30%,
                  rgba(103, 232, 249, 0.15) 35%,
                  rgba(103, 232, 249, 0.25) 40%,
                  rgba(201, 162, 39, 0.1) 42%,
                  rgba(103, 232, 249, 0.3) 45%,
                  rgba(103, 232, 249, 0.15) 48%,
                  rgba(201, 162, 39, 0.1) 50%,
                  rgba(103, 232, 249, 0.25) 52%,
                  rgba(103, 232, 249, 0.15) 55%,
                  transparent 60%
                )
              `,
              backgroundSize: '300% 100%',
              opacity: isClicked ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
          
          {/* ✅ Prominent Ring Effect */}
          <Box
            className="prominent-ring"
            sx={{
              position: 'absolute',
              inset: -4,
              borderRadius: '16px',
              border: `3px solid rgba(103, 232, 249, 0)`,
              opacity: isClicked ? 1 : 0,
              pointerEvents: 'none',
              zIndex: 4,
            }}
          />
          
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: isClicked ? 5 : 4, 
            background: isClicked 
              ? `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold}, ${colors.lightCyan})`
              : `linear-gradient(90deg, ${colors.darkNavy}, ${colors.lightCyan}, ${colors.accentGold})`,
            animation: isClicked ? 'gradientShine 1.5s ease-in-out infinite' : 'none',
          }} />
          
          <Box
            className="glow-effect"
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: isClicked ? 1 : 0,
              transition: 'opacity 0.4s ease',
              background: `radial-gradient(circle at 30% 50%, ${colors.lightCyan}12 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          
          <Box
            className="card-decoration"
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.lightCyan}${isClicked ? '25' : '12'} 0%, transparent 70%)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
            }}
          />
          
          <Box
            className="card-decoration"
            sx={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.darkNavy}${isClicked ? '12' : '06'} 0%, transparent 70%)`,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
              transitionDelay: '0.1s',
            }}
          />
          
          {/* ✅ Prominent Overlay */}
          <Box
            className="prominent-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: isClicked ? 1 : 0,
              transition: 'opacity 0.3s ease',
              background: `
                radial-gradient(circle at 50% 50%, ${colors.lightCyan}08 0%, transparent 50%),
                radial-gradient(circle at 20% 80%, ${colors.accentGold}04 0%, transparent 40%)
              `,
              pointerEvents: 'none',
              zIndex: 0,
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
                  fontWeight: isClicked ? 700 : 600,
                  color: isClicked ? colors.darkNavy : colors.lightText,
                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' },
                  lineHeight: 1.3,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                }}
              >
                {title}
              </Typography>
              
              <Box
                className="card-icon-wrapper"
                sx={{
                  background: isClicked 
                    ? `linear-gradient(135deg, ${colors.lightCyan} 0%, ${colors.accentGold} 100%)`
                    : iconBgGradient,
                  borderRadius: '14px',
                  p: { xs: 0.8, sm: 1, md: 1.2 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 36, sm: 42, md: 48 },
                  height: { xs: 36, sm: 42, md: 48 },
                  flexShrink: 0,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isClicked 
                    ? `0 0 40px ${colors.lightCyanGlowStrong}, 0 0 80px ${colors.lightCyanGlow}`
                    : `0 4px 16px ${colors.lightCyanGlow}`,
                  position: 'relative',
                  transform: isClicked ? 'scale(1.15) rotate(-8deg)' : 'scale(1)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '16px',
                    background: isClicked 
                      ? `linear-gradient(135deg, ${colors.lightCyan}66, ${colors.accentGold}33)`
                      : `linear-gradient(135deg, ${colors.lightCyan}33, transparent)`,
                    opacity: isClicked ? 0.6 : 0.3,
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
            
            <Typography 
              className="card-value"
              variant="h3" 
              sx={{ 
                fontWeight: isClicked ? 900 : 800, 
                color: isClicked ? colors.darkNavy : colors.darkText,
                fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2.2rem', lg: '2.5rem' },
                lineHeight: 1.1,
                transition: 'all 0.3s ease',
                letterSpacing: '-0.5px',
                mb: 0.5,
                ...(isClicked && {
                  textShadow: `0 0 30px ${colors.lightCyanGlow}`,
                }),
              }}
            >
              {value !== undefined && value !== null ? value : 0}
            </Typography>
            
            <Box sx={{
              display: 'flex',
              gap: 0.5,
              mt: 0.5,
            }}>
              <Box className="cyan-dot" sx={{
                width: isClicked ? 8 : 6,
                height: isClicked ? 8 : 6,
                borderRadius: '50%',
                bgcolor: isClicked ? colors.accentGold : colors.lightCyan,
                opacity: isClicked ? 1 : 0.4,
                transition: 'all 0.3s ease',
                boxShadow: isClicked 
                  ? `0 0 20px ${colors.accentGold}, 0 0 40px ${colors.accentGold}`
                  : `0 0 10px ${colors.lightCyanGlow}`,
              }} />
              <Box className="cyan-dot" sx={{
                width: isClicked ? 7 : 6,
                height: isClicked ? 7 : 6,
                borderRadius: '50%',
                bgcolor: colors.lightCyan,
                opacity: isClicked ? 0.8 : 0.2,
                transition: 'all 0.3s ease',
                transitionDelay: '0.1s',
                boxShadow: isClicked 
                  ? `0 0 15px ${colors.lightCyan}`
                  : `0 0 8px ${colors.lightCyanGlow}`,
              }} />
              <Box className="cyan-dot" sx={{
                width: isClicked ? 6 : 6,
                height: isClicked ? 6 : 6,
                borderRadius: '50%',
                bgcolor: colors.lightCyan,
                opacity: isClicked ? 0.6 : 0.1,
                transition: 'all 0.3s ease',
                transitionDelay: '0.2s',
                boxShadow: isClicked 
                  ? `0 0 10px ${colors.lightCyan}`
                  : `0 0 6px ${colors.lightCyanGlow}`,
              }} />
            </Box>
          </CardContent>
        </Card>
      </Grow>
    )
  }

  const LoadingSkeleton = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
      borderRadius: 0,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 10% 20%, rgba(103, 232, 249, 0.04) 0%, transparent 50%),
                     radial-gradient(circle at 90% 80%, rgba(15, 23, 42, 0.03) 0%, transparent 50%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }
    }}>
      <style>{prominentStyles}</style>
      
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          color: colors.darkNavy,
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
            background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.darkNavy})`,
            borderRadius: '2px',
          }
        }}
      >
        Dashboard
      </Typography>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Paper sx={{ 
          p: 3, 
          bgcolor: '#FFF5F5', 
          borderRadius: 3,
          border: '1px solid #FFCDD2',
          position: 'relative',
          zIndex: 1,
        }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={fetchDashboardData}
            sx={{ 
              mt: 2,
              bgcolor: colors.darkNavy,
              '&:hover': {
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
              },
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Retry
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            p: { xs: 1.5, sm: 2, md: 2.5 },
            borderRadius: 4,
            background: colors.cardAreaBg,
            border: `1px solid ${colors.cardAreaBorder}`,
            backdropFilter: 'blur(2px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(103, 232, 249, 0.06)',
              borderColor: 'rgba(103, 232, 249, 0.12)',
            }
          }}
        >
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {getCards().map((card, index) => (
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

          {getCards().length === 0 && (
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
        </Box>
      )}

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