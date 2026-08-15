// src/pages/Hospitals.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar
// ✅ FONT: SATOSHI - Premium, Sleek, Modern

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
  Grid,
  Typography,
  LinearProgress,
  Divider,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar
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
  Email,
  Lock,
  Person,
  Phone,
  LocationOn,
  Business,
  FileDownload,
  Refresh,
  MedicalServices,
  ErrorOutline,
  CheckCircle,
  Engineering
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { hospitalService, equipmentService, errorService, userService } from '../api/services'
import { toast } from 'react-toastify'

// ============================================================
// ✅ FONT FAMILY CONSTANT - SATOSHI (Premium & Sleek)
// ============================================================
const FONT_FAMILY = "'Satoshi', 'Segoe UI', 'Roboto', sans-serif"

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

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([])
  const [equipment, setEquipment] = useState([])
  const [errors, setErrors] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [editingHospital, setEditingHospital] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filters, setFilters] = useState({
    status: 'all',
    city: ''
  })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const { user } = useSelector((state) => state.auth)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const [formData, setFormData] = useState({
    name: '',
    hospital_code: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    phone: '',
    email: '',
    director: '',
    biomedical_head: '',
    is_active: true
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [hospitalsRes, equipmentRes, errorsRes, usersRes] = await Promise.all([
        hospitalService.getAll(),
        equipmentService.getAll(),
        errorService.getAll(),
        userService.getAll()
      ])
      
      setHospitals(hospitalsRes.data.hospitals || [])
      setEquipment(equipmentRes.data.equipment || [])
      setErrors(errorsRes.data.errors || [])
      setUsers(usersRes.data.users || [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchHospitals = async () => {
    setLoading(true)
    try {
      const response = await hospitalService.getAll()
      setHospitals(response.data.hospitals || [])
    } catch (error) {
      toast.error('Failed to fetch hospitals')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const clearFilters = () => {
    setFilters({ status: 'all', city: '' })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setExportAnchorEl(null)
  }

  const exportToCSV = () => {
    try {
      const headers = ['Hospital Name', 'Hospital Code', 'Address', 'City', 'State', 'Country', 'Phone', 'Email', 'Director', 'Biomedical Head', 'Status']
      const rows = filteredHospitals.map(h => [
        h.name,
        h.hospital_code || '',
        h.address || '',
        h.city || '',
        h.state || '',
        h.country || '',
        h.phone || '',
        h.email || '',
        h.director || '',
        h.biomedical_head || '',
        h.is_active ? 'Active' : 'Inactive'
      ])
      
      let csv = headers.join(',') + '\n'
      rows.forEach(row => {
        csv += row.join(',') + '\n'
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hospitals_${new Date().toISOString().split('T')[0]}.csv`
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
        const data = filteredHospitals.map(h => ({
          'Hospital Name': h.name,
          'Hospital Code': h.hospital_code || '',
          'Address': h.address || '',
          'City': h.city || '',
          'State': h.state || '',
          'Country': h.country || '',
          'Phone': h.phone || '',
          'Email': h.email || '',
          'Director': h.director || '',
          'Biomedical Head': h.biomedical_head || '',
          'Status': h.is_active ? 'Active' : 'Inactive'
        }))
        
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Hospitals')
        XLSX.writeFile(wb, `hospitals_${new Date().toISOString().split('T')[0]}.xlsx`)
        
        toast.success('Excel exported successfully!')
        handleExportClose()
      }).catch(() => {
        toast.error('Excel library not loaded.')
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
        doc.text('Hospitals Report', 14, 20)
        
        doc.setFontSize(10)
        doc.setTextColor('#666666')
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
        doc.text(`Total Hospitals: ${filteredHospitals.length}`, 14, 34)
        
        const tableData = filteredHospitals.map(h => [
          h.name,
          h.hospital_code || '',
          h.city || '',
          h.phone || '',
          h.director || '',
          h.biomedical_head || '',
          h.is_active ? 'Active' : 'Inactive'
        ])
        
        autoTable(doc, {
          head: [['Hospital Name', 'Code', 'City', 'Phone', 'Director', 'Biomedical Head', 'Status']],
          body: tableData,
          startY: 40,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: colors.darkNavy, textColor: '#FFFFFF', fontSize: 9, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: '#F5F7FA' },
          margin: { left: 14, right: 14 }
        })
        
        doc.save(`hospitals_${new Date().toISOString().split('T')[0]}.pdf`)
        
        toast.success('PDF exported successfully!')
        handleExportClose()
      }).catch((err) => {
        toast.error('PDF export failed: ' + err.message)
      })
    } catch (error) {
      toast.error('Failed to export PDF: ' + error.message)
    }
  }

  const handleViewDetails = (hospital) => {
    setSelectedHospital(hospital)
    setOpenViewDialog(true)
  }

  const generateHospitalCode = () => {
    const prefix = 'HOS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleOpenDialog = (hospital = null) => {
    if (hospital) {
      setEditingHospital(hospital)
      setFormData({
        name: hospital.name || '',
        hospital_code: hospital.hospital_code || '',
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        country: hospital.country || 'Pakistan',
        phone: hospital.phone || '',
        email: hospital.email || '',
        director: hospital.director || '',
        biomedical_head: hospital.biomedical_head || '',
        is_active: hospital.is_active !== undefined ? hospital.is_active : true
      })
    } else {
      setEditingHospital(null)
      setFormData({
        name: '',
        hospital_code: generateHospitalCode(),
        address: '',
        city: '',
        state: '',
        country: 'Pakistan',
        phone: '',
        email: '',
        director: '',
        biomedical_head: '',
        is_active: true
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingHospital(null)
    setFormData({
      name: '',
      hospital_code: '',
      address: '',
      city: '',
      state: '',
      country: 'Pakistan',
      phone: '',
      email: '',
      director: '',
      biomedical_head: '',
      is_active: true
    })
  }

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false)
    setSelectedHospital(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    try {
      const submitData = {
        name: formData.name,
        hospital_code: formData.hospital_code || generateHospitalCode(),
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        director: formData.director,
        biomedical_head: formData.biomedical_head,
        is_active: formData.is_active !== undefined ? formData.is_active : true
      }

      if (editingHospital) {
        await hospitalService.update(editingHospital.id, submitData)
        toast.success('Hospital updated successfully')
      } else {
        await hospitalService.create(submitData)
        toast.success(`Hospital "${formData.name}" created successfully!`)
      }
      fetchAllData()
      handleCloseDialog()
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Operation failed'
      toast.error(errorMsg)
      console.error('Error:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      try {
        await hospitalService.delete(id)
        toast.success('Hospital deleted successfully')
        fetchAllData()
      } catch (error) {
        toast.error('Failed to delete hospital')
      }
    }
  }

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.biomedical_head?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.hospital_code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && hospital.is_active) ||
      (filters.status === 'inactive' && !hospital.is_active)
    
    const matchesCity = !filters.city || 
      hospital.city?.toLowerCase().includes(filters.city.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesCity
  })

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700, 
            color: colors.darkNavy,
            fontFamily: FONT_FAMILY,
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
          Hospitals
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAllData}
            size="small"
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              '&:hover': { 
                borderColor: colors.lightCyan, 
                color: colors.lightCyanDark,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              }
            }}
          >
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: colors.darkNavy,
                fontFamily: FONT_FAMILY,
                textTransform: 'none',
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
                },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                borderRadius: 2,
              }}
            >
              Add Hospital
            </Button>
          )}
        </Box>
      </Box>

      {/* Search & Filter */}
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
            placeholder="Search hospitals..."
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
                },
                '& .MuiInputBase-input': {
                  fontFamily: FONT_FAMILY,
                }
              }
            }}
          />
          
          <Button 
            variant="outlined" 
            startIcon={<FilterList />}
            onClick={handleFilterClick}
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              '&:hover': { 
                borderColor: colors.lightCyan, 
                color: colors.lightCyanDark,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              }
            }}
          >
            Filter
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={handleExportClick}
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
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

      {/* Filter Menu - CYAN THEMED */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ 
          sx: { 
            p: 2, 
            width: 250,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            borderRadius: 2,
          } 
        }}
      >
        <Typography 
          variant="subtitle2" 
          fontWeight={600} 
          sx={{ 
            color: colors.darkNavy,
            fontFamily: FONT_FAMILY,
          }} 
          gutterBottom
        >
          Filter Hospitals
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>Status</InputLabel>
          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            label="Status"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              },
              '& .MuiSelect-select': {
                fontFamily: FONT_FAMILY,
              }
            }}
          >
            <MenuItem sx={{ fontFamily: FONT_FAMILY }} value="all">All</MenuItem>
            <MenuItem sx={{ fontFamily: FONT_FAMILY }} value="active">Active</MenuItem>
            <MenuItem sx={{ fontFamily: FONT_FAMILY }} value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          size="small"
          label="City"
          name="city"
          value={filters.city}
          onChange={handleFilterChange}
          placeholder="Filter by city"
          sx={{ mb: 2 }}
          InputProps={{
            sx: {
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.lightCyan },
                '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
              },
              '& .MuiInputBase-input': {
                fontFamily: FONT_FAMILY,
              },
              '& .MuiInputLabel-root': {
                fontFamily: FONT_FAMILY,
              }
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
              fontFamily: FONT_FAMILY,
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
              fontFamily: FONT_FAMILY,
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

      {/* Export Menu - CYAN THEMED */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{ 
          sx: { 
            p: 1, 
            width: 200,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            borderRadius: 2,
          } 
        }}
      >
        <MenuItem 
          onClick={exportToCSV} 
          sx={{ 
            fontFamily: FONT_FAMILY,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
              borderRadius: 1,
            } 
          }}
        >
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.darkNavy }} /> Export CSV
        </MenuItem>
        <MenuItem 
          onClick={exportToExcel} 
          sx={{ 
            fontFamily: FONT_FAMILY,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
              borderRadius: 1,
            } 
          }}
        >
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.darkNavy }} /> Export Excel
        </MenuItem>
        <MenuItem 
          onClick={exportToPDF} 
          sx={{ 
            fontFamily: FONT_FAMILY,
            '&:hover': { 
              bgcolor: 'rgba(103, 232, 249, 0.08)',
              borderRadius: 1,
            } 
          }}
        >
          <FileDownload sx={{ mr: 1, fontSize: 20, color: colors.darkNavy }} /> Export PDF
        </MenuItem>
      </Menu>

      {/* Table - DARK NAVY + LIGHT CYAN THEMED */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2, 
          overflowX: 'auto', 
          border: `1px solid ${colors.borderColor}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: colors.darkNavy }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY }}>Hospital Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY }}>Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY }}>Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY }}>Contact</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY }}>Biomedical Head</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontFamily: FONT_FAMILY }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHospitals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: colors.lightText, fontFamily: FONT_FAMILY }}>
                    No hospitals found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredHospitals.map((hospital) => (
                <TableRow 
                  key={hospital.id} 
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(103, 232, 249, 0.04)',
                    },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                      {hospital.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px', color: colors.lightText }}>
                      {hospital.hospital_code || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                      {hospital.city}, {hospital.state}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>{hospital.phone}</Typography>
                    <Typography variant="caption" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>
                      {hospital.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }}>{hospital.biomedical_head || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={hospital.is_active ? 'Active' : 'Inactive'} 
                      size="small"
                      sx={{
                        bgcolor: hospital.is_active ? colors.success : colors.lightText,
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '11px',
                        fontFamily: FONT_FAMILY,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewDetails(hospital)}
                        sx={{ 
                          color: colors.darkNavy, 
                          '&:hover': { 
                            color: colors.lightCyanDark,
                            backgroundColor: 'rgba(103, 232, 249, 0.08)'
                          } 
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {isSuperAdmin && (
                      <>
                        <Tooltip title="Edit Hospital">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(hospital)}
                            sx={{ 
                              color: colors.darkNavy, 
                              '&:hover': { 
                                color: colors.lightCyanDark,
                                backgroundColor: 'rgba(103, 232, 249, 0.08)'
                              } 
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Hospital">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(hospital.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* VIEW DETAILS DIALOG - DARK NAVY + CYAN THEMED */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: FONT_FAMILY }}>
              Hospital Details
            </Typography>
            <IconButton onClick={handleCloseViewDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2 }}>
          {selectedHospital && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Business sx={{ fontSize: 40, color: colors.darkNavy }} />
                  <Box>
                    <Typography variant="h5" fontWeight={600} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                      {selectedHospital.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={selectedHospital.is_active ? 'Active' : 'Inactive'} 
                        size="small"
                        sx={{
                          bgcolor: selectedHospital.is_active ? colors.success : colors.lightText,
                          color: 'white',
                          fontWeight: 500,
                          height: 22,
                          fontSize: '11px',
                          fontFamily: FONT_FAMILY,
                        }}
                      />
                      {selectedHospital.hospital_code && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: colors.lightText,
                            border: `1px solid ${colors.borderColor}`,
                            borderRadius: '4px',
                            padding: '0 8px'
                          }}
                        >
                          Code: {selectedHospital.hospital_code}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  Address
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.address || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  City
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.city || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  State / Province
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.state || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  Country
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.country || 'Pakistan'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  Phone Number
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.phone || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  Hospital Email
                </Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.email || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  Hospital Director
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.director || 'Not Assigned'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ color: colors.lightText, fontFamily: FONT_FAMILY }} gutterBottom>
                  Biomedical Engineering Head
                </Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy, fontFamily: FONT_FAMILY }}>
                  {selectedHospital.biomedical_head || 'Not Assigned'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseViewDialog}
            variant="contained"
            sx={{ 
              bgcolor: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none', 
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              borderRadius: 2,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog - DARK NAVY + CYAN THEMED */}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} sx={{ fontFamily: FONT_FAMILY }}>
              {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, fontFamily: FONT_FAMILY }}>
                <Business fontSize="small" /> Hospital Information
              </Typography>
              <Divider sx={{ mt: 1, borderColor: colors.borderColor }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                placeholder="e.g., PAEC Karachi Hospital"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Code"
                name="hospital_code"
                value={formData.hospital_code || ''}
                onChange={handleFormChange}
                placeholder="e.g., HOS-001"
                disabled={!!editingHospital}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleFormChange}
                placeholder="Pakistan"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                multiline
                rows={2}
                required
                placeholder="Enter complete address"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
                placeholder="e.g., Karachi"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State / Province"
                name="state"
                value={formData.state}
                onChange={handleFormChange}
                placeholder="e.g., Sindh"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="+92-XX-XXXXXXX"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="hospital@domain.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.darkNavy, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mt: 1, fontFamily: FONT_FAMILY }}>
                <Person fontSize="small" /> Hospital Leadership
              </Typography>
              <Divider sx={{ mt: 1, borderColor: colors.borderColor }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Director"
                name="director"
                value={formData.director || ''}
                onChange={handleFormChange}
                placeholder="Enter Hospital Director name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Biomedical Engineering Head"
                name="biomedical_head"
                value={formData.biomedical_head || ''}
                onChange={handleFormChange}
                placeholder="Enter Biomedical Engineering Head name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: FONT_FAMILY,
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 1, 
                  borderRadius: 2, 
                  border: `1px solid rgba(103, 232, 249, 0.2)`,
                  backgroundColor: 'rgba(103, 232, 249, 0.04)',
                  '& .MuiAlert-icon': { color: colors.lightCyanDark },
                  '& .MuiAlert-message': {
                    fontFamily: FONT_FAMILY,
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: FONT_FAMILY }}>
                  <strong>Note:</strong> Hospital code is automatically generated. It will be used as a unique identifier for the hospital.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ 
              color: colors.darkNavy, 
              borderColor: colors.borderColor,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              '&:hover': { 
                borderColor: colors.lightCyan,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: colors.darkNavy,
              fontFamily: FONT_FAMILY,
              textTransform: 'none',
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
              },
              px: 4,
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              borderRadius: 2,
            }}
            startIcon={editingHospital ? <Edit /> : <Add />}
          >
            {editingHospital ? 'Update Hospital' : 'Create Hospital'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Hospitals