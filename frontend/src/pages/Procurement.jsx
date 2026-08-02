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
  Select
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  Close,
  LocalShipping,
  CheckCircle,
  Cancel
} from '@mui/icons-material'
import { procurementService, equipmentService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'

const Procurement = () => {
  const [requests, setRequests] = useState([])
  const [equipment, setEquipment] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    priority: ''
  })
  const [formData, setFormData] = useState({
    hospital_id: '',
    equipment_name: '',
    category_id: '',
    manufacturer: '',
    model: '',
    quantity: 1,
    estimated_cost: '',
    justification: '',
    priority: 'Medium'
  })

  useEffect(() => {
    fetchRequests()
    fetchEquipment()
    fetchHospitals()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await procurementService.getAll()
      setRequests(response.data.requests || [])
    } catch (error) {
      toast.error('Failed to fetch procurement requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await equipmentService.getCategories()
      setEquipment(response.data.categories || [])
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await hospitalService.getAll()
      setHospitals(response.data.hospitals || [])
    } catch (error) {
      console.error('Failed to fetch hospitals:', error)
    }
  }

  const handleOpenDialog = (request = null) => {
    if (request) {
      setEditingRequest(request)
      setFormData({
        hospital_id: request.hospital_id,
        equipment_name: request.equipment_name,
        category_id: request.category_id || '',
        manufacturer: request.manufacturer || '',
        model: request.model || '',
        quantity: request.quantity || 1,
        estimated_cost: request.estimated_cost || '',
        justification: request.justification || '',
        priority: request.priority || 'Medium'
      })
    } else {
      setEditingRequest(null)
      setFormData({
        hospital_id: '',
        equipment_name: '',
        category_id: '',
        manufacturer: '',
        model: '',
        quantity: 1,
        estimated_cost: '',
        justification: '',
        priority: 'Medium'
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRequest(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    try {
      if (editingRequest) {
        await procurementService.update(editingRequest.id, formData)
        toast.success('Procurement request updated successfully')
      } else {
        await procurementService.create(formData)
        toast.success('Procurement request created successfully')
      }
      fetchRequests()
      handleCloseDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this procurement request?')) {
      try {
        await procurementService.delete(id)
        toast.success('Procurement request deleted successfully')
        fetchRequests()
      } catch (error) {
        toast.error('Failed to delete request')
      }
    }
  }

  const handleApprove = async (id) => {
    try {
      await procurementService.update(id, { status: 'Approved' })
      toast.success('Procurement request approved')
      fetchRequests()
    } catch (error) {
      toast.error('Failed to approve request')
    }
  }

  const handleReject = async (id) => {
    try {
      await procurementService.update(id, { status: 'Rejected' })
      toast.success('Procurement request rejected')
      fetchRequests()
    } catch (error) {
      toast.error('Failed to reject request')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Requested': 'warning',
      'Under Review': 'info',
      'Approved': 'success',
      'Rejected': 'error',
      'Procured': 'success'
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'success',
      'Medium': 'info',
      'High': 'warning',
      'Urgent': 'error'
    }
    return colors[priority] || 'default'
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.model?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || request.status === filters.status
    const matchesPriority = !filters.priority || request.priority === filters.priority
    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Equipment Procurement
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
          Request Equipment
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search requests..."
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
              <MenuItem value="Requested">Requested</MenuItem>
              <MenuItem value="Under Review">Under Review</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Procured">Procured</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Manufacturer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Model</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Qty</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Est. Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Priority</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No procurement requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalShipping sx={{ fontSize: 18, color: '#0B5FA5' }} />
                      <Typography variant="body2" fontWeight={500}>
                        {request.equipment_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{request.hospital_name}</TableCell>
                  <TableCell>{request.manufacturer || '-'}</TableCell>
                  <TableCell>{request.model || '-'}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>
                    {request.estimated_cost ? `$${parseFloat(request.estimated_cost).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      color={getPriorityColor(request.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <Visibility />
                    </IconButton>
                    {(request.status === 'Requested' || request.status === 'Under Review') && (
                      <>
                        <IconButton size="small" color="info" onClick={() => handleOpenDialog(request)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(request.id)}>
                          <Delete />
                        </IconButton>
                      </>
                    )}
                    {request.status === 'Under Review' && (
                      <>
                        <IconButton size="small" color="success" onClick={() => handleApprove(request.id)}>
                          <CheckCircle />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleReject(request.id)}>
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRequest ? 'Edit Procurement Request' : 'New Procurement Request'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hospital</InputLabel>
                <Select
                  name="hospital_id"
                  value={formData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital"
                  required
                >
                  <MenuItem value="">Select Hospital</MenuItem>
                  {hospitals.map(h => (
                    <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleFormChange}
                  label="Category"
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {equipment.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Equipment Name"
                name="equipment_name"
                value={formData.equipment_name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manufacturer"
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estimated Cost ($)"
                name="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  label="Priority"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Justification"
                name="justification"
                value={formData.justification}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="Explain why this equipment is needed..."
              />
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
            {editingRequest ? 'Update' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Procurement