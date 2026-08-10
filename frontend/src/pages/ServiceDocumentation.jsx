// src/pages/ServiceDocumentation.jsx
// ✅ ENGINEER: View ALL documents, Upload (Create), Edit ONLY own documents (NO Delete)
// ✅ SUPER_ADMIN: View ALL, Edit ANY, Delete ANY (Full Access)
// ❌ HOSPITAL_ADMIN: Access Denied

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
  CircularProgress
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
  AdminPanelSettings
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import AccessDenied from '../components/Auth/AccessDenied'

const ServiceDocumentation = () => {
  const { user } = useSelector((state) => state.auth)
  
  console.log('🔐 ServiceDocumentation - User:', user)
  console.log('🔐 Token exists:', !!localStorage.getItem('token'))
  
  if (!user) {
    console.warn('⚠️ No user found, redirecting to login')
    window.location.href = '/login'
    return null
  }
  
  // ✅ HOSPITAL_ADMIN - Access Denied
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Service Documentation." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  // ✅ PERMISSIONS
  // ✅ ENGINEER: View ALL, Upload (Create), Edit ONLY own documents (NO Delete)
  // ✅ SUPER_ADMIN: Full Access (View, Upload, Edit, Delete)
  const canUpload = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin // ✅ ONLY Super Admin can delete
  const canView = isEngineer || isSuperAdmin // ✅ Both can view
  
  // ✅ Engineer can ONLY edit their own documents
  const canEdit = (doc) => {
    if (isSuperAdmin) return true // ✅ Super Admin can edit any
    if (isEngineer) {
      // Check if this document belongs to this engineer
      return doc.uploaded_by === user?.id || doc.uploaded_by_name === user?.full_name
    }
    return false
  }

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

      // ✅ STEP 1: Upload file if selected
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

      // ✅ STEP 2: Create document record with correct fields
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
    // ✅ Check if user can edit this document
    if (!canEdit(doc)) {
      toast.error('You can only edit your own documents')
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
    if (!canDelete) {
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStats = () => {
    const total = documents.length
    const pdfCount = documents.filter(d => d.document_type === 'PDF').length
    const videoCount = documents.filter(d => d.document_type === 'Video').length
    const imageCount = documents.filter(d => d.document_type === 'Image').length
    return { total, pdfCount, videoCount, imageCount }
  }

  const stats = getStats()

  // ✅ Everyone can see ALL documents (no filtering by uploader)
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
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ErrorOutline sx={{ fontSize: 64, color: '#dc3545' }} />
        <Typography variant="h6" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchDocuments} sx={{ mt: 2 }}>
          Try Again
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* ✅ Header - Role Chips */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
            Service Documentation
          </Typography>
          {isEngineer && (
            <Chip 
              icon={<EngineeringIcon sx={{ fontSize: 16 }} />}
              label="Engineer Mode - View & Upload Only" 
              size="small" 
              color="info" 
            />
          )}
          {isSuperAdmin && (
            <Chip 
              icon={<AdminPanelSettings sx={{ fontSize: 16 }} />}
              label="Super Admin (Full Control)" 
              size="small" 
              color="warning" 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDocuments}
            size="small"
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
                bgcolor: '#0B5FA5',
                '&:hover': { bgcolor: '#084a8a' }
              }}
            >
              Upload Document
            </Button>
          )}
        </Box>
      </Box>

      {/* Info Alert - Engineers can see all documents */}
      {isEngineer && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>📄 Collaborative View:</strong> You can see all documents from all engineers. 
            You can only <strong>edit</strong> your own documents. Only <strong>Super Admin</strong> can delete documents.
          </Typography>
        </Alert>
      )}

      {isSuperAdmin && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>👑 Super Admin:</strong> You have full control. You can view, upload, edit, and delete any document.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} color="#0B5FA5">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="textSecondary">Total Documents</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} color="#dc3545">
              {stats.pdfCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">PDF Files</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} color="#0B5FA5">
              {stats.videoCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">Videos</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} color="#28a745">
              {stats.imageCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">Images</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
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
                  <Search />
                </InputAdornment>
              )
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.filter(c => c !== 'All').map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Document Cards */}
      <Grid container spacing={3}>
        {filteredDocs.map((doc) => {
          const isOwnDocument = isEngineer && (doc.uploaded_by === user?.id || doc.uploaded_by_name === user?.full_name)
          
          return (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card sx={{ 
                borderRadius: 2, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {doc.title}
                      </Typography>
                      <Chip
                        label={doc.document_type}
                        size="small"
                        color={
                          doc.document_type === 'PDF' ? 'error' :
                          doc.document_type === 'Video' ? 'info' :
                          doc.document_type === 'Image' ? 'success' : 'default'
                        }
                        sx={{ mr: 0.5 }}
                      />
                      <Chip
                        label={doc.category}
                        size="small"
                        variant="outlined"
                      />
                      {isOwnDocument && (
                        <Chip 
                          label="My Document" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 0.5, height: 18, fontSize: '9px' }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    <MedicalServices sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    Equipment: {doc.equipment || '-'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    Uploaded: {formatDate(doc.created_at || doc.uploaded_at)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <InsertDriveFile sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    Size: {doc.file_size || '-'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    <Person sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    By: {doc.uploaded_by_name || doc.uploaded_by || 'System'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Tooltip title="View Details">
                    <Button 
                      size="small" 
                      startIcon={<Visibility />} 
                      color="primary"
                      onClick={() => handleView(doc)}
                    >
                      View
                    </Button>
                  </Tooltip>
                  <Tooltip title="Download">
                    <Button 
                      size="small" 
                      startIcon={<Download />} 
                      color="info"
                      onClick={() => handleDownload(doc)}
                    >
                      Download
                    </Button>
                  </Tooltip>
                  
                  {/* ✅ Engineer can ONLY edit their own documents, Super Admin can edit any */}
                  {canEdit(doc) && (
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        color="info" 
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {/* ✅ ONLY Super Admin can Delete */}
                  {canDelete && (
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Empty State */}
      {filteredDocs.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Description sx={{ fontSize: 64, color: '#6c757d' }} />
          <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
            No documents found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
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
              sx={{ mt: 2 }}
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
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {editingDocument ? 'Edit Document' : 'Upload Document'}
              </Typography>
              {editingDocument && (
                <Chip 
                  label={isEngineer ? 'Editing Your Document' : 'Super Admin Edit'} 
                  size="small" 
                  color={isEngineer ? 'info' : 'warning'} 
                />
              )}
              <IconButton onClick={() => {
                setOpenDialog(false)
                setEditingDocument(false)
              }}>
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
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Document Type</InputLabel>
                <Select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleFormChange}
                  label="Document Type"
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
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  label="Category"
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
                <InputLabel>Equipment *</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment *"
                  required
                >
                  <MenuItem value="">Select Equipment</MenuItem>
                  {equipmentList.map((eq) => (
                    <MenuItem key={eq.id} value={eq.id}>
                      {eq.name} - {eq.model} ({eq.hospital_name || 'No Hospital'})
                    </MenuItem>
                  ))}
                </Select>
                {equipmentList.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
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
                      '&:hover': {
                        borderStyle: 'dashed'
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
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, MP4, JPG, PNG (Max: 50MB)
                  </Typography>
                  {formData.file && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </Alert>
                  )}
                </>
              )}

              {editingDocument && formData.fileUrl && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Current file: {formData.file_name || 'document'}
                  <Button 
                    size="small" 
                    color="primary" 
                    href={formData.fileUrl} 
                    target="_blank"
                    sx={{ ml: 2 }}
                  >
                    View
                  </Button>
                </Alert>
              )}

              {/* Upload Progress */}
              {uploading && uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Uploading...
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3 }} />
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
              sx={{ color: '#6c757d', borderColor: '#6c757d' }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              sx={{
                bgcolor: '#0B5FA5',
                '&:hover': { bgcolor: '#084a8a' }
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
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Document Details
            </Typography>
            <Box>
              {isSuperAdmin && (
                <Chip label="Super Admin" size="small" color="warning" sx={{ mr: 1 }} />
              )}
              {isEngineer && (
                <Chip label="Engineer" size="small" color="info" sx={{ mr: 1 }} />
              )}
              <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDoc && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedDoc.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Chip
                        label={selectedDoc.document_type}
                        size="small"
                        color={
                          selectedDoc.document_type === 'PDF' ? 'error' :
                          selectedDoc.document_type === 'Video' ? 'info' :
                          selectedDoc.document_type === 'Image' ? 'success' : 'default'
                        }
                      />
                      <Chip
                        label={selectedDoc.category}
                        size="small"
                        variant="outlined"
                      />
                      {isEngineer && selectedDoc.uploaded_by === user?.id && (
                        <Chip label="Your Document" size="small" color="primary" />
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Equipment</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedDoc.equipment || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Uploaded By</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedDoc.uploaded_by_name || selectedDoc.uploaded_by || 'System'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Uploaded Date</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(selectedDoc.created_at || selectedDoc.uploaded_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">File Size</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedDoc.file_size || '-'}
                  </Typography>
                </Grid>

                {selectedDoc.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Description</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {selectedDoc.description}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => handleDownload(selectedDoc)}
                      sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' }, px: 4 }}
                    >
                      Download Document
                    </Button>
                    {selectedDoc.file_url && (
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => window.open(selectedDoc.file_url, '_blank')}
                        sx={{ px: 4 }}
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
            sx={{ bgcolor: '#0B5FA5' }}
          >
            Close
          </Button>
          {/* ✅ ONLY Super Admin can delete */}
          {isSuperAdmin && selectedDoc && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(selectedDoc.id)
                setOpenViewDialog(false)
              }}
              startIcon={<Delete />}
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