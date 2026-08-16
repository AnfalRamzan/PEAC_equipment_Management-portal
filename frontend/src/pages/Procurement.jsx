// src/pages/Procurement.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Equipment page
// ✅ UPDATED: Stats cards design matches Equipment page
// ✅ UPDATED: Header with Filter and Export buttons
// ✅ ADDED: Animations
// ✅ UPDATED: All amounts in Pakistani Rupees (PKR)

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
  Alert,
  Tooltip,
  Menu,
  Divider,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Fade,
  Grow,
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  Close,
  LocalShipping,
  CheckCircle,
  Cancel,
  Refresh,
  FileDownload,
  FilterList,
  Warning,
  Info,
  Description,
  AttachFile,
  Print,
  Image,
  PictureAsPdf,
  MedicalServices,
  ErrorOutline,
  Build,
  Schedule,
} from '@mui/icons-material'
import { procurementService, equipmentService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'
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

// ✅ PKR Currency Formatter
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

// ==================== HELPER FUNCTIONS ====================
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

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const Procurement = () => {
  const { user } = useSelector((state) => state.auth)

  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Equipment Procurement." />
  }

  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const canCreate = isEngineer || isSuperAdmin
  const canEdit = isEngineer || isSuperAdmin
  const canDelete = isEngineer || isSuperAdmin
  const canReview = isEngineer || isSuperAdmin
  const canMarkProcured = isEngineer || isSuperAdmin
  const canApprove = isSuperAdmin

  const [requests, setRequests] = useState([])
  const [equipment, setEquipment] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingRequest, setViewingRequest] = useState(null)
  const [editingRequest, setEditingRequest] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deletingRequest, setDeletingRequest] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  })
  
  const [formData, setFormData] = useState({
    hospital_id: '',
    equipment_name: '',
    category_id: '',
    manufacturer: '',
    model: '',
    quantity: 1,
    estimated_cost: '',
    justification: '',
    priority: 'Medium',
    requested_by: '',
    department: '',
    attachments: ''
  })

  useEffect(() => {
    fetchRequests()
    fetchEquipment()
    fetchHospitals()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await procurementService.getAll()
      setRequests(response.data.requests || [])
    } catch (error) {
      toast.error('Failed to fetch procurement requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getCategories()
      setEquipment(response.data.categories || [])
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
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

  // ============================================================
  // ✅ FILTER HANDLERS
  // ============================================================
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget)
  const handleFilterClose = () => setFilterAnchorEl(null)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ status: '', priority: '' })
    setSearchTerm('')
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  // ============================================================
  // ✅ EXPORT HANDLERS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToCSV = () => {
    try {
      const headers = ['Equipment', 'Hospital', 'Manufacturer', 'Model', 'Quantity', 'Est. Cost (PKR)', 'Priority', 'Status', 'Justification']
      const rows = filteredRequests.map(r => [
        r.equipment_name || '',
        r.hospital_name || 'N/A',
        r.manufacturer || '',
        r.model || '',
        r.quantity || 1,
        r.estimated_cost ? formatPKR(r.estimated_cost) : '',
        r.priority || '',
        r.status || '',
        r.justification || ''
      ])
      let csv = headers.join(',') + '\n'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `procurement_requests_${new Date().toISOString().split('T')[0]}.csv`
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
      const data = filteredRequests.map(r => ({
        'Equipment': r.equipment_name || '',
        'Hospital': r.hospital_name || 'N/A',
        'Manufacturer': r.manufacturer || '',
        'Model': r.model || '',
        'Quantity': r.quantity || 1,
        'Est. Cost (PKR)': r.estimated_cost ? formatPKR(r.estimated_cost) : '',
        'Priority': r.priority || '',
        'Status': r.status || '',
        'Justification': r.justification || ''
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Procurement')
      XLSX.writeFile(wb, `procurement_requests_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('Procurement Requests Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Requests: ${filteredRequests.length}`, 14, 34)
      
      const tableData = filteredRequests.map(r => [
        r.equipment_name || '',
        r.hospital_name || 'N/A',
        r.manufacturer || '',
        r.model || '',
        r.quantity || 1,
        r.estimated_cost ? formatPKR(r.estimated_cost) : '',
        r.priority || '',
        r.status || ''
      ])
      autoTable(doc, {
        head: [['Equipment', 'Hospital', 'Manufacturer', 'Model', 'Qty', 'Est. Cost', 'Priority', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`procurement_requests_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const handleOpenDialog = (request = null) => {
    if (request && !canEdit) {
      toast.error('You do not have permission to edit procurement requests')
      return
    }
    
    if (request) {
      setEditingRequest(request)
      setFormData({
        hospital_id: request.hospital_id || '',
        equipment_name: request.equipment_name || '',
        category_id: request.category_id || '',
        manufacturer: request.manufacturer || '',
        model: request.model || '',
        quantity: request.quantity || 1,
        estimated_cost: request.estimated_cost || '',
        justification: request.justification || '',
        priority: request.priority || 'Medium',
        requested_by: request.requested_by || '',
        department: request.department || '',
        attachments: request.attachments || ''
      })
    } else {
      setEditingRequest(null)
      setFormData({
        hospital_id: user?.hospital_id || '',
        equipment_name: '',
        category_id: '',
        manufacturer: '',
        model: '',
        quantity: 1,
        estimated_cost: '',
        justification: '',
        priority: 'Medium',
        requested_by: user?.full_name || '',
        department: '',
        attachments: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRequest(null)
  }

  const handleView = (request) => {
    setViewingRequest(request)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingRequest(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    try {
      if (!formData.hospital_id) {
        toast.error('Please select a hospital')
        return
      }
      if (!formData.equipment_name || formData.equipment_name.trim() === '') {
        toast.error('Equipment name is required')
        return
      }

      const submitData = {
        hospital_id: parseInt(formData.hospital_id),
        equipment_name: formData.equipment_name.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        manufacturer: formData.manufacturer || '',
        model: formData.model || '',
        quantity: parseInt(formData.quantity) || 1,
        estimated_cost: parseFloat(formData.estimated_cost) || 0,
        justification: formData.justification || '',
        priority: formData.priority || 'Medium',
        requested_by: formData.requested_by || user?.full_name || '',
        department: formData.department || '',
        attachments: formData.attachments || ''
      }

      if (editingRequest) {
        await procurementService.update(editingRequest.id, submitData)
        toast.success('Procurement request updated successfully')
      } else {
        await procurementService.create(submitData)
        toast.success('Procurement request created successfully')
      }
      fetchRequests()
      handleCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDeleteClick = (request) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete procurement requests')
      return
    }
    setDeleteError(null)
    setDeletingRequest(request)
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingRequest) return
    
    setDeleting(true)
    setDeleteError(null)
    
    try {
      await procurementService.delete(deletingRequest.id)
      toast.success(`Request "${deletingRequest.equipment_name}" deleted successfully`)
      fetchRequests()
      setOpenDeleteDialog(false)
      setDeletingRequest(null)
      handleCloseView()
    } catch (error) {
      console.error('Delete error:', error)
      let errorMessage = 'Failed to delete request'
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Cannot delete this request'
          setDeleteError({
            type: 'status_error',
            message: errorMessage
          })
        }
      }
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleApprove = async (id) => {
    if (!canApprove) {
      toast.error('Only Super Admin can approve requests')
      return
    }
    try {
      await procurementService.update(id, { status: 'Approved' })
      toast.success('Procurement request approved')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleReject = async (id) => {
    if (!canApprove) {
      toast.error('Only Super Admin can reject requests')
      return
    }
    try {
      await procurementService.update(id, { status: 'Rejected' })
      toast.success('Procurement request rejected')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const handleReview = async (id) => {
    if (!canReview) {
      toast.error('You do not have permission to review requests')
      return
    }
    try {
      await procurementService.update(id, { status: 'Under Review' })
      toast.success('Request moved to Under Review')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review request')
    }
  }

  const handleMarkProcured = async (id) => {
    if (!canMarkProcured) {
      toast.error('You do not have permission to mark as procured')
      return
    }
    try {
      await procurementService.update(id, { status: 'Procured' })
      toast.success('Request marked as Procured')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as procured')
    }
  }

  const getStatusSteps = () => {
    return ['Requested', 'Under Review', 'Approved', 'Procured']
  }

  const getCurrentStep = (status) => {
    const steps = getStatusSteps()
    const index = steps.indexOf(status)
    return index !== -1 ? index : 0
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || request.status === filters.status
    const matchesPriority = !filters.priority || request.priority === filters.priority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalRequests = requests.length
  const pendingRequests = requests.filter(r => r.status === 'Requested' || r.status === 'Under Review').length
  const approvedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'Procured').length
  const rejectedRequests = requests.filter(r => r.status === 'Rejected').length
  const urgentRequests = requests.filter(r => r.priority === 'Urgent' && r.status !== 'Rejected').length

  // ✅ Stats Cards Data - Same design as Equipment page
  const statsCards = [
    {
      title: 'Total Requests',
      value: totalRequests,
      icon: <LocalShipping />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Pending Review',
      value: pendingRequests,
      icon: <Schedule />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Approved/Procured',
      value: approvedRequests,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Rejected',
      value: rejectedRequests,
      icon: <Cancel />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Urgent',
      value: urgentRequests,
      icon: <Warning />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
  ]

  // ✅ Get priority color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Urgent': return colors.error
      case 'High': return colors.warning
      case 'Medium': return colors.info
      default: return colors.lightText
    }
  }

  // ✅ Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved':
      case 'Procured': return colors.success
      case 'Rejected': return colors.error
      case 'Under Review': return colors.info
      default: return colors.lightText
    }
  }

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
            Equipment Procurement
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage equipment procurement requests and approvals
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* ✅ REFRESH BUTTON - BORDER STYLE */}
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchRequests} 
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
          
          {canCreate && (
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
              Request Equipment
            </Button>
          )}
        </Box>
      </Box>

      {/* ============================================================
          URGENT ALERT
          ============================================================ */}
      {urgentRequests > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            border: `1px solid ${colors.error}33`,
            '& .MuiAlert-icon': { color: colors.error }
          }}
          icon={<Warning />}
          action={
            <Button 
              size="small"
              onClick={() => setFilters({ ...filters, priority: 'Urgent' })}
              sx={{ color: colors.error }}
            >
              View Urgent
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>{urgentRequests}</strong> urgent procurement request{urgentRequests > 1 ? 's' : ''} need{urgentRequests === 1 ? 's' : ''} immediate attention!
          </Typography>
        </Alert>
      )}

      {/* ============================================================
          STATS CARDS - Same design as Equipment page
          ============================================================ */}
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
            placeholder="Search requests..."
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
          Filter Requests
        </Typography>
        
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
            <MenuItem value="Requested">Requested</MenuItem>
            <MenuItem value="Under Review">Under Review</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="Procured">Procured</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText }}>Priority</InputLabel>
          <Select 
            name="priority" 
            value={filters.priority} 
            onChange={handleFilterChange} 
            label="Priority"
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Urgent">Urgent</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth 
          size="small" 
          label="Search" 
          name="search"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by equipment, manufacturer..." 
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
          TABLE
          ============================================================ */}
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
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Manufacturer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Model</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Qty</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Est. Cost (PKR)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Priority</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <LocalShipping sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      No procurement requests found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Try adjusting your search or filters
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request, index) => (
                <TableRow 
                  key={request.id} 
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
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {request.equipment_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {request.hospital_name || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {request.manufacturer || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {request.model || '-'}
                  </TableCell>
                  <TableCell sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {request.quantity}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {request.estimated_cost ? formatPKR(request.estimated_cost) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(request.priority),
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
                      label={request.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(request.status),
                        color: 'white',
                        fontWeight: 600,
                        height: 26,
                        fontSize: '11px',
                        borderRadius: 2,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleView(request)}
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
                      
                      {(request.status === 'Requested' || request.status === 'Under Review') && canEdit && (
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(request)}
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
                        <Tooltip title="Delete Request">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteClick(request)}
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
                      
                      {request.status === 'Requested' && canReview && (
                        <Tooltip title="Start Review">
                          <IconButton 
                            size="small" 
                            onClick={() => handleReview(request.id)}
                            sx={{ 
                              color: colors.info, 
                              '&:hover': { 
                                color: colors.lightCyanDark,
                                backgroundColor: 'rgba(103, 232, 249, 0.08)'
                              } 
                            }}
                          >
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {request.status === 'Under Review' && canApprove && (
                        <>
                          <Tooltip title="Approve Request">
                            <IconButton 
                              size="small" 
                              onClick={() => handleApprove(request.id)}
                              sx={{ 
                                color: colors.success, 
                                '&:hover': { 
                                  color: colors.lightCyanDark,
                                  backgroundColor: 'rgba(103, 232, 249, 0.08)'
                                } 
                              }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Request">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleReject(request.id)}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 68, 68, 0.08)'
                                }
                              }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {request.status === 'Approved' && canMarkProcured && (
                        <Tooltip title="Mark as Procured">
                          <IconButton 
                            size="small" 
                            onClick={() => handleMarkProcured(request.id)}
                            sx={{ 
                              color: colors.success, 
                              '&:hover': { 
                                color: colors.lightCyanDark,
                                backgroundColor: 'rgba(103, 232, 249, 0.08)'
                              } 
                            }}
                          >
                            <CheckCircle fontSize="small" />
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

      {/* ============================================================
          ADD/EDIT DIALOG
          ============================================================ */}
      {canCreate && (
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
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                {editingRequest ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
                {editingRequest ? 'Edit Procurement Request' : 'New Procurement Request'}
              </Typography>
              <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 4, py: 3 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Hospital</InputLabel>
                  <Select
                    name="hospital_id"
                    value={formData.hospital_id}
                    onChange={handleFormChange}
                    label="Hospital"
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
                    <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Select Hospital</MenuItem>
                    {hospitals.map(h => (
                      <MenuItem key={h.id} value={h.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{h.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Category</InputLabel>
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
                    <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Select Category</MenuItem>
                    {equipment.map(cat => (
                      <MenuItem key={cat.id} value={cat.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Equipment Name"
                  name="equipment_name"
                  value={formData.equipment_name}
                  onChange={handleFormChange}
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
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Estimated Cost (PKR)"
                  name="estimated_cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={handleFormChange}
                  InputProps={{ inputProps: { min: 0, step: 1 } }}
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    label="Priority"
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
                    <MenuItem value="Low" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Low</MenuItem>
                    <MenuItem value="Medium" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Medium</MenuItem>
                    <MenuItem value="High" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>High</MenuItem>
                    <MenuItem value="Urgent" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Requested By"
                  name="requested_by"
                  value={formData.requested_by}
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
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
                  label="Justification"
                  name="justification"
                  value={formData.justification}
                  onChange={handleFormChange}
                  multiline
                  rows={3}
                  placeholder="Explain why this equipment is needed..."
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
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }} gutterBottom>
                  <AttachFile sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                  Attach Documents (Quotes, Specifications, etc.)
                </Typography>
                
                <FileUpload
                  endpoint="/upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                  multiple={true}
                  label="Click to upload documents"
                  maxFiles={5}
                  maxSize={20}
                  showPreview={true}
                  onUploadComplete={(files) => {
                    const urls = files.map(f => f.url || f.fileUrl).filter(Boolean)
                    const currentFiles = formData.attachments ? formData.attachments.split(',') : []
                    const updatedFiles = [...currentFiles, ...urls]
                    setFormData(prev => ({
                      ...prev,
                      attachments: updatedFiles.join(',')
                    }))
                    toast.success(`${files.length} document(s) uploaded successfully`)
                  }}
                  onUploadError={(error) => toast.error('Upload failed: ' + error)}
                  onDelete={(file) => {
                    const currentFiles = formData.attachments?.split(',') || []
                    const updatedFiles = currentFiles.filter(f => f !== file.url)
                    setFormData(prev => ({
                      ...prev,
                      attachments: updatedFiles.join(',')
                    }))
                    toast.info('Document removed')
                  }}
                  existingFiles={formData.attachments ? formData.attachments.split(',').filter(Boolean).map(url => ({
                    url: url,
                    name: url.split('/').pop(),
                    type: 'document'
                  })) : []}
                />
                
                {formData.attachments && formData.attachments.split(',').filter(Boolean).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {formData.attachments.split(',').filter(Boolean).length} document(s) attached
                    </Typography>
                  </Box>
                )}
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
                fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
              {editingRequest ? 'Update' : 'Submit Request'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ============================================================
          DELETE CONFIRMATION DIALOG
          ============================================================ */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => {
          if (!deleting) {
            setOpenDeleteDialog(false)
            setDeletingRequest(null)
            setDeleteError(null)
          }
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
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ color: colors.error, fontSize: 28 }} />
            <Typography variant="h6" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              Delete Procurement Request
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {deleteError?.type === 'status_error' ? (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2, border: `1px solid ${colors.error}33` }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  Cannot Delete Request
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {deleteError.message}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.lightText, mt: 1, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  💡 Please contact Super Admin if you need to delete this request.
                </Typography>
              </Alert>
            ) : (
              <>
                <Typography variant="body1" gutterBottom sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  Are you sure you want to delete this procurement request?
                </Typography>
                
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: `${colors.warning}08`, 
                    borderRadius: 2,
                    border: `1px solid ${colors.warning}33`
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    Equipment: {deletingRequest?.equipment_name}
                  </Typography>
                  {deletingRequest?.manufacturer && (
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Manufacturer: {deletingRequest.manufacturer}
                    </Typography>
                  )}
                  {deletingRequest?.model && (
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Model: {deletingRequest.model}
                    </Typography>
                  )}
                  {deletingRequest?.estimated_cost && (
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Est. Cost: {formatPKR(deletingRequest.estimated_cost)}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    Status: {deletingRequest?.status}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    Priority: {deletingRequest?.priority}
                  </Typography>
                </Paper>

                <Typography variant="caption" sx={{ color: colors.error, mt: 2, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  ⚠️ This action cannot be undone.
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => {
              setOpenDeleteDialog(false)
              setDeletingRequest(null)
              setDeleteError(null)
            }}
            disabled={deleting}
            sx={{ 
              color: colors.darkNavy,
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
            }}
          >
            {deleteError?.type === 'status_error' ? 'Close' : 'Cancel'}
          </Button>
          {!deleteError?.type && (
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={deleting}
              startIcon={deleting ? <LinearProgress size={20} color="inherit" /> : <Delete />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
              }}
            >
              {deleting ? 'Deleting...' : 'Delete Request'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ============================================================
          VIEW DETAILS DIALOG
          ============================================================ */}
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
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              <LocalShipping sx={{ fontSize: 28 }} />
              Procurement Request Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 4, py: 3 }}>
          {viewingRequest && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingRequest.equipment_name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={viewingRequest.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(viewingRequest.status),
                        color: 'white',
                        fontWeight: 600,
                        height: 26,
                        fontSize: '11px',
                        borderRadius: 2,
                      }}
                    />
                    <Chip
                      label={viewingRequest.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(viewingRequest.priority),
                        color: 'white',
                        fontWeight: 600,
                        height: 26,
                        fontSize: '11px',
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              {/* Status Timeline */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mb: 2, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Request Status Timeline
                </Typography>
                <Stepper activeStep={getCurrentStep(viewingRequest.status)} orientation="vertical">
                  {getStatusSteps().map((step, index) => (
                    <Step key={step}>
                      <StepLabel
                        StepIconComponent={({ active, completed }) => {
                          const stepColors = {
                            'Requested': colors.warning,
                            'Under Review': colors.info,
                            'Approved': colors.success,
                            'Procured': colors.success
                          }
                          return (
                            <Avatar sx={{
                              bgcolor: active || completed ? stepColors[step] : colors.borderColor,
                              width: 24,
                              height: 24,
                              fontSize: 14,
                              color: 'white'
                            }}>
                              {index + 1}
                            </Avatar>
                          )
                        }}
                      >
                        <Typography sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                          {step}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                          {step === viewingRequest.status ? 'Current status' :
                            getCurrentStep(viewingRequest.status) > index ? 'Completed' : 'Pending'}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              {/* Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Hospital
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.hospital_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Category
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.category_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Manufacturer
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.manufacturer || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Model
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.model || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Quantity
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.quantity}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Estimated Cost
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.lightCyanDark, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.estimated_cost ? formatPKR(viewingRequest.estimated_cost) : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Priority
                </Typography>
                <Chip
                  label={viewingRequest.priority}
                  size="small"
                  sx={{
                    bgcolor: getPriorityColor(viewingRequest.priority),
                    color: 'white',
                    fontWeight: 600,
                    height: 26,
                    fontSize: '11px',
                    borderRadius: 2,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Requested By
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.requested_by || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Department
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingRequest.department || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Justification
                </Typography>
                <Paper variant="outlined" sx={{ 
                  p: 2, 
                  mt: 0.5, 
                  bgcolor: colors.mainBg,
                  borderColor: colors.borderColor,
                  borderRadius: 2
                }}>
                  <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                    {viewingRequest.justification || 'No justification provided'}
                  </Typography>
                </Paper>
              </Grid>

              {/* Attachments */}
              {viewingRequest.attachments && viewingRequest.attachments.split(',').filter(Boolean).length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, mb: 1 }}>
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                    Attached Documents ({viewingRequest.attachments.split(',').filter(Boolean).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {viewingRequest.attachments.split(',').filter(Boolean).map((url, index) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                      const isPDF = url.match(/\.(pdf)$/i)
                      
                      return (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          startIcon={isImage ? <Image /> : isPDF ? <PictureAsPdf /> : <Description />}
                          href={getFullUrl(url)}
                          target="_blank"
                          sx={{ 
                            textTransform: 'none',
                            borderColor: colors.borderColor,
                            color: colors.darkNavy,
                            borderRadius: 2,
                            '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark }
                          }}
                        >
                          {url.split('/').pop().substring(0, 25)}
                        </Button>
                      )
                    })}
                  </Box>
                </Grid>
              )}

              {/* Delete Button in View Dialog */}
              {viewingRequest && canDelete && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2, borderColor: colors.borderColor }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => {
                        handleCloseView()
                        handleDeleteClick(viewingRequest)
                      }}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                      }}
                    >
                      Delete Request
                    </Button>
                  </Box>
                </Grid>
              )}

              {/* Status Update Actions */}
              {viewingRequest.status !== 'Rejected' && viewingRequest.status !== 'Procured' && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2, borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mb: 1, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Update Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewingRequest.status === 'Requested' && canReview && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleReview(viewingRequest.id)}
                        startIcon={<Info />}
                        sx={{ 
                          bgcolor: colors.info,
                          color: 'white',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                          '&:hover': { bgcolor: '#0D47A1' },
                        }}
                      >
                        Start Review
                      </Button>
                    )}
                    {viewingRequest.status === 'Under Review' && canApprove && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleApprove(viewingRequest.id)}
                          startIcon={<CheckCircle />}
                          sx={{ 
                            bgcolor: colors.success,
                            color: 'white',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                            '&:hover': { bgcolor: '#1B5E20' },
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleReject(viewingRequest.id)}
                          startIcon={<Cancel />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {viewingRequest.status === 'Approved' && canMarkProcured && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleMarkProcured(viewingRequest.id)}
                        startIcon={<CheckCircle />}
                        sx={{ 
                          bgcolor: colors.success,
                          color: 'white',
                          borderRadius: 2,
                          textTransform: 'none',
                          fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                          '&:hover': { bgcolor: '#1B5E20' },
                        }}
                      >
                        Mark as Procured
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}

              {/* View Only Messages */}
              {viewingRequest.status === 'Rejected' && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.error}33` }}>
                    This request has been rejected. No further actions can be taken.
                  </Alert>
                </Grid>
              )}

              {viewingRequest.status === 'Procured' && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.success}33` }}>
                    Equipment has been procured! This request is complete.
                  </Alert>
                </Grid>
              )}
            </Grid>
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
          {viewingRequest && viewingRequest.status !== 'Rejected' && viewingRequest.status !== 'Procured' && canEdit && (
            <Button 
              variant="contained" 
              startIcon={<Print />} 
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
              onClick={() => window.print()}
            >
              Print Request
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Procurement