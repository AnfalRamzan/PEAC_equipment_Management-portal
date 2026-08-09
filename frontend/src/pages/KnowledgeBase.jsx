// src/pages/KnowledgeBase.jsx - REMOVED VIEW ONLY ALERT

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Divider,
  Snackbar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material'
import {
  Search,
  Add,
  Visibility,
  Edit,
  Delete,
  Close,
  Refresh,
  MedicalServices,
  Build,
  Person,
  CalendarToday,
  LocalHospital,
  Business,
  Description,
  Image,
  AttachFile,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  AccessTime,
  PictureAsPdf,
  Engineering,
  DeleteForever,
  Inventory,
  AddCircle,
  RemoveCircle,
  ToggleOn,
  ToggleOff
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import api from '../api/axios'
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

const KnowledgeBase = () => {
  const { user } = useSelector((state) => state.auth)
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN'
  
  // ✅ PERMISSIONS - ONLY Super Admin can Add/Edit/Delete
  const canAdd = isSuperAdmin
  const canEdit = isSuperAdmin
  const canDelete = isSuperAdmin
  const isViewOnly = !isSuperAdmin

  const [loading, setLoading] = useState(true)
  const [equipmentList, setEquipmentList] = useState([])
  const [filterEquipment, setFilterEquipment] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [solutions, setSolutions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [openSolutionsDialog, setOpenSolutionsDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedSolution, setSelectedSolution] = useState(null)
  const [editingSolution, setEditingSolution] = useState(null)
  const [deletingSolution, setDeletingSolution] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [totalSolutions, setTotalSolutions] = useState(0)
  const [equipmentWithSolutions, setEquipmentWithSolutions] = useState(0)
  const [solutionsWithImages, setSolutionsWithImages] = useState(0)

  const [uploadingFiles, setUploadingFiles] = useState(false)

  // ✅ SPARE PARTS STATE
  const [sparePartsList, setSparePartsList] = useState([])
  const [hasSpareParts, setHasSpareParts] = useState(false)

  const [addFormData, setAddFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
    root_cause: '',
    solution: '',
    repair_procedure: '',
    time_taken: '',
    spare_parts_used: '',
    spare_part_images: '',
    before_repair_images: '',
    after_repair_images: '',
    images: '',
    attachments: '',
    repair_date: '',
    remarks: '',
    reported_by: '',
    engineer_name: '',
    hospital_name: '',
    department_name: ''
  })

  // ✅ SPARE PART FORM STATE
  const [sparePartForm, setSparePartForm] = useState({
    part_name: '',
    quantity: 1,
    unit_cost: '',
    total_cost: ''
  })

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    setLoading(true)
    try {
      const response = await api.get('/equipment')
      const equipment = response.data.equipment || []
      setEquipmentList(equipment)
      
      let totalSol = 0
      let equipWithSol = 0
      let solWithImages = 0
      
      for (const eq of equipment) {
        const solRes = await api.get(`/knowledge-base/equipment/${eq.id}`)
        const sols = solRes.data.entries || []
        const solCount = sols.length
        totalSol += solCount
        if (solCount > 0) equipWithSol++
        sols.forEach(sol => {
          if (sol.images || sol.spare_part_images || sol.before_repair_images || sol.after_repair_images) {
            solWithImages++
          }
        })
        eq.solution_count = solCount
      }
      
      setTotalSolutions(totalSol)
      setEquipmentWithSolutions(equipWithSol)
      setSolutionsWithImages(solWithImages)
      
    } catch (error) {
      console.error('Error fetching equipment:', error)
      toast.error('Failed to fetch equipment')
    } finally {
      setLoading(false)
    }
  }

  const fetchSolutions = async (equipmentId) => {
    try {
      const response = await api.get(`/knowledge-base/equipment/${equipmentId}`)
      setSolutions(response.data.entries || [])
    } catch (error) {
      console.error('Error fetching solutions:', error)
      toast.error('Failed to fetch solutions')
    }
  }

  const handleEquipmentClick = (equipment) => {
    setSelectedEquipment(equipment)
    fetchSolutions(equipment.id)
    setOpenSolutionsDialog(true)
  }

  const handleViewSolution = (solution) => {
    setSelectedSolution(solution)
    setOpenViewDialog(true)
  }

  const handleAddSolution = () => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can add solutions')
      return
    }
    
    setEditingSolution(null)
    setSparePartsList([])
    setHasSpareParts(false)
    setAddFormData({
      equipment_id: selectedEquipment?.id || '',
      error_code: '',
      error_title: '',
      error_description: '',
      root_cause: '',
      solution: '',
      repair_procedure: '',
      time_taken: '',
      spare_parts_used: '',
      spare_part_images: '',
      before_repair_images: '',
      after_repair_images: '',
      images: '',
      attachments: '',
      repair_date: new Date().toISOString().split('T')[0],
      remarks: '',
      reported_by: user?.full_name || '',
      engineer_name: '',
      hospital_name: user?.hospital_name || '',
      department_name: ''
    })
    setOpenAddDialog(true)
  }

  const handleEditSolution = (solution) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can edit solutions')
      return
    }
    
    setEditingSolution(solution)
    
    if (solution.spare_parts_used && solution.spare_parts_used.trim() !== '') {
      setHasSpareParts(true)
      try {
        const parts = solution.spare_parts_used.split(',').filter(Boolean).map(p => {
          const [name, qty, cost] = p.split('|')
          return {
            part_name: name || '',
            quantity: parseInt(qty) || 1,
            unit_cost: parseFloat(cost) || 0,
            total_cost: (parseInt(qty) || 1) * (parseFloat(cost) || 0)
          }
        })
        setSparePartsList(parts)
      } catch (e) {
        setSparePartsList([])
      }
    } else {
      setHasSpareParts(false)
      setSparePartsList([])
    }
    
    setAddFormData({
      equipment_id: solution.equipment_id || '',
      error_code: solution.error_code || '',
      error_title: solution.error_title || '',
      error_description: solution.error_description || '',
      root_cause: solution.root_cause || '',
      solution: solution.solution || '',
      repair_procedure: solution.repair_procedure || '',
      time_taken: solution.time_taken || '',
      spare_parts_used: solution.spare_parts_used || '',
      spare_part_images: solution.spare_part_images || '',
      before_repair_images: solution.before_repair_images || '',
      after_repair_images: solution.after_repair_images || '',
      images: solution.images || '',
      attachments: solution.attachments || '',
      repair_date: solution.repair_date || new Date().toISOString().split('T')[0],
      remarks: solution.remarks || '',
      reported_by: solution.reported_by || user?.full_name || '',
      engineer_name: solution.engineer_name || '',
      hospital_name: solution.hospital_name || user?.hospital_name || '',
      department_name: solution.department_name || ''
    })
    setOpenAddDialog(true)
  }

  // ✅ SPARE PART FUNCTIONS
  const handleSparePartChange = (e) => {
    const { name, value } = e.target
    setSparePartForm(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'quantity' || name === 'unit_cost') {
        const qty = parseFloat(updated.quantity) || 0
        const cost = parseFloat(updated.unit_cost) || 0
        updated.total_cost = qty * cost
      }
      return updated
    })
  }

  const handleAddSparePart = () => {
    if (!sparePartForm.part_name || sparePartForm.part_name.trim() === '') {
      toast.error('Please enter a part name')
      return
    }
    if (!sparePartForm.quantity || sparePartForm.quantity < 1) {
      toast.error('Please enter a valid quantity')
      return
    }

    setSparePartsList(prev => [...prev, { ...sparePartForm }])
    setSparePartForm({
      part_name: '',
      quantity: 1,
      unit_cost: '',
      total_cost: ''
    })
    toast.success('Spare part added to list')
  }

  const handleRemoveSparePart = (index) => {
    setSparePartsList(prev => prev.filter((_, i) => i !== index))
    toast.info('Spare part removed')
  }

  // ✅ Format spare parts for database
  const formatSparePartsForDB = () => {
    if (sparePartsList.length === 0) return ''
    return sparePartsList.map(p => 
      `${p.part_name}|${p.quantity}|${p.unit_cost}`
    ).join(',')
  }

  const handleDeleteClick = (solution) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete solutions')
      return
    }
    setDeletingSolution(solution)
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingSolution) return
    
    setDeleteLoading(true)
    try {
      await api.delete(`/knowledge-base/${deletingSolution.id}`)
      toast.success('Solution deleted successfully!')
      setOpenDeleteDialog(false)
      setDeletingSolution(null)
      
      if (selectedEquipment) {
        fetchSolutions(selectedEquipment.id)
        fetchEquipment()
      }
    } catch (error) {
      console.error('Error deleting solution:', error)
      toast.error(error.response?.data?.message || 'Failed to delete solution')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddFormChange = (e) => {
    const { name, value } = e.target
    setAddFormData({
      ...addFormData,
      [name]: value
    })
  }

  const handleFileUploadComplete = (fieldName) => (files) => {
    console.log(`📸 ${fieldName} uploaded:`, files)
    const urls = files.map(f => f.url || f.fileUrl).filter(Boolean)
    const currentValue = addFormData[fieldName] || ''
    const existingUrls = currentValue ? currentValue.split(',').filter(Boolean) : []
    const updatedUrls = [...existingUrls, ...urls]
    
    setAddFormData(prev => ({
      ...prev,
      [fieldName]: updatedUrls.join(',')
    }))
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  const handleFileDelete = (fieldName) => (file) => {
    const currentValue = addFormData[fieldName] || ''
    const urls = currentValue.split(',').filter(Boolean)
    const updatedUrls = urls.filter(url => url !== file.url)
    
    setAddFormData(prev => ({
      ...prev,
      [fieldName]: updatedUrls.join(',')
    }))
    toast.info('File removed')
  }

  const getExistingFiles = (fieldName) => {
    const value = addFormData[fieldName] || ''
    if (!value) return []
    return value.split(',').filter(Boolean).map(url => ({
      url: url,
      name: url.split('/').pop(),
      type: url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' :
            url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'document'
    }))
  }

  // ✅ SUBMIT SOLUTION with spare parts
  const handleSubmitSolution = async () => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can add or update solutions')
      return
    }

    try {
      if (!addFormData.equipment_id) {
        toast.error('Equipment is required')
        return
      }
      if (!addFormData.error_title) {
        toast.error('Error title is required')
        return
      }

      const sparePartsString = hasSpareParts ? formatSparePartsForDB() : ''

      const payload = {
        equipment_id: addFormData.equipment_id,
        error_code: addFormData.error_code || null,
        error_title: addFormData.error_title,
        error_description: addFormData.error_description || null,
        root_cause: addFormData.root_cause || null,
        solution: addFormData.solution || null,
        repair_procedure: addFormData.repair_procedure || null,
        time_taken: addFormData.time_taken ? parseInt(addFormData.time_taken) : null,
        spare_parts_used: sparePartsString || addFormData.spare_parts_used || null,
        spare_part_images: addFormData.spare_part_images || null,
        before_repair_images: addFormData.before_repair_images || null,
        after_repair_images: addFormData.after_repair_images || null,
        images: addFormData.images || null,
        attachments: addFormData.attachments || null,
        repair_date: addFormData.repair_date || null,
        remarks: addFormData.remarks || null,
        reported_by: addFormData.reported_by || null,
        engineer_name: addFormData.engineer_name || null,
        hospital_name: addFormData.hospital_name || null,
        department_name: addFormData.department_name || null
      }

      console.log('📤 Submitting solution:', payload)

      if (editingSolution) {
        await api.put(`/knowledge-base/${editingSolution.id}`, payload)
        toast.success('Solution updated successfully')
      } else {
        await api.post('/knowledge-base', payload)
        toast.success('Solution added successfully')
      }

      setOpenAddDialog(false)
      setSparePartsList([])
      setHasSpareParts(false)
      if (selectedEquipment) {
        fetchSolutions(selectedEquipment.id)
        fetchEquipment()
      }
    } catch (error) {
      console.error('Error saving solution:', error)
      toast.error(error.response?.data?.message || 'Failed to save solution')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredEquipment = equipmentList.filter(eq => {
    const matchesSearch = eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterEquipment || eq.id === parseInt(filterEquipment)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Knowledge Base
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchEquipment} size="small">
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#0B5FA5" fontWeight={700}>
                {totalSolutions}
              </Typography>
              <Typography variant="body2" color="textSecondary">Total Solutions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#e3f2fd' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#0B5FA5" fontWeight={700}>
                {equipmentWithSolutions}
              </Typography>
              <Typography variant="body2" color="textSecondary">Equipment with Solutions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#e8f5e9' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#28a745" fontWeight={700}>
                {solutionsWithImages}
              </Typography>
              <Typography variant="body2" color="textSecondary">With Images</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, bgcolor: '#fff3e0' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#ff9800" fontWeight={700}>
                {solutions.length || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">Recent Solutions</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ VIEW ONLY ALERT - REMOVED */}

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search equipment by name, model or manufacturer..."
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
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Equipment</InputLabel>
            <Select
              value={filterEquipment}
              onChange={(e) => setFilterEquipment(e.target.value)}
              label="Filter by Equipment"
            >
              <MenuItem value="">All Equipment</MenuItem>
              {equipmentList.map(eq => (
                <MenuItem key={eq.id} value={eq.id}>{eq.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Equipment Cards */}
      <Grid container spacing={3}>
        {filteredEquipment.map((eq) => (
          <Grid item xs={12} sm={6} md={4} key={eq.id}>
            <Card
              sx={{
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => handleEquipmentClick(eq)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#0B5FA5', mr: 2 }}>
                    <MedicalServices />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {eq.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {eq.model} - {eq.manufacturer}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${eq.solution_count || 0} Solutions`}
                    size="small"
                    color={eq.solution_count > 0 ? 'primary' : 'default'}
                  />
                  {eq.category_name && (
                    <Chip label={eq.category_name} size="small" variant="outlined" />
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  <LocalHospital sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  {eq.hospital_name || 'No Hospital'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredEquipment.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="textSecondary">
            No equipment found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Try adjusting your search or filter
          </Typography>
        </Paper>
      )}

      {/* Solutions Dialog */}
      <Dialog open={openSolutionsDialog} onClose={() => setOpenSolutionsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {selectedEquipment?.name} - Solutions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isSuperAdmin && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddSolution}
                  sx={{ bgcolor: 'white', color: '#0B5FA5', '&:hover': { bgcolor: '#f0f7ff' } }}
                >
                  Add Solution
                </Button>
              )}
              <IconButton onClick={() => setOpenSolutionsDialog(false)} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {solutions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MedicalServices sx={{ fontSize: 48, color: '#6c757d' }} />
              <Typography variant="h6" color="textSecondary">
                No solutions found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {isSuperAdmin ? 'Click "Add Solution" to add a new solution' : 'Contact Super Admin to add solutions'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {solutions.map((sol) => (
                <Paper key={sol.id} sx={{ p: 2, borderRadius: 2, '&:hover': { bgcolor: '#f8f9fa' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <ErrorIcon sx={{ color: sol.error_code ? '#dc3545' : '#6c757d', fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {sol.error_title}
                        </Typography>
                        {sol.error_code && (
                          <Chip label={`Code: ${sol.error_code}`} size="small" variant="outlined" />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.875rem', color: '#6c757d' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person sx={{ fontSize: 14 }} />
                          {sol.created_by_name || 'Unknown'}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14 }} />
                          {formatDate(sol.created_at)}
                        </Box>
                        {sol.time_taken && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14 }} />
                            {sol.time_taken} min
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" onClick={() => handleViewSolution(sol)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isSuperAdmin && (
                        <Tooltip title="Edit">
                          <IconButton size="small" color="info" onClick={() => handleEditSolution(sol)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isSuperAdmin && (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteClick(sol)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenSolutionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* View Solution Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Solution Details
            </Typography>
            <Box>
              {!isSuperAdmin && (
                <Chip label="Read Only" size="small" color="info" sx={{ mr: 1 }} />
              )}
              <IconButton onClick={() => setOpenViewDialog(false)} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSolution && (
            <Box>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#dc3545', width: 56, height: 56 }}>
                  <ErrorIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedSolution.error_title}
                  </Typography>
                  {selectedSolution.error_code && (
                    <Chip label={`Error Code: ${selectedSolution.error_code}`} size="small" color="error" />
                  )}
                  <Typography variant="body2" color="textSecondary">
                    Reported by: {selectedSolution.created_by_name || selectedSolution.reported_by || 'Unknown'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Equipment Information */}
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Equipment Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Equipment</Typography>
                  <Typography variant="body1">{selectedSolution.equipment_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Hospital / Center</Typography>
                  <Typography variant="body1">{selectedSolution.hospital_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Department</Typography>
                  <Typography variant="body1">{selectedSolution.department_name || 'N/A'}</Typography>
                </Grid>
              </Grid>

              {/* Error Details */}
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Error Details
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Description</Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">{selectedSolution.error_description || 'No description'}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Solution Details */}
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Solution Details
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Root Cause</Typography>
                  <Typography variant="body1">{selectedSolution.root_cause || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Solution</Typography>
                  <Typography variant="body1">{selectedSolution.solution || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Repair Procedure</Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {selectedSolution.repair_procedure || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Time Taken</Typography>
                  <Typography variant="body1">{selectedSolution.time_taken ? `${selectedSolution.time_taken} minutes` : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Repair Date</Typography>
                  <Typography variant="body1">{formatDate(selectedSolution.repair_date)}</Typography>
                </Grid>
              </Grid>

              {/* Spare Parts */}
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Spare Parts
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Spare Parts Used</Typography>
                  <Typography variant="body1">{selectedSolution.spare_parts_used || 'N/A'}</Typography>
                </Grid>
              </Grid>

              {/* Images */}
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Images
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedSolution.spare_part_images && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Spare Part Images</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {selectedSolution.spare_part_images.split(',').filter(Boolean).map((url, idx) => {
                        const fullUrl = getFullUrl(url.trim())
                        return (
                          <Box
                            key={idx}
                            component="img"
                            src={fullUrl}
                            alt={`Spare part ${idx + 1}`}
                            sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                            onClick={() => window.open(fullUrl, '_blank')}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )
                      })}
                    </Box>
                  </Grid>
                )}

                {selectedSolution.before_repair_images && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Before Repair Images</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {selectedSolution.before_repair_images.split(',').filter(Boolean).map((url, idx) => {
                        const fullUrl = getFullUrl(url.trim())
                        return (
                          <Box
                            key={idx}
                            component="img"
                            src={fullUrl}
                            alt={`Before repair ${idx + 1}`}
                            sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                            onClick={() => window.open(fullUrl, '_blank')}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )
                      })}
                    </Box>
                  </Grid>
                )}

                {selectedSolution.after_repair_images && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">After Repair Images</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {selectedSolution.after_repair_images.split(',').filter(Boolean).map((url, idx) => {
                        const fullUrl = getFullUrl(url.trim())
                        return (
                          <Box
                            key={idx}
                            component="img"
                            src={fullUrl}
                            alt={`After repair ${idx + 1}`}
                            sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                            onClick={() => window.open(fullUrl, '_blank')}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )
                      })}
                    </Box>
                  </Grid>
                )}

                {selectedSolution.images && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">General Images</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {selectedSolution.images.split(',').filter(Boolean).map((url, idx) => {
                        const fullUrl = getFullUrl(url.trim())
                        return (
                          <Box
                            key={idx}
                            component="img"
                            src={fullUrl}
                            alt={`Image ${idx + 1}`}
                            sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }}
                            onClick={() => window.open(fullUrl, '_blank')}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>

              {/* People Information */}
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                People Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Reported By</Typography>
                  <Typography variant="body1">{selectedSolution.reported_by || selectedSolution.created_by_name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Engineer Name</Typography>
                  <Typography variant="body1">{selectedSolution.engineer_name || 'N/A'}</Typography>
                </Grid>
              </Grid>

              {/* Remarks */}
              {selectedSolution.remarks && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                    Remarks
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">{selectedSolution.remarks}</Typography>
                  </Paper>
                </>
              )}

              {/* ✅ View Only Footer - REMOVED */}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          {isSuperAdmin && selectedSolution && (
            <Button
              variant="outlined"
              color="info"
              onClick={() => {
                setOpenViewDialog(false)
                handleEditSolution(selectedSolution)
              }}
            >
              Edit
            </Button>
          )}
          {isSuperAdmin && selectedSolution && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForever />}
              onClick={() => {
                setOpenViewDialog(false)
                handleDeleteClick(selectedSolution)
              }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ bgcolor: '#dc3545', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteForever />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this solution?
          </Typography>
          {deletingSolution && (
            <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {deletingSolution.error_title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {deletingSolution.error_code && `Code: ${deletingSolution.error_code}`}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(deletingSolution.created_at)}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data will be permanently removed.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteForever />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Solution Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {editingSolution ? 'Edit Solution' : 'Add New Solution'}
            </Typography>
            <Chip label="Super Admin Only" size="small" color="warning" sx={{ bgcolor: '#ff9800' }} />
            <IconButton onClick={() => setOpenAddDialog(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Equipment"
                value={selectedEquipment?.name || ''}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MedicalServices />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Error Code"
                name="error_code"
                value={addFormData.error_code}
                onChange={handleAddFormChange}
                placeholder="e.g., ERR-001"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Error Title *"
                name="error_title"
                value={addFormData.error_title}
                onChange={handleAddFormChange}
                placeholder="Brief error title"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Description"
                name="error_description"
                value={addFormData.error_description}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="Detailed description of the error"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Solution Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Root Cause"
                name="root_cause"
                value={addFormData.root_cause}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="What caused the failure?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Solution"
                name="solution"
                value={addFormData.solution}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="How was it fixed?"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Repair Procedure"
                name="repair_procedure"
                value={addFormData.repair_procedure}
                onChange={handleAddFormChange}
                multiline
                rows={3}
                placeholder="Step by step repair procedure"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time Taken (minutes)"
                name="time_taken"
                type="number"
                value={addFormData.time_taken}
                onChange={handleAddFormChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTime />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Repair Date"
                name="repair_date"
                type="date"
                value={addFormData.repair_date}
                onChange={handleAddFormChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* SPARE PARTS SECTION */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="primary">
                  <Inventory sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Spare Parts Used
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={hasSpareParts ? 'yes' : 'no'}
                      onChange={(e) => {
                        const value = e.target.value === 'yes'
                        setHasSpareParts(value)
                        if (!value) {
                          setSparePartsList([])
                        }
                      }}
                    >
                      <FormControlLabel 
                        value="yes" 
                        control={<Radio color="primary" />} 
                        label="Yes" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem', fontWeight: 500 } }}
                      />
                      <FormControlLabel 
                        value="no" 
                        control={<Radio color="default" />} 
                        label="No" 
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.9rem', fontWeight: 500 } }}
                      />
                    </RadioGroup>
                  </FormControl>
                  {hasSpareParts ? (
                    <Chip 
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label="Spare parts will be added" 
                      size="small" 
                      color="success" 
                    />
                  ) : (
                    <Chip 
                      icon={<Close sx={{ fontSize: 16 }} />}
                      label="No spare parts" 
                      size="small" 
                      color="default" 
                    />
                  )}
                </Box>
              </Box>

              {hasSpareParts && (
                <>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Part Name *"
                          name="part_name"
                          value={sparePartForm.part_name}
                          onChange={handleSparePartChange}
                          placeholder="e.g., Power Supply Module"
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Qty"
                          name="quantity"
                          type="number"
                          value={sparePartForm.quantity}
                          onChange={handleSparePartChange}
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Unit Cost (Rs.)"
                          name="unit_cost"
                          type="number"
                          value={sparePartForm.unit_cost}
                          onChange={handleSparePartChange}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<AddCircle />}
                          onClick={handleAddSparePart}
                          sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
                        >
                          Add Part
                        </Button>
                      </Grid>
                    </Grid>
                    {sparePartForm.total_cost > 0 && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                        Total: Rs. {sparePartForm.total_cost.toFixed(0)}
                      </Typography>
                    )}
                  </Paper>

                  {sparePartsList.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Part Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Unit Cost</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sparePartsList.map((part, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{part.part_name}</TableCell>
                              <TableCell align="center">{part.quantity}</TableCell>
                              <TableCell align="right">Rs. {parseFloat(part.unit_cost).toFixed(0)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: '#0B5FA5' }}>
                                Rs. {(parseFloat(part.quantity) * parseFloat(part.unit_cost)).toFixed(0)}
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveSparePart(idx)}
                                  >
                                    <RemoveCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 600 }}>
                              Total Spare Parts Cost:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#0B5FA5' }}>
                              Rs. {sparePartsList.reduce((sum, p) => sum + (parseFloat(p.quantity) * parseFloat(p.unit_cost)), 0).toFixed(0)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      No spare parts added yet. Use the form above to add spare parts.
                    </Alert>
                  )}
                </>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Images & Attachments
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Spare Part Images
              </Typography>
              <FileUpload
                endpoint="/api/upload"
                accept="image/*"
                multiple={true}
                label="Click to upload spare part images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('spare_part_images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('spare_part_images')}
                existingFiles={getExistingFiles('spare_part_images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Before Repair Images
              </Typography>
              <FileUpload
                endpoint="/api/upload"
                accept="image/*"
                multiple={true}
                label="Click to upload before repair images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('before_repair_images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('before_repair_images')}
                existingFiles={getExistingFiles('before_repair_images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                After Repair Images
              </Typography>
              <FileUpload
                endpoint="/api/upload"
                accept="image/*"
                multiple={true}
                label="Click to upload after repair images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('after_repair_images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('after_repair_images')}
                existingFiles={getExistingFiles('after_repair_images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                General Images
              </Typography>
              <FileUpload
                endpoint="/api/upload"
                accept="image/*,.pdf,.doc,.docx"
                multiple={true}
                label="Click to upload general images"
                maxFiles={10}
                maxSize={20}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('images')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('images')}
                existingFiles={getExistingFiles('images')}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Attachments
              </Typography>
              <FileUpload
                endpoint="/api/upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                multiple={true}
                label="Click to upload attachments"
                maxFiles={10}
                maxSize={50}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete('attachments')}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete('attachments')}
                existingFiles={getExistingFiles('attachments')}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                People Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reported By"
                name="reported_by"
                value={addFormData.reported_by}
                onChange={handleAddFormChange}
                placeholder="Name of person who reported"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Engineer Name"
                name="engineer_name"
                value={addFormData.engineer_name}
                onChange={handleAddFormChange}
                placeholder="Name of engineer who fixed"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital / Center Name"
                name="hospital_name"
                value={addFormData.hospital_name}
                onChange={handleAddFormChange}
                placeholder="Hospital name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalHospital />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department Name"
                name="department_name"
                value={addFormData.department_name}
                onChange={handleAddFormChange}
                placeholder="Department name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={addFormData.remarks}
                onChange={handleAddFormChange}
                multiline
                rows={2}
                placeholder="Additional remarks..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitSolution}
            sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
          >
            {editingSolution ? 'Update Solution' : 'Add Solution'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default KnowledgeBase