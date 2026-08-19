// src/pages/ErrorLogs.jsx
// ✅ UPDATED: Status Update with Resolution Date
// ✅ When status is Resolved, user must select resolution date

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
  MedicalServices,
  LocalHospital,
  Engineering,
  ErrorOutline,
  FilterList,
  Download,
  FileDownload,
  TimerOff,
} from '@mui/icons-material'
import { errorService, equipmentService, hospitalService, userService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import FileUpload from '../components/FileUpload'
import api from '../api/axios'
import AccessDenied from '../components/Auth/AccessDenied'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
}

// ✅ Animation Styles
const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes prominentGlow {
  0% {
    box-shadow: 0 0 20px rgba(103, 232, 249, 0.2), 0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(103, 232, 249, 0.4), 0 0 80px rgba(103, 232, 249, 0.2);
    border-color: rgba(103, 232, 249, 0.6);
  }
  100% {
    box-shadow: 0 0 20px rgba(103, 232, 249, 0.2), 0 0 40px rgba(103, 232, 249, 0.1);
    border-color: rgba(103, 232, 249, 0.3);
  }
}
`

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

// ✅ Calculate downtime in days only - with 2 decimal places (NO HOURS)
const calculateDowntime = (error) => {
  if (!error) return { hours: 0, days: 0, display: '0.00d' }
  
  // If status is Resolved, calculate from creation to resolution
  if (error.status === 'Resolved') {
    const startDate = error.error_date || error.created_at
    const endDate = error.resolved_at || error.updated_at
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffMs = end - start
      const diffHours = diffMs / (1000 * 60 * 60)
      const diffDays = diffHours / 24
      
      if (diffHours > 0) {
        return { 
          hours: diffHours, 
          days: diffDays,
          display: `${diffDays.toFixed(2)}d`
        }
      }
    }
  }
  
  // If still open, calculate from creation to now
  const startDate = error.error_date || error.created_at
  if (startDate) {
    const start = new Date(startDate)
    const now = new Date()
    const diffMs = now - start
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffHours / 24
    
    if (diffHours > 0) {
      return { 
        hours: diffHours, 
        days: diffDays,
        display: `${diffDays.toFixed(2)}d`
      }
    }
  }
  
  return { hours: 0, days: 0, display: '0.00d' }
}

// ✅ STATUS CHIP - Same style as Equipment page with proper colors
const StatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || 'pending'
    switch(s) {
      case 'resolved':
        return { bg: '#22C55E', color: 'white' }
      case 'in progress':
        return { bg: '#F59E0B', color: 'white' }
      case 'pending':
        return { bg: '#EF4444', color: 'white' }
      default:
        return { bg: '#9E9E9E', color: 'white' }
    }
  }

  const { bg, color } = getStatusColor(status)
  const displayStatus = status || 'Pending'

  return (
    <Chip
      label={displayStatus}
      size="small"
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: 600,
        fontSize: '11px',
        height: 26,
        borderRadius: 2,
        '& .MuiChip-label': {
          px: 1.5,
          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
        }
      }}
    />
  )
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
  const [categories, setCategories] = useState([])
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
  
  // ✅ Filter Menu State
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  
  // ✅ Export Menu State
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  // ✅ Status Update States
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [selectedErrorForStatus, setSelectedErrorForStatus] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  
  // ✅ NEW: Resolution Date State
  const [resolutionDate, setResolutionDate] = useState('')

  const [errors_validation, setErrors_validation] = useState({
    equipment_id: '',
    error_title: '',
    error_date: ''
  })

  // ✅ Filters
  const [filters, setFilters] = useState({
    category: '',
    manufacturer: '',
    status: '',
    hospital: '',
    equipment: '',
    fromDate: '',
    toDate: ''
  })

  const [errorFormData, setErrorFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
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
    fetchCategories()
    fetchHospitals()
    fetchDepartments()
    fetchUsers()
  }, [])

  // ============================================================
  // ✅ DATA FETCHING FUNCTIONS
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

  const fetchCategories = async () => {
    try {
      const response = await api.get('/equipment/categories/all')
      if (response.data && response.data.success) {
        setCategories(response.data.categories || [])
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
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
  // ✅ FILTER HANDLERS
  // ============================================================
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget)
  const handleFilterClose = () => setFilterAnchorEl(null)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ 
      category: '', 
      manufacturer: '', 
      status: '', 
      hospital: '',
      equipment: '',
      fromDate: '',
      toDate: ''
    })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToExcel = () => {
    try {
      const data = filteredErrors.map(e => {
        const downtime = calculateDowntime(e)
        return {
          'Error Title': e.error_title || '',
          'Error Code': e.error_code || '',
          'Equipment': e.equipment_name || '',
          'Hospital': e.hospital_name || e.hospital?.name || '',
          'Status': e.status || '',
          'Reporting Date': e.error_date ? new Date(e.error_date).toLocaleDateString() : '',
          'Resolution Date': e.status === 'Resolved' ? (e.resolved_at ? new Date(e.resolved_at).toLocaleDateString() : e.updated_at ? new Date(e.updated_at).toLocaleDateString() : '') : '',
          'Downtime (Days)': downtime.days.toFixed(2),
          'Reported By': e.reported_by_name || ''
        }
      })
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Error Logs')
      XLSX.writeFile(wb, `error_logs_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Error Logs Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Errors: ${filteredErrors.length}`, 14, 34)
      
      const tableData = filteredErrors.map(e => {
        const downtime = calculateDowntime(e)
        return [
          e.error_title || '',
          e.equipment_name || '',
          e.hospital_name || e.hospital?.name || '',
          e.status || '',
          e.error_date ? new Date(e.error_date).toLocaleDateString() : '',
          e.status === 'Resolved' ? (e.resolved_at ? new Date(e.resolved_at).toLocaleDateString() : e.updated_at ? new Date(e.updated_at).toLocaleDateString() : '') : '',
          downtime.display
        ]
      })
      autoTable(doc, {
        head: [['Error', 'Equipment', 'Hospital', 'Status', 'Reporting Date', 'Resolution Date', 'Downtime']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`error_logs_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
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
    const dateError = validateField('error_date', errorFormData.error_date)
    
    setErrors_validation(prev => ({
      ...prev,
      equipment_id: equipmentError,
      error_title: titleError,
      error_date: dateError
    }))
    
    return !equipmentError && !titleError && !dateError
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
      error_date: ''
    })
  }

  const handleViewError = (error) => {
    setViewingError({
      ...error,
      attachments: error.attachments || '',
      downtime: calculateDowntime(error)
    })
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingError(null)
  }

  // ============================================================
  // ✅ STATUS UPDATE HANDLERS - WITH RESOLUTION DATE
  // ============================================================
  const handleOpenStatusDialog = (error) => {
    setSelectedErrorForStatus(error)
    setNewStatus(error.status || 'Pending')
    // ✅ Set resolution date if already resolved
    setResolutionDate(error.resolved_at || error.updated_at || '')
    setOpenStatusDialog(true)
  }

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false)
    setSelectedErrorForStatus(null)
    setNewStatus('')
    setResolutionDate('')
    setStatusUpdating(false)
  }

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

    // ✅ If status is Resolved, resolution date is required
    if (newStatus === 'Resolved' && !resolutionDate) {
      toast.error('Please select a resolution date')
      return
    }

    setStatusUpdating(true)

    try {
      const userRole = user?.role;
      const userId = user?.id;
      
      console.log('🔄 Updating status for error ID:', selectedErrorForStatus.id)
      console.log('📌 Old status:', selectedErrorForStatus.status)
      console.log('📌 New status:', newStatus)
      console.log('📌 Resolution Date:', resolutionDate)
      console.log('📌 User Role:', userRole)

      let response = null;

      // ✅ Prepare update data with resolution date
      const updateData = {
        status: newStatus
      }
      
      // ✅ Add resolved_at if status is Resolved
      if (newStatus === 'Resolved' && resolutionDate) {
        updateData.resolved_at = resolutionDate
      }

      if (userRole === 'SUPER_ADMIN') {
        try {
          console.log('📌 Trying PATCH for Super Admin...')
          response = await api.patch(`/errors/${selectedErrorForStatus.id}/status`, updateData)
        } catch (patchError) {
          console.log('⚠️ PATCH failed, trying PUT...', patchError.message)
          response = await api.put(`/errors/${selectedErrorForStatus.id}`, updateData)
        }
      } else {
        console.log('📌 Using PUT for User...')
        response = await api.put(`/errors/${selectedErrorForStatus.id}`, updateData)
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
  // ✅ FILTERED DATA
  // ============================================================
  const filteredErrors = errors.filter(error => {
    const matchesSearch = error.error_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.error_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const errorDate = error.error_date || error.created_at
    const matchesFromDate = !filters.fromDate || new Date(errorDate) >= new Date(filters.fromDate)
    const matchesToDate = !filters.toDate || new Date(errorDate) <= new Date(filters.toDate)
    
    const matchesCategory = !filters.category || error.category_id === parseInt(filters.category)
    const matchesManufacturer = !filters.manufacturer || 
      error.manufacturer?.toLowerCase().includes(filters.manufacturer.toLowerCase())
    const matchesStatus = !filters.status || error.status === filters.status
    const matchesHospital = !filters.hospital || error.hospital_id === parseInt(filters.hospital)
    const matchesEquipment = !filters.equipment || error.equipment_id === parseInt(filters.equipment)
    
    return matchesSearch && matchesFromDate && matchesToDate && 
           matchesCategory && matchesManufacturer && matchesStatus && 
           matchesHospital && matchesEquipment
  })

  const totalErrors = errors.length
  const openErrors = errors.filter(e => e.status === 'Pending' || e.status === 'In Progress').length
  const resolvedErrors = errors.filter(e => e.status === 'Resolved').length

  // ✅ Stats Cards Data
  const statsCards = [
    {
      title: 'Total Errors',
      value: totalErrors,
      icon: <ErrorOutline />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/errors'
    },
    {
      title: 'Open',
      value: openErrors,
      icon: <Warning />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/errors?status=open'
    },
    {
      title: 'Resolved',
      value: resolvedErrors,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/errors?status=resolved'
    },
  ]

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

      {/* Header */}
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
            Error Logs
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Track and manage equipment errors with downtime tracking
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {refreshing && <CircularProgress size={20} sx={{ color: colors.lightCyan }} />}
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchErrors(false)}
            size="small"
            disabled={refreshing}
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
              '&:active': {
                bgcolor: colors.lightCyan,
                color: colors.darkNavy,
                borderColor: colors.lightCyan,
                transform: 'scale(0.96)',
              }
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
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
          
          {canReport && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
              Report Error
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={4} sm={4} key={index}>
            <Grow in timeout={300 + index * 100}>
              <Card sx={{ 
                borderRadius: 3,
                border: `1px solid ${colors.borderColor}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
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
                        color: colors.lightCyan,
                      }}
                    >
                      {React.cloneElement(card.icon, { 
                        sx: { 
                          fontSize: 22,
                          color: colors.lightCyan,
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

      {/* Search */}
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
            placeholder="Search errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
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
                '& .MuiInputBase-input': {
                  fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  fontSize: '0.9rem',
                }
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
          Filter Errors
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Category</InputLabel>
          <Select 
            name="category" 
            value={filters.category} 
            onChange={handleFilterChange} 
            label="Category"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

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
          <InputLabel sx={{ color: colors.lightText }}>Equipment</InputLabel>
          <Select 
            name="equipment" 
            value={filters.equipment} 
            onChange={handleFilterChange} 
            label="Equipment"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            {equipment.map(eq => (
              <MenuItem key={eq.id} value={eq.id}>{eq.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth 
          size="small" 
          label="Manufacturer" 
          name="manufacturer"
          value={filters.manufacturer} 
          onChange={handleFilterChange}
          placeholder="Filter by manufacturer" 
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': { borderColor: colors.lightCyan },
              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
            }
          }}
        />

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
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label="From Date"
          type="date"
          name="fromDate"
          value={filters.fromDate || ''}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': { borderColor: colors.lightCyan },
              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
            }
          }}
        />

        <TextField
          fullWidth
          size="small"
          label="To Date"
          type="date"
          name="toDate"
          value={filters.toDate || ''}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': { borderColor: colors.lightCyan },
              '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
            }
          }}
        />

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

      {/* Table */}
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
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Error</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Reporting Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Resolution Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }} align="center">Downtime</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredErrors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <ErrorOutline sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      No errors found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredErrors.map((error, index) => {
                const downtime = calculateDowntime(error)
                const downtimeColor = downtime.days > 7 ? colors.error : 
                                     downtime.days > 3 ? colors.warning : colors.lightText
                
                return (
                  <TableRow 
                    key={error.id} 
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
                      <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                        {error.error_title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                        {error.error_code || 'No code'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {error.equipment_name}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {error.hospital_name || error.hospital?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={error.status || 'Pending'} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                        {error.error_date ? new Date(error.error_date).toLocaleDateString() : 
                         error.created_at ? new Date(error.created_at).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        color: error.status === 'Resolved' ? colors.success : colors.lightText,
                        fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif"
                      }}>
                        {error.status === 'Resolved' ? 
                          (error.resolved_at ? new Date(error.resolved_at).toLocaleDateString() : 
                           error.updated_at ? new Date(error.updated_at).toLocaleDateString() : 'N/A') : 
                          '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`${downtime.days.toFixed(2)} days`}>
                        <Chip
                          label={downtime.display}
                          size="small"
                          sx={{
                            bgcolor: downtimeColor,
                            color: downtimeColor === colors.lightText ? colors.darkNavy : 'white',
                            fontWeight: 600,
                            fontSize: '10px',
                            height: 22,
                            borderRadius: 2,
                            minWidth: 50,
                          }}
                        />
                      </Tooltip>
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
                        
                        {(isSuperAdmin || isEngineer) && (
                          <Tooltip title="Update Status">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenStatusDialog(error)}
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
                          <Tooltip title="Delete Error">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleErrorDelete(error.id)}
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

      {/* REPORT ERROR DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
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
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ErrorOutline sx={{ fontSize: 28 }} />
              Report New Error
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ mt: 1, px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={errorFormData.equipment_id}
                  onChange={handleFormChange}
                  onBlur={handleBlur}
                  error={!!errors_validation.equipment_id}
                  label="Equipment"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiSelect-select': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                >
                  {equipment.map((eq) => (
                    <MenuItem key={eq.id} value={eq.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {eq.name} - {eq.model || 'No Model'}
                    </MenuItem>
                  ))}
                </Select>
                {errors_validation.equipment_id && (
                  <FormHelperText error sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{errors_validation.equipment_id}</FormHelperText>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="error_code"
                label="Error Code (Optional)"
                value={errorFormData.error_code}
                onChange={handleFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="error_date"
                label="Error Reporting Date"
                type="datetime-local"
                value={errorFormData.error_date}
                onChange={handleFormChange}
                onBlur={handleBlur}
                error={!!errors_validation.error_date}
                helperText={errors_validation.error_date}
                required
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
                <Typography variant="caption" sx={{ color: colors.success, display: 'block', mt: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  File uploaded successfully
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
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              borderRadius: 2,
              px: 4,
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
            Report Error
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW ERROR DIALOG */}
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
        {viewingError && (
          <>
            <DialogTitle sx={{ 
              bgcolor: colors.darkNavy, 
              color: 'white',
              borderRadius: '8px 8px 0 0',
              py: 2.5,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ErrorOutline sx={{ fontSize: 28 }} />
                  Error Details
                </Typography>
                <Box>
                  {canDelete && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleErrorDelete(viewingError.id)}
                      sx={{ mr: 1, color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", textTransform: 'none' }}
                    >
                      Delete
                    </Button>
                  )}
                  <IconButton onClick={handleCloseView} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
                    <Close />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ px: 4, py: 3 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingError.error_title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    Code: {viewingError.error_code || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Equipment
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkNavy, fontWeight: 500, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingError.equipment_name}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Hospital
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkNavy, fontWeight: 500, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingError.hospital_name || viewingError.hospital?.name || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Status
                  </Typography>
                  <StatusChip status={viewingError.status || 'Pending'} />
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Downtime
                  </Typography>
                  {viewingError.downtime && (
                    <Chip
                      label={`${viewingError.downtime.display} (${viewingError.downtime.days.toFixed(2)} days)`}
                      size="small"
                      sx={{
                        bgcolor: viewingError.downtime.days > 7 ? colors.error : 
                                 viewingError.downtime.days > 3 ? colors.warning : colors.lightCyan,
                        color: viewingError.downtime.days > 3 ? 'white' : colors.darkNavy,
                        fontWeight: 600,
                        height: 26,
                        borderRadius: 2,
                      }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Reported By
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingError.reported_by_name || 'Unknown'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingError.error_description || 'No description provided'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Reporting Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingError.error_date ? new Date(viewingError.error_date).toLocaleString() : 
                     viewingError.created_at ? new Date(viewingError.created_at).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Resolution Date
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: viewingError.status === 'Resolved' ? colors.success : colors.lightText,
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif"
                  }}>
                    {viewingError.status === 'Resolved' ? 
                      (viewingError.resolved_at ? new Date(viewingError.resolved_at).toLocaleString() : 
                       viewingError.updated_at ? new Date(viewingError.updated_at).toLocaleString() : 'N/A') : 
                      'Not resolved yet'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
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

      {/* ✅ STATUS UPDATE DIALOG - WITH RESOLUTION DATE */}
      <Dialog 
        open={openStatusDialog} 
        onClose={handleCloseStatusDialog} 
        maxWidth="xs" 
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
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Edit sx={{ fontSize: 28 }} />
              Update Error Status
            </Typography>
            <IconButton onClick={handleCloseStatusDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {selectedErrorForStatus && (
            <Box>
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 2, 
                  borderRadius: 2, 
                  border: `1px solid rgba(103, 232, 249, 0.2)`,
                  backgroundColor: 'rgba(103, 232, 249, 0.04)',
                  '& .MuiAlert-icon': { color: colors.lightCyanDark },
                  '& .MuiAlert-message': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {selectedErrorForStatus.error_title}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  Equipment: {selectedErrorForStatus.equipment_name}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: colors.lightText, mt: 0.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  Current Status: <strong>{selectedErrorForStatus.status || 'Pending'}</strong>
                </Typography>
                {user?.role === 'ENGINEER' && (
                  <Typography variant="caption" sx={{ display: 'block', color: colors.warning, mt: 0.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    You can update any error in your hospital
                  </Typography>
                )}
              </Alert>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>New Status</InputLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="New Status"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiSelect-select': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                >
                  <MenuItem value="Pending" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Pending</MenuItem>
                  <MenuItem value="In Progress" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>In Progress</MenuItem>
                  <MenuItem value="Resolved" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Resolved</MenuItem>
                </Select>
              </FormControl>

              {/* ✅ Resolution Date - Only show when status is Resolved */}
              {newStatus === 'Resolved' && (
                <TextField
                  fullWidth
                  label="Resolution Date"
                  type="datetime-local"
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  helperText="Select the date and time when the error was resolved"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    },
                    '& .MuiFormHelperText-root': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                />
              )}

              {/* ✅ Show current resolution date if already resolved */}
              {newStatus === 'Resolved' && selectedErrorForStatus.resolved_at && !resolutionDate && (
                <Typography variant="caption" sx={{ display: 'block', color: colors.lightText, mt: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  Previously resolved on: {new Date(selectedErrorForStatus.resolved_at).toLocaleString()}
                </Typography>
              )}

              {/* ✅ Show info when status is not Resolved */}
              {newStatus !== 'Resolved' && (
                <Typography variant="caption" sx={{ display: 'block', color: colors.lightText, mt: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {newStatus === 'Pending' ? 'Error is pending review' : 'Error is being worked on'}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseStatusDialog} 
            disabled={statusUpdating}
            sx={{ 
              color: colors.darkNavy,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
            onClick={handleStatusUpdate}
            disabled={statusUpdating}
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              borderRadius: 2,
              px: 4,
              minWidth: 120,
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