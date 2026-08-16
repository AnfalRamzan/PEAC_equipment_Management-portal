// src/pages/AMC.jsx
// ✅ COMPLETE AMC MANAGEMENT PAGE
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Equipment page
// ✅ All CRUD operations working
// ✅ Renew functionality
// ✅ File upload for documents
// ✅ Export to CSV, Excel, PDF
// ✅ Expiry alerts
// ✅ Status auto-set by backend (field removed from form)
// ✅ Field name: document_url (instead of documents)
// ✅ Date picker fixed with min/max validation
// ✅ Currency: PKR (Pakistani Rupee)
// ✅ UPDATED: Stats cards design matches Equipment page
// ✅ UPDATED: Header with Filter and Export buttons
// ✅ ADDED: Animations

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
  MedicalServices,
  ErrorOutline,
  Build,
} from '@mui/icons-material'
import { amcService, equipmentService } from '../api/services'
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

// ============================================================
// ✅ CURRENCY FORMATTER - PKR
// ============================================================
const formatPKR = (amount) => {
  if (!amount && amount !== 0) return 'Rs. 0'
  const num = parseFloat(amount)
  if (isNaN(num)) return 'Rs. 0'
  return `Rs. ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

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

const isExpiringSoon = (endDate) => {
  if (!endDate) return false
  const today = new Date()
  const end = new Date(endDate)
  const diffTime = end - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 30 && diffDays > 0
}

const getExpiryStatus = (endDate) => {
  if (!endDate) return { color: colors.lightText, label: 'No Date' }
  const today = new Date()
  const end = new Date(endDate)
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { color: colors.error, label: 'Expired' }
  if (diffDays <= 7) return { color: colors.error, label: `Expiring in ${diffDays}d` }
  if (diffDays <= 30) return { color: colors.warning, label: `Expiring in ${diffDays}d` }
  return { color: colors.success, label: 'Active' }
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
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  
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

  // ============================================================
  // ✅ FILTER HANDLERS
  // ============================================================
  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget)
  const handleFilterClose = () => setFilterAnchorEl(null)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ status: '' })
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
      const headers = ['Equipment', 'Vendor', 'Contract #', 'Start Date', 'End Date', 'Cost (PKR)', 'Status', 'Contact Person', 'Contact Phone']
      const rows = filteredContracts.map(c => [
        c.equipment_name || 'N/A',
        c.vendor_name || '',
        c.contract_number || 'N/A',
        c.start_date || '',
        c.end_date || '',
        c.cost ? parseFloat(c.cost).toLocaleString('en-PK') : '0',
        c.status || '',
        c.contact_person || '',
        c.contact_phone || ''
      ])
      let csv = headers.join(',') + '\n'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `amc_contracts_${new Date().toISOString().split('T')[0]}.csv`
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
      const data = filteredContracts.map(c => ({
        'Equipment': c.equipment_name || 'N/A',
        'Vendor': c.vendor_name || '',
        'Contract #': c.contract_number || 'N/A',
        'Start Date': c.start_date || '',
        'End Date': c.end_date || '',
        'Cost (PKR)': c.cost ? parseFloat(c.cost) : 0,
        'Status': c.status || '',
        'Contact Person': c.contact_person || '',
        'Contact Phone': c.contact_phone || ''
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'AMC Contracts')
      XLSX.writeFile(wb, `amc_contracts_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.text('AMC Contracts Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Contracts: ${filteredContracts.length}`, 14, 34)
      
      const tableData = filteredContracts.map(c => [
        c.equipment_name || 'N/A',
        c.vendor_name || '',
        c.contract_number || 'N/A',
        c.start_date || '',
        c.end_date || '',
        c.cost ? `PKR ${parseFloat(c.cost).toLocaleString('en-PK')}` : 'PKR 0',
        c.status || ''
      ])
      autoTable(doc, {
        head: [['Equipment', 'Vendor', 'Contract #', 'Start Date', 'End Date', 'Cost (PKR)', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 8 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 10, right: 10 }
      })
      doc.save(`amc_contracts_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  // ============================================================
  // ✅ DIALOG HANDLERS
  // ============================================================
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

  const totalContracts = contracts.length
  const activeContracts = contracts.filter(c => c.status === 'Active').length
  const expiredContracts = contracts.filter(c => c.status === 'Expired').length
  const pendingContracts = contracts.filter(c => c.status === 'Pending').length
  const expiringSoon = contracts.filter(c => isExpiringSoon(c.end_date) && c.status === 'Active').length
  const totalCostPKR = contracts.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0)

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || contract.status === filters.status
    return matchesSearch && matchesStatus
  })

  // ✅ Stats Cards Data - Same design as Equipment page
  const statsCards = [
    {
      title: 'Total Contracts',
      value: totalContracts,
      icon: <Autorenew />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Active',
      value: activeContracts,
      icon: <CheckCircle />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Pending',
      value: pendingContracts,
      icon: <Schedule />,
      color: colors.lightCyan,
      bg: 'rgba(103, 232, 249, 0.08)',
    },
    {
      title: 'Expired',
      value: expiredContracts,
      icon: <Cancel />,
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
            Annual Maintenance Contracts
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colors.lightText,
              mt: 0.5,
            }}
          >
            Manage AMC contracts for equipment and vendors
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* ✅ REFRESH BUTTON - BORDER STYLE */}
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={fetchContracts} 
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
              Add AMC
            </Button>
          )}
        </Box>
      </Box>

      {/* ============================================================
          EXPIRING SOON ALERT
          ============================================================ */}
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

      {/* ============================================================
          STATS CARDS - Same design as Equipment page
          ============================================================ */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={6} sm={3} key={index}>
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
          TOTAL VALUE CARDS
          ============================================================ */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: colors.cardBg,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${colors.success}, ${colors.lightCyan})`,
              borderRadius: '3px 3px 0 0',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 500 }}>
                Total Contract Value
              </Typography>
              <Typography variant="h5" sx={{ color: colors.success, fontWeight: 700 }}>
                {formatPKR(totalCostPKR)}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.lightText }}>
                All AMC contracts combined
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: colors.cardBg,
            position: 'relative',
            overflow: 'hidden',
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
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 500 }}>
                Average Contract Value
              </Typography>
              <Typography variant="h5" sx={{ color: colors.lightCyanDark, fontWeight: 700 }}>
                {totalContracts > 0 ? formatPKR(totalCostPKR / totalContracts) : 'Rs. 0'}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.lightText }}>
                Per AMC contract average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: colors.cardBg,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${colors.warning}, ${colors.accentGold})`,
              borderRadius: '3px 3px 0 0',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: colors.lightText, fontWeight: 500 }}>
                Highest Value Contract
              </Typography>
              <Typography variant="h5" sx={{ color: colors.warning, fontWeight: 700 }}>
                {contracts.length > 0 ? formatPKR(Math.max(...contracts.map(c => parseFloat(c.cost) || 0))) : 'Rs. 0'}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.lightText }}>
                Maximum contract value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
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
            placeholder="Search AMC contracts..."
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
          Filter AMC Contracts
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
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Expired">Expired</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth 
          size="small" 
          label="Search" 
          name="search"
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by vendor, contract #, equipment..." 
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
          bgcolor: colors.cardBg,
          animation: 'fadeInUp 0.8s ease-out',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Equipment</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Vendor</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Contract #</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Start Date</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>End Date</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Cost (PKR)</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: colors.text, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", py: 2 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Autorenew sx={{ fontSize: 48, color: colors.borderColor }} />
                    <Typography variant="body1" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      No AMC contracts found
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      Try adjusting your search or filters
                    </Typography>
                    {canCreate && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{ 
                          mt: 2,
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
                        }}
                      >
                        Create First AMC Contract
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract, index) => {
                const expiryStatus = getExpiryStatus(contract.end_date)
                return (
                  <TableRow 
                    key={contract.id} 
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
                        {contract.equipment_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {contract.vendor_name}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {contract.contract_number || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
                        </Typography>
                        {contract.end_date && (
                          <Chip 
                            label={expiryStatus.label}
                            size="small"
                            sx={{
                              bgcolor: expiryStatus.color,
                              color: colors.text,
                              fontWeight: 600,
                              height: 20,
                              fontSize: '9px',
                              borderRadius: 2,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.darkNavy, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {formatPKR(contract.cost)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.status} 
                        size="small"
                        sx={{
                          bgcolor: contract.status === 'Active' ? colors.success :
                                   contract.status === 'Expired' ? colors.error :
                                   contract.status === 'Pending' ? colors.warning : colors.lightText,
                          color: colors.text,
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
                            onClick={() => handleView(contract)}
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
                              onClick={() => handleOpenDialog(contract)}
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
                        
                        {canRenew && contract.status === 'Active' && (
                          <Tooltip title="Renew AMC">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRenew(contract)}
                              sx={{ 
                                color: colors.warning, 
                                '&:hover': { 
                                  color: colors.lightCyanDark,
                                  backgroundColor: 'rgba(103, 232, 249, 0.08)'
                                } 
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

      {/* ============================================================
          ADD/EDIT DIALOG
          ============================================================ */}
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
            bgcolor: colors.cardBg,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: colors.text,
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              {editingContract ? <Edit sx={{ fontSize: 28 }} /> : <Add sx={{ fontSize: 28 }} />}
              {editingContract ? 'Edit AMC Contract' : 'Add New AMC Contract'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment"
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
                  <MenuItem value="" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>Select Equipment</MenuItem>
                  {equipment.map(item => (
                    <MenuItem key={item.id} value={item.id} sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
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
                label="Contract Number"
                name="contract_number"
                value={formData.contract_number}
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>

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
                      <Typography sx={{ color: colors.lightText, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>PKR</Typography>
                    </InputAdornment>
                  )
                }}
                helperText="Enter cost in Pakistani Rupees"
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
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
                label="Contact Phone"
                name="contact_phone"
                value={formData.contact_phone}
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
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="Additional notes about the contract"
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
                      borderColor: colors.borderColor,
                      color: colors.darkNavy,
                      borderRadius: 2,
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
            {editingContract ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          RENEW DIALOG
          ============================================================ */}
      <Dialog 
        open={openRenewDialog} 
        onClose={() => setOpenRenewDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            bgcolor: colors.cardBg,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.warning, 
          color: colors.text,
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              <Autorenew sx={{ fontSize: 28 }} />
              Renew AMC Contract
            </Typography>
            <IconButton onClick={() => setOpenRenewDialog(false)} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2, border: `1px solid rgba(59, 130, 246, 0.2)` }}>
            <Typography variant="body2" sx={{ fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              <strong>Renew Contract:</strong> Extend the AMC contract with a new end date and updated cost.
              Status will be auto-updated by the system.
            </Typography>
          </Alert>
          <Grid container spacing={2.5}>
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
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
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
                      <Typography sx={{ color: colors.lightText, fontWeight: 600, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>PKR</Typography>
                    </InputAdornment>
                  )
                }}
                helperText="Enter the new contract cost in Pakistani Rupees"
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
                  },
                  '& .MuiFormHelperText-root': {
                    fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif",
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenRenewDialog(false)} 
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
            onClick={handleRenewSubmit}
            sx={{ 
              bgcolor: colors.warning, 
              color: colors.text,
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              boxShadow: `0 4px 16px ${colors.warning}44`,
              '&:hover': { 
                bgcolor: '#D97706',
                boxShadow: `0 6px 24px ${colors.warning}66`,
              },
              transition: 'all 0.3s ease',
            }}
            startIcon={<Autorenew />}
          >
            Renew Contract
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================
          VIEW DIALOG
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
            bgcolor: colors.cardBg,
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: colors.text,
          borderRadius: '8px 8px 0 0',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
              <Autorenew sx={{ fontSize: 28 }} />
              AMC Contract Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: colors.text, '&:hover': { color: colors.lightCyan } }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.borderColor, px: 4, py: 3 }}>
          {viewingContract && (
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: colors.darkNavy, width: 56, height: 56 }}>
                    <Autorenew sx={{ fontSize: 28, color: colors.text }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {viewingContract.contract_number || 'AMC Contract'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={viewingContract.status} 
                        size="small"
                        sx={{
                          bgcolor: viewingContract.status === 'Active' ? colors.success :
                                   viewingContract.status === 'Expired' ? colors.error :
                                   viewingContract.status === 'Pending' ? colors.warning : colors.lightText,
                          color: colors.text,
                          fontWeight: 600,
                          height: 26,
                          fontSize: '11px',
                          borderRadius: 2,
                        }}
                      />
                      {viewingContract.end_date && (
                        <Chip 
                          label={getExpiryStatus(viewingContract.end_date).label}
                          size="small"
                          sx={{
                            bgcolor: getExpiryStatus(viewingContract.end_date).color,
                            color: colors.text,
                            fontWeight: 600,
                            height: 26,
                            fontSize: '11px',
                            borderRadius: 2,
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
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Equipment
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingContract.equipment_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Vendor
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingContract.vendor_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Contract Number
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingContract.contract_number || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  Cost (PKR)
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.lightCyanDark, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {formatPKR(viewingContract.cost)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Start Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingContract.start_date ? new Date(viewingContract.start_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  <CalendarToday sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  End Date
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingContract.end_date ? new Date(viewingContract.end_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  <Person sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Contact Person
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingContract.contact_person || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                  <Phone sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Contact Phone
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                  {viewingContract.contact_phone || '-'}
                </Typography>
              </Grid>

              {viewingContract.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600 }}>
                    Notes
                  </Typography>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.mainBg, 
                    borderRadius: 2, 
                    border: `1px solid ${colors.borderColor}`,
                    mt: 0.5,
                  }}>
                    <Typography variant="body2" sx={{ color: colors.darkText, fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif" }}>
                      {viewingContract.notes}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {viewingContract.document_url && (
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', fontFamily: "'Satoshi', 'Segoe UI', 'Roboto', sans-serif", fontWeight: 600, mt: 2, mb: 1 }}>
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
                      borderColor: colors.borderColor,
                      color: colors.darkNavy,
                      borderRadius: 2,
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
                color: colors.text,
                borderRadius: 2,
                px: 4,
                textTransform: 'none',
                boxShadow: `0 4px 16px ${colors.warning}44`,
                '&:hover': { 
                  bgcolor: '#D97706',
                  boxShadow: `0 6px 24px ${colors.warning}66`,
                },
                transition: 'all 0.3s ease',
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