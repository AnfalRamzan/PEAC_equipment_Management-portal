// src/pages/Equipment.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar
// ✅ FULLY RESPONSIVE - Mobile friendly with card view
// ✅ SIMPLIFIED TABLE - Essential columns only
// ✅ FIXED: Duplicate icons removed from buttons
// ✅ FIXED: Date of Installation and Date of Purchase now working correctly
// ✅ FIXED: Date formatting in handleSubmit
// ✅ FIXED: Serial number validation with debounce and useEffect
// ✅ FIXED: handleFormChange safe event handling
// ✅ FIXED: Date picker now allows previous years (2000 onwards) and future dates up to 2030

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
  Tooltip,
  Menu,
  CircularProgress,
  Tabs,
  Tab,
  FormHelperText,
  Divider,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton as MuiIconButton,
  Stack,
  Card as MuiCard,
  CardContent as MuiCardContent,
  Fade,
  Grow,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Collapse,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  FilterList,
  Close,
  FileDownload,
  Refresh,
  CheckCircle,
  Cancel,
  Image as ImageIcon,
  VideoLibrary,
  Description,
  Link as LinkIcon,
  OpenInNew,
  ZoomIn,
  MedicalServices,
  LocalHospital,
  Engineering,
  ErrorOutline,
  Build,
  Warning,
  LocationOn,
  Phone,
  Email,
  Business,
  ExpandMore,
  ExpandLess,
  KeyboardArrowRight,
} from '@mui/icons-material'
import { equipmentService, hospitalService, userService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import FileUpload from '../components/FileUpload'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../api/axios'
import AccessDenied from '../components/Auth/AccessDenied'
import { useNavigate } from 'react-router-dom'

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

@keyframes gradientShine {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
`

// ✅ Helper function to format date for input field
const formatDateInput = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch (e) {
    return ''
  }
}

// ✅ Helper function to format date for API
const formatDateForAPI = (dateStr) => {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0]
  } catch (e) {
    return null
  }
}

// ✅ Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case 'Warranty': return '#3B82F6'
    case 'Annual Maintenance': return '#F59E0B'
    case 'Self Maintained': return '#8B5CF6'
    default: return '#94A3B8'
  }
}

// ✅ Status chip component
const StatusChip = ({ status }) => (
  <Chip
    label={status || 'Warranty'}
    size="small"
    sx={{
      bgcolor: getStatusColor(status || 'Warranty'),
      color: 'white',
      fontWeight: 600,
      fontSize: '11px',
      height: 26,
      borderRadius: 2,
    }}
  />
)

const apiEndpoints = {
  getEquipment: () => api.get('/equipment'),
  createEquipment: (data) => api.post('/equipment', data),
  updateEquipment: (id, data) => api.put(`/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/equipment/${id}`),
  getCategories: () => api.get('/equipment/categories/all'),
  getDepartmentsByHospital: (hospitalId) => api.get(`/departments/hospital/${hospitalId}`),
  createCategory: (data) => api.post('/equipment/categories', data),
  createDepartment: (data) => api.post('/departments', data),
  getErrors: () => api.get('/errors'),
  getUsers: () => api.get('/users'),
}

const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) return `http://localhost:5000${url}`
  return url
}

const getFileTypeIcon = (url) => {
  if (!url) return <Description />
  const ext = url.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
    return <ImageIcon />
  } else if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'].includes(ext)) {
    return <VideoLibrary />
  } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) {
    return <Description />
  }
  return <LinkIcon />
}

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

const getFileNameFromUrl = (url) => {
  if (!url) return 'File'
  const parts = url.split('/')
  return parts[parts.length - 1] || 'File'
}

const MediaGrid = ({ files, onImageClick }) => {
  if (!files || files.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, bgcolor: colors.mainBg, borderRadius: 2 }}>
        <Description sx={{ fontSize: 48, color: colors.lightText, opacity: 0.3 }} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          No media files attached
        </Typography>
      </Box>
    )
  }

  return (
    <ImageList cols={3} gap={12} sx={{ mb: 0 }}>
      {files.map((url, index) => {
        const isImg = isImageFile(url)
        const isVideo = isVideoFile(url)
        const fileName = getFileNameFromUrl(url)
        const fullUrl = getFullImageUrl(url)

        return (
          <ImageListItem key={index} sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            border: `1px solid ${colors.borderColor}`,
            position: 'relative',
            '&:hover': {
              boxShadow: `0 4px 20px ${colors.lightCyanGlow}`,
              '& .media-overlay': {
                opacity: 1,
              }
            }
          }}>
            {isImg ? (
              <CardMedia
                component="img"
                image={fullUrl}
                alt={fileName}
                sx={{ 
                  height: 140,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  bgcolor: colors.mainBg,
                }}
                onClick={() => onImageClick && onImageClick(fullUrl)}
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
                cursor: 'pointer',
                position: 'relative',
                onClick: () => window.open(fullUrl, '_blank')
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
                cursor: 'pointer',
                onClick: () => window.open(fullUrl, '_blank')
              }}>
                {getFileTypeIcon(url)}
                <Typography variant="caption" sx={{ color: colors.lightText, mt: 1, textAlign: 'center', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName}
                </Typography>
              </Box>
            )}
            <Box 
              className="media-overlay"
              sx={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                p: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: 0,
                transition: 'opacity 0.3s',
              }}
            >
              <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, mr: 1 }}>
                {fileName}
              </Typography>
              <Tooltip title="Open in new tab">
                <MuiIconButton
                  size="small"
                  sx={{ color: 'white' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(fullUrl, '_blank')
                  }}
                >
                  <OpenInNew fontSize="small" />
                </MuiIconButton>
              </Tooltip>
            </Box>
          </ImageListItem>
        )
      })}
    </ImageList>
  )
}

