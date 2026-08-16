// src/pages/ServiceDocumentation.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Equipment page
// ✅ BOTH SUPER ADMIN AND ENGINEERS CAN UPLOAD DOCUMENTS
// ✅ UPDATED: Stats cards design matches Equipment page
// ✅ UPDATED: Header with Filter and Export buttons
// ✅ ADDED: Export functionality (CSV, Excel, PDF)
// ✅ ADDED: Filter menu popup
// ✅ ADDED: Animations

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
  Stack,
  Menu,
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
  Lightbulb,
  FilterList,
  FileDownload,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import AccessDenied from '../components/Auth/AccessDenied'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS - Matching Equipment page
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

// ✅ Animation Styles - Same as Equipment page
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
`

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
  
  // ✅ HOSPITAL_ADMIN CANNOT ACCESS
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Service Documentation." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  // ✅ BOTH ENGINEER AND SUPER ADMIN CAN VIEW AND UPLOAD
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
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

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

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToCSV = () => {
    try {
      const headers = ['Title', 'Document Type', 'Category', 'Equipment', 'Description', 'Uploaded By', 'Uploaded Date', 'File Size']
      const rows = filteredDocs.map(d => [
        d.title || '',
        d.document_type || '',
        d.category || '',
        d.equipment || '',
        d.description || '',
        d.uploaded_by_name || d.uploaded_by || '',
        formatDate(d.created_at || d.uploaded_at),
        d.file_size || ''
      ])
      let csv = headers.join(',') + '\n'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `service_docs_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('CSV exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportToExcel = () => {
    try {
      const data = filteredDocs.map(d => ({
        'Title': d.title || '',
        'Document Type': d.document_type || '',
        'Category': d.category || '',
        'Equipment': d.equipment || '',
        'Description': d.description || '',
        'Uploaded By': d.uploaded_by_name || d.uploaded_by || '',
        'Uploaded Date': formatDate(d.created_at || d.uploaded_at),
        'File Size': d.file_size || ''
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Service Documents')
      XLSX.writeFile(wb, `service_docs_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Service Documentation Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Documents: ${filteredDocs.length}`, 14, 34)
      
      const tableData = filteredDocs.map(d => [
        d.title || '',
        d.document_type || '',
        d.category || '',
        d.equipment || '',
        formatDate(d.created_at || d.uploaded_at)
      ])
      autoTable(doc, {
        head: [['Title', 'Type', 'Category', 'Equipment', 'Uploaded Date']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`service_docs_${new Date().toISOString().split('T')[0]}.pdf`)
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
    setCategoryFilter(e.target.value)
  }

  const clearFilters = () => {
    setCategoryFilter('all')
    setSearchTerm('')
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
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

  // ✅ Stats Cards Data - Same design as Equipment page
  const statsCards = [
    {
      title: 'Total Documents',
      value: stats.total,
      icon: <MenuBook />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'PDF Files',
      value: stats.pdfCount,
      icon: <PictureAsPdf />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Videos',
      value: stats.videoCount,
      icon: <VideoFile />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Images',
      value: stats.imageCount,
      icon: <Image />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
  ]

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.equipment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // ============================================================
  // ✅ GET FILE ICON
  // ============================================================
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: colors.darkNavy }} />
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
            bgcolor: colors.darkNavy,
            '&:hover': { 
              bgcolor: colors.darkNavyHover,
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
            },
            textTransform: 'none',
            borderRadius: 2,
          }}
        >
          Try Again
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      background: `linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 50%, ${colors.bgGradientStart} 100%)`,
      minHeight: '100vh',
      borderRadius: 0,
      position: 'relative',
    }}>
      <style>{animationStyles}</style>

      {/* ============================================================
          HEADER - Same as Equipment page
          ============================================================ */}
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
            Service Documentation
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage service manuals, calibration guides, and repair documentation
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* ✅ REFRESH BUTTON - BORDER STYLE */}
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchDocuments} 
            size="small"
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
            Refresh
          </Button>
          
          {/* ✅ FILTER BUTTON */}
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
          
          {/* ✅ EXPORT BUTTON */}
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
              Upload Document
            </Button>
          )}
        </Box>
      </Box>

      {/* ============================================================
          STATS CARDS - Same design as Equipment page
          ============================================================ */}
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

      {/* ============================================================
          SEARCH - Only search bar
          ============================================================ */}
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
            placeholder="Search documents..."
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
                '& .MuiInputBase-input': {
                  fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  fontSize: '0.9rem',
                }
              }
            }}
          />
        </Box>
      </Paper>

      {/* ============================================================
          FILTER MENU - Same as Equipment page
          ============================================================ */}
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
          Filter Documents
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Category</InputLabel>
          <Select 
            name="category" 
            value={categoryFilter} 
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
            <MenuItem value="all">All Categories</MenuItem>
            {categories.filter(c => c !== 'All').map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth 
          size="small" 
          label="Search Documents" 
          name="search"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, equipment..." 
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

      {/* ============================================================
          EXPORT MENU - Same as Equipment page
          ============================================================ */}
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
          onClick={exportToCSV} 
          sx={{ 
            borderRadius: 1,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
            } 
          }}
        >
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} /> 
          <Box>
            <Typography variant="body2" fontWeight={500}>CSV</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>Comma separated values</Typography>
          </Box>
        </MenuItem>
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

      {/* ============================================================
          DOCUMENT CARDS GRID
          ============================================================ */}
      <Grid container spacing={3}>
        {filteredDocs.map((doc) => {
          const isImage = doc.document_type === 'Image' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
              <Grow in timeout={300}>
                <Card
                  sx={{
                    borderRadius: 3,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `1px solid ${colors.borderColor}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
                      borderColor: colors.lightCyan,
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Top Gradient Bar */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${colors.darkNavy}, ${colors.lightCyan})`,
                  }} />
                  
                  <CardContent sx={{ p: 3, position: 'relative', flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      {/* File Icon */}
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
                            border: `2px solid white`,
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
                        }}>
                          {getFileIcon(doc.document_type)}
                        </Avatar>
                      </Badge>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 0.5, fontSize: '0.95rem' }}>
                          {doc.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={doc.category}
                            size="small"
                            sx={{
                              bgcolor: colors.darkNavy + '10',
                              color: colors.darkNavy,
                              fontWeight: 500,
                              fontSize: '10px',
                              height: 20,
                              borderRadius: 2,
                              border: `1px solid ${colors.darkNavy}20`
                            }}
                          />
                          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: colors.borderColor }} />
                          <Typography variant="caption" sx={{ color: colors.lightText }}>
                            {doc.file_size || '0 KB'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Details */}
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MedicalServices sx={{ fontSize: 16, color: colors.lightText }} />
                        <Typography variant="body2" sx={{ color: colors.lightText, fontSize: '0.8rem' }}>
                          {doc.equipment || 'No Equipment'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ fontSize: 16, color: colors.lightText }} />
                        <Typography variant="body2" sx={{ color: colors.lightText, fontSize: '0.8rem' }}>
                          {doc.uploaded_by_name || doc.uploaded_by || 'System'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: colors.lightText }} />
                        <Typography variant="body2" sx={{ color: colors.lightText, fontSize: '0.8rem' }}>
                          {formatDate(doc.created_at || doc.uploaded_at)}
                        </Typography>
                      </Box>
                    </Box>

                    {doc.description && (
                      <Typography variant="body2" sx={{ 
                        mt: 1.5, 
                        color: colors.lightText,
                        fontSize: '0.75rem',
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
                        onClick={() => handleView(doc)}
                        sx={{ 
                          color: colors.darkNavy,
                          '&:hover': { 
                            color: colors.lightCyanDark, 
                            bgcolor: 'rgba(103, 232, 249, 0.08)' 
                          },
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
                        onClick={() => handleDownload(doc)}
                        sx={{ 
                          color: colors.darkNavy,
                          '&:hover': { 
                            color: colors.lightCyanDark, 
                            bgcolor: 'rgba(103, 232, 249, 0.08)' 
                          },
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
                          onClick={() => handleEdit(doc)}
                          sx={{ 
                            color: colors.darkNavy,
                            '&:hover': { 
                              color: colors.lightCyanDark, 
                              bgcolor: 'rgba(103, 232, 249, 0.08)' 
                            }
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
                          onClick={() => handleDelete(doc.id)}
                          sx={{ '&:hover': { bgcolor: `${colors.error}10` } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grow>
            </Grid>
          )
        })}
      </Grid>

      {/* ============================================================
          EMPTY STATE
          ============================================================ */}
      {filteredDocs.length === 0 && !loading && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 3,
          border: `1px solid ${colors.borderColor}`,
          bgcolor: colors.cardBg,
        }}>
          <MenuBook sx={{ fontSize: 64, color: colors.lightText, opacity: 0.3 }} />
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
                bgcolor: colors.darkNavy,
                color: colors.text,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Upload First Document
            </Button>
          )}
        </Paper>
      )}

      {/* ============================================================
          UPLOAD/EDIT DIALOG
          ============================================================ */}
      {canUpload && (
        <Dialog 
          open={openDialog} 
          onClose={() => {
            setOpenDialog(false)
            setEditingDocument(false)
          }} 
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
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {editingDocument ? <Edit sx={{ fontSize: 28 }} /> : <Upload sx={{ fontSize: 28 }} />}
                {editingDocument ? 'Edit Document' : 'Upload Document'}
              </Typography>
              <IconButton onClick={() => {
                setOpenDialog(false)
                setEditingDocument(false)
              }} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 4, py: 3 }}>
            <Box>
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
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }
                  }
                }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Document Type</InputLabel>
                <Select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleFormChange}
                  label="Document Type"
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
                  <MenuItem value="PDF" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>PDF</MenuItem>
                  <MenuItem value="Word" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Word Document</MenuItem>
                  <MenuItem value="Excel" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Excel Spreadsheet</MenuItem>
                  <MenuItem value="Video" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Video</MenuItem>
                  <MenuItem value="Image" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Image</MenuItem>
                  <MenuItem value="Other" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
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
                  <MenuItem value="Service Manual" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Service Manual</MenuItem>
                  <MenuItem value="Calibration" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Calibration</MenuItem>
                  <MenuItem value="Repair Guide" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Repair Guide</MenuItem>
                  <MenuItem value="User Manual" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>User Manual</MenuItem>
                  <MenuItem value="Warranty" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Warranty</MenuItem>
                  <MenuItem value="Other" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Other</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }} required>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment *"
                  required
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
                  <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Select Equipment</MenuItem>
                  {equipmentList.map((eq) => (
                    <MenuItem key={eq.id} value={eq.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {eq.name} - {eq.model} ({eq.hospital_name || 'No Hospital'})
                    </MenuItem>
                  ))}
                </Select>
                {equipmentList.length === 0 && (
                  <Typography variant="caption" sx={{ color: colors.error, mt: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    },
                    '& .MuiInputBase-input': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: colors.lightCyan,
                        borderStyle: 'dashed',
                        color: colors.lightCyanDark
                      },
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
                  <Typography variant="caption" sx={{ color: colors.lightText, mt: 1, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, MP4, JPG, PNG (Max: 50MB)
                  </Typography>
                  {formData.file && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.2)` }}>
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
                      color: colors.darkNavy,
                      '&:hover': { color: colors.lightCyanDark },
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }}
                  >
                    View
                  </Button>
                </Alert>
              )}

              {uploading && uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Uploading...
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
                      '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan }
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
              sx={{ 
                color: colors.darkNavy, 
                borderColor: colors.borderColor,
                '&:hover': { 
                  borderColor: colors.lightCyan,
                  backgroundColor: 'rgba(103, 232, 249, 0.04)'
                },
                textTransform: 'none',
                borderRadius: 2,
                fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
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
              startIcon={editingDocument ? <Edit /> : <Upload />}
            >
              {uploading ? 'Uploading...' : (editingDocument ? 'Update' : 'Upload')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ============================================================
          VIEW DOCUMENT DIALOG
          ============================================================ */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
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
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              <MenuBook sx={{ fontSize: 28 }} />
              Document Details
            </Typography>
            <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {selectedDoc && (
            <Box>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h5" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {selectedDoc.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedDoc.document_type}
                        size="small"
                        sx={{
                          bgcolor: getFileColor(selectedDoc.document_type),
                          color: 'white',
                          fontWeight: 600,
                          height: 26,
                          borderRadius: 2,
                        }}
                      />
                      <Chip
                        label={selectedDoc.category}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: colors.borderColor, color: colors.lightText, borderRadius: 2 }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Equipment
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {selectedDoc.equipment || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Uploaded By
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {selectedDoc.uploaded_by_name || selectedDoc.uploaded_by || 'System'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Uploaded Date
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {formatDate(selectedDoc.created_at || selectedDoc.uploaded_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    File Size
                  </Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {selectedDoc.file_size || '-'}
                  </Typography>
                </Grid>

                {selectedDoc.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
                      Download Document
                    </Button>
                    {selectedDoc.file_url && (
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => window.open(selectedDoc.file_url, '_blank')}
                        sx={{ 
                          px: 4,
                          borderColor: colors.darkNavy,
                          color: colors.darkNavy,
                          '&:hover': { 
                            borderColor: colors.lightCyan, 
                            color: colors.lightCyanDark,
                            backgroundColor: 'rgba(103, 232, 249, 0.04)'
                          },
                          textTransform: 'none',
                          borderRadius: 2,
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
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenViewDialog(false)}
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
          {isSuperAdmin && selectedDoc && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(selectedDoc.id)
                setOpenViewDialog(false)
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