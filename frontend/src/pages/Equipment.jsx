// src/pages/Equipment.jsx
// ✅ FIXED: Added FormHelperText import

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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Menu,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  FormHelperText, // ✅ ADDED
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
  Image as ImageIcon,
  FileDownload,
  Refresh,
  Inventory,
  History,
  ErrorOutline,
  Build,
  Category,
  Business,
  MedicalServices,
  Warning as WarningIcon
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

// ==================== API OBJECT ====================
const apiEndpoints = {
  getEquipment: () => api.get('/equipment'),
  createEquipment: (data) => {
    console.log('📤 API createEquipment called with:', data)
    return api.post('/equipment', data)
  },
  updateEquipment: (id, data) => api.put(`/equipment/${id}`, data),
  deleteEquipment: (id) => api.delete(`/equipment/${id}`),
  getCategories: () => api.get('/equipment/categories/all'),
  getDepartments: () => api.get('/departments'),
  getDepartmentsByHospital: (hospitalId) => api.get(`/departments/hospital/${hospitalId}`),
  createCategory: (data) => api.post('/equipment/categories', data),
  createDepartment: (data) => api.post('/departments', data),
  createHospital: (data) => {
    console.log('🏥 Creating hospital with data:', data)
    return hospitalService.create(data)
  },
}

// ==================== HELPER FUNCTIONS ====================
// ✅ Get full URL for images
const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('/uploads')) {
    return `http://localhost:5000${url}`
  }
  return url
}