const Equipment = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  
  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER' || user?.role === 'HOSPITAL_ADMIN'
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER' || user?.role === 'HOSPITAL_ADMIN'
  const canDelete = user?.role === 'SUPER_ADMIN'

  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Equipment Management." />
  }

  const [equipment, setEquipment] = useState([])
  const [categories, setCategories] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [viewTab, setViewTab] = useState(0)
  const [openCustomDialog, setOpenCustomDialog] = useState(false)
  const [customDialogType, setCustomDialogType] = useState('')
  const [customDialogValue, setCustomDialogValue] = useState('')
  const [customDialogLoading, setCustomDialogLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])
  const [selectedImageForPreview, setSelectedImageForPreview] = useState(null)
  const [expandedEquipmentId, setExpandedEquipmentId] = useState(null)

  const [clickedCardIndex, setClickedCardIndex] = useState(null)
  const [prominentActive, setProminentActive] = useState(false)

  const [filters, setFilters] = useState({
    category: '',
    manufacturer: '',
    status: '',
    hospital: ''
  })

  const [serialStatus, setSerialStatus] = useState({
    isValid: true,
    message: '',
    isChecking: false
  })

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    date_of_installation: '',
    purchase_date: '',
    hospital_id: '',
    department_id: '',
    location: '',
    status: 'Warranty',
    image_url: '',
    hospital_name: '',
    hospital_address: '',
    hospital_phone: '',
    hospital_email: '',
  })

  const [touched, setTouched] = useState({
    name: false,
    hospital_id: false,
    serial_number: false
  })

  // ✅ EFFECT: Debounced serial number validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const serial = formData.serial_number
      if (serial && serial.trim() !== '') {
        const excludeId = editingEquipment ? editingEquipment.id : null
        checkSerialNumber(serial, excludeId)
      } else {
        setSerialStatus({ isValid: true, message: '', isChecking: false })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.serial_number, editingEquipment])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchEquipment(),
        fetchCategories(),
        fetchHospitals(),
        fetchDepartments(),
        fetchUsers(),
        fetchErrors()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await apiEndpoints.getEquipment()
      if (response.data && response.data.success) {
        const equipmentWithHospital = (response.data.equipment || []).map(item => ({
          ...item,
          hospital_name: item.hospital_name || 'N/A',
          hospital_address: item.hospital_address || 'N/A',
          hospital_phone: item.hospital_phone || 'N/A',
          hospital_email: item.hospital_email || 'N/A'
        }))
        setEquipment(equipmentWithHospital)
      } else if (Array.isArray(response.data)) {
        const equipmentWithHospital = response.data.map(item => ({
          ...item,
          hospital_name: item.hospital_name || 'N/A'
        }))
        setEquipment(equipmentWithHospital)
      } else {
        setEquipment([])
      }
    } catch (error) {
      console.error('Equipment fetch error:', error)
      toast.error('Failed to fetch equipment')
      setEquipment([])
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiEndpoints.getCategories()
      if (response.data && response.data.success) {
        setCategories(response.data.categories || [])
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Categories fetch error:', error)
      setCategories([])
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll()
      if (response.data && response.data.success) {
        setHospitals(response.data.hospitals || [])
      } else {
        setHospitals([])
      }
    } catch (error) {
      console.error('Hospitals fetch error:', error)
      setHospitals([])
    }
  }

  const fetchDepartments = async () => {
    try {
      const hospitalId = user?.hospital_id || formData.hospital_id
      if (!hospitalId) {
        setDepartments([])
        return
      }
      const response = await apiEndpoints.getDepartmentsByHospital(hospitalId)
      if (response.data && response.data.success) {
        setDepartments(response.data.departments || [])
      } else {
        setDepartments([])
      }
    } catch (error) {
      console.error('Departments fetch error:', error)
      setDepartments([])
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await apiEndpoints.getUsers()
      if (response.data && response.data.success) {
        setUsers(response.data.users || [])
      } else if (Array.isArray(response.data)) {
        setUsers(response.data)
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Users fetch error:', error)
      setUsers([])
    }
  }

  const fetchErrors = async () => {
    try {
      const response = await apiEndpoints.getErrors()
      if (response.data && response.data.success) {
        setErrors(response.data.errors || [])
      } else if (Array.isArray(response.data)) {
        setErrors(response.data)
      } else {
        setErrors([])
      }
    } catch (error) {
      console.error('Errors fetch error:', error)
      setErrors([])
    }
  }

  // ✅ FIXED: checkSerialNumber now uses debounced useEffect
  const checkSerialNumber = async (serialNumber, excludeId = null) => {
    if (!serialNumber || serialNumber.trim() === '') {
      setSerialStatus({ isValid: true, message: '', isChecking: false })
      return true
    }

    setSerialStatus(prev => ({ ...prev, isChecking: true }))

    try {
      const response = await apiEndpoints.getEquipment()
      let allEquipment = []
      if (response.data && response.data.success) {
        allEquipment = response.data.equipment || []
      } else if (Array.isArray(response.data)) {
        allEquipment = response.data
      }

      const duplicate = allEquipment.find(item => 
        item.serial_number && 
        item.serial_number.toLowerCase() === serialNumber.trim().toLowerCase() &&
        (excludeId === null || item.id !== excludeId)
      )

      setSerialStatus({
        isValid: !duplicate,
        message: duplicate ? 'Serial number already exists' : 'Serial number available',
        isChecking: false
      })

      return !duplicate
    } catch (error) {
      console.error('Serial check error:', error)
      setSerialStatus({ isValid: true, message: '', isChecking: false })
      return true
    }
  }

  const statsCards = [
    {
      title: 'Total Equipment',
      value: equipment.length,
      icon: <MedicalServices />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/equipment'
    },
    {
      title: 'Total Hospitals',
      value: hospitals.length,
      icon: <LocalHospital />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/hospitals'
    },
    {
      title: 'Total Engineers',
      value: users.filter(u => u.role === 'ENGINEER' || u.role_name === 'ENGINEER').length,
      icon: <Engineering />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/users?role=ENGINEER'
    },
    {
      title: 'Total Errors',
      value: errors.length,
      icon: <ErrorOutline />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
      path: '/errors'
    },
  ]

  const handleCardClick = (path, index) => {
    setClickedCardIndex(index)
    setProminentActive(true)
    
    setTimeout(() => {
      setProminentActive(false)
      setClickedCardIndex(null)
    }, 2000)
    
    if (path) {
      navigate(path)
    }
  }

  useEffect(() => {
    if (!openDialog || editingEquipment) return
    if (user?.role === 'ENGINEER' && user?.hospital_id) {
      if (!formData.hospital_id) {
        setFormData(prev => ({ ...prev, hospital_id: Number(user.hospital_id) }))
      }
    }
  }, [openDialog, editingEquipment])

  const handleImageUploadComplete = (files) => {
    const imageUrls = files.map(f => f.url || f.fileUrl).filter(Boolean)
    setUploadedImages(prev => [...prev, ...files])
    setFormData(prev => {
      const existingUrls = prev.image_url ? prev.image_url.split(',').filter(Boolean) : []
      return { ...prev, image_url: [...existingUrls, ...imageUrls].join(',') }
    })
    toast.success(`${files.length} image(s) uploaded`)
  }

  const handleImageDelete = (file) => {
    setUploadedImages(prev => prev.filter(f => f.url !== file.url))
    const currentImages = formData.image_url?.split(',') || []
    const updatedImages = currentImages.filter(url => url !== file.url)
    setFormData(prev => ({ ...prev, image_url: updatedImages.join(',') }))
  }

  const handleExistingImageDelete = (imageUrl) => {
    const currentImages = formData.image_url?.split(',') || []
    const updatedImages = currentImages.filter(url => url !== imageUrl)
    setFormData(prev => ({ ...prev, image_url: updatedImages.join(',') }))
    toast.success('Image removed')
  }

  const handleOpenCustomDialog = (type) => {
    if (type === 'hospital') {
      toast.info('Please add hospitals from the Hospitals page')
      return
    }
    setCustomDialogType(type)
    setCustomDialogValue('')
    setOpenCustomDialog(true)
  }

  const handleCloseCustomDialog = () => {
    setOpenCustomDialog(false)
    setCustomDialogValue('')
    setCustomDialogType('')
  }

  const handleSaveCustomItem = async () => {
    if (!customDialogValue.trim()) {
      toast.error('Please enter a name')
      return
    }

    setCustomDialogLoading(true)
    try {
      let response, newItem

      if (customDialogType === 'category') {
        response = await apiEndpoints.createCategory({ name: customDialogValue.trim() })
        newItem = response.data.category
        setCategories(prev => [...prev, newItem])
        setFormData(prev => ({ ...prev, category_id: newItem.id }))
        toast.success('Category added!')
      } else if (customDialogType === 'department') {
        const deptHospitalId = user?.role === 'SUPER_ADMIN' ? null : (formData.hospital_id || user?.hospital_id || null)
        response = await apiEndpoints.createDepartment({ 
          name: customDialogValue.trim(),
          hospital_id: deptHospitalId
        })
        newItem = response.data.department
        setDepartments(prev => [...prev, newItem])
        setFormData(prev => ({ ...prev, department_id: newItem.id }))
        toast.success('Department added!')
      }

      handleCloseCustomDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save')
    } finally {
      setCustomDialogLoading(false)
    }
  }

  const handleViewDetails = (equip) => {
    const imageUrls = equip.image_url ? equip.image_url.split(',').filter(Boolean) : []
    const hospital = hospitals.find(h => h.id === equip.hospital_id)
    
    setSelectedEquipment({
      ...equip,
      image_url: equip.image_url || '',
      images: imageUrls,
      hospital_name: equip.hospital_name || hospital?.name || 'N/A',
      hospital_address: equip.hospital_address || hospital?.address || 'N/A',
      hospital_phone: equip.hospital_phone || hospital?.phone || 'N/A',
      hospital_email: equip.hospital_email || hospital?.email || 'N/A',
      errors: [
        { id: 1, error_title: 'Power supply failure', created_at: '2024-01-15T10:30:00', status: 'Resolved' },
        { id: 2, error_title: 'Sensor calibration error', created_at: '2024-02-20T14:45:00', status: 'In Progress' },
      ],
      repairs: [
        { id: 1, root_cause: 'Faulty power cable', engineer_name: 'Engr. Ali Khan', repair_date: '2024-01-20', status: 'Completed' },
      ],
      maintenance: [
        { id: 1, maintenance_type: 'Preventive', completed_date: '2024-01-05', status: 'Completed' },
        { id: 2, maintenance_type: 'Preventive', completed_date: '2024-03-01', status: 'Scheduled' },
      ],
      spareParts: [
        { id: 1, part_name: 'Power Supply Unit', quantity: 2, total_cost: 15000 },
        { id: 2, part_name: 'Sensor Module', quantity: 1, total_cost: 8500 },
      ]
    })
    setViewTab(0)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setSelectedEquipment(null)
    setViewTab(0)
    setSelectedImageForPreview(null)
  }

  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget)
  const handleFilterClose = () => setFilterAnchorEl(null)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ category: '', manufacturer: '', status: '', hospital: '' })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToExcel = () => {
    try {
      const data = filteredEquipment.map(e => ({
        'Equipment': e.name,
        'Hospital': e.hospital_name || '',
        'Manufacturer': e.manufacturer || '',
        'Model': e.model || '',
        'Installation Date': e.date_of_installation || '',
        'Purchase Date': e.purchase_date || '',
        'Status': e.status || '',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Equipment')
      XLSX.writeFile(wb, `equipment_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Equipment Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Equipment: ${filteredEquipment.length}`, 14, 34)
      
      const tableData = filteredEquipment.map(e => [
        e.name, 
        e.hospital_name || '', 
        e.manufacturer || '', 
        e.model || '', 
        e.date_of_installation || '', 
        e.purchase_date || '', 
        e.status || '',
      ])
      autoTable(doc, {
        head: [['Equipment', 'Hospital', 'Manufacturer', 'Model', 'Installation', 'Purchase', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 6, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 7 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`equipment_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  // ✅ FIXED: handleOpenDialog with proper date formatting
  const handleOpenDialog = (equip = null) => {
    if (equip && !canEdit) {
      toast.error('You do not have permission to edit equipment')
      return
    }

    let defaultHospitalId = ''
    if (user?.role === 'ENGINEER' && user?.hospital_id) {
      defaultHospitalId = Number(user.hospital_id)
    }
    
    if (equip) {
      setEditingEquipment(equip)
      setFormData({
        name: equip.name || '',
        category_id: equip.category_id || '',
        manufacturer: equip.manufacturer || '',
        model: equip.model || '',
        serial_number: equip.serial_number || '',
        date_of_installation: equip.date_of_installation ? formatDateInput(equip.date_of_installation) : '',
        purchase_date: equip.purchase_date ? formatDateInput(equip.purchase_date) : '',
        hospital_id: equip.hospital_id || defaultHospitalId,
        department_id: equip.department_id || '',
        location: equip.location || '',
        status: equip.status || 'Warranty',
        image_url: equip.image_url || '',
        hospital_name: equip.hospital_name || '',
        hospital_address: equip.hospital_address || '',
        hospital_phone: equip.hospital_phone || '',
        hospital_email: equip.hospital_email || '',
      })
      
      // Serial status will be updated by useEffect
      setSerialStatus({ isValid: true, message: '', isChecking: false })
      
      if (equip.image_url) {
        const existingImages = equip.image_url.split(',').filter(Boolean).map(url => ({
          url: url,
          name: url.split('/').pop(),
          type: 'image',
          size: 0
        }))
        setUploadedImages(existingImages)
      } else {
        setUploadedImages([])
      }
    } else {
      setEditingEquipment(null)
      setFormData({
        name: '',
        category_id: '',
        manufacturer: '',
        model: '',
        serial_number: '',
        date_of_installation: '',
        purchase_date: '',
        hospital_id: defaultHospitalId,
        department_id: '',
        location: '',
        status: 'Warranty',
        image_url: '',
        hospital_name: '',
        hospital_address: '',
        hospital_phone: '',
        hospital_email: '',
      })
      setUploadedImages([])
      setSerialStatus({ isValid: true, message: '', isChecking: false })
    }
    setTouched({ name: false, hospital_id: false, serial_number: false })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingEquipment(null)
    setUploadedImages([])
    setSerialStatus({ isValid: true, message: '', isChecking: false })
  }

  // ✅ FIXED: handleFormChange with safe event handling
  const handleFormChange = (e) => {
    if (!e || !e.target) return
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))
    // ✅ Serial number validation is now handled by useEffect
  }

  // ✅ FIXED: handleSubmit with proper date formatting
  const handleSubmit = async () => {
    try {
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Equipment name is required')
        setTouched(prev => ({ ...prev, name: true }))
        return
      }

      if (!formData.hospital_id) {
        toast.error('Please select a hospital')
        setTouched(prev => ({ ...prev, hospital_id: true }))
        return
      }

      // ✅ Serial number check is already done via useEffect, but double-check before submit
      if (formData.serial_number && formData.serial_number.trim() !== '') {
        const isValid = await checkSerialNumber(
          formData.serial_number, 
          editingEquipment ? editingEquipment.id : null
        )
        if (!isValid) {
          toast.error('This serial number is already in use. Please use a unique serial number.')
          return
        }
      }

      let hospitalId = formData.hospital_id
      if (user?.role === 'ENGINEER') {
        if (!hospitalId || hospitalId === '') {
          if (user?.hospital_id) {
            hospitalId = Number(user.hospital_id)
          } else {
            toast.error('Hospital is required for Engineers')
            return
          }
        }
        hospitalId = Number(hospitalId)
      } else {
        hospitalId = Number(hospitalId) || null
      }

      const installationDate = formatDateForAPI(formData.date_of_installation)
      const purchaseDate = formatDateForAPI(formData.purchase_date)

      const submitData = {
        name: formData.name.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        manufacturer: formData.manufacturer || '',
        model: formData.model || '',
        serial_number: formData.serial_number || '',
        date_of_installation: installationDate,
        purchase_date: purchaseDate,
        hospital_id: hospitalId,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        location: formData.location || '',
        status: formData.status || 'Warranty',
        image_url: formData.image_url || ''
      }

      console.log('📤 Submitting equipment data:', submitData)

      if (editingEquipment) {
        await apiEndpoints.updateEquipment(editingEquipment.id, submitData)
        toast.success('Equipment updated successfully')
      } else {
        await apiEndpoints.createEquipment(submitData)
        toast.success('Equipment created successfully')
      }

      fetchEquipment()
      handleCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      let errorMsg = 'Operation failed'
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('serial number') || 
            error.response.data.message.includes('duplicate')) {
          errorMsg = 'This serial number is already in use. Please use a unique serial number.'
        } else {
          errorMsg = error.response.data.message
        }
      } else if (error.message) {
        errorMsg = error.message
      }
      toast.error(errorMsg)
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete equipment')
      return
    }
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await apiEndpoints.deleteEquipment(id)
        toast.success('Equipment deleted successfully')
        fetchEquipment()
      } catch (error) {
        toast.error('Failed to delete equipment')
      }
    }
  }

  const toggleExpand = (id) => {
    setExpandedEquipmentId(expandedEquipmentId === id ? null : id)
  }

  const filteredEquipment = equipment.filter(item => {
    if (user?.role === 'ENGINEER' && item.hospital_id !== user.hospital_id) {
      return false
    }
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.hospital_name && item.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !filters.category || item.category_id === parseInt(filters.category)
    const matchesManufacturer = !filters.manufacturer || item.manufacturer?.toLowerCase().includes(filters.manufacturer.toLowerCase())
    const matchesStatus = !filters.status || item.status === filters.status
    const matchesHospital = !filters.hospital || item.hospital_id === parseInt(filters.hospital)
    return matchesSearch && matchesCategory && matchesManufacturer && matchesStatus && matchesHospital
  })

  if (loading) return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
      borderRadius: 0,
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <style>{animationStyles}</style>

      {/* ===== HEADER ===== */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
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
            Equipment
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Manage all medical equipment and their details
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        }}>
          <Button 
            variant="outlined" 
            onClick={fetchAllData} 
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              textTransform: 'none',
              borderRadius: 2,
              minWidth: { xs: '40px', sm: 'auto' },
              px: { xs: 1, sm: 2 },
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
            <Refresh sx={{ fontSize: { xs: 18, sm: 20 } }} />
            <Typography 
              variant="button" 
              sx={{ 
                display: { xs: 'none', sm: 'inline' },
                ml: 0.5,
              }}
            >
              Refresh
            </Typography>
          </Button>
          
          {canCreate && (
            <Button
              variant="contained"
              onClick={() => handleOpenDialog()}
              size="small"
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                minWidth: { xs: '40px', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Add sx={{ fontSize: { xs: 18, sm: 20 } }} />
              <Typography 
                variant="button" 
                sx={{ 
                  display: { xs: 'none', sm: 'inline' },
                  ml: 0.5,
                }}
              >
                Add Equipment
              </Typography>
            </Button>
          )}
        </Box>
      </Box>

      {/* ===== STATS CARDS ===== */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => {
          const isClicked = clickedCardIndex === index && prominentActive
          
          return (
            <Grid item xs={6} sm={3} key={index}>
              <Grow in timeout={300 + index * 100}>
                <MuiCard 
                  sx={{ 
                    borderRadius: 3,
                    border: `1px solid ${isClicked ? colors.lightCyan : colors.borderColor}`,
                    boxShadow: isClicked 
                      ? `0 0 40px ${colors.lightCyanGlowStrong}, 0 0 80px ${colors.lightCyanGlow}, 0 8px 30px rgba(0,0,0,0.1)`
                      : '0 2px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transform: isClicked ? 'scale(1.04)' : 'scale(1)',
                    ...(isClicked && {
                      animation: 'prominentGlow 1.5s ease-in-out 3',
                    }),
                    '&:hover': {
                      transform: isClicked ? 'scale(1.04)' : 'translateY(-4px) scale(1.02)',
                      boxShadow: isClicked 
                        ? `0 0 50px ${colors.lightCyanGlowStrong}, 0 0 100px ${colors.lightCyanGlow}`
                        : `0 8px 30px ${colors.lightCyanGlow}`,
                      borderColor: colors.lightCyan,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: isClicked ? 4 : 3,
                      background: isClicked 
                        ? `linear-gradient(90deg, ${colors.lightCyan}, ${colors.accentGold}, ${colors.lightCyan})`
                        : `linear-gradient(90deg, ${card.color}, ${colors.accentGold})`,
                      animation: isClicked ? 'gradientShine 1.5s ease-in-out infinite' : 'none',
                    }
                  }}
                  onClick={() => handleCardClick(card.path, index)}
                  className={isClicked ? 'prominent-active' : ''}
                >
                  {isClicked && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: `
                          radial-gradient(circle at 30% 50%, ${colors.lightCyan}15 0%, transparent 70%),
                          radial-gradient(circle at 70% 30%, ${colors.accentGold}08 0%, transparent 50%)
                        `,
                        pointerEvents: 'none',
                        zIndex: 0,
                      }}
                    />
                  )}
                  
                  <MuiCardContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: isClicked ? colors.darkNavy : colors.lightText,
                            fontWeight: isClicked ? 700 : 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {card.title}
                        </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: isClicked ? 900 : 700,
                            color: colors.darkNavy,
                            fontSize: { xs: '1.1rem', sm: '1.6rem', md: '1.8rem' },
                            mt: 0.5,
                            transition: 'all 0.3s ease',
                            ...(isClicked && {
                              textShadow: `0 0 30px ${colors.lightCyanGlow}`,
                            }),
                          }}
                        >
                          {card.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          background: isClicked 
                            ? `linear-gradient(135deg, ${card.color}, ${colors.accentGold})`
                            : card.bg,
                          borderRadius: '14px',
                          p: 1.2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: { xs: 36, sm: 42 },
                          height: { xs: 36, sm: 42 },
                          color: isClicked ? '#FFFFFF' : card.color,
                          transition: 'all 0.3s ease',
                          boxShadow: isClicked 
                            ? `0 0 30px ${colors.lightCyanGlowStrong}`
                            : 'none',
                          transform: isClicked ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                        }}
                      >
                        {React.cloneElement(card.icon, { 
                          sx: { 
                            fontSize: { xs: 18, sm: 22 },
                            color: isClicked ? '#FFFFFF' : card.color,
                            transition: 'all 0.3s ease',
                          } 
                        })}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      <Box sx={{
                        width: { xs: 5, sm: 6 },
                        height: { xs: 5, sm: 6 },
                        borderRadius: '50%',
                        bgcolor: isClicked ? colors.accentGold : colors.lightCyan,
                        opacity: isClicked ? 1 : 0.4,
                        transition: 'all 0.3s ease',
                        boxShadow: isClicked 
                          ? `0 0 20px ${colors.accentGold}`
                          : 'none',
                      }} />
                      <Box sx={{
                        width: { xs: 4, sm: 6 },
                        height: { xs: 4, sm: 6 },
                        borderRadius: '50%',
                        bgcolor: colors.lightCyan,
                        opacity: isClicked ? 0.8 : 0.2,
                        transition: 'all 0.3s ease',
                        transitionDelay: '0.1s',
                      }} />
                      <Box sx={{
                        width: { xs: 3, sm: 6 },
                        height: { xs: 3, sm: 6 },
                        borderRadius: '50%',
                        bgcolor: colors.lightCyan,
                        opacity: isClicked ? 0.6 : 0.1,
                        transition: 'all 0.3s ease',
                        transitionDelay: '0.2s',
                      }} />
                    </Box>
                  </MuiCardContent>
                </MuiCard>
              </Grow>
            </Grid>
          )
        })}
      </Grid>

      {/* ===== SEARCH & FILTER ===== */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
        animation: 'fadeInUp 0.7s ease-out',
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          flexWrap: 'wrap', 
          alignItems: 'center' 
        }}>
          <TextField            
            size="small"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 }, width: { xs: '100%', sm: 'auto' } }}
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
                  fontSize: '0.9rem',
                }
              }
            }}
          />
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' }
          }}>
            <Button 
              variant="contained"
              onClick={handleFilterClick}
              size="small"
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                minWidth: { xs: '40px', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <FilterList sx={{ fontSize: { xs: 18, sm: 20 } }} />
              <Typography 
                variant="button" 
                sx={{ 
                  display: { xs: 'none', sm: 'inline' },
                  ml: 0.5,
                }}
              >
                Filter
              </Typography>
            </Button>
            
            <Button 
              variant="contained"
              onClick={handleExportClick}
              size="small"
              sx={{ 
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                minWidth: { xs: '40px', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Download sx={{ fontSize: { xs: 18, sm: 20 } }} />
              <Typography 
                variant="button" 
                sx={{ 
                  display: { xs: 'none', sm: 'inline' },
                  ml: 0.5,
                }}
              >
                Export
              </Typography>
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ===== FILTER MENU ===== */}
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
          Filter Equipment
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
            <MenuItem value="Warranty">Warranty</MenuItem>
            <MenuItem value="Annual Maintenance">Annual Maintenance</MenuItem>
            <MenuItem value="Self Maintained">Self Maintained</MenuItem>
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

      {/* ===== EXPORT MENU ===== */}
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

      {/* ===== TABLE / CARD VIEW ===== */}
      {isMobile ? (
        <Box sx={{ animation: 'fadeInUp 0.8s ease-out' }}>
          {filteredEquipment.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6, 
              bgcolor: colors.cardBg, 
              borderRadius: 3,
              border: `1px solid ${colors.borderColor}`,
            }}>
              <MedicalServices sx={{ fontSize: 48, color: colors.borderColor }} />
              <Typography variant="body1" sx={{ color: colors.lightText, mt: 2 }}>
                No equipment found
              </Typography>
              <Typography variant="caption" sx={{ color: colors.lightText }}>
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            filteredEquipment.map((item, index) => {
              const isExpanded = expandedEquipmentId === item.id
              return (
                <MuiCard 
                  key={item.id}
                  sx={{ 
                    mb: 2, 
                    borderRadius: 3,
                    border: `1px solid ${colors.borderColor}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: `0 4px 20px ${colors.lightCyanGlow}`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: colors.darkNavy, fontSize: '1rem' }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          <StatusChip status={item.status} />
                          {item.hospital_name && (
                            <Chip
                              label={item.hospital_name}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                borderColor: colors.borderColor, 
                                color: colors.darkNavy,
                                fontSize: '10px',
                                height: 22,
                                borderRadius: 2,
                                fontWeight: 500,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewDetails(item)}
                          sx={{ 
                            color: colors.darkNavy,
                            '&:hover': { color: colors.lightCyanDark }
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        {canEdit && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(item)}
                            sx={{ 
                              color: colors.darkNavy,
                              '&:hover': { color: colors.lightCyanDark }
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(item.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small"
                          onClick={() => toggleExpand(item.id)}
                          sx={{ color: colors.lightText }}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.borderColor}` }}>
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Manufacturer
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                              {item.manufacturer || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Model
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                              {item.model || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Installation
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                              {item.date_of_installation ? new Date(item.date_of_installation).toLocaleDateString() : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Purchase
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                              {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Category
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                              {item.category_name || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </CardContent>
                </MuiCard>
              )
            })
          )}
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 3, 
            overflowX: 'auto', 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            animation: 'fadeInUp 0.8s ease-out',
          }}
        >
          <Table sx={{ minWidth: isTablet ? 600 : 900 }}>
            <TableHead sx={{ bgcolor: colors.darkNavy }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Equipment</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Hospital</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Manufacturer</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Model</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Installation</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Purchase</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.7rem', sm: '0.8rem' } }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <MedicalServices sx={{ fontSize: 48, color: colors.borderColor }} />
                      <Typography variant="body1" sx={{ color: colors.lightText }}>
                        No equipment found
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.lightText }}>
                        Try adjusting your search or filters
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((item, index) => (
                  <TableRow 
                    key={item.id} 
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
                      <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: colors.darkNavy, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      {item.hospital_name || '-'}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>{item.manufacturer || '-'}</TableCell>
                    <TableCell sx={{ color: colors.lightText, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>{item.model || '-'}</TableCell>
                    <TableCell sx={{ color: colors.lightText, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      {item.date_of_installation ? new Date(item.date_of_installation).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status} />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(item)}
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
                        {canEdit && (
                          <Tooltip title="Edit Equipment">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(item)}
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
                          <Tooltip title="Delete Equipment">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(item.id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ===== VIEW DETAILS DIALOG ===== */}
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
            margin: { xs: 1, sm: 2 },
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          py: { xs: 2, sm: 2.5 },
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              <MedicalServices sx={{ fontSize: { xs: 22, sm: 28 } }} />
              Equipment Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2, px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          {selectedEquipment && (
            <Box>
              <Tabs 
                value={viewTab} 
                onChange={(e, v) => setViewTab(v)} 
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
                sx={{ 
                  mb: 2, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    minWidth: { xs: 'auto', sm: 80 },
                    px: { xs: 1.5, sm: 2 },
                    '&.Mui-selected': { color: colors.darkNavy }
                  },
                  '& .MuiTabs-indicator': { bgcolor: colors.lightCyan }
                }}
              >
                <Tab label="General" />
                <Tab label="Media" />
                <Tab label="Errors" />
                <Tab label="Repairs" />
                <Tab label="Maintenance" />
                <Tab label="Spare Parts" />
              </Tabs>

              {viewTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: colors.darkNavy, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                      {selectedEquipment.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1, flexWrap: 'wrap' }}>
                      <StatusChip status={selectedEquipment.status} />
                      {selectedEquipment.category_name && (
                        <Chip
                          label={selectedEquipment.category_name}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: colors.borderColor,
                            color: colors.lightText,
                            borderRadius: 2,
                          }}
                        />
                      )}
                      {selectedEquipment.hospital_name && (
                        <Chip
                          label={selectedEquipment.hospital_name}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: colors.borderColor,
                            color: colors.darkNavy,
                            borderRadius: 2,
                            fontWeight: 500,
                          }}
                        />
                      )}
                    </Box>
                    <Divider sx={{ my: 2, borderColor: colors.borderColor }} />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Manufacturer</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>{selectedEquipment.manufacturer || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Model</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>{selectedEquipment.model || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Serial Number</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>{selectedEquipment.serial_number || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Installation Date</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                      {selectedEquipment.date_of_installation ? new Date(selectedEquipment.date_of_installation).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Purchase Date</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                      {selectedEquipment.purchase_date ? new Date(selectedEquipment.purchase_date).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Category</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>{selectedEquipment.category_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Department</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>{selectedEquipment.department_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600 }}>Location</Typography>
                    <Typography variant="body1" sx={{ color: colors.darkNavy }}>{selectedEquipment.location || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2, borderColor: colors.borderColor }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.darkNavy, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalHospital fontSize="small" sx={{ color: colors.lightCyanDark }} />
                      Hospital Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business fontSize="small" sx={{ color: colors.lightText }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Hospital Name
                            </Typography>
                            <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                              {selectedEquipment.hospital_name || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" sx={{ color: colors.lightText }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Hospital Address
                            </Typography>
                            <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                              {selectedEquipment.hospital_address || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" sx={{ color: colors.lightText }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Hospital Phone
                            </Typography>
                            <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                              {selectedEquipment.hospital_phone || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email fontSize="small" sx={{ color: colors.lightText }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>
                              Hospital Email
                            </Typography>
                            <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                              {selectedEquipment.hospital_email || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {viewTab === 1 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2 }}>
                    Attached Media Files
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mb: 2 }}>
                    Click on any file to open it in a new tab
                  </Typography>
                  
                  {selectedEquipment.images && selectedEquipment.images.length > 0 ? (
                    <MediaGrid 
                      files={selectedEquipment.images} 
                      onImageClick={(url) => window.open(url, '_blank')}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: colors.mainBg, borderRadius: 2 }}>
                      <ImageIcon sx={{ fontSize: 48, color: colors.lightText, opacity: 0.3 }} />
                      <Typography variant="body2" sx={{ color: colors.lightText, mt: 1 }}>
                        No media files attached
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {viewTab === 2 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>Error History</Typography>
                  {selectedEquipment.errors?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Error</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.errors.map((err, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{err.error_title}</TableCell>
                              <TableCell>{new Date(err.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={err.status}
                                  size="small"
                                  sx={{
                                    bgcolor: err.status === 'Resolved' ? colors.success : colors.warning,
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: '10px',
                                    height: 22,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ color: colors.lightText, py: 2, textAlign: 'center' }}>
                      No errors recorded
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 3 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>Repair History</Typography>
                  {selectedEquipment.repairs?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Root Cause</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Engineer</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.repairs.map((repair, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{repair.root_cause || 'N/A'}</TableCell>
                              <TableCell>{repair.engineer_name || 'N/A'}</TableCell>
                              <TableCell>{new Date(repair.repair_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={repair.status}
                                  size="small"
                                  sx={{
                                    bgcolor: repair.status === 'Completed' ? colors.success : colors.warning,
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: '10px',
                                    height: 22,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ color: colors.lightText, py: 2, textAlign: 'center' }}>
                      No repairs recorded
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 4 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>Maintenance History</Typography>
                  {selectedEquipment.maintenance?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.maintenance.map((maint, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{maint.maintenance_type}</TableCell>
                              <TableCell>{new Date(maint.completed_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={maint.status}
                                  size="small"
                                  sx={{
                                    bgcolor: maint.status === 'Completed' ? colors.success : colors.warning,
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: '10px',
                                    height: 22,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ color: colors.lightText, py: 2, textAlign: 'center' }}>
                      No maintenance records
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 5 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>Spare Parts</Typography>
                  {selectedEquipment.spareParts?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Part Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="center">Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="right">Total Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.spareParts.map((part, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{part.part_name}</TableCell>
                              <TableCell align="center">{part.quantity}</TableCell>
                              <TableCell align="right">Rs. {part.total_cost.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: colors.mainBg }}>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 600, color: colors.darkNavy }}>Total:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: colors.lightCyanDark }}>
                              Rs. {selectedEquipment.spareParts.reduce((sum, p) => sum + p.total_cost, 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ color: colors.lightText, py: 2, textAlign: 'center' }}>
                      No spare parts used
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
          <Button 
            onClick={handleCloseView} 
            variant="contained" 
            sx={{ 
              bgcolor: colors.darkNavy,
              color: colors.text,
              borderRadius: 2,
              px: { xs: 3, sm: 4 },
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
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={Boolean(selectedImageForPreview)}
        onClose={() => setSelectedImageForPreview(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.9)',
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            margin: { xs: 1, sm: 2 },
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', minHeight: 300 }}>
          <IconButton
            onClick={() => setSelectedImageForPreview(null)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 10,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <Close />
          </IconButton>
          <IconButton
            onClick={() => window.open(selectedImageForPreview, '_blank')}
            sx={{
              position: 'absolute',
              top: 10,
              right: 60,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 10,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <OpenInNew />
          </IconButton>
          <Box
            component="img"
            src={selectedImageForPreview || ''}
            alt="Preview"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '90vh',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
            }}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"%3E%3Crect width="100%25" height="100%25" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E'
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ===== ADD/EDIT DIALOG ===== */}
      {(canCreate || canEdit) && (
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
              margin: { xs: 1, sm: 2 },
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: colors.darkNavy, 
            color: 'white',
            borderRadius: '8px 8px 0 0',
            py: { xs: 2, sm: 2.5 },
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {editingEquipment ? <Edit sx={{ fontSize: { xs: 22, sm: 28 } }} /> : <Add sx={{ fontSize: { xs: 22, sm: 28 } }} />}
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </Typography>
              <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Equipment Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  error={touched.name && !formData.name}
                  helperText={touched.name && !formData.name ? 'Equipment name is required' : ''}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Category</InputLabel>
                  <Select 
                    name="category_id" 
                    value={formData.category_id} 
                    onChange={handleFormChange} 
                    label="Category"
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
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  size="small" 
                  startIcon={<Add />} 
                  onClick={() => handleOpenCustomDialog('category')} 
                  sx={{ 
                    mt: 0.5, 
                    color: colors.darkNavy, 
                    textTransform: 'none',
                    '&:hover': { 
                      color: colors.lightCyanDark,
                      backgroundColor: 'rgba(103, 232, 249, 0.04)'
                    } 
                  }}
                >
                  Add New Category
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Manufacturer" 
                  name="manufacturer" 
                  value={formData.manufacturer} 
                  onChange={handleFormChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Model" 
                  name="model" 
                  value={formData.model} 
                  onChange={handleFormChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Installation"
                  name="date_of_installation"
                  type="date"
                  value={formData.date_of_installation}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: "2000-01-01",
                    max: "2030-12-31"
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Purchase"
                  name="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: "2000-01-01",
                    max: "2030-12-31"
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleFormChange}
                  placeholder="Enter unique serial number"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': {
                        borderColor: serialStatus.message 
                          ? (serialStatus.isValid ? colors.success : colors.error)
                          : colors.lightCyanDark
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                  InputProps={{
                    endAdornment: serialStatus.message && (
                      <InputAdornment position="end">
                        {serialStatus.isValid ? (
                          <CheckCircle sx={{ color: colors.success, fontSize: 22 }} />
                        ) : (
                          <Cancel sx={{ color: colors.error, fontSize: 22 }} />
                        )}
                      </InputAdornment>
                    )
                  }}
                />
                {serialStatus.message && (
                  <FormHelperText 
                    sx={{ 
                      color: serialStatus.isValid ? colors.success : colors.error,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      mt: 0.5
                    }}
                  >
                    {serialStatus.message}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ color: colors.lightText }}>Hospital *</InputLabel>
                  <Select
                    name="hospital_id"
                    value={formData.hospital_id}
                    onChange={handleFormChange}
                    label="Hospital *"
                    disabled={user?.role === 'ENGINEER'}
                    error={touched.hospital_id && !formData.hospital_id}
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
                    <MenuItem value="">Select Hospital</MenuItem>
                    {hospitals.map(h => (
                      <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                    ))}
                  </Select>
                  {touched.hospital_id && !formData.hospital_id && (
                    <FormHelperText error>Hospital is required</FormHelperText>
                  )}
                  {user?.role === 'ENGINEER' && (
                    <FormHelperText sx={{ color: colors.lightText }}>Auto-assigned to your hospital</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Department</InputLabel>
                  <Select 
                    name="department_id" 
                    value={formData.department_id} 
                    onChange={handleFormChange} 
                    label="Department"
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
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map(d => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  size="small" 
                  startIcon={<Add />} 
                  onClick={() => handleOpenCustomDialog('department')} 
                  sx={{ 
                    mt: 0.5, 
                    color: colors.darkNavy, 
                    textTransform: 'none',
                    '&:hover': { 
                      color: colors.lightCyanDark,
                      backgroundColor: 'rgba(103, 232, 249, 0.04)'
                    } 
                  }}
                >
                  Add New Department
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Location" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleFormChange} 
                  placeholder="e.g., Room 101"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
                  <Select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleFormChange} 
                    label="Status"
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
                    <MenuItem value="Warranty">Warranty</MenuItem>
                    <MenuItem value="Annual Maintenance">Annual Maintenance</MenuItem>
                    <MenuItem value="Self Maintained">Self Maintained</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600 }} gutterBottom>
                  Equipment Images
                </Typography>
                <FileUpload
                  endpoint="/upload"
                  accept="image/*"
                  multiple={true}
                  label="Click to upload equipment images"
                  maxFiles={5}
                  maxSize={10}
                  showPreview={true}
                  onUploadComplete={handleImageUploadComplete}
                  onUploadError={(error) => toast.error('Upload failed: ' + error)}
                  onDelete={handleImageDelete}
                  existingFiles={formData.image_url ? formData.image_url.split(',').filter(Boolean).map(url => ({
                    url: url,
                    name: url.split('/').pop(),
                    type: 'image',
                    size: 0
                  })) : []}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
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
              disabled={!serialStatus.isValid && formData.serial_number !== ''}
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
                '&.Mui-disabled': { bgcolor: '#bdbdbd' },
                transition: 'all 0.3s ease',
              }}
            >
              {editingEquipment ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Custom Add Dialog */}
      <Dialog 
        open={openCustomDialog} 
        onClose={handleCloseCustomDialog} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            margin: { xs: 1, sm: 2 },
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          py: { xs: 2, sm: 2.5 },
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Add New {customDialogType.charAt(0).toUpperCase() + customDialogType.slice(1)}
            </Typography>
            <IconButton onClick={handleCloseCustomDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            label={`Enter ${customDialogType} name`}
            value={customDialogValue}
            onChange={(e) => setCustomDialogValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveCustomItem()}
            sx={{ mt: 1 }}
            placeholder={`e.g., ${customDialogType === 'category' ? 'X-Ray Machine' : 'Cardiology'}`}
            InputProps={{
              sx: {
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                },
                '& .MuiInputBase-input': {
                  fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
          <Button 
            onClick={handleCloseCustomDialog} 
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
            onClick={handleSaveCustomItem}
            disabled={customDialogLoading || !customDialogValue.trim()}
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
            {customDialogLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Equipment