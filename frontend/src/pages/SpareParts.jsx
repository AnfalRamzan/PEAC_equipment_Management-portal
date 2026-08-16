// src/pages/SpareParts.jsx
// ✅ COMPLETE FIXED VERSION - Hospital and Equipment names display correctly

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
  Cancel,
  TimerOff,
  FileDownload,
  MedicalServices,
  ErrorOutline,
  Schedule,
  LocalHospital,
  Business,
} from '@mui/icons-material'
import { sparePartService, equipmentService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'
import api from '../api/axios'
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

@keyframes gradientShine {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`

// ============================================================
// ✅ HELPER: Get Status Based on Quantity
// ============================================================
const getStatus = (quantity, minimumStockLevel) => {
  const minLevel = minimumStockLevel || 5
  if (quantity <= 0) {
    return { label: 'Out of Stock', color: colors.error, icon: <Cancel sx={{ fontSize: 14 }} /> }
  } else if (quantity <= minLevel) {
    return { label: 'Low Stock', color: colors.warning, icon: <WarningIcon sx={{ fontSize: 14 }} /> }
  } else {
    return { label: 'In Stock', color: colors.success, icon: <CheckCircle sx={{ fontSize: 14 }} /> }
  }
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

// ✅ PKR CURRENCY FORMATTER
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
  
  // ✅ HOSPITAL_ADMIN cannot access
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Spare Parts Inventory." />
  }
  
  // ✅ Everyone can view and add, only Super Admin can edit/delete
  const canView = true
  const canAdd = true
  const canEdit = user?.role === 'SUPER_ADMIN'
  const canDelete = user?.role === 'SUPER_ADMIN'

  const [spareParts, setSpareParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingPart, setEditingPart] = useState(null)
  const [viewingPart, setViewingPart] = useState(null)
  const [viewTabValue, setViewTabValue] = useState(0)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  const [filters, setFilters] = useState({
    hospital_name: '',
    equipment_name: '',
    status: '',
  })
  
  const [formData, setFormData] = useState({
    part_name: '',
    part_number: '',
    quantity: 1,
    unit_cost: '',
    total_cost: '',
    hospital_name: '',
    equipment_name: '',
    installation_notes: '',
    image_url: '',
    minimum_stock_level: 5
  })

  useEffect(() => {
    fetchSpareParts()
  }, [])

  // ✅ FETCH SPARE PARTS - COMPLETE FIXED VERSION
  const fetchSpareParts = async () => {
    setLoading(true)
    try {
      const response = await sparePartService.getAll()
      console.log('📦 RAW API Response:', response)
      console.log('📦 Response data:', response.data)
      
      // ✅ Extract parts from response
      let parts = []
      if (response.data && response.data.spareParts) {
        parts = response.data.spareParts
      } else if (response.data && response.data.data) {
        parts = response.data.data
      } else if (Array.isArray(response.data)) {
        parts = response.data
      } else {
        parts = []
      }
      
      console.log('📊 Extracted parts:', parts)
      
      // ✅ Ensure hospital_name and equipment_name are properly set
      parts = parts.map(part => ({
        ...part,
        hospital_name: part.hospital_name || 'N/A',
        equipment_name: part.equipment_name || 'N/A'
      }))
      
      console.log('✅ Processed parts with names:', parts.map(p => ({
        id: p.id,
        part_name: p.part_name,
        hospital_name: p.hospital_name,
        equipment_name: p.equipment_name
      })))
      
      // ✅ Fetch downtime for each part
      const partsWithDowntime = await Promise.all(parts.map(async (part) => {
        try {
          const downtimeRes = await api.get(`/spare-parts/${part.id}/downtime`).catch(() => ({ data: {} }))
          return {
            ...part,
            times_out_of_stock: downtimeRes.data?.times_out_of_stock || 0,
            first_out_of_stock: downtimeRes.data?.first_out_of_stock || null,
            total_downtime_days: downtimeRes.data?.total_downtime_days || 0,
            last_out_of_stock: downtimeRes.data?.last_out_of_stock || null
          }
        } catch {
          return {
            ...part,
            times_out_of_stock: 0,
            first_out_of_stock: null,
            total_downtime_days: 0,
            last_out_of_stock: null
          }
        }
      }))
      
      setSpareParts(partsWithDowntime)
      console.log('✅ Final spareParts state:', partsWithDowntime.length, 'parts')
      
    } catch (error) {
      console.error('❌ Fetch spare parts error:', error)
      toast.error('Failed to fetch spare parts')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Status-based calculations
  const lowStockItems = spareParts.filter(p => p.quantity <= (p.minimum_stock_level || 5) && p.quantity > 0)
  const outOfStockItems = spareParts.filter(p => p.quantity <= 0)
  const inStockItems = spareParts.filter(p => p.quantity > (p.minimum_stock_level || 5))
  const totalDowntimeDays = spareParts.reduce((sum, p) => sum + (p.total_downtime_days || 0), 0)

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToCSV = () => {
    try {
      const headers = ['Hospital', 'Equipment', 'Part Name', 'Part Number', 'Quantity', 'Status', 'Unit Cost', 'Total Cost']
      const rows = filteredParts.map(p => [
        p.hospital_name || '',
        p.equipment_name || '',
        p.part_name || '',
        p.part_number || '',
        p.quantity || 0,
        getStatus(p.quantity, p.minimum_stock_level).label,
        p.unit_cost || 0,
        p.total_cost || 0
      ])
      let csv = headers.join(',') + '\n'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spare_parts_${new Date().toISOString().split('T')[0]}.csv`
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
      const data = filteredParts.map(p => ({
        'Hospital': p.hospital_name || '',
        'Equipment': p.equipment_name || '',
        'Part Name': p.part_name || '',
        'Part Number': p.part_number || '',
        'Quantity': p.quantity || 0,
        'Status': getStatus(p.quantity, p.minimum_stock_level).label,
        'Unit Cost': p.unit_cost || 0,
        'Total Cost': p.total_cost || 0
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Spare Parts')
      XLSX.writeFile(wb, `spare_parts_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Spare Parts Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Parts: ${filteredParts.length}`, 14, 34)
      
      const tableData = filteredParts.map(p => [
        p.hospital_name || '',
        p.equipment_name || '',
        p.part_name || '',
        p.part_number || '',
        p.quantity || 0,
        getStatus(p.quantity, p.minimum_stock_level).label,
        formatPKR(p.unit_cost)
      ])
      autoTable(doc, {
        head: [['Hospital', 'Equipment', 'Part Name', 'Part Number', 'Qty', 'Status', 'Unit Cost']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`spare_parts_${new Date().toISOString().split('T')[0]}.pdf`)
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
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ hospital_name: '', equipment_name: '', status: '' })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handleTabChange = (event, newValue) => {
    setViewTabValue(newValue)
  }

  const getAllAttachments = (part) => {
    const all = []
    if (part.image_url) {
      all.push(part.image_url)
    }
    return all
  }

  const handleOpenDialog = (part = null) => {
    if (part && !canEdit) {
      toast.error('Only Super Admin can edit spare parts')
      return
    }
    
    if (part) {
      setEditingPart(part)
      setFormData({
        part_name: part.part_name || '',
        part_number: part.part_number || '',
        quantity: part.quantity || 1,
        unit_cost: part.unit_cost || '',
        total_cost: part.total_cost || '',
        hospital_name: part.hospital_name || '',
        equipment_name: part.equipment_name || '',
        installation_notes: part.installation_notes || '',
        image_url: part.image_url || '',
        minimum_stock_level: part.minimum_stock_level || 5
      })
    } else {
      setEditingPart(null)
      setFormData({
        part_name: '',
        part_number: '',
        quantity: 1,
        unit_cost: '',
        total_cost: '',
        hospital_name: '',
        equipment_name: '',
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

  const handleSubmit = async () => {
    try {
      if (!formData.part_name || formData.part_name.trim() === '') {
        toast.error('Part name is required')
        return
      }

      if (!formData.hospital_name || formData.hospital_name.trim() === '') {
        toast.error('Hospital name is required')
        return
      }

      if (!formData.equipment_name || formData.equipment_name.trim() === '') {
        toast.error('Equipment name is required')
        return
      }

      const submitData = {
        part_name: formData.part_name.trim(),
        part_number: formData.part_number || null,
        quantity: parseInt(formData.quantity) || 1,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        total_cost: parseFloat(formData.total_cost) || 0,
        hospital_name: formData.hospital_name.trim(),
        equipment_name: formData.equipment_name.trim(),
        installation_notes: formData.installation_notes || null,
        image_url: formData.image_url || null,
        minimum_stock_level: parseInt(formData.minimum_stock_level) || 5
      }

      if (editingPart) {
        if (!canEdit) {
          toast.error('Only Super Admin can edit spare parts')
          return
        }
        await sparePartService.update(editingPart.id, submitData)
        toast.success('Spare part updated successfully')
      } else {
        await sparePartService.create(submitData)
        toast.success('Spare part added successfully')
      }
      
      fetchSpareParts()
      handleCloseDialog()
      
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
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

  const filteredParts = spareParts.filter(part => {
    const matchesSearch = part.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (part.hospital_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (part.equipment_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesHospital = !filters.hospital_name || (part.hospital_name || '').toLowerCase().includes(filters.hospital_name.toLowerCase())
    const matchesEquipment = !filters.equipment_name || (part.equipment_name || '').toLowerCase().includes(filters.equipment_name.toLowerCase())
    const matchesStatus = !filters.status || getStatus(part.quantity, part.minimum_stock_level).label === filters.status
    return matchesSearch && matchesHospital && matchesEquipment && matchesStatus
  })

  // ✅ Stats Cards
  const statsCards = [
    {
      title: 'Total Parts',
      value: spareParts.length,
      icon: <Inventory />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'In Stock',
      value: inStockItems.length,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Low Stock',
      value: lowStockItems.length,
      icon: <WarningIcon />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Out of Stock',
      value: outOfStockItems.length,
      icon: <Cancel />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Downtime (Days)',
      value: totalDowntimeDays.toFixed(1),
      icon: <TimerOff />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
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
      borderRadius: 0,
      position: 'relative',
    }}>
      <style>{animationStyles}</style>

      {/* HEADER */}
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
            Spare Parts Inventory
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage spare parts inventory with equipment and hospital associations
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchSpareParts} 
            size="small"
            sx={{ 
              borderColor: colors.lightCyan,
              color: colors.lightCyan,
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
            }}
          >
            Refresh
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
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
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
            Add Spare Part
          </Button>
        </Box>
      </Box>

      {/* ALERTS */}
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
            <strong>{outOfStockItems.length}</strong> spare part{outOfStockItems.length > 1 ? 's are' : ' is'} <strong>Out of Stock</strong>!
            Please restock immediately.
          </Typography>
        </Alert>
      )}

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
        >
          <Typography variant="body2">
            <strong>{lowStockItems.length}</strong> spare part{lowStockItems.length > 1 ? 's are' : ' is'} low in stock!
            Please consider restocking.
          </Typography>
        </Alert>
      )}

      {/* STATS CARDS */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={2.4} key={index}>
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

      {/* SEARCH */}
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
            placeholder="Search by part name, part number, equipment or hospital..."
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
            width: 300,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            borderRadius: 3,
          } 
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2 }}>
          Filter Spare Parts
        </Typography>

        <TextField
          fullWidth 
          size="small" 
          label="Hospital Name" 
          name="hospital_name"
          value={filters.hospital_name} 
          onChange={handleFilterChange}
          placeholder="Filter by hospital" 
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
          label="Equipment Name" 
          name="equipment_name"
          value={filters.equipment_name} 
          onChange={handleFilterChange}
          placeholder="Filter by equipment" 
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
            <MenuItem value="In Stock">In Stock</MenuItem>
            <MenuItem value="Low Stock">Low Stock</MenuItem>
            <MenuItem value="Out of Stock">Out of Stock</MenuItem>
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
        <MenuItem onClick={exportToCSV} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.08)' } }}>
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} /> 
          <Box>
            <Typography variant="body2" fontWeight={500}>CSV</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>Comma separated values</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={exportToExcel} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.08)' } }}>
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>Excel</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>.xlsx format</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={exportToPDF} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.08)' } }}>
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>PDF</Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>Print ready document</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* TABLE */}
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
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Part Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Part Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Qty</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Min Stock</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }}>Unit Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Inventory sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText }}>
                      No spare parts found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part, index) => {
                const status = getStatus(part.quantity, part.minimum_stock_level)
                const isLowStock = part.quantity <= (part.minimum_stock_level || 5)
                
                // ✅ DEBUG LOG - Check what's being rendered
                console.log(`🔍 Rendering part ${index}:`, {
                  id: part.id,
                  part_name: part.part_name,
                  hospital_name: part.hospital_name,
                  equipment_name: part.equipment_name
                })
                
                return (
                  <TableRow 
                    key={part.id} 
                    hover 
                    sx={{ 
                      bgcolor: isLowStock ? (part.quantity <= 0 ? `${colors.error}08` : `${colors.warning}08`) : 'inherit',
                      transition: 'all 0.2s ease',
                      animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                      '&:hover': {
                        backgroundColor: isLowStock ? (part.quantity <= 0 ? `${colors.error}15` : `${colors.warning}15`) : 'rgba(103, 232, 249, 0.04)',
                      },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell sx={{ color: colors.darkNavy, fontWeight: 500 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalHospital sx={{ fontSize: 14, color: colors.lightCyanDark }} />
                        {part.hospital_name || 'N/A'}
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ color: colors.darkNavy, fontWeight: 500 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MedicalServices sx={{ fontSize: 14, color: colors.lightCyanDark }} />
                        {part.equipment_name || 'N/A'}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                        {part.part_name}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ color: colors.lightText }}>
                      {part.part_number || '-'}
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={part.quantity} 
                        size="small" 
                        sx={{
                          bgcolor: part.quantity <= 0 ? colors.error : 
                                   part.quantity <= (part.minimum_stock_level || 5) ? colors.warning : colors.success,
                          color: 'white',
                          fontWeight: 600,
                          height: 26,
                          fontSize: '11px',
                          borderRadius: 2,
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={part.minimum_stock_level || 5} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderColor: colors.borderColor, 
                          color: colors.lightText,
                          height: 26,
                          borderRadius: 2,
                          fontSize: '11px',
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={status.label} 
                        size="small"
                        icon={status.icon}
                        sx={{
                          bgcolor: status.color,
                          color: 'white',
                          fontWeight: 600,
                          height: 26,
                          fontSize: '11px',
                          borderRadius: 2,
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </TableCell>
                    
                    <TableCell sx={{ color: colors.darkNavy }}>
                      {formatPKR(part.unit_cost)}
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
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

      {/* VIEW DIALOG */}
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
            maxHeight: '90vh',
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
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Inventory sx={{ fontSize: 28 }} />
              Spare Part Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 0 }}>
          {viewingPart && (
            <Box>
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
                    fontSize: '14px',
                    color: colors.lightText,
                    '&.Mui-selected': {
                      color: colors.darkNavy,
                      fontWeight: 600,
                    },
                    '&:hover': {
                      color: colors.lightCyanDark,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    bgcolor: colors.lightCyan,
                  }
                }}
              >
                <Tab label="Details" />
                <Tab 
                  label={`Attachments (${getAllAttachments(viewingPart).length})`} 
                  disabled={getAllAttachments(viewingPart).length === 0}
                />
              </Tabs>

              {viewTabValue === 0 && (
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        <LocalHospital sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        Hospital
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.hospital_name || '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        <MedicalServices sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        Equipment
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.equipment_name || '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        Part Name
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                        {viewingPart.part_name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        Part Number
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.part_number || '-'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        Status
                      </Typography>
                      <Chip 
                        label={getStatus(viewingPart.quantity, viewingPart.minimum_stock_level).label}
                        size="small"
                        sx={{
                          bgcolor: getStatus(viewingPart.quantity, viewingPart.minimum_stock_level).color,
                          color: 'white',
                          fontWeight: 600,
                          height: 26,
                          borderRadius: 2,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        Quantity
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.quantity}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        Minimum Stock Level
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {viewingPart.minimum_stock_level || 5}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        Unit Cost
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {formatPKR(viewingPart.unit_cost)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                        Total Cost
                      </Typography>
                      <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                        {formatPKR(viewingPart.total_cost)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ color: colors.lightText, mb: 1, fontWeight: 600 }}>
                        <TimerOff sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                        Downtime History
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                              Times Out of Stock
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                              {viewingPart.times_out_of_stock || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                              First Out of Stock
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                              {viewingPart.first_out_of_stock ? new Date(viewingPart.first_out_of_stock).toLocaleString() : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                              Last Out of Stock
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy }}>
                              {viewingPart.last_out_of_stock ? new Date(viewingPart.last_out_of_stock).toLocaleString() : '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Typography variant="caption" sx={{ color: colors.lightText, display: 'block' }}>
                              Total Downtime
                            </Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ color: colors.error }}>
                              {Number(viewingPart.total_downtime_days || 0).toFixed(1)} days
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {viewingPart.installation_notes && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontWeight: 600 }}>
                          Installation Notes
                        </Typography>
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: colors.mainBg, 
                          borderRadius: 2,
                          border: `1px solid ${colors.borderColor}`
                        }}>
                          <Typography variant="body2" sx={{ color: colors.darkNavy }}>
                            {viewingPart.installation_notes}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy }} gutterBottom>
                        <History sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                        Stock Movement History
                      </Typography>
                      {viewingPart.movements && viewingPart.movements.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderColor: colors.borderColor, borderRadius: 2 }}>
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
                                        fontWeight: 600,
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

              {viewTabValue === 1 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.darkNavy, mb: 2 }}>
                    Attachments ({getAllAttachments(viewingPart).length})
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                    Click on any file to preview it.
                  </Typography>
                  
                  <AttachmentGrid 
                    attachments={getAllAttachments(viewingPart)}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseView} 
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
        </DialogActions>
      </Dialog>

      {/* ADD/EDIT DIALOG */}
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
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {editingPart ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
              {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Hospital Name *"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleFormChange}
                placeholder="Enter hospital name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Equipment Name *"
                name="equipment_name"
                value={formData.equipment_name}
                onChange={handleFormChange}
                placeholder="Enter equipment name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
                  }
                }}
              />
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem',
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem',
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem',
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '0.75rem',
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.9rem',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '0.9rem',
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
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 0.5 }}>
                  <strong>Status Preview:</strong> {getStatus(parseInt(formData.quantity) || 0, parseInt(formData.minimum_stock_level) || 5).label}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
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
            {editingPart ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SpareParts