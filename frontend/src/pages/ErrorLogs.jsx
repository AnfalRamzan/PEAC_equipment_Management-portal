// src/pages/ErrorLogs.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Stack,
  FormHelperText
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Close,
  Refresh
} from '@mui/icons-material'
import { errorService, equipmentService, hospitalService, userService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import FileUpload from '../components/FileUpload'
import api from '../api/axios'
import AccessDenied from '../components/Auth/AccessDenied'

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS
// ============================================================
const colors = {
  // Dark Navy Base
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyDark: '#0A0F1E',
  darkNavyHover: '#1E3A5F',
  
  // Light Cyan Accents
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  
  // Gold accent (keeping PAEC branding)
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  
  // Text
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  darkText: '#0F172A',
  lightText: '#64748B',
  
  // Cards/Background
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  mainBg: '#F1F5F9',
  
  // Status colors
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

const ErrorLogs = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Error Logs." />
  }
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isEngineer = user?.role === 'ENGINEER'
  
  const canReport = isEngineer
  const canDelete = isSuperAdmin

  const [errors, setErrors] = useState([])
  const [equipment, setEquipment] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingError, setEditingError] = useState(null)
  const [viewingError, setViewingError] = useState(null)

  const [errors_validation, setErrors_validation] = useState({
    equipment_id: '',
    error_title: '',
    severity: '',
    priority: '',
    error_date: ''
  })

  const [filters, setFilters] = useState({
    severity: ''
  })

  const [errorFormData, setErrorFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
    severity: 'Medium',
    priority: 'Medium',
    error_date: new Date().toISOString().slice(0, 16),
    reported_by: user?.id || 1,
    hospital_id: user?.hospital_id || '',
    department_id: '',
    attachments: '',
    assigned_to: ''
  })

  const getFullUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    if (url.startsWith('/uploads')) {
      return `http://localhost:5000${url}`
    }
    return url
  }

  useEffect(() => {
    fetchErrors()
    fetchEquipment()
    fetchHospitals()
    fetchDepartments()
    fetchUsers()
  }, [])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      const response = await errorService.getAll()
      setErrors(response.data.errors || [])
    } catch (error) {
      toast.error('Failed to fetch errors')
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

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll()
      setHospitals(response.data.hospitals || [])
    } catch (error) {
      console.error('Failed to fetch hospitals:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const hospitalId = user?.hospital_id || errorFormData.hospital_id
      if (!hospitalId) {
        setDepartments([])
        return
      }
      const response = await api.get(`/departments/hospital/${hospitalId}`)
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll()
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const validateField = (name, value) => {
    let error = ''
    switch (name) {
      case 'equipment_id':
        if (!value) error = 'Equipment is required'
        break
      case 'error_title':
        if (!value || value.trim() === '') error = 'Error title is required'
        break
      case 'severity':
        if (!value) error = 'Severity is required'
        break
      case 'priority':
        if (!value) error = 'Priority is required'
        break
      case 'error_date':
        if (!value) error = 'Error date is required'
        break
      default:
        break
    }
    return error
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    const error = validateField(name, value)
    setErrors_validation(prev => ({ ...prev, [name]: error }))
  }

  const isFormValid = () => {
    const equipmentError = validateField('equipment_id', errorFormData.equipment_id)
    const titleError = validateField('error_title', errorFormData.error_title)
    const severityError = validateField('severity', errorFormData.severity)
    const priorityError = validateField('priority', errorFormData.priority)
    const dateError = validateField('error_date', errorFormData.error_date)
    
    setErrors_validation(prev => ({
      ...prev,
      equipment_id: equipmentError,
      error_title: titleError,
      severity: severityError,
      priority: priorityError,
      error_date: dateError
    }))
    
    return !equipmentError && !titleError && !severityError && !priorityError && !dateError
  }

  const handleOpenDialog = (error = null) => {
    if (!isEngineer && !error) {
      toast.error('Only Engineers can report errors')
      return
    }
    
    setErrors_validation({
      equipment_id: '',
      error_title: '',
      severity: '',
      priority: '',
      error_date: ''
    })
    
    if (error) {
      toast.error('Only Engineers can edit errors')
      return
    }
    
    setEditingError(null)
    setErrorFormData({
      equipment_id: '',
      error_code: '',
      error_title: '',
      error_description: '',
      severity: 'Medium',
      priority: 'Medium',
      error_date: new Date().toISOString().slice(0, 16),
      reported_by: user?.id || 1,
      hospital_id: user?.hospital_id || '',
      department_id: '',
      attachments: '',
      assigned_to: ''
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingError(null)
    setErrors_validation({
      equipment_id: '',
      error_title: '',
      severity: '',
      priority: '',
      error_date: ''
    })
  }

  const handleViewError = (error) => {
    setViewingError({
      ...error,
      attachments: error.attachments || ''
    })
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingError(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setErrorFormData({
      ...errorFormData,
      [name]: value
    })
    
    if (errors_validation[name]) {
      setErrors_validation(prev => ({ ...prev, [name]: '' }))
    }
    
    if (name === 'hospital_id') {
      fetchDepartments()
    }
  }

  const handleSubmit = async () => {
    if (!isEngineer) {
      toast.error('Only Engineers can report errors')
      return
    }

    if (!isFormValid()) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const submitData = {
        equipment_id: parseInt(errorFormData.equipment_id),
        error_code: errorFormData.error_code || null,
        error_title: errorFormData.error_title.trim(),
        error_description: errorFormData.error_description || '',
        severity: errorFormData.severity || 'Medium',
        priority: errorFormData.priority || 'Medium',
        error_date: errorFormData.error_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        attachments: errorFormData.attachments || ''
      }

      await errorService.create(submitData)
      toast.success('Error reported successfully')
      
      fetchErrors()
      handleCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.message || error.message || 'Operation failed')
    }
  }

  const handleErrorDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete errors')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this error log?')) {
      try {
        await errorService.delete(id)
        toast.success('Error deleted successfully')
        fetchErrors()
        if (openViewDialog) {
          handleCloseView()
        }
      } catch (error) {
        toast.error('Failed to delete error')
      }
    }
  }

  const filteredErrors = errors.filter(error => {
    const matchesSearch = error.error_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.error_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = !filters.severity || error.severity === filters.severity
    return matchesSearch && matchesSeverity
  })

  const totalErrors = errors.length
  const openErrors = errors.filter(e => e.status === 'Pending' || e.status === 'In Progress').length
  const completedErrors = errors.filter(e => e.status === 'Completed').length
  const resolvedErrors = errors.filter(e => e.status === 'Resolved' || e.status === 'Closed').length

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: colors.darkNavy,
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
          Error Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchErrors}
            size="small"
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkNavy,
              '&:hover': { 
                borderColor: colors.lightCyan, 
                color: colors.lightCyanDark,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              }
            }}
          >
            Refresh
          </Button>
          {canReport && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                bgcolor: colors.darkNavy, 
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
                },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Report Error
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards - DARK NAVY + CYAN THEMED */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            '&:hover': {
              borderColor: colors.lightCyan,
              boxShadow: `0 4px 20px ${colors.lightCyanGlow}`
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.darkNavy, fontWeight: 700 }}>
                {totalErrors}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Total Errors</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.warning}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.warning}08`,
            '&:hover': {
              borderColor: colors.warning,
              boxShadow: `0 4px 20px rgba(245, 158, 11, 0.15)`
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.warning, fontWeight: 700 }}>
                {openErrors}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Open</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.info}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.info}08`,
            '&:hover': {
              borderColor: colors.info,
              boxShadow: `0 4px 20px rgba(59, 130, 246, 0.15)`
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.info, fontWeight: 700 }}>
                {completedErrors}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.success}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.success}08`,
            '&:hover': {
              borderColor: colors.success,
              boxShadow: `0 4px 20px rgba(34, 197, 94, 0.15)`
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.success, fontWeight: 700 }}>
                {resolvedErrors}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Resolved</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search errors..."
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
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.lightText }}>Severity</InputLabel>
            <Select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              label="Severity"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Table - DARK NAVY + LIGHT CYAN THEMED */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2, 
          border: `1px solid ${colors.borderColor}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Error</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredErrors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: colors.lightText }}>
                    No errors found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredErrors.map((error) => (
                <TableRow 
                  key={error.id} 
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(103, 232, 249, 0.04)',
                    },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy }}>
                      {error.error_title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      {error.error_code || 'No code'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText }}>
                    {error.equipment_name}
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText }}>
                    {error.priority || 'Medium'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={error.severity || 'Medium'} 
                      size="small"
                      sx={{
                        bgcolor: error.severity === 'Critical' ? colors.error :
                                 error.severity === 'High' ? '#e65100' :
                                 error.severity === 'Medium' ? colors.warning :
                                 '#2E7D32',
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '11px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={error.status} 
                      size="small"
                      sx={{
                        bgcolor: error.status === 'Resolved' || error.status === 'Closed' ? colors.success :
                                 error.status === 'Completed' ? colors.info :
                                 error.status === 'Pending' ? colors.warning :
                                 error.status === 'In Progress' ? '#FF6F00' :
                                 error.status === 'Rejected' ? colors.error : '#9E9E9E',
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '11px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>
                      {new Date(error.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewError(error)}
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
                      
                      {canDelete && (
                        <Tooltip title="Delete Error">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleErrorDelete(error.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* REPORT ERROR DIALOG - DARK NAVY + CYAN THEMED */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Report New Error
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Hospital</InputLabel>
                <Select
                  name="hospital_id"
                  value={errorFormData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="">Select Hospital (Optional)</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Department</InputLabel>
                <Select
                  name="department_id"
                  value={errorFormData.department_id}
                  onChange={handleFormChange}
                  label="Department"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="">Select Department (Optional)</MenuItem>
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors_validation.equipment_id}>
                <InputLabel sx={{ color: colors.lightText }}>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={errorFormData.equipment_id}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  label="Equipment *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="">Select Equipment</MenuItem>
                  {equipment.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} - {item.model} ({item.hospital_name || 'No Hospital'})
                    </MenuItem>
                  ))}
                </Select>
                {errors_validation.equipment_id && (
                  <FormHelperText error>{errors_validation.equipment_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Error Code (Optional)"
                name="error_code"
                value={errorFormData.error_code}
                onChange={handleFormChange}
                placeholder="e.g., ERR-001"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors_validation.severity}>
                <InputLabel sx={{ color: colors.lightText }}>Severity *</InputLabel>
                <Select
                  name="severity"
                  value={errorFormData.severity}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  label="Severity *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
                {errors_validation.severity && (
                  <FormHelperText error>{errors_validation.severity}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors_validation.priority}>
                <InputLabel sx={{ color: colors.lightText }}>Priority *</InputLabel>
                <Select
                  name="priority"
                  value={errorFormData.priority}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  label="Priority *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
                {errors_validation.priority && (
                  <FormHelperText error>{errors_validation.priority}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Error Title *"
                name="error_title"
                value={errorFormData.error_title}
                onChange={handleFormChange}
                onBlur={handleBlur}
                placeholder="Brief error title"
                error={!!errors_validation.error_title}
                helperText={errors_validation.error_title}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Description (Optional)"
                name="error_description"
                value={errorFormData.error_description}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="Detailed description of the error"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Error Date *"
                name="error_date"
                type="datetime-local"
                value={errorFormData.error_date}
                onChange={handleFormChange}
                onBlur={handleBlur}
                InputLabelProps={{ shrink: true }}
                error={!!errors_validation.error_date}
                helperText={errors_validation.error_date}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
                Attachments (Optional)
              </Typography>
              <FileUpload
                endpoint="/upload"
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                multiple={true}
                label="Click to upload images, videos, or documents"
                maxFiles={5}
                maxSize={50}
                showPreview={true}
                onUploadComplete={(files) => {
                  const urls = files.map(f => f.url || f.fileUrl).filter(Boolean)
                  const currentFiles = errorFormData.attachments ? errorFormData.attachments.split(',') : []
                  const updatedFiles = [...currentFiles, ...urls]
                  setErrorFormData(prev => ({ 
                    ...prev, 
                    attachments: updatedFiles.join(',') 
                  }))
                  toast.success(`${files.length} file(s) uploaded successfully`)
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  const currentFiles = errorFormData.attachments?.split(',') || []
                  const updatedFiles = currentFiles.filter(f => f !== file.url)
                  setErrorFormData(prev => ({ 
                    ...prev, 
                    attachments: updatedFiles.join(',') 
                  }))
                  toast.info('File removed')
                }}
                existingFiles={errorFormData.attachments ? errorFormData.attachments.split(',').filter(Boolean).map(url => ({
                  url: url,
                  name: url.split('/').pop(),
                  type: url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' :
                        url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'document'
                })) : []}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            sx={{ 
              bgcolor: colors.darkNavy, 
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Report Error
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW ERROR DIALOG - DARK NAVY + CYAN THEMED */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseView} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Error Details
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ID: {viewingError?.id} • {new Date(viewingError?.created_at).toLocaleString()}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseView} sx={{ color: 'white', mt: -1 }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ pt: 3 }}>
          {viewingError && (
            <Box>
              <Card sx={{ 
                mb: 3, 
                bgcolor: `${colors.mainBg}`, 
                borderRadius: 2,
                border: `1px solid ${colors.borderColor}`
              }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy }}>
                        {viewingError.error_title}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        <Chip 
                          label={viewingError.status} 
                          size="small"
                          sx={{
                            bgcolor: viewingError.status === 'Resolved' || viewingError.status === 'Closed' ? colors.success :
                                     viewingError.status === 'Completed' ? colors.info :
                                     viewingError.status === 'Pending' ? colors.warning :
                                     viewingError.status === 'In Progress' ? '#FF6F00' :
                                     viewingError.status === 'Rejected' ? colors.error : '#9E9E9E',
                            color: 'white',
                            fontWeight: 500,
                            height: 22,
                            fontSize: '11px'
                          }}
                        />
                        <Chip 
                          label={`Severity: ${viewingError.severity || 'Medium'}`} 
                          size="small"
                          sx={{
                            bgcolor: viewingError.severity === 'Critical' ? colors.error :
                                     viewingError.severity === 'High' ? '#e65100' :
                                     viewingError.severity === 'Medium' ? colors.warning :
                                     '#2E7D32',
                            color: 'white',
                            fontWeight: 500,
                            height: 22,
                            fontSize: '11px'
                          }}
                        />
                        <Chip 
                          label={`Priority: ${viewingError.priority || 'Medium'}`} 
                          size="small"
                          sx={{
                            bgcolor: viewingError.priority === 'Critical' ? colors.error :
                                     viewingError.priority === 'High' ? '#e65100' :
                                     viewingError.priority === 'Medium' ? colors.warning :
                                     '#2E7D32',
                            color: 'white',
                            fontWeight: 500,
                            height: 22,
                            fontSize: '11px'
                          }}
                        />
                        {viewingError.error_code && (
                          <Chip 
                            label={`Code: ${viewingError.error_code}`} 
                            size="small"
                            sx={{
                              bgcolor: colors.darkNavy,
                              color: 'white',
                              fontWeight: 500,
                              height: 22,
                              fontSize: '11px'
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.mainBg, 
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Equipment</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                      {viewingError.equipment_name || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.mainBg, 
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Hospital</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                      {viewingError.hospital_name || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.mainBg, 
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Reported By</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                      {viewingError.reported_by_name || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.mainBg, 
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Error Date</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                      {viewingError.error_date ? new Date(viewingError.error_date).toLocaleString() : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.mainBg, 
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Department</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                      {viewingError.department_name || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: colors.darkNavy }}>
                Error Description
              </Typography>
              <Paper sx={{ 
                p: 2, 
                bgcolor: colors.mainBg, 
                borderRadius: 2, 
                mb: 3,
                border: `1px solid ${colors.borderColor}`
              }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: colors.darkNavy }}>
                  {viewingError.error_description || 'No description provided'}
                </Typography>
              </Paper>

              {viewingError.attachments && viewingError.attachments.split(',').filter(Boolean).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: colors.darkNavy }}>
                    Attachments ({viewingError.attachments.split(',').filter(Boolean).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {viewingError.attachments.split(',').filter(Boolean).map((url, index) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                      const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi)$/i)
                      
                      const fullUrl = getFullUrl(url)
                      
                      return (
                        <Box 
                          key={index} 
                          sx={{ 
                            position: 'relative',
                            width: isImage ? 150 : 120,
                            height: isImage ? 150 : 120,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: `1px solid ${colors.borderColor}`,
                            bgcolor: colors.mainBg,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.05)', boxShadow: 4 }
                          }}
                          onClick={() => window.open(fullUrl, '_blank')}
                        >
                          {isImage ? (
                            <Box
                              component="img"
                              src={fullUrl}
                              alt={`Attachment ${index + 1}`}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                              }}
                            />
                          ) : isVideo ? (
                            <video style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={(e) => e.stopPropagation()}>
                              <source src={fullUrl} />
                            </video>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 1 }}>
                              <Typography variant="caption" align="center" noWrap sx={{ color: colors.lightText }}>{url.split('/').pop()}</Typography>
                            </Box>
                          )}
                          <Box sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            p: 0.5,
                            textAlign: 'center'
                          }}>
                            <Typography variant="caption" sx={{ fontSize: '9px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {url.split('/').pop().substring(0, 20)}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleCloseView} 
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Close
          </Button>
          {isSuperAdmin && viewingError && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this error?')) {
                  handleErrorDelete(viewingError.id)
                  handleCloseView()
                }
              }}
              startIcon={<Delete />}
              sx={{ 
                boxShadow: `0 4px 16px ${colors.error}44`,
                textTransform: 'none',
                borderRadius: 2,
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

export default ErrorLogs