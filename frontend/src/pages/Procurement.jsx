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
  CircularProgress,
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
  Warning,
  Info,
  Description,
  Person,
  Business,
  AttachFile,
  Image,
  PictureAsPdf,
  ErrorOutline,
  Comment,
  Send,
} from '@mui/icons-material'
import { procurementService, equipmentService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import FileUpload from '../components/FileUpload'
import api from '../api/axios'

// ============================================================
// ✅ THEME COLORS
// ============================================================
const colors = {
  darkNavy: '#0F172A',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  accentGold: '#C9A227',
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
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
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`

// ==================== HELPER FUNCTIONS ====================
const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) return `http://localhost:5000${url}`
  return url
}

// ✅ Format amount in Millions if >= 1,000,000
const formatAmount = (amount, currency = 'PKR') => {
  if (!amount) return `${currency} 0`
  const num = parseFloat(amount)
  if (isNaN(num)) return `${currency} 0`
  if (num >= 1000000) {
    return `${currency} ${(num / 1000000).toFixed(1)} Million`
  }
  return `${currency} ${num.toLocaleString('en-PK')}`
}

// ✅ Status color mapping (workflow steps)
const getStatusColor = (status) => {
  const colorsMap = {
    'PURCHASE CASE INITIATED': '#F59E0B',
    'CASE APPROVED': '#3B82F6',
    'P.O ISSUED': '#8B5CF6',
    'SHIPMENT ARRIVED': '#22C55E',
    'EQUIPMENT INSTALLED': '#14B8A6',
    'EQUIPMENT TESTED & COMMISSIONED FOR USE': '#06B6D4',
    'REJECTED': '#EF4444'
  }
  return colorsMap[status] || '#94A3B8'
}

const getPriorityColor = (priority) => {
  const colorsMap = {
    'Low': '#22C55E',
    'Medium': '#3B82F6',
    'High': '#F59E0B',
    'Urgent': '#EF4444'
  }
  return colorsMap[priority] || '#94A3B8'
}

// ✅ Workflow steps (must match backend)
const STEPS = [
  'PURCHASE CASE INITIATED',
  'CASE APPROVED',
  'P.O ISSUED',
  'SHIPMENT ARRIVED',
  'EQUIPMENT INSTALLED',
  'EQUIPMENT TESTED & COMMISSIONED FOR USE'
]

const Procurement = () => {
  // ============================================================
  // ✅ PERMISSIONS
  // ============================================================
  const { user } = useSelector((state) => state.auth)

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'ENGINEER'
  const canView = true // all logged-in users can view
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN'
  const canDelete = user?.role === 'SUPER_ADMIN' // Only SUPER_ADMIN can delete, including completed items
  const canApprove = user?.role === 'SUPER_ADMIN' // for all step advancements
  const canReview = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' // (not used now)
  const canMarkProcured = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN'
  const canComment = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN' || user?.role === 'ENGINEER'

  // ============================================================
  // ✅ STATE
  // ============================================================
  const [requests, setRequests] = useState([])
  const [equipment, setEquipment] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingRequest, setViewingRequest] = useState(null)
  const [editingRequest, setEditingRequest] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [stepComment, setStepComment] = useState('') // for comment input in view dialog

  // Form data
  const [formData, setFormData] = useState({
    hospital_id: '',
    equipment_name: '',
    category_name: '',
    manufacturer_options: ['', '', ''],
    model_options: ['', '', ''],
    quantity: 1,
    estimated_cost: '',
    justification: '',
    priority: 'Medium',
    requested_by: '',
    department_name: '',
    attachments: '',
    currency: 'PKR',
  })

  // ============================================================
  // ✅ FETCH DATA
  // ============================================================
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchRequests(), fetchEquipment(), fetchHospitals()])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await procurementService.getAll()
      if (response.data && response.data.success) {
        setRequests(response.data.requests || [])
      } else if (Array.isArray(response.data)) {
        setRequests(response.data)
      } else {
        setRequests([])
      }
    } catch (error) {
      console.error('❌ Fetch procurement error:', error)
      if (error.response?.status === 403) {
        toast.warning('You have view-only access to procurement requests')
        setRequests([])
      } else {
        toast.error('Failed to fetch procurement requests')
        setRequests([])
      }
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getCategories()
      if (response.data && response.data.success) {
        setEquipment(response.data.categories || [])
      } else if (Array.isArray(response.data)) {
        setEquipment(response.data)
      } else {
        setEquipment([])
      }
    } catch (error) {
      console.error('❌ Fetch equipment error:', error)
      setEquipment([])
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll()
      if (response.data && response.data.success) {
        setHospitals(response.data.hospitals || [])
      } else if (Array.isArray(response.data)) {
        setHospitals(response.data)
      } else {
        setHospitals([])
      }
    } catch (error) {
      console.error('❌ Fetch hospitals error:', error)
      setHospitals([])
    }
  }

  const fetchDepartments = async (hospitalId) => {
    if (!hospitalId) {
      setDepartments([])
      return
    }
    try {
      const response = await api.get(`/departments/hospital/${hospitalId}`)
      if (response.data && response.data.success) {
        setDepartments(response.data.departments || [])
      } else if (Array.isArray(response.data)) {
        setDepartments(response.data)
      } else {
        setDepartments([])
      }
    } catch (error) {
      console.error('❌ Fetch departments error:', error)
      setDepartments([])
    }
  }

  // ============================================================
  // ✅ DIALOG HANDLERS
  // ============================================================
  const handleOpenDialog = (request = null) => {
    if (request && !canEdit) {
      toast.error('Only Admin can edit procurement requests')
      return
    }
    if (request) {
      setEditingRequest(request)
      const manOpts = request.manufacturer_options || ['', '', '']
      const modOpts = request.model_options || ['', '', '']
      while (manOpts.length < 3) manOpts.push('')
      while (modOpts.length < 3) modOpts.push('')
      setFormData({
        hospital_id: request.hospital_id || '',
        equipment_name: request.equipment_name || '',
        category_name: request.category_name || '',
        manufacturer_options: manOpts,
        model_options: modOpts,
        quantity: request.quantity || 1,
        estimated_cost: request.estimated_cost || '',
        justification: request.justification || '',
        priority: request.priority || 'Medium',
        requested_by: request.requested_by || '',
        department_name: request.department_name || '',
        attachments: request.attachments || '',
        currency: request.currency || 'PKR',
      })
      if (request.hospital_id) fetchDepartments(request.hospital_id)
    } else {
      setEditingRequest(null)
      const defaultHospitalId = user?.hospital_id || ''
      setFormData({
        hospital_id: defaultHospitalId,
        equipment_name: '',
        category_name: '',
        manufacturer_options: ['', '', ''],
        model_options: ['', '', ''],
        quantity: 1,
        estimated_cost: '',
        justification: '',
        priority: 'Medium',
        requested_by: user?.full_name || user?.name || '',
        department_name: '',
        attachments: '',
        currency: 'PKR',
      })
      if (defaultHospitalId) fetchDepartments(defaultHospitalId)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRequest(null)
    setSubmitting(false)
  }

  const handleView = (request) => {
    setViewingRequest(request)
    setStepComment('')
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingRequest(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'hospital_id' && value) fetchDepartments(value)
  }

  const handleManOptionChange = (index, value) => {
    const newOpts = [...formData.manufacturer_options]
    newOpts[index] = value
    setFormData(prev => ({ ...prev, manufacturer_options: newOpts }))
  }

  const handleModelOptionChange = (index, value) => {
    const newOpts = [...formData.model_options]
    newOpts[index] = value
    setFormData(prev => ({ ...prev, model_options: newOpts }))
  }

  // ============================================================
  // ✅ SUBMIT / UPDATE
  // ============================================================
  const handleSubmit = async () => {
    if (!formData.hospital_id) {
      toast.error('Please select a hospital')
      return
    }
    if (!formData.equipment_name || formData.equipment_name.trim() === '') {
      toast.error('Equipment name is required')
      return
    }

    setSubmitting(true)
    try {
      const manOpts = formData.manufacturer_options.filter(s => s.trim() !== '')
      const modOpts = formData.model_options.filter(s => s.trim() !== '')

      const submitData = {
        hospital_id: parseInt(formData.hospital_id),
        equipment_name: formData.equipment_name.trim(),
        category_name: formData.category_name || '',
        manufacturer_options: manOpts,
        model_options: modOpts,
        quantity: parseInt(formData.quantity) || 1,
        estimated_cost: parseFloat(formData.estimated_cost) || 0,
        justification: formData.justification || '',
        priority: formData.priority || 'Medium',
        requested_by: user?.id || null,
        department_name: formData.department_name || '',
        attachments: formData.attachments || '',
        currency: formData.currency || 'PKR',
      }

      let response
      if (editingRequest) {
        if (!canEdit) {
          toast.error('Only Admin can edit requests')
          return
        }
        response = await procurementService.update(editingRequest.id, submitData)
        if (response.data && response.data.success) {
          toast.success('Procurement request updated successfully')
        } else {
          throw new Error(response.data?.message || 'Update failed')
        }
      } else {
        response = await procurementService.create(submitData)
        if (response.data && response.data.success) {
          toast.success('Procurement request created successfully')
        } else {
          throw new Error(response.data?.message || 'Creation failed')
        }
      }
      await fetchRequests()
      handleCloseDialog()
    } catch (error) {
      console.error('❌ Submit error:', error)
      let errorMsg = 'Operation failed. Please try again.'
      if (error.response) {
        if (error.response.status === 403) {
          errorMsg = '⚠️ You do not have permission to create procurement requests.'
        } else if (error.response.status === 401) {
          errorMsg = 'Your session has expired. Please login again.'
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message
        }
      } else if (error.message) {
        errorMsg = error.message
      }
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete procurement requests')
      return
    }
    if (window.confirm('Are you sure you want to delete this procurement request?')) {
      try {
        const response = await procurementService.delete(id)
        if (response.data && response.data.success) {
          toast.success('Procurement request deleted successfully')
          await fetchRequests()
        } else {
          throw new Error(response.data?.message || 'Delete failed')
        }
      } catch (error) {
        console.error('❌ Delete error:', error)
        let errorMsg = 'Failed to delete request'
        if (error.response?.status === 403) {
          errorMsg = 'You do not have permission to delete this request'
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message
        }
        toast.error(errorMsg)
      }
    }
  }

  // ============================================================
  // ✅ STATUS TRANSITION (UNIFIED)
  // ============================================================
  const transitionStatus = async (id, newStatus, comment = '') => {
    try {
      const payload = { status: newStatus }
      if (comment) payload.comment = comment
      const response = await api.put(`/procurement/${id}/status`, payload)
      if (response.data && response.data.success) {
        toast.success(`Status updated to ${newStatus}`)
        await fetchRequests()
        // Update viewing request if open
        if (viewingRequest && viewingRequest.id === id) {
          setViewingRequest(prev => ({ ...prev, status: newStatus, step_comments: response.data.step_comments }))
        }
        handleCloseView()
      } else {
        throw new Error(response.data?.message || 'Status update failed')
      }
    } catch (error) {
      console.error('❌ Status transition error:', error)
      let errorMsg = 'Failed to update status'
      if (error.response?.data?.message) errorMsg = error.response.data.message
      toast.error(errorMsg)
    }
  }

  // ============================================================
  // ✅ ADD COMMENT
  // ============================================================
  const handleAddComment = async () => {
    if (!viewingRequest) return
    if (!stepComment.trim()) {
      toast.error('Please enter a comment')
      return
    }
    const currentStep = viewingRequest.status
    try {
      const response = await api.post(`/procurement/${viewingRequest.id}/comment`, {
        step: currentStep,
        comment: stepComment.trim()
      })
      if (response.data && response.data.success) {
        toast.success('Comment added')
        setViewingRequest(prev => ({ ...prev, step_comments: response.data.step_comments }))
        setStepComment('')
        await fetchRequests()
      } else {
        throw new Error(response.data?.message || 'Failed to add comment')
      }
    } catch (error) {
      console.error('❌ Comment error:', error)
      toast.error(error.response?.data?.message || 'Failed to add comment')
    }
  }

  // ============================================================
  // ✅ EXPORT FUNCTIONS
  // ============================================================
  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToCSV = () => {
    try {
      const headers = ['Equipment', 'Hospital', 'Manufacturers', 'Models', 'Quantity', 'Est. Cost', 'Currency', 'Priority', 'Status', 'Justification']
      const rows = filteredRequests.map(r => [
        r.equipment_name,
        r.hospital_name || 'N/A',
        (r.manufacturer_options || []).join('; '),
        (r.model_options || []).join('; '),
        r.quantity || 1,
        r.estimated_cost || '',
        r.currency || 'PKR',
        r.priority,
        r.status,
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
      toast.success('CSV exported successfully!')
      handleExportClose()
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  const exportToExcel = () => {
    try {
      import('xlsx').then((XLSX) => {
        const data = filteredRequests.map(r => ({
          'Equipment': r.equipment_name,
          'Hospital': r.hospital_name || 'N/A',
          'Manufacturers': (r.manufacturer_options || []).join('; '),
          'Models': (r.model_options || []).join('; '),
          'Quantity': r.quantity || 1,
          'Est. Cost': r.estimated_cost || '',
          'Currency': r.currency || 'PKR',
          'Priority': r.priority,
          'Status': r.status,
          'Justification': r.justification || ''
        }))
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Procurement')
        XLSX.writeFile(wb, `procurement_requests_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success('Excel exported successfully!')
        handleExportClose()
      }).catch(() => toast.error('Excel library not loaded'))
    } catch (error) {
      toast.error('Failed to export Excel')
    }
  }

  // ============================================================
  // ✅ HELPERS
  // ============================================================
  const getCurrentStep = (status) => {
    const index = STEPS.indexOf(status)
    return index !== -1 ? index : 0
  }

  // ============================================================
  // ✅ FILTERS & STATS
  // ============================================================
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (request.manufacturer_options || []).some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (request.model_options || []).some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          request.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || request.status === filters.status
    const matchesPriority = !filters.priority || request.priority === filters.priority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const totalRequests = requests.length
  const pendingRequests = requests.filter(r => r.status !== 'REJECTED' && r.status !== 'EQUIPMENT TESTED & COMMISSIONED FOR USE').length
  const completedRequests = requests.filter(r => r.status === 'EQUIPMENT TESTED & COMMISSIONED FOR USE').length
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length
  const urgentRequests = requests.filter(r => r.priority === 'Urgent' && r.status !== 'REJECTED').length

  // ============================================================
  // ✅ RENDER
  // ============================================================
  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ErrorOutline sx={{ fontSize: 64, color: colors.error, mb: 2 }} />
        <Typography variant="h6" sx={{ color: colors.darkNavy, mb: 1 }}>Something went wrong</Typography>
        <Typography variant="body2" sx={{ color: colors.lightText, mb: 2 }}>{error}</Typography>
        <Button variant="contained" onClick={fetchAllData} sx={{ bgcolor: colors.darkNavy, color: colors.text, borderRadius: 2, '&:hover': { bgcolor: colors.darkNavyHover } }}>
          Retry
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
      overflowX: 'hidden',
      maxWidth: '100%',
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
            <LocalShipping sx={{ mr: 1, verticalAlign: 'middle', color: colors.lightCyanDark }} />
            Equipment Procurement
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
            Manage procurement requests with full workflow tracking
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAllData} size="small" sx={{ borderColor: colors.lightCyan, color: colors.lightCyan, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: colors.lightCyan, color: colors.darkNavy, borderColor: colors.lightCyan, boxShadow: `0 4px 16px ${colors.lightCyanGlow}`, transform: 'translateY(-2px)' } }}>
            Refresh
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} size="small" sx={{ bgcolor: colors.darkNavy, color: colors.text, borderRadius: 2, textTransform: 'none', boxShadow: `0 4px 16px ${colors.lightCyanGlow}`, '&:hover': { bgcolor: colors.darkNavyHover, boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`, transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}>
              New Procurement Request
            </Button>
          )}
        </Box>
      </Box>

      {/* ===== STATS CARDS ===== */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${colors.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', '&:hover': { boxShadow: `0 8px 30px ${colors.lightCyanGlow}`, transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h4" sx={{ color: colors.darkNavy, fontWeight: 700 }}>{totalRequests}</Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Total Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${colors.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', '&:hover': { boxShadow: `0 8px 30px ${colors.lightCyanGlow}`, transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h4" sx={{ color: colors.warning, fontWeight: 700 }}>{pendingRequests}</Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${colors.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', '&:hover': { boxShadow: `0 8px 30px ${colors.lightCyanGlow}`, transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h4" sx={{ color: colors.success, fontWeight: 700 }}>{completedRequests}</Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Commissioned</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${colors.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', '&:hover': { boxShadow: `0 8px 30px ${colors.lightCyanGlow}`, transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h4" sx={{ color: colors.error, fontWeight: 700 }}>{rejectedRequests}</Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${colors.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', '&:hover': { boxShadow: `0 8px 30px ${colors.lightCyanGlow}`, transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h4" sx={{ color: colors.error, fontWeight: 700 }}>{urgentRequests}</Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Urgent</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {urgentRequests > 0 && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, border: `1px solid ${colors.borderColor}` }} icon={<Warning />} action={<Button color="error" size="small" onClick={() => setFilters({ ...filters, priority: 'Urgent' })} sx={{ textTransform: 'none' }}>View Urgent</Button>}>
          <Typography variant="body2"><strong>{urgentRequests}</strong> urgent procurement request{urgentRequests > 1 ? 's' : ''} need{urgentRequests === 1 ? 's' : ''} immediate attention!</Typography>
        </Alert>
      )}

      {/* ===== SEARCH & FILTERS ===== */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 3, border: `1px solid ${colors.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', bgcolor: colors.cardBg, animation: 'fadeInUp 0.7s ease-out' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 }, width: { xs: '100%', sm: 'auto' } }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: colors.lightText, fontSize: 20 }} /></InputAdornment>, sx: { borderRadius: 2, '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } } }} />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
            <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} label="Status" sx={{ borderRadius: 2, '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }}>
              <MenuItem value="">All</MenuItem>
              {STEPS.map(step => <MenuItem key={step} value={step}>{step}</MenuItem>)}
              <MenuItem value="REJECTED">REJECTED</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel sx={{ color: colors.lightText }}>Priority</InputLabel>
            <Select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} label="Priority" sx={{ borderRadius: 2, '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Download />} onClick={handleExportClick} size="small" sx={{ bgcolor: colors.darkNavy, color: colors.text, borderRadius: 2, textTransform: 'none', boxShadow: `0 4px 16px ${colors.lightCyanGlow}`, '&:hover': { bgcolor: colors.darkNavyHover, boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}`, transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}>
            Export
          </Button>
        </Box>
      </Paper>

      {/* Export Menu */}
      <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={handleExportClose} PaperProps={{ sx: { p: 1, width: 200, border: `1px solid ${colors.borderColor}`, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', borderRadius: 3 } }}>
        <MenuItem onClick={exportToCSV} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.08)' } }}>
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box><Typography variant="body2" fontWeight={500}>CSV</Typography><Typography variant="caption" sx={{ color: colors.lightText }}>Comma separated</Typography></Box>
        </MenuItem>
        <MenuItem onClick={exportToExcel} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'rgba(103, 232, 249, 0.08)' } }}>
          <FileDownload sx={{ mr: 1.5, fontSize: 20, color: colors.lightCyanDark }} />
          <Box><Typography variant="body2" fontWeight={500}>Excel</Typography><Typography variant="caption" sx={{ color: colors.lightText }}>.xlsx format</Typography></Box>
        </MenuItem>
      </Menu>

      {/* ===== TABLE ===== */}
      <TableContainer component={Paper} sx={{ 
        borderRadius: 3, 
        overflowX: 'auto', 
        border: `1px solid ${colors.borderColor}`, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', 
        animation: 'fadeInUp 0.8s ease-out',
        maxWidth: '100%',
      }}>
        <Table sx={{ 
          minWidth: { xs: 600, sm: 700, md: 800 },
          maxWidth: '100%',
          tableLayout: 'fixed',
        }}>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '12%' }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '12%' }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '14%' }}>Manufacturers</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '12%' }}>Models</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '6%' }} align="center">Qty</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '12%' }} align="right">Est. Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '10%' }}>Priority</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '14%' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, py: 2, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, width: '8%' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <LocalShipping sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText }}>No procurement requests found</Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>Try adjusting your search or filters</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request, index) => (
                <TableRow key={request.id} hover sx={{ transition: 'all 0.2s ease', animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`, '&:hover': { backgroundColor: 'rgba(103, 232, 249, 0.04)' }, '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ 
                    color: colors.darkNavy, 
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    wordBreak: 'break-word',
                  }}>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy, fontSize: { xs: '0.7rem', sm: '0.8rem' }, wordBreak: 'break-word' }}>
                      {request.equipment_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    color: colors.darkNavy, 
                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                    wordBreak: 'break-word',
                  }}>
                    {request.hospital_name || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: colors.lightText, 
                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                    wordBreak: 'break-word',
                  }}>
                    {(request.manufacturer_options || []).join(', ') || '-'}
                  </TableCell>
                  <TableCell sx={{ 
                    color: colors.lightText, 
                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                    wordBreak: 'break-word',
                  }}>
                    {(request.model_options || []).join(', ') || '-'}
                  </TableCell>
                  <TableCell align="center" sx={{ color: colors.darkNavy, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' } }}>{request.quantity}</TableCell>
                  <TableCell align="right" sx={{ color: colors.darkNavy, fontWeight: 500, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' } }}>
                    {request.estimated_cost ? formatAmount(request.estimated_cost, request.currency) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={request.priority} 
                      size="small" 
                      sx={{ 
                        bgcolor: getPriorityColor(request.priority), 
                        color: 'white', 
                        fontWeight: 600, 
                        fontSize: { xs: '8px', sm: '10px' }, 
                        height: { xs: 20, sm: 24 }, 
                        borderRadius: 2 
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
                        fontSize: { xs: '8px', sm: '10px' }, 
                        height: { xs: 20, sm: 24 }, 
                        borderRadius: 2 
                      }} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleView(request)} sx={{ color: colors.darkNavy, '&:hover': { color: colors.lightCyanDark, backgroundColor: 'rgba(103, 232, 249, 0.08)' } }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(request)} sx={{ color: colors.darkNavy, '&:hover': { color: colors.lightCyanDark, backgroundColor: 'rgba(103, 232, 249, 0.08)' } }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(request.id)} sx={{ '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' } }}>
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

      {/* ===== ADD/EDIT DIALOG ===== */}
      {canCreate && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, border: `1px solid ${colors.borderColor}`, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', margin: { xs: 1, sm: 2 } } }}>
          <DialogTitle sx={{ bgcolor: colors.darkNavy, color: 'white', borderRadius: '8px 8px 0 0', py: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                <LocalShipping sx={{ fontSize: { xs: 22, sm: 28 } }} />
                {editingRequest ? 'Edit Procurement Request' : 'New Procurement Request'}
              </Typography>
              <IconButton onClick={handleCloseDialog} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Hospital *</InputLabel>
                  <Select name="hospital_id" value={formData.hospital_id} onChange={handleFormChange} label="Hospital *" required disabled={user?.role === 'HOSPITAL_ADMIN'} sx={{ borderRadius: 2, '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }}>
                    <MenuItem value="">Select Hospital</MenuItem>
                    {hospitals.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Category" name="category_name" value={formData.category_name} onChange={handleFormChange} placeholder="Enter equipment category (e.g., MRI, Ultrasound)" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Equipment Name *" name="equipment_name" value={formData.equipment_name} onChange={handleFormChange} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600, mb: 1 }}>Manufacturer Options (up to 3, optional)</Typography>
                <Grid container spacing={1}>
                  {[0,1,2].map(idx => (
                    <Grid item xs={12} sm={4} key={idx}>
                      <TextField fullWidth size="small" label={`Option ${idx+1}`} value={formData.manufacturer_options[idx] || ''} onChange={(e) => handleManOptionChange(idx, e.target.value)} placeholder="Manufacturer name" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600, mb: 1 }}>Model Options (up to 3, optional)</Typography>
                <Grid container spacing={1}>
                  {[0,1,2].map(idx => (
                    <Grid item xs={12} sm={4} key={idx}>
                      <TextField fullWidth size="small" label={`Option ${idx+1}`} value={formData.model_options[idx] || ''} onChange={(e) => handleModelOptionChange(idx, e.target.value)} placeholder="Model name" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleFormChange} InputProps={{ inputProps: { min: 1 } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Estimated Cost" name="estimated_cost" type="number" value={formData.estimated_cost} onChange={handleFormChange} InputProps={{ inputProps: { min: 0, step: 0.01 } }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Currency</InputLabel>
                  <Select name="currency" value={formData.currency} onChange={handleFormChange} label="Currency" sx={{ borderRadius: 2, '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }}>
                    <MenuItem value="PKR">PKR (Pakistani Rupee)</MenuItem>
                    <MenuItem value="USD">USD (US Dollar)</MenuItem>
                    <MenuItem value="EUR">EUR (Euro)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Priority</InputLabel>
                  <Select name="priority" value={formData.priority} onChange={handleFormChange} label="Priority" sx={{ borderRadius: 2, '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }}>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Requested By" name="requested_by" value={formData.requested_by} onChange={handleFormChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.lightText }}>Department</InputLabel>
                  <Select name="department_name" value={formData.department_name} onChange={handleFormChange} label="Department" sx={{ borderRadius: 2, '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }}>
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                    <Divider />
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Justification" name="justification" value={formData.justification} onChange={handleFormChange} multiline rows={3} placeholder="Explain why this equipment is needed..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600 }} gutterBottom>
                  <AttachFile sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                  Attach Documents (Quotes, Specifications, etc.)
                </Typography>
                <FileUpload
                  endpoint="/api/upload"
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
                    setFormData(prev => ({ ...prev, attachments: updatedFiles.join(',') }))
                    toast.success(`${files.length} document(s) uploaded successfully`)
                  }}
                  onUploadError={(error) => toast.error('Upload failed: ' + error)}
                  onDelete={(file) => {
                    const currentFiles = formData.attachments?.split(',') || []
                    const updatedFiles = currentFiles.filter(f => f !== file.url)
                    setFormData(prev => ({ ...prev, attachments: updatedFiles.join(',') }))
                    toast.info('Document removed')
                  }}
                  existingFiles={formData.attachments ? formData.attachments.split(',').filter(Boolean).map(url => ({ url, name: url.split('/').pop(), type: 'document' })) : []}
                />
                {formData.attachments && formData.attachments.split(',').filter(Boolean).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.lightText }}>{formData.attachments.split(',').filter(Boolean).length} document(s) attached</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button onClick={handleCloseDialog} sx={{ color: colors.darkNavy, borderRadius: 2, px: 3, textTransform: 'none', '&:hover': { backgroundColor: 'rgba(103, 232, 249, 0.04)' } }}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ bgcolor: colors.darkNavy, color: colors.text, borderRadius: 2, px: 4, textTransform: 'none', boxShadow: `0 4px 16px ${colors.lightCyanGlow}`, '&:hover': { bgcolor: colors.darkNavyHover, boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}` }, '&.Mui-disabled': { bgcolor: '#bdbdbd' }, transition: 'all 0.3s ease' }}>
              {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (editingRequest ? 'Update' : 'Submit Request')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ===== VIEW DETAILS DIALOG ===== */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, border: `1px solid ${colors.borderColor}`, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', margin: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ bgcolor: colors.darkNavy, color: 'white', borderRadius: '8px 8px 0 0', py: { xs: 2, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              <LocalShipping sx={{ fontSize: { xs: 22, sm: 28 } }} />
              Procurement Request Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white', '&:hover': { color: colors.lightCyan } }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
          {viewingRequest && (
            <Grid container spacing={2.5} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy }}>{viewingRequest.equipment_name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={viewingRequest.status} size="small" sx={{ bgcolor: getStatusColor(viewingRequest.status), color: 'white', fontWeight: 600, fontSize: '11px', height: 26, borderRadius: 2 }} />
                    <Chip label={viewingRequest.priority} size="small" sx={{ bgcolor: getPriorityColor(viewingRequest.priority), color: 'white', fontWeight: 600, fontSize: '11px', height: 26, borderRadius: 2 }} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}><Divider sx={{ borderColor: colors.borderColor }} /></Grid>

              {/* Status Timeline with Comments */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600, mb: 2 }}>Workflow Progress</Typography>
                <Stepper activeStep={getCurrentStep(viewingRequest.status)} orientation="vertical">
                  {STEPS.map((step, index) => {
                    const isActive = index === getCurrentStep(viewingRequest.status)
                    const isCompleted = index < getCurrentStep(viewingRequest.status)
                    const comment = viewingRequest.step_comments?.[step] || ''
                    return (
                      <Step key={step} active={isActive || isCompleted} completed={isCompleted}>
                        <StepLabel StepIconComponent={() => (
                          <Avatar sx={{ bgcolor: isActive || isCompleted ? getStatusColor(step) : '#e0e0e0', width: 24, height: 24, fontSize: 14, color: 'white' }}>
                            {index + 1}
                          </Avatar>
                        )}>
                          {step}
                          {isActive && <Chip label="Current" size="small" sx={{ ml: 1, bgcolor: colors.lightCyan, color: colors.darkNavy, height: 18, fontSize: '10px' }} />}
                        </StepLabel>
                        <StepContent>
                          {comment && (
                            <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: colors.mainBg, borderRadius: 2, borderColor: colors.borderColor }}>
                              <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mb: 0.5 }}>
                                <Comment sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} /> Comment:
                              </Typography>
                              <Typography variant="body2" sx={{ color: colors.darkNavy }}>{comment}</Typography>
                            </Paper>
                          )}
                          {isActive && viewingRequest.status !== 'REJECTED' && viewingRequest.status !== 'EQUIPMENT TESTED & COMMISSIONED FOR USE' && canComment && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                              <TextField size="small" placeholder="Add a comment (reason if stuck)..." value={stepComment} onChange={(e) => setStepComment(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: colors.lightCyan }, '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark } } }} />
                              <IconButton color="primary" onClick={handleAddComment} disabled={!stepComment.trim()} sx={{ bgcolor: colors.darkNavy, color: 'white', '&:hover': { bgcolor: colors.darkNavyHover }, '&.Mui-disabled': { bgcolor: colors.borderColor, color: colors.lightText } }}>
                                <Send fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </StepContent>
                      </Step>
                    )
                  })}
                </Stepper>
              </Grid>

              <Grid item xs={12}><Divider sx={{ borderColor: colors.borderColor }} /></Grid>

              {/* Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Hospital</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontWeight: 500 }}>{viewingRequest.hospital_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Category</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>{viewingRequest.category_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Manufacturer Options</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>{(viewingRequest.manufacturer_options || []).join(', ') || 'None specified'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Model Options</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>{(viewingRequest.model_options || []).join(', ') || 'None specified'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Quantity</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>{viewingRequest.quantity}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Estimated Cost</Typography>
                <Typography variant="body1" sx={{ color: colors.lightCyanDark, fontWeight: 600 }}>
                  {viewingRequest.estimated_cost ? formatAmount(viewingRequest.estimated_cost, viewingRequest.currency) : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Requested By</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>{viewingRequest.requested_by_name || viewingRequest.requested_by || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Department</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>{viewingRequest.department_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block' }}>Justification</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: colors.mainBg, borderRadius: 2, borderColor: colors.borderColor }}>
                  <Typography variant="body2" sx={{ color: colors.darkNavy }}>{viewingRequest.justification || 'No justification provided'}</Typography>
                </Paper>
              </Grid>

              {/* Attachments */}
              {viewingRequest.attachments && viewingRequest.attachments.split(',').filter(Boolean).length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
                  <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 600, display: 'block', mb: 1 }}>
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                    Attached Documents ({viewingRequest.attachments.split(',').filter(Boolean).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {viewingRequest.attachments.split(',').filter(Boolean).map((url, index) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                      const isPDF = url.match(/\.(pdf)$/i)
                      return (
                        <Button key={index} variant="outlined" size="small" startIcon={isImage ? <Image /> : isPDF ? <PictureAsPdf /> : <Description />} href={getFullUrl(url)} target="_blank" sx={{ textTransform: 'none', borderRadius: 2, borderColor: colors.borderColor, color: colors.darkNavy, '&:hover': { borderColor: colors.lightCyan, backgroundColor: 'rgba(103, 232, 249, 0.04)' } }}>
                          {url.split('/').pop().substring(0, 25)}
                        </Button>
                      )
                    })}
                  </Box>
                </Grid>
              )}

              {/* ============================================================
                  ✅ STATUS TRANSITION BUTTONS (NEW WORKFLOW)
              ============================================================ */}
              {viewingRequest.status !== 'REJECTED' && viewingRequest.status !== 'EQUIPMENT TESTED & COMMISSIONED FOR USE' && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2, borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" sx={{ color: colors.lightText, fontWeight: 600, mb: 1 }}>Advance Workflow</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewingRequest.status === 'PURCHASE CASE INITIATED' && canApprove && (
                      <Button size="small" variant="contained" onClick={() => transitionStatus(viewingRequest.id, 'CASE APPROVED')} startIcon={<CheckCircle />} sx={{ bgcolor: colors.success, color: 'white', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#16A34A', boxShadow: `0 4px 16px rgba(34, 197, 94, 0.3)` } }}>
                        Approve Case
                      </Button>
                    )}
                    {viewingRequest.status === 'CASE APPROVED' && canApprove && (
                      <Button size="small" variant="contained" onClick={() => transitionStatus(viewingRequest.id, 'P.O ISSUED')} startIcon={<Description />} sx={{ bgcolor: colors.info, color: 'white', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#2563EB', boxShadow: `0 4px 16px rgba(59, 130, 246, 0.3)` } }}>
                        Issue P.O
                      </Button>
                    )}
                    {viewingRequest.status === 'P.O ISSUED' && canApprove && (
                      <Button size="small" variant="contained" onClick={() => transitionStatus(viewingRequest.id, 'SHIPMENT ARRIVED')} startIcon={<LocalShipping />} sx={{ bgcolor: colors.success, color: 'white', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#16A34A', boxShadow: `0 4px 16px rgba(34, 197, 94, 0.3)` } }}>
                        Shipment Arrived
                      </Button>
                    )}
                    {viewingRequest.status === 'SHIPMENT ARRIVED' && canApprove && (
                      <Button size="small" variant="contained" onClick={() => transitionStatus(viewingRequest.id, 'EQUIPMENT INSTALLED')} startIcon={<CheckCircle />} sx={{ bgcolor: colors.success, color: 'white', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#16A34A', boxShadow: `0 4px 16px rgba(34, 197, 94, 0.3)` } }}>
                        Equipment Installed
                      </Button>
                    )}
                    {viewingRequest.status === 'EQUIPMENT INSTALLED' && canApprove && (
                      <Button size="small" variant="contained" onClick={() => transitionStatus(viewingRequest.id, 'EQUIPMENT TESTED & COMMISSIONED FOR USE')} startIcon={<CheckCircle />} sx={{ bgcolor: colors.success, color: 'white', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#16A34A', boxShadow: `0 4px 16px rgba(34, 197, 94, 0.3)` } }}>
                        Test & Commission
                      </Button>
                    )}
                    {canApprove && viewingRequest.status !== 'REJECTED' && viewingRequest.status !== 'EQUIPMENT TESTED & COMMISSIONED FOR USE' && (
                      <Button size="small" variant="contained" color="error" onClick={() => transitionStatus(viewingRequest.id, 'REJECTED')} startIcon={<Cancel />} sx={{ bgcolor: colors.error, color: 'white', borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#DC2626', boxShadow: `0 4px 16px rgba(239, 68, 68, 0.3)` } }}>
                        Reject
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
          <Button onClick={handleCloseView} variant="contained" sx={{ bgcolor: colors.darkNavy, color: colors.text, borderRadius: 2, px: { xs: 3, sm: 4 }, textTransform: 'none', boxShadow: `0 4px 16px ${colors.lightCyanGlow}`, '&:hover': { bgcolor: colors.darkNavyHover, boxShadow: `0 6px 24px ${colors.lightCyanGlowStrong}` }, transition: 'all 0.3s ease' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Procurement