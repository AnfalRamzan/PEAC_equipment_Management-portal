// src/pages/Repairs.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar
// ✅ WITH ATTACHMENT TAB VIEW + PREVIEW
// ✅ REMOVED: Root Cause, Corrective Action, Solution Description, Time Taken
// ✅ REMOVED: Time Recorded stats card
// ✅ REMOVED: Time column from table
// ✅ KEPT: Problem Analysis, Repair Procedure, Spare Parts, Remarks
// ✅ ADDED: Export functionality (Excel & PDF only, no CSV)
// ✅ FIXED: REMOVED error_log_id from form (auto-select error from page context)
// ✅ KEPT: engineer_name (user types manually)
// ✅ ADDED: Hospital column in main table
// ✅ ADDED: Hospital filter in filter menu

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  Alert,
  Divider,
  Tooltip,
  Card,
  CardContent,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Dialog as PreviewDialog,
  Fade,
  Grow,
  Menu,
} from '@mui/material'
import {
  Add,
  Search,
  Delete,
  Visibility,
  Close,
  Refresh,
  Engineering as EngineeringIcon,
  Image as ImageIcon,
  VideoLibrary,
  Description,
  InsertDriveFile,
  ZoomIn,
  OpenInNew,
  AttachFile,
  MedicalServices,
  LocalHospital,
  ErrorOutline,
  Build,
  CheckCircle,
  Warning,
  Download,
  FileDownload,
  FilterList,
} from '@mui/icons-material'
import { repairService, errorService, equipmentService, hospitalService } from '../api/services'
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
  bgGradientStart: '#F0F4F8',
  bgGradientEnd: '#E8EEF5',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
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

// ✅ Helper function for image URLs
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
        <AttachFile sx={{ fontSize: 48, color: colors.lightText, opacity: 0.3 }} />
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
      <ImageList cols={4} gap={12} sx={{ mb: 0 }}>
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

