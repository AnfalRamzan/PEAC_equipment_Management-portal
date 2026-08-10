// src/pages/Reports.jsx - FIXED WITH REAL API DATA FETCH

// ============================================================
// ✅ IMPORTANT: This is the FIXED version with:
// 1. Real API data fetching (not mock data)
// 2. Proper refresh functionality (clears old data before fetching)
// 3. Loading states that actually work
// 4. Error handling with retry
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  RadioGroup,
  Radio,
  FormLabel,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Stack,
  Fade,
  Grow,
  Skeleton,
  SwipeableDrawer,
  Collapse,
  Snackbar
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  Close,
  Refresh,
  Assessment,
  ErrorOutline,
  Build,
  MedicalServices,
  Engineering,
  BarChart,
  Business,
  Warning,
  Inventory,
  AccessTime,
  Person,
  History,
  Description,
  PictureAsPdf,
  TableChart,
  FileDownload,
  Print,
  Schedule,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Cancel,
  CalendarToday,
  EventNote,
  Speed,
  Assignment,
  FilterList,
  DateRange,
  Today,
  ViewWeek,
  CalendarViewMonth,
  Clear,
  MoreVert,
  GetApp,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CloudOff
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================

const getStatusColor = (status) => {
  const colors = {
    'Pending': 'warning',
    'In Progress': 'info',
    'Completed': 'success',
    'Resolved': 'success',
    'Closed': 'default',
    'Active': 'success',
    'Inactive': 'error',
    'Open': 'info',
    'Scheduled': 'info',
    'Overdue': 'error',
    'Cancelled': 'default',
    'Approved': 'success',
    'Rejected': 'error',
    'Ordered': 'info',
    'Received': 'success',
    'Draft': 'default',
    'Critical': 'error',
    'High': 'warning',
    'Medium': 'info',
    'Low': 'success'
  }
  return colors[status] || 'default'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

// ============================================================
// ✅ EXPORT FUNCTIONS
// ============================================================

const exportToCSV = async (data, filename = 'report') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    let csvContent = headers.join(',') + '\n'
    
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header] || ''
        if (typeof value === 'object') {
          value = JSON.stringify(value)
        }
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csvContent += values.join(',') + '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`✅ CSV exported successfully! (${data.length} records)`)
  } catch (error) {
    toast.error('Failed to export CSV')
    console.error('Export error:', error)
  }
}

const exportToExcel = async (data, filename = 'report') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    
    let tableHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        th { background: #0B5FA5; color: white; font-weight: bold; }
        td, th { padding: 8px 12px; border: 1px solid #ccc; }
      </style>
      </head><body>
      <table>
      <thead><tr>`
    
    headers.forEach(header => {
      tableHTML += `<th>${header}</th>`
    })
    
    tableHTML += `</tr></thead><tbody>`
    
    data.forEach(row => {
      tableHTML += `<tr>`
      headers.forEach(header => {
        let value = row[header] || ''
        if (typeof value === 'object') {
          value = JSON.stringify(value)
        }
        tableHTML += `<td>${value}</td>`
      })
      tableHTML += `</tr>`
    })
    
    tableHTML += `</tbody></table></body></html>`
    
    const blob = new Blob([tableHTML], { 
      type: 'application/vnd.ms-excel;charset=utf-8' 
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`✅ Excel exported successfully! (${data.length} records)`)
  } catch (error) {
    toast.error('Failed to export Excel')
    console.error('Export error:', error)
  }
}

const exportToPDF = async (data, filename = 'report') => {
  if (!data || data.length === 0) {
    toast.warning('No data to export')
    return
  }

  try {
    const headers = Object.keys(data[0])
    
    let html = `
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0B5FA5; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0B5FA5; color: white; padding: 10px; text-align: left; }
          td { padding: 8px 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f5f5f5; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${filename.replace(/_/g, ' ').toUpperCase()}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${data.length}</p>
        <table>
          <thead><tr>`
    
    headers.forEach(header => {
      html += `<th>${header}</th>`
    })
    
    html += `</tr></thead><tbody>`
    
    data.forEach(row => {
      html += `<tr>`
      headers.forEach(header => {
        let value = row[header] || ''
        if (typeof value === 'object') {
          value = JSON.stringify(value)
        }
        html += `<td>${value}</td>`
      })
      html += `</tr>`
    })
    
    html += `
          </tbody></table>
          <div class="footer">PAEC Equipment Management System</div>
        </body>
      </html>
    `
    
    const blob = new Blob([html], { type: 'text/html' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.html`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`✅ PDF (HTML) exported successfully! (${data.length} records)`)
  } catch (error) {
    toast.error('Failed to export PDF')
    console.error('Export error:', error)
  }
}

