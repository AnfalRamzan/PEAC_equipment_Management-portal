// src/pages/Reports.jsx
// ✅ BACKEND INTEGRATED - Complete Downtime Report
// ✅ Uses /reports/downtime-complete API
// ✅ All filters working with backend
// ✅ Hospital-wise, Equipment-wise filtering
// ✅ REMOVED: Critical filter (not needed)
// ✅ ADDED: Proper Availability calculation
// ✅ ADDED: Proper Downtime calculation (same as ErrorLogs)
// ✅ ADDED: Full system report export
// ✅ UPDATED: Downtime shows ONLY days with 2 decimal places (e.g., 1.60d, 5.25d)

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Grid,
  Typography,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tooltip,
  Menu,
  Divider,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Grow,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Autocomplete,
} from '@mui/material'
import {
  Search,
  Visibility,
  Download,
  Close,
  Refresh,
  Assessment,
  ErrorOutline,
  MedicalServices,
  Business,
  Warning,
  TimerOff,
  TrendingUp,
  CheckCircle,
  Cancel,
  FilterList,
  FileDownload,
  TableChart,
  PictureAsPdf,
  Clear,
  Inventory,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

// ============================================================
// ✅ COLORS
// ============================================================
const colors = {
  darkNavy: '#0F172A',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  text: '#FFFFFF',
  lightText: '#64748B',
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

// ============================================================
// ✅ HELPERS
// ============================================================
const safeToFixed = (value, decimals = 2) => {
  const n = parseFloat(value)
  return isNaN(n) ? '0.00' : n.toFixed(decimals)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ✅ Calculate downtime in days only - with 2 decimal places (same as ErrorLogs)
const calculateDowntimeDays = (hours) => {
  const days = hours / 24
  return days
}

// ============================================================
// ✅ STATS CARD
// ============================================================
const StatsCard = ({ title, value, icon, loading, color = colors.lightCyan }) => {
  return (
    <Grow in timeout={300}>
      <Card sx={{
        borderRadius: 3,
        bgcolor: '#FFFFFF',
        transition: 'all 0.3s ease',
        border: `1px solid ${colors.borderColor}`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
          borderColor: colors.lightCyan,
        },
        height: '100%'
      }}>
        <CardContent sx={{
          textAlign: 'center',
          py: { xs: 2, sm: 2.5 },
          px: { xs: 1.5, sm: 2 }
        }}>
          {loading ? (
            <CircularProgress size={30} sx={{ color: colors.lightCyan }} />
          ) : (
            <>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1
              }}>
                <Avatar sx={{
                  bgcolor: 'rgba(103, 232, 249, 0.08)',
                  width: 40,
                  height: 40,
                }}>
                  {React.cloneElement(icon, { 
                    sx: { fontSize: 22, color: color }
                  })}
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}
              >
                {value !== undefined && value !== null ? value : 0}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  fontWeight: 500,
                  fontSize: { xs: '0.7rem', sm: '0.875rem' }
                }}
              >
                {title}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Grow>
  )
}