// ============================================================
// ✅ MAIN REPAIRS COMPONENT
// ============================================================
const Repairs = () => {
  const { user } = useSelector((state) => state.auth)
  const location = useLocation()
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Repairs." />
  }
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isEngineer = user?.role === 'ENGINEER'
  
  const canCreate = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin

  const [repairs, setRepairs] = useState([])
  const [errors, setErrors] = useState([])
  const [equipment, setEquipment] = useState([])
  const [hospitals, setHospitals] = useState([]) // ✅ ADDED: Hospitals state
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingRepair, setViewingRepair] = useState(null)
  const [viewTabValue, setViewTabValue] = useState(0)
  
  // ✅ Filter State
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filters, setFilters] = useState({
    hospital: '',
    equipment: '',
  })
  
  // ✅ Export Menu State
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  const [showSparePartsFields, setShowSparePartsFields] = useState(false)
  const [sparePartsList, setSparePartsList] = useState([])
  const [sparePartForm, setSparePartForm] = useState({
    part_name: '',
    part_number: '',
    brand: '',
    quantity: 1,
    unit_cost: '',
    total_cost: '',
    installation_notes: ''
  })

  const [uploadedFiles, setUploadedFiles] = useState([])

  // ✅ FIXED: REMOVED error_log_id from formData
  const [formData, setFormData] = useState({
    equipment_id: '',
    engineer_name: '',
    problem_analysis: '',
    repair_procedure: '',
    spare_part_used: 'No',
    remarks: '',
    repair_date: new Date().toISOString().slice(0, 16),
    attachments: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  // ✅ NEW: Auto-set equipment_id from location state or URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const equipmentId = params.get('equipment_id')
    
    if (equipmentId) {
      setFormData(prev => ({
        ...prev,
        equipment_id: equipmentId
      }))
    }
  }, [location])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [repairsRes, errorsRes, equipmentRes, hospitalsRes] = await Promise.all([
        repairService.getAll(),
        errorService.getAll(),
        equipmentService.getAll(),
        hospitalService.getAll() // ✅ ADDED: Fetch hospitals
      ])
      setRepairs(repairsRes.data.repairs || [])
      setErrors(errorsRes.data.errors || [])
      setEquipment(equipmentRes.data.equipment || [])
      setHospitals(hospitalsRes.data.hospitals || []) // ✅ ADDED: Set hospitals
    } catch (error) {
      console.error('❌ Fetch error:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
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
      hospital: '',
      equipment: '',
    })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  // ============================================================
  // ✅ EXPORT HANDLERS - Excel & PDF only (no CSV)
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToExcel = () => {
    try {
      const data = filteredRepairs.map(r => ({
        'Equipment': r.equipment_name || '',
        'Hospital': r.hospital_name || r.hospital?.name || '',
        'Engineer': r.engineer_name || '',
        'Problem Analysis': r.problem_analysis || r.root_cause || '',
        'Repair Procedure': r.repair_procedure || r.corrective_action || '',
        'Spare Parts Used': r.spare_part_used ? 'Yes' : 'No',
        'Remarks': r.remarks || '',
        'Repair Date': r.repair_date ? new Date(r.repair_date).toLocaleDateString() : 
                       r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Repairs')
      XLSX.writeFile(wb, `repairs_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Repairs Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Repairs: ${filteredRepairs.length}`, 14, 34)
      
      const tableData = filteredRepairs.map(r => [
        r.equipment_name || '',
        r.hospital_name || r.hospital?.name || '',
        r.engineer_name || '',
        (r.problem_analysis || r.root_cause || '').substring(0, 30),
        r.spare_part_used ? 'Yes' : 'No',
        r.repair_date ? new Date(r.repair_date).toLocaleDateString() : 
        r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
      ])
      autoTable(doc, {
        head: [['Equipment', 'Hospital', 'Engineer', 'Problem', 'Spare Used', 'Date']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`repairs_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const handleFileUploadComplete = (files) => {
    console.log('📸 Files uploaded:', files)
    
    const fileUrls = files.map(f => f.url || f.fileUrl).filter(Boolean)
    
    setUploadedFiles(prev => [...prev, ...files])
    
    setFormData(prev => {
      const existingUrls = prev.attachments ? prev.attachments.split(',') : []
      const allUrls = [...existingUrls, ...fileUrls]
      return {
        ...prev,
        attachments: allUrls.join(',')
      }
    })
    
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  const handleFileDelete = (file) => {
    setUploadedFiles(prev => prev.filter(f => f.url !== file.url))
    
    const currentFiles = formData.attachments?.split(',') || []
    const updatedFiles = currentFiles.filter(url => url !== file.url)
    setFormData(prev => ({
      ...prev,
      attachments: updatedFiles.join(',')
    }))
    
    toast.success('File removed')
  }

  const handleExistingFileDelete = (fileUrl) => {
    const currentFiles = formData.attachments?.split(',') || []
    const updatedFiles = currentFiles.filter(url => url !== fileUrl)
    setFormData(prev => ({
      ...prev,
      attachments: updatedFiles.join(',')
    }))
    toast.success('File removed')
  }

  // ✅ FIXED: REMOVED error_log_id from handleOpenDialog
  const handleOpenDialog = () => {
    if (!isEngineer && !isSuperAdmin) {
      toast.error('You do not have permission to create repairs')
      return
    }
    
    setFormData({
      equipment_id: '',
      engineer_name: '',
      problem_analysis: '',
      repair_procedure: '',
      spare_part_used: 'No',
      remarks: '',
      repair_date: new Date().toISOString().slice(0, 16),
      attachments: ''
    })
    setUploadedFiles([])
    setShowSparePartsFields(false)
    setSparePartsList([])
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setShowSparePartsFields(false)
    setSparePartsList([])
    setUploadedFiles([])
  }

  const handleView = (repair) => {
    setViewingRepair(repair)
    setViewTabValue(0)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingRepair(null)
    setViewTabValue(0)
  }

  const handleTabChange = (event, newValue) => {
    setViewTabValue(newValue)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'spare_part_used') {
      setShowSparePartsFields(value === 'Yes')
      if (value === 'No') {
        setSparePartsList([])
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSparePartChange = (e) => {
    const { name, value } = e.target
    setSparePartForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddSparePart = () => {
    if (!sparePartForm.part_name || sparePartForm.part_name.trim() === '') {
      toast.error('Please enter part name')
      return
    }

    const quantity = parseInt(sparePartForm.quantity) || 1
    const unitCost = parseFloat(sparePartForm.unit_cost) || 0
    const totalCost = quantity * unitCost

    const newPart = {
      id: Date.now(),
      part_name: sparePartForm.part_name.trim(),
      part_number: sparePartForm.part_number || '',
      brand: sparePartForm.brand || '',
      quantity: quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      installation_notes: sparePartForm.installation_notes || ''
    }

    setSparePartsList(prev => [...prev, newPart])
    setSparePartForm({
      part_name: '',
      part_number: '',
      brand: '',
      quantity: 1,
      unit_cost: '',
      total_cost: '',
      installation_notes: ''
    })
    toast.success('Spare part added')
  }

  const handleRemoveSparePart = (id) => {
    setSparePartsList(prev => prev.filter(p => p.id !== id))
    toast.info('Spare part removed')
  }

  // ✅ FIXED: REMOVED error_log_id from handleSubmit
  const handleSubmit = async () => {
    if (!isEngineer && !isSuperAdmin) {
      toast.error('You do not have permission to create repairs')
      return
    }
    
    try {
      if (!formData.equipment_id) {
        toast.error('Equipment is required')
        return
      }

      const payload = {
        equipment_id: parseInt(formData.equipment_id),
        engineer_name: formData.engineer_name || user?.full_name || '',
        problem_analysis: formData.problem_analysis || '',
        repair_procedure: formData.repair_procedure || '',
        spare_part_used: formData.spare_part_used || 'No',
        spare_parts: formData.spare_part_used === 'Yes' ? sparePartsList : [],
        remarks: formData.remarks || '',
        repair_date: formData.repair_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        attachments: formData.attachments || ''
      }

      console.log('📤 Submitting repair:', payload)

      await repairService.create(payload)
      toast.success('Repair recorded successfully')
      
      fetchData()
      handleCloseDialog()
    } catch (error) {
      console.error('❌ Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete repairs')
      return
    }
    
    if (!window.confirm('Are you sure you want to delete this repair record?')) {
      return
    }
    
    try {
      await repairService.delete(id)
      toast.success('Repair deleted successfully')
      fetchData()
    } catch (error) {
      console.error('❌ Delete error:', error)
      toast.error('Failed to delete repair')
    }
  }

  // ✅ FILTERED REPAIRS - With Hospital & Equipment filters
  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = repair.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          repair.engineer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          repair.problem_analysis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          repair.repair_procedure?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // ✅ Hospital filter
    const matchesHospital = !filters.hospital || repair.hospital_id === parseInt(filters.hospital)
    
    // ✅ Equipment filter
    const matchesEquipment = !filters.equipment || repair.equipment_id === parseInt(filters.equipment)
    
    return matchesSearch && matchesHospital && matchesEquipment
  })

  const getAttachmentCount = (attachments) => {
    if (!attachments) return 0
    return attachments.split(',').filter(Boolean).length
  }

  // ✅ Stats Cards Data - ALL ICONS SAME THEME COLOR (Light Cyan)
  const statsCards = [
    {
      title: 'Total Repairs',
      value: repairs.length,
      icon: <Build />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Equipment',
      value: new Set(repairs.map(r => r.equipment_name)).size,
      icon: <MedicalServices />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'With Spare Parts',
      value: repairs.filter(r => r.spare_part_used === 1).length,
      icon: <CheckCircle />,
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
            Repairs
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Track and manage equipment repairs
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* ✅ REFRESH BUTTON - BORDER STYLE (Fills on hover/click) */}
          <Button 
            variant="outlined" 
            onClick={fetchData} 
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
            <Refresh sx={{ fontSize: 18, mr: 0.5 }} />
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
          
          {/* ✅ EXPORT BUTTON - Like other pages */}
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
          
          {(isEngineer || isSuperAdmin) && (
            <Button
              variant="contained"
              onClick={handleOpenDialog}
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
              <Add sx={{ fontSize: 18, mr: 0.5 }} />
              Record Repair
            </Button>
          )}
        </Box>
      </Box>

      {/* ✅ FILTER MENU */}
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
          Filter Repairs
        </Typography>
        
        {/* ✅ Hospital Filter */}
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

        {/* ✅ Equipment Filter */}
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

      {/* ✅ EXPORT MENU - Excel & PDF only (no CSV) */}
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
        {/* ✅ Excel Export Option */}
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
        
        {/* ✅ PDF Export Option */}
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

      {/* ✅ Stats Cards - Border Style with hover glow effect */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={4} key={index}>
            <Grow in timeout={300 + index * 100}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: `1px solid ${colors.borderColor}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
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
                }}
              >
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
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
                        transition: 'all 0.3s ease',
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
                  
                  {/* Indicator dots */}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: colors.lightCyan,
                      opacity: 0.4,
                    }} />
                    <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: colors.lightCyan,
                      opacity: 0.2,
                    }} />
                    <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: colors.lightCyan,
                      opacity: 0.1,
                    }} />
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
            placeholder="Search by equipment, engineer or problem..."
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

      {/* Table - WITH HOSPITAL COLUMN ADDED */}
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
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Hospital</TableCell> {/* ✅ ADDED */}
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Engineer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Problem</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Spare Used</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Attachments</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRepairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Build sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      No repairs found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredRepairs.map((repair, index) => (
                <TableRow 
                  key={repair.id} 
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
                      {repair.equipment_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {repair.hospital_name || repair.hospital?.name || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {repair.engineer_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150, color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {repair.problem_analysis || repair.root_cause || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={repair.spare_part_used ? 'Yes' : 'No'} 
                      size="small"
                      sx={{
                        bgcolor: repair.spare_part_used ? colors.success : colors.lightText,
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '11px',
                        borderRadius: 2,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {getAttachmentCount(repair.attachments) > 0 ? (
                      <Chip 
                        icon={<AttachFile sx={{ fontSize: 14 }} />}
                        label={getAttachmentCount(repair.attachments)} 
                        size="small"
                        sx={{
                          bgcolor: colors.lightCyan,
                          color: colors.darkNavy,
                          fontWeight: 500,
                          height: 22,
                          fontSize: '11px',
                          borderRadius: 2,
                        }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>None</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {repair.repair_date ? new Date(repair.repair_date).toLocaleDateString() : 
                     repair.created_at ? new Date(repair.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleView(repair)}
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
                      {isSuperAdmin && (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(repair.id)}
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

      {/* ✅ Add Repair Dialog - FIXED: REMOVED error_log_id field */}
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
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Build sx={{ fontSize: 28 }} />
              Record Repair
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            {/* ✅ KEPT: Equipment Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Select Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Select Equipment"
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
                  <MenuItem value="">Select equipment</MenuItem>
                  {equipment.map((eq) => (
                    <MenuItem key={eq.id} value={eq.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {eq.name} {eq.model ? `(${eq.model})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ✅ KEPT: Engineer Name - User types manually */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="engineer_name"
                label="Engineer Name"
                value={formData.engineer_name}
                onChange={handleFormChange}
                helperText="Enter the engineer's name"
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

            {/* ✅ KEPT: Problem Analysis */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="problem_analysis"
                label="Problem Analysis"
                value={formData.problem_analysis}
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

            {/* ✅ KEPT: Repair Procedure */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="repair_procedure"
                label="Repair Procedure"
                value={formData.repair_procedure}
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

            {/* ✅ KEPT: Spare Parts Used */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Spare Parts Used</InputLabel>
                <Select
                  name="spare_part_used"
                  value={formData.spare_part_used}
                  onChange={handleFormChange}
                  label="Spare Parts Used"
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
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {showSparePartsFields && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor, my: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, mb: 2 }}>
                    Add Spare Parts
                  </Typography>
                </Grid>

                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    name="part_name"
                    label="Part Name *"
                    value={sparePartForm.part_name}
                    onChange={handleSparePartChange}
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
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    name="quantity"
                    label="Quantity"
                    type="number"
                    value={sparePartForm.quantity}
                    onChange={handleSparePartChange}
                    InputProps={{ inputProps: { min: 1 } }}
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
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    name="unit_cost"
                    label="Unit Cost"
                    type="number"
                    value={sparePartForm.unit_cost}
                    onChange={handleSparePartChange}
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
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddSparePart}
                    sx={{ 
                      height: 40,
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
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                    }}
                  >
                    Add
                  </Button>
                </Grid>

                {sparePartsList.length > 0 && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: colors.borderColor }}>
                      <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, display: 'block', mb: 1 }}>
                        Added Spare Parts ({sparePartsList.length})
                      </Typography>
                      <Box sx={{ maxHeight: 120, overflow: 'auto' }}>
                        {sparePartsList.map((part) => (
                          <Box key={part.id} sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 0.5,
                            borderBottom: `1px solid ${colors.borderColor}`,
                          }}>
                            <Typography variant="body2" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", color: colors.darkText }}>
                              {part.part_name} × {part.quantity} (Rs. {part.total_cost.toLocaleString()})
                            </Typography>
                            <IconButton size="small" color="error" onClick={() => handleRemoveSparePart(part.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </>
            )}

            {/* ✅ KEPT: Remarks */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="remarks"
                label="Remarks (Optional)"
                value={formData.remarks}
                onChange={handleFormChange}
                multiline
                rows={2}
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

            {/* ✅ KEPT: Attachments */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ mb: 1, color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                Attachments (Images, Videos, Documents)
              </Typography>
              <FileUpload
                endpoint="/upload"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                multiple={true}
                label="Click to upload files"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete}
                existingFiles={formData.attachments ? formData.attachments.split(',').filter(Boolean).map(url => ({
                  url: url,
                  name: getFileName(url),
                  type: 'file',
                  size: 0
                })) : []}
              />
            </Grid>

            {/* ✅ KEPT: Repair Date */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="repair_date"
                label="Repair Date"
                type="datetime-local"
                value={formData.repair_date}
                onChange={handleFormChange}
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
                  }
                }}
              />
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
            Record Repair
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Repair Dialog - WITH HOSPITAL IN VIEW */}
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
        {viewingRepair && (
          <>
            <DialogTitle sx={{ 
              bgcolor: colors.darkNavy, 
              color: 'white',
              borderRadius: '8px 8px 0 0',
              py: 2.5,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Build sx={{ fontSize: 28 }} />
                  Repair Details
                </Typography>
                <Box>
                  {isSuperAdmin && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        handleCloseView()
                        handleDelete(viewingRepair.id)
                      }}
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
              <Box sx={{ mb: 3 }}>
                <Tabs 
                  value={viewTabValue} 
                  onChange={handleTabChange}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                      '&.Mui-selected': { color: colors.darkNavy }
                    },
                    '& .MuiTabs-indicator': { bgcolor: colors.lightCyan }
                  }}
                >
                  <Tab label="Details" />
                  <Tab label="Spare Parts" />
                  <Tab label="Attachments" />
                </Tabs>
              </Box>

              {/* Tab 0: Details - WITH HOSPITAL */}
              {viewTabValue === 0 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {viewingRepair.equipment_name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Hospital: {viewingRepair.hospital_name || viewingRepair.hospital?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Repaired by: {viewingRepair.engineer_name || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, display: 'block' }}>
                      Problem Analysis
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", mt: 0.5 }}>
                      {viewingRepair.problem_analysis || viewingRepair.root_cause || '-'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, display: 'block' }}>
                      Repair Procedure
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", mt: 0.5 }}>
                      {viewingRepair.repair_procedure || viewingRepair.corrective_action || '-'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, display: 'block' }}>
                      Remarks
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", mt: 0.5 }}>
                      {viewingRepair.remarks || '-'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, display: 'block' }}>
                      Spare Parts Used
                    </Typography>
                    <Chip 
                      label={viewingRepair.spare_part_used ? 'Yes' : 'No'} 
                      size="small"
                      sx={{
                        bgcolor: viewingRepair.spare_part_used ? colors.success : colors.lightText,
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '11px',
                        borderRadius: 2,
                        mt: 0.5,
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, display: 'block' }}>
                      Repair Date
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", mt: 0.5 }}>
                      {viewingRepair.repair_date ? new Date(viewingRepair.repair_date).toLocaleString() : 
                       viewingRepair.created_at ? new Date(viewingRepair.created_at).toLocaleString() : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              {/* Tab 1: Spare Parts */}
              {viewTabValue === 1 && (
                <Box>
                  {viewingRepair.spare_parts && viewingRepair.spare_parts.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: colors.borderColor }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Part Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Part Number</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Brand</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", align: 'center' }}>Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", align: 'right' }}>Total Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {viewingRepair.spare_parts.map((part, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{part.part_name}</TableCell>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{part.part_number || '-'}</TableCell>
                              <TableCell sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{part.brand || '-'}</TableCell>
                              <TableCell align="center" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{part.quantity}</TableCell>
                              <TableCell align="right" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Rs. {part.total_cost.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: colors.mainBg }}>
                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 600, color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Total:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: colors.lightCyanDark, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                              Rs. {viewingRepair.spare_parts.reduce((sum, p) => sum + (p.total_cost || 0), 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", textAlign: 'center', py: 3 }}>
                      No spare parts used
                    </Typography>
                  )}
                </Box>
              )}

              {/* Tab 2: Attachments */}
              {viewTabValue === 2 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, mb: 2 }}>
                    Attached Files
                  </Typography>
                  <AttachmentGrid 
                    attachments={viewingRepair.attachments ? viewingRepair.attachments.split(',').filter(Boolean) : []}
                  />
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default Repairs