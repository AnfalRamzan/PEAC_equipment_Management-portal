// src/pages/SpareParts.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar
// ✅ WITH ATTACHMENT TAB VIEW + PREVIEW

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
  Chip,
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
  Avatar,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  Dialog as PreviewDialog,
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
  Image,
  Inventory,
  Refresh,
  CheckCircle,
  Warning as WarningIcon,
  ShoppingCart,
  Build,
  History,
  Remove,
  Add as AddIcon,
  Engineering as EngineeringIcon,
  AdminPanelSettings,
  ZoomIn,
  OpenInNew,
  VideoLibrary,
  Description,
  AttachFile,
  InsertDriveFile,
} from '@mui/icons-material'
import { sparePartService, repairService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'

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

// ==================== HELPER FUNCTIONS ====================
const getFullImageUrl = (url) => {
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

// ============================================================
// ✅ COMPONENT: Attachment Grid with Preview
// ============================================================
const AttachmentGrid = ({ attachments, onFileClick }) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState('')

  if (!attachments || attachments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, bgcolor: colors.mainBg, borderRadius: 2 }}>
        <InsertDriveFile sx={{ fontSize: 48, color: colors.lightText, opacity: 0.3 }} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          No attachments
        </Typography>
      </Box>
    )
  }

  const handlePreview = (url) => {
    const fullUrl = getFullImageUrl(url)
    const isImg = isImageFile(url)
    const isVideo = isVideoFile(url)
    
    setPreviewUrl(fullUrl)
    setPreviewType(isImg ? 'image' : isVideo ? 'video' : 'document')
    setPreviewOpen(true)
  }

  return (
    <Box>
      <ImageList cols={4} gap={12} sx={{ mb: 0 }}>
        {attachments.map((url, index) => {
          const isImg = isImageFile(url)
          const isVideo = isVideoFile(url)
          const fileName = getFileName(url)
          const fullUrl = getFullImageUrl(url)

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
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
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
                    height: 160,
                    objectFit: 'cover',
                    bgcolor: colors.mainBg,
                  }}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160"%3E%3Crect width="200" height="160" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'
                  }}
                />
              ) : isVideo ? (
                <Box sx={{ 
                  height: 160, 
                  bgcolor: colors.darkNavy,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <VideoLibrary sx={{ fontSize: 48, color: colors.lightCyan, opacity: 0.7 }} />
                  <Typography variant="caption" sx={{ color: colors.textLight, mt: 1, px: 1 }}>
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
                    width: 44,
                    height: 44,
                  }}>
                    <OpenInNew sx={{ color: 'white', fontSize: 22 }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  height: 160, 
                  bgcolor: colors.mainBg,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                }}>
                  <Description sx={{ fontSize: 48, color: colors.lightText, opacity: 0.6 }} />
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
              autoPlay
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

