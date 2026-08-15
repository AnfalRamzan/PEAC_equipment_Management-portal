// src/pages/AMC.jsx
// ✅ COMPLETE AMC MANAGEMENT PAGE
// ✅ WHITE BACKGROUND - Matching sidebar theme
// ✅ DARK NAVY + LIGHT CYAN THEME
// ✅ All CRUD operations working
// ✅ Renew functionality
// ✅ File upload for documents
// ✅ Export to CSV, Excel, PDF
// ✅ Expiry alerts
// ✅ Status auto-set by backend (field removed from form)
// ✅ Field name: document_url (instead of documents)
// ✅ Date picker fixed with min/max validation
// ✅ Currency: PKR (Pakistani Rupee)

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
  CardContent,
  Avatar,
  Fade,
  Grow,
  Divider,
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
  Business,
  CheckCircle,
  Cancel,
  Schedule,
  Receipt,
  Person,
  Phone,
  Email,
  LocationOn,
  Print,
} from '@mui/icons-material'
import { amcService, equipmentService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'

// ============================================================
// ✅ THEME COLORS - MATCHING SIDEBAR
// ============================================================
const colors = {
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyHover: '#1E3A5F',
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textLight: '#64748B',
  textWhite: '#FFFFFF',
  bgWhite: '#FFFFFF',
  bgLight: '#F8FAFC',
  bgGray: '#F1F5F9',
  cardBg: '#FFFFFF',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  borderColor: 'rgba(103, 232, 249, 0.2)',
  borderDark: '#E2E8F0',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

// ============================================================
// ✅ CURRENCY FORMATTER - PKR
// ============================================================
const formatPKR = (amount) => {
  if (!amount && amount !== 0) return 'PKR 0'
  const num = parseFloat(amount)
  if (isNaN(num)) return 'PKR 0'
  return `PKR ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

const formatPKRWithDecimals = (amount) => {
  if (!amount && amount !== 0) return 'PKR 0.00'
  const num = parseFloat(amount)
  if (isNaN(num)) return 'PKR 0.00'
  return `PKR ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ============================================================
// ✅ STATS CARD COMPONENT
// ============================================================
const StatsCard = ({ title, value, icon, color, bgColor, subtext }) => (
  <Grow in timeout={300}>
    <Card sx={{ 
      borderRadius: 3, 
      border: `1px solid ${colors.borderColor}`,
      boxShadow: `0 2px 8px ${colors.cardShadow}`,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      bgcolor: colors.cardBg,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 30px ${colors.cardShadow}`,
        borderColor: colors.lightCyan,
      }
    }}>
      <CardContent sx={{ textAlign: 'center', py: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 1.5
        }}>
          <Avatar sx={{ 
            bgcolor: bgColor || color || colors.darkNavy,
            width: 48,
            height: 48,
            boxShadow: `0 4px 16px ${color || colors.darkNavy}44`
          }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" sx={{ color: colors.darkNavy, fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textLight, fontWeight: 500 }}>
          {title}
        </Typography>
        {subtext && (
          <Typography variant="caption" sx={{ color: colors.textLight, display: 'block', mt: 0.5 }}>
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grow>
)

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================
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

const safeToFixed = (value, decimals = 2) => {
  const num = parseFloat(value)
  return isNaN(num) ? '0.00' : num.toFixed(decimals)
}

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const AMC = () => {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access AMC Contracts." />
  }
  
  const canCreate = user?.role === 'ENGINEER' || user?.role === 'SUPER_ADMIN'
  const canEdit = user?.role === 'ENGINEER' || user?.role === 'SUPER_ADMIN'
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
  
  // ✅ Status field removed from form - backend will auto-set it
  // ✅ Changed from 'documents' to 'document_url'
  const [formData, setFormData] = useState({
    equipment_id: '',
    vendor_name: '',
    contract_number: '',
    start_date: '',
    end_date: '',
    cost: '',
    contact_person: '',
    contact_phone: '',
    notes: '',
    document_url: ''
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
      toast.error('You do not have permission to edit AMC contracts')
      return
    }
    if (!contract && !canCreate) {
      toast.error('You do not have permission to create AMC contracts')
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
        notes: contract.notes || '',
        document_url: contract.document_url || ''
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
        notes: '',
        document_url: ''
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
      toast.error('You do not have permission to create or edit AMC contracts')
      return
    }
    
    try {
      const submitData = {
        ...formData,
        document_url: formData.document_url || ''
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
      const headers = ['Equipment', 'Vendor', 'Contract #', 'Start Date', 'End Date', 'Cost (PKR)', 'Status', 'Contact Person', 'Contact Phone']
      const rows = filteredContracts.map(c => [
        c.equipment_name || 'N/A',
        c.vendor_name,
        c.contract_number || 'N/A',
        c.start_date || '',
        c.end_date || '',
        c.cost ? parseFloat(c.cost).toLocaleString('en-PK') : '0',
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
          'Cost (PKR)': c.cost ? parseFloat(c.cost) : 0,
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
        doc.setTextColor(colors.darkNavy)
        doc.text('AMC Contracts Report', 14, 20)
        
        doc.setFontSize(10)
        doc.setTextColor(colors.textLight)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
        doc.text(`Total Contracts: ${filteredContracts.length}`, 14, 34)
        
        const tableData = filteredContracts.map(c => [
          c.equipment_name || 'N/A',
          c.vendor_name,
          c.contract_number || 'N/A',
          c.start_date || '',
          c.end_date || '',
          c.cost ? `PKR ${parseFloat(c.cost).toLocaleString('en-PK')}` : 'PKR 0',
          c.status
        ])
        
        autoTable(doc, {
          head: [['Equipment', 'Vendor', 'Contract #', 'Start Date', 'End Date', 'Cost (PKR)', 'Status']],
          body: tableData,
          startY: 40,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: colors.darkNavy, textColor: colors.textWhite, fontSize: 9, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: colors.bgLight },
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
    if (!endDate) return { color: colors.textLight, label: 'No Date' }
    const today = new Date()
    const end = new Date(endDate)
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { color: colors.error, label: 'Expired' }
    if (diffDays <= 7) return { color: colors.error, label: `Expiring in ${diffDays}d` }
    if (diffDays <= 30) return { color: colors.warning, label: `Expiring in ${diffDays}d` }
    return { color: colors.success, label: 'Active' }
  }

  const totalContracts = contracts.length
  const activeContracts = contracts.filter(c => c.status === 'Active').length
  const expiredContracts = contracts.filter(c => c.status === 'Expired').length
  const pendingContracts = contracts.filter(c => c.status === 'Pending').length
  const expiringSoon = contracts.filter(c => isExpiringSoon(c.end_date) && c.status === 'Active').length

  // ✅ Calculate total cost in PKR
  const totalCostPKR = contracts.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0)

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || contract.status === filters.status
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.bgGray, '& .MuiLinearProgress-bar': { bgcolor: colors.darkNavy } }} />
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: colors.bgWhite, minHeight: '100vh' }}>
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
            Annual Maintenance Contracts (AMC)
          </Typography>
          <Chip 
            icon={<Autorenew sx={{ fontSize: 16 }} />}
            label={`${contracts.length} Contracts`}
            size="small"
            sx={{ 
              bgcolor: colors.darkNavy, 
              color: colors.textWhite,
              fontWeight: 600,
              '& .MuiChip-icon': { color: colors.lightCyan }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchContracts}
            size="small"
            sx={{ 
              borderColor: colors.borderDark, 
              color: colors.darkNavy,
              '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark, bgcolor: colors.lightCyanGlow }
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
                  boxShadow: `0 4px 20px ${colors.lightCyanGlow}`
                },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Add AMC
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards with PKR */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Total Contracts" 
            value={totalContracts} 
            icon={<Autorenew sx={{ fontSize: 24, color: colors.textWhite }} />}
            color={colors.darkNavy}
            bgColor={colors.darkNavy}
            subtext="All AMC contracts"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Active" 
            value={activeContracts} 
            icon={<CheckCircle sx={{ fontSize: 24, color: colors.textWhite }} />}
            color={colors.success}
            bgColor={colors.success}
            subtext="Active contracts"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Pending" 
            value={pendingContracts} 
            icon={<Schedule sx={{ fontSize: 24, color: colors.textWhite }} />}
            color={colors.warning}
            bgColor={colors.warning}
            subtext="Pending contracts"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Expired" 
            value={expiredContracts} 
            icon={<Cancel sx={{ fontSize: 24, color: colors.textWhite }} />}
            color={colors.error}
            bgColor={colors.error}
            subtext="Expired contracts"
          />
        </Grid>
      </Grid>

      {/* ✅ Total Cost in PKR */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: `0 2px 8px ${colors.cardShadow}`,
            bgcolor: colors.cardBg,
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: colors.textLight, fontWeight: 500 }}>
                Total Contract Value
              </Typography>
              <Typography variant="h5" sx={{ color: colors.success, fontWeight: 700 }}>
                {formatPKR(totalCostPKR)}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.textLight }}>
                All AMC contracts combined
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: `0 2px 8px ${colors.cardShadow}`,
            bgcolor: colors.cardBg,
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: colors.textLight, fontWeight: 500 }}>
                Average Contract Value
              </Typography>
              <Typography variant="h5" sx={{ color: colors.lightCyanDark, fontWeight: 700 }}>
                {totalContracts > 0 ? formatPKR(totalCostPKR / totalContracts) : 'PKR 0'}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.textLight }}>
                Per AMC contract average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: `0 2px 8px ${colors.cardShadow}`,
            bgcolor: colors.cardBg,
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: colors.textLight, fontWeight: 500 }}>
                Highest Value Contract
              </Typography>
              <Typography variant="h5" sx={{ color: colors.warning, fontWeight: 700 }}>
                {contracts.length > 0 ? formatPKR(Math.max(...contracts.map(c => parseFloat(c.cost) || 0))) : 'PKR 0'}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.textLight }}>
                Maximum contract value
              </Typography>
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
            borderRadius: 3,
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
        borderRadius: 3,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: `0 2px 8px ${colors.cardShadow}`,
        bgcolor: colors.cardBg,
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
                  <Search sx={{ color: colors.textLight }} />
                </InputAdornment>
              ),
              sx: {
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.textLight }}>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.borderDark },
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
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
              borderColor: colors.borderDark, 
              color: colors.darkNavy,
              '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark }
            }}
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
        PaperProps={{ 
          sx: { 
            p: 1, 
            width: 200,
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: `0 4px 20px ${colors.cardShadow}`,
          } 
        }}
      >
        <MenuItem onClick={exportToCSV} sx={{ '&:hover': { bgcolor: colors.lightCyanGlow } }}>
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.darkNavy }} /> Export CSV
        </MenuItem>
        <MenuItem onClick={exportToExcel} sx={{ '&:hover': { bgcolor: colors.lightCyanGlow } }}>
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.darkNavy }} /> Export Excel
        </MenuItem>
        <MenuItem onClick={exportToPDF} sx={{ '&:hover': { bgcolor: colors.lightCyanGlow } }}>
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.darkNavy }} /> Export PDF
        </MenuItem>
      </Menu>

      {/* Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3, 
          border: `1px solid ${colors.borderColor}`,
          boxShadow: `0 2px 8px ${colors.cardShadow}`,
          bgcolor: colors.cardBg,
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Vendor</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Contract #</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>End Date</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Cost (PKR)</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: colors.textWhite, fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 4 }}>
                    <Autorenew sx={{ fontSize: 48, color: colors.textLight, mb: 1 }} />
                    <Typography variant="body1" sx={{ color: colors.textLight }}>
                      No AMC contracts found
                    </Typography>
                    {canCreate && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                          mt: 2,
                          bgcolor: colors.darkNavy,
                          '&:hover': { 
                            bgcolor: colors.darkNavyHover,
                            boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
                          },
                        }}
                      >
                        Create First AMC Contract
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => {
                const expiryStatus = getExpiryStatus(contract.end_date)
                return (
                  <TableRow 
                    key={contract.id} 
                    hover
                    sx={{
                      '&:hover': { bgcolor: colors.bgLight },
                      '&:last-child td': { borderBottom: 0 }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} sx={{ color: colors.textPrimary }}>
                        {contract.equipment_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: colors.textLight }}>{contract.vendor_name}</TableCell>
                    <TableCell sx={{ color: colors.textLight }}>
                      {contract.contract_number || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: colors.textLight }}>
                      {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ color: colors.textPrimary }}>
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
                        </Typography>
                        {contract.end_date && (
                          <Chip 
                            label={expiryStatus.label}
                            size="small"
                            sx={{
                              bgcolor: expiryStatus.color,
                              color: colors.textWhite,
                              fontWeight: 500,
                              height: 20,
                              fontSize: '9px',
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.textPrimary, fontWeight: 600 }}>
                      {contract.cost ? formatPKR(contract.cost) : 'PKR 0'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.status} 
                        size="small"
                        sx={{
                          bgcolor: contract.status === 'Active' ? colors.success :
                                   contract.status === 'Expired' ? colors.error :
                                   contract.status === 'Pending' ? colors.warning : colors.textLight,
                          color: colors.textWhite,
                          fontWeight: 500,
                          height: 24,
                          fontSize: '11px',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleView(contract)}
                            sx={{ 
                              color: colors.darkNavy, 
                              '&:hover': { color: colors.lightCyanDark } 
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {canEdit && (
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(contract)}
                              sx={{ 
                                color: colors.darkNavy, 
                                '&:hover': { color: colors.lightCyanDark } 
                              }}
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
                              sx={{ 
                                color: colors.warning, 
                                '&:hover': { color: colors.lightCyanDark } 
                              }}
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
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog - Status field REMOVED with Date Picker Fix */}
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
            bgcolor: colors.bgWhite,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: colors.textWhite,
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Autorenew sx={{ color: colors.textWhite }} />
              <Typography variant="h6" fontWeight={600}>
                {editingContract ? 'Edit AMC Contract' : 'Add New AMC Contract'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: colors.textWhite }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.textLight }}>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: colors.borderDark },
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
                >
                  <MenuItem value="">Select Equipment</MenuItem>
                  {equipment.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} - {item.model || 'No Model'}
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* ✅ START DATE - FIXED with max validation */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  inputProps: {
                    max: formData.end_date || undefined
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* ✅ END DATE - FIXED with min validation */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  inputProps: {
                    min: formData.start_date || undefined
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            {/* ✅ Cost - PKR with prefix */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost (PKR)"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleFormChange}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ color: colors.textLight, fontWeight: 600 }}>PKR</Typography>
                    </InputAdornment>
                  )
                }}
                helperText="Enter cost in Pakistani Rupees"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>
            
            {/* ✅ Status field REMOVED - Backend auto-sets status based on end_date */}

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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.textLight }} gutterBottom>
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
                      document_url: docUrl
                    }))
                    toast.success('Document uploaded successfully')
                  }
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  setFormData(prev => ({
                    ...prev,
                    document_url: ''
                  }))
                  toast.info('Document removed')
                }}
                existingFiles={formData.document_url ? [{
                  url: formData.document_url,
                  name: formData.document_url.split('/').pop(),
                  type: 'document'
                }] : []}
              />
              
              {formData.document_url && (
                <Box sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Description />}
                    href={getFullUrl(formData.document_url)}
                    target="_blank"
                    sx={{ 
                      borderColor: colors.borderDark,
                      color: colors.darkNavy,
                      '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark }
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
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              color: colors.textLight,
              '&:hover': { backgroundColor: 'rgba(103, 232, 249, 0.04)' }
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
                boxShadow: `0 4px 20px ${colors.lightCyanGlow}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            {editingContract ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog 
        open={openRenewDialog} 
        onClose={() => setOpenRenewDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            bgcolor: colors.bgWhite,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.warning, 
          color: colors.textWhite,
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Autorenew sx={{ color: colors.textWhite }} />
            <Typography variant="h6" fontWeight={600}>
              Renew AMC Contract
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenRenewDialog(false)} 
            sx={{ position: 'absolute', right: 8, top: 8, color: colors.textWhite }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2, border: `1px solid rgba(59, 130, 246, 0.2)` }}>
                <Typography variant="body2">
                  <strong>Renew Contract:</strong> Extend the AMC contract with a new end date and updated cost.
                  Status will be auto-updated by the system.
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
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Cost (PKR)"
                type="number"
                value={renewData.cost}
                onChange={(e) => setRenewData({ ...renewData, cost: e.target.value })}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ color: colors.textLight, fontWeight: 600 }}>PKR</Typography>
                    </InputAdornment>
                  )
                }}
                helperText="Enter the new contract cost in Pakistani Rupees"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: colors.borderDark },
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenRenewDialog(false)} 
            sx={{ color: colors.textLight }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRenewSubmit}
            sx={{ 
              bgcolor: colors.warning, 
              '&:hover': { bgcolor: '#D97706' },
              boxShadow: `0 4px 16px ${colors.warning}44`,
              textTransform: 'none',
              borderRadius: 2,
            }}
            startIcon={<Autorenew />}
          >
            Renew Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
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
            bgcolor: colors.bgWhite,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: colors.textWhite,
          borderRadius: '8px 8px 0 0',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              AMC Contract Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: colors.textWhite }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor }}>
          {viewingContract && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: colors.darkNavy, width: 56, height: 56 }}>
                    <Autorenew sx={{ fontSize: 28, color: colors.textWhite }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: colors.textPrimary }}>
                      {viewingContract.contract_number || 'AMC Contract'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={viewingContract.status} 
                        size="small"
                        sx={{
                          bgcolor: viewingContract.status === 'Active' ? colors.success :
                                   viewingContract.status === 'Expired' ? colors.error :
                                   viewingContract.status === 'Pending' ? colors.warning : colors.textLight,
                          color: colors.textWhite,
                          fontWeight: 500,
                          height: 24,
                          fontSize: '11px'
                        }}
                      />
                      {viewingContract.end_date && (
                        <Chip 
                          label={getExpiryStatus(viewingContract.end_date).label}
                          size="small"
                          sx={{
                            bgcolor: getExpiryStatus(viewingContract.end_date).color,
                            color: colors.textWhite,
                            fontWeight: 500,
                            height: 24,
                            fontSize: '11px'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>Equipment</Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.textPrimary }}>
                  {viewingContract.equipment_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>Vendor</Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.textPrimary }}>
                  {viewingContract.vendor_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>Contract Number</Typography>
                <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                  {viewingContract.contract_number || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>Cost (PKR)</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.lightCyanDark }}>
                  {viewingContract.cost ? formatPKR(viewingContract.cost) : 'PKR 0'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>
                  <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Start Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                  {viewingContract.start_date ? new Date(viewingContract.start_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>
                  <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  End Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                  {viewingContract.end_date ? new Date(viewingContract.end_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>
                  <Person sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Contact Person
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                  {viewingContract.contact_person || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.textLight }}>
                  <Phone sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Contact Phone
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textPrimary }}>
                  {viewingContract.contact_phone || '-'}
                </Typography>
              </Grid>

              {viewingContract.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: colors.textLight }}>Notes</Typography>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.bgLight, 
                    borderRadius: 2, 
                    border: `1px solid ${colors.borderDark}`,
                    mt: 0.5,
                  }}>
                    <Typography variant="body2" sx={{ color: colors.textPrimary }}>
                      {viewingContract.notes}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {viewingContract.document_url && (
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="body2" sx={{ color: colors.textLight, mt: 2, mb: 1 }}>
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    Contract Document
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Description />}
                    href={getFullUrl(viewingContract.document_url)}
                    target="_blank"
                    sx={{ 
                      borderColor: colors.borderDark,
                      color: colors.darkNavy,
                      '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark }
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
          <Button 
            onClick={handleCloseView} 
            sx={{ 
              color: colors.textLight,
              '&:hover': { backgroundColor: 'rgba(103, 232, 249, 0.04)' }
            }}
          >
            Close
          </Button>
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
                '&:hover': { bgcolor: '#D97706' },
                boxShadow: `0 4px 16px ${colors.warning}44`,
                textTransform: 'none',
                borderRadius: 2,
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