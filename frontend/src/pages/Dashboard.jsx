import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material'
import {
  MedicalServices,
  ErrorOutline,
  CheckCircle,
  LocalHospital,
  Engineering,
  Assessment
} from '@mui/icons-material'
import { dashboardService } from '../api/services'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEquipment: 0,
    openErrors: 0,
    resolvedErrors: 0,
    totalHospitals: 0,
    totalEngineers: 0,
    totalReports: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardService.getStats()
      setStats(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading Dashboard...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50', mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Equipment"
            value={stats.totalEquipment || 0}
            icon={<MedicalServices sx={{ color: 'white' }} />}
            color="#0B5FA5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Open Errors"
            value={stats.openErrors || 0}
            icon={<ErrorOutline sx={{ color: 'white' }} />}
            color="#C9A227"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Resolved Errors"
            value={stats.resolvedErrors || 0}
            icon={<CheckCircle sx={{ color: 'white' }} />}
            color="#28a745"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Hospitals"
            value={stats.totalHospitals || 0}
            icon={<LocalHospital sx={{ color: 'white' }} />}
            color="#0B5FA5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Biomedical Engineers"
            value={stats.totalEngineers || 0}
            icon={<Engineering sx={{ color: 'white' }} />}
            color="#17a2b8"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Reports"
            value={stats.totalReports || 0}
            icon={<Assessment sx={{ color: 'white' }} />}
            color="#C9A227"
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard