// src/pages/Procurement.jsx
// ✅ SUPER_ADMIN: Full access (Create, Edit, Delete, Approve, Reject, Review, Mark Procured)
// ✅ ENGINEER: Create, Edit, Delete, Review, Mark Procured (EXCEPT Approve/Reject)
// ❌ HOSPITAL_ADMIN: Access Denied

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
  CardContent
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
  AttachFile,
  Print,
  Image,
  PictureAsPdf,
  Engineering as EngineeringIcon,
  AdminPanelSettings
} from '@mui/icons-material'
import { procurementService, equipmentService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'

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

const Procurement = () => {
  // ============================================================
  // ✅ PROCUREMENT - PERMISSIONS
  // ============================================================
  const { user } = useSelector((state) => state.auth)

  // ✅ HOSPITAL_ADMIN - Access Denied
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Equipment Procurement." />
  }

  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  // ✅ PERMISSIONS
  // ✅ ENGINEER & SUPER_ADMIN: Create, Edit, Delete, Review, Mark Procured
  // ✅ SUPER_ADMIN ONLY: Approve, Reject
  const canCreate = isEngineer || isSuperAdmin
  const canEdit = isEngineer || isSuperAdmin
  const canDelete = isEngineer || isSuperAdmin
  const canReview = isEngineer || isSuperAdmin
  const canMarkProcured = isEngineer || isSuperAdmin
  const canApprove = isSuperAdmin // ✅ ONLY Super Admin can approve/reject

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

      console.log('📤 Submitting procurement data:', submitData)

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
      console.error('❌ Submit error:', error)
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
      console.log('🗑️ Deleting procurement request:', deletingRequest.id)
      console.log('📌 Status:', deletingRequest.status)
      
      const response = await procurementService.delete(deletingRequest.id)
      console.log('✅ Delete response:', response.data)
      
      toast.success(`Request "${deletingRequest.equipment_name}" deleted successfully`)
      fetchRequests()
      setOpenDeleteDialog(false)
      setDeletingRequest(null)
      handleCloseView()
    } catch (error) {
      console.error('❌ Delete error:', error)
      console.error('❌ Error response:', error.response?.data)
      
      let errorMessage = 'Failed to delete request'
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Cannot delete this request'
          setDeleteError({
            type: 'status_error',
            message: errorMessage
          })
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this request'
        } else if (error.response.status === 404) {
          errorMessage = 'Request not found'
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
      const response = await procurementService.update(id, { status: 'Approved' })
      console.log('✅ Approve response:', response.data)
      toast.success('Procurement request approved')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      console.error('❌ Approve error:', error)
      toast.error(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleReject = async (id) => {
    if (!canApprove) {
      toast.error('Only Super Admin can reject requests')
      return
    }
    
    try {
      const response = await procurementService.update(id, { status: 'Rejected' })
      console.log('✅ Reject response:', response.data)
      toast.success('Procurement request rejected')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      console.error('❌ Reject error:', error)
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const handleReview = async (id) => {
    if (!canReview) {
      toast.error('You do not have permission to review requests')
      return
    }
    
    try {
      const response = await procurementService.update(id, { status: 'Under Review' })
      console.log('✅ Review response:', response.data)
      toast.success('Request moved to Under Review')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      console.error('❌ Review error:', error)
      toast.error(error.response?.data?.message || 'Failed to review request')
    }
  }

  const handleMarkProcured = async (id) => {
    if (!canMarkProcured) {
      toast.error('You do not have permission to mark as procured')
      return
    }
    
    try {
      const response = await procurementService.update(id, { status: 'Procured' })
      console.log('✅ Mark Procured response:', response.data)
      toast.success('Request marked as Procured')
      fetchRequests()
      handleCloseView()
    } catch (error) {
      console.error('❌ Mark Procured error:', error)
      toast.error(error.response?.data?.message || 'Failed to mark as procured')
    }
  }

  // ============ EXPORT FUNCTIONS ============
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  const exportToCSV = () => {
    try {
      const headers = ['Equipment', 'Hospital', 'Manufacturer', 'Model', 'Quantity', 'Est. Cost', 'Priority', 'Status', 'Justification']
      const rows = filteredRequests.map(r => [
        r.equipment_name,
        r.hospital_name || 'N/A',
        r.manufacturer || '',
        r.model || '',
        r.quantity || 1,
        r.estimated_cost || '',
        r.priority,
        r.status,
        r.justification || ''
      ])
      
      let csv = headers.join(',') + '\n'
      rows.forEach(row => {
        csv += row.join(',') + '\n'
      })
      
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
          'Manufacturer': r.manufacturer || '',
          'Model': r.model || '',
          'Quantity': r.quantity || 1,
          'Est. Cost': r.estimated_cost || '',
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
      }).catch(() => {
        toast.error('Excel library not loaded')
      })
    } catch (error) {
      toast.error('Failed to export Excel')
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

  // Stats
  const totalRequests = requests.length
  const pendingRequests = requests.filter(r => r.status === 'Requested' || r.status === 'Under Review').length
  const approvedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'Procured').length
  const rejectedRequests = requests.filter(r => r.status === 'Rejected').length
  const urgentRequests = requests.filter(r => r.priority === 'Urgent' && r.status !== 'Rejected').length

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      {/* ✅ Header - Role Chips */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
            Equipment Procurement
          </Typography>
          {isEngineer && (
            <Chip 
              icon={<EngineeringIcon sx={{ fontSize: 16 }} />}
              label="Engineer Mode" 
              size="small" 
              color="info" 
            />
          )}
          {isSuperAdmin && (
            <Chip 
              icon={<AdminPanelSettings sx={{ fontSize: 16 }} />}
              label="Super Admin" 
              size="small" 
              color="warning" 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchRequests}
            size="small"
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
            >
              Request Equipment
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#0B5FA5" fontWeight={700}>
                {totalRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">Total Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight={700}>
                {pendingRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">Pending Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight={700}>
                {approvedRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">Approved/Procured</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#ffebee' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main" fontWeight={700}>
                {rejectedRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fce4ec' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main" fontWeight={700}>
                {urgentRequests}
              </Typography>
              <Typography variant="body2" color="textSecondary">Urgent</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Urgent Alert */}
      {urgentRequests > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          icon={<Warning />}
          action={
            <Button 
              color="error" 
              size="small"
              onClick={() => setFilters({ ...filters, priority: 'Urgent' })}
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

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search requests..."
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
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Requested">Requested</MenuItem>
              <MenuItem value="Under Review">Under Review</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Procured">Procured</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={handleExportClick}
          >
            Export
          </Button>
        </Box>
      </Paper>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{ sx: { p: 1, width: 200 } }}
      >
        <MenuItem onClick={exportToCSV}>
          <FileDownload sx={{ mr: 1, fontSize: 20 }} /> Export CSV
        </MenuItem>
        <MenuItem onClick={exportToExcel}>
          <FileDownload sx={{ mr: 1, fontSize: 20 }} /> Export Excel
        </MenuItem>
      </Menu>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Manufacturer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Model</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Qty</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Est. Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No procurement requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalShipping sx={{ fontSize: 18, color: '#0B5FA5' }} />
                      <Typography variant="body2" fontWeight={500}>
                        {request.equipment_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{request.hospital_name}</TableCell>
                  <TableCell>{request.manufacturer || '-'}</TableCell>
                  <TableCell>{request.model || '-'}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>
                    {request.estimated_cost ? `$${parseFloat(request.estimated_cost).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      color={
                        request.priority === 'Urgent' ? 'error' :
                        request.priority === 'High' ? 'warning' :
                        request.priority === 'Medium' ? 'info' : 'default'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      size="small"
                      color={
                        request.status === 'Approved' || request.status === 'Procured' ? 'success' :
                        request.status === 'Rejected' ? 'error' :
                        request.status === 'Under Review' ? 'info' :
                        'default'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" onClick={() => handleView(request)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {(request.status === 'Requested' || request.status === 'Under Review') && canEdit && (
                        <Tooltip title="Edit">
                          <IconButton size="small" color="info" onClick={() => handleOpenDialog(request)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {canDelete && (
                        <Tooltip title="Delete Request">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteClick(request)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {request.status === 'Requested' && canReview && (
                        <Tooltip title="Start Review">
                          <IconButton 
                            size="small" 
                            color="info" 
                            onClick={() => handleReview(request.id)}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {request.status === 'Under Review' && canApprove && (
                        <>
                          <Tooltip title="Approve Request">
                            <IconButton size="small" color="success" onClick={() => handleApprove(request.id)}>
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Request">
                            <IconButton size="small" color="error" onClick={() => handleReject(request.id)}>
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {request.status === 'Approved' && canMarkProcured && (
                        <Tooltip title="Mark as Procured">
                          <IconButton 
                            size="small" 
                            color="success" 
                            onClick={() => handleMarkProcured(request.id)}
                          >
                            <CheckCircle />
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

      {/* Add/Edit Dialog */}
      {canCreate && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalShipping sx={{ color: 'white' }} />
                <Typography variant="h6" fontWeight={600}>
                  {editingRequest ? 'Edit Procurement Request' : 'New Procurement Request'}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Hospital</InputLabel>
                  <Select
                    name="hospital_id"
                    value={formData.hospital_id}
                    onChange={handleFormChange}
                    label="Hospital"
                    required
                  >
                    <MenuItem value="">Select Hospital</MenuItem>
                    {hospitals.map(h => (
                      <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleFormChange}
                    label="Category"
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {equipment.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
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
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  name="model"
                  value={formData.model}
                  onChange={handleFormChange}
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
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Estimated Cost ($)"
                  name="estimated_cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={handleFormChange}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    label="Priority"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
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
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
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
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
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
                    console.log('📄 Documents uploaded:', files)
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
                    <Typography variant="caption" color="textSecondary">
                      {formData.attachments.split(',').filter(Boolean).length} document(s) attached
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
            >
              {editingRequest ? 'Update' : 'Submit Request'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
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
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ color: '#f44336', fontSize: 28 }} />
            <Typography variant="h6">Delete Procurement Request</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {deleteError?.type === 'status_error' ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  Cannot Delete Request
                </Typography>
                <Typography variant="body2">
                  {deleteError.message}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Please contact Super Admin if you need to delete this request.
                </Typography>
              </Alert>
            ) : (
              <>
                <Typography variant="body1" gutterBottom>
                  Are you sure you want to delete this procurement request?
                </Typography>
                
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#fff3e0', 
                    borderRadius: 1,
                    border: '1px solid #ffcc80'
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Equipment: {deletingRequest?.equipment_name}
                  </Typography>
                  {deletingRequest?.manufacturer && (
                    <Typography variant="body2" color="textSecondary">
                      Manufacturer: {deletingRequest.manufacturer}
                    </Typography>
                  )}
                  {deletingRequest?.model && (
                    <Typography variant="body2" color="textSecondary">
                      Model: {deletingRequest.model}
                    </Typography>
                  )}
                  <Typography variant="body2" color="textSecondary">
                    Status: {deletingRequest?.status}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Priority: {deletingRequest?.priority}
                  </Typography>
                </Paper>

                <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
                  ⚠️ This action cannot be undone.
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setOpenDeleteDialog(false)
              setDeletingRequest(null)
              setDeleteError(null)
            }}
            disabled={deleting}
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
            >
              {deleting ? 'Deleting...' : 'Delete Request'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={600}>
              Procurement Request Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingRequest && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {viewingRequest.equipment_name}
                  </Typography>
                  <Box>
                    <Chip
                      label={viewingRequest.status}
                      size="small"
                      color={
                        viewingRequest.status === 'Approved' || viewingRequest.status === 'Procured' ? 'success' :
                        viewingRequest.status === 'Rejected' ? 'error' :
                        viewingRequest.status === 'Under Review' ? 'info' :
                        'default'
                      }
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={viewingRequest.priority}
                      size="small"
                      color={
                        viewingRequest.priority === 'Urgent' ? 'error' :
                        viewingRequest.priority === 'High' ? 'warning' :
                        viewingRequest.priority === 'Medium' ? 'info' : 'default'
                      }
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Status Timeline */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                  Request Status Timeline
                </Typography>
                <Stepper activeStep={getCurrentStep(viewingRequest.status)} orientation="vertical">
                  {getStatusSteps().map((step, index) => (
                    <Step key={step}>
                      <StepLabel
                        StepIconComponent={({ active, completed }) => {
                          const colors = {
                            'Requested': '#ff9800',
                            'Under Review': '#2196f3',
                            'Approved': '#4caf50',
                            'Procured': '#4caf50'
                          }
                          return (
                            <Avatar sx={{
                              bgcolor: active || completed ? colors[step] : '#e0e0e0',
                              width: 24,
                              height: 24,
                              fontSize: 14
                            }}>
                              {index + 1}
                            </Avatar>
                          )
                        }}
                      >
                        {step}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" color="textSecondary">
                          {step === viewingRequest.status ? 'Current status' :
                            getCurrentStep(viewingRequest.status) > index ? 'Completed' : 'Pending'}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Hospital</Typography>
                <Typography variant="body1" fontWeight={500}>{viewingRequest.hospital_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Category</Typography>
                <Typography variant="body1">{viewingRequest.category_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Manufacturer</Typography>
                <Typography variant="body1">{viewingRequest.manufacturer || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Model</Typography>
                <Typography variant="body1">{viewingRequest.model || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Quantity</Typography>
                <Typography variant="body1">{viewingRequest.quantity}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Estimated Cost</Typography>
                <Typography variant="body1" fontWeight={600} color="#0B5FA5">
                  {viewingRequest.estimated_cost ? `$${parseFloat(viewingRequest.estimated_cost).toFixed(2)}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Requested By</Typography>
                <Typography variant="body1">{viewingRequest.requested_by || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Department</Typography>
                <Typography variant="body1">{viewingRequest.department || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Justification</Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body1">
                    {viewingRequest.justification || 'No justification provided'}
                  </Typography>
                </Paper>
              </Grid>

              {/* Attachments */}
              {viewingRequest.attachments && viewingRequest.attachments.split(',').filter(Boolean).length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="textSecondary" gutterBottom>
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
                          sx={{ textTransform: 'none' }}
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
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => {
                        handleCloseView()
                        handleDeleteClick(viewingRequest)
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
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    Update Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewingRequest.status === 'Requested' && canReview && (
                      <Button
                        size="small"
                        variant="contained"
                        color="info"
                        onClick={() => handleReview(viewingRequest.id)}
                        startIcon={<Info />}
                      >
                        Start Review
                      </Button>
                    )}
                    {viewingRequest.status === 'Under Review' && canApprove && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleApprove(viewingRequest.id)}
                          startIcon={<CheckCircle />}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleReject(viewingRequest.id)}
                          startIcon={<Cancel />}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {viewingRequest.status === 'Under Review' && !canApprove && (
                      <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body2">
                          <strong>Waiting for Super Admin approval.</strong> Only Super Admin can approve or reject requests.
                        </Typography>
                      </Alert>
                    )}
                    {viewingRequest.status === 'Approved' && canMarkProcured && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleMarkProcured(viewingRequest.id)}
                        startIcon={<CheckCircle />}
                      >
                        Mark as Procured
                      </Button>
                    )}
                    {viewingRequest.status === 'Approved' && !canMarkProcured && (
                      <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body2">
                          <strong>Request Approved!</strong> Mark as Procured when equipment is received.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </Grid>
              )}

              {/* View Only Message for Rejected */}
              {viewingRequest.status === 'Rejected' && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>This request has been rejected.</strong> No further actions can be taken.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* View Only Message for Procured */}
              {viewingRequest.status === 'Procured' && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Equipment has been procured!</strong> This request is complete.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView}>Close</Button>
          {viewingRequest && viewingRequest.status !== 'Rejected' && viewingRequest.status !== 'Procured' && canEdit && (
            <Button 
              variant="contained" 
              startIcon={<Print />} 
              sx={{ bgcolor: '#0B5FA5' }}
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