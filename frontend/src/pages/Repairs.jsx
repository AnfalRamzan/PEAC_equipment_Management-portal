// src/pages/Repairs.jsx
// ✅ PAEC THEME - Green & Gold Colors

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  Divider,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material'
import {
  Add,
  Search,
  Delete,
  Visibility,
  Close,
  Refresh,
  Engineering as EngineeringIcon,
} from '@mui/icons-material'
import { repairService, errorService, equipmentService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import FileUpload from '../components/FileUpload'
import api from '../api/axios'
import AccessDenied from '../components/Auth/AccessDenied'

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

// ✅ Helper function for image URLs
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

const Repairs = () => {
  const { user } = useSelector((state) => state.auth)
  const location = useLocation()
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Repairs." />
  }
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isEngineer = user?.role === 'ENGINEER'
  
  const canCreate = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin

  const [repairs, setRepairs] = useState([])
  const [errors, setErrors] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [viewingRepair, setViewingRepair] = useState(null)
  
  const [showSparePartsFields, setShowSparePartsFields] = useState(false)
  const [sparePartsList, setSparePartsList] = useState([])
  const [sparePartForm, setSparePartForm] = useState({
    part_name: '',
    part_number: '',
    brand: '',
    quantity: 1,
    unit_cost: '',
    total_cost: '',
    installation_notes: ''
  })

  const [uploadedFiles, setUploadedFiles] = useState([])

  const [formData, setFormData] = useState({
    error_log_id: '',
    equipment_id: '',
    engineer_name: '',
    root_cause: '',
    problem_analysis: '',
    corrective_action: '',
    repair_procedure: '',
    solution_description: '',
    time_taken: '',
    spare_part_used: 'No',
    remarks: '',
    repair_date: new Date().toISOString().slice(0, 16),
    attachments: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.error_log_id) {
      const selectedError = errors.find(e => e.id === parseInt(formData.error_log_id))
      if (selectedError) {
        setFormData(prev => ({
          ...prev,
          equipment_id: selectedError.equipment_id || '',
          root_cause: selectedError.error_description || selectedError.error_title || '',
          problem_analysis: selectedError.error_description || '',
        }))
      }
    }
  }, [formData.error_log_id, errors])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [repairsRes, errorsRes, equipmentRes] = await Promise.all([
        repairService.getAll(),
        errorService.getAll(),
        equipmentService.getAll()
      ])
      setRepairs(repairsRes.data.repairs || [])
      setErrors(errorsRes.data.errors || [])
      setEquipment(equipmentRes.data.equipment || [])
    } catch (error) {
      console.error('❌ Fetch error:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUploadComplete = (files) => {
    console.log('📸 Files uploaded:', files)
    
    const fileUrls = files.map(f => f.url || f.fileUrl).filter(Boolean)
    
    setUploadedFiles(prev => [...prev, ...files])
    
    setFormData(prev => {
      const existingUrls = prev.attachments ? prev.attachments.split(',') : []
      const allUrls = [...existingUrls, ...fileUrls]
      return {
        ...prev,
        attachments: allUrls.join(',')
      }
    })
    
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  const handleFileDelete = (file) => {
    setUploadedFiles(prev => prev.filter(f => f.url !== file.url))
    
    const currentFiles = formData.attachments?.split(',') || []
    const updatedFiles = currentFiles.filter(url => url !== file.url)
    setFormData(prev => ({
      ...prev,
      attachments: updatedFiles.join(',')
    }))
    
    toast.success('File removed')
  }

  const handleExistingFileDelete = (fileUrl) => {
    const currentFiles = formData.attachments?.split(',') || []
    const updatedFiles = currentFiles.filter(url => url !== fileUrl)
    setFormData(prev => ({
      ...prev,
      attachments: updatedFiles.join(',')
    }))
    toast.success('File removed')
  }

  const handleOpenDialog = () => {
    if (!isEngineer && !isSuperAdmin) {
      toast.error('You do not have permission to create repairs')
      return
    }
    
    setFormData({
      error_log_id: '',
      equipment_id: '',
      engineer_name: '',
      root_cause: '',
      problem_analysis: '',
      corrective_action: '',
      repair_procedure: '',
      solution_description: '',
      time_taken: '',
      spare_part_used: 'No',
      remarks: '',
      repair_date: new Date().toISOString().slice(0, 16),
      attachments: ''
    })
    setUploadedFiles([])
    setShowSparePartsFields(false)
    setSparePartsList([])
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setShowSparePartsFields(false)
    setSparePartsList([])
    setUploadedFiles([])
  }

  const handleView = (repair) => {
    setViewingRepair(repair)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingRepair(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'spare_part_used') {
      setShowSparePartsFields(value === 'Yes')
      if (value === 'No') {
        setSparePartsList([])
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSparePartChange = (e) => {
    const { name, value } = e.target
    setSparePartForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddSparePart = () => {
    if (!sparePartForm.part_name || sparePartForm.part_name.trim() === '') {
      toast.error('Please enter part name')
      return
    }

    const quantity = parseInt(sparePartForm.quantity) || 1
    const unitCost = parseFloat(sparePartForm.unit_cost) || 0
    const totalCost = quantity * unitCost

    const newPart = {
      id: Date.now(),
      part_name: sparePartForm.part_name.trim(),
      part_number: sparePartForm.part_number || '',
      brand: sparePartForm.brand || '',
      quantity: quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      installation_notes: sparePartForm.installation_notes || ''
    }

    setSparePartsList(prev => [...prev, newPart])
    setSparePartForm({
      part_name: '',
      part_number: '',
      brand: '',
      quantity: 1,
      unit_cost: '',
      total_cost: '',
      installation_notes: ''
    })
    toast.success('Spare part added')
  }

  const handleRemoveSparePart = (id) => {
    setSparePartsList(prev => prev.filter(p => p.id !== id))
    toast.info('Spare part removed')
  }

  const handleSubmit = async () => {
    if (!isEngineer && !isSuperAdmin) {
      toast.error('You do not have permission to create repairs')
      return
    }
    
    try {
      if (!formData.error_log_id) {
        toast.error('Please select an error to repair')
        return
      }

      const payload = {
        error_log_id: parseInt(formData.error_log_id),
        equipment_id: formData.equipment_id ? parseInt(formData.equipment_id) : null,
        engineer_name: formData.engineer_name || user?.full_name || '',
        root_cause: formData.root_cause || '',
        problem_analysis: formData.problem_analysis || '',
        corrective_action: formData.corrective_action || '',
        repair_procedure: formData.repair_procedure || '',
        solution_description: formData.solution_description || '',
        time_taken: formData.time_taken ? parseInt(formData.time_taken) : 0,
        spare_part_used: formData.spare_part_used || 'No',
        spare_parts: formData.spare_part_used === 'Yes' ? sparePartsList : [],
        remarks: formData.remarks || '',
        repair_date: formData.repair_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        attachments: formData.attachments || ''
      }

      console.log('📤 Submitting repair with attachments:', payload.attachments)

      await repairService.create(payload)
      toast.success('Repair recorded successfully')
      
      if (formData.error_log_id) {
        await errorService.update(formData.error_log_id, { status: 'In Progress' })
      }
      
      fetchData()
      handleCloseDialog()
    } catch (error) {
      console.error('❌ Submit error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete repairs')
      return
    }
    
    if (!window.confirm('Are you sure you want to delete this repair record?')) {
      return
    }
    
    try {
      await repairService.delete(id)
      toast.success('Repair deleted successfully')
      fetchData()
    } catch (error) {
      console.error('❌ Delete error:', error)
      toast.error('Failed to delete repair')
    }
  }

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = repair.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          repair.engineer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          repair.root_cause?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
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
            Repairs
          </Typography>
          {isEngineer && (
            <Chip 
              icon={<EngineeringIcon sx={{ fontSize: 16 }} />}
              label="Engineer" 
              size="small" 
              sx={{ 
                bgcolor: colors.sidebar, 
                color: 'white',
                fontWeight: 500
              }} 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={fetchData} 
            size="small"
            sx={{ 
              borderColor: colors.sidebar, 
              color: colors.sidebar,
              '&:hover': { borderColor: colors.accentGold, color: colors.accentGold }
            }}
          >
            <Refresh sx={{ fontSize: 18, mr: 0.5 }} />
            Refresh
          </Button>
          {(isEngineer || isSuperAdmin) && (
            <Button
              variant="contained"
              onClick={handleOpenDialog}
              sx={{ 
                bgcolor: colors.sidebar, 
                '&:hover': { bgcolor: colors.sidebarHover },
                boxShadow: `0 4px 16px ${colors.sidebar}44`
              }}
            >
              <Add sx={{ fontSize: 18, mr: 0.5 }} />
              Record Repair
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.sidebar, fontWeight: 700 }}>
                {repairs.length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Total Repairs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.info}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.info, fontWeight: 700 }}>
                {new Set(repairs.map(r => r.equipment_name)).size}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Equipment</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.success}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.success, fontWeight: 700 }}>
                {repairs.filter(r => r.spare_part_used === 1).length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>With Spare Parts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            borderRadius: 2, 
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            bgcolor: `${colors.warning}08`
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: colors.warning, fontWeight: 700 }}>
                {repairs.filter(r => r.time_taken > 0).length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.lightText }}>Time Recorded</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
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
            placeholder="Search by equipment, engineer or root cause..."
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
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
        <Table>
          <TableHead sx={{ bgcolor: colors.sidebar }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Engineer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Issue</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Time</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Spare Used</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRepairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 4, color: colors.lightText }}>
                    No repairs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRepairs.map((repair) => (
                <TableRow key={repair.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} sx={{ color: colors.darkText }}>
                      {repair.equipment_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText }}>{repair.engineer_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150, color: colors.lightText }}>
                      {repair.root_cause || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText }}>{repair.time_taken ? `${repair.time_taken}m` : '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={repair.spare_part_used ? 'Yes' : 'No'} 
                      size="small"
                      sx={{
                        bgcolor: repair.spare_part_used ? colors.success : colors.lightText,
                        color: 'white',
                        fontWeight: 500,
                        height: 22,
                        fontSize: '11px'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: colors.lightText }}>
                    {repair.repair_date ? new Date(repair.repair_date).toLocaleDateString() : 
                     repair.created_at ? new Date(repair.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleView(repair)}
                          sx={{ color: colors.sidebar, '&:hover': { color: colors.accentGold } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isSuperAdmin && (
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(repair.id)}
                          >
                            <Delete fontSize="small" />
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

      {/* Add Repair Dialog - THEMED */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Record Repair</Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2, border: `1px solid ${colors.info}33` }}>
                Select an error to repair. Equipment and root cause will be auto-filled.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: colors.lightText }}>Select Error to Repair *</InputLabel>
                <Select
                  name="error_log_id"
                  value={formData.error_log_id}
                  onChange={handleFormChange}
                  label="Select Error to Repair *"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
                >
                  <MenuItem value="">Select Error</MenuItem>
                  {errors.filter(e => e.status === 'Pending' || e.status === 'In Progress').map(err => (
                    <MenuItem key={err.id} value={err.id}>
                      {err.error_title} - {err.equipment_name} ({err.status})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment"
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
                      {item.name} - {item.model || 'N/A'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Engineer Name"
                name="engineer_name"
                value={formData.engineer_name}
                onChange={handleFormChange}
                placeholder="Enter engineer name"
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
                required
                label="Repair Date *"
                name="repair_date"
                type="datetime-local"
                value={formData.repair_date}
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

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                Problem Analysis
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Root Cause"
                name="root_cause"
                value={formData.root_cause}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="What caused the failure?"
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
                label="Problem Analysis"
                name="problem_analysis"
                value={formData.problem_analysis}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="Detailed analysis of the problem"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                Solution
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Corrective Action"
                name="corrective_action"
                value={formData.corrective_action}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="Actions taken to fix the issue"
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
                label="Repair Procedure"
                name="repair_procedure"
                value={formData.repair_procedure}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="Step by step repair procedure"
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
                label="Solution Description"
                name="solution_description"
                value={formData.solution_description}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="Detailed solution description"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                Additional Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Time Taken (minutes)"
                name="time_taken"
                type="number"
                value={formData.time_taken}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0 } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Spare Part Used</InputLabel>
                <Select
                  name="spare_part_used"
                  value={formData.spare_part_used}
                  onChange={handleFormChange}
                  label="Spare Part Used"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.sidebar },
                      '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                    }
                  }}
                >
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {showSparePartsFields && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2, borderColor: colors.borderColor }} />
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                  Spare Parts Details
                </Typography>
                <Box sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 2, border: `1px solid ${colors.borderColor}` }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Part Name *"
                        name="part_name"
                        value={sparePartForm.part_name}
                        onChange={handleSparePartChange}
                        placeholder="e.g., Power Supply"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.sidebar },
                            '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Part Number"
                        name="part_number"
                        value={sparePartForm.part_number}
                        onChange={handleSparePartChange}
                        placeholder="e.g., PSU-001"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.sidebar },
                            '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Brand"
                        name="brand"
                        value={sparePartForm.brand}
                        onChange={handleSparePartChange}
                        placeholder="e.g., Siemens"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.sidebar },
                            '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Qty"
                        name="quantity"
                        type="number"
                        value={sparePartForm.quantity}
                        onChange={handleSparePartChange}
                        InputProps={{ inputProps: { min: 1, step: 1 } }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.sidebar },
                            '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Unit Cost ($)"
                        name="unit_cost"
                        type="number"
                        value={sparePartForm.unit_cost}
                        onChange={handleSparePartChange}
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
                      <TextField
                        fullWidth
                        size="small"
                        label="Installation Notes"
                        name="installation_notes"
                        value={sparePartForm.installation_notes}
                        onChange={handleSparePartChange}
                        placeholder="Any special instructions..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.sidebar },
                            '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleAddSparePart}
                        sx={{ 
                          height: '100%', 
                          bgcolor: colors.sidebar,
                          '&:hover': { bgcolor: colors.sidebarHover }
                        }}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>

                  {sparePartsList.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ color: colors.lightText }}>
                        Added Parts ({sparePartsList.length})
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderColor: colors.borderColor }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: colors.mainBg }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: colors.sidebar }}>Part Name</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: colors.sidebar }}>Part #</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: colors.sidebar }}>Brand</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: colors.sidebar }} align="center">Qty</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: colors.sidebar }} align="right">Cost</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: colors.sidebar }} align="right">Total</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: colors.sidebar }} align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sparePartsList.map((part) => (
                              <TableRow key={part.id}>
                                <TableCell>{part.part_name}</TableCell>
                                <TableCell>{part.part_number || '-'}</TableCell>
                                <TableCell>{part.brand || '-'}</TableCell>
                                <TableCell align="center">{part.quantity}</TableCell>
                                <TableCell align="right">${part.unit_cost.toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: colors.sidebar }}>
                                  ${part.total_cost.toFixed(2)}
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton 
                                    size="small" 
                                    color="error" 
                                    onClick={() => handleRemoveSparePart(part.id)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ bgcolor: colors.mainBg }}>
                              <TableCell colSpan={5} align="right" sx={{ fontWeight: 600, color: colors.sidebar }}>Total:</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: colors.accentGold }}>
                                ${sparePartsList.reduce((sum, p) => sum + p.total_cost, 0).toFixed(2)}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleFormChange}
                multiline
                rows={2}
                placeholder="Additional remarks"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.sidebar },
                    '&.Mui-focused fieldset': { borderColor: colors.accentGold }
                  }
                }}
              />
            </Grid>

            {/* File Upload Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                Attachments (Images, Videos, Documents)
              </Typography>
              <FileUpload
                endpoint="/service-documentation/upload"
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                multiple={true}
                label="Click to upload images, videos, or documents"
                maxFiles={10}
                maxSize={50}
                showPreview={true}
                onUploadComplete={handleFileUploadComplete}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={handleFileDelete}
                existingFiles={formData.attachments ? formData.attachments.split(',').filter(Boolean).map(url => {
                  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                  const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi)$/i)
                  return {
                    url: url,
                    name: url.split('/').pop(),
                    type: isImage ? 'image' : isVideo ? 'video' : 'document',
                    size: 0
                  }
                }) : []}
              />
            </Grid>

            {/* Uploaded files preview */}
            {formData.attachments && formData.attachments.split(',').filter(Boolean).length > 0 && (
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: colors.lightText }} gutterBottom display="block" sx={{ mb: 1 }}>
                  Uploaded Files ({formData.attachments.split(',').filter(Boolean).length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.attachments.split(',').filter(Boolean).map((url, idx) => {
                    const fullUrl = getFullUrl(url)
                    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                    const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi)$/i)
                    const fileName = url.split('/').pop()
                    
                    return (
                      <Box 
                        key={idx} 
                        sx={{ 
                          position: 'relative',
                          width: isImage ? 120 : 100,
                          height: isImage ? 120 : 100,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: `1px solid ${colors.borderColor}`,
                          bgcolor: colors.mainBg,
                          '&:hover': {
                            boxShadow: 4,
                            '& .delete-btn': {
                              display: 'flex'
                            }
                          }
                        }}
                      >
                        {isImage ? (
                          <Box
                            component="img"
                            src={fullUrl}
                            alt={`Attachment ${idx + 1}`}
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
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        ) : isVideo ? (
                          <video 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                            onClick={() => window.open(fullUrl, '_blank')}
                          >
                            <source src={fullUrl} />
                          </video>
                        ) : (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              height: '100%', 
                              p: 1,
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(fullUrl, '_blank')}
                          >
                            <Typography variant="caption" align="center" noWrap sx={{ color: colors.lightText }}>
                              📄 {fileName.substring(0, 15)}
                            </Typography>
                          </Box>
                        )}
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
                          onClick={() => handleExistingFileDelete(url)}
                        >
                          <Close fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    )
                  })}
                </Box>
              </Grid>
            )}
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
            Record Repair
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog - THEMED */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: colors.sidebar, color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Repair Details</Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingRepair && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Equipment</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkText }}>
                    {viewingRepair.equipment_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Engineer</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>
                    {viewingRepair.engineer_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Time Taken</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>
                    {viewingRepair.time_taken || 'N/A'} minutes
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Spare Part Used</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>
                    {viewingRepair.spare_part_used ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Repair Date</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkText }}>
                    {viewingRepair.repair_date ? new Date(viewingRepair.repair_date).toLocaleString() : 
                     viewingRepair.created_at ? new Date(viewingRepair.created_at).toLocaleString() : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                    Root Cause
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ color: colors.darkText }}>
                    {viewingRepair.root_cause || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                    Problem Analysis
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ color: colors.darkText }}>
                    {viewingRepair.problem_analysis || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                    Corrective Action
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ color: colors.darkText }}>
                    {viewingRepair.corrective_action || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                    Repair Procedure
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: colors.mainBg, borderRadius: 1, border: `1px solid ${colors.borderColor}` }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: colors.darkText }}>
                      {viewingRepair.repair_procedure || 'Not specified'}
                    </Typography>
                  </Paper>
                </Grid>
                {viewingRepair.solution_description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                      Solution Description
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkText }}>
                      {viewingRepair.solution_description}
                    </Typography>
                  </Grid>
                )}
                {viewingRepair.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                      Remarks
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.darkText }}>
                      {viewingRepair.remarks}
                    </Typography>
                  </Grid>
                )}

                {/* Attachments in View */}
                {viewingRepair.attachments && viewingRepair.attachments.split(',').filter(Boolean).length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1, borderColor: colors.borderColor }} />
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: colors.sidebar }} gutterBottom>
                      Attachments ({viewingRepair.attachments.split(',').filter(Boolean).length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {viewingRepair.attachments.split(',').filter(Boolean).map((url, idx) => {
                        const fullUrl = getFullUrl(url)
                        const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                        const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi)$/i)
                        const fileName = url.split('/').pop()
                        
                        return (
                          <Box
                            key={idx}
                            sx={{
                              width: isImage ? 150 : 120,
                              height: isImage ? 150 : 120,
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: `1px solid ${colors.borderColor}`,
                              bgcolor: colors.mainBg,
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: 4
                              }
                            }}
                            onClick={() => window.open(fullUrl, '_blank')}
                          >
                            {isImage ? (
                              <Box
                                component="img"
                                src={fullUrl}
                                alt={`Attachment ${idx + 1}`}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                                }}
                              />
                            ) : isVideo ? (
                              <video style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                                <source src={fullUrl} />
                              </video>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 1 }}>
                                <Typography variant="body2">📄</Typography>
                                <Typography variant="caption" align="center" noWrap sx={{ maxWidth: '100%', color: colors.lightText }}>
                                  {fileName}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView} sx={{ color: colors.lightText }}>Close</Button>
          {isSuperAdmin && viewingRepair && (
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(viewingRepair.id)
                handleCloseView()
              }}
              startIcon={<Delete />}
              sx={{ boxShadow: `0 4px 16px ${colors.error}44` }}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Repairs