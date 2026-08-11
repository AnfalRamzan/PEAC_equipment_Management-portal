// src/pages/Maintenance.jsx
// ✅ PAEC THEME - Green & Gold Colors

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
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Close,
  Refresh,
  CalendarToday,
  Build,
  Schedule,
  Person,
  AdminPanelSettings,
  Verified
} from '@mui/icons-material'
import { maintenanceService, equipmentService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'

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
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#ED6C02',
  info: '#0B5FA5',
  borderColor: 'rgba(1, 65, 28, 0.08)',
  shadowColor: 'rgba(1, 65, 28, 0.08)',
  cardBg: '#FFFFFF',
}

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
    if (isEngineer) {
      return schedule.engineer_name === user?.full_name
    }
    return false
  }

  const [schedules, setSchedules] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [viewingSchedule, setViewingSchedule] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    frequency: ''
  })
  
  const [formData, setFormData] = useState({
    equipment_id: '',
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
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await maintenanceService.getAll()
      setSchedules(response.data.schedules || [])
    } catch (error) {
      console.error('Fetch schedules error:', error)
      toast.error('Failed to fetch maintenance schedules')
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getAll()
      setEquipment(response.data.equipment || [])
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
    }
  }

  const handleOpenDialog = (schedule = null) => {
    if (schedule && !canEdit(schedule)) {
      toast.error('Only engineers can edit their own schedules')
      return
    }
    
    if (schedule) {
      setEditingSchedule(schedule)
      setFormData({
        equipment_id: schedule.equipment_id || '',
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
      if (!formData.next_due_date) {
        toast.error('Next due date is required')
        return
      }

      const submitData = {
        equipment_id: parseInt(formData.equipment_id),
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
        assigned_to: null
      }

      console.log('📤 Submitting maintenance data:', JSON.stringify(submitData, null, 2))

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
      console.error('Submit error:', error)
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
        console.error('Delete error:', error)
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
      console.error('Status update error:', error)
      toast.error('Failed to update status')
    }
  }

  const isOverdue = (date) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          schedule.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          schedule.engineer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || schedule.status === filters.status
    const matchesFrequency = !filters.frequency || schedule.frequency === filters.frequency
    return matchesSearch && matchesStatus && matchesFrequency
  })

  const totalSchedules = schedules.length
  const upcomingSchedules = schedules.filter(s => s.status === 'Scheduled').length
  const completedSchedules = schedules.filter(s => s.status === 'Completed').length
  const overdueSchedules = schedules.filter(s => s.status === 'Overdue' || (s.next_due_date && new Date(s.next_due_date) < new Date() && s.status !== 'Completed')).length

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.accentGold } }} />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.sidebar }}>
            Maintenance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSchedules}
            size="small"
            sx={{ 
              borderColor: colors.sidebar, 
              color: colors.sidebar,
              '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
            }}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                bgcolor: colors.sidebar, 
                '&:hover': { bgcolor: colors.sidebarHover },
                boxShadow: `0 4px 16px ${colors.sidebar}44`
              }}
            >
              Add Schedule
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.sidebar, fontWeight: 700 }}>
                {totalSchedules}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.warning}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.warning}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.warning, fontWeight: 700 }}>
                {upcomingSchedules}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Upcoming</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.success}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.success}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.success, fontWeight: 700 }}>
                {completedSchedules}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.error}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.error}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.error, fontWeight: 700 }}>
                {overdueSchedules}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Overdue</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {overdueSchedules > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
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

      {/* Search & Filters */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.lightText }} />
                </InputAdornment>
              ),
              sx: {
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.sidebar },
                  '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                }
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.sidebar },
                  '&.Mui-focused fieldset': { borderColor: colors.accentGold }
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.lightText }}>Frequency</InputLabel>
            <Select
              value={filters.frequency}
              onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
              label="Frequency"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.sidebar },
                  '&.Mui-focused fieldset': { borderColor: colors.accentGold }
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
        </Box>
      </Paper>

      {/* Table - THEMED */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
        <Table>
          <TableHead sx={{ bgcolor: colors.sidebar }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Engineer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Frequency</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Last</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Next Due</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 4, color: colors.lightText }}>
                    No schedules found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => {
                const isOwnSchedule = isEngineer && schedule.engineer_name === user?.full_name
                
                return (
                  <TableRow key={schedule.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkText }}>
                        {schedule.equipment_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>
                      {schedule.maintenance_type || 'Preventive'}
                    </TableCell>
                    <TableCell>
                      {schedule.engineer_name ? (
                        <Typography variant="body2" fontWeight={500} sx={{ color: colors.sidebar }}>
                          {schedule.engineer_name}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: colors.lightText }}>Unassigned</Typography>
                      )}
                      {isOwnSchedule && (
                        <Chip 
                          label="My Schedule" 
                          size="small" 
                          sx={{ 
                            bgcolor: colors.accentGold, 
                            color: 'white',
                            height: 18, 
                            fontSize: '9px', 
                            ml: 0.5,
                            fontWeight: 500
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
                        <Typography sx={{ color: colors.darkText }}>
                          {schedule.next_due_date ? new Date(schedule.next_due_date).toLocaleDateString() : '-'}
                        </Typography>
                        {isOverdue(schedule.next_due_date) && schedule.status !== 'Completed' && (
                          <Chip 
                            label="Overdue" 
                            size="small" 
                            sx={{ bgcolor: colors.error, color: 'white', height: 20, fontSize: '10px', fontWeight: 500 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={schedule.status || 'Scheduled'} 
                        size="small"
                        sx={{
                          bgcolor: schedule.status === 'Completed' ? colors.success :
                                   schedule.status === 'Scheduled' ? colors.sidebar :
                                   schedule.status === 'In Progress' ? colors.warning :
                                   schedule.status === 'Overdue' ? colors.error :
                                   schedule.status === 'Cancelled' ? colors.lightText : colors.lightText,
                          color: 'white',
                          fontWeight: 500,
                          height: 24,
                          fontSize: '11px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Tooltip title="View">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(schedule)}
                            sx={{ color: colors.sidebar, '&:hover': { color: colors.accentGold } }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {canEdit(schedule) && (
                          <Tooltip title="Edit (Status cannot be changed here)">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(schedule)}
                              sx={{ color: colors.sidebar, '&:hover': { color: colors.accentGold } }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canDelete && (
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(schedule.id)}
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

      {/* Add/Edit Dialog - THEMED */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Build sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight={600}>
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </Typography>
            {editingSchedule && isEngineer && (
              <Chip 
                label="Editing Your Schedule" 
                size="small" 
                sx={{ bgcolor: colors.accentGold, color: 'white', fontWeight: 500 }}
              />
            )}
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: colors.lightText }}>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Type</InputLabel>
                <Select
                  name="maintenance_type"
                  value={formData.maintenance_type}
                  onChange={handleFormChange}
                  label="Type"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
                >
                  <MenuItem value="Preventive">Preventive</MenuItem>
                  <MenuItem value="Corrective">Corrective</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Frequency</InputLabel>
                <Select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleFormChange}
                  label="Frequency"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
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
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Maintenance"
                name="last_maintenance_date"
                type="date"
                value={formData.last_maintenance_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                helperText="YYYY-MM-DD"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

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
                helperText="YYYY-MM-DD"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

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
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Calibration Date"
                name="calibration_date"
                type="date"
                value={formData.calibration_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                helperText="YYYY-MM-DD"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Warranty Expiry"
                name="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                helperText="YYYY-MM-DD"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

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
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                  disabled={true}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
                >
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
                <FormHelperText sx={{ color: colors.lightText }}>Status cannot be changed here</FormHelperText>
              </FormControl>
            </Grid>

            {isEngineer && editingSchedule && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 2, border: `1px solid ${colors.info}33` }}>
                  <Typography variant="body2">
                    <strong>🔧 Engineer Mode:</strong> You can edit your schedule details, but <strong>Status</strong> cannot be changed here.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colors.lightText }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ 
              bgcolor: colors.sidebar, 
              '&:hover': { bgcolor: colors.sidebarHover },
              boxShadow: `0 4px 16px ${colors.sidebar}44`
            }}
          >
            {editingSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog - THEMED */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Schedule Details</Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingSchedule && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Equipment</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                    {viewingSchedule.equipment_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Status</Typography>
                  <Chip 
                    label={viewingSchedule.status || 'Scheduled'} 
                    size="small"
                    sx={{
                      bgcolor: viewingSchedule.status === 'Completed' ? colors.success :
                               viewingSchedule.status === 'Scheduled' ? colors.sidebar :
                               viewingSchedule.status === 'In Progress' ? colors.warning :
                               viewingSchedule.status === 'Overdue' ? colors.error :
                               viewingSchedule.status === 'Cancelled' ? colors.lightText : colors.lightText,
                      color: 'white',
                      fontWeight: 500,
                      height: 28,
                      fontSize: '12px'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Type</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>
                    {viewingSchedule.maintenance_type || 'Preventive'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Frequency</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>
                    {viewingSchedule.frequency || 'Monthly'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Engineer</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.sidebar }}>
                    {viewingSchedule.engineer_name || 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Last Maintenance</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>
                    {viewingSchedule.last_maintenance_date ? new Date(viewingSchedule.last_maintenance_date).toLocaleDateString() : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Next Due</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: colors.darkText }}>
                    {viewingSchedule.next_due_date ? new Date(viewingSchedule.next_due_date).toLocaleDateString() : '-'}
                  </Typography>
                </Grid>
                {viewingSchedule.maintenance_checklist && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Checklist</Typography>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: colors.mainBg, 
                      borderRadius: 1,
                      border: `1px solid ${colors.borderColor}`
                    }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: colors.darkText }}>
                        {viewingSchedule.maintenance_checklist}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {viewingSchedule.calibration_date && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Calibration Date</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkText }}>
                      {new Date(viewingSchedule.calibration_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {viewingSchedule.warranty_expiry && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Warranty Expiry</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkText }}>
                      {new Date(viewingSchedule.warranty_expiry).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {viewingSchedule.amc_details && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>AMC/CMC Details</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkText }}>
                      {viewingSchedule.amc_details}
                    </Typography>
                  </Grid>
                )}
                {viewingSchedule.created_at && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Created At</Typography>
                    <Typography variant="body2" sx={{ color: colors.darkText }}>
                      {new Date(viewingSchedule.created_at).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* SUPER ADMIN STATUS UPDATE SECTION */}
              {isSuperAdmin && (
                <>
                  <Divider sx={{ my: 3, borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
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
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.sidebar },
                            '&.Mui-focused fieldset': { borderColor: colors.accentGold }
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
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView} sx={{ color: colors.lightText }}>Close</Button>
          {canDelete && viewingSchedule && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(viewingSchedule.id)
                handleCloseView()
              }}
              startIcon={<Delete />}
              sx={{ boxShadow: `0 4px 16px ${colors.error}44` }}
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