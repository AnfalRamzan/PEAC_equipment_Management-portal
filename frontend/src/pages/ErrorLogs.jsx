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
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Close,
  Upload,
  AttachFile
} from '@mui/icons-material'
import { errorService, equipmentService } from '../api/services'
import { toast } from 'react-toastify'

const ErrorLogs = () => {
  const [errors, setErrors] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingError, setEditingError] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    dateRange: ''
  })
  const [formData, setFormData] = useState({
    equipment_id: '',
    error_code: '',
    error_title: '',
    error_description: '',
    severity: 'Medium',
    images: '',
    videos: '',
    documents: ''
  })

  useEffect(() => {
    fetchErrors()
    fetchEquipment()
  }, [])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      const response = await errorService.getAll()
      setErrors(response.data.errors || [])
    } catch (error) {
      toast.error('Failed to fetch errors')
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getAll()
      setEquipment(response.data.equipment || [])
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
    }
  }

  const handleOpenDialog = (error = null) => {
    if (error) {
      setEditingError(error)
      setFormData({
        equipment_id: error.equipment_id,
        error_code: error.error_code || '',
        error_title: error.error_title,
        error_description: error.error_description || '',
        severity: error.severity || 'Medium',
        images: error.images || '',
        videos: error.videos || '',
        documents: error.documents || ''
      })
    } else {
      setEditingError(null)
      setFormData({
        equipment_id: '',
        error_code: '',
        error_title: '',
        error_description: '',
        severity: 'Medium',
        images: '',
        videos: '',
        documents: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingError(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    try {
      if (editingError) {
        await errorService.update(editingError.id, formData)
        toast.success('Error updated successfully')
      } else {
        await errorService.create(formData)
        toast.success('Error reported successfully')
      }
      fetchErrors()
      handleCloseDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await errorService.updateStatus(id, status)
      toast.success('Status updated successfully')
      fetchErrors()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this error log?')) {
      try {
        await errorService.delete(id)
        toast.success('Error deleted successfully')
        fetchErrors()
      } catch (error) {
        toast.error('Failed to delete error')
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'warning',
      'In Progress': 'info',
      'Resolved': 'success',
      'Closed': 'default'
    }
    return colors[status] || 'default'
  }

  const getSeverityColor = (severity) => {
    const colors = {
      'Low': 'success',
      'Medium': 'info',
      'High': 'warning',
      'Critical': 'error'
    }
    return colors[severity] || 'default'
  }

  const filteredErrors = errors.filter(error => {
    const matchesSearch = error.error_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.error_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          error.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || error.status === filters.status
    const matchesSeverity = !filters.severity || error.severity === filters.severity
    return matchesSearch && matchesStatus && matchesSeverity
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Error Logs
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#0B5FA5',
            '&:hover': { bgcolor: '#084a8a' }
          }}
        >
          Report Error
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search errors..."
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
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              label="Severity"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<FilterList />}>
            More Filters
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Error</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Reported By</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredErrors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No errors found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredErrors.map((error) => (
                <TableRow key={error.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {error.error_title}
                    </Typography>
                  </TableCell>
                  <TableCell>{error.equipment_name}</TableCell>
                  <TableCell>
                    <Chip label={error.error_code || 'N/A'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={error.severity} 
                      color={getSeverityColor(error.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={error.status} 
                      color={getStatusColor(error.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{error.reported_by_name}</TableCell>
                  <TableCell>
                    {new Date(error.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" color="info" onClick={() => handleOpenDialog(error)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(error.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Report Error Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingError ? 'Edit Error' : 'Report New Error'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment"
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
                label="Error Code"
                name="error_code"
                value={formData.error_code}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  name="severity"
                  value={formData.severity}
                  onChange={handleFormChange}
                  label="Severity"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Title"
                name="error_title"
                value={formData.error_title}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Error Description"
                name="error_description"
                value={formData.error_description}
                onChange={handleFormChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                fullWidth
                sx={{ py: 2 }}
              >
                Upload Images
                <input type="file" hidden multiple accept="image/*" />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFile />}
                fullWidth
                sx={{ py: 2 }}
              >
                Attach Documents
                <input type="file" hidden multiple />
              </Button>
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
            {editingError ? 'Update' : 'Report Error'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ErrorLogs