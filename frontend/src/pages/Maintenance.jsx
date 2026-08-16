// src/pages/Maintenance.jsx
// ✅ COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react'
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
  Card,
  CardContent,
  Tooltip,
  FormHelperText,
  Divider,
  Fade,
  Grow,
  Menu,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Close,
  Refresh,
  Build,
  Schedule,
  Person,
  AdminPanelSettings,
  FilterList,
  Download,
  FileDownload,
  CheckCircle,
  Warning,
} from '@mui/icons-material'
import { maintenanceService, equipmentService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ============================================================
// THEME COLORS
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
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  lightText: '#64748B',
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  mainBg: '#F1F5F9',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
}

const animationStyles = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`

const Maintenance = () => {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Maintenance." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const canCreate = isEngineer || isSuperAdmin
  const canView = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin
  const canChangeStatus = isSuperAdmin
  
  const canEdit = (schedule) => {
    if (isSuperAdmin) return true
    if (isEngineer) {
      return schedule.engineer_name === user?.full_name
    }
    return false
  }

  const [schedules, setSchedules] = useState([])
  const [equipment, setEquipment] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [viewingSchedule, setViewingSchedule] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  const [filters, setFilters] = useState({
    status: '',
    frequency: '',
    maintenance_type: '',
    hospital: '',
  })
  
  const [formData, setFormData] = useState({
    equipment_id: '',
    hospital_id: '',
    maintenance_type: 'Preventive',
    frequency: 'Monthly',
    last_maintenance_date: '',
    next_due_date: '',
    maintenance_checklist: '',
    calibration_date: '',
    warranty_expiry: '',
    amc_details: '',
    status: 'Scheduled',
    engineer_name: ''
  })

  useEffect(() => {
    fetchSchedules()
    fetchEquipment()
    fetchHospitals()
  }, [])

  // ============================================================
  // ✅ FETCH SCHEDULES
  // ============================================================
  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await maintenanceService.getAll()
      console.log('📊 API Response:', response)
      
      let schedulesData = response.data?.schedules || []
      
      // ✅ Debug: Check each schedule
      schedulesData.forEach((schedule, index) => {
        console.log(`🔍 Schedule ${index + 1}:`, {
          id: schedule.id,
          equipment_name: schedule.equipment_name,
          equipment_id: schedule.equipment_id,
          hospital_name: schedule.hospital_name,
          hospital_id: schedule.hospital_id,
        })
      })
      
      setSchedules(schedulesData)
      
    } catch (error) {
      console.error('❌ Fetch schedules error:', error)
      toast.error('Failed to fetch maintenance schedules')
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getAll()
      setEquipment(response.data?.equipment || [])
    } catch (error) {
      console.error('❌ Failed to fetch equipment:', error)
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll()
      setHospitals(response.data?.hospitals || [])
    } catch (error) {
      console.error('❌ Failed to fetch hospitals:', error)
    }
  }

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToExcel = () => {
    try {
      const data = filteredSchedules.map(s => ({
        'Equipment': s.equipment_name || 'N/A',
        'Hospital': s.hospital_name || 'N/A',
        'Type': s.maintenance_type || '',
        'Frequency': s.frequency || '',
        'Engineer': s.engineer_name || '',
        'Last Maintenance': s.last_maintenance_date ? new Date(s.last_maintenance_date).toLocaleDateString() : '',
        'Next Due': s.next_due_date ? new Date(s.next_due_date).toLocaleDateString() : '',
        'Status': s.status || ''
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Maintenance')
      XLSX.writeFile(wb, `maintenance_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.setTextColor(colors.darkNavy)
      doc.text('Maintenance Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Schedules: ${filteredSchedules.length}`, 14, 34)
      
      const tableData = filteredSchedules.map(s => [
        s.equipment_name || 'N/A',
        s.hospital_name || 'N/A',
        s.maintenance_type || '',
        s.frequency || '',
        s.engineer_name || '',
        s.next_due_date ? new Date(s.next_due_date).toLocaleDateString() : '',
        s.status || ''
      ])
      autoTable(doc, {
        head: [['Equipment', 'Hospital', 'Type', 'Frequency', 'Engineer', 'Next Due', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`maintenance_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  // ============================================================
  // ✅ FILTER HANDLERS
  // ============================================================
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget)
  const handleFilterClose = () => setFilterAnchorEl(null)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ 
      status: '', 
      frequency: '', 
      maintenance_type: '',
      hospital: ''
    })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handleOpenDialog = (schedule = null) => {
    if (schedule && !canEdit(schedule)) {
      toast.error('You do not have permission to edit this schedule')
      return
    }
    
    if (schedule) {
      setEditingSchedule(schedule)
      setFormData({
        equipment_id: schedule.equipment_id || '',
        hospital_id: schedule.hospital_id || '',
        maintenance_type: schedule.maintenance_type || 'Preventive',
        frequency: schedule.frequency || 'Monthly',
        last_maintenance_date: schedule.last_maintenance_date ? new Date(schedule.last_maintenance_date).toISOString().split('T')[0] : '',
        next_due_date: schedule.next_due_date ? new Date(schedule.next_due_date).toISOString().split('T')[0] : '',
        maintenance_checklist: schedule.maintenance_checklist || '',
        calibration_date: schedule.calibration_date ? new Date(schedule.calibration_date).toISOString().split('T')[0] : '',
        warranty_expiry: schedule.warranty_expiry ? new Date(schedule.warranty_expiry).toISOString().split('T')[0] : '',
        amc_details: schedule.amc_details || '',
        status: schedule.status || 'Scheduled',
        engineer_name: schedule.engineer_name || ''
      })
    } else {
      setEditingSchedule(null)
      setFormData({
        equipment_id: '',
        hospital_id: '',
        maintenance_type: 'Preventive',
        frequency: 'Monthly',
        last_maintenance_date: '',
        next_due_date: '',
        maintenance_checklist: '',
        calibration_date: '',
        warranty_expiry: '',
        amc_details: '',
        status: 'Scheduled',
        engineer_name: user?.full_name || ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingSchedule(null)
  }

  const handleView = (schedule) => {
    if (!canView) {
      toast.error('You do not have permission to view maintenance schedules')
      return
    }
    setViewingSchedule(schedule)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingSchedule(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'status' && isEngineer && !isSuperAdmin) {
      toast.warning('Engineers cannot change status here')
      return
    }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async () => {
    try {
      if (!formData.equipment_id) {
        toast.error('Please select equipment')
        return
      }
      
      if (!formData.hospital_id) {
        toast.error('Please select a hospital')
        return
      }
      
      if (!formData.next_due_date) {
        toast.error('Next due date is required')
        return
      }

      const submitData = {
        equipment_id: parseInt(formData.equipment_id),
        hospital_id: parseInt(formData.hospital_id),
        maintenance_type: formData.maintenance_type || 'Preventive',
        frequency: formData.frequency || 'Monthly',
        last_maintenance_date: formData.last_maintenance_date || null,
        next_due_date: formData.next_due_date || null,
        calibration_date: formData.calibration_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        maintenance_checklist: formData.maintenance_checklist || '',
        amc_details: formData.amc_details || '',
        status: isEngineer && editingSchedule ? editingSchedule.status : formData.status,
        engineer_name: formData.engineer_name || user?.full_name || '',
      }

      console.log('📤 Submitting:', submitData)

      if (editingSchedule) {
        await maintenanceService.update(editingSchedule.id, submitData)
        toast.success('Maintenance schedule updated successfully')
      } else {
        await maintenanceService.create(submitData)
        toast.success('Maintenance schedule created successfully')
      }
      fetchSchedules()
      handleCloseDialog()
    } catch (error) {
      console.error('❌ Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete maintenance schedules')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this maintenance schedule?')) {
      try {
        await maintenanceService.delete(id)
        toast.success('Maintenance schedule deleted successfully')
        fetchSchedules()
      } catch (error) {
        console.error('❌ Delete error:', error)
        toast.error('Failed to delete schedule')
      }
    }
  }

  const handleStatusChange = async (id, status) => {
    if (!canChangeStatus) {
      toast.error('Only Super Admin can change status')
      return
    }
    
    try {
      await maintenanceService.update(id, { status })
      const statusMessages = {
        'Scheduled': 'Schedule approved',
        'In Progress': 'Marked as In Progress',
        'Completed': 'Maintenance completed',
        'Overdue': 'Marked as Overdue',
        'Cancelled': 'Schedule cancelled'
      }
      toast.success(statusMessages[status] || `Status updated to ${status}`)
      fetchSchedules()
      if (viewingSchedule && viewingSchedule.id === id) {
        setViewingSchedule({ ...viewingSchedule, status })
      }
    } catch (error) {
      console.error('❌ Status update error:', error)
      toast.error('Failed to update status')
    }
  }

  const isOverdue = (date) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = (schedule.equipment_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (schedule.maintenance_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (schedule.engineer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (schedule.hospital_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || schedule.status === filters.status
    const matchesFrequency = !filters.frequency || schedule.frequency === filters.frequency
    const matchesType = !filters.maintenance_type || schedule.maintenance_type === filters.maintenance_type
    const matchesHospital = !filters.hospital || schedule.hospital_id === parseInt(filters.hospital)
    return matchesSearch && matchesStatus && matchesFrequency && matchesType && matchesHospital
  })

  const totalSchedules = schedules.length
  const upcomingSchedules = schedules.filter(s => s.status === 'Scheduled').length
  const completedSchedules = schedules.filter(s => s.status === 'Completed').length
  const overdueSchedules = schedules.filter(s => s.status === 'Overdue' || (s.next_due_date && new Date(s.next_due_date) < new Date() && s.status !== 'Completed')).length

  const statsCards = [
    {
      title: 'Total Schedules',
      value: totalSchedules,
      icon: <Build />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Upcoming',
      value: upcomingSchedules,
      icon: <Schedule />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Completed',
      value: completedSchedules,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Overdue',
      value: overdueSchedules,
      icon: <Warning />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
  ]

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return colors.success
      case 'Scheduled': return colors.darkNavy
      case 'In Progress': return colors.warning
      case 'Overdue': return colors.error
      case 'Cancelled': return colors.lightText
      default: return colors.lightText
    }
  }

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
    }}>
      <style>{animationStyles}</style>

      {/* HEADER */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        flexWrap: 'wrap', 
        gap: 2,
        animation: 'fadeInUp 0.6s ease-out',
      }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: colors.darkNavy,
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
              '&::after': {
                content: '""',
                display: 'block',
                width: '40px',
                height: '3px',
                background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.darkNavy})`,
                borderRadius: '2px',
                marginTop: '4px',
              }
            }}
          >
            Maintenance
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage equipment maintenance schedules
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchSchedules} 
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              textTransform: 'none',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': { 
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                transform: 'translateY(-2px)',
              },
            }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained"
            startIcon={<FilterList />} 
            onClick={handleFilterClick}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Filter
          </Button>
          
          <Button 
            variant="contained"
            startIcon={<Download />} 
            onClick={handleExportClick}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Export
          </Button>
          
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Add Schedule
            </Button>
          )}
        </Box>
      </Box>

      {/* STATS CARDS */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Grow in timeout={300 + index * 100}>
              <Card sx={{ 
                borderRadius: 3,
                border: `1px solid ${colors.borderColor}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
                  borderColor: colors.lightCyan,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold})`,
                  borderRadius: '3px 3px 0 0',
                }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: colors.lightText,
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontSize: '0.6rem',
                        }}
                      >
                        {card.title}
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700,
                          color: colors.darkNavy,
                          fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
                          mt: 0.5,
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        background: card.bg,
                        borderRadius: '14px',
                        p: 1.2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 42,
                        height: 42,
                        color: card.color,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {React.cloneElement(card.icon, { 
                        sx: { 
                          fontSize: 22,
                          color: card.color,
                        } 
                      })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* OVERDUE ALERT */}
      {overdueSchedules > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            border: `1px solid ${colors.error}33`,
            '& .MuiAlert-icon': { color: colors.error }
          }}
          action={
            <Button 
              color="error" 
              size="small"
              onClick={() => setFilters({ ...filters, status: 'Overdue' })}
              sx={{ color: colors.error }}
            >
              View
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>{overdueSchedules}</strong> schedule{overdueSchedules > 1 ? 's are' : ' is'} overdue!
          </Typography>
        </Alert>
      )}

      {/* SEARCH */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.7s ease-out',
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.lightText, fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                },
              }
            }}
          />
        </Box>
      </Paper>

      {/* FILTER MENU */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ 
          sx: { 
            p: 2.5, 
            width: 280,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            borderRadius: 3,
          } 
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2 }}>
          Filter Schedules
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Hospital</InputLabel>
          <Select 
            name="hospital" 
            value={filters.hospital} 
            onChange={handleFilterChange} 
            label="Hospital"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            {hospitals.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
          <Select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange} 
            label="Status"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Scheduled">Scheduled</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Overdue">Overdue</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Frequency</InputLabel>
          <Select 
            name="frequency" 
            value={filters.frequency} 
            onChange={handleFilterChange} 
            label="Frequency"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
            <MenuItem value="Quarterly">Quarterly</MenuItem>
            <MenuItem value="Yearly">Yearly</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Type</InputLabel>
          <Select 
            name="maintenance_type" 
            value={filters.maintenance_type} 
            onChange={handleFilterChange} 
            label="Type"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Preventive">Preventive</MenuItem>
            <MenuItem value="Corrective">Corrective</MenuItem>
            <MenuItem value="Emergency">Emergency</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleFilterClose} 
            fullWidth 
            size="small"
            sx={{ 
              bgcolor: colors.darkNavy,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
              },
            }}
          >
            Apply
          </Button>
          <Button 
            variant="outlined" 
            onClick={clearFilters} 
            fullWidth 
            size="small"
            sx={{ 
              borderColor: colors.borderColor,
              color: colors.darkNavy,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { 
                borderColor: colors.lightCyan,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              }
            }}
          >
            Clear
          </Button>
        </Box>
      </Menu>

      {/* EXPORT MENU */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{ 
          sx: { 
            p: 1, 
            width: 200,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            borderRadius: 3,
          } 
        }}
      >
        <MenuItem 
          onClick={exportToExcel} 
          sx={{ 
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>Excel</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>.xlsx format</Typography>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={exportToPDF} 
          sx={{ 
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>PDF</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>Print ready document</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* TABLE */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          border: `1px solid ${colors.borderColor}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          animation: 'fadeInUp 0.8s ease-out',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Engineer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Frequency</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Last</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Next Due</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Build sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText }}>
                      No schedules found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule, index) => {
                const isOwnSchedule = isEngineer && schedule.engineer_name === user?.full_name
                const isOverdueStatus = isOverdue(schedule.next_due_date) && schedule.status !== 'Completed'
                
                return (
                  <TableRow 
                    key={schedule.id} 
                    hover
                    sx={{
                      transition: 'all 0.2s ease',
                      animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                      '&:hover': {
                        backgroundColor: 'rgba(103, 232, 249, 0.04)',
                      },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                        {schedule.equipment_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>
                      {schedule.hospital_name || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>
                      {schedule.maintenance_type || 'Preventive'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                        {schedule.engineer_name || 'Unassigned'}
                      </Typography>
                      {isOwnSchedule && (
                        <Chip 
                          label="My Schedule" 
                          size="small" 
                          sx={{ 
                            bgcolor: colors.lightCyan, 
                            color: colors.darkNavy,
                            height: 18, 
                            fontSize: '9px', 
                            ml: 0.5,
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>
                      {schedule.frequency || 'Monthly'}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>
                      {schedule.last_maintenance_date ? new Date(schedule.last_maintenance_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ color: colors.darkNavy }}>
                          {schedule.next_due_date ? new Date(schedule.next_due_date).toLocaleDateString() : '-'}
                        </Typography>
                        {isOverdueStatus && (
                          <Chip 
                            label="Overdue" 
                            size="small" 
                            sx={{ bgcolor: colors.error, color: 'white', height: 20, fontSize: '10px', fontWeight: 500, borderRadius: 2 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={schedule.status || 'Scheduled'} 
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(schedule.status),
                          color: 'white',
                          fontWeight: 600,
                          height: 26,
                          fontSize: '11px',
                          borderRadius: 2,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(schedule)}
                            sx={{ 
                              color: colors.darkNavy, 
                              '&:hover': { 
                                color: colors.lightCyanDark,
                                backgroundColor: 'rgba(103, 232, 249, 0.08)'
                              } 
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {canEdit(schedule) && (
                          <Tooltip title="Edit Schedule">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(schedule)}
                              sx={{ 
                                color: colors.darkNavy, 
                                '&:hover': { 
                                  color: colors.lightCyanDark,
                                  backgroundColor: 'rgba(103, 232, 249, 0.08)'
                                } 
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canDelete && (
                          <Tooltip title="Delete Schedule">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(schedule.id)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)'
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ADD/EDIT DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {editingSchedule ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Hospital Field */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: colors.lightText }}>Hospital *</InputLabel>
                <Select
                  name="hospital_id"
                  value={formData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital *"
                  disabled={isEngineer && !isSuperAdmin}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="">Select Hospital</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                  ))}
                </Select>
                {isEngineer && !isSuperAdmin && (
                  <FormHelperText sx={{ color: colors.lightText }}>
                    Auto-assigned to your hospital
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Equipment Field */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: colors.lightText }}>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment *"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="">Select Equipment</MenuItem>
                  {equipment.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} - {item.model || 'N/A'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="maintenance_type"
                  value={formData.maintenance_type}
                  onChange={handleFormChange}
                  label="Type"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="Preventive">Preventive</MenuItem>
                  <MenuItem value="Corrective">Corrective</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Frequency */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleFormChange}
                  label="Frequency"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Quarterly">Quarterly</MenuItem>
                  <MenuItem value="Yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Engineer Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Engineer Name"
                name="engineer_name"
                value={formData.engineer_name}
                onChange={handleFormChange}
                placeholder="Enter engineer name"
                disabled={isEngineer}
                helperText={isEngineer ? "Auto-assigned to you" : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: colors.lightText }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* Last Maintenance */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Maintenance"
                name="last_maintenance_date"
                type="date"
                value={formData.last_maintenance_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* Next Due Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Next Due Date *"
                name="next_due_date"
                type="date"
                value={formData.next_due_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* Checklist */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Checklist"
                name="maintenance_checklist"
                value={formData.maintenance_checklist}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="1. Check power supply&#10;2. Calibrate sensors&#10;3. Test functionality"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* Calibration Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Calibration Date"
                name="calibration_date"
                type="date"
                value={formData.calibration_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* Warranty Expiry */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Warranty Expiry"
                name="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* AMC Details */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="AMC/CMC Details"
                name="amc_details"
                value={formData.amc_details}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="AMC contract details, vendor information..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                  disabled={isEngineer && !isSuperAdmin}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
                {isEngineer && !isSuperAdmin && (
                  <FormHelperText sx={{ color: colors.lightText }}>
                    Status cannot be changed here. Contact Super Admin.
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              color: colors.darkNavy,
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            {editingSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseView} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Build sx={{ fontSize: 28 }} />
              Schedule Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {viewingSchedule && (
            <Box>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Equipment
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                    {viewingSchedule.equipment_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Hospital
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                    {viewingSchedule.hospital_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Status
                  </Typography>
                  <Chip 
                    label={viewingSchedule.status || 'Scheduled'} 
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(viewingSchedule.status),
                      color: 'white',
                      fontWeight: 600,
                      height: 28,
                      fontSize: '12px',
                      borderRadius: 2,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                    {viewingSchedule.maintenance_type || 'Preventive'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Frequency
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                    {viewingSchedule.frequency || 'Monthly'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Engineer
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                    {viewingSchedule.engineer_name || 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Last Maintenance
                  </Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                    {viewingSchedule.last_maintenance_date ? new Date(viewingSchedule.last_maintenance_date).toLocaleDateString() : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                    Next Due
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkNavy }}>
                    {viewingSchedule.next_due_date ? new Date(viewingSchedule.next_due_date).toLocaleDateString() : '-'}
                  </Typography>
                </Grid>
                {viewingSchedule.maintenance_checklist && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                      Checklist
                    </Typography>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: colors.mainBg, 
                      borderRadius: 2,
                      border: `1px solid ${colors.borderColor}`
                    }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: colors.darkNavy }}>
                        {viewingSchedule.maintenance_checklist}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {viewingSchedule.calibration_date && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                      Calibration Date
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                      {new Date(viewingSchedule.calibration_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {viewingSchedule.warranty_expiry && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                      Warranty Expiry
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                      {new Date(viewingSchedule.warranty_expiry).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {viewingSchedule.amc_details && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                      AMC/CMC Details
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                      {viewingSchedule.amc_details}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {isSuperAdmin && (
                <>
                  <Divider sx={{ my: 3, borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                    <AdminPanelSettings sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
                    Update Status (Super Admin Only)
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel sx={{ color: colors.lightText }}>Select Status</InputLabel>
                      <Select
                        value={viewingSchedule.status || 'Scheduled'}
                        onChange={(e) => handleStatusChange(viewingSchedule.id, e.target.value)}
                        label="Select Status"
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          }
                        }}
                      >
                        <MenuItem value="Scheduled">Scheduled</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                        <MenuItem value="Overdue">Overdue</MenuItem>
                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      Select a new status and it will be updated immediately
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseView} 
            variant="contained"
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            Close
          </Button>
          {canDelete && viewingSchedule && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(viewingSchedule.id)
                handleCloseView()
              }}
              startIcon={<Delete />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Maintenance