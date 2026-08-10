// src/pages/Equipment.jsx
// CLEAN VERSION - User Friendly with Serial Number Validation

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
  Tooltip,
  Menu,
  CircularProgress,
  Tabs,
  Tab,
  FormHelperText,
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
  FileDownload,
  Refresh,
  CheckCircle,
  Cancel
} from '@mui/icons-material'
import { equipmentService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import FileUpload from '../components/FileUpload'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../api/axios'
import AccessDenied from '../components/Auth/AccessDenied'
import { Divider } from '@mui/material'
const apiEndpoints = {
  getEquipment: () => api.get('/equipment'),
  createEquipment: (data) => api.post('/equipment', data),
  updateEquipment: (id, data) => api.put(`/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/equipment/${id}`),
  getCategories: () => api.get('/equipment/categories/all'),
  getDepartmentsByHospital: (hospitalId) => api.get(`/departments/hospital/${hospitalId}`),
  createCategory: (data) => api.post('/equipment/categories', data),
  createDepartment: (data) => api.post('/departments', data),
}

const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads')) return `http://localhost:5000${url}`
  return url
}

const Equipment = () => {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Equipment Management." />
  }
  
  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER'
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER'
  const canDelete = user?.role === 'SUPER_ADMIN'

  const [equipment, setEquipment] = useState([])
  const [categories, setCategories] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [viewTab, setViewTab] = useState(0)
  const [openCustomDialog, setOpenCustomDialog] = useState(false)
  const [customDialogType, setCustomDialogType] = useState('')
  const [customDialogValue, setCustomDialogValue] = useState('')
  const [customDialogLoading, setCustomDialogLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])

  const [filters, setFilters] = useState({
    category: '',
    manufacturer: '',
    status: '',
    hospital: ''
  })

  // ✅ SERIAL NUMBER VALIDATION
  const [serialStatus, setSerialStatus] = useState({
    isValid: true,
    message: '',
    isChecking: false
  })

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    installation_year: '',
    hospital_id: '',
    department_id: '',
    location: '',
    status: 'Active',
    image_url: ''
  })

  const [touched, setTouched] = useState({
    name: false,
    hospital_id: false,
    serial_number: false
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchEquipment(),
        fetchCategories(),
        fetchHospitals(),
        fetchDepartments()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await apiEndpoints.getEquipment()
      if (response.data && response.data.success) {
        setEquipment(response.data.equipment || [])
      } else if (Array.isArray(response.data)) {
        setEquipment(response.data)
      } else {
        setEquipment([])
      }
    } catch (error) {
      console.error('Equipment fetch error:', error)
      toast.error('Failed to fetch equipment')
      setEquipment([])
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiEndpoints.getCategories()
      if (response.data && response.data.success) {
        setCategories(response.data.categories || [])
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Categories fetch error:', error)
      setCategories([])
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll()
      if (response.data && response.data.success) {
        setHospitals(response.data.hospitals || [])
      } else {
        setHospitals([])
      }
    } catch (error) {
      console.error('Hospitals fetch error:', error)
      setHospitals([])
    }
  }

  const fetchDepartments = async () => {
    try {
      const hospitalId = user?.hospital_id || formData.hospital_id
      if (!hospitalId) {
        setDepartments([])
        return
      }
      const response = await apiEndpoints.getDepartmentsByHospital(hospitalId)
      if (response.data && response.data.success) {
        setDepartments(response.data.departments || [])
      } else {
        setDepartments([])
      }
    } catch (error) {
      console.error('Departments fetch error:', error)
      setDepartments([])
    }
  }

  // ✅ CHECK SERIAL NUMBER
  const checkSerialNumber = async (serialNumber, excludeId = null) => {
    if (!serialNumber || serialNumber.trim() === '') {
      setSerialStatus({ isValid: true, message: '', isChecking: false })
      return true
    }

    setSerialStatus(prev => ({ ...prev, isChecking: true }))

    try {
      const response = await apiEndpoints.getEquipment()
      let allEquipment = []
      if (response.data && response.data.success) {
        allEquipment = response.data.equipment || []
      } else if (Array.isArray(response.data)) {
        allEquipment = response.data
      }

      const duplicate = allEquipment.find(item => 
        item.serial_number && 
        item.serial_number.toLowerCase() === serialNumber.trim().toLowerCase() &&
        (excludeId === null || item.id !== excludeId)
      )

      setSerialStatus({
        isValid: !duplicate,
        message: duplicate ? '❌ Serial number already exists' : '✅ Serial number available',
        isChecking: false
      })

      return !duplicate
    } catch (error) {
      console.error('Serial check error:', error)
      setSerialStatus({ isValid: true, message: '', isChecking: false })
      return true
    }
  }

  useEffect(() => {
    if (!openDialog || editingEquipment) return
    if (user?.role === 'ENGINEER' && user?.hospital_id) {
      if (!formData.hospital_id) {
        setFormData(prev => ({ ...prev, hospital_id: Number(user.hospital_id) }))
      }
    }
  }, [openDialog, editingEquipment])

  const handleImageUploadComplete = (files) => {
    const imageUrls = files.map(f => f.url || f.fileUrl).filter(Boolean)
    setUploadedImages(prev => [...prev, ...files])
    setFormData(prev => {
      const existingUrls = prev.image_url ? prev.image_url.split(',').filter(Boolean) : []
      return { ...prev, image_url: [...existingUrls, ...imageUrls].join(',') }
    })
    toast.success(`${files.length} image(s) uploaded`)
  }

  const handleImageDelete = (file) => {
    setUploadedImages(prev => prev.filter(f => f.url !== file.url))
    const currentImages = formData.image_url?.split(',') || []
    const updatedImages = currentImages.filter(url => url !== file.url)
    setFormData(prev => ({ ...prev, image_url: updatedImages.join(',') }))
  }

  const handleExistingImageDelete = (imageUrl) => {
    const currentImages = formData.image_url?.split(',') || []
    const updatedImages = currentImages.filter(url => url !== imageUrl)
    setFormData(prev => ({ ...prev, image_url: updatedImages.join(',') }))
    toast.success('Image removed')
  }

  const handleOpenCustomDialog = (type) => {
    if (type === 'hospital') {
      toast.info('Please add hospitals from the Hospitals page')
      return
    }
    setCustomDialogType(type)
    setCustomDialogValue('')
    setOpenCustomDialog(true)
  }

  const handleCloseCustomDialog = () => {
    setOpenCustomDialog(false)
    setCustomDialogValue('')
    setCustomDialogType('')
  }

  const handleSaveCustomItem = async () => {
    if (!customDialogValue.trim()) {
      toast.error('Please enter a name')
      return
    }

    setCustomDialogLoading(true)
    try {
      let response, newItem

      if (customDialogType === 'category') {
        response = await apiEndpoints.createCategory({ name: customDialogValue.trim() })
        newItem = response.data.category
        setCategories(prev => [...prev, newItem])
        setFormData(prev => ({ ...prev, category_id: newItem.id }))
        toast.success('Category added!')
      } else if (customDialogType === 'department') {
        const deptHospitalId = user?.role === 'SUPER_ADMIN' ? null : (formData.hospital_id || user?.hospital_id || null)
        response = await apiEndpoints.createDepartment({ 
          name: customDialogValue.trim(),
          hospital_id: deptHospitalId
        })
        newItem = response.data.department
        setDepartments(prev => [...prev, newItem])
        setFormData(prev => ({ ...prev, department_id: newItem.id }))
        toast.success('Department added!')
      }

      handleCloseCustomDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save')
    } finally {
      setCustomDialogLoading(false)
    }
  }

  const handleViewDetails = (equip) => {
    setSelectedEquipment({
      ...equip,
      image_url: equip.image_url || '',
      errors: [
        { id: 1, error_title: 'Power supply failure', created_at: '2024-01-15T10:30:00', status: 'Resolved' },
        { id: 2, error_title: 'Sensor calibration error', created_at: '2024-02-20T14:45:00', status: 'In Progress' },
      ],
      repairs: [
        { id: 1, root_cause: 'Faulty power cable', engineer_name: 'Engr. Ali Khan', repair_date: '2024-01-20', status: 'Completed' },
      ],
      maintenance: [
        { id: 1, maintenance_type: 'Preventive', completed_date: '2024-01-05', status: 'Completed' },
        { id: 2, maintenance_type: 'Preventive', completed_date: '2024-03-01', status: 'Scheduled' },
      ],
      spareParts: [
        { id: 1, part_name: 'Power Supply Unit', quantity: 2, total_cost: 15000 },
        { id: 2, part_name: 'Sensor Module', quantity: 1, total_cost: 8500 },
      ]
    })
    setViewTab(0)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setSelectedEquipment(null)
    setViewTab(0)
  }

  const handleFilterClick = (event) => setFilterAnchorEl(event.currentTarget)
  const handleFilterClose = () => setFilterAnchorEl(null)

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const clearFilters = () => {
    setFilters({ category: '', manufacturer: '', status: '', hospital: '' })
    setFilterAnchorEl(null)
    toast.info('Filters cleared')
  }

  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget)
  const handleExportClose = () => setExportAnchorEl(null)

  const exportToCSV = () => {
    try {
      const headers = ['Equipment Name', 'Category', 'Manufacturer', 'Model', 'Serial Number', 'Status']
      const rows = filteredEquipment.map(e => [
        e.name, e.category_name || '', e.manufacturer || '', 
        e.model || '', e.serial_number || '', e.status || ''
      ])
      let csv = headers.join(',') + '\n'
      rows.forEach(row => { csv += row.join(',') + '\n' })
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `equipment_${new Date().toISOString().split('T')[0]}.csv`
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
      const data = filteredEquipment.map(e => ({
        'Equipment Name': e.name,
        'Category': e.category_name || '',
        'Manufacturer': e.manufacturer || '',
        'Model': e.model || '',
        'Serial Number': e.serial_number || '',
        'Status': e.status || ''
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Equipment')
      XLSX.writeFile(wb, `equipment_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      doc.setTextColor('#0B5FA5')
      doc.text('Equipment Report', 14, 20)
      doc.setFontSize(10)
      doc.setTextColor('#666666')
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total Equipment: ${filteredEquipment.length}`, 14, 34)
      
      const tableData = filteredEquipment.map(e => [
        e.name, e.category_name || '', e.manufacturer || '', e.model || '', e.status || ''
      ])
      autoTable(doc, {
        head: [['Equipment', 'Category', 'Manufacturer', 'Model', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: '#0B5FA5', textColor: '#FFFFFF', fontSize: 9 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 14, right: 14 }
      })
      doc.save(`equipment_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported!')
      handleExportClose()
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const handleOpenDialog = (equip = null) => {
    if (equip && !canEdit) {
      toast.error('You do not have permission to edit equipment')
      return
    }

    let defaultHospitalId = ''
    if (user?.role === 'ENGINEER' && user?.hospital_id) {
      defaultHospitalId = Number(user.hospital_id)
    }
    
    if (equip) {
      setEditingEquipment(equip)
      setFormData({
        name: equip.name || '',
        category_id: equip.category_id || '',
        manufacturer: equip.manufacturer || '',
        model: equip.model || '',
        serial_number: equip.serial_number || '',
        installation_year: equip.installation_year || '',
        hospital_id: equip.hospital_id || defaultHospitalId,
        department_id: equip.department_id || '',
        location: equip.location || '',
        status: equip.status || 'Active',
        image_url: equip.image_url || ''
      })
      
      if (equip.serial_number) {
        checkSerialNumber(equip.serial_number, equip.id)
      } else {
        setSerialStatus({ isValid: true, message: '', isChecking: false })
      }
      
      if (equip.image_url) {
        const existingImages = equip.image_url.split(',').filter(Boolean).map(url => ({
          url: url,
          name: url.split('/').pop(),
          type: 'image',
          size: 0
        }))
        setUploadedImages(existingImages)
      } else {
        setUploadedImages([])
      }
    } else {
      setEditingEquipment(null)
      setFormData({
        name: '',
        category_id: '',
        manufacturer: '',
        model: '',
        serial_number: '',
        installation_year: '',
        hospital_id: defaultHospitalId,
        department_id: '',
        location: '',
        status: 'Active',
        image_url: ''
      })
      setUploadedImages([])
      setSerialStatus({ isValid: true, message: '', isChecking: false })
    }
    setTouched({ name: false, hospital_id: false, serial_number: false })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingEquipment(null)
    setUploadedImages([])
    setSerialStatus({ isValid: true, message: '', isChecking: false })
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))

    if (name === 'serial_number') {
      const excludeId = editingEquipment ? editingEquipment.id : null
      if (value && value.trim() !== '') {
        checkSerialNumber(value, excludeId)
      } else {
        setSerialStatus({ isValid: true, message: '', isChecking: false })
      }
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Equipment name is required')
        setTouched(prev => ({ ...prev, name: true }))
        return
      }

      if (formData.serial_number && formData.serial_number.trim() !== '') {
        const isValid = await checkSerialNumber(
          formData.serial_number, 
          editingEquipment ? editingEquipment.id : null
        )
        if (!isValid) {
          toast.error('❌ This serial number is already in use. Please use a unique serial number.')
          return
        }
      }

      let hospitalId = formData.hospital_id
      if (user?.role === 'ENGINEER') {
        if (!hospitalId || hospitalId === '') {
          if (user?.hospital_id) {
            hospitalId = Number(user.hospital_id)
          } else {
            toast.error('Hospital is required for Engineers')
            return
          }
        }
        hospitalId = Number(hospitalId)
      } else {
        hospitalId = null
      }

      const submitData = {
        name: formData.name.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        manufacturer: formData.manufacturer || '',
        model: formData.model || '',
        serial_number: formData.serial_number || '',
        installation_year: formData.installation_year ? parseInt(formData.installation_year) : null,
        hospital_id: hospitalId,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        location: formData.location || '',
        status: formData.status || 'Active',
        image_url: formData.image_url || ''
      }

      if (editingEquipment) {
        await apiEndpoints.updateEquipment(editingEquipment.id, submitData)
        toast.success('Equipment updated successfully')
      } else {
        await apiEndpoints.createEquipment(submitData)
        toast.success('Equipment created successfully')
      }

      fetchEquipment()
      handleCloseDialog()
    } catch (error) {
      console.error('Submit error:', error)
      let errorMsg = 'Operation failed'
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('serial number') || 
            error.response.data.message.includes('duplicate')) {
          errorMsg = '❌ This serial number is already in use. Please use a unique serial number.'
        } else {
          errorMsg = error.response.data.message
        }
      } else if (error.message) {
        errorMsg = error.message
      }
      toast.error(errorMsg)
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete equipment')
      return
    }
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await apiEndpoints.deleteEquipment(id)
        toast.success('Equipment deleted successfully')
        fetchEquipment()
      } catch (error) {
        toast.error('Failed to delete equipment')
      }
    }
  }

  const filteredEquipment = equipment.filter(item => {
    if (user?.role === 'ENGINEER' && item.hospital_id !== user.hospital_id) {
      return false
    }
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filters.category || item.category_id === parseInt(filters.category)
    const matchesManufacturer = !filters.manufacturer || item.manufacturer?.toLowerCase().includes(filters.manufacturer.toLowerCase())
    const matchesStatus = !filters.status || item.status === filters.status
    const matchesHospital = !filters.hospital || item.hospital_id === parseInt(filters.hospital)
    return matchesSearch && matchesCategory && matchesManufacturer && matchesStatus && matchesHospital
  })

  if (loading) return <LinearProgress />

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Equipment
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchEquipment} size="small">
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
            >
              Add Equipment
            </Button>
          )}
        </Box>
      </Box>

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search equipment..."
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
          <Button variant="outlined" startIcon={<FilterList />} onClick={handleFilterClick}>
            Filter
          </Button>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportClick}>
            Export
          </Button>
        </Box>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ sx: { p: 2, width: 280 } }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Filter Equipment
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select name="category" value={filters.category} onChange={handleFilterChange} label="Category">
            <MenuItem value="">All</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Hospital</InputLabel>
          <Select name="hospital" value={filters.hospital} onChange={handleFilterChange} label="Hospital">
            <MenuItem value="">All</MenuItem>
            {hospitals.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth size="small" label="Manufacturer" name="manufacturer"
          value={filters.manufacturer} onChange={handleFilterChange}
          placeholder="Filter by manufacturer" sx={{ mb: 2 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select name="status" value={filters.status} onChange={handleFilterChange} label="Status">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Maintenance">Maintenance</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Retired">Retired</MenuItem>
          </Select>
        </FormControl>

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
        <MenuItem onClick={exportToCSV}><FileDownload sx={{ mr: 1, fontSize: 20 }} /> CSV</MenuItem>
        <MenuItem onClick={exportToExcel}><FileDownload sx={{ mr: 1, fontSize: 20 }} /> Excel</MenuItem>
        <MenuItem onClick={exportToPDF}><FileDownload sx={{ mr: 1, fontSize: 20 }} /> PDF</MenuItem>
      </Menu>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Manufacturer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Model</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Serial No.</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEquipment.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No equipment found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipment.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                  </TableCell>
                  <TableCell>{item.category_name || '-'}</TableCell>
                  <TableCell>{item.manufacturer || '-'}</TableCell>
                  <TableCell>{item.model || '-'}</TableCell>
                  <TableCell>{item.serial_number || '-'}</TableCell>
                  <TableCell>{item.status || 'Active'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary" onClick={() => handleViewDetails(item)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {canEdit && (
                      <Tooltip title="Edit Equipment">
                        <IconButton size="small" color="info" onClick={() => handleOpenDialog(item)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete Equipment">
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Equipment Details</Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2 }}>
          {selectedEquipment && (
            <Box>
              <Tabs value={viewTab} onChange={(e, v) => setViewTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="General" />
                <Tab label="Error History" />
                <Tab label="Repair History" />
                <Tab label="Maintenance" />
                <Tab label="Spare Parts" />
              </Tabs>

              {viewTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6">{selectedEquipment.name}</Typography>
                    <Typography variant="body2" color="textSecondary">Status: {selectedEquipment.status}</Typography>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">Category</Typography>
                    <Typography variant="body2">{selectedEquipment.category_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">Manufacturer</Typography>
                    <Typography variant="body2">{selectedEquipment.manufacturer || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">Model</Typography>
                    <Typography variant="body2">{selectedEquipment.model || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">Serial Number</Typography>
                    <Typography variant="body2">{selectedEquipment.serial_number || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">Installation Year</Typography>
                    <Typography variant="body2">{selectedEquipment.installation_year || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">Hospital</Typography>
                    <Typography variant="body2">{selectedEquipment.hospital_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="textSecondary">Department</Typography>
                    <Typography variant="body2">{selectedEquipment.department_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Location</Typography>
                    <Typography variant="body2">{selectedEquipment.location || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              )}

              {viewTab === 1 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Error History</Typography>
                  {selectedEquipment.errors?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.errors.map((err, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{err.error_title}</TableCell>
                              <TableCell>{new Date(err.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>{err.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                      No errors recorded
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 2 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Repair History</Typography>
                  {selectedEquipment.repairs?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Root Cause</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Engineer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.repairs.map((repair, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{repair.root_cause || 'N/A'}</TableCell>
                              <TableCell>{repair.engineer_name || 'N/A'}</TableCell>
                              <TableCell>{new Date(repair.repair_date).toLocaleDateString()}</TableCell>
                              <TableCell>{repair.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                      No repairs recorded
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 3 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Maintenance History</Typography>
                  {selectedEquipment.maintenance?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.maintenance.map((maint, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{maint.maintenance_type}</TableCell>
                              <TableCell>{new Date(maint.completed_date).toLocaleDateString()}</TableCell>
                              <TableCell>{maint.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                      No maintenance records
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 4 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Spare Parts</Typography>
                  {selectedEquipment.spareParts?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Part Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Total Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.spareParts.map((part, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{part.part_name}</TableCell>
                              <TableCell align="center">{part.quantity}</TableCell>
                              <TableCell align="right">Rs. {part.total_cost.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>Total:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0B5FA5' }}>
                              Rs. {selectedEquipment.spareParts.reduce((sum, p) => sum + p.total_cost, 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                      No spare parts used
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView} variant="contained" sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      {(canCreate || canEdit) && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
              </Typography>
              <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Equipment Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  error={touched.name && !formData.name}
                  helperText={touched.name && !formData.name ? 'Equipment name is required' : ''}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select name="category_id" value={formData.category_id} onChange={handleFormChange} label="Category">
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button size="small" startIcon={<Add />} onClick={() => handleOpenCustomDialog('category')} sx={{ mt: 0.5 }}>
                  Add New Category
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleFormChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Model" name="model" value={formData.model} onChange={handleFormChange} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Year of Installation"
                  name="installation_year"
                  type="number"
                  value={formData.installation_year}
                  onChange={handleFormChange}
                  inputProps={{ min: 1900, max: 2155 }}
                />
              </Grid>

              {/* ✅ SERIAL NUMBER WITH GREEN/RED STATUS */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleFormChange}
                  placeholder="Enter unique serial number"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: serialStatus.message 
                          ? (serialStatus.isValid ? '#28a745' : '#d32f2f')
                          : undefined
                      }
                    }
                  }}
                  InputProps={{
                    endAdornment: serialStatus.message && (
                      <InputAdornment position="end">
                        {serialStatus.isValid ? (
                          <CheckCircle sx={{ color: '#28a745', fontSize: 22 }} />
                        ) : (
                          <Cancel sx={{ color: '#d32f2f', fontSize: 22 }} />
                        )}
                      </InputAdornment>
                    )
                  }}
                />
                {serialStatus.message && (
                  <FormHelperText 
                    sx={{ 
                      color: serialStatus.isValid ? '#28a745' : '#d32f2f',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      mt: 0.5
                    }}
                  >
                    {serialStatus.message}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Hospital</InputLabel>
                  <Select
                    name="hospital_id"
                    value={formData.hospital_id}
                    onChange={handleFormChange}
                    label="Hospital"
                    disabled={user?.role === 'ENGINEER'}
                  >
                    <MenuItem value="">Select Hospital</MenuItem>
                    {hospitals.map(h => (
                      <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                    ))}
                  </Select>
                  {user?.role === 'ENGINEER' && (
                    <FormHelperText>Auto-assigned to your hospital</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select name="department_id" value={formData.department_id} onChange={handleFormChange} label="Department">
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map(d => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button size="small" startIcon={<Add />} onClick={() => handleOpenCustomDialog('department')} sx={{ mt: 0.5 }}>
                  Add New Department
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Location" name="location" value={formData.location} onChange={handleFormChange} placeholder="e.g., Room 101" />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={formData.status} onChange={handleFormChange} label="Status">
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Retired">Retired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Equipment Images
                </Typography>
                <FileUpload
                  endpoint="/service-documentation/upload"
                  accept="image/*"
                  multiple={true}
                  label="Click to upload equipment images"
                  maxFiles={5}
                  maxSize={10}
                  showPreview={true}
                  onUploadComplete={handleImageUploadComplete}
                  onUploadError={(error) => toast.error('Upload failed: ' + error)}
                  onDelete={handleImageDelete}
                  existingFiles={formData.image_url ? formData.image_url.split(',').filter(Boolean).map(url => ({
                    url: url,
                    name: url.split('/').pop(),
                    type: 'image',
                    size: 0
                  })) : []}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!serialStatus.isValid && formData.serial_number !== ''}
              sx={{
                bgcolor: '#0B5FA5',
                '&:hover': { bgcolor: '#084a8a' },
                '&.Mui-disabled': { bgcolor: '#bdbdbd' }
              }}
            >
              {editingEquipment ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Custom Add Dialog */}
      <Dialog open={openCustomDialog} onClose={handleCloseCustomDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Add New {customDialogType.charAt(0).toUpperCase() + customDialogType.slice(1)}
            </Typography>
            <IconButton onClick={handleCloseCustomDialog}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            label={`Enter ${customDialogType} name`}
            value={customDialogValue}
            onChange={(e) => setCustomDialogValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveCustomItem()}
            sx={{ mt: 1 }}
            placeholder={`e.g., ${customDialogType === 'category' ? 'X-Ray Machine' : 'Cardiology'}`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseCustomDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCustomItem}
            disabled={customDialogLoading || !customDialogValue.trim()}
            sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
          >
            {customDialogLoading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Equipment