const Equipment = () => {
  const { user } = useSelector((state) => state.auth)
  
  // ✅ HOSPITAL_ADMIN = Access Denied
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Equipment Management." />
  }
  
  // ✅ ENGINEER and SUPER_ADMIN permissions
  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER'
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER'
  const canDelete = user?.role === 'SUPER_ADMIN'  // Only SUPER_ADMIN can delete
  const canViewHistory = user?.role === 'SUPER_ADMIN' || user?.role === 'ENGINEER'

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
  const [filters, setFilters] = useState({
    category: '',
    manufacturer: '',
    status: '',
    hospital: ''
  })

  const [viewTab, setViewTab] = useState(0)

  const [openCustomDialog, setOpenCustomDialog] = useState(false)
  const [customDialogType, setCustomDialogType] = useState('')
  const [customDialogValue, setCustomDialogValue] = useState('')
  const [customDialogLoading, setCustomDialogLoading] = useState(false)

  const [uploadedImages, setUploadedImages] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)

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
    hospital_id: false
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
      console.log('📤 Fetching equipment...')
      const response = await apiEndpoints.getEquipment()
      console.log('📥 Equipment Response:', response.data)
      
      if (response.data && response.data.success) {
        setEquipment(response.data.equipment || [])
      } else if (Array.isArray(response.data)) {
        setEquipment(response.data)
      } else if (response.data && response.data.equipment) {
        setEquipment(response.data.equipment)
      } else {
        console.warn('⚠️ Unexpected equipment response:', response.data)
        setEquipment([])
      }
    } catch (error) {
      console.error('❌ Equipment fetch error:', error)
      toast.error('Failed to fetch equipment')
      setEquipment([])
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('📤 Fetching categories...')
      const response = await apiEndpoints.getCategories()
      console.log('📥 Categories Response:', response.data)
      
      if (response.data && response.data.success) {
        setCategories(response.data.categories || [])
      } else if (Array.isArray(response.data)) {
        setCategories(response.data)
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
      console.log('📤 Fetching hospitals...')
      const response = await hospitalService.getAll()
      console.log('📥 Hospitals Response:', response.data)
      
      if (response.data && response.data.success) {
        setHospitals(response.data.hospitals || [])
      } else if (Array.isArray(response.data)) {
        setHospitals(response.data)
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
        console.log('⚠️ No hospital ID, skipping departments fetch')
        setDepartments([])
        return
      }
      
      console.log('📤 Fetching departments for hospital:', hospitalId)
      const response = await apiEndpoints.getDepartmentsByHospital(hospitalId)
      console.log('📥 Departments Response:', response.data)
      
      if (response.data && response.data.success) {
        setDepartments(response.data.departments || [])
      } else if (Array.isArray(response.data)) {
        setDepartments(response.data)
      } else {
        setDepartments([])
      }
    } catch (error) {
      console.error('Departments fetch error:', error)
      setDepartments([])
    }
  }

  useEffect(() => {
    if (!openDialog || editingEquipment) return

    if (user?.role === 'ENGINEER' && user?.hospital_id) {
      if (!formData.hospital_id) {
        setFormData(prev => ({ ...prev, hospital_id: Number(user.hospital_id) }))
      }
    }
  }, [openDialog, editingEquipment, formData.hospital_id, user])

  const handleImageUploadComplete = (files) => {
    console.log('📸 Images uploaded:', files)
    
    const imageUrls = files.map(f => f.url || f.fileUrl).filter(Boolean)
    
    console.log('📸 Image URLs extracted:', imageUrls)
    
    setUploadedImages(prev => [...prev, ...files])
    
    setFormData(prev => {
      const existingUrls = prev.image_url ? prev.image_url.split(',').filter(Boolean) : []
      const allUrls = [...existingUrls, ...imageUrls]
      return {
        ...prev,
        image_url: allUrls.join(',')
      }
    })
    
    toast.success(`${files.length} image(s) uploaded successfully`)
  }

  const handleImageDelete = (file) => {
    setUploadedImages(prev => prev.filter(f => f.url !== file.url))
    
    const currentImages = formData.image_url?.split(',') || []
    const updatedImages = currentImages.filter(url => url !== file.url)
    setFormData(prev => ({
      ...prev,
      image_url: updatedImages.join(',')
    }))
    
    toast.success('Image deleted successfully')
  }

  const handleExistingImageDelete = (imageUrl) => {
    const currentImages = formData.image_url?.split(',') || []
    const updatedImages = currentImages.filter(url => url !== imageUrl)
    setFormData(prev => ({
      ...prev,
      image_url: updatedImages.join(',')
    }))
    toast.success('Image removed')
  }

  const handleOpenCustomDialog = (type) => {
    if (type === 'hospital') {
      toast.info('Please add hospitals from the Hospitals page');
      return;
    }
    setCustomDialogType(type);
    setCustomDialogValue('');
    setOpenCustomDialog(true);
  };

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
      let response
      let newItem

      switch (customDialogType) {
        case 'category':
          console.log('📦 Creating category:', customDialogValue.trim())
          console.log('👤 Current user:', user)
          
          response = await apiEndpoints.createCategory({ name: customDialogValue.trim() })
          console.log('✅ Category response:', response.data)
          
          newItem = response.data.category
          setCategories(prev => [...prev, newItem])
          setFormData(prev => ({ ...prev, category_id: newItem.id }))
          toast.success('Category added successfully!')
          break

        case 'department':
          console.log('📦 Creating department:', customDialogValue.trim())
          const deptHospitalId = user?.role === 'SUPER_ADMIN' ? null : (formData.hospital_id || user?.hospital_id || null)
          response = await apiEndpoints.createDepartment({ 
            name: customDialogValue.trim(),
            hospital_id: deptHospitalId
          })
          newItem = response.data.department
          setDepartments(prev => [...prev, newItem])
          setFormData(prev => ({ ...prev, department_id: newItem.id }))
          toast.success('Department added successfully!')
          break

        default:
          toast.error('Unknown type')
      }

      handleCloseCustomDialog()
    } catch (error) {
      console.error('❌ Error saving custom item:', error)
      console.error('❌ Error response:', error.response?.data)
      
      let errorMsg = 'Failed to save'
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      } else if (error.message) {
        errorMsg = error.message
      }
      toast.error(errorMsg)
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
        { id: 3, error_title: 'Software crash', created_at: '2024-03-10T09:15:00', status: 'Pending' }
      ],
      repairs: [
        { id: 1, root_cause: 'Faulty power cable', engineer_name: 'Engr. Ali Khan', repair_date: '2024-01-20', status: 'Completed' },
        { id: 2, root_cause: 'Sensor replacement needed', engineer_name: 'Engr. Sara Ahmed', repair_date: '2024-02-25', status: 'In Progress' }
      ],
      maintenance: [
        { id: 1, maintenance_type: 'Preventive', completed_date: '2024-01-05', status: 'Completed' },
        { id: 2, maintenance_type: 'Corrective', completed_date: '2024-02-15', status: 'Completed' },
        { id: 3, maintenance_type: 'Preventive', completed_date: '2024-03-01', status: 'Scheduled' }
      ],
      spareParts: [
        { id: 1, part_name: 'Power Supply Unit', quantity: 2, total_cost: 15000 },
        { id: 2, part_name: 'Sensor Module', quantity: 1, total_cost: 8500 },
        { id: 3, part_name: 'Connecting Cable', quantity: 3, total_cost: 3000 }
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
    setFilters({ category: '', manufacturer: '', status: '', hospital: '' })
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
      const headers = ['Equipment Name', 'Category', 'Manufacturer', 'Model', 'Serial Number', 'Installation Year', 'Hospital', 'Department', 'Location', 'Status']
      const rows = filteredEquipment.map(e => [
        e.name,
        e.category_name || '',
        e.manufacturer || '',
        e.model || '',
        e.serial_number || '',
        e.installation_year || '',
        e.hospital_name || '',
        e.department_name || '',
        e.location || '',
        e.status || ''
      ])
      
      let csv = headers.join(',') + '\n'
      rows.forEach(row => {
        csv += row.join(',') + '\n'
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `equipment_${new Date().toISOString().split('T')[0]}.csv`
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
      const data = filteredEquipment.map(e => ({
        'Equipment Name': e.name,
        'Category': e.category_name || '',
        'Manufacturer': e.manufacturer || '',
        'Model': e.model || '',
        'Serial Number': e.serial_number || '',
        'Installation Year': e.installation_year || '',
        'Hospital': e.hospital_name || '',
        'Department': e.department_name || '',
        'Location': e.location || '',
        'Status': e.status || ''
      }))
      
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Equipment')
      XLSX.writeFile(wb, `equipment_${new Date().toISOString().split('T')[0]}.xlsx`)
      
      toast.success('Excel exported successfully!')
      handleExportClose()
    } catch (error) {
      toast.error('Failed to export Excel: ' + error.message)
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
        e.name,
        e.category_name || '',
        e.manufacturer || '',
        e.model || '',
        e.status || ''
      ])
      
      autoTable(doc, {
        head: [['Equipment Name', 'Category', 'Manufacturer', 'Model', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: '#0B5FA5', textColor: '#FFFFFF', fontSize: 9 },
        alternateRowStyles: { fillColor: '#F5F7FA' },
        margin: { left: 14, right: 14 }
      })
      
      doc.save(`equipment_${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success('PDF exported successfully!')
      handleExportClose()
    } catch (error) {
      toast.error('Failed to export PDF: ' + error.message)
    }
  }

  const handleOpenDialog = (equip = null) => {
    if (equip && !canEdit) {
      toast.error('You do not have permission to edit equipment')
      return
    }

    // For ENGINEER: Auto-fill hospital_id
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
    }
    setTouched({ name: false, hospital_id: false })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingEquipment(null)
    setUploadedImages([])
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    console.log(`📝 Form change: ${name} = ${value}`)
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))
  }

  const handleSubmit = async () => {
    try {
      console.log('📝 Current form data:', formData)
      console.log('👤 Current user:', user)

      if (!formData.name || formData.name.trim() === '') {
        toast.error('Equipment name is required')
        setTouched(prev => ({ ...prev, name: true }))
        return
      }

      // ENGINEER: Must have hospital_id
      let hospitalId = formData.hospital_id
      if (user?.role === 'ENGINEER') {
        if (!hospitalId || hospitalId === '') {
          if (user?.hospital_id) {
            hospitalId = Number(user.hospital_id)
          } else {
            toast.error('Hospital is required for Engineers')
            setTouched(prev => ({ ...prev, hospital_id: true }))
            return
          }
        }
        hospitalId = Number(hospitalId)
      } else {
        // SUPER_ADMIN: No hospital restriction
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

      console.log('🚀 Submitting equipment data:', JSON.stringify(submitData, null, 2))

      let response
      if (editingEquipment) {
        response = await apiEndpoints.updateEquipment(editingEquipment.id, submitData)
        toast.success('Equipment updated successfully')
      } else {
        response = await apiEndpoints.createEquipment(submitData)
        toast.success('Equipment created successfully')
      }

      console.log('✅ Response:', response.data)
      fetchEquipment()
      handleCloseDialog()
    } catch (error) {
      console.error('❌ Submit error:', error)
      console.error('❌ Error response:', error.response?.data)
      
      let errorMsg = 'Operation failed'
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error
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

  // ✅ ENGINEER: Filter by their hospital only
  const filteredEquipment = equipment.filter(item => {
    // ENGINEER can only see their hospital's equipment
    if (user?.role === 'ENGINEER' && item.hospital_id !== user.hospital_id) {
      return false
    }
    
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filters.category || item.category_id === parseInt(filters.category)
    const matchesManufacturer = !filters.manufacturer || item.manufacturer?.toLowerCase().includes(filters.manufacturer.toLowerCase())
    const matchesStatus = !filters.status || item.status === filters.status
    const matchesHospital = !filters.hospital || item.hospital_id === parseInt(filters.hospital)
    return matchesSearch && matchesCategory && matchesManufacturer && matchesStatus && matchesHospital
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      {/* Header - NO ICONS, NO ADMIN LABELS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
            Equipment
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchEquipment}
            size="small"
          >
            Refresh
          </Button>
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
              Add Equipment
            </Button>
          )}
        </Box>
      </Box>

      {/* Search & Filter Bar */}
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
        PaperProps={{ sx: { p: 2, width: 280 } }}
      >
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Filter Equipment
        </Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            label="Category"
          >
            <MenuItem value="">All</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Hospital</InputLabel>
          <Select
            name="hospital"
            value={filters.hospital}
            onChange={handleFilterChange}
            label="Hospital"
          >
            <MenuItem value="">All</MenuItem>
            {hospitals.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          size="small"
          label="Manufacturer"
          name="manufacturer"
          value={filters.manufacturer}
          onChange={handleFilterChange}
          placeholder="Filter by manufacturer"
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            label="Status"
          >
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

      {/* Equipment Table */}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{item.category_name || '-'}</TableCell>
                  <TableCell>{item.manufacturer || '-'}</TableCell>
                  <TableCell>{item.model || '-'}</TableCell>
                  <TableCell>{item.serial_number || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.status || 'Active'}
                    </Typography>
                  </TableCell>
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

      {/* View Details Dialog with Tabs */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Equipment Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2 }}>
          {selectedEquipment && (
            <Box>
              <Tabs 
                value={viewTab} 
                onChange={(e, v) => setViewTab(v)} 
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="General" />
                <Tab label="Error History" />
                <Tab label="Repair History" />
                <Tab label="Maintenance History" />
                <Tab label="Spare Parts" />
              </Tabs>

              {viewTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {selectedEquipment.name}
                        </Typography>
                        <Typography variant="body2">
                          {selectedEquipment.status || 'Active'}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                      Equipment Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Equipment Name</Typography>
                    <Typography variant="body1">{selectedEquipment.name}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Category</Typography>
                    <Typography variant="body1">{selectedEquipment.category_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Manufacturer</Typography>
                    <Typography variant="body1">{selectedEquipment.manufacturer || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Model</Typography>
                    <Typography variant="body1">{selectedEquipment.model || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Serial Number</Typography>
                    <Typography variant="body1">{selectedEquipment.serial_number || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Installation Year</Typography>
                    <Typography variant="body1">{selectedEquipment.installation_year || 'N/A'}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                      Location Details
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Hospital</Typography>
                    <Typography variant="body1">{selectedEquipment.hospital_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Department</Typography>
                    <Typography variant="body1">{selectedEquipment.department_name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Location</Typography>
                    <Typography variant="body1">{selectedEquipment.location || 'N/A'}</Typography>
                  </Grid>

                  {selectedEquipment.image_url && selectedEquipment.image_url.split(',').filter(Boolean).length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Equipment Images ({selectedEquipment.image_url.split(',').filter(Boolean).length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {selectedEquipment.image_url.split(',').filter(Boolean).map((url, idx) => {
                          const fullUrl = getFullImageUrl(url)
                          return (
                            <Box
                              key={idx}
                              sx={{
                                width: 150,
                                height: 150,
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid #e9ecef',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  boxShadow: 4
                                }
                              }}
                              onClick={() => window.open(fullUrl, '_blank')}
                            >
                              <Box
                                component="img"
                                src={fullUrl}
                                alt={`Equipment ${idx + 1}`}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  console.error('❌ Image load error:', fullUrl)
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                                }}
                              />
                            </Box>
                          )
                        })}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}

              {viewTab === 1 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                    Error History
                  </Typography>
                  {selectedEquipment.errors && selectedEquipment.errors.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
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
                            <TableRow key={idx} hover>
                              <TableCell>{err.error_title}</TableCell>
                              <TableCell>{new Date(err.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{err.status}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
                      No errors recorded for this equipment
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 2 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                    Repair History
                  </Typography>
                  {selectedEquipment.repairs && selectedEquipment.repairs.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Issue / Root Cause</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Engineer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.repairs.map((repair, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{repair.root_cause || 'N/A'}</TableCell>
                              <TableCell>{repair.engineer_name || 'N/A'}</TableCell>
                              <TableCell>{new Date(repair.repair_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{repair.status}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
                      No repairs recorded for this equipment
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 3 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                    Maintenance History
                  </Typography>
                  {selectedEquipment.maintenance && selectedEquipment.maintenance.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
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
                            <TableRow key={idx} hover>
                              <TableCell>{maint.maintenance_type}</TableCell>
                              <TableCell>{new Date(maint.completed_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{maint.status}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
                      No maintenance records for this equipment
                    </Typography>
                  )}
                </Box>
              )}

              {viewTab === 4 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                    Spare Parts Used
                  </Typography>
                  {selectedEquipment.spareParts && selectedEquipment.spareParts.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Part Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Total Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedEquipment.spareParts.map((part, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{part.part_name}</TableCell>
                              <TableCell align="center">
                                <Typography variant="body2">{part.quantity}</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 500 }}>
                                Rs. {part.total_cost.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 600 }}>
                              Total:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0B5FA5' }}>
                              Rs. {selectedEquipment.spareParts.reduce((sum, p) => sum + p.total_cost, 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3, textAlign: 'center' }}>
                      No spare parts used for this equipment
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseView}
            variant="contained"
            sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
          >
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
              <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
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
                  <InputLabel>Equipment Category</InputLabel>
                  <Select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleFormChange}
                    label="Equipment Category"
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenCustomDialog('category')}
                  sx={{ mt: 0.5 }}
                >
                  Add New Category
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Manufacturer (Make)"
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Serial Number"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleFormChange}
                />
              </Grid>

              {/* Hospital - Auto-set for Engineer, Disabled for Super Admin */}
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
                  {user?.role === 'SUPER_ADMIN' && (
                    <FormHelperText>Super Admin: Leave blank for all hospitals</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleFormChange}
                    label="Department"
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    {departments.map(d => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenCustomDialog('department')}
                  sx={{ mt: 0.5 }}
                >
                  Add New Department
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="e.g., Room 101, Ward 3"
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
                  endpoint="/api/upload"
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
                
                {formData.image_url && formData.image_url.split(',').filter(Boolean).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
                      Uploaded Images ({formData.image_url.split(',').filter(Boolean).length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.image_url.split(',').filter(Boolean).map((url, idx) => {
                        const fullUrl = getFullImageUrl(url)
                        return (
                          <Box 
                            key={idx} 
                            sx={{ 
                              position: 'relative',
                              width: 120,
                              height: 120,
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: '1px solid #e9ecef',
                              '&:hover': {
                                boxShadow: 4,
                                '& .delete-btn': {
                                  display: 'flex'
                                }
                              }
                            }}
                          >
                            <Box
                              component="img"
                              src={fullUrl}
                              alt={`Equipment ${idx + 1}`}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                }
                              }}
                              onClick={() => window.open(fullUrl, '_blank')}
                              onError={(e) => {
                                console.error('❌ Image load error:', fullUrl)
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                              }}
                            />
                            <IconButton
                              className="delete-btn"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                bgcolor: 'rgba(255,255,255,0.9)',
                                boxShadow: 1,
                                display: 'none',
                                '&:hover': {
                                  bgcolor: '#ffebee'
                                }
                              }}
                              onClick={() => handleExistingImageDelete(url)}
                            >
                              <Close fontSize="small" color="error" />
                            </IconButton>
                          </Box>
                        )
                      })}
                    </Box>
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
            <IconButton onClick={handleCloseCustomDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            label={`Enter ${customDialogType} name`}
            value={customDialogValue}
            onChange={(e) => setCustomDialogValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveCustomItem()
              }
            }}
            sx={{ mt: 1 }}
            placeholder={`e.g., ${customDialogType === 'category' ? 'X-Ray Machine' : customDialogType === 'department' ? 'Cardiology' : 'City Hospital'}`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseCustomDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCustomItem}
            disabled={customDialogLoading || !customDialogValue.trim()}
            sx={{
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#084a8a' }
            }}
          >
            {customDialogLoading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Equipment