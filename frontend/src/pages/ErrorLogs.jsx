// src/pages/ErrorLogs.jsx
// ✅ ENGINEER can Create, Edit, Delete
// ✅ SUPER_ADMIN and HOSPITAL_ADMIN can only View

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
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
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
  Refresh,
  AttachFile,
  Person,
  Error as ErrorIcon,
  CheckCircle,
  Close as CloseIcon,
  Assignment,
  PersonAdd,
  Cancel,
  PictureAsPdf,
  Description,
  TableChart,
  InsertDriveFile,
  Build,
  Warning,
  Info,
  Check,
  Schedule,
  Business,
  MedicalServices,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Pending,
  Verified,
  Save
} from '@mui/icons-material'
import { errorService, equipmentService, hospitalService, userService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import FileUpload from '../components/FileUpload'
import api from '../api/axios'

const ErrorLogs = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN'
  const isEngineer = user?.role === 'ENGINEER'
  
  // ✅ PERMISSIONS
  // ✅ Only ENGINEER can create, edit, delete
  const canCreate = isEngineer
  const canEdit = isEngineer
  const canDelete = isEngineer
  const canView = isSuperAdmin || isHospitalAdmin || isEngineer
  
  // ❌ SUPER_ADMIN and HOSPITAL_ADMIN cannot edit/delete
  const canChangeStatus = isEngineer // Only Engineer can change status

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
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  const [tempStatus, setTempStatus] = useState('')

  const [errors_validation, setErrors_validation] = useState({
    equipment_id: '',
    error_title: '',
    severity: '',
    priority: '',
    error_date: ''
  })

  const [filters, setFilters] = useState({
    status: '',
    severity: ''
  })

  const [errorFormData, setErrorFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
    severity: 'Medium',
    priority: 'Medium',
    status: 'Pending',
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
    // ✅ Only ENGINEER can create/edit
    if (!isEngineer) {
      toast.error('Only Biomedical Engineers can report and edit errors')
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
      setEditingError(error)
      setErrorFormData({
        equipment_id: error.equipment_id || '',
        error_code: error.error_code || '',
        error_title: error.error_title || '',
        error_description: error.error_description || '',
        severity: error.severity || 'Medium',
        priority: error.priority || 'Medium',
        status: error.status || 'Pending',
        error_date: error.error_date ? error.error_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
        reported_by: error.reported_by || user?.id || 1,
        hospital_id: error.hospital_id || user?.hospital_id || '',
        department_id: error.department_id || '',
        attachments: error.attachments || '',
        assigned_to: error.assigned_to || ''
      })
    } else {
      setEditingError(null)
      setErrorFormData({
        equipment_id: '',
        error_code: '',
        error_title: '',
        error_description: '',
        severity: 'Medium',
        priority: 'Medium',
        status: 'Pending',
        error_date: new Date().toISOString().slice(0, 16),
        reported_by: user?.id || 1,
        hospital_id: user?.hospital_id || '',
        department_id: '',
        attachments: '',
        assigned_to: ''
      })
    }
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
    setTempStatus(error.status || 'Pending')
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingError(null)
    setTempStatus('')
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
    // ✅ Only ENGINEER can submit
    if (!isEngineer) {
      toast.error('Only Biomedical Engineers can report errors')
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
        status: errorFormData.status || 'Pending',
        error_date: errorFormData.error_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        assigned_to: errorFormData.assigned_to || null,
        attachments: errorFormData.attachments || ''
      }

      if (editingError) {
        await errorService.update(editingError.id, submitData)
        toast.success('Error updated successfully')
      } else {
        await errorService.create(submitData)
        toast.success('Error reported successfully')
      }
      
      fetchErrors()
      handleCloseDialog()
    } catch (error) {
      console.error('❌ Submit error:', error)
      toast.error(error.response?.data?.message || error.message || 'Operation failed')
    }
  }

  // ✅ Only ENGINEER can save status
  const handleSaveStatus = async () => {
    if (!isEngineer) {
      toast.error('Only Biomedical Engineers can change error status')
      return
    }

    if (!viewingError) return
    if (tempStatus === viewingError.status) {
      toast.info('No changes to save')
      return
    }

    try {
      setStatusUpdateLoading(true)

      await errorService.update(viewingError.id, { status: tempStatus })
      
      const statusMessages = {
        'Pending': '⏳ Error marked as Pending',
        'In Progress': '🔄 Error in progress',
        'Completed': '✅ Error completed',
        'Resolved': '✅ Error resolved',
        'Closed': '🔒 Error closed',
        'Rejected': '❌ Error rejected'
      }
      
      toast.success(statusMessages[tempStatus] || `Status updated to ${tempStatus}`)
      setStatusUpdateLoading(false)
      fetchErrors()
      setViewingError({ ...viewingError, status: tempStatus })
      
    } catch (error) {
      console.error('Status update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update status')
      setStatusUpdateLoading(false)
    }
  }

  const handleStatusChange = (event) => {
    setTempStatus(event.target.value)
  }

  const handleErrorDelete = async (id) => {
    // ✅ Only ENGINEER can delete
    if (!isEngineer) {
      toast.error('Only Biomedical Engineers can delete errors')
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
    const matchesStatus = !filters.status || error.status === filters.status
    const matchesSeverity = !filters.severity || error.severity === filters.severity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const totalErrors = errors.length
  const openErrors = errors.filter(e => e.status === 'Pending' || e.status === 'In Progress').length
  const completedErrors = errors.filter(e => e.status === 'Completed').length
  const resolvedErrors = errors.filter(e => e.status === 'Resolved' || e.status === 'Closed').length
  const criticalErrors = errors.filter(e => e.severity === 'Critical').length

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Error Logs
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchErrors}
            size="small"
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
            >
              Report Error
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#0B5FA5" fontWeight={700}>
                {totalErrors}
              </Typography>
              <Typography variant="body2" color="textSecondary">Total Errors</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#ff9800" fontWeight={700}>
                {openErrors}
              </Typography>
              <Typography variant="body2" color="textSecondary">Open</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#e3f2fd' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#0B5FA5" fontWeight={700}>
                {completedErrors}
              </Typography>
              <Typography variant="body2" color="textSecondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#28a745" fontWeight={700}>
                {resolvedErrors}
              </Typography>
              <Typography variant="body2" color="textSecondary">Resolved</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {criticalErrors > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>{criticalErrors}</strong> critical error{criticalErrors > 1 ? 's' : ''} need immediate attention!
          </Typography>
        </Alert>
      )}

      {/* Filters & Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              label="Severity"
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

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Error</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Assigned To</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredErrors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No errors found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredErrors.map((error) => (
                <TableRow key={error.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {error.error_title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {error.error_code || 'No code'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {error.equipment_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {error.priority || 'Medium'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {error.assigned_to_name ? (
                      <Typography variant="body2" fontWeight={500} sx={{ color: '#0B5FA5' }}>
                        {error.assigned_to_name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {error.severity || 'Medium'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {error.status}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(error.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" onClick={() => handleViewError(error)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* ✅ Only ENGINEER can edit */}
                      {canEdit && (
                        <Tooltip title="Edit Error">
                          <IconButton size="small" color="info" onClick={() => handleOpenDialog(error)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {/* ✅ Only ENGINEER can delete */}
                      {canDelete && (
                        <Tooltip title="Delete Error">
                          <IconButton size="small" color="error" onClick={() => handleErrorDelete(error.id)}>
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

      {/* ADD/EDIT ERROR DIALOG - Only for ENGINEER */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {editingError ? 'Edit Error' : 'Report New Error'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Hospital - Optional */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hospital</InputLabel>
                <Select
                  name="hospital_id"
                  value={errorFormData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital"
                  disabled={!isEngineer}
                >
                  <MenuItem value="">Select Hospital (Optional)</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Department - Optional */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department_id"
                  value={errorFormData.department_id}
                  onChange={handleFormChange}
                  label="Department"
                >
                  <MenuItem value="">Select Department (Optional)</MenuItem>
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Equipment - REQUIRED */}
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors_validation.equipment_id}>
                <InputLabel>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={errorFormData.equipment_id}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  label="Equipment *"
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

            {/* Error Code - Optional */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Error Code (Optional)"
                name="error_code"
                value={errorFormData.error_code}
                onChange={handleFormChange}
                placeholder="e.g., ERR-001"
              />
            </Grid>

            {/* Severity - REQUIRED */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors_validation.severity}>
                <InputLabel>Severity *</InputLabel>
                <Select
                  name="severity"
                  value={errorFormData.severity}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  label="Severity *"
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

            {/* Priority - REQUIRED */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors_validation.priority}>
                <InputLabel>Priority *</InputLabel>
                <Select
                  name="priority"
                  value={errorFormData.priority}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  label="Priority *"
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

            {/* Status - ENGINEER can change */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={errorFormData.status}
                  onChange={handleFormChange}
                  label="Status"
                  disabled={!isEngineer}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                  <MenuItem value="Closed">Closed</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Error Title - REQUIRED */}
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
              />
            </Grid>

            {/* Error Description - Optional */}
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
              />
            </Grid>

            {/* Error Date - REQUIRED */}
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
              />
            </Grid>

            {/* Attachments - Optional */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Attachments (Optional)
              </Typography>
              <FileUpload
                endpoint="/api/upload"
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit} 
            sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
          >
            {editingError ? 'Update' : 'Report Error'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW ERROR DIALOG - All users can view */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseView} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#0B5FA5', 
          color: 'white',
          pb: 1
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
              <Card sx={{ mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight={700}>
                        {viewingError.error_title}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        <Typography variant="body2" fontWeight={500}>
                          Status: {viewingError.status}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">|</Typography>
                        <Typography variant="body2">
                          Severity: {viewingError.severity || 'Medium'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">|</Typography>
                        <Typography variant="body2">
                          Priority: {viewingError.priority || 'Medium'}
                        </Typography>
                        {viewingError.error_code && (
                          <>
                            <Typography variant="body2" color="textSecondary">|</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Code: {viewingError.error_code}
                            </Typography>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Equipment</Typography>
                    <Typography variant="body2" fontWeight={600}>{viewingError.equipment_name || 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Hospital</Typography>
                    <Typography variant="body2" fontWeight={600}>{viewingError.hospital_name || 'N/A'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Reported By</Typography>
                    <Typography variant="body2" fontWeight={600}>{viewingError.reported_by_name || 'Unknown'}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Assigned To</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: viewingError.assigned_to_name ? '#28a745' : '#6c757d' }}>
                      {viewingError.assigned_to_name || 'Unassigned'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Error Date</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {viewingError.error_date ? new Date(viewingError.error_date).toLocaleString() : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary">Department</Typography>
                    <Typography variant="body2" fontWeight={600}>{viewingError.department_name || 'N/A'}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#0B5FA5' }}>
                Error Description
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mb: 3 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {viewingError.error_description || 'No description provided'}
                </Typography>
              </Paper>

              {viewingError.attachments && viewingError.attachments.split(',').filter(Boolean).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#0B5FA5' }}>
                    Attachments ({viewingError.attachments.split(',').filter(Boolean).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {viewingError.attachments.split(',').filter(Boolean).map((url, index) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                      const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi)$/i)
                      const isPDF = url.match(/\.(pdf)$/i)
                      const isWord = url.match(/\.(doc|docx)$/i)
                      const isExcel = url.match(/\.(xls|xlsx)$/i)
                      
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
                            border: '1px solid #e9ecef',
                            bgcolor: '#f8f9fa',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: 4
                            }
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
                          ) : isPDF ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 1 }}>
                              <Typography variant="caption" align="center" noWrap>{url.split('/').pop()}</Typography>
                              <Typography variant="caption" color="textSecondary">PDF</Typography>
                            </Box>
                          ) : isWord ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 1 }}>
                              <Typography variant="caption" align="center" noWrap>{url.split('/').pop()}</Typography>
                              <Typography variant="caption" color="textSecondary">Word</Typography>
                            </Box>
                          ) : isExcel ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 1 }}>
                              <Typography variant="caption" align="center" noWrap>{url.split('/').pop()}</Typography>
                              <Typography variant="caption" color="textSecondary">Excel</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 1 }}>
                              <Typography variant="caption" align="center" noWrap>{url.split('/').pop()}</Typography>
                              <Typography variant="caption" color="textSecondary">File</Typography>
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

              {/* ✅ STATUS UPDATE - Only for ENGINEER */}
              {isEngineer && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: '#0B5FA5' }}>
                    Update Status
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Select Status</InputLabel>
                      <Select
                        value={tempStatus}
                        onChange={handleStatusChange}
                        label="Select Status"
                        disabled={statusUpdateLoading}
                      >
                        <MenuItem value="Pending">⏳ Pending</MenuItem>
                        <MenuItem value="In Progress">🔄 In Progress</MenuItem>
                        <MenuItem value="Completed">✅ Completed</MenuItem>
                        <MenuItem value="Resolved">✅ Resolved</MenuItem>
                        <MenuItem value="Closed">🔒 Closed</MenuItem>
                        <MenuItem value="Rejected">❌ Rejected</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      startIcon={statusUpdateLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                      onClick={handleSaveStatus}
                      disabled={statusUpdateLoading || tempStatus === viewingError.status}
                      sx={{ 
                        bgcolor: statusUpdateLoading ? '#6c757d' : '#28a745',
                        '&:hover': { bgcolor: statusUpdateLoading ? '#6c757d' : '#1e7e34' },
                        minWidth: 120
                      }}
                    >
                      {statusUpdateLoading ? 'Saving...' : 'Save Status'}
                    </Button>

                    {tempStatus !== viewingError.status && !statusUpdateLoading && (
                      <Typography variant="caption" color="warning.main">
                        ⚠️ Status changed, click Save to apply
                      </Typography>
                    )}
                  </Box>

                  {viewingError.assigned_to_name && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      👤 Assigned to: <strong>{viewingError.assigned_to_name}</strong>
                    </Typography>
                  )}
                </Box>
              )}

              {/* ✅ SUPER_ADMIN / HOSPITAL_ADMIN - View Only Message */}
              {(isSuperAdmin || isHospitalAdmin) && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>👀 View Only Mode:</strong> You can view all error details. 
                    Only Biomedical Engineers can report, edit, or update error status.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseView}>Close</Button>
          {/* ✅ Only ENGINEER can delete from view dialog */}
          {isEngineer && viewingError && (
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