// ============================================================
// ✅ STATS CARD COMPONENT
// ============================================================
const StatsCard = ({ title, value, color, bgColor, icon, loading }) => {
  return (
    <Grow in timeout={300}>
      <Card sx={{ 
        borderRadius: 2,
        bgcolor: bgColor || 'white',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        height: '100%'
      }}>
        <CardContent sx={{ 
          textAlign: 'center', 
          py: { xs: 1.5, sm: 2 },
          px: { xs: 1, sm: 2 }
        }}>
          {loading ? (
            <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto' }} />
          ) : (
            <>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: color || '#0B5FA5', 
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}
              >
                {value || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {icon && <Box sx={{ fontSize: 16, color: color || '#0B5FA5' }}>{icon}</Box>}
                <Typography 
                  variant="body2" 
                  color="textSecondary"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                >
                  {title}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Grow>
  )
}

// ============================================================
// ✅ FILTER MENU COMPONENT
// ============================================================
const FilterMenu = ({ 
  anchorEl, 
  onClose, 
  filters, 
  onFilterChange, 
  onApply, 
  onClear,
  period,
  onPeriodChange,
  periodOptions,
  reportTypes,
  selectedReportType,
  onReportTypeChange,
  additionalFilters = [],
  open,
  onOpen,
  onDrawerClose,
  isMobile
}) => {
  const filterContent = (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: '#0B5FA5' }}>
        Filter Reports
      </Typography>
      
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>
          Report Period
        </FormLabel>
        <RadioGroup
          row
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          sx={{ flexWrap: 'wrap', gap: 0.5 }}
        >
          {periodOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio size="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption">{option.label}</Typography>
                </Box>
              }
              sx={{ 
                m: 0.5,
                '& .MuiFormControlLabel-label': { fontSize: '0.75rem' }
              }}
            />
          ))}
        </RadioGroup>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Report Type</InputLabel>
        <Select
          name="reportType"
          value={selectedReportType}
          onChange={(e) => onReportTypeChange(e.target.value)}
          label="Report Type"
        >
          {reportTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">{type.label}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate || ''}
            onChange={onFilterChange}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate || ''}
            onChange={onFilterChange}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Grid>
      </Grid>

      {additionalFilters.map((filter, index) => (
        <FormControl fullWidth size="small" sx={{ mb: 2 }} key={index}>
          <InputLabel>{filter.label}</InputLabel>
          <Select
            name={filter.name}
            value={filters[filter.name] || ''}
            onChange={onFilterChange}
            label={filter.label}
          >
            <MenuItem value="">All</MenuItem>
            {filter.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          name="status"
          value={filters.status || ''}
          onChange={onFilterChange}
          label="Status"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="Resolved">Resolved</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          onClick={onApply} 
          fullWidth={isMobile}
          sx={{ flex: isMobile ? 1 : 1, bgcolor: '#0B5FA5' }}
          size="small"
        >
          Apply Filters
        </Button>
        <Button 
          variant="outlined" 
          onClick={onClear} 
          fullWidth={isMobile}
          sx={{ flex: isMobile ? 1 : 1 }}
          size="small"
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
        onOpen={onOpen}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90vh',
            p: 2
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
          p: 2, 
          width: 380, 
          maxHeight: '80vh',
          borderRadius: 2
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
// ✅ ENGINEER REPORTS - FIXED WITH REAL API DATA
// ============================================================
const EngineerReports = () => {
  const { user } = useSelector((state) => state.auth)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReport, setSelectedReport] = useState('my-errors')
  const [reportData, setReportData] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [period, setPeriod] = useState('monthly')
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    startDate: '',
    endDate: '',
    period: 'monthly'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  const engineerReportTypes = [
    { value: 'my-errors', label: 'My Error Reports', color: '#dc3545' },
    { value: 'my-repairs', label: 'My Repair Reports', color: '#28a745' },
    { value: 'my-equipment', label: 'My Equipment Reports', color: '#0B5FA5' },
    { value: 'my-performance', label: 'My Performance', color: '#6f42c1' },
    { value: 'my-pending-tasks', label: 'My Pending Tasks', color: '#ff9800' }
  ]

  const additionalFilters = [
    {
      name: 'severity',
      label: 'Severity',
      options: [
        { value: 'Critical', label: 'Critical' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' }
      ]
    }
  ]

  // ============================================================
  // ✅ FETCH REAL DATA FROM API
  // ============================================================
  const generateReport = useCallback(async (type) => {
    const reportType = type || selectedReport
    
    setLoading(true)
    setError(null)
    
    try {
      console.log(`📊 Generating ${reportType} report...`)
      
      let endpoint = ''
      let response = null
      
      // ✅ Map report type to API endpoint
      switch(reportType) {
        case 'my-errors':
          endpoint = '/errors'
          response = await api.get(endpoint)
          // Filter errors reported by current user
          const allErrors = response.data.errors || []
          const myErrors = allErrors.filter(e => e.reported_by === user?.id)
          setReportData({
            success: true,
            data: myErrors,
            total: myErrors.length,
            generatedAt: new Date().toISOString(),
            period: period,
            filters: filters,
            type: reportType
          })
          break
          
        case 'my-repairs':
          endpoint = '/repairs'
          response = await api.get(endpoint)
          // Filter repairs assigned to current user
          const allRepairs = response.data.repairs || []
          const myRepairs = allRepairs.filter(r => r.engineer_id === user?.id)
          setReportData({
            success: true,
            data: myRepairs,
            total: myRepairs.length,
            generatedAt: new Date().toISOString(),
            period: period,
            filters: filters,
            type: reportType
          })
          break
          
        case 'my-equipment':
          endpoint = '/equipment'
          response = await api.get(endpoint)
          // Filter equipment by hospital (for engineer's hospital)
          const allEquipment = response.data.equipment || []
          const myEquipment = allEquipment.filter(e => e.hospital_id === user?.hospital_id)
          setReportData({
            success: true,
            data: myEquipment,
            total: myEquipment.length,
            generatedAt: new Date().toISOString(),
            period: period,
            filters: filters,
            type: reportType
          })
          break
          
        case 'my-performance':
          // Get errors and repairs for performance metrics
          const [errorsRes, repairsRes] = await Promise.all([
            api.get('/errors'),
            api.get('/repairs')
          ])
          
          const userErrors = errorsRes.data.errors?.filter(e => e.reported_by === user?.id) || []
          const userRepairs = repairsRes.data.repairs?.filter(r => r.engineer_id === user?.id) || []
          
          const completedRepairs = userRepairs.filter(r => r.status === 'Completed' || r.status === 'Resolved')
          const pendingRepairs = userRepairs.filter(r => r.status === 'Pending' || r.status === 'In Progress')
          const resolvedErrors = userErrors.filter(e => e.status === 'Resolved' || e.status === 'Closed')
          const openErrors = userErrors.filter(e => e.status === 'Pending' || e.status === 'In Progress')
          
          setReportData({
            success: true,
            data: {
              total_repairs: userRepairs.length,
              completed_repairs: completedRepairs.length,
              pending_repairs: pendingRepairs.length,
              success_rate: userRepairs.length > 0 ? Math.round((completedRepairs.length / userRepairs.length) * 100) : 0,
              avg_time_taken: userRepairs.length > 0 ? Math.round(userRepairs.reduce((sum, r) => sum + (r.time_taken || 0), 0) / userRepairs.length) : 0,
              total_errors: userErrors.length,
              resolved_errors: resolvedErrors.length,
              open_errors: openErrors.length,
              resolution_rate: userErrors.length > 0 ? Math.round((resolvedErrors.length / userErrors.length) * 100) : 0
            },
            total: 1,
            generatedAt: new Date().toISOString(),
            period: period,
            filters: filters,
            type: reportType
          })
          break
          
        case 'my-pending-tasks':
          // Get pending errors and repairs
          const [pendingErrorsRes, pendingRepairsRes] = await Promise.all([
            api.get('/errors?status=Pending,In Progress'),
            api.get('/repairs?status=Pending,In Progress')
          ])
          
          const pendingErrors = pendingErrorsRes.data.errors?.filter(e => e.reported_by === user?.id) || []
          const pendingRepairsTasks = pendingRepairsRes.data.repairs?.filter(r => r.engineer_id === user?.id) || []
          
          // Format as tasks
          const tasks = [
            ...pendingErrors.map(e => ({
              task_type: 'error',
              title: e.error_title,
              equipment_name: e.equipment_name,
              status: e.status,
              created_at: e.created_at,
              id: e.id
            })),
            ...pendingRepairsTasks.map(r => ({
              task_type: 'repair',
              title: `Repair: ${r.root_cause || 'N/A'}`,
              equipment_name: r.equipment_name,
              status: r.status,
              created_at: r.created_at,
              id: r.id
            }))
          ]
          
          setReportData({
            success: true,
            data: tasks,
            total: tasks.length,
            generatedAt: new Date().toISOString(),
            period: period,
            filters: filters,
            type: reportType
          })
          break
          
        default:
          toast.warning('Unknown report type')
          setLoading(false)
          return
      }
      
      toast.success(`✅ ${reportType.replace('-', ' ')} report generated!`)
      
    } catch (error) {
      console.error('❌ Report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [selectedReport, period, filters, user])

  // ============================================================
  // ✅ INITIAL LOAD
  // ============================================================
  useEffect(() => {
    generateReport('my-errors')
  }, [])

  // ============================================================
  // ✅ HANDLERS
  // ============================================================
  const handleView = (item) => {
    setSelectedItem(item)
    setOpenViewDialog(true)
  }

  const handleDelete = (item) => {
    setSelectedItem(item)
    setOpenDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedItem || !selectedReport) return
    
    try {
      // Determine which API endpoint to use
      let endpoint = ''
      if (selectedReport === 'my-errors') {
        endpoint = `/errors/${selectedItem.id}`
      } else if (selectedReport === 'my-repairs') {
        endpoint = `/repairs/${selectedItem.id}`
      } else {
        toast.info('This report type does not support deletion')
        setOpenDeleteDialog(false)
        setSelectedItem(null)
        return
      }
      
      await api.delete(endpoint)
      toast.success(`✅ "${selectedItem.error_title || selectedItem.title || 'Report'}" deleted successfully!`)
      
      // Refresh the report
      generateReport(selectedReport)
      setOpenDeleteDialog(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete')
      setOpenDeleteDialog(false)
      setSelectedItem(null)
    }
  }

  const handleExport = async (format) => {
    const data = getFilteredData
    
    if (!data || data.length === 0) {
      toast.warning('No data to export. Please generate a report first.')
      return
    }

    const filename = `${selectedReport}_${period}`

    switch(format) {
      case 'CSV':
        await exportToCSV(data, filename)
        break
      case 'Excel':
        await exportToExcel(data, filename)
        break
      case 'PDF':
        await exportToPDF(data, filename)
        break
      default:
        toast.info('Export format not supported')
    }
    
    setExportAnchorEl(null)
  }

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  // ============================================================
  // ✅ FILTER DATA
  // ============================================================
  const getFilteredData = useMemo(() => {
    const data = reportData?.data || []
    
    if (!Array.isArray(data)) return data
    
    let filtered = data.filter(item => {
      if (!searchTerm || searchTerm.trim() === '') return true
      
      const searchLower = searchTerm.toLowerCase().trim()
      
      const searchableFields = [
        item.error_title,
        item.title,
        item.name,
        item.equipment_name,
        item.root_cause,
        item.error_code,
        item.model,
        item.manufacturer,
        item.hospital_name,
        item.status,
        item.severity,
        item.task_type
      ].filter(Boolean).map(f => f.toLowerCase())
      
      return searchableFields.some(field => field.includes(searchLower))
    })
    
    if (filters.status) {
      filtered = filtered.filter(item => 
        item.status?.toLowerCase() === filters.status.toLowerCase()
      )
    }
    
    if (filters.severity) {
      filtered = filtered.filter(item => 
        item.severity?.toLowerCase() === filters.severity.toLowerCase()
      )
    }
    
    return filtered
  }, [reportData?.data, searchTerm, filters.status, filters.severity])

  const filteredData = getFilteredData
  const totalRecords = Array.isArray(filteredData) ? filteredData.length : 0
  const completedCount = Array.isArray(filteredData) ? filteredData.filter(d => d.status === 'Completed' || d.status === 'Resolved').length : 0
  const pendingCount = Array.isArray(filteredData) ? filteredData.filter(d => d.status === 'Pending' || d.status === 'In Progress').length : 0
  const criticalCount = Array.isArray(filteredData) ? filteredData.filter(d => d.severity === 'Critical' || d.status === 'Critical').length : 0

  const handleFilterClick = (event) => {
    if (isMobile) {
      setFilterDrawerOpen(true)
    } else {
      setFilterAnchorEl(event.currentTarget)
    }
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handlePeriodChange = (value) => {
    setPeriod(value)
    setFilters({ ...filters, period: value })
  }

  const handleReportTypeChange = (value) => {
    setSelectedReport(value)
  }

  const applyFilters = () => {
    handleFilterClose()
    generateReport(selectedReport)
    toast.info('📊 Filters applied successfully!')
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      severity: '',
      startDate: '',
      endDate: '',
      period: 'monthly'
    })
    setPeriod('monthly')
    setSearchTerm('')
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
    toast.info('🧹 Filters cleared')
  }

  const handleRefresh = () => {
    setReportData(null)
    generateReport(selectedReport)
    toast.info('🔄 Refreshing report data...')
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  // ============================================================
  // ✅ RENDER
  // ============================================================
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* HEADER */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3, 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            color: '#2C3E50',
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
          }}>
            My Reports
          </Typography>
          {searchTerm && (
            <Chip 
              label={`Search: "${searchTerm}"`} 
              size="small" 
              color="primary"
              onDelete={() => setSearchTerm('')}
            />
          )}
          {filters.status && (
            <Chip 
              label={`Status: ${filters.status}`} 
              size="small" 
              color="warning"
              onDelete={() => setFilters({ ...filters, status: '' })}
            />
          )}
        </Box>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap', 
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' }
        }}>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
            sx={{ flex: { xs: '1 1 auto', sm: 'none' } }}
            startIcon={loading ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            onClick={handleExportClick}
            disabled={loading || filteredData.length === 0}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              flex: { xs: '1 1 auto', sm: 'none' },
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#094a80' }
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* ✅ LOADING INDICATOR */}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {/* ✅ ERROR DISPLAY */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => generateReport(selectedReport)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* EXPORT MENU */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{
          sx: {
            p: 1,
            width: 200,
            borderRadius: 2
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleExport('CSV')} sx={{ gap: 1 }}>
          <TableChart fontSize="small" sx={{ color: '#0B5FA5' }} />
          <Typography variant="body2">Export as CSV</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleExport('Excel')} sx={{ gap: 1 }}>
          <TableChart fontSize="small" sx={{ color: '#28a745' }} />
          <Typography variant="body2">Export as Excel</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleExport('PDF')} sx={{ gap: 1 }}>
          <PictureAsPdf fontSize="small" sx={{ color: '#dc3545' }} />
          <Typography variant="body2">Export as PDF</Typography>
        </MenuItem>
      </Menu>

      {/* STATS CARDS */}
      <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Total Records" 
            value={totalRecords} 
            color="#0B5FA5"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Completed" 
            value={completedCount} 
            color="#28a745"
            bgColor="#e8f5e9"
            icon={<CheckCircle fontSize="small" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Pending" 
            value={pendingCount} 
            color="#ff9800"
            bgColor="#fff3e0"
            icon={<Schedule fontSize="small" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Critical" 
            value={criticalCount} 
            color="#dc3545"
            bgColor="#ffebee"
            icon={<ErrorOutline fontSize="small" />}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* SEARCH & FILTER */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5, 
          alignItems: { xs: 'stretch', sm: 'center' } 
        }}>
          <TextField
            size="small"
            placeholder="Search by title, equipment, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {isMobile && (
            <Button
              variant="outlined"
              onClick={toggleFilters}
              endIcon={showFilters ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              fullWidth
              size="small"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          )}

          {!isMobile && (
            <>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={selectedReport}
                  onChange={(e) => {
                    setSelectedReport(e.target.value)
                    generateReport(e.target.value)
                  }}
                  label="Report Type"
                >
                  {engineerReportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value)
                    setFilters({ ...filters, period: e.target.value })
                  }}
                  label="Period"
                >
                  {periodOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                onClick={handleFilterClick}
              >
                Filter
              </Button>
              <Button 
                variant="contained" 
                onClick={() => generateReport(selectedReport)} 
                disabled={loading} 
                sx={{ bgcolor: '#0B5FA5' }}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </>
          )}
        </Box>

        {isMobile && (
          <Collapse in={showFilters} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={selectedReport}
                  onChange={(e) => {
                    setSelectedReport(e.target.value)
                    generateReport(e.target.value)
                  }}
                  label="Report Type"
                >
                  {engineerReportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value)
                    setFilters({ ...filters, period: e.target.value })
                  }}
                  label="Period"
                >
                  {periodOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleFilterClick}
                  fullWidth
                  size="small"
                >
                  Filter
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => generateReport(selectedReport)} 
                  disabled={loading} 
                  sx={{ bgcolor: '#0B5FA5' }}
                  fullWidth
                  size="small"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        )}
      </Paper>

      {/* FILTER MENU / DRAWER */}
      <FilterMenu
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        open={filterDrawerOpen}
        onOpen={() => setFilterDrawerOpen(true)}
        onDrawerClose={handleFilterClose}
        isMobile={isMobile}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
        period={period}
        onPeriodChange={handlePeriodChange}
        periodOptions={periodOptions}
        reportTypes={engineerReportTypes}
        selectedReportType={selectedReport}
        onReportTypeChange={handleReportTypeChange}
        additionalFilters={additionalFilters}
      />

      {/* TABLE */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#0B5FA5' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Title</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Equipment</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <LinearProgress sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box sx={{ py: 4 }}>
                      <Search sx={{ fontSize: 48, color: '#6c757d', mb: 1 }} />
                      <Typography variant="body1" color="textSecondary">
                        {searchTerm || filters.status || filters.severity 
                          ? 'No results found matching your search/filters' 
                          : 'No reports found. Click "Generate Report" to create a report.'}
                      </Typography>
                      {(searchTerm || filters.status || filters.severity) && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={clearFilters}
                          sx={{ mt: 1 }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {item.error_title || item.title || item.name || 'N/A'}
                      </Typography>
                      {item.error_code && (
                        <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', sm: 'inline' } }}>
                          Code: {item.error_code}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {item.equipment_name || item.name || 'N/A'}
                      </Typography>
                      {item.model && (
                        <Typography variant="caption" display="block" color="textSecondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>
                          {item.model}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          color: item.status === 'Critical' || item.status === 'Error' ? '#dc3545' :
                                 item.status === 'Pending' ? '#ff9800' :
                                 item.status === 'Completed' || item.status === 'Resolved' ? '#28a745' :
                                 item.status === 'In Progress' ? '#0B5FA5' :
                                 '#6c757d'
                        }}
                      >
                        {item.status || 'N/A'}
                      </Typography>
                      {item.severity && (
                        <Typography 
                          variant="caption" 
                          display="block" 
                          sx={{ 
                            fontSize: { xs: '0.6rem', sm: '0.7rem' },
                            color: item.severity === 'Critical' ? '#dc3545' :
                                   item.severity === 'High' ? '#ff9800' :
                                   item.severity === 'Medium' ? '#0B5FA5' :
                                   '#28a745'
                          }}
                        >
                          {item.severity}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                        {formatDate(item.created_at || item.repair_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleView(item)}
                        >
                          <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                      {(selectedReport === 'my-errors' || selectedReport === 'my-repairs') && (
                        <Tooltip title="Delete Report">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(item)}
                          >
                            <Delete fontSize={isMobile ? 'small' : 'medium'} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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
      >
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Report Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedItem && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid #0B5FA5' }}>
                  <Typography variant="h6" sx={{ color: '#0B5FA5', fontWeight: 600 }}>
                    {selectedItem.error_title || selectedItem.title || selectedItem.name || 'Report'}
                  </Typography>
                  {selectedItem.error_code && (
                    <Chip 
                      label={`Error Code: ${selectedItem.error_code}`} 
                      size="small" 
                      sx={{ mt: 1, bgcolor: '#0B5FA5', color: 'white' }}
                    />
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Equipment Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">Equipment Name</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedItem.equipment_name || selectedItem.name || 'N/A'}
                    </Typography>
                  </Box>
                  {selectedItem.model && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">Model</Typography>
                      <Typography variant="body2" fontWeight={500}>{selectedItem.model}</Typography>
                    </Box>
                  )}
                  {selectedItem.manufacturer && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">Manufacturer</Typography>
                      <Typography variant="body2" fontWeight={500}>{selectedItem.manufacturer}</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Status Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">Status</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{
                        color: selectedItem?.status === 'Critical' || selectedItem?.status === 'Error' ? '#dc3545' :
                               selectedItem?.status === 'Pending' ? '#ff9800' :
                               selectedItem?.status === 'Completed' || selectedItem?.status === 'Resolved' ? '#28a745' :
                               selectedItem?.status === 'In Progress' ? '#0B5FA5' :
                               '#6c757d'
                      }}
                    >
                      {selectedItem.status || 'N/A'}
                    </Typography>
                  </Box>
                  {selectedItem.severity && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">Severity</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight={500}
                        sx={{
                          color: selectedItem.severity === 'Critical' ? '#dc3545' :
                                 selectedItem.severity === 'High' ? '#ff9800' :
                                 selectedItem.severity === 'Medium' ? '#0B5FA5' :
                                 '#28a745'
                        }}
                      >
                        {selectedItem.severity}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Date & Time
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">Created Date</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedItem.created_at || selectedItem.repair_date || selectedItem.date)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Export Options */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Export Options
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const dataToExport = [selectedItem]
                      exportToPDF(dataToExport, `${selectedReport}_${selectedItem.id}`)
                    }} 
                    sx={{ bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' } }}
                  >
                    Export as PDF
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)} 
            variant="contained" 
            sx={{ bgcolor: '#0B5FA5' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#dc3545', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete />
            <Typography variant="h6" fontWeight={600}>Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete this report?
          </Alert>
          {selectedItem && (
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Title:</strong> {selectedItem.error_title || selectedItem.title || selectedItem.name || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Equipment:</strong> {selectedItem.equipment_name || selectedItem.name || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {selectedItem.status || 'N/A'}
              </Typography>
            </Box>
          )}
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

// ============================================================
// ✅ ADMIN REPORTS - FIXED WITH REAL API DATA
// ============================================================
const AdminReports = () => {
  const { user } = useSelector((state) => state.auth)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [reportType, setReportType] = useState('monthly')
  const [reportData, setReportData] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [period, setPeriod] = useState('monthly')
  const [filters, setFilters] = useState({
    status: '',
    hospital: '',
    startDate: '',
    endDate: '',
    period: 'monthly',
    department: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  const adminReportTypes = [
    { value: 'monthly', label: 'Monthly Error Report' },
    { value: 'weekly', label: 'Weekly Error Report' },
    { value: 'daily', label: 'Daily Error Report' },
    { value: 'yearly', label: 'Yearly Error Report' },
    { value: 'hospital', label: 'Hospital-wise Report' },
    { value: 'equipment', label: 'Equipment-wise Report' },
    { value: 'failure', label: 'Failure Frequency' },
    { value: 'spare-parts', label: 'Spare Parts Usage' },
    { value: 'maintenance', label: 'Maintenance History' },
    { value: 'downtime', label: 'Equipment Downtime' },
    { value: 'engineer-performance', label: 'Engineer Performance' },
    { value: 'amc', label: 'AMC Expiry' }
  ]

  const additionalFilters = [
    {
      name: 'hospital',
      label: 'Hospital',
      options: [
        { value: 'PAEC Hospital', label: 'PAEC Hospital' },
        { value: 'City Hospital', label: 'City Hospital' },
        { value: 'General Hospital', label: 'General Hospital' }
      ]
    },
    {
      name: 'department',
      label: 'Department',
      options: [
        { value: 'Cardiology', label: 'Cardiology' },
        { value: 'Neurology', label: 'Neurology' },
        { value: 'Orthopedics', label: 'Orthopedics' },
        { value: 'Emergency', label: 'Emergency' }
      ]
    }
  ]

  // ============================================================
  // ✅ FETCH REAL DATA FROM API
  // ============================================================
  const generateReport = useCallback(async (type, periodVal) => {
    const reportTypeVal = type || reportType
    const periodValActual = periodVal || period
    
    setLoading(true)
    setError(null)
    
    try {
      console.log(`📊 Generating ${reportTypeVal} report for ${periodValActual} period...`)
      
      let endpoint = ''
      let response = null
      let data = []
      
      // ✅ Map report type to API endpoint with appropriate parameters
      switch(reportTypeVal) {
        case 'monthly':
        case 'weekly':
        case 'daily':
        case 'yearly':
          endpoint = '/errors'
          response = await api.get(endpoint, {
            params: {
              period: periodValActual,
              ...(filters.startDate && { startDate: filters.startDate }),
              ...(filters.endDate && { endDate: filters.endDate }),
              ...(filters.status && { status: filters.status }),
              ...(filters.hospital && { hospital: filters.hospital })
            }
          })
          data = response.data.errors || []
          break
          
        case 'hospital':
          endpoint = '/hospitals'
          response = await api.get(endpoint)
          // Get hospital stats
          const hospitals = response.data.hospitals || []
          const hospitalStats = await Promise.all(hospitals.map(async (h) => {
            const equipRes = await api.get(`/equipment?hospital_id=${h.id}`)
            const errorRes = await api.get(`/errors?hospital_id=${h.id}`)
            return {
              hospital_name: h.name,
              equipment_count: equipRes.data.equipment?.length || 0,
              error_count: errorRes.data.errors?.length || 0,
              open_errors: errorRes.data.errors?.filter(e => e.status === 'Pending' || e.status === 'In Progress').length || 0,
              resolved_errors: errorRes.data.errors?.filter(e => e.status === 'Resolved' || e.status === 'Closed').length || 0,
              city: h.city,
              state: h.state
            }
          }))
          data = hospitalStats
          break
          
        case 'equipment':
          endpoint = '/equipment'
          response = await api.get(endpoint, {
            params: {
              ...(filters.hospital && { hospital_id: filters.hospital })
            }
          })
          const equipmentList = response.data.equipment || []
          // Get error counts for each equipment
          const equipmentWithErrors = await Promise.all(equipmentList.map(async (e) => {
            const errorRes = await api.get(`/errors/equipment/${e.id}`)
            return {
              ...e,
              error_count: errorRes.data.errors?.length || 0,
              open_errors: errorRes.data.errors?.filter(err => err.status === 'Pending' || err.status === 'In Progress').length || 0,
              resolved_errors: errorRes.data.errors?.filter(err => err.status === 'Resolved' || err.status === 'Closed').length || 0
            }
          }))
          data = equipmentWithErrors
          break
          
        case 'spare-parts':
          endpoint = '/spare-parts'
          response = await api.get(endpoint)
          data = response.data.spareParts || []
          break
          
        case 'maintenance':
          endpoint = '/maintenance'
          response = await api.get(endpoint)
          data = response.data.schedules || []
          break
          
        case 'engineer-performance':
          endpoint = '/users'
          response = await api.get(endpoint)
          const allUsers = response.data.users || []
          const engineers = allUsers.filter(u => u.role_name === 'ENGINEER')
          
          const engineerStats = await Promise.all(engineers.map(async (eng) => {
            const repairRes = await api.get(`/repairs/engineer/${eng.id}`)
            const repairs = repairRes.data.repairs || []
            const completed = repairs.filter(r => r.status === 'Completed' || r.status === 'Resolved')
            const pending = repairs.filter(r => r.status === 'Pending' || r.status === 'In Progress')
            
            return {
              engineer_name: eng.full_name,
              total_repairs: repairs.length,
              completed_repairs: completed.length,
              pending_repairs: pending.length,
              success_rate: repairs.length > 0 ? Math.round((completed.length / repairs.length) * 100) : 0,
              avg_time_taken: repairs.length > 0 ? Math.round(repairs.reduce((sum, r) => sum + (r.time_taken || 0), 0) / repairs.length) : 0
            }
          }))
          data = engineerStats
          break
          
        case 'amc':
          endpoint = '/amc'
          response = await api.get(endpoint)
          data = response.data.contracts || []
          break
          
        default:
          toast.warning('Unknown report type')
          setLoading(false)
          return
      }
      
      setReportData({
        success: true,
        data: data,
        total: data.length,
        generatedAt: new Date().toISOString(),
        period: periodValActual,
        filters: filters,
        type: reportTypeVal
      })
      
      toast.success(`✅ ${reportTypeVal.replace('-', ' ')} report generated!`)
      
    } catch (error) {
      console.error('❌ Report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [reportType, period, filters])

  // ============================================================
  // ✅ INITIAL LOAD
  // ============================================================
  useEffect(() => {
    generateReport('monthly', 'monthly')
  }, [])

  // ============================================================
  // ✅ HANDLERS
  // ============================================================
  const handleView = (item) => {
    setSelectedItem(item)
    setOpenViewDialog(true)
  }

  const handleDelete = async (item) => {
    setSelectedItem(item)
    setOpenDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedItem) return
    
    try {
      // Determine which API endpoint to use based on report type
      let endpoint = ''
      if (reportType === 'monthly' || reportType === 'weekly' || reportType === 'daily' || reportType === 'yearly') {
        endpoint = `/errors/${selectedItem.id}`
      } else if (reportType === 'spare-parts') {
        endpoint = `/spare-parts/${selectedItem.id}`
      } else if (reportType === 'maintenance') {
        endpoint = `/maintenance/${selectedItem.id}`
      } else if (reportType === 'amc') {
        endpoint = `/amc/${selectedItem.id}`
      } else {
        toast.info('This report type does not support deletion')
        setOpenDeleteDialog(false)
        setSelectedItem(null)
        return
      }
      
      await api.delete(endpoint)
      toast.success(`✅ "${selectedItem.name || selectedItem.title || selectedItem.error_title || 'Report'}" deleted successfully!`)
      
      // Refresh the report
      generateReport(reportType, period)
      setOpenDeleteDialog(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.message || 'Failed to delete')
      setOpenDeleteDialog(false)
      setSelectedItem(null)
    }
  }

  const handleExport = async (format) => {
    const data = getFilteredData
    
    if (!data || data.length === 0) {
      toast.warning('No data to export. Please generate a report first.')
      return
    }

    const filename = `${reportType}_${period}`

    switch(format) {
      case 'CSV':
        await exportToCSV(data, filename)
        break
      case 'Excel':
        await exportToExcel(data, filename)
        break
      case 'PDF':
        await exportToPDF(data, filename)
        break
      default:
        toast.info('Export format not supported')
    }
    
    setExportAnchorEl(null)
  }

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  const handleRefresh = () => {
    setReportData(null)
    generateReport(reportType, period)
    toast.info('🔄 Refreshing report data...')
  }

  // ============================================================
  // ✅ FILTER DATA
  // ============================================================
  const getFilteredData = useMemo(() => {
    const data = reportData?.data || []
    
    if (!Array.isArray(data)) return data
    
    let filtered = data.filter(item => {
      if (!searchTerm || searchTerm.trim() === '') return true
      
      const searchLower = searchTerm.toLowerCase().trim()
      
      const searchableFields = [
        item.name,
        item.title,
        item.hospital_name,
        item.equipment_name,
        item.type,
        item.status,
        item.city,
        item.state,
        item.manufacturer,
        item.model,
        item.part_name,
        item.error_title,
        item.engineer_name
      ].filter(Boolean).map(f => f.toLowerCase())
      
      return searchableFields.some(field => field.includes(searchLower))
    })
    
    if (filters.status) {
      filtered = filtered.filter(item => 
        item.status?.toLowerCase() === filters.status.toLowerCase()
      )
    }
    
    if (filters.hospital) {
      filtered = filtered.filter(item => 
        item.hospital_name?.toLowerCase() === filters.hospital.toLowerCase() ||
        item.hospital_id?.toString() === filters.hospital
      )
    }
    
    return filtered
  }, [reportData?.data, searchTerm, filters.status, filters.hospital])

  const filteredData = getFilteredData

  const handleFilterClick = (event) => {
    if (isMobile) {
      setFilterDrawerOpen(true)
    } else {
      setFilterAnchorEl(event.currentTarget)
    }
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handlePeriodChange = (value) => {
    setPeriod(value)
    setFilters({ ...filters, period: value })
  }

  const handleReportTypeChange = (value) => {
    setReportType(value)
  }

  const applyFilters = () => {
    handleFilterClose()
    generateReport(reportType, period)
    toast.info('📊 Filters applied successfully!')
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      hospital: '',
      startDate: '',
      endDate: '',
      period: 'monthly',
      department: ''
    })
    setPeriod('monthly')
    setSearchTerm('')
    setFilterAnchorEl(null)
    setFilterDrawerOpen(false)
    toast.info('🧹 Filters cleared')
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  // ============================================================
  // ✅ RENDER
  // ============================================================
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* HEADER */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3, 
        gap: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 700, 
            color: '#2C3E50',
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
          }}>
            Reports & Analytics
          </Typography>
          {searchTerm && (
            <Chip 
              label={`Search: "${searchTerm}"`} 
              size="small" 
              color="primary"
              onDelete={() => setSearchTerm('')}
            />
          )}
        </Box>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap', 
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' }
        }}>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
            sx={{ flex: { xs: '1 1 auto', sm: 'none' } }}
            startIcon={loading ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Refresh />}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            onClick={handleExportClick}
            disabled={loading || filteredData.length === 0}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              flex: { xs: '1 1 auto', sm: 'none' },
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#094a80' }
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* ✅ LOADING INDICATOR */}
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {/* ✅ ERROR DISPLAY */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => generateReport(reportType, period)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* EXPORT MENU */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{
          sx: {
            p: 1,
            width: 200,
            borderRadius: 2
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleExport('CSV')} sx={{ gap: 1 }}>
          <TableChart fontSize="small" sx={{ color: '#0B5FA5' }} />
          <Typography variant="body2">Export as CSV</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleExport('Excel')} sx={{ gap: 1 }}>
          <TableChart fontSize="small" sx={{ color: '#28a745' }} />
          <Typography variant="body2">Export as Excel</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleExport('PDF')} sx={{ gap: 1 }}>
          <PictureAsPdf fontSize="small" sx={{ color: '#dc3545' }} />
          <Typography variant="body2">Export as PDF</Typography>
        </MenuItem>
      </Menu>

      {/* STATS CARDS */}
      <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Total Reports" 
            value={filteredData.length} 
            color="#0B5FA5"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Completed" 
            value={filteredData.filter(d => d.status === 'Completed' || d.status === 'Resolved').length} 
            color="#28a745"
            bgColor="#e8f5e9"
            icon={<CheckCircle fontSize="small" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Pending" 
            value={filteredData.filter(d => d.status === 'Pending' || d.status === 'In Progress').length} 
            color="#ff9800"
            bgColor="#fff3e0"
            icon={<Schedule fontSize="small" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Total Types" 
            value={new Set(filteredData.map(d => d.type)).size} 
            color="#6f42c1"
            bgColor="#f3e5f5"
            icon={<BarChart fontSize="small" />}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* SEARCH & FILTER */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5, 
          alignItems: { xs: 'stretch', sm: 'center' } 
        }}>
          <TextField
            size="small"
            placeholder="Search by title, type, status, hospital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {isMobile && (
            <Button
              variant="outlined"
              onClick={toggleFilters}
              endIcon={showFilters ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              fullWidth
              size="small"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          )}

          {!isMobile && (
            <>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value)
                    generateReport(e.target.value, period)
                  }}
                  label="Report Type"
                >
                  {adminReportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value)
                    setFilters({ ...filters, period: e.target.value })
                  }}
                  label="Period"
                >
                  {periodOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                onClick={handleFilterClick}
              >
                Filter
              </Button>
              <Button 
                variant="contained" 
                onClick={() => generateReport(reportType, period)} 
                disabled={loading} 
                sx={{ bgcolor: '#0B5FA5' }}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </>
          )}
        </Box>

        {isMobile && (
          <Collapse in={showFilters} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value)
                    generateReport(e.target.value, period)
                  }}
                  label="Report Type"
                >
                  {adminReportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value)
                    setFilters({ ...filters, period: e.target.value })
                  }}
                  label="Period"
                >
                  {periodOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleFilterClick}
                  fullWidth
                  size="small"
                >
                  Filter
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => generateReport(reportType, period)} 
                  disabled={loading} 
                  sx={{ bgcolor: '#0B5FA5' }}
                  fullWidth
                  size="small"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
              </Box>
            </Box>
          </Collapse>
        )}
      </Paper>

      {/* FILTER MENU / DRAWER */}
      <FilterMenu
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        open={filterDrawerOpen}
        onOpen={() => setFilterDrawerOpen(true)}
        onDrawerClose={handleFilterClose}
        isMobile={isMobile}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onClear={clearFilters}
        period={period}
        onPeriodChange={handlePeriodChange}
        periodOptions={periodOptions}
        reportTypes={adminReportTypes}
        selectedReportType={reportType}
        onReportTypeChange={handleReportTypeChange}
        additionalFilters={additionalFilters}
      />

      {/* TABLE */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#0B5FA5' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Title</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Hospital</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <LinearProgress sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 4 }}>
                      <Search sx={{ fontSize: 48, color: '#6c757d', mb: 1 }} />
                      <Typography variant="body1" color="textSecondary">
                        {searchTerm || filters.status || filters.hospital 
                          ? 'No results found matching your search/filters' 
                          : 'No reports found. Click "Generate Report" to create a report.'}
                      </Typography>
                      {(searchTerm || filters.status || filters.hospital) && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={clearFilters}
                          sx={{ mt: 1 }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {item.title || item.name || item.error_title || item.equipment_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {item.type || item.category || 'Report'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          color: item.status === 'Critical' || item.status === 'Error' ? '#dc3545' :
                                 item.status === 'Pending' ? '#ff9800' :
                                 item.status === 'Completed' || item.status === 'Resolved' ? '#28a745' :
                                 item.status === 'In Progress' ? '#0B5FA5' :
                                 '#6c757d'
                        }}
                      >
                        {item.status || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                        {formatDate(item.created_at || item.date || item.repair_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                        {item.hospital_name || item.hospital || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleView(item)}
                        >
                          <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                      {reportType !== 'hospital' && reportType !== 'engineer-performance' && (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(item)}
                          >
                            <Delete fontSize={isMobile ? 'small' : 'medium'} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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
      >
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Report Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedItem && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid #0B5FA5' }}>
                  <Typography variant="h6" sx={{ color: '#0B5FA5', fontWeight: 600 }}>
                    {selectedItem.title || selectedItem.name || selectedItem.error_title || 'Report'}
                  </Typography>
                  <Chip 
                    label={selectedItem.type || selectedItem.category || 'Report'} 
                    size="small" 
                    sx={{ mt: 1, bgcolor: '#0B5FA5', color: 'white' }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Report Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">Report Type</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedItem.type || selectedItem.category || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">Status</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{
                        color: selectedItem.status === 'Completed' ? '#28a745' :
                               selectedItem.status === 'Pending' ? '#ff9800' :
                               selectedItem.status === 'In Progress' ? '#0B5FA5' :
                               '#6c757d'
                      }}
                    >
                      {selectedItem.status || 'N/A'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Location Information
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">Hospital</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedItem.hospital_name || selectedItem.hospital || 'N/A'}</Typography>
                  </Box>
                  {selectedItem.department && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">Department</Typography>
                      <Typography variant="body2" fontWeight={500}>{selectedItem.department}</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Date & Time
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">Report Date</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatDateTime(selectedItem.created_at || selectedItem.date || selectedItem.repair_date)}
                    </Typography>
                  </Box>
                  {selectedItem.generated_at && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">Generated At</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatDateTime(selectedItem.generated_at)}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Export Options */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1, fontWeight: 600 }}>
                  Export Options
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      const dataToExport = [selectedItem]
                      exportToPDF(dataToExport, `${reportType}_${selectedItem.id || 'item'}`)
                    }} 
                    sx={{ bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' } }}
                  >
                    Export as PDF
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)} 
            variant="contained" 
            sx={{ bgcolor: '#0B5FA5' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#dc3545', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete />
            <Typography variant="h6" fontWeight={600}>Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete this report?
          </Alert>
          {selectedItem && (
            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Title:</strong> {selectedItem.title || selectedItem.name || selectedItem.error_title || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {selectedItem.type || selectedItem.category || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {selectedItem.status || 'N/A'}
              </Typography>
            </Box>
          )}
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

// ============================================================
// ✅ MAIN REPORTS COMPONENT
// ============================================================
const Reports = () => {
  const { user } = useSelector((state) => state.auth)
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN'
  
  if (isEngineer) {
    return <EngineerReports />
  }
  
  if (isSuperAdmin || isHospitalAdmin) {
    return <AdminReports />
  }
  
  return <AccessDenied message="You do not have permission to view reports." />
}

export default Reports
