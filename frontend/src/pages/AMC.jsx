// src/pages/AMC.jsx
// ✅ PAEC THEME - Green & Gold Colors

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

// ============================================================
// ✅ PAEC THEME COLORS
// ============================================================
const colors = {
  sidebar: '#01411C',
  sidebarHover: '#0B542B',
  active: '#0E6335',
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  text: '#FFFFFF',
  secondaryText: '#B8C8BE',
  mainBg: '#F0F2F5',
  white: '#FFFFFF',
  darkText: '#1A2A3A',
  lightText: '#5A7A8A',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#ED6C02',
  info: '#0B5FA5',
  borderColor: 'rgba(1, 65, 28, 0.08)',
  shadowColor: 'rgba(1, 65, 28, 0.08)',
  cardBg: '#FFFFFF',
}

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
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access AMC Contracts." />
  }
  
  const canCreate = user?.role === 'ENGINEER'
  const canEdit = user?.role === 'ENGINEER'
  const canDelete = user?.role === 'SUPER_ADMIN'
  const canRenew = user?.role === 'SUPER_ADMIN'
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

  const handleOpenDialog = (contract = null) => {
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
      setFormData({
        equipment_id: contract.equipment_id || '',
        vendor_name: contract.vendor_name || '',
        contract_number: contract.contract_number || '',
        start_date: formatDateForInput(contract.start_date),
        end_date: formatDateForInput(contract.end_date),
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
        doc.setTextColor(colors.sidebar)
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
          headStyles: { fillColor: colors.sidebar, textColor: '#FFFFFF', fontSize: 9, fontStyle: 'bold' },
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
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.accentGold } }} />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.sidebar }}>
            Annual Maintenance Contracts (AMC)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchContracts}
            size="small"
            sx={{ 
              borderColor: colors.sidebar, 
              color: colors.sidebar,
              '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
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
                bgcolor: colors.sidebar,
                '&:hover': { bgcolor: colors.sidebarHover },
                boxShadow: `0 4px 16px ${colors.sidebar}44`
              }}
            >
              Add AMC
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards - THEMED */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.sidebar, fontWeight: 700 }}>
                {totalContracts}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Total Contracts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.success}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.success}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.success, fontWeight: 700 }}>
                {activeContracts}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.warning}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.warning}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.warning, fontWeight: 700 }}>
                {pendingContracts}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.error}33`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.error}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.error, fontWeight: 700 }}>
                {expiredContracts}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Expired</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Expiring Soon Alert */}
      {expiringSoon > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            border: `1px solid ${colors.warning}33`,
            '& .MuiAlert-icon': { color: colors.warning }
          }}
          icon={<Warning />}
          action={
            <Button 
              size="small"
              onClick={() => setFilters({ ...filters, status: 'Active' })}
              sx={{ color: colors.warning }}
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
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
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
                  <Search sx={{ color: colors.lightText }} />
                </InputAdornment>
              ),
              sx: {
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.sidebar },
                  '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                }
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.sidebar },
                  '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                }
              }}
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
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkText,
              '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
            }}
          >
            Export
          </Button>
        </Box>
      </Paper>

      {/* Export Menu - THEMED */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{ sx: { p: 1, width: 200 } }}
      >
        <MenuItem onClick={exportToCSV} sx={{ '&:hover': { bgcolor: `${colors.accentGold}22` } }}>
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.sidebar }} /> Export CSV
        </MenuItem>
        <MenuItem onClick={exportToExcel} sx={{ '&:hover': { bgcolor: `${colors.accentGold}22` } }}>
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.sidebar }} /> Export Excel
        </MenuItem>
        <MenuItem onClick={exportToPDF} sx={{ '&:hover': { bgcolor: `${colors.accentGold}22` } }}>
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.sidebar }} /> Export PDF
        </MenuItem>
      </Menu>

      {/* Table - THEMED */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
        <Table>
          <TableHead sx={{ bgcolor: colors.sidebar }}>
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
                  <Typography variant="body1" sx={{ py: 3, color: colors.lightText }}>
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
                      <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkText }}>
                        {contract.equipment_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>{contract.vendor_name}</TableCell>
                    <TableCell sx={{ color: colors.lightText }}>
                      {contract.contract_number || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText }}>
                      {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ color: colors.darkText }}>
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.darkText }}>
                      {contract.cost ? `$${parseFloat(contract.cost).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.status} 
                        size="small"
                        sx={{
                          bgcolor: contract.status === 'Active' ? colors.success :
                                   contract.status === 'Expired' ? colors.error :
                                   contract.status === 'Pending' ? colors.warning : colors.lightText,
                          color: 'white',
                          fontWeight: 500,
                          height: 24,
                          fontSize: '11px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleView(contract)}
                          sx={{ color: colors.sidebar, '&:hover': { color: colors.accentGold } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(contract)}
                            sx={{ color: colors.sidebar, '&:hover': { color: colors.accentGold } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {canRenew && contract.status === 'Active' && (
                        <Tooltip title="Renew AMC">
                          <IconButton 
                            size="small" 
                            onClick={() => handleRenew(contract)}
                            sx={{ color: colors.warning, '&:hover': { color: colors.accentGold } }}
                          >
                            <Autorenew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {canDelete && (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(contract.id)}
                          >
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

      {/* Add/Edit Dialog - THEMED */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
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
                <InputLabel sx={{ color: colors.lightText }}>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contract Number"
                name="contract_number"
                value={formData.contract_number}
                onChange={handleFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
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
                    sx={{ 
                      borderColor: colors.sidebar,
                      color: colors.sidebar,
                      '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
                    }}
                  >
                    View Uploaded Document
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colors.lightText }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: colors.sidebar,
              '&:hover': { bgcolor: colors.sidebarHover },
              boxShadow: `0 4px 16px ${colors.sidebar}44`
            }}
          >
            {editingContract ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renew Dialog - THEMED */}
      <Dialog open={openRenewDialog} onClose={() => setOpenRenewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.warning, color: 'white' }}>
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
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2, border: `1px solid ${colors.info}33` }}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenRenewDialog(false)} sx={{ color: colors.lightText }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRenewSubmit}
            sx={{ 
              bgcolor: colors.warning, 
              '&:hover': { bgcolor: '#E65100' },
              boxShadow: `0 4px 16px ${colors.warning}44`
            }}
            startIcon={<Autorenew />}
          >
            Renew Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog - THEMED */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
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
                <Typography variant="body2" sx={{ color: colors.lightText }}>Equipment</Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                  {viewingContract.equipment_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Vendor</Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                  {viewingContract.vendor_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Contract Number</Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                  {viewingContract.contract_number || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Status</Typography>
                <Chip 
                  label={viewingContract.status} 
                  size="small"
                  sx={{
                    bgcolor: viewingContract.status === 'Active' ? colors.success :
                             viewingContract.status === 'Expired' ? colors.error :
                             viewingContract.status === 'Pending' ? colors.warning : colors.lightText,
                    color: 'white',
                    fontWeight: 500,
                    height: 24,
                    fontSize: '11px'
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Start Date</Typography>
                <Typography variant="body1" sx={{ color: colors.darkText }}>
                  {viewingContract.start_date ? new Date(viewingContract.start_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>End Date</Typography>
                <Typography variant="body1" sx={{ color: colors.darkText }}>
                  {viewingContract.end_date ? new Date(viewingContract.end_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Cost</Typography>
                <Typography variant="body1" sx={{ color: colors.darkText }}>
                  {viewingContract.cost ? `$${parseFloat(viewingContract.cost).toFixed(2)}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Contact Person</Typography>
                <Typography variant="body1" sx={{ color: colors.darkText }}>
                  {viewingContract.contact_person || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Contact Phone</Typography>
                <Typography variant="body1" sx={{ color: colors.darkText }}>
                  {viewingContract.contact_phone || '-'}
                </Typography>
              </Grid>
              {viewingContract.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Notes</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>{viewingContract.notes}</Typography>
                </Grid>
              )}

              {viewingContract.documents && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Contract Document
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Description />}
                    href={getFullUrl(viewingContract.documents)} 
                    target="_blank"
                    sx={{ 
                      mt: 0.5,
                      borderColor: colors.sidebar,
                      color: colors.sidebar,
                      '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
                    }}
                  >
                    View Document
                  </Button>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView} sx={{ color: colors.lightText }}>Close</Button>
          {viewingContract?.status === 'Active' && canRenew && (
            <Button
              variant="contained"
              startIcon={<Autorenew />}
              onClick={() => {
                handleCloseView()
                handleRenew(viewingContract)
              }}
              sx={{ 
                bgcolor: colors.warning, 
                '&:hover': { bgcolor: '#E65100' },
                boxShadow: `0 4px 16px ${colors.warning}44`
              }}
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