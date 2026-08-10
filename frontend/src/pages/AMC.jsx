// src/pages/AMC.jsx - COMPLETE WITH EDIT DATA FIX

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
  CalendarToday,
  AttachFile,
  Refresh,
  FileDownload,
  FilterList,
  TrendingUp,
  TrendingDown,
  Warning,
  Autorenew,
  Description,
  Business
} from '@mui/icons-material'
import { amcService, equipmentService } from '../api/services'
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

// ✅ Helper to format date for input fields
const formatDateForInput = (date) => {
  if (!date) return ''
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

const AMC = () => {
  const { user } = useSelector((state) => state.auth)
  
  // ✅ HOSPITAL_ADMIN cannot access AMC
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access AMC Contracts." />
  }
  
  // ✅ UPDATED PERMISSIONS
  // ✅ SUPER_ADMIN: Can VIEW, RENEW, DELETE (NO CREATE, NO EDIT)
  // ✅ ENGINEER: Can VIEW, CREATE, EDIT (NO RENEW, NO DELETE)
  const canCreate = user?.role === 'ENGINEER'  // ✅ ONLY ENGINEER CAN CREATE
  const canEdit = user?.role === 'ENGINEER'    // ✅ ONLY ENGINEER CAN EDIT
  const canDelete = user?.role === 'SUPER_ADMIN'  // ✅ ONLY SUPER ADMIN CAN DELETE
  const canRenew = user?.role === 'SUPER_ADMIN'   // ✅ ONLY SUPER ADMIN CAN RENEW
  const canView = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER'

  const [contracts, setContracts] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [viewingContract, setViewingContract] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  
  const [openRenewDialog, setOpenRenewDialog] = useState(false)
  const [renewData, setRenewData] = useState({
    id: null,
    end_date: '',
    cost: ''
  })
  
  const [filters, setFilters] = useState({
    status: ''
  })
  
  const [formData, setFormData] = useState({
    equipment_id: '',
    vendor_name: '',
    contract_number: '',
    start_date: '',
    end_date: '',
    cost: '',
    contact_person: '',
    contact_phone: '',
    status: 'Active',
    notes: '',
    documents: ''
  })

  useEffect(() => {
    fetchContracts()
    fetchEquipment()
  }, [])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const response = await amcService.getAll()
      setContracts(response.data.contracts || [])
    } catch (error) {
      console.error('Fetch contracts error:', error)
      toast.error('Failed to fetch AMC contracts')
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getAll()
      setEquipment(response.data.equipment || [])
    } catch (error) {
      console.error('Fetch equipment error:', error)
    }
  }

  // ✅ UPDATED: All data shows in edit form
  const handleOpenDialog = (contract = null) => {
    // ✅ Only Engineer can create/edit
    if (contract && !canEdit) {
      toast.error('Only Engineers can edit AMC contracts')
      return
    }
    if (!contract && !canCreate) {
      toast.error('Only Engineers can create AMC contracts')
      return
    }
    
    if (contract) {
      setEditingContract(contract)
      
      // ✅ ALL DATA SHOWS IN EDIT FORM
      setFormData({
        equipment_id: contract.equipment_id || '',
        vendor_name: contract.vendor_name || '',
        contract_number: contract.contract_number || '',
        start_date: formatDateForInput(contract.start_date),  // ✅ Formatted date
        end_date: formatDateForInput(contract.end_date),      // ✅ Formatted date
        cost: contract.cost || '',
        contact_person: contract.contact_person || '',
        contact_phone: contract.contact_phone || '',
        status: contract.status || 'Active',
        notes: contract.notes || '',
        documents: contract.documents || ''
      })
      
      console.log('📝 Editing contract data:', {
        id: contract.id,
        equipment_id: contract.equipment_id,
        vendor_name: contract.vendor_name,
        contract_number: contract.contract_number,
        start_date: contract.start_date,
        end_date: contract.end_date,
        cost: contract.cost,
        contact_person: contract.contact_person,
        contact_phone: contract.contact_phone,
        status: contract.status,
        notes: contract.notes,
        documents: contract.documents
      })
      
    } else {
      setEditingContract(null)
      setFormData({
        equipment_id: '',
        vendor_name: '',
        contract_number: '',
        start_date: '',
        end_date: '',
        cost: '',
        contact_person: '',
        contact_phone: '',
        status: 'Active',
        notes: '',
        documents: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingContract(null)
  }

  const handleView = (contract) => {
    setViewingContract(contract)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingContract(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    // ✅ Only Engineer can submit
    if (!canCreate && !canEdit) {
      toast.error('Only Engineers can create or edit AMC contracts')
      return
    }
    
    try {
      const submitData = {
        ...formData,
        documents: formData.documents || ''
      }
      
      console.log('📤 Submitting AMC data:', submitData)
      
      if (editingContract) {
        await amcService.update(editingContract.id, submitData)
        toast.success('AMC contract updated successfully')
      } else {
        await amcService.create(submitData)
        toast.success('AMC contract created successfully')
      }
      fetchContracts()
      handleCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    // ✅ ONLY Super Admin can delete
    if (!canDelete) {
      toast.error('Only Super Admin can delete AMC contracts')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this AMC contract?')) {
      try {
        await amcService.delete(id)
        toast.success('AMC contract deleted successfully')
        fetchContracts()
      } catch (error) {
        toast.error('Failed to delete contract')
      }
    }
  }

  const handleRenew = (contract) => {
    // ✅ ONLY Super Admin can renew
    if (!canRenew) {
      toast.error('Only Super Admin can renew AMC contracts')
      return
    }
    setRenewData({
      id: contract.id,
      end_date: contract.end_date || '',
      cost: contract.cost || ''
    })
    setOpenRenewDialog(true)
  }

  const handleRenewSubmit = async () => {
    try {
      await amcService.renew(renewData.id, {
        end_date: renewData.end_date,
        cost: renewData.cost
      })
      toast.success('AMC contract renewed successfully')
      fetchContracts()
      setOpenRenewDialog(false)
    } catch (error) {
      console.error('Renew error:', error)
      toast.error(error.response?.data?.message || 'Failed to renew AMC contract')
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
      const headers = ['Equipment', 'Vendor', 'Contract #', 'Start Date', 'End Date', 'Cost', 'Status', 'Contact Person', 'Contact Phone']
      const rows = filteredContracts.map(c => [
        c.equipment_name || 'N/A',
        c.vendor_name,
        c.contract_number || 'N/A',
        c.start_date || '',
        c.end_date || '',
        c.cost || '',
        c.status,
        c.contact_person || '',
        c.contact_phone || ''
      ])
      
      let csv = headers.join(',') + '\n'
      rows.forEach(row => {
        csv += row.join(',') + '\n'
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `amc_contracts_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('CSV exported successfully!')
      handleExportClose()
    } catch (error) {
      toast.error('Failed to export CSV: ' + error.message)
    }
  }

  const exportToExcel = () => {
    try {
      import('xlsx').then((XLSX) => {
        const data = filteredContracts.map(c => ({
          'Equipment': c.equipment_name || 'N/A',
          'Vendor': c.vendor_name,
          'Contract #': c.contract_number || 'N/A',
          'Start Date': c.start_date || '',
          'End Date': c.end_date || '',
          'Cost': c.cost || '',
          'Status': c.status,
          'Contact Person': c.contact_person || '',
          'Contact Phone': c.contact_phone || ''
        }))
        
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'AMC Contracts')
        XLSX.writeFile(wb, `amc_contracts_${new Date().toISOString().split('T')[0]}.xlsx`)
        
        toast.success('Excel exported successfully!')
        handleExportClose()
      }).catch(() => {
        toast.error('Excel library not loaded. Please install xlsx.')
      })
    } catch (error) {
      toast.error('Failed to export Excel: ' + error.message)
    }
  }

  const exportToPDF = () => {
    try {
      Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]).then(([jsPDFModule, autoTableModule]) => {
        const { default: jsPDF } = jsPDFModule
        const { default: autoTable } = autoTableModule
        
        const doc = new jsPDF()
        
        doc.setFontSize(18)
        doc.setTextColor('#0B5FA5')
        doc.text('AMC Contracts Report', 14, 20)
        
        doc.setFontSize(10)
        doc.setTextColor('#666666')
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
        doc.text(`Total Contracts: ${filteredContracts.length}`, 14, 34)
        
        const tableData = filteredContracts.map(c => [
          c.equipment_name || 'N/A',
          c.vendor_name,
          c.contract_number || 'N/A',
          c.start_date || '',
          c.end_date || '',
          c.status
        ])
        
        autoTable(doc, {
          head: [['Equipment', 'Vendor', 'Contract #', 'Start Date', 'End Date', 'Status']],
          body: tableData,
          startY: 40,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: '#0B5FA5', textColor: '#FFFFFF', fontSize: 9, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: '#F5F7FA' },
          margin: { left: 14, right: 14 }
        })
        
        doc.save(`amc_contracts_${new Date().toISOString().split('T')[0]}.pdf`)
        
        toast.success('PDF exported successfully!')
        handleExportClose()
      }).catch((err) => {
        console.error('PDF export error:', err)
        toast.error('PDF export failed: ' + err.message)
      })
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Failed to export PDF: ' + error.message)
    }
  }

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const getExpiryStatus = (endDate) => {
    if (!endDate) return { color: 'default', label: 'No Date' }
    const today = new Date()
    const end = new Date(endDate)
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { color: 'error', label: 'Expired' }
    if (diffDays <= 7) return { color: 'error', label: `Expiring in ${diffDays}d` }
    if (diffDays <= 30) return { color: 'warning', label: `Expiring in ${diffDays}d` }
    return { color: 'success', label: 'Active' }
  }

  // Stats
  const totalContracts = contracts.length
  const activeContracts = contracts.filter(c => c.status === 'Active').length
  const expiredContracts = contracts.filter(c => c.status === 'Expired').length
  const pendingContracts = contracts.filter(c => c.status === 'Pending').length
  const expiringSoon = contracts.filter(c => isExpiringSoon(c.end_date) && c.status === 'Active').length

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || contract.status === filters.status
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      {/* ✅ Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
            Annual Maintenance Contracts (AMC)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchContracts}
            size="small"
          >
            Refresh
          </Button>
          {/* ✅ ONLY ENGINEER CAN CREATE */}
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: '#0B5FA5',
                '&:hover': { bgcolor: '#084a8a' }
              }}
            >
              Add AMC
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#0B5FA5" fontWeight={700}>
                {totalContracts}
              </Typography>
              <Typography variant="body2" color="textSecondary">Total Contracts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight={700}>
                {activeContracts}
              </Typography>
              <Typography variant="body2" color="textSecondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight={700}>
                {pendingContracts}
              </Typography>
              <Typography variant="body2" color="textSecondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#ffebee' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main" fontWeight={700}>
                {expiredContracts}
              </Typography>
              <Typography variant="body2" color="textSecondary">Expired</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Expiring Soon Alert */}
      {expiringSoon > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          icon={<Warning />}
          action={
            <Button 
              color="warning" 
              size="small"
              onClick={() => setFilters({ ...filters, status: 'Active' })}
            >
              View All
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>{expiringSoon}</strong> AMC contract{expiringSoon > 1 ? 's are' : ' is'} expiring within the next 30 days.
          </Typography>
        </Alert>
      )}

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search AMC contracts..."
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
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
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
        <MenuItem onClick={exportToPDF}>
          <FileDownload sx={{ mr: 1, fontSize: 20 }} /> Export PDF
        </MenuItem>
      </Menu>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Vendor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Contract #</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>End Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No AMC contracts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => {
                const expiryStatus = getExpiryStatus(contract.end_date)
                return (
                  <TableRow key={contract.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {contract.equipment_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{contract.vendor_name}</TableCell>
                    <TableCell>
                      {contract.contract_number || 'N/A'}
                    </TableCell>
                    <TableCell>{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {contract.cost ? `$${parseFloat(contract.cost).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {contract.status}
                    </TableCell>
                    <TableCell align="center">
                      {/* ✅ View - Available to both */}
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" onClick={() => handleView(contract)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* ✅ Edit - ONLY ENGINEER */}
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton size="small" color="info" onClick={() => handleOpenDialog(contract)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {/* ✅ Renew - ONLY SUPER ADMIN */}
                      {canRenew && contract.status === 'Active' && (
                        <Tooltip title="Renew AMC">
                          <IconButton size="small" color="warning" onClick={() => handleRenew(contract)}>
                            <Autorenew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {/* ✅ Delete - ONLY SUPER ADMIN */}
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(contract.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog - ONLY ENGINEER */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {editingContract ? 'Edit AMC Contract' : 'Add New AMC Contract'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment"
                  required
                >
                  <MenuItem value="">Select Equipment</MenuItem>
                  {equipment.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} - {item.model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contract Number"
                name="contract_number"
                value={formData.contract_number}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost ($)"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="Additional notes about the contract"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                <AttachFile sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                Contract Document
              </Typography>
              
              <FileUpload
                endpoint="/upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                multiple={false}
                label="Click to upload contract document"
                maxFiles={1}
                maxSize={20}
                showPreview={true}
                onUploadComplete={(files) => {
                  console.log('📄 Document uploaded:', files)
                  const file = files[0]
                  if (file) {
                    const docUrl = file.url || file.fileUrl
                    setFormData(prev => ({
                      ...prev,
                      documents: docUrl
                    }))
                    toast.success('Document uploaded successfully')
                  }
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  setFormData(prev => ({
                    ...prev,
                    documents: ''
                  }))
                  toast.info('Document removed')
                }}
                existingFiles={formData.documents ? [{
                  url: formData.documents,
                  name: formData.documents.split('/').pop(),
                  type: 'document'
                }] : []}
              />
              
              {formData.documents && (
                <Box sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Description />}
                    href={getFullUrl(formData.documents)} 
                    target="_blank"
                  >
                    View Uploaded Document
                  </Button>
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
            sx={{
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#084a8a' }
            }}
          >
            {editingContract ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renew Dialog - ONLY SUPER ADMIN */}
      <Dialog open={openRenewDialog} onClose={() => setOpenRenewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#ff9800', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Autorenew sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight={600}>
              Renew AMC Contract
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenRenewDialog(false)} 
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Renew Contract:</strong> Extend the AMC contract with a new end date and updated cost.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New End Date"
                type="date"
                value={renewData.end_date}
                onChange={(e) => setRenewData({ ...renewData, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Cost ($)"
                type="number"
                value={renewData.cost}
                onChange={(e) => setRenewData({ ...renewData, cost: e.target.value })}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                helperText="Enter the new contract cost"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenRenewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRenewSubmit}
            sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
            startIcon={<Autorenew />}
          >
            Renew Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              AMC Contract Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingContract && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Equipment</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {viewingContract.equipment_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Vendor</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {viewingContract.vendor_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Contract Number</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {viewingContract.contract_number || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Typography variant="body1">
                  {viewingContract.status}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Start Date</Typography>
                <Typography variant="body1">
                  {viewingContract.start_date ? new Date(viewingContract.start_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">End Date</Typography>
                <Typography variant="body1">
                  {viewingContract.end_date ? new Date(viewingContract.end_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Cost</Typography>
                <Typography variant="body1">
                  {viewingContract.cost ? `$${parseFloat(viewingContract.cost).toFixed(2)}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Contact Person</Typography>
                <Typography variant="body1">
                  {viewingContract.contact_person || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Contact Phone</Typography>
                <Typography variant="body1">
                  {viewingContract.contact_phone || '-'}
                </Typography>
              </Grid>
              {viewingContract.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Notes</Typography>
                  <Typography variant="body1">{viewingContract.notes}</Typography>
                </Grid>
              )}

              {viewingContract.documents && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Contract Document
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Description />}
                    href={getFullUrl(viewingContract.documents)} 
                    target="_blank"
                    sx={{ mt: 0.5 }}
                  >
                    View Document
                  </Button>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView}>Close</Button>
          {/* ✅ ONLY SUPER ADMIN CAN RENEW FROM VIEW */}
          {viewingContract?.status === 'Active' && canRenew && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<Autorenew />}
              onClick={() => {
                handleCloseView()
                handleRenew(viewingContract)
              }}
              sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
            >
              Renew Contract
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AMC