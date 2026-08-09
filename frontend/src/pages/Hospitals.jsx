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

// REMOVED: getStatusColor function - No longer needed

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

  // ============ FILTER FUNCTIONS ============
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

  // ============ EXPORT FUNCTIONS ============
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
        doc.setTextColor('#0B5FA5')
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
          headStyles: { fillColor: '#0B5FA5', textColor: '#FFFFFF', fontSize: 9, fontStyle: 'bold' },
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

  // ============ VIEW DETAILS ============
  const handleViewDetails = (hospital) => {
    setSelectedHospital(hospital)
    setOpenViewDialog(true)
  }

  // ============ AUTO-GENERATE CODE ============
  const generateHospitalCode = () => {
    const prefix = 'HOS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  // ============ HANDLE FUNCTIONS ============
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

  // ============ FILTERED HOSPITALS ============
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
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Hospitals
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAllData}
            size="small"
          >
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: '#0B5FA5',
                '&:hover': { bgcolor: '#084a8a' }
              }}
            >
              Add Hospital
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
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
                  <Search />
                </InputAdornment>
              )
            }}
          />
          
          <Button 
            variant="outlined" 
            startIcon={<FilterList />}
            onClick={handleFilterClick}
          >
            Filter
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={handleExportClick}
          >
            Export
          </Button>
        </Box>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ sx: { p: 2, width: 250 } }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Filter Hospitals
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
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
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleFilterClose} fullWidth size="small">
            Apply
          </Button>
          <Button variant="outlined" onClick={clearFilters} fullWidth size="small">
            Clear
          </Button>
        </Box>
      </Menu>

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

      {/* Table - REMOVED Status Color and Chips */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hospital Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Location</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Biomedical Head</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHospitals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No hospitals found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredHospitals.map((hospital) => (
                <TableRow key={hospital.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {hospital.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {hospital.hospital_code || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {hospital.city}, {hospital.state}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{hospital.phone}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {hospital.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{hospital.biomedical_head || '-'}</TableCell>
                  <TableCell>
                    {/* REMOVED: Colored Status - showing plain text */}
                    <Typography variant="body2">
                      {hospital.is_active ? 'Active' : 'Inactive'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary" onClick={() => handleViewDetails(hospital)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {isSuperAdmin && (
                      <>
                        <Tooltip title="Edit Hospital">
                          <IconButton size="small" color="info" onClick={() => handleOpenDialog(hospital)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Hospital">
                          <IconButton size="small" color="error" onClick={() => handleDelete(hospital.id)}>
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

      {/* VIEW DETAILS DIALOG - REMOVED Status Color */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
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
              {/* Hospital Name */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Business sx={{ fontSize: 40, color: '#0B5FA5' }} />
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {selectedHospital.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {/* REMOVED: Colored Status - showing plain text */}
                      <Typography variant="body2">
                        {selectedHospital.is_active ? 'Active' : 'Inactive'}
                      </Typography>
                      {selectedHospital.hospital_code && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: '#6c757d',
                            border: '1px solid #dee2e6',
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
                <Divider />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Address
                </Typography>
                <Typography variant="body1">
                  {selectedHospital.address || 'N/A'}
                </Typography>
              </Grid>

              {/* City */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  City
                </Typography>
                <Typography variant="body1">
                  {selectedHospital.city || 'N/A'}
                </Typography>
              </Grid>

              {/* State */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  State / Province
                </Typography>
                <Typography variant="body1">
                  {selectedHospital.state || 'N/A'}
                </Typography>
              </Grid>

              {/* Country */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Country
                </Typography>
                <Typography variant="body1">
                  {selectedHospital.country || 'Pakistan'}
                </Typography>
              </Grid>

              {/* Phone */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Phone Number
                </Typography>
                <Typography variant="body1">
                  {selectedHospital.phone || 'N/A'}
                </Typography>
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Hospital Email
                </Typography>
                <Typography variant="body1">
                  {selectedHospital.email || 'N/A'}
                </Typography>
              </Grid>

              {/* Director */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Hospital Director
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {selectedHospital.director || 'Not Assigned'}
                </Typography>
              </Grid>

              {/* Biomedical Head */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Biomedical Engineering Head
                </Typography>
                <Typography variant="body1" fontWeight={500}>
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
            sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business fontSize="small" /> Hospital Information
              </Typography>
              <Divider sx={{ mt: 1 }} />
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
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Person fontSize="small" /> Hospital Leadership
              </Typography>
              <Divider sx={{ mt: 1 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital Director"
                name="director"
                value={formData.director || ''}
                onChange={handleFormChange}
                placeholder="Enter Hospital Director name"
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
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
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
            sx={{ color: '#6c757d', borderColor: '#6c757d' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#084a8a' },
              px: 4
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