const SpareParts = () => {
  const navigate = useNavigate()
  
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Spare Parts Inventory." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  const canCreate = isEngineer || isSuperAdmin
  const canEdit = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin
  const canUseInRepair = isEngineer

  const [spareParts, setSpareParts] = useState([])
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingPart, setEditingPart] = useState(null)
  const [viewingPart, setViewingPart] = useState(null)
  const [viewTabValue, setViewTabValue] = useState(0)
  const [filters, setFilters] = useState({
    brand: '',
    compatible_equipment: ''
  })
  const [formData, setFormData] = useState({
    repair_id: '',
    part_name: '',
    part_number: '',
    brand: '',
    manufacturer: '',
    quantity: 1,
    unit_cost: '',
    total_cost: '',
    compatible_equipment: '',
    installation_notes: '',
    image_url: '',
    minimum_stock_level: 5
  })

  useEffect(() => {
    fetchSpareParts()
    fetchRepairs()
  }, [])

  const fetchSpareParts = async () => {
    setLoading(true)
    try {
      const response = await sparePartService.getAll()
      setSpareParts(response.data.spareParts || [])
    } catch (error) {
      console.error('Fetch spare parts error:', error)
      toast.error('Failed to fetch spare parts')
    } finally {
      setLoading(false)
    }
  }

  const fetchRepairs = async () => {
    try {
      const response = await repairService.getAll()
      setRepairs(response.data.repairs || [])
    } catch (error) {
      console.error('Failed to fetch repairs:', error)
    }
  }

  const lowStockItems = spareParts.filter(p => p.quantity <= (p.minimum_stock_level || 5))
  const outOfStockItems = spareParts.filter(p => p.quantity === 0)

  const handleTabChange = (event, newValue) => {
    setViewTabValue(newValue)
  }

  // ✅ Get all attachments from a spare part
  const getAllAttachments = (part) => {
    const all = []
    if (part.image_url) {
      all.push(part.image_url)
    }
    // Add any other attachment fields here if they exist
    // if (part.attachments) { ... }
    // if (part.documents) { ... }
    return all
  }

  const handleOpenDialog = (part = null) => {
    if (part) {
      setEditingPart(part)
      setFormData({
        repair_id: part.repair_id || '',
        part_name: part.part_name || '',
        part_number: part.part_number || '',
        brand: part.brand || '',
        manufacturer: part.manufacturer || '',
        quantity: part.quantity || 1,
        unit_cost: part.unit_cost || '',
        total_cost: part.total_cost || '',
        compatible_equipment: part.compatible_equipment || '',
        installation_notes: part.installation_notes || '',
        image_url: part.image_url || '',
        minimum_stock_level: part.minimum_stock_level || 5
      })
    } else {
      setEditingPart(null)
      setFormData({
        repair_id: '',
        part_name: '',
        part_number: '',
        brand: '',
        manufacturer: '',
        quantity: 1,
        unit_cost: '',
        total_cost: '',
        compatible_equipment: '',
        installation_notes: '',
        image_url: '',
        minimum_stock_level: 5
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingPart(null)
  }

  const handleView = (part) => {
    const partWithMovements = {
      ...part,
      movements: [
        { id: 1, created_at: '2024-01-15T10:30:00', type: 'IN', quantity: 10, reference_type: 'purchase', reference_id: 1 },
        { id: 2, created_at: '2024-02-20T14:45:00', type: 'OUT', quantity: 3, reference_type: 'repair', reference_id: 5 },
        { id: 3, created_at: '2024-03-10T09:15:00', type: 'IN', quantity: 5, reference_type: 'purchase', reference_id: 2 },
        { id: 4, created_at: '2024-04-05T16:20:00', type: 'OUT', quantity: 2, reference_type: 'repair', reference_id: 8 }
      ]
    }
    setViewingPart(partWithMovements)
    setViewTabValue(0)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingPart(null)
    setViewTabValue(0)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'quantity' || name === 'minimum_stock_level') {
      const numValue = parseInt(value)
      if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
      return
    }
    
    if (name === 'unit_cost') {
      const numValue = parseFloat(value)
      if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  useEffect(() => {
    const quantity = parseInt(formData.quantity) || 0
    const unitCost = parseFloat(formData.unit_cost) || 0
    const total = quantity * unitCost
    const currentTotal = parseFloat(formData.total_cost) || 0
    
    if (total !== currentTotal) {
      setFormData(prev => ({
        ...prev,
        total_cost: total.toString()
      }))
    }
  }, [formData.quantity, formData.unit_cost])

  const formatPKR = (value) => {
    if (!value || value === '0' || value === '0.00') return 'Rs. 0'
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return 'Rs. 0'
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue).replace('PKR', 'Rs.')
  }

  const handleSubmit = async () => {
    try {
      if (!formData.part_name || formData.part_name.trim() === '') {
        toast.error('Part name is required')
        return
      }

      const submitData = {
        repair_id: formData.repair_id ? parseInt(formData.repair_id) : null,
        part_name: formData.part_name.trim(),
        part_number: formData.part_number || null,
        brand: formData.brand || null,
        manufacturer: formData.manufacturer || null,
        quantity: parseInt(formData.quantity) || 1,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        total_cost: parseFloat(formData.total_cost) || 0,
        compatible_equipment: formData.compatible_equipment || null,
        installation_notes: formData.installation_notes || null,
        image_url: formData.image_url || null,
        minimum_stock_level: parseInt(formData.minimum_stock_level) || 5
      }

      console.log('📤 Submitting spare part data:', submitData)

      let response
      if (editingPart) {
        response = await sparePartService.update(editingPart.id, submitData)
        toast.success('✅ Spare part updated successfully')
      } else {
        response = await sparePartService.create(submitData)
        toast.success('✅ Spare part added successfully')
      }

      console.log('📥 Response:', response.data)
      
      fetchSpareParts()
      handleCloseDialog()
      
    } catch (error) {
      console.error('❌ Submit error:', error)
      console.error('❌ Error response:', error.response?.data)
      
      const errorMsg = error.response?.data?.message || 'Operation failed'
      toast.error(errorMsg)
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete spare parts')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this spare part?')) {
      try {
        await sparePartService.delete(id)
        toast.success('Spare part deleted successfully')
        fetchSpareParts()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Failed to delete spare part')
      }
    }
  }

  const handleUseInRepair = (part) => {
    navigate(`/repairs?part_id=${part.id}`)
    toast.info(`Selected ${part.part_name} for repair`)
  }

  const filteredParts = spareParts.filter(part => {
    const matchesSearch = part.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          part.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBrand = !filters.brand || part.brand?.toLowerCase().includes(filters.brand.toLowerCase())
    return matchesSearch && matchesBrand
  })

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            Spare Parts Inventory
          </Typography>
          <Chip 
            icon={<Inventory sx={{ fontSize: 16 }} />}
            label={`${spareParts.length} Parts`}
            size="small"
            sx={{ 
              bgcolor: colors.darkNavy, 
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-icon': { color: colors.lightCyan }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSpareParts}
            size="small"
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkNavy,
              '&:hover': { 
                borderColor: colors.lightCyan, 
                color: colors.lightCyanDark,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              borderRadius: 2
            }}
          >
            Refresh
          </Button>
          {canCreate && (
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
              Add Spare Part
            </Button>
          )}
        </Box>
      </Box>

      {/* LOW STOCK ALERT */}
      {lowStockItems.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            border: `1px solid ${colors.warning}33`,
            '& .MuiAlert-icon': { color: colors.warning }
          }}
          icon={<WarningIcon />}
          action={
            <Button 
              size="small" 
              variant="outlined"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/procurement')}
              sx={{ 
                mt: 0.5,
                borderColor: colors.warning,
                color: colors.warning,
                '&:hover': { 
                  borderColor: colors.lightCyan, 
                  color: colors.lightCyanDark,
                  backgroundColor: 'rgba(103, 232, 249, 0.04)'
                }
              }}
            >
              Create Purchase Request
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>{lowStockItems.length}</strong> spare part{lowStockItems.length > 1 ? 's are' : ' is'} low in stock!
            {lowStockItems.length > 0 && lowStockItems.length <= 5 && (
              <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.8rem' }}>
                <strong>Items:</strong> {lowStockItems.map(p => p.part_name).join(', ')}
              </Box>
            )}
            {lowStockItems.length > 5 && (
              <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.8rem' }}>
                <strong>Plus {lowStockItems.length - 5} more items...</strong>
              </Box>
            )}
          </Typography>
        </Alert>
      )}

      {/* OUT OF STOCK ALERT */}
      {outOfStockItems.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            border: `1px solid ${colors.error}33`,
            '& .MuiAlert-icon': { color: colors.error }
          }}
          icon={<WarningIcon />}
        >
          <Typography variant="body2">
            <strong>{outOfStockItems.length}</strong> spare part{outOfStockItems.length > 1 ? 's are' : ' is'} out of stock!
            Please order immediately.
          </Typography>
        </Alert>
      )}

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
                {spareParts.length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Total Parts</Typography>
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
                {spareParts.filter(p => p.quantity > (p.minimum_stock_level || 5)).length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>In Stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.error}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.error}08`,
            '&:hover': {
              borderColor: colors.error,
              boxShadow: `0 4px 20px rgba(239, 68, 68, 0.15)`
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.error, fontWeight: 700 }}>
                {lowStockItems.length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Low Stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.lightCyan}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.lightCyan}08`,
            '&:hover': {
              borderColor: colors.lightCyan,
              boxShadow: `0 4px 20px ${colors.lightCyanGlow}`
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.lightCyanDark, fontWeight: 700 }}>
                {new Set(spareParts.map(p => p.brand)).size}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Brands</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filters */}
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
            placeholder="Search by name, part number or brand..."
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
          <TextField
            size="small"
            label="Brand"
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            sx={{ minWidth: 150 }}
            InputProps={{
              sx: {
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }
            }}
          />
          <Button 
            variant="outlined" 
            startIcon={<Download />} 
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
            Export
          </Button>
        </Box>
      </Paper>

      {/* Table */}
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
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Part Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Part Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Brand</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Quantity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Min Stock</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Unit Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Compatible Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Image</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body1" sx={{ py: 4, color: colors.lightText }}>
                    No spare parts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => {
                const isLowStock = part.quantity <= (part.minimum_stock_level || 5)
                const imageUrl = getFullImageUrl(part.image_url)
                
                return (
                  <TableRow 
                    key={part.id} 
                    hover 
                    sx={{ 
                      bgcolor: isLowStock ? `${colors.warning}08` : 'inherit',
                      '&:hover': {
                        backgroundColor: isLowStock ? `${colors.warning}15` : 'rgba(103, 232, 249, 0.04)',
                      },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy }}>
                          {part.part_name}
                        </Typography>
                        {isLowStock && (
                          <Chip 
                            label="Low Stock" 
                            size="small" 
                            sx={{ 
                              bgcolor: colors.warning, 
                              color: 'white',
                              fontWeight: 500,
                              '& .MuiChip-icon': { color: 'white' }
                            }}
                            icon={<WarningIcon sx={{ fontSize: 14 }} />}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>{part.part_number || '-'}</TableCell>
                    <TableCell sx={{ color: colors.lightText }}>{part.brand || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={part.quantity} 
                        size="small" 
                        sx={{
                          bgcolor: isLowStock ? colors.error : part.quantity < 10 ? colors.warning : colors.success,
                          color: 'white',
                          fontWeight: 500,
                          height: 22,
                          fontSize: '11px'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={part.minimum_stock_level || 5} 
                        size="small" 
                        variant="outlined"
                        sx={{ borderColor: colors.borderColor, color: colors.lightText }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: colors.darkNavy }}>{formatPKR(part.unit_cost)}</TableCell>
                    <TableCell sx={{ color: colors.darkNavy }}>{formatPKR(part.total_cost)}</TableCell>
                    <TableCell sx={{ color: colors.lightText }}>{part.compatible_equipment || '-'}</TableCell>
                    <TableCell>
                      {part.image_url ? (
                        <Tooltip title="View Image">
                          <Avatar 
                            src={getFullImageUrl(part.image_url)} 
                            alt={part.part_name}
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: 1,
                              border: `1px solid ${colors.borderColor}`,
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                transition: 'transform 0.2s',
                                borderColor: colors.lightCyan,
                              }
                            }}
                            onClick={() => window.open(getFullImageUrl(part.image_url), '_blank')}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip 
                          icon={<Image sx={{ fontSize: 14 }} />}
                          label="No Image" 
                          size="small"
                          sx={{ 
                            bgcolor: colors.mainBg, 
                            color: colors.lightText,
                            height: 22,
                            fontSize: '10px'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(part)}
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
                        
                        {canUseInRepair && (
                          <Tooltip title="Use in Repair">
                            <IconButton 
                              size="small" 
                              onClick={() => handleUseInRepair(part)}
                              sx={{ 
                                color: colors.darkNavy, 
                                '&:hover': { 
                                  color: colors.lightCyanDark,
                                  backgroundColor: 'rgba(103, 232, 249, 0.08)'
                                } 
                              }}
                            >
                              <Build fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canEdit && (
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(part)}
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
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDelete(part.id)}
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

      {/* ============================================================
          ✅ VIEW SPARE PART DIALOG WITH TABS
          ============================================================ */}
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
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Spare Part Details
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {viewingPart?.part_name || 'N/A'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 0 }}>
          {viewingPart && (
            <Box>
              {/* Tabs */}
              <Tabs 
                value={viewTabValue} 
                onChange={handleTabChange}
                sx={{
                  borderBottom: `1px solid ${colors.borderColor}`,
                  px: 2,
                  pt: 1,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    color: colors.lightText,
                    '&.Mui-selected': {
                      color: colors.darkNavy,
                    },
                    '&:hover': {
                      color: colors.lightCyanDark,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    bgcolor: colors.lightCyanDark,
                  }
                }}
              >
                <Tab label="Details" />
                <Tab 
                  label={`Attachments (${getAllAttachments(viewingPart).length})`} 
                  disabled={getAllAttachments(viewingPart).length === 0}
                />
              </Tabs>

              {/* Tab 0: Details */}
              {viewTabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Part Name</Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                        {viewingPart.part_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Part Number</Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.part_number || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Brand</Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.brand || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Manufacturer</Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.manufacturer || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Quantity</Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.quantity}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Minimum Stock Level</Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.minimum_stock_level || 5}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Unit Cost</Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {formatPKR(viewingPart.unit_cost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Total Cost</Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: colors.lightCyanDark }}>
                        {formatPKR(viewingPart.total_cost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Compatible Equipment</Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.compatible_equipment || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: colors.lightText }}>Status</Typography>
                      <Chip 
                        label={viewingPart.quantity <= (viewingPart.minimum_stock_level || 5) ? 'Low Stock' : 'In Stock'} 
                        size="small"
                        sx={{
                          bgcolor: viewingPart.quantity <= (viewingPart.minimum_stock_level || 5) ? colors.warning : colors.success,
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    </Grid>

                    {viewingPart.installation_notes && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: colors.lightText }}>Installation Notes</Typography>
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: colors.mainBg, 
                          borderRadius: 1,
                          border: `1px solid ${colors.borderColor}`
                        }}>
                          <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                            {viewingPart.installation_notes}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    
                    {viewingPart.repair_id && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ color: colors.lightText }}>Associated Repair</Typography>
                        <Typography variant="body1" sx={{ color: colors.darkNavy }}>Repair #{viewingPart.repair_id}</Typography>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2, borderColor: colors.borderColor }} />
                      <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                        <History sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                        Stock Movement History
                      </Typography>
                      {viewingPart.movements && viewingPart.movements.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderColor: colors.borderColor }}>
                          <Table size="small">
                            <TableHead sx={{ bgcolor: colors.mainBg }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Action</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Quantity</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Reference</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {viewingPart.movements.map((mov, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell sx={{ color: colors.darkNavy }}>
                                    {new Date(mov.created_at).toLocaleString()}
                                  </TableCell>
                                  <TableCell sx={{ color: colors.darkNavy }}>
                                    {mov.type === 'IN' ? 'Stock In' : 'Stock Out'}
                                  </TableCell>
                                  <TableCell>
                                    <Typography 
                                      sx={{ 
                                        color: mov.type === 'IN' ? colors.success : colors.error,
                                        fontWeight: 600
                                      }}
                                    >
                                      {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ color: colors.darkNavy }}>
                                    {mov.reference_type === 'purchase' ? `PO #${mov.reference_id}` : 
                                     mov.reference_type === 'repair' ? `Repair #${mov.reference_id}` : 
                                     mov.reference_type || 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" sx={{ color: colors.lightText, py: 2 }}>
                          No stock movements recorded
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 1: Attachments */}
              {viewTabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2 }}>
                    Attachments ({getAllAttachments(viewingPart).length})
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                    Click on any file to preview it. Images and videos will open in a preview dialog.
                  </Typography>
                  
                  <AttachmentGrid 
                    attachments={getAllAttachments(viewingPart)}
                  />
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canEdit && viewingPart && (
              <Button
                variant="outlined"
                onClick={() => {
                  setOpenViewDialog(false)
                  handleOpenDialog(viewingPart)
                }}
                sx={{ 
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
                Edit
              </Button>
            )}
            {canUseInRepair && viewingPart && (
              <Button
                variant="contained"
                onClick={() => {
                  setOpenViewDialog(false)
                  handleUseInRepair(viewingPart)
                }}
                sx={{ 
                  bgcolor: colors.darkNavy, 
                  '&:hover': { 
                    bgcolor: colors.darkNavyHover,
                    boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
                  },
                  textTransform: 'none',
                  borderRadius: 2,
                }}
                startIcon={<Build />}
              >
                Use in Repair
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog - DARK NAVY + CYAN */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Associated Repair</InputLabel>
                <Select
                  name="repair_id"
                  value={formData.repair_id}
                  onChange={handleFormChange}
                  label="Associated Repair"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="">None (General Stock)</MenuItem>
                  {repairs.map(repair => (
                    <MenuItem key={repair.id} value={repair.id}>
                      Repair #{repair.id} - {repair.equipment_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Part Name *"
                name="part_name"
                value={formData.part_name}
                onChange={handleFormChange}
                placeholder="Enter part name"
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
                label="Part Number"
                name="part_number"
                value={formData.part_number}
                onChange={handleFormChange}
                placeholder="Enter part number"
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
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleFormChange}
                placeholder="Enter brand name"
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
                label="Manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleFormChange}
                placeholder="Enter manufacturer name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, step: 1 } }}
                helperText="Enter quantity (minimum 0)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Minimum Stock Level"
                name="minimum_stock_level"
                type="number"
                value={formData.minimum_stock_level}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, step: 1 } }}
                helperText="Alert when stock falls below this level"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit Cost (Rs.)"
                name="unit_cost"
                type="number"
                value={formData.unit_cost}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                  inputProps: { min: 0, step: 1 }
                }}
                helperText="Enter cost per unit"
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
                label="Total Cost (Rs.)"
                name="total_cost"
                value={formatPKR(formData.total_cost)}
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                }}
                helperText="Auto-calculated: Quantity × Unit Cost"
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: colors.mainBg,
                  },
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
                label="Compatible Equipment"
                name="compatible_equipment"
                value={formData.compatible_equipment}
                onChange={handleFormChange}
                placeholder="e.g., Ventilator, Patient Monitor, ECG Machine"
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
                label="Installation Notes"
                name="installation_notes"
                value={formData.installation_notes}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="Any special instructions for installation..."
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
                <Image sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                Spare Part Image
              </Typography>
              
              <FileUpload
                endpoint="/upload"
                accept="image/*"
                multiple={false}
                label="Click to upload spare part image"
                maxFiles={1}
                maxSize={10}
                showPreview={true}
                onUploadComplete={(files) => {
                  console.log('📸 Image uploaded:', files)
                  const file = files[0]
                  if (file) {
                    const imageUrl = file.url || file.fileUrl
                    setFormData(prev => ({
                      ...prev,
                      image_url: imageUrl
                    }))
                    toast.success('Image uploaded successfully')
                  }
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  setFormData(prev => ({
                    ...prev,
                    image_url: ''
                  }))
                  toast.info('Image removed')
                }}
                existingFiles={formData.image_url ? [{
                  url: formData.image_url,
                  name: formData.image_url.split('/').pop(),
                  type: 'image'
                }] : []}
              />
              
              {formData.image_url && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: colors.lightText }} gutterBottom display="block">
                    Current Image:
                  </Typography>
                  <Box
                    component="img"
                    src={getFullImageUrl(formData.image_url)}
                    alt="Spare Part"
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: `1px solid ${colors.borderColor}`
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: colors.mainBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: 2
              }}>
                <Typography variant="caption" sx={{ color: colors.lightText }}>
                  <strong>Calculation Preview:</strong> {formData.quantity || 0} × {formData.unit_cost || 0} = {formatPKR(formData.total_cost)}
                </Typography>
              </Paper>
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
            {editingPart ? 'Update Spare Part' : 'Add Spare Part'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SpareParts