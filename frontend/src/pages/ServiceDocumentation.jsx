// src/pages/ServiceDocumentation.jsx
// ✅ PAEC THEME - Green & Gold Colors - Enhanced Cards

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  CircularProgress,
  Fade,
  Grow,
  Badge,
  Stack
} from '@mui/material'
import {
  Upload,
  Search,
  Download,
  Visibility,
  Delete,
  Edit,
  Description,
  PictureAsPdf,
  VideoFile,
  InsertDriveFile,
  Close,
  Folder,
  Image,
  FilePresent,
  Refresh,
  CheckCircle,
  ErrorOutline,
  MedicalServices,
  Build,
  CalendarToday,
  Person,
  Engineering as EngineeringIcon,
  AdminPanelSettings,
  AttachFile,
  TrendingUp,
  Verified,
  MenuBook,
  Lightbulb
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import api from '../api/axios'
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

// ============================================================
// ✅ ENHANCED STAT CARD COMPONENT
// ============================================================
const StatCard = ({ title, value, icon, color, bgColor, subtext }) => (
  <Grow in timeout={300}>
    <Card sx={{ 
      borderRadius: 3, 
      border: `1px solid ${colors.borderColor}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 30px ${colors.shadowColor}`,
        borderColor: colors.accentGold,
      }
    }}>
      <CardContent sx={{ textAlign: 'center', py: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 1.5
        }}>
          <Avatar sx={{ 
            bgcolor: bgColor || color || colors.sidebar,
            width: 48,
            height: 48,
            boxShadow: `0 4px 16px ${color || colors.sidebar}44`
          }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" sx={{ color: colors.darkText, fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.lightText, fontWeight: 500 }}>
          {title}
        </Typography>
        {subtext && (
          <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 0.5 }}>
            {subtext}
          </Typography>
        )}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color || colors.sidebar}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      </CardContent>
    </Card>
  </Grow>
)

