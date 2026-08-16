// src/pages/Reports.jsx
// ✅ FIXED: Type conversion for equipment_id matching

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
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Grow,
} from '@mui/material'
import {
  Search,
  Visibility,
  Download,
  Close,
  Refresh,
  ErrorOutline,
  MedicalServices,
  CheckCircle,
  Cancel,
  FilterList,
  FileDownload,
  TableChart,
  PictureAsPdf,
  Clear,
  Build,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import AccessDenied from '../components/Auth/AccessDenied'
import api from '../api/axios'

const colors = {
  darkNavy: '#0F172A',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  text: '#FFFFFF',
  lightText: '#64748B',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

const safeToFixed = (value, decimals = 2) => {
  const n = parseFloat(value)
  return isNaN(n) ? '0.00' : n.toFixed(decimals)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

const getStatusColor = (status) => {
  const s = status?.toLowerCase() || ''
  if (s === 'active' || s === 'resolved' || s === 'completed') return '#22C55E'
  if (s === 'pending' || s === 'in progress') return '#F59E0B'
  if (s === 'inactive' || s === 'cancelled') return '#EF4444'
  if (s === 'maintenance') return '#3B82F6'
  return '#64748B'
}

// ✅ Calculate downtime from errors (SAME AS ERROR LOGS)
const calculateDowntimeFromErrors = (errors) => {
  let totalHours = 0
  errors.forEach(error => {
    if (error.status === 'Resolved' || error.status === 'Closed' || error.status === 'Completed') {
      const startDate = error.error_date || error.created_at
      const endDate = error.resolved_at || error.updated_at
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffMs = end - start
        const diffHours = diffMs / (1000 * 60 * 60)
        if (diffHours > 0) totalHours += diffHours
      }
    }
  })
  return totalHours
}

const StatsCard = ({ title, value, icon, loading, color = colors.lightCyan }) => (
  <Grow in timeout={300}>
    <Card sx={{
      borderRadius: 3,
      bgcolor: '#FFFFFF',
      transition: 'all 0.3s ease',
      border: `1px solid ${colors.borderColor}`,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
        borderColor: colors.lightCyan,
      },
      height: '100%'
    }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        {loading ? (
          <CircularProgress size={30} sx={{ color: colors.lightCyan }} />
        ) : (
          <>
            <Avatar sx={{ bgcolor: 'rgba(103, 232, 249, 0.08)', width: 40, height: 40, mx: 'auto', mb: 1 }}>
              {React.cloneElement(icon, { sx: { fontSize: 22, color: color } })}
            </Avatar>
            <Typography variant="h4" sx={{ color: '#0F172A', fontWeight: 700 }}>
              {value || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              {title}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  </Grow>
)

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const Reports = () => {
  const { user } = useSelector((state) => state.auth)

  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Reports." />
  }

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [reportData, setReportData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [error, setError] = useState(null)
  const [hospitalOptions, setHospitalOptions] = useState([])
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filters, setFilters] = useState({ hospital_id: '' })
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    total_errors: 0,
    total_repairs: 0,
    total_downtime_days: 0,
  })

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

  // Generate report
  const generateReport = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('📊 Fetching data for report...')
      
      const [equipmentRes, errorsRes, repairsRes] = await Promise.all([
        api.get('/equipment'),
        api.get('/errors'),
        api.get('/repairs')
      ])

      const equipment = equipmentRes.data.equipment || []
      const errors = errorsRes.data.errors || []
      const repairs = repairsRes.data.repairs || []

      console.log('✅ Equipment:', equipment.length)
      console.log('✅ Errors:', errors.length)
      console.log('✅ Repairs:', repairs.length)

      // ✅ CRITICAL FIX: Match errors with equipment using Number() conversion
      let items = equipment.map(eq => {
        const eqErrors = errors.filter(e => Number(e.equipment_id) === Number(eq.id))
        const eqRepairs = repairs.filter(r => Number(r.equipment_id) === Number(eq.id))
        
        const downtimeHours = calculateDowntimeFromErrors(eqErrors)
        const downtimeDays = downtimeHours / 24
        
        const totalHours = 8760
        const availability = totalHours > 0 
          ? Math.max(0, Math.min(100, ((totalHours - downtimeHours) / totalHours) * 100))
          : 100

        const resolvedErrors = eqErrors.filter(e => 
          ['Resolved', 'Closed', 'Completed'].includes(e.status)
        ).length

        return {
          id: eq.id,
          equipment_name: eq.name || 'N/A',
          model: eq.model || 'N/A',
          serial_number: eq.serial_number || 'N/A',
          hospital_name: eq.hospital_name || 'N/A',
          hospital_id: eq.hospital_id || null,
          department_name: eq.department_name || 'N/A',
          current_status: eq.status || 'Active',
          total_errors: eqErrors.length,
          resolved_errors: resolvedErrors,
          open_errors: eqErrors.length - resolvedErrors,
          total_repairs: eqRepairs.length,
          completed_repairs: eqRepairs.filter(r => r.status === 'Completed').length,
          total_downtime_hours: downtimeHours,
          total_downtime_days: downtimeDays,
          availability_percentage: availability,
          equipment_added_on: eq.created_at || eq.date_of_installation || null,
        }
      })

      if (filters.hospital_id) {
        items = items.filter(item => item.hospital_id === parseInt(filters.hospital_id))
      }

      console.log('📊 Items with errors:', items.filter(i => i.total_errors > 0).length)
      console.log('📊 Items with downtime:', items.filter(i => i.total_downtime_days > 0).length)

      setReportData(items)
      setFilteredData(items)
      
      const totalDowntimeDays = items.reduce((sum, i) => sum + (i.total_downtime_days || 0), 0)
      
      setSummaryStats({
        total: items.length,
        active: items.filter(i => i.current_status === 'Active').length,
        maintenance: items.filter(i => i.current_status === 'Maintenance' || i.current_status === 'Under Repair').length,
        total_errors: items.reduce((sum, i) => sum + (i.total_errors || 0), 0),
        total_repairs: items.reduce((sum, i) => sum + (i.total_repairs || 0), 0),
        total_downtime_days: totalDowntimeDays,
      })
      
      toast.success(`✅ Report generated! (${items.length} equipment records)`)
    } catch (error) {
      console.error('❌ Report generation error:', error)
      setError(error.response?.data?.message || 'Failed to generate report')
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    generateReport()
  }, [generateReport])

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const applyFilters = () => {
    generateReport()
    setFilterAnchorEl(null)
    toast.info('📊 Filters applied!')
  }

  const clearFilters = () => {
    setFilters({ hospital_id: '' })
    setSearchTerm('')
    setFilterAnchorEl(null)
    toast.info('🧹 Filters cleared')
    setTimeout(generateReport, 100)
  }

  const handleView = (item) => {
    setSelectedItem(item)
    setOpenViewDialog(true)
  }

  const displayData = filteredData.filter(item => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (item.equipment_name || '').toLowerCase().includes(search) ||
      (item.model || '').toLowerCase().includes(search) ||
      (item.hospital_name || '').toLowerCase().includes(search) ||
      (item.current_status || '').toLowerCase().includes(search)
    )
  })

  const statsCards = [
    { title: 'Total Equipment', value: summaryStats.total || displayData.length, icon: <MedicalServices />, color: colors.lightCyan },
    { title: 'Active', value: summaryStats.active || 0, icon: <CheckCircle />, color: colors.success },
    { title: 'Maintenance', value: summaryStats.maintenance || 0, icon: <Build />, color: colors.warning },
    { title: 'Total Errors', value: summaryStats.total_errors || 0, icon: <ErrorOutline />, color: colors.error },
    { title: 'Total Repairs', value: summaryStats.total_repairs || 0, icon: <Build />, color: colors.info },
  ]

  // Export functions
  const exportToCSV = () => {
    if (!displayData.length) { toast.warning('No data'); return }
    try {
      const headers = ['Equipment Name', 'Model', 'Serial Number', 'Hospital', 'Department', 'Status', 'Total Errors', 'Resolved Errors', 'Open Errors', 'Total Repairs', 'Completed Repairs', 'Downtime (Days)', 'Availability %']
      let csv = headers.join(',') + '\n'
      displayData.forEach(item => {
        const row = [
          `"${item.equipment_name || 'N/A'}"`,
          `"${item.model || 'N/A'}"`,
          `"${item.serial_number || 'N/A'}"`,
          `"${item.hospital_name || 'N/A'}"`,
          `"${item.department_name || 'N/A'}"`,
          `"${item.current_status || 'N/A'}"`,
          item.total_errors || 0,
          item.resolved_errors || 0,
          item.open_errors || 0,
          item.total_repairs || 0,
          item.completed_repairs || 0,
          safeToFixed(item.total_downtime_days || 0, 2),
          safeToFixed(item.availability_percentage || 100, 1),
        ]
        csv += row.join(',') + '\n'
      })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `equipment_report_${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('✅ CSV exported!')
      setExportAnchorEl(null)
    } catch (err) { toast.error('Export failed') }
  }

  const exportToExcel = () => {
    if (!displayData.length) { toast.warning('No data'); return }
    try {
      const data = displayData.map(item => ({
        'Equipment Name': item.equipment_name || 'N/A',
        'Model': item.model || 'N/A',
        'Serial Number': item.serial_number || 'N/A',
        'Hospital': item.hospital_name || 'N/A',
        'Department': item.department_name || 'N/A',
        'Status': item.current_status || 'N/A',
        'Total Errors': item.total_errors || 0,
        'Resolved Errors': item.resolved_errors || 0,
        'Open Errors': item.open_errors || 0,
        'Total Repairs': item.total_repairs || 0,
        'Completed Repairs': item.completed_repairs || 0,
        'Downtime (Days)': safeToFixed(item.total_downtime_days || 0, 2),
        'Availability %': safeToFixed(item.availability_percentage || 100, 1),
      }))
      import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Equipment Report')
        XLSX.writeFile(wb, `equipment_report_${new Date().toISOString().slice(0,10)}.xlsx`)
        toast.success('✅ Excel exported!')
        setExportAnchorEl(null)
      })
    } catch (err) { toast.error('Export failed') }
  }

  const exportToPDF = () => {
    if (!displayData.length) { toast.warning('No data'); return }
    try {
      const printWindow = window.open('', '_blank', 'width=1200,height=800')
      if (!printWindow) { toast.warning('Please allow pop-ups'); return }
      const headers = ['Equipment', 'Model', 'Hospital', 'Department', 'Status', 'Errors', 'Repairs', 'Downtime (Days)', 'Availability']
      const totalDowntime = displayData.reduce((sum, i) => sum + (i.total_downtime_days || 0), 0)
      const avgAvailability = displayData.length > 0 ? displayData.reduce((sum, i) => sum + (i.availability_percentage || 100), 0) / displayData.length : 100
      const rows = displayData.map(item => `
        <tr>
          <td>${item.equipment_name || 'N/A'}</td>
          <td>${item.model || 'N/A'}</td>
          <td>${item.hospital_name || 'N/A'}</td>
          <td>${item.department_name || 'N/A'}</td>
          <td>${item.current_status || 'N/A'}</td>
          <td style="text-align:center">${item.total_errors || 0}</td>
          <td style="text-align:center">${item.total_repairs || 0}</td>
          <td style="text-align:center;font-weight:700;color:${item.total_downtime_days > 10 ? '#EF4444' : item.total_downtime_days > 5 ? '#F59E0B' : '#0F172A'}">${safeToFixed(item.total_downtime_days || 0, 2)}d</td>
          <td style="text-align:center">${safeToFixed(item.availability_percentage || 100, 1)}%</td>
        </tr>
      `).join('')
      printWindow.document.write(`
        <html><head><title>Equipment Report</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Arial; padding: 15px; }
          h1 { text-align: center; font-size: 18px; }
          .sub { text-align: center; color: #64748B; font-size: 9px; }
          .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 10px; }
          .card { border: 1px solid #e5e7eb; border-radius: 4px; padding: 5px; text-align: center; }
          .label { font-size: 7px; color: #64748B; }
          .value { font-size: 12px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; font-size: 7px; }
          th { background: #0F172A; color: white; padding: 4px; border: 1px solid #1E293B; }
          td { padding: 3px; border: 1px solid #e5e7eb; text-align: center; }
          tr:nth-child(even) { background: #f8faf9; }
        </style></head><body>
        <h1>Equipment Report</h1>
        <div class="sub">PAEC Equipment Management System • ${new Date().toLocaleString()}</div>
        <div class="summary">
          <div class="card"><div class="label">Total Equipment</div><div class="value">${displayData.length}</div></div>
          <div class="card"><div class="label">Total Errors</div><div class="value">${summaryStats.total_errors || 0}</div></div>
          <div class="card"><div class="label">Total Repairs</div><div class="value">${summaryStats.total_repairs || 0}</div></div>
          <div class="card"><div class="label">Total Downtime (Days)</div><div class="value">${safeToFixed(totalDowntime, 2)}d</div></div>
          <div class="card"><div class="label">Avg Availability</div><div class="value">${safeToFixed(avgAvailability, 1)}%</div></div>
        </div>
        <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody></table>
        <script>setTimeout(() => { window.print(); window.onafterprint = function() { window.close(); } }, 500);</script>
        </body></html>
      `)
      printWindow.document.close()
      toast.info('🖨️ PDF print dialog opened')
      setExportAnchorEl(null)
    } catch (err) { toast.error('Export failed') }
  }

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
            '&::after': {
              content: '""',
              display: 'block',
              width: '40px',
              height: '3px',
              background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.darkNavy})`,
              borderRadius: '2px',
              mt: 1,
            }
          }}>
            Equipment Report
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mt: 1 }}>
            Complete equipment analysis with downtime calculation (same as Error Logs)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={generateReport}
            disabled={loading}
            sx={{
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              },
            }}
            startIcon={loading ? <CircularProgress size={18} sx={{ color: colors.darkNavy }} /> : <Refresh />}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>

          <Button
            variant="contained"
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={loading || displayData.length === 0}
            sx={{
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
              },
            }}
            startIcon={<Download />}
          >
            Export
          </Button>

          <Button
            variant="contained"
            onClick={() => setFilterAnchorEl(true)}
            sx={{
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
              },
            }}
            startIcon={<FilterList />}
          >
            Filter
          </Button>
        </Box>
      </Box>

      {/* FILTER SECTION */}
      {filterAnchorEl && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${colors.borderColor}` }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Hospital</InputLabel>
              <Select
                name="hospital_id"
                value={filters.hospital_id || ''}
                onChange={handleFilterChange}
                label="Hospital"
              >
                <MenuItem value="">All Hospitals</MenuItem>
                {hospitalOptions.map((h) => (
                  <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={applyFilters} sx={{ bgcolor: colors.darkNavy }}>
              Apply
            </Button>
            <Button variant="outlined" onClick={clearFilters}>
              Clear
            </Button>
            <Button variant="text" onClick={() => setFilterAnchorEl(false)}>
              Close
            </Button>
          </Box>
        </Paper>
      )}

      {/* EXPORT MENU */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
        PaperProps={{ sx: { p: 1, width: 200, borderRadius: 2 } }}
      >
        <MenuItem onClick={exportToCSV}>
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: '#3B82F6' }} />
          CSV
        </MenuItem>
        <MenuItem onClick={exportToExcel}>
          <TableChart sx={{ mr: 1.5, fontSize: 20, color: '#22C55E' }} />
          Excel
        </MenuItem>
        <MenuItem onClick={exportToPDF}>
          <PictureAsPdf sx={{ mr: 1.5, fontSize: 20, color: '#EF4444' }} />
          PDF
        </MenuItem>
      </Menu>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} action={
          <Button color="inherit" size="small" onClick={generateReport}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* STATS CARDS */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={2.4} key={index}>
            <StatsCard {...card} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* SEARCH BAR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: `1px solid ${colors.borderColor}` }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by equipment name, model, hospital..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: colors.lightText }} /></InputAdornment>,
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}><Clear fontSize="small" /></IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: 2 }
          }}
        />
      </Paper>

      {/* TABLE */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${colors.borderColor}` }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: colors.darkNavy }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Equipment</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Model</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Hospital</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Errors</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Repairs</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Downtime (Days)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Availability</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : displayData.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" sx={{ color: colors.lightText }}>No data found</Typography>
                  <Button variant="outlined" size="small" onClick={clearFilters} sx={{ mt: 1 }}>Clear Filters</Button>
                </TableCell></TableRow>
              ) : (
                displayData.map((item, index) => {
                  const availability = item.availability_percentage || 100
                  const availabilityColor = availability >= 90 ? '#22C55E' : availability >= 70 ? '#F59E0B' : '#EF4444'
                  const downtimeDays = item.total_downtime_days || 0
                  const downtimeColor = downtimeDays > 10 ? '#EF4444' : downtimeDays > 5 ? '#F59E0B' : '#0F172A'

                  return (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.04)' } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                          {item.equipment_name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>SN: {item.serial_number || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: colors.lightText }}>{item.model || 'N/A'}</TableCell>
                      <TableCell sx={{ color: colors.lightText }}>{item.hospital_name || 'N/A'}</TableCell>
                      <TableCell sx={{ color: colors.lightText }}>{item.department_name || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Chip label={item.current_status || 'N/A'} size="small" sx={{ bgcolor: getStatusColor(item.current_status), color: 'white', fontWeight: 500, height: 22, fontSize: '10px', borderRadius: 2 }} />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{item.total_errors || 0}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{item.total_repairs || 0}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: downtimeColor }}>
                        {safeToFixed(downtimeDays, 2)}d
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${safeToFixed(availability, 1)}%`} size="small" sx={{ bgcolor: availabilityColor, color: 'white', fontWeight: 600, height: 22, fontSize: '10px', borderRadius: 2 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleView(item)} sx={{ color: colors.darkNavy, '&:hover': { color: colors.lightCyan } }}>
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
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.darkNavy, color: 'white', borderBottom: `2px solid ${colors.lightCyan}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Equipment Details</Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedItem && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.04)', borderRadius: 2, border: `1px solid ${colors.lightCyan}` }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedItem.equipment_name || 'N/A'}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={`Model: ${selectedItem.model || 'N/A'}`} size="small" sx={{ bgcolor: colors.darkNavy, color: 'white' }} />
                    <Chip label={`SN: ${selectedItem.serial_number || 'N/A'}`} size="small" sx={{ bgcolor: colors.darkNavy, color: 'white' }} />
                    <Chip label={selectedItem.current_status || 'N/A'} size="small" sx={{ bgcolor: getStatusColor(selectedItem.current_status), color: 'white' }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600 }}>📍 Location</Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Hospital</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedItem.hospital_name || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Department</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedItem.department_name || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Added On</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDate(selectedItem.equipment_added_on)}</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600 }}>📊 Metrics</Typography>
                <Paper sx={{ p: 2, bgcolor: 'rgba(103, 232, 249, 0.02)', borderRadius: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Total Errors</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.total_errors || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Resolved Errors</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#22C55E' }}>{selectedItem.resolved_errors || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Open Errors</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#F59E0B' }}>{selectedItem.open_errors || 0}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Total Repairs</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.total_repairs || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Completed Repairs</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#22C55E' }}>{selectedItem.completed_repairs || 0}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Downtime (Days)</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: selectedItem.total_downtime_days > 10 ? '#EF4444' : selectedItem.total_downtime_days > 5 ? '#F59E0B' : '#0F172A' }}>
                      {safeToFixed(selectedItem.total_downtime_days || 0, 2)}d
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Availability</Typography>
                    <Chip label={`${safeToFixed(selectedItem.availability_percentage || 100, 1)}%`} size="small" sx={{ bgcolor: selectedItem.availability_percentage >= 90 ? '#22C55E' : selectedItem.availability_percentage >= 70 ? '#F59E0B' : '#EF4444', color: 'white', fontWeight: 600 }} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenViewDialog(false)} variant="contained" sx={{ bgcolor: colors.darkNavy }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Reports