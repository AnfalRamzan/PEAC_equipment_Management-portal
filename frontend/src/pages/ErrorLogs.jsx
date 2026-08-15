// src/pages/ErrorLogs.jsx
// ✅ UPDATED: Severity Removed, Priority Only, Closed Removed
// ✅ FIXED: Status Update - No frontend permission check (Backend handles it)

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
  FormHelperText,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog as PreviewDialog,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Close,
  Refresh,
  OpenInNew,
  Image as ImageIcon,
  VideoLibrary,
  Description,
  InsertDriveFile,
  ZoomIn,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
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
  mainBg: '#F1F5F9',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

// ✅ Helper function to get full URL
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

// ✅ Helper function to check file type
const isImageFile = (url) => {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

const isVideoFile = (url) => {
  if (!url) return false
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'].includes(ext)
}

const getFileName = (url) => {
  if (!url) return 'File'
  const parts = url.split('/')
  return parts[parts.length - 1] || 'File'
}

// ✅ COMPONENT: Attachment Grid with Preview
const AttachmentGrid = ({ attachments, onFileClick }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState('')

  if (!attachments || attachments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3, bgcolor: colors.mainBg, borderRadius: 2 }}>
        <InsertDriveFile sx={{ fontSize: 40, color: colors.lightText, opacity: 0.3 }} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          No attachments
        </Typography>
      </Box>
    )
  }

  const handlePreview = (url) => {
    const fullUrl = getFullUrl(url)
    const isImg = isImageFile(url)
    const isVideo = isVideoFile(url)
    
    setPreviewUrl(fullUrl)
    setPreviewType(isImg ? 'image' : isVideo ? 'video' : 'document')
    setPreviewOpen(true)
  }

  return (
    <Box>
      <ImageList cols={3} gap={12} sx={{ mb: 0 }}>
        {attachments.map((url, index) => {
          const isImg = isImageFile(url)
          const isVideo = isVideoFile(url)
          const fileName = getFileName(url)
          const fullUrl = getFullUrl(url)

          return (
            <ImageListItem 
              key={index} 
              sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                border: `1px solid ${colors.borderColor}`,
                position: 'relative',
                cursor: 'pointer',
                bgcolor: colors.mainBg,
                '&:hover': {
                  boxShadow: `0 4px 20px ${colors.lightCyanGlow}`,
                  '& .attachment-overlay': {
                    opacity: 1,
                  }
                }
              }}
              onClick={() => handlePreview(url)}
            >
              {isImg ? (
                <Box
                  component="img"
                  src={fullUrl}
                  alt={fileName}
                  sx={{
                    width: '100%',
                    height: 140,
                    objectFit: 'cover',
                    bgcolor: colors.mainBg,
                  }}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="140"%3E%3Crect width="200" height="140" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'
                  }}
                />
              ) : isVideo ? (
                <Box sx={{ 
                  height: 140, 
                  bgcolor: colors.darkNavy,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <VideoLibrary sx={{ fontSize: 48, color: colors.lightCyan, opacity: 0.7 }} />
                  <Typography variant="caption" sx={{ color: colors.textLight, mt: 1 }}>
                    {fileName}
                  </Typography>
                  <Box sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                  }}>
                    <OpenInNew sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 140, 
                  bgcolor: colors.mainBg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1,
                }}>
                  <Description sx={{ fontSize: 40, color: colors.lightText }} />
                  <Typography variant="caption" sx={{ 
                    color: colors.lightText, 
                    mt: 1, 
                    textAlign: 'center',
                    maxWidth: '90%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {fileName}
                  </Typography>
                </Box>
              )}
              
              {/* Overlay with file name and open button */}
              <Box 
                className="attachment-overlay"
                sx={{ 
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  p: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                }}
              >
                <Typography variant="caption" sx={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap', 
                  flex: 1, 
                  mr: 1 
                }}>
                  {fileName}
                </Typography>
                <Tooltip title="Preview">
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreview(url)
                    }}
                  >
                    <ZoomIn fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open in new tab">
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(fullUrl, '_blank')
                    }}
                  >
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ImageListItem>
          )
        })}
      </ImageList>

      {/* ✅ Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.92)',
            border: `1px solid ${colors.borderColor}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: 'white',
        }}>
          <Typography variant="h6">File Preview</Typography>
          <Box>
            <Button
              size="small"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', mr: 1 }}
              onClick={() => window.open(previewUrl, '_blank')}
              startIcon={<OpenInNew />}
            >
              Open in New Tab
            </Button>
            <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          p: 2,
        }}>
          {previewType === 'image' ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
              }}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
              }}
            />
          ) : previewType === 'video' ? (
            <video
              src={previewUrl}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 2,
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <Description sx={{ fontSize: 80, color: colors.lightText, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Document Preview Not Available
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textLight, mb: 2 }}>
                This file type cannot be previewed directly.
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.open(previewUrl, '_blank')}
                sx={{
                  bgcolor: colors.darkNavy,
                  '&:hover': { bgcolor: colors.darkNavyHover },
                }}
              >
                Download File
              </Button>
            </Box>
          )}
        </DialogContent>
      </PreviewDialog>
    </Box>
  )
}

// ✅ STATUS CHIP COMPONENT
const StatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || 'pending'
    switch(s) {
      case 'resolved':
      case 'completed':
        return { bg: colors.success, icon: <CheckCircle sx={{ fontSize: 14 }} /> }
      case 'in progress':
        return { bg: '#FF6F00', icon: <Warning sx={{ fontSize: 14 }} /> }
      case 'pending':
        return { bg: colors.warning, icon: <Warning sx={{ fontSize: 14 }} /> }
      case 'rejected':
        return { bg: colors.error, icon: <ErrorIcon sx={{ fontSize: 14 }} /> }
      default:
        return { bg: '#9E9E9E', icon: <Info sx={{ fontSize: 14 }} /> }
    }
  }

  const { bg, icon } = getStatusColor(status)
  const displayStatus = status || 'Pending'

  return (
    <Chip 
      label={displayStatus} 
      size="small"
      icon={icon}
      sx={{
        bgcolor: bg,
        color: 'white',
        fontWeight: 500,
        height: 24,
        fontSize: '11px',
        '& .MuiChip-icon': { color: 'white', fontSize: 14 },
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
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

  // ============================================================
  // ✅ STATE VARIABLES
  // ============================================================
  const [errors, setErrors] = useState([])
  const [equipment, setEquipment] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingError, setEditingError] = useState(null)
  const [viewingError, setViewingError] = useState(null)

  // ✅ Status Update States
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [selectedErrorForStatus, setSelectedErrorForStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  const [errors_validation, setErrors_validation] = useState({
    equipment_id: '',
    error_title: '',
    priority: '',
    error_date: ''
  })

  // ✅ Filters - Priority only
  const [filters, setFilters] = useState({
    priority: ''
  })

  const [errorFormData, setErrorFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
    priority: 'Medium',
    error_date: new Date().toISOString().slice(0, 16),
    reported_by: user?.id || 1,
    hospital_id: user?.hospital_id || '',
    department_id: '',
    attachments: '',
    assigned_to: ''
  })

  // ============================================================
  // ✅ EFFECTS
  // ============================================================
  useEffect(() => {
    fetchErrors()
    fetchEquipment()
    fetchHospitals()
    fetchDepartments()
    fetchUsers()
  }, [])

  // ============================================================
  // ✅ DATA FETCHING FUNCTIONS - WITH FORCE REFRESH
  // ============================================================
  const fetchErrors = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    
    try {
      console.log('📊 Fetching errors...')
      const response = await errorService.getAll()
      console.log('📊 Errors fetched:', response.data.errors?.length || 0, 'items')
      setErrors(response.data.errors || [])
      return response.data.errors || []
    } catch (error) {
      console.error('❌ Failed to fetch errors:', error)
      toast.error('Failed to fetch errors')
      setErrors([])
      return []
    } finally {
      if (showLoading) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
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

  // ============================================================
  // ✅ VALIDATION FUNCTIONS
  // ============================================================
  const validateField = (name, value) => {
    let error = ''
    switch (name) {
      case 'equipment_id':
        if (!value) error = 'Equipment is required'
        break
      case 'error_title':
        if (!value || value.trim() === '') error = 'Error title is required'
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
    const priorityError = validateField('priority', errorFormData.priority)
    const dateError = validateField('error_date', errorFormData.error_date)
    
    setErrors_validation(prev => ({
      ...prev,
      equipment_id: equipmentError,
      error_title: titleError,
      priority: priorityError,
      error_date: dateError
    }))
    
    return !equipmentError && !titleError && !priorityError && !dateError
  }

  // ============================================================
  // ✅ DIALOG HANDLERS
  // ============================================================
  const handleOpenDialog = (error = null) => {
    if (!isEngineer && !error) {
      toast.error('Only Engineers can report errors')
      return
    }
    
    setErrors_validation({
      equipment_id: '',
      error_title: '',
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

  // ============================================================
  // ✅ STATUS UPDATE HANDLERS - FIXED (No frontend permission check)
  // ============================================================
  const handleOpenStatusDialog = (error) => {
    setSelectedErrorForStatus(error)
    setNewStatus(error.status || 'Pending')
    setOpenStatusDialog(true)
  }

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false)
    setSelectedErrorForStatus(null)
    setNewStatus('')
    setStatusUpdating(false)
  }

  // ✅ FIXED: Status Update Handler - No frontend permission check
  const handleStatusUpdate = async () => {
    if (!selectedErrorForStatus || !newStatus) {
      toast.error('Please select a status')
      return
    }

    if (selectedErrorForStatus.status === newStatus) {
      toast.info(`Status is already set to "${newStatus}"`)
      handleCloseStatusDialog()
      return
    }

    setStatusUpdating(true)

    try {
      const userRole = user?.role;
      const userId = user?.id;
      
      console.log('🔄 Updating status for error ID:', selectedErrorForStatus.id)
      console.log('📌 Old status:', selectedErrorForStatus.status)
      console.log('📌 New status:', newStatus)
      console.log('📌 User Role:', userRole)
      console.log('📌 User ID:', userId)

      // ✅ Frontend permission check REMOVED - Backend will handle it
      // Backend now allows engineers to update any error in their hospital

      let response = null;

      // ✅ Super Admin can use PATCH
      if (userRole === 'SUPER_ADMIN') {
        try {
          console.log('📌 Trying PATCH for Super Admin...')
          response = await api.patch(`/errors/${selectedErrorForStatus.id}/status`, {
            status: newStatus
          })
        } catch (patchError) {
          console.log('⚠️ PATCH failed, trying PUT...', patchError.message)
          response = await api.put(`/errors/${selectedErrorForStatus.id}`, {
            status: newStatus
          })
        }
      } else {
        // ✅ For Engineers and Hospital Admins, use PUT
        console.log('📌 Using PUT for User...')
        response = await api.put(`/errors/${selectedErrorForStatus.id}`, {
          status: newStatus
        })
      }

      if (response.data.success) {
        toast.success(`Status updated to "${newStatus}" successfully!`)
        handleCloseStatusDialog()
        
        setTimeout(async () => {
          await fetchErrors(false)
        }, 500)
      } else {
        toast.error(response.data.message || 'Failed to update status')
      }

    } catch (error) {
      console.error('❌ Status update error:', error)
      console.error('❌ Error response:', error.response?.data)
      
      // ✅ Show detailed error message
      const errorMessage = error.response?.data?.message || 'Failed to update status'
      toast.error(errorMessage)
    } finally {
      setStatusUpdating(false)
    }
  }

  // ============================================================
  // ✅ FORM HANDLERS
  // ============================================================
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
        priority: errorFormData.priority || 'Medium',
        error_date: errorFormData.error_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        attachments: errorFormData.attachments || ''
      }

      await errorService.create(submitData)
      toast.success('Error reported successfully')
      
      await fetchErrors(false)
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
        await fetchErrors(false)
        if (openViewDialog) {
          handleCloseView()
        }
      } catch (error) {
        toast.error('Failed to delete error')
      }
    }
  }

  // ============================================================
  // ✅ FILTERED DATA - Priority only
  // ============================================================
  const filteredErrors = errors.filter(error => {
    const matchesSearch = error.error_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.error_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = !filters.priority || error.priority === filters.priority
    return matchesSearch && matchesPriority
  })

  const totalErrors = errors.length
  const openErrors = errors.filter(e => e.status === 'Pending' || e.status === 'In Progress').length
  const completedErrors = errors.filter(e => e.status === 'Completed').length
  const resolvedErrors = errors.filter(e => e.status === 'Resolved').length

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
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {refreshing && <CircularProgress size={20} sx={{ color: colors.lightCyan }} />}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchErrors(false)}
            size="small"
            disabled={refreshing}
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
            {refreshing ? 'Refreshing...' : 'Refresh'}
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

      {/* Stats Cards */}
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

      {/* Search & Filter - Priority Only */}
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
            <InputLabel sx={{ color: colors.lightText }}>Priority</InputLabel>
            <Select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              label="Priority"
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

      {/* Table - Severity Column Removed */}
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
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredErrors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
                  <TableCell>
                    <Chip 
                      label={error.priority || 'Medium'} 
                      size="small"
                      sx={{
                        bgcolor: error.priority === 'Critical' ? colors.error :
                                 error.priority === 'High' ? '#e65100' :
                                 error.priority === 'Medium' ? colors.warning :
                                 '#2E7D32',
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '11px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={error.status || 'Pending'} />
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
                      
                      {/* ✅ Status Update Button - Visible to Super Admin & Engineer */}
                      {(isSuperAdmin || isEngineer) && (
                        <Tooltip title="Update Status">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenStatusDialog(error)}
                            sx={{ 
                              color: colors.info, 
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

      {/* REPORT ERROR DIALOG - Updated */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
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
        
        <DialogContent dividers sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={errorFormData.equipment_id}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  error={!!errors_validation.equipment_id}
                  label="Equipment"
                >
                  {equipment.map((eq) => (
                    <MenuItem key={eq.id} value={eq.id}>
                      {eq.name} - {eq.model || 'No Model'}
                    </MenuItem>
                  ))}
                </Select>
                {errors_validation.equipment_id && (
                  <FormHelperText error>{errors_validation.equipment_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="error_title"
                label="Error Title"
                value={errorFormData.error_title}
                onChange={handleFormChange}
                onBlur={handleBlur}
                error={!!errors_validation.error_title}
                helperText={errors_validation.error_title}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="error_code"
                label="Error Code (Optional)"
                value={errorFormData.error_code}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="error_description"
                label="Error Description"
                value={errorFormData.error_description}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={errorFormData.priority}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  error={!!errors_validation.priority}
                  label="Priority"
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
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="error_date"
                label="Error Date"
                type="datetime-local"
                value={errorFormData.error_date}
                onChange={handleFormChange}
                onBlur={handleBlur}
                error={!!errors_validation.error_date}
                helperText={errors_validation.error_date}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, color: colors.lightText }}>
                Attachments
              </Typography>
              <FileUpload
                onFileUploaded={(url) => {
                  setErrorFormData(prev => ({
                    ...prev,
                    attachments: url
                  }))
                }}
                onError={(error) => toast.error(error)}
                accept="image/*,video/*,.pdf,.doc,.docx"
                maxSize={50}
              />
              {errorFormData.attachments && (
                <Typography variant="caption" sx={{ color: colors.success, display: 'block', mt: 1 }}>
                  ✅ File uploaded successfully
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
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

      {/* ✅ VIEW ERROR DIALOG */}
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
        {viewingError && (
          <>
            <DialogTitle sx={{ 
              bgcolor: colors.darkNavy, 
              color: 'white',
              borderRadius: '8px 8px 0 0',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                  Error Details
                </Typography>
                <Box>
                  {canDelete && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleErrorDelete(viewingError.id)}
                      sx={{ mr: 1, color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                      Delete
                    </Button>
                  )}
                  <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
                    <Close />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: colors.darkNavy }}>
                    {viewingError.error_title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>
                    Code: {viewingError.error_code || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                    Equipment
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkNavy, fontWeight: 500 }}>
                    {viewingError.equipment_name}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                    Priority
                  </Typography>
                  <Chip 
                    label={viewingError.priority || 'Medium'} 
                    size="small"
                    sx={{
                      bgcolor: viewingError.priority === 'Critical' ? colors.error :
                               viewingError.priority === 'High' ? '#e65100' :
                               viewingError.priority === 'Medium' ? colors.warning :
                               '#2E7D32',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkText }}>
                    {viewingError.error_description || 'No description provided'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                    Status
                  </Typography>
                  <StatusChip status={viewingError.status || 'Pending'} />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                    Reported By
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                    {viewingError.reported_by_name || 'Unknown'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                    Attachments
                  </Typography>
                  <AttachmentGrid 
                    attachments={viewingError.attachments ? viewingError.attachments.split(',').filter(Boolean) : []}
                  />
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* ✅ STATUS UPDATE DIALOG - Closed Removed */}
      <Dialog 
        open={openStatusDialog} 
        onClose={handleCloseStatusDialog} 
        maxWidth="xs" 
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
          bgcolor: colors.info, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Update Error Status
            </Typography>
            <IconButton onClick={handleCloseStatusDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ mt: 1 }}>
          {selectedErrorForStatus && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  {selectedErrorForStatus.error_title}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: colors.lightText }}>
                  Equipment: {selectedErrorForStatus.equipment_name}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: colors.lightText, mt: 0.5 }}>
                  Current Status: <strong>{selectedErrorForStatus.status || 'Pending'}</strong>
                </Typography>
                {user?.role === 'ENGINEER' && (
                  <Typography variant="caption" sx={{ display: 'block', color: colors.warning, mt: 0.5 }}>
                    ℹ️ You can update any error in your hospital
                  </Typography>
                )}
              </Alert>
              
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="New Status"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseStatusDialog} 
            disabled={statusUpdating}
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
            onClick={handleStatusUpdate}
            disabled={statusUpdating}
            sx={{ 
              bgcolor: colors.info, 
              '&:hover': { 
                bgcolor: '#1D4ED8',
                boxShadow: `0 4px 20px ${colors.info}44`
              },
              boxShadow: `0 4px 16px ${colors.info}44`,
              textTransform: 'none',
              borderRadius: 2,
              minWidth: 120,
            }}
          >
            {statusUpdating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                Updating...
              </Box>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ErrorLogs