// ============================================================
// ✅ FILTER MENU
// ============================================================
const FilterMenu = ({
  anchorEl,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
  open,
  onDrawerClose,
  isMobile,
  hospitalOptions,
  equipmentOptions,
  loadingEquipment,
}) => {
  const filterContent = (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Typography variant="h6" fontWeight={700} sx={{ color: '#0F172A', mb: 2 }}>
        Filter Reports
      </Typography>

      <Divider sx={{ mb: 2, borderColor: colors.borderColor }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: colors.lightText }}>Period</InputLabel>
            <Select
              name="period"
              value={filters.period || 'month'}
              onChange={onFilterChange}
              label="Period"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyan },
                }
              }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="quarter">Last 90 Days</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: colors.lightText }}>Hospital</InputLabel>
            <Select
              name="hospital_id"
              value={filters.hospital_id || ''}
              onChange={onFilterChange}
              label="Hospital"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyan },
                }
              }}
            >
              <MenuItem value="">All Hospitals</MenuItem>
              {hospitalOptions.map((h) => (
                <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Autocomplete
            size="small"
            options={equipmentOptions}
            loading={loadingEquipment}
            value={equipmentOptions.find(e => e.value === filters.equipment_id) || null}
            onChange={(event, newValue) => {
              onFilterChange({ target: { name: 'equipment_id', value: newValue?.value || '' } })
            }}
            getOptionLabel={(option) => option.label || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Equipment"
                placeholder="Search equipment..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Inventory sx={{ color: colors.lightText, fontSize: 18 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyan },
                  }
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{option.label}</Typography>
                  <Typography variant="caption" sx={{ color: colors.lightText }}>
                    {option.hospital || ''} {option.model ? `• ${option.model}` : ''}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: colors.lightText }}>Equipment Status</InputLabel>
            <Select
              name="status"
              value={filters.status || ''}
              onChange={onFilterChange}
              label="Equipment Status"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyan },
                }
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Under Repair">Under Repair</MenuItem>
              <MenuItem value="Retired">Retired</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate || ''}
            onChange={onFilterChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyan },
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate || ''}
            onChange={onFilterChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyan },
              }
            }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2, borderColor: colors.borderColor }} />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          onClick={onApply}
          fullWidth
          sx={{
            bgcolor: colors.darkNavy,
            '&:hover': { 
              bgcolor: colors.darkNavyHover,
              boxShadow: `0 4px 24px ${colors.lightCyanGlowStrong}`,
            },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Apply Filters
        </Button>
        <Button
          variant="outlined"
          onClick={onClear}
          fullWidth
          sx={{
            borderColor: colors.darkNavy,
            color: colors.darkNavy,
            '&:hover': { 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              bgcolor: 'rgba(103, 232, 249, 0.05)',
            },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Clear All
        </Button>
      </Box>
    </Box>
  )

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onDrawerClose}
        onOpen={() => {}}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90vh',
            p: 2,
            bgcolor: '#FFFFFF'
          }
        }}
      >
        {filterContent}
      </SwipeableDrawer>
    )
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        sx: {
          p: 2.5,
          width: 520,
          maxHeight: '85vh',
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: `1px solid ${colors.borderColor}`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {filterContent}
    </Menu>
  )
}

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const Reports = () => {
  const { user } = useSelector((state) => state.auth)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Role check - Allow all users except HOSPITAL_ADMIN
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Reports." />
  }

  // State
  const [loading, setLoading] = useState(false)
  const [loadingEquipment, setLoadingEquipment] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [reportData, setReportData] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [error, setError] = useState(null)
  const [hospitalOptions, setHospitalOptions] = useState([])
  const [equipmentOptions, setEquipmentOptions] = useState([])
  const [filters, setFilters] = useState({
    period: 'month',
    hospital_id: '',
    equipment_id: '',
    status: '',
    startDate: '',
    endDate: '',
  })

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await api.get('/hospitals')
        const options = (response.data.hospitals || []).map(h => ({
          value: h.id.toString(),
          label: h.name
        }))
        setHospitalOptions(options)
      } catch (error) {
        console.error('Failed to fetch hospitals:', error)
      }
    }
    fetchHospitals()
  }, [])

  // Fetch equipment for dropdown
  useEffect(() => {
    const fetchEquipment = async () => {
      setLoadingEquipment(true)
      try {
        const response = await api.get('/equipment')
        const equipment = response.data.equipment || []
        const options = equipment.map(e => ({
          value: e.id.toString(),
          label: e.name || 'N/A',
          model: e.model || '',
          hospital: e.hospital_name || '',
          serial: e.serial_number || '',
        }))
        setEquipmentOptions(options)
      } catch (error) {
        console.error('Failed to fetch equipment:', error)
      } finally {
        setLoadingEquipment(false)
      }
    }
    fetchEquipment()
  }, [])

  // Generate report from backend
  const generateReport = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.period) params.append('period', filters.period)
      if (filters.hospital_id) params.append('hospital_id', filters.hospital_id)
      if (filters.equipment_id) params.append('equipment_id', filters.equipment_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const url = `/reports/downtime-complete?${params.toString()}`
      console.log('📊 Fetching:', url)

      const response = await api.get(url)
      const data = response.data

      if (data.success) {
        setReportData(data.data)
        setFilteredData(data.data.equipment || [])
        toast.success(`✅ Report generated! (${data.data.equipment?.length || 0} equipment)`)
      } else {
        throw new Error(data.message || 'Failed to generate report')
      }
    } catch (error) {
      console.error('❌ Report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Initial load
  useEffect(() => {
    generateReport()
  }, [])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      generateReport()
    }, 60000)
    return () => clearInterval(interval)
  }, [generateReport])

  // Apply filters
  const applyFilters = useCallback(() => {
    generateReport()
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
    toast.info('📊 Filters applied!')
  }, [generateReport])

  // Clear filters
  const clearFilters = () => {
    setFilters({
      period: 'month',
      hospital_id: '',
      equipment_id: '',
      status: '',
      startDate: '',
      endDate: '',
    })
    setSearchTerm('')
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
    toast.info('🧹 Filters cleared')
    setTimeout(generateReport, 100)
  }

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  // Handle view
  const handleView = (item) => {
    setSelectedItem(item)
    setOpenViewDialog(true)
  }

  // Export functions
  const exportToCSV = () => {
    if (!filteredData.length) {
      toast.warning('No data to export')
      return
    }

    try {
      const headers = [
        'Equipment', 'Model', 'Serial Number', 'Hospital', 'Department',
        'Status', 'Total Errors', 'Resolved', 'Pending', 'In Progress',
        'Downtime (Hours)', 'Downtime (Days)', 'Availability %',
        'Total Repairs', 'Completed Repairs', 'Avg Repair Days',
        'Spare Parts Used', 'Spare Parts Cost'
      ]

      let csv = headers.join(',') + '\n'
      filteredData.forEach(d => {
        const downtimeDays = calculateDowntimeDays(d.total_downtime_hours || 0)
        const row = [
          d.equipment_name || 'N/A',
          d.model || 'N/A',
          d.serial_number || 'N/A',
          d.hospital_name || 'N/A',
          d.department_name || 'N/A',
          d.current_status || 'N/A',
          d.total_errors || 0,
          d.resolved_errors || 0,
          d.pending_errors || 0,
          d.in_progress_errors || 0,
          safeToFixed(d.total_downtime_hours || 0, 2),
          safeToFixed(downtimeDays, 2),
          safeToFixed(d.availability_percentage || 100, 1),
          d.total_repairs || 0,
          d.completed_repairs || 0,
          safeToFixed(d.avg_repair_days || 0, 1),
          d.spare_parts_used || 0,
          safeToFixed(d.spare_parts_cost || 0, 2)
        ]
        csv += row.join(',') + '\n'
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `downtime_report_${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('✅ CSV exported!')
      setExportAnchorEl(null)
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportToExcel = () => {
    if (!filteredData.length) {
      toast.warning('No data to export')
      return
    }

    try {
      const headers = [
        'Equipment', 'Model', 'Serial Number', 'Hospital', 'Department',
        'Status', 'Total Errors', 'Resolved', 'Pending', 'In Progress',
        'Downtime (Hours)', 'Downtime (Days)', 'Availability %',
        'Total Repairs', 'Completed Repairs', 'Avg Repair Days',
        'Spare Parts Used', 'Spare Parts Cost'
      ]

      let html = `
        <html><head><meta charset="UTF-8"><style>
          body{font-family:Arial;padding:20px}
          h1{color:#0F172A;text-align:center}
          .sub{text-align:center;color:#64748B;font-size:12px;margin-bottom:15px}
          table{width:100%;border-collapse:collapse;margin-top:15px;font-size:10px}
          th{background:#0F172A;color:white;padding:6px;border:1px solid #1E293B;text-align:center}
          td{padding:5px;border:1px solid #ccc;text-align:center}
          tr:nth-child(even){background:#f5f7fa}
          .summary{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:15px}
          .card{border:1px solid #ccc;padding:10px;text-align:center;border-radius:4px}
          .label{font-size:11px;color:#64748B}
          .value{font-size:16px;font-weight:700;color:#0F172A}
        </style></head><body>
        <h1>Equipment Downtime Report</h1>
        <div class="sub">Generated: ${new Date().toLocaleString()}</div>
        <div class="summary">
          <div class="card"><div class="label">Total Equipment</div><div class="value">${filteredData.length}</div></div>
          <div class="card"><div class="label">Total Errors</div><div class="value">${reportData?.summary?.total_errors || 0}</div></div>
          <div class="card"><div class="label">Total Repairs</div><div class="value">${reportData?.summary?.total_repairs || 0}</div></div>
          <div class="card"><div class="label">Total Downtime (Days)</div><div class="value">${safeToFixed(reportData?.summary?.total_downtime_days || 0, 2)}</div></div>
          <div class="card"><div class="label">Avg Availability</div><div class="value">${safeToFixed(reportData?.summary?.avg_availability || 100, 1)}%</div></div>
        </div>
        <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
        ${filteredData.map(d => {
          const downtimeDays = calculateDowntimeDays(d.total_downtime_hours || 0)
          return `<tr>
            <td>${d.equipment_name || 'N/A'}</td>
            <td>${d.model || 'N/A'}</td>
            <td>${d.serial_number || 'N/A'}</td>
            <td>${d.hospital_name || 'N/A'}</td>
            <td>${d.department_name || 'N/A'}</td>
            <td>${d.current_status || 'N/A'}</td>
            <td>${d.total_errors || 0}</td>
            <td>${d.resolved_errors || 0}</td>
            <td>${d.pending_errors || 0}</td>
            <td>${d.in_progress_errors || 0}</td>
            <td>${safeToFixed(d.total_downtime_hours || 0, 2)}</td>
            <td>${safeToFixed(downtimeDays, 2)}</td>
            <td>${safeToFixed(d.availability_percentage || 100, 1)}%</td>
            <td>${d.total_repairs || 0}</td>
            <td>${d.completed_repairs || 0}</td>
            <td>${safeToFixed(d.avg_repair_days || 0, 1)}</td>
            <td>${d.spare_parts_used || 0}</td>
            <td>${safeToFixed(d.spare_parts_cost || 0, 2)}</td>
          </tr>`
        }).join('')}
        </tbody></table>
        <p style="text-align:center;color:#999;font-size:10px;margin-top:15px">PAEC Equipment Management System</p>
        </body></html>
      `

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `downtime_report_${new Date().toISOString().slice(0,10)}.xls`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('✅ Excel exported!')
      setExportAnchorEl(null)
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportToPDF = () => {
    if (!filteredData.length) {
      toast.warning('No data to export')
      return
    }

    try {
      const printWindow = window.open('', '_blank', 'width=1200,height=800')
      if (!printWindow) {
        toast.warning('Please allow pop-ups to export PDF')
        return
      }

      const headers = [
        'Equipment', 'Model', 'Hospital', 'Status',
        'Errors', 'Downtime (Days)', 'Availability'
      ]

      const rows = filteredData.map(d => {
        const downtimeDays = calculateDowntimeDays(d.total_downtime_hours || 0)
        const availability = parseFloat(d.availability_percentage) || 0
        const downtimeColor = downtimeDays > 10 ? '#EF4444' :
                              downtimeDays > 5 ? '#F59E0B' : '#0F172A'
        const availabilityColor = availability >= 90 ? '#22C55E' :
                                  availability >= 70 ? '#F59E0B' : '#EF4444'
        return `
        <tr>
          <td>${d.equipment_name || 'N/A'}</td>
          <td>${d.model || 'N/A'}</td>
          <td>${d.hospital_name || 'N/A'}</td>
          <td>${d.current_status || 'N/A'}</td>
          <td style="text-align:center">${d.total_errors || 0}</td>
          <td style="text-align:center;font-weight:700;color:${downtimeColor}">${safeToFixed(downtimeDays, 2)}</td>
          <td style="text-align:center;font-weight:700;color:${availabilityColor}">${safeToFixed(availability, 1)}%</td>
        </tr>
      `}).join('')

      printWindow.document.write(`
        <html><head><title>Equipment Downtime Report</title>
        <style>
          @page{size:A4 landscape;margin:10mm}
          *{box-sizing:border-box}
          body{font-family:Arial,sans-serif;color:#0F172A;padding:15px}
          h1{text-align:center;margin:0 0 5px;font-size:18px}
          .sub{text-align:center;color:#64748B;font-size:9px;margin-bottom:10px}
          .summary{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px}
          .card{border:1px solid #e5e7eb;border-radius:4px;padding:5px;text-align:center}
          .label{font-size:7px;color:#64748B}
          .value{font-size:12px;font-weight:700;color:#0F172A}
          table{width:100%;border-collapse:collapse;font-size:7px}
          th{background:#0F172A;color:white;padding:4px;border:1px solid #1E293B;text-align:center}
          td{padding:3px;border:1px solid #e5e7eb;text-align:center;vertical-align:middle}
          tr:nth-child(even){background:#f8faf9}
          .footer{margin-top:8px;text-align:center;font-size:7px;color:#999}
        </style></head><body>
        <h1>Equipment Downtime Report</h1>
        <div class="sub">PAEC Equipment Management System • ${new Date().toLocaleString()}</div>
        <div class="summary">
          <div class="card"><div class="label">Total Equipment</div><div class="value">${filteredData.length}</div></div>
          <div class="card"><div class="label">Total Errors</div><div class="value">${reportData?.summary?.total_errors || 0}</div></div>
          <div class="card"><div class="label">Total Repairs</div><div class="value">${reportData?.summary?.total_repairs || 0}</div></div>
          <div class="card"><div class="label">Total Downtime (Days)</div><div class="value">${safeToFixed(reportData?.summary?.total_downtime_days || 0, 2)}</div></div>
          <div class="card"><div class="label">Avg Availability</div><div class="value">${safeToFixed(reportData?.summary?.avg_availability || 100, 1)}%</div></div>
        </div>
        <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody></table>
        <div class="footer">PAEC Equipment Management System</div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }, 500);
          };
        </script>
        </body></html>
      `)
      printWindow.document.close()
      toast.info('🖨️ PDF print dialog opened — choose "Save as PDF"')
      setExportAnchorEl(null)
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  // Get data from report
  const equipmentData = reportData?.equipment || []
  const summary = reportData?.summary || {
    total_equipment: 0,
    total_errors: 0,
    total_resolved: 0,
    total_critical: 0,
    total_downtime_hours: 0,
    total_downtime_days: 0,
    total_repairs: 0,
    total_spare_parts_used: 0,
    avg_availability: 100,
    resolution_rate: 0
  }

  // Filter by search term
  const displayData = filteredData.filter(item => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (item.equipment_name || '').toLowerCase().includes(search) ||
      (item.model || '').toLowerCase().includes(search) ||
      (item.serial_number || '').toLowerCase().includes(search) ||
      (item.hospital_name || '').toLowerCase().includes(search) ||
      (item.department_name || '').toLowerCase().includes(search) ||
      (item.current_status || '').toLowerCase().includes(search)
    )
  })

  // Stats cards - ✅ UPDATED with proper values (2 decimal places for days)
  const statsCards = [
    { title: 'Total Equipment', value: summary.total_equipment || equipmentData.length, icon: <MedicalServices />, color: colors.lightCyan },
    { title: 'Total Errors', value: summary.total_errors || 0, icon: <ErrorOutline />, color: colors.error },
    { title: 'Total Repairs', value: summary.total_repairs || 0, icon: <Assessment />, color: colors.info },
    { title: 'Total Downtime', value: `${safeToFixed(summary.total_downtime_days || 0, 2)} days`, icon: <TimerOff />, color: colors.warning },
    { title: 'Avg Availability', value: `${safeToFixed(summary.avg_availability || 100, 1)}%`, icon: <TrendingUp />, color: colors.success },
  ]

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
    }}>
      {/* HEADER */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: '#0F172A',
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -6,
              left: 0,
              width: '40px',
              height: '3px',
              background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.darkNavy})`,
              borderRadius: '2px',
            }
          }}>
            Equipment Downtime Report
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mt: 1 }}>
            Complete downtime analysis with equipment, hospital, and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={generateReport}
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                transform: 'translateY(-2px)',
              },
            }}
            startIcon={loading ? <CircularProgress size={18} sx={{ color: colors.darkNavy }} /> : <Refresh />}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>

          <Button
            variant="contained"
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={loading || filteredData.length === 0}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                transform: 'translateY(-2px)',
              },
            }}
            startIcon={<Download />}
          >
            Export
          </Button>

          <Button
            variant="contained"
            onClick={() => isMobile ? setFilterDrawerOpen(true) : setFilterAnchorEl(document.getElementById('filter-button'))}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                transform: 'translateY(-2px)',
              },
            }}
            startIcon={<FilterList />}
            id="filter-button"
          >
            Filter
          </Button>
        </Box>
      </Box>

      {/* EXPORT MENU */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
        PaperProps={{
          sx: {
            p: 1,
            width: 200,
            borderRadius: 2,
            border: `1px solid ${colors.borderColor}`
          }
        }}
      >
        <MenuItem onClick={exportToCSV} sx={{ '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: '#3B82F6' }} />
          <Typography variant="body2">CSV</Typography>
        </MenuItem>
        <MenuItem onClick={exportToExcel} sx={{ '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
          <TableChart sx={{ mr: 1.5, fontSize: 20, color: '#22C55E' }} />
          <Typography variant="body2">Excel</Typography>
        </MenuItem>
        <MenuItem onClick={exportToPDF} sx={{ '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.05)' } }}>
          <PictureAsPdf sx={{ mr: 1.5, fontSize: 20, color: '#EF4444' }} />
          <Typography variant="body2">PDF</Typography>
        </MenuItem>
      </Menu>

      {/* FILTER MENU */}
      <FilterMenu
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
        open={filterDrawerOpen}
        onDrawerClose={() => setFilterDrawerOpen(false)}
        isMobile={isMobile}
        hospitalOptions={hospitalOptions}
        equipmentOptions={equipmentOptions}
        loadingEquipment={loadingEquipment}
      />

      {/* LOADING */}
      {loading && (
        <LinearProgress sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(103, 232, 249, 0.1)', '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
      )}

      {/* ERROR */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={generateReport}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* STATS CARDS */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={2.4} key={index}>
            <StatsCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              loading={loading}
              color={card.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* SEARCH BAR */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: 3, 
        borderRadius: 3, 
        border: `1px solid ${colors.borderColor}`,
        bgcolor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
      }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by equipment name, model, serial number, hospital, department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: colors.lightText }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: colors.lightText }}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyan },
              }
            }
          }}
        />
      </Paper>

      {/* TABLE */}
      <Paper sx={{ 
        borderRadius: 3, 
        overflow: 'hidden', 
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead sx={{ 
              bgcolor: colors.darkNavy,
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 140 }}>Equipment</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 100 }}>Model</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 130 }}>Hospital</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 100 }}>Department</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 90 }} align="center">Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 70 }} align="center">Errors</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 90 }} align="center">Downtime (Days)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 80 }} align="center">Availability</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 70 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: colors.lightCyan }} />
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Search sx={{ fontSize: 48, color: colors.lightText }} />
                      <Typography variant="body1" sx={{ color: colors.lightText }}>
                        No equipment data found matching your filters
                      </Typography>
                      <Button variant="outlined" size="small" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((item, index) => {
                  const availability = parseFloat(item.availability_percentage) || 0
                  const availabilityColor = availability >= 90 ? '#22C55E' :
                                            availability >= 70 ? '#F59E0B' : '#EF4444'
                  const downtimeDays = calculateDowntimeDays(item.total_downtime_hours || 0)
                  const downtimeColor = downtimeDays > 10 ? '#EF4444' :
                                        downtimeDays > 5 ? '#F59E0B' : '#0F172A'

                  return (
                    <TableRow 
                      key={item.id || index}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(103, 232, 249, 0.04)',
                        },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                          {item.equipment_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                          SN: {item.serial_number}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: colors.lightText }}>
                        {item.model}
                      </TableCell>
                      <TableCell sx={{ color: colors.lightText }}>
                        {item.hospital_name}
                      </TableCell>
                      <TableCell sx={{ color: colors.lightText }}>
                        {item.department_name}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.current_status}
                          size="small"
                          sx={{
                            bgcolor: item.current_status === 'Active' ? '#22C55E' :
                                     item.current_status === 'Maintenance' || item.current_status === 'Under Repair' ? '#F59E0B' :
                                     item.current_status === 'Inactive' || item.current_status === 'Retired' ? '#EF4444' : '#64748B',
                            color: 'white',
                            fontWeight: 500,
                            height: 22,
                            fontSize: '10px',
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: colors.darkNavy }}>
                        {item.total_errors}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: downtimeColor }}>
                        {safeToFixed(downtimeDays, 2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${safeToFixed(availability, 1)}%`}
                          size="small"
                          sx={{
                            bgcolor: availabilityColor,
                            color: 'white',
                            fontWeight: 600,
                            height: 22,
                            fontSize: '10px',
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleView(item)}
                            sx={{ 
                              color: colors.darkNavy, 
                              '&:hover': { 
                                color: colors.lightCyan,
                                bgcolor: 'rgba(103, 232, 249, 0.1)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* VIEW DIALOG */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy,
          color: 'white',
          borderBottom: `2px solid ${colors.lightCyan}`,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              Equipment Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedItem && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.04)', borderRadius: 2, border: `1px solid ${colors.lightCyan}` }}>
                  <Typography variant="h5" sx={{ color: colors.darkNavy, fontWeight: 700 }}>
                    {selectedItem.equipment_name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={`Model: ${selectedItem.model}`} size="small" sx={{ bgcolor: colors.darkNavy, color: 'white' }} />
                    <Chip label={`SN: ${selectedItem.serial_number}`} size="small" sx={{ bgcolor: colors.darkNavy, color: 'white' }} />
                    <Chip 
                      label={selectedItem.current_status} 
                      size="small" 
                      sx={{
                        bgcolor: selectedItem.current_status === 'Active' ? '#22C55E' :
                                 selectedItem.current_status === 'Maintenance' || selectedItem.current_status === 'Under Repair' ? '#F59E0B' : '#EF4444',
                        color: 'white',
                        fontWeight: 600,
                      }} 
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, mb: 1, fontWeight: 600 }}>
                  📍 Location
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Hospital</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedItem.hospital_name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Department</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedItem.department_name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Installation Year</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedItem.installation_year || 'N/A'}</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, mb: 1, fontWeight: 600 }}>
                  📊 Error & Performance
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Total Errors</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.total_errors}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Resolved</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#22C55E' }}>{selectedItem.resolved_errors}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Pending</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#F59E0B' }}>{selectedItem.pending_errors}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>In Progress</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#3B82F6' }}>{selectedItem.in_progress_errors}</Typography>
                  </Box>
                  <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Downtime (Hours)</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#EF4444' }}>
                      {safeToFixed(selectedItem.total_downtime_hours || 0, 2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Downtime (Days)</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#EF4444' }}>
                      {safeToFixed(calculateDowntimeDays(selectedItem.total_downtime_hours || 0), 2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Availability</Typography>
                    <Chip
                      label={`${safeToFixed(selectedItem.availability_percentage || 100, 1)}%`}
                      size="small"
                      sx={{
                        bgcolor: parseFloat(selectedItem.availability_percentage) >= 90 ? '#22C55E' :
                                 parseFloat(selectedItem.availability_percentage) >= 70 ? '#F59E0B' : '#EF4444',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, mb: 1, fontWeight: 600 }}>
                  🔧 Repairs & Spare Parts
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Total Repairs</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.total_repairs}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Completed Repairs</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#22C55E' }}>{selectedItem.completed_repairs}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Avg Repair Days</Typography>
                    <Typography variant="body2" fontWeight={600}>{safeToFixed(selectedItem.avg_repair_days || 0, 1)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Spare Parts Used</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.spare_parts_used}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Spare Parts Cost</Typography>
                    <Typography variant="body2" fontWeight={600}>Rs. {safeToFixed(selectedItem.spare_parts_cost, 2)}</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, mb: 1, fontWeight: 600 }}>
                  📅 Timeline
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>First Error</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDate(selectedItem.first_error_date)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Last Error</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDate(selectedItem.last_error_date)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Current Error Status</Typography>
                    <Chip
                      label={selectedItem.current_error_status || 'None'}
                      size="small"
                      sx={{
                        bgcolor: selectedItem.current_error_status === 'Resolved' || selectedItem.current_error_status === 'Closed' ? '#22C55E' :
                                 selectedItem.current_error_status === 'Pending' ? '#F59E0B' :
                                 selectedItem.current_error_status === 'In Progress' ? '#3B82F6' : '#64748B',
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '10px',
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenViewDialog(false)}
            variant="contained"
            sx={{
              bgcolor: colors.darkNavy,
              '&:hover': { bgcolor: colors.darkNavyHover },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Reports