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
  InputLabel
} from '@mui/material'
import {
  Upload,
  Search,
  Download,
  Visibility,
  Delete,
  Description,
  PictureAsPdf,
  VideoFile,
  InsertDriveFile,
  Close,
  Folder
} from '@mui/icons-material'
import { toast } from 'react-toastify'

const ServiceDocumentation = () => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      // Sample data
      setDocuments([
        {
          id: 1,
          title: 'Ventilator Service Manual',
          type: 'PDF',
          category: 'Service Manual',
          equipment: 'Ventilator',
          date: '2024-01-15',
          size: '2.4 MB',
          uploadedBy: 'Dr. Ahmed'
        },
        {
          id: 2,
          title: 'Patient Monitor Calibration Guide',
          type: 'PDF',
          category: 'Calibration',
          equipment: 'Patient Monitor',
          date: '2024-01-20',
          size: '1.8 MB',
          uploadedBy: 'Engineer Ali'
        },
        {
          id: 3,
          title: 'ECG Machine Repair Video',
          type: 'Video',
          category: 'Repair Guide',
          equipment: 'ECG Machine',
          date: '2024-01-25',
          size: '45 MB',
          uploadedBy: 'Engineer Hassan'
        }
      ])
    } catch (error) {
      toast.error('Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setOpenDialog(false)
      toast.success('Document uploaded successfully')
      fetchDocuments()
    }, 2000)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      toast.success('Document deleted successfully')
      fetchDocuments()
    }
  }

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return <PictureAsPdf sx={{ color: '#dc3545' }} />
      case 'video':
        return <VideoFile sx={{ color: '#0B5FA5' }} />
      default:
        return <InsertDriveFile sx={{ color: '#6c757d' }} />
    }
  }

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'error'
      case 'video':
        return 'primary'
      default:
        return 'default'
    }
  }

  const filteredDocs = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.equipment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Service Documentation
        </Typography>
        <Button
          variant="contained"
          startIcon={<Upload />}
          onClick={() => setOpenDialog(true)}
          sx={{
            bgcolor: '#0B5FA5',
            '&:hover': { bgcolor: '#084a8a' }
          }}
        >
          Upload Document
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
          <Button variant="outlined" startIcon={<Folder />}>
            Categories
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {filteredDocs.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc.id}>
            <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#f0f7ff', mr: 2 }}>
                    {getFileIcon(doc.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {doc.title}
                    </Typography>
                    <Chip
                      label={doc.type}
                      size="small"
                      color={getTypeColor(doc.type)}
                      sx={{ mr: 0.5 }}
                    />
                    <Chip
                      label={doc.category}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Equipment: {doc.equipment}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Uploaded: {doc.date}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Size: {doc.size}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  By: {doc.uploadedBy}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button size="small" startIcon={<Visibility />} color="primary">
                  View
                </Button>
                <Button size="small" startIcon={<Download />} color="info">
                  Download
                </Button>
                <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredDocs.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Description sx={{ fontSize: 64, color: '#6c757d' }} />
          <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
            No documents found
          </Typography>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setOpenDialog(true)}
            sx={{ mt: 2 }}
          >
            Upload First Document
          </Button>
        </Paper>
      )}

      {/* Upload Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Document
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Document Title"
              placeholder="Enter document title"
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Document Type</InputLabel>
              <Select label="Document Type" value="PDF">
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
              <Select label="Category" value="Service Manual">
                <MenuItem value="Service Manual">Service Manual</MenuItem>
                <MenuItem value="Calibration">Calibration</MenuItem>
                <MenuItem value="Repair Guide">Repair Guide</MenuItem>
                <MenuItem value="User Manual">User Manual</MenuItem>
                <MenuItem value="Warranty">Warranty</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Equipment"
              placeholder="Associated equipment"
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              fullWidth
              sx={{ py: 3, borderStyle: 'dashed' }}
            >
              Choose File
              <input type="file" hidden />
            </Button>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Supported formats: PDF, DOC, DOCX, XLS, XLSX, MP4, JPG, PNG (Max: 50MB)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            sx={{
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#084a8a' }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ServiceDocumentation