// ============================================================
// ✅ ENHANCED DOCUMENT CARD
// ============================================================
const DocumentCard = ({ doc, onView, onEdit, onDelete, onDownload, canEdit, canDelete }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const getFileIcon = (type) => {
    switch(type) {
      case 'PDF': return <PictureAsPdf sx={{ color: colors.error }} />
      case 'Video': return <VideoFile sx={{ color: colors.info }} />
      case 'Image': return <Image sx={{ color: colors.success }} />
      default: return <InsertDriveFile sx={{ color: colors.lightText }} />
    }
  }
  
  const getFileColor = (type) => {
    switch(type) {
      case 'PDF': return colors.error
      case 'Video': return colors.info
      case 'Image': return colors.success
      default: return colors.lightText
    }
  }

  const isImage = doc.document_type === 'Image' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
  const hasThumbnail = isImage && doc.file_url

  return (
    <Grow in timeout={300}>
      <Card
        sx={{
          borderRadius: 3,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${colors.borderColor}`,
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: isHovered ? `0 12px 40px ${colors.shadowColor}` : '0 2px 12px rgba(0,0,0,0.04)',
          '&:hover': {
            borderColor: colors.accentGold,
          },
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Gradient Bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${colors.sidebar}, ${colors.accentGold})`,
        }} />
        
        {/* Decorative Background */}
        <Box sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.sidebar}06 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* File Icon with Badge */}
            <Badge
              badgeContent={doc.document_type}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: getFileColor(doc.document_type),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '8px',
                  height: 18,
                  minWidth: 18,
                  border: `2px solid ${colors.white}`,
                  textTransform: 'uppercase'
                }
              }}
            >
              <Avatar sx={{ 
                bgcolor: `${getFileColor(doc.document_type)}15`,
                width: 56,
                height: 56,
                border: `2px solid ${getFileColor(doc.document_type)}33`,
                boxShadow: `0 4px 20px ${getFileColor(doc.document_type)}33`,
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}>
                {getFileIcon(doc.document_type)}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkText, mb: 0.5 }}>
                {doc.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={doc.category}
                  size="small"
                  sx={{
                    bgcolor: colors.sidebar + '10',
                    color: colors.sidebar,
                    fontWeight: 500,
                    fontSize: '10px',
                    height: 20,
                    border: `1px solid ${colors.sidebar}20`
                  }}
                />
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: colors.borderColor }} />
                <Typography variant="caption" sx={{ color: colors.lightText }}>
                  {doc.file_size || '0 KB'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Details Section */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalServices sx={{ fontSize: 16, color: colors.lightText }} />
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                {doc.equipment || 'No Equipment'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 16, color: colors.lightText }} />
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                {doc.uploaded_by_name || doc.uploaded_by || 'System'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday sx={{ fontSize: 16, color: colors.lightText }} />
              <Typography variant="body2" sx={{ color: colors.lightText }}>
                {formatDate(doc.created_at || doc.uploaded_at)}
              </Typography>
            </Box>
          </Box>

          {/* Description */}
          {doc.description && (
            <Typography variant="body2" sx={{ 
              mt: 1.5, 
              color: colors.lightText,
              fontSize: '0.8rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {doc.description}
            </Typography>
          )}
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ p: 2, pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              startIcon={<Visibility sx={{ fontSize: 18 }} />}
              onClick={() => onView(doc)}
              sx={{ 
                color: colors.sidebar,
                '&:hover': { color: colors.accentGold, bgcolor: `${colors.accentGold}10` },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              View
            </Button>
          </Tooltip>
          
          <Tooltip title="Download">
            <Button 
              size="small" 
              startIcon={<Download sx={{ fontSize: 18 }} />}
              onClick={() => onDownload(doc)}
              sx={{ 
                color: colors.sidebar,
                '&:hover': { color: colors.accentGold, bgcolor: `${colors.accentGold}10` },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            >
              Download
            </Button>
          </Tooltip>
          
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton 
                size="small" 
                onClick={() => onEdit(doc)}
                sx={{ 
                  color: colors.sidebar,
                  '&:hover': { color: colors.accentGold, bgcolor: `${colors.accentGold}10` }
                }}
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
                onClick={() => onDelete(doc.id)}
                sx={{ '&:hover': { bgcolor: `${colors.error}10` } }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      </Card>
    </Grow>
  )
}

// ============================================================
// ✅ FORMAT DATE HELPER
// ============================================================
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const ServiceDocumentation = () => {
  const { user } = useSelector((state) => state.auth)
  
  console.log('🔐 ServiceDocumentation - User:', user)
  console.log('🔐 Token exists:', !!localStorage.getItem('token'))
  
  if (!user) {
    console.warn('⚠️ No user found, redirecting to login')
    window.location.href = '/login'
    return null
  }
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Service Documentation." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const canView = isEngineer || isSuperAdmin
  const canUpload = isEngineer || isSuperAdmin
  const canEdit = isSuperAdmin
  const canDelete = isSuperAdmin

  const [documents, setDocuments] = useState([])
  const [equipmentList, setEquipmentList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [editingDocument, setEditingDocument] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    document_type: 'PDF',
    category: 'Service Manual',
    equipment: '',
    equipment_id: '',
    description: '',
    file: null,
    fileUrl: ''
  })

  const categories = [
    'All',
    'Service Manual',
    'Calibration',
    'Repair Guide',
    'User Manual',
    'Warranty',
    'Other'
  ]

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('⚠️ No token found, redirecting to login')
      window.location.href = '/login'
      return
    }
    fetchDocuments()
    fetchEquipmentList()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('📄 Fetching service documentation...')
      const response = await api.get('/service-documentation')
      console.log('✅ Documents fetched:', response.data)
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error('❌ Error fetching documents:', error)
      console.error('❌ Error response:', error.response?.data)
      
      if (error.response?.status === 401) {
        console.warn('⚠️ Unauthorized, redirecting to login')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return
      }
      
      setError(error.response?.data?.message || 'Failed to fetch documents')
      toast.error(error.response?.data?.message || 'Failed to fetch documents')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipmentList = async () => {
    try {
      const response = await api.get('/equipment')
      setEquipmentList(response.data.equipment || [])
      console.log('✅ Equipment list loaded:', response.data.equipment?.length || 0, 'items')
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB')
        return
      }
      console.log('📎 File selected:', file.name, file.size, file.type)
      setFormData({
        ...formData,
        file: file,
        file_name: file.name,
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }

  const handleUpload = async () => {
    console.log('📤 Uploading document with data:', formData)
    
    if (!formData.title || formData.title.trim() === '') {
      toast.error('Please enter a document title')
      return
    }

    if (!formData.equipment_id) {
      toast.error('Please select equipment')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      let fileUrl = ''
      let fileName = ''
      let fileSize = ''

      if (formData.file) {
        const fileFormData = new FormData()
        fileFormData.append('file', formData.file)
        
        console.log('📤 Uploading file:', formData.file.name)
        
        const uploadResponse = await api.post('/service-documentation/upload', fileFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          },
          timeout: 120000
        })
        
        console.log('✅ File upload response:', uploadResponse.data)
        
        if (uploadResponse.data.success) {
          fileUrl = uploadResponse.data.file.url
          fileName = uploadResponse.data.file.name
          fileSize = `${(uploadResponse.data.file.size / 1024 / 1024).toFixed(2)} MB`
        } else {
          throw new Error(uploadResponse.data.message || 'File upload failed')
        }
      } else if (formData.fileUrl) {
        fileUrl = formData.fileUrl
        fileName = formData.file_name || 'document'
        fileSize = formData.file_size || '0 KB'
      }

      const payload = {
        title: formData.title.trim(),
        document_type: formData.document_type || 'PDF',
        category: formData.category || 'Other',
        equipment_id: parseInt(formData.equipment_id),
        equipment: formData.equipment || '',
        description: formData.description || '',
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        version: '1.0',
        hospital_id: user?.hospital_id || null,
        uploaded_by: user?.id || null,
        uploaded_by_name: user?.full_name || ''
      }

      console.log('📤 Creating document record:', payload)

      let response
      if (editingDocument) {
        if (!isSuperAdmin) {
          toast.error('Only Super Admin can edit documents')
          return
        }
        response = await api.put(`/service-documentation/${selectedDoc.id}`, payload)
        toast.success('Document updated successfully')
      } else {
        response = await api.post('/service-documentation', payload)
        toast.success('Document uploaded successfully')
      }
      
      console.log('✅ Document saved:', response.data)
      
      setOpenDialog(false)
      setEditingDocument(false)
      setFormData({
        title: '',
        document_type: 'PDF',
        category: 'Service Manual',
        equipment: '',
        equipment_id: '',
        description: '',
        file: null,
        fileUrl: ''
      })
      setUploadProgress(0)
      fetchDocuments()
    } catch (error) {
      console.error('❌ Upload error:', error)
      console.error('❌ Error response:', error.response?.data)
      toast.error(error.response?.data?.message || error.message || 'Operation failed')
    } finally {
      setUploading(false)
    }
  }

  const handleView = (doc) => {
    setSelectedDoc(doc)
    setOpenViewDialog(true)
  }

  const handleEdit = (doc) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can edit documents')
      return
    }
    setSelectedDoc(doc)
    setEditingDocument(true)
    setFormData({
      title: doc.title || '',
      document_type: doc.document_type || 'PDF',
      category: doc.category || 'Other',
      equipment: doc.equipment || '',
      equipment_id: doc.equipment_id || '',
      description: doc.description || '',
      file: null,
      fileUrl: doc.file_url || ''
    })
    setOpenDialog(true)
  }

  const handleDownload = async (doc) => {
    try {
      if (doc.file_url) {
        const fullUrl = doc.file_url.startsWith('http') ? doc.file_url : `http://localhost:5000${doc.file_url}`
        window.open(fullUrl, '_blank')
        toast.success('Download started')
      } else {
        const response = await api.get(`/service-documentation/${doc.id}/download`, {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', doc.file_name || 'document')
        document.body.appendChild(link)
        link.click()
        link.remove()
        toast.success('Download started')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    }
  }

  const handleDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete documents')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/service-documentation/${id}`)
        toast.success('Document deleted successfully')
        fetchDocuments()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error.response?.data?.message || 'Delete failed')
      }
    }
  }

  const getStats = () => {
    const total = documents.length
    const pdfCount = documents.filter(d => d.document_type === 'PDF').length
    const videoCount = documents.filter(d => d.document_type === 'Video').length
    const imageCount = documents.filter(d => d.document_type === 'Image').length
    return { total, pdfCount, videoCount, imageCount }
  }

  const stats = getStats()

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.equipment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: colors.sidebar }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ErrorOutline sx={{ fontSize: 64, color: colors.error }} />
        <Typography variant="h6" sx={{ color: colors.error, mt: 2 }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={fetchDocuments} 
          sx={{ 
            mt: 2,
            bgcolor: colors.sidebar,
            '&:hover': { bgcolor: colors.sidebarHover }
          }}
        >
          Try Again
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.sidebar }}>
            Service Documentation
          </Typography>
          <Chip 
            icon={<MenuBook sx={{ fontSize: 16 }} />}
            label={`${documents.length} Documents`}
            size="small"
            sx={{ 
              bgcolor: colors.sidebar, 
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-icon': { color: colors.accentGold }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDocuments}
            size="small"
            sx={{ 
              borderColor: colors.sidebar, 
              color: colors.sidebar,
              '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
            }}
          >
            Refresh
          </Button>
          {canUpload && (
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => {
                setEditingDocument(false)
                setFormData({
                  title: '',
                  document_type: 'PDF',
                  category: 'Service Manual',
                  equipment: '',
                  equipment_id: '',
                  description: '',
                  file: null,
                  fileUrl: ''
                })
                setOpenDialog(true)
              }}
              sx={{
                bgcolor: colors.sidebar,
                '&:hover': { bgcolor: colors.sidebarHover },
                boxShadow: `0 4px 16px ${colors.sidebar}44`
              }}
            >
              Upload Document
            </Button>
          )}
        </Box>
      </Box>

      {/* Enhanced Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="Total Documents" 
            value={stats.total} 
            icon={<Description sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.sidebar}
            bgColor={colors.sidebar}
            subtext="All documentation"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="PDF Files" 
            value={stats.pdfCount} 
            icon={<PictureAsPdf sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.error}
            bgColor={colors.error}
            subtext="Documentation"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="Videos" 
            value={stats.videoCount} 
            icon={<VideoFile sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.info}
            bgColor={colors.info}
            subtext="Video tutorials"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            title="Images" 
            value={stats.imageCount} 
            icon={<Image sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.success}
            bgColor={colors.success}
            subtext="Visual guides"
          />
        </Grid>
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search documents..."
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
                  borderRadius: 2,
                  '&:hover fieldset': { borderColor: colors.sidebar },
                  '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                }
              }
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.lightText }}>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.sidebar },
                  '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                }
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.filter(c => c !== 'All').map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Document Cards Grid */}
      <Grid container spacing={3}>
        {filteredDocs.map((doc) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
            <DocumentCard
              doc={doc}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDownload={handleDownload}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredDocs.length === 0 && !loading && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`
        }}>
          <Description sx={{ fontSize: 64, color: colors.lightText }} />
          <Typography variant="h6" sx={{ color: colors.lightText, mt: 2 }}>
            No documents found
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mb: 2 }}>
            Try adjusting your search or filters
          </Typography>
          {canUpload && (
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => {
                setEditingDocument(false)
                setFormData({
                  title: '',
                  document_type: 'PDF',
                  category: 'Service Manual',
                  equipment: '',
                  equipment_id: '',
                  description: '',
                  file: null,
                  fileUrl: ''
                })
                setOpenDialog(true)
              }}
              sx={{ 
                mt: 2,
                bgcolor: colors.sidebar,
                '&:hover': { bgcolor: colors.sidebarHover }
              }}
            >
              Upload First Document
            </Button>
          )}
        </Paper>
      )}

      {/* UPLOAD/EDIT DIALOG */}
      {canUpload && (
        <Dialog open={openDialog} onClose={() => {
          setOpenDialog(false)
          setEditingDocument(false)
        }} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {editingDocument ? 'Edit Document' : 'Upload Document'}
              </Typography>
              <IconButton onClick={() => {
                setOpenDialog(false)
                setEditingDocument(false)
              }} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Document Title *"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                required
                sx={{ mb: 2 }}
                placeholder="Enter document title"
                InputProps={{
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }
                }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: colors.lightText }}>Document Type</InputLabel>
                <Select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleFormChange}
                  label="Document Type"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="Word">Word Document</MenuItem>
                  <MenuItem value="Excel">Excel Spreadsheet</MenuItem>
                  <MenuItem value="Video">Video</MenuItem>
                  <MenuItem value="Image">Image</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: colors.lightText }}>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  label="Category"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
                >
                  <MenuItem value="Service Manual">Service Manual</MenuItem>
                  <MenuItem value="Calibration">Calibration</MenuItem>
                  <MenuItem value="Repair Guide">Repair Guide</MenuItem>
                  <MenuItem value="User Manual">User Manual</MenuItem>
                  <MenuItem value="Warranty">Warranty</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }} required>
                <InputLabel sx={{ color: colors.lightText }}>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment *"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
                >
                  <MenuItem value="">Select Equipment</MenuItem>
                  {equipmentList.map((eq) => (
                    <MenuItem key={eq.id} value={eq.id}>
                      {eq.name} - {eq.model} ({eq.hospital_name || 'No Hospital'})
                    </MenuItem>
                  ))}
                </Select>
                {equipmentList.length === 0 && (
                  <Typography variant="caption" sx={{ color: colors.error, mt: 1 }}>
                    No equipment available. Please add equipment first.
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                placeholder="Brief description of the document"
                InputProps={{
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }
                }}
              />
              
              {!editingDocument && (
                <>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<FilePresent />}
                    fullWidth
                    sx={{ 
                      py: 3, 
                      borderStyle: 'dashed',
                      borderColor: colors.borderColor,
                      color: colors.lightText,
                      '&:hover': {
                        borderColor: colors.accentGold,
                        borderStyle: 'dashed',
                        color: colors.accentGold
                      }
                    }}
                  >
                    {formData.file ? formData.file.name : 'Choose File (Max: 50MB)'}
                    <input 
                      type="file" 
                      hidden 
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif,.webp"
                    />
                  </Button>
                  <Typography variant="caption" sx={{ color: colors.lightText, mt: 1, display: 'block' }}>
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, MP4, JPG, PNG (Max: 50MB)
                  </Typography>
                  {formData.file && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.info}33` }}>
                      Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </Alert>
                  )}
                </>
              )}

              {editingDocument && formData.fileUrl && (
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.success}33` }}>
                  Current file: {formData.file_name || 'document'}
                  <Button 
                    size="small" 
                    href={formData.fileUrl} 
                    target="_blank"
                    sx={{ 
                      ml: 2,
                      color: colors.sidebar,
                      '&:hover': { color: colors.accentGold }
                    }}
                  >
                    View
                  </Button>
                </Alert>
              )}

              {uploading && uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      Uploading...
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: colors.borderColor,
                      '& .MuiLinearProgress-bar': { bgcolor: colors.accentGold }
                    }} 
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={() => {
                setOpenDialog(false)
                setEditingDocument(false)
              }}
              variant="outlined"
              sx={{ color: colors.lightText, borderColor: colors.borderColor }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              sx={{
                bgcolor: colors.sidebar,
                '&:hover': { bgcolor: colors.sidebarHover },
                boxShadow: `0 4px 16px ${colors.sidebar}44`
              }}
              startIcon={editingDocument ? <Edit /> : <Upload />}
            >
              {uploading ? 'Uploading...' : (editingDocument ? 'Update' : 'Upload')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* View Document Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Document Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDoc && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: colors.darkText }}>
                      {selectedDoc.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Chip
                        label={selectedDoc.document_type}
                        size="small"
                        sx={{
                          bgcolor: selectedDoc.document_type === 'PDF' ? colors.error :
                                   selectedDoc.document_type === 'Video' ? colors.info :
                                   selectedDoc.document_type === 'Image' ? colors.success : colors.lightText,
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                      <Chip
                        label={selectedDoc.category}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: colors.borderColor, color: colors.lightText }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Equipment</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                    {selectedDoc.equipment || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Uploaded By</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                    {selectedDoc.uploaded_by_name || selectedDoc.uploaded_by || 'System'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Uploaded Date</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                    {formatDate(selectedDoc.created_at || selectedDoc.uploaded_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>File Size</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                    {selectedDoc.file_size || '-'}
                  </Typography>
                </Grid>

                {selectedDoc.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: colors.lightText }}>Description</Typography>
                    <Typography variant="body1" sx={{ mt: 1, color: colors.darkText }}>
                      {selectedDoc.description}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => handleDownload(selectedDoc)}
                      sx={{ 
                        bgcolor: colors.sidebar, 
                        '&:hover': { bgcolor: colors.sidebarHover }, 
                        px: 4,
                        boxShadow: `0 4px 16px ${colors.sidebar}44`
                      }}
                    >
                      Download Document
                    </Button>
                    {selectedDoc.file_url && (
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => window.open(selectedDoc.file_url, '_blank')}
                        sx={{ 
                          px: 4,
                          borderColor: colors.sidebar,
                          color: colors.sidebar,
                          '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
                        }}
                      >
                        Open in Browser
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)}
            variant="contained"
            sx={{ 
              bgcolor: colors.sidebar,
              '&:hover': { bgcolor: colors.sidebarHover }
            }}
          >
            Close
          </Button>
          {isSuperAdmin && selectedDoc && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(selectedDoc.id)
                setOpenViewDialog(false)
              }}
              startIcon={<Delete />}
              sx={{ boxShadow: `0 4px 16px ${colors.error}44` }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  )
}

export default ServiceDocumentation