// src/components/FileUpload.jsx - COMPLETE FIXED VERSION
import React, { useState, useRef } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  Image,
  PictureAsPdf,
  VideoFile,
  InsertDriveFile,
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Cancel
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import api from '../api/axios'

const FileUpload = ({
  endpoint = '/service-documentation/upload',
  accept = '*/*',
  multiple = false,
  label = 'Upload File',
  maxFiles = 5,
  maxSize = 50, // MB
  showPreview = true,
  onUploadComplete,
  onUploadError,
  onDelete,
  existingFiles = [],
  autoUpload = true,
  fieldName = 'file' // 'file' for single, 'files' for multiple
}) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [error, setError] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false)
  
  const fileInputRef = useRef(null)

  // Helper: Get full image URL
  const getFullUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    // Use full URL with localhost:5000
    return `http://localhost:5000${url}`
  }

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    
    // Check max files
    if (selectedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }
    
    // Check file size
    const validFiles = selectedFiles.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxSize) {
        toast.error(`${file.name} exceeds ${maxSize}MB limit`)
        return false
      }
      return true
    })
    
    if (validFiles.length === 0) {
      return
    }
    
    const newFiles = validFiles.map(file => ({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 'document',
      mimetype: file.type,
      progress: 0,
      status: 'pending', // pending, uploading, completed, error
      error: null
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    if (autoUpload) {
      handleUpload(newFiles)
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ✅ FIXED: handleUpload with proper response handling
  const handleUpload = async (filesToUpload = files) => {
    if (filesToUpload.length === 0) {
      toast.warning('No files to upload')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    const formData = new FormData()
    
    // Get the actual File objects
    const pendingFiles = filesToUpload.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) {
      toast.info('All files already uploaded')
      setUploading(false)
      return
    }
    
    // ✅ Append files - use the correct field name
    pendingFiles.forEach((fileObj) => {
      if (fileObj.file instanceof File) {
        formData.append(fieldName, fileObj.file)
        console.log(`📎 Appending file: ${fileObj.file.name} (${fileObj.file.size} bytes)`)
      } else {
        console.warn('⚠️ Invalid file object:', fileObj)
      }
    })

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => {
        if (pendingFiles.includes(f)) {
          return { ...f, status: 'uploading', progress: 0 }
        }
        return f
      }))

      const token = localStorage.getItem('token')
      
      // ✅ Normalize endpoint
      let finalEndpoint = endpoint
      if (!finalEndpoint.startsWith('/')) {
        finalEndpoint = '/' + finalEndpoint
      }
      
      console.log('📤 Uploading files to:', finalEndpoint)
      console.log('📤 FormData entries:')
      for (let pair of formData.entries()) {
        console.log(`   ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : pair[1]}`)
      }

      const response = await api.post(finalEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
          
          // Update individual file progress
          setFiles(prev => prev.map(f => {
            if (pendingFiles.includes(f)) {
              return { ...f, progress: percentCompleted }
            }
            return f
          }))
        },
        timeout: 120000 // 2 minutes for large files
      })

      console.log('✅ Upload response:', response.data)

      // ✅ Handle response - support different response formats
      let uploadedFilesData = []
      
      if (response.data.success) {
        if (response.data.files) {
          // Multiple files
          uploadedFilesData = response.data.files
        } else if (response.data.file) {
          // Single file
          uploadedFilesData = [response.data.file]
        } else if (response.data.fileUrl) {
          // Alternative single file format
          uploadedFilesData = [{
            url: response.data.fileUrl,
            name: response.data.fileName || 'file',
            size: response.data.fileSize || 0,
            type: response.data.fileType || 'document'
          }]
        } else if (response.data.url) {
          // Another alternative
          uploadedFilesData = [{
            url: response.data.url,
            name: response.data.name || 'file',
            size: response.data.size || 0,
            type: response.data.type || 'document'
          }]
        } else if (Array.isArray(response.data)) {
          // Direct array response
          uploadedFilesData = response.data
        } else {
          // Fallback: use the response data directly
          uploadedFilesData = [response.data]
        }
        
        // ✅ Update file status to completed
        setFiles(prev => prev.map(f => {
          if (pendingFiles.includes(f)) {
            // Find matching uploaded file
            const uploaded = uploadedFilesData.find(u => 
              u.name === f.name || 
              (u.originalName === f.name)
            ) || { 
              url: `/uploads/documents/${f.name}`, 
              name: f.name, 
              size: f.size, 
              type: f.type 
            }
            return { 
              ...f, 
              status: 'completed', 
              url: uploaded.url,
              serverResponse: uploaded,
              progress: 100
            }
          }
          return f
        }))
        
        setUploadedFiles(prev => [...prev, ...uploadedFilesData])
        
        if (onUploadComplete) {
          onUploadComplete(uploadedFilesData)
        }
        
        const count = uploadedFilesData.length
        toast.success(`✅ ${count} file${count > 1 ? 's' : ''} uploaded successfully`)
      } else {
        throw new Error(response.data.message || 'Upload failed')
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      console.error('❌ Error response:', error.response?.data)
      
      // Update file status to error
      setFiles(prev => prev.map(f => {
        if (pendingFiles.includes(f)) {
          return { 
            ...f, 
            status: 'error', 
            error: error.response?.data?.message || error.message || 'Upload failed' 
          }
        }
        return f
      }))
      
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed'
      setError(errorMessage)
      
      if (onUploadError) {
        onUploadError(errorMessage)
      }
      
      toast.error(errorMessage)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = (fileToDelete) => {
    // Remove from files list
    setFiles(prev => prev.filter(f => f !== fileToDelete))
    
    // If it was uploaded, remove from uploaded files
    if (fileToDelete.status === 'completed' && fileToDelete.url) {
      setUploadedFiles(prev => prev.filter(f => f.url !== fileToDelete.url))
    }
    
    if (onDelete) {
      onDelete(fileToDelete)
    }
    
    toast.info(`Removed ${fileToDelete.name}`)
  }

  const handleRemoveAll = () => {
    if (files.length === 0) return
    
    if (window.confirm('Remove all files?')) {
      setFiles([])
      setUploadedFiles([])
      toast.info('All files removed')
    }
  }

  const handlePreview = (file) => {
    setPreviewFile(file)
    setOpenPreviewDialog(true)
  }

  const getFileIcon = (file) => {
    const type = file.type || file.mimetype || ''
    
    if (type.startsWith('image/') || type === 'image') {
      return <Image sx={{ fontSize: 40, color: '#28a745' }} />
    } else if (type.startsWith('video/') || type === 'video') {
      return <VideoFile sx={{ fontSize: 40, color: '#0B5FA5' }} />
    } else if (type.includes('pdf')) {
      return <PictureAsPdf sx={{ fontSize: 40, color: '#dc3545' }} />
    } else {
      return <InsertDriveFile sx={{ fontSize: 40, color: '#6c757d' }} />
    }
  }

  const getFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default'
      case 'uploading': return 'warning'
      case 'completed': return 'success'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'uploading': return 'Uploading...'
      case 'completed': return 'Uploaded'
      case 'error': return 'Failed'
      default: return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle sx={{ fontSize: 16, color: '#28a745' }} />
      case 'error': return <ErrorIcon sx={{ fontSize: 16, color: '#dc3545' }} />
      case 'uploading': return <CloudUpload sx={{ fontSize: 16, color: '#ff9800' }} />
      default: return null
    }
  }

  // ✅ Render file preview with full URL
  const renderFilePreview = (file) => {
    const isImage = file.type === 'image' || file.mimetype?.startsWith('image/')
    const isVideo = file.type === 'video' || file.mimetype?.startsWith('video/')
    
    const imageUrl = file.url ? getFullUrl(file.url) : ''

    return (
      <Paper 
        key={file.name + file.size + file.status} 
        sx={{ 
          p: 1.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 1, 
          borderRadius: 1, 
          border: '1px solid #e9ecef',
          bgcolor: file.status === 'error' ? '#fff5f5' : 
                    file.status === 'completed' ? '#f0f7ff' : 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          {isImage && file.url ? (
            <Box
              component="img"
              src={imageUrl}
              alt={file.name}
              sx={{
                width: 50,
                height: 50,
                objectFit: 'cover',
                borderRadius: 1,
                cursor: 'pointer'
              }}
              onClick={() => handlePreview(file)}
              onError={(e) => {
                console.error('❌ Image load error:', imageUrl)
                e.target.style.display = 'none'
              }}
            />
          ) : (
            getFileIcon(file)
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap fontWeight={500}>
              {file.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="textSecondary">
                {getFileSize(file.size)}
              </Typography>
              <Chip 
                label={getStatusLabel(file.status)} 
                size="small" 
                color={getStatusColor(file.status)}
                icon={getStatusIcon(file.status)}
                sx={{ height: 20, fontSize: '10px' }}
              />
              {file.status === 'uploading' && (
                <LinearProgress 
                  variant="determinate" 
                  value={file.progress || 0} 
                  sx={{ width: 80, height: 4, borderRadius: 2 }}
                />
              )}
              {file.status === 'error' && file.error && (
                <Typography variant="caption" color="error">
                  {file.error}
                </Typography>
              )}
              {file.url && file.status === 'completed' && (
                <Chip 
                  label="View" 
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '10px', cursor: 'pointer' }}
                  onClick={() => handlePreview(file)}
                />
              )}
            </Box>
          </Box>
        </Box>
        <Tooltip title="Delete">
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => handleDelete(file)}
            disabled={file.status === 'uploading'}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    )
  }

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          borderStyle: 'dashed',
          borderColor: '#0B5FA5',
          bgcolor: '#f8f9fa',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: '#e9ecef',
            borderColor: '#084a8a'
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: '#0B5FA5', mb: 1 }} />
        <Typography variant="body1" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {multiple ? `Upload up to ${maxFiles} files` : 'Upload one file'} • Max {maxSize}MB each
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          Supported: Images, Videos, PDF, Word, Excel
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Progress */}
      {uploading && (
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

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Existing Files
          </Typography>
          {existingFiles.map((file, index) => (
            <Paper 
              key={file.url + index} 
              sx={{ 
                p: 1.5, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 1, 
                borderRadius: 1, 
                border: '1px solid #e9ecef',
                bgcolor: '#f0f7ff'
              }}
            >
              {file.type === 'image' || file.mimetype?.startsWith('image/') ? (
                <Box
                  component="img"
                  src={getFullUrl(file.url)}
                  alt={file.name}
                  sx={{
                    width: 50,
                    height: 50,
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                  onError={(e) => {
                    console.error('❌ Existing image load error:', getFullUrl(file.url))
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                getFileIcon(file)
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap fontWeight={500}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {getFileSize(file.size)}
                </Typography>
              </Box>
              <Tooltip title="Remove">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => {
                    if (onDelete) {
                      onDelete(file)
                    }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          ))}
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {files.length} file(s)
            </Typography>
            <Button size="small" color="error" onClick={handleRemoveAll}>
              Remove All
            </Button>
          </Box>
          {files.map((file, index) => renderFilePreview(file))}
        </Box>
      )}

      {/* Upload Button (for manual upload) */}
      {!autoUpload && files.some(f => f.status === 'pending') && (
        <Button
          variant="contained"
          onClick={() => handleUpload()}
          disabled={uploading}
          sx={{ mt: 2, bgcolor: '#0B5FA5' }}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={openPreviewDialog} 
        onClose={() => setOpenPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{previewFile?.name}</Typography>
            <IconButton onClick={() => setOpenPreviewDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center' }}>
              {previewFile.type === 'image' || previewFile.mimetype?.startsWith('image/') ? (
                <Box
                  component="img"
                  src={getFullUrl(previewFile.url)}
                  alt={previewFile.name}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    console.error('❌ Preview image error:', getFullUrl(previewFile.url))
                    e.target.style.display = 'none'
                  }}
                />
              ) : previewFile.type === 'video' || previewFile.mimetype?.startsWith('video/') ? (
                <video
                  src={getFullUrl(previewFile.url)}
                  controls
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              ) : (
                <Box sx={{ py: 4 }}>
                  {getFileIcon(previewFile)}
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Preview not available for this file type
                  </Typography>
                  <Button
                    variant="contained"
                    href={getFullUrl(previewFile.url)}
                    target="_blank"
                    sx={{ mt: 2, bgcolor: '#0B5FA5' }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="body2" color="textSecondary">
                  Name: {previewFile.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Size: {getFileSize(previewFile.size)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Type: {previewFile.mimetype || previewFile.type || 'Unknown'}
                </Typography>
                {previewFile.url && (
                  <Typography variant="body2" color="textSecondary" sx={{ wordBreak: 'break-all' }}>
                    URL: {getFullUrl(previewFile.url)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreviewDialog(false)}>Close</Button>
          {previewFile?.url && (
            <Button 
              variant="contained" 
              href={getFullUrl(previewFile.url)} 
              target="_blank"
              sx={{ bgcolor: '#0B5FA5' }}
            >
              Open in New Tab
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FileUpload