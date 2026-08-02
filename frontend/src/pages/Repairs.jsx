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
  Divider,
  Avatar,
  Card,
  CardContent
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  Close,
  Build,
  CheckCircle,
  Cancel,
  Refresh,
  Upload,
  AttachFile,
  AccessTime,
  Person,
  Description,
  Settings
} from '@mui/icons-material'
import { repairService, errorService, equipmentService } from '../api/services'
import { toast } from 'react-toastify'

const Repairs = () => {
  const [repairs, setRepairs] = useState([])
  const [errors, setErrors] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingRepair, setEditingRepair] = useState(null)
  const [viewingRepair, setViewingRepair] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    engineer: ''
  })
  const [formData, setFormData] = useState({
    error_log_id: '',
    engineer_id: '',
    root_cause: '',
    problem_analysis: '',
    corrective_action: '',
    repair_procedure: '',
    solution_description: '',
    time_taken: '',
    spare_part_used: false,
    remarks: '',
    status: 'Pending'
  })

  useEffect(() => {
    fetchRepairs()
    fetchErrors()
    fetchEquipment()
  }, [])

  const fetchRepairs = async () => {
    setLoading(true)
    try {
      const response = await repairService.getAll()
      setRepairs(response.data.repairs || [])
    } catch (error) {
      toast.error('Failed to fetch repairs')
    } finally {
      setLoading(false)
    }
  }

  const fetchErrors = async () => {
    try {
      const response = await errorService.getAll()
      setErrors(response.data.errors || [])
    } catch (error) {
      console.error('Failed to fetch errors:', error)
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

  const handleOpenDialog = (repair = null) => {
    if (repair) {
      setEditingRepair(repair)
      setFormData({
        error_log_id: repair.error_log_id,
        engineer_id: repair.engineer_id || '',
        root_cause: repair.root_cause || '',
        problem_analysis: repair.problem_analysis || '',
        corrective_action: repair.corrective_action || '',
        repair_procedure: repair.repair_procedure || '',
        solution_description: repair.solution_description || '',
        time_taken: repair.time_taken || '',
        spare_part_used: repair.spare_part_used || false,
        remarks: repair.remarks || '',
        status: repair.status || 'Pending'
      })
    } else {
      setEditingRepair(null)
      setFormData({
        error_log_id: '',
        engineer_id: '',
        root_cause: '',
        problem_analysis: '',
        corrective_action: '',
        repair_procedure: '',
        solution_description: '',
        time_taken: '',
        spare_part_used: false,
        remarks: '',
        status: 'Pending'
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRepair(null)
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
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async () => {
    try {
      if (editingRepair) {
        await repairService.update(editingRepair.id, formData)
        toast.success('Repair updated successfully')
      } else {
        await repairService.create(formData)
        toast.success('Repair record created successfully')
      }
      fetchRepairs()
      handleCloseDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this repair record?')) {
      try {
        await repairService.delete(id)
        toast.success('Repair deleted successfully')
        fetchRepairs()
      } catch (error) {
        toast.error('Failed to delete repair')
      }
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await repairService.update(id, { status })
      toast.success(`Status updated to ${status}`)
      fetchRepairs()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'warning',
      'In Progress': 'info',
      'Completed': 'success',
      'Verified': 'success'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <AccessTime sx={{ fontSize: 16 }} />
      case 'In Progress':
        return <Build sx={{ fontSize: 16 }} />
      case 'Completed':
        return <CheckCircle sx={{ fontSize: 16 }} />
      case 'Verified':
        return <CheckCircle sx={{ fontSize: 16 }} />
      default:
        return null
    }
  }

  const filteredRepairs = repairs.filter(repair => {
    const matchesSearch = repair.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          repair.error_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          repair.engineer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || repair.status === filters.status
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Repairs Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchRepairs}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              bgcolor: '#0B5FA5',
              '&:hover': { bgcolor: '#084a8a' }
            }}
          >
            Add Repair
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search repairs..."
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
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Verified">Verified</MenuItem>
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
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Error</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Engineer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Time Taken</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Repair Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRepairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No repairs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRepairs.map((repair) => (
                <TableRow key={repair.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {repair.equipment_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {repair.error_title || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{repair.engineer_name || 'Unassigned'}</TableCell>
                  <TableCell>
                    {repair.time_taken ? `${repair.time_taken} min` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(repair.status)}
                      label={repair.status}
                      color={getStatusColor(repair.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {repair.repair_date ? new Date(repair.repair_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => handleView(repair)}>
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" color="info" onClick={() => handleOpenDialog(repair)}>
                      <Edit />
                    </IconButton>
                    {repair.status === 'Pending' && (
                      <IconButton 
                        size="small" 
                        color="success" 
                        onClick={() => handleStatusChange(repair.id, 'In Progress')}
                      >
                        <Build />
                      </IconButton>
                    )}
                    {repair.status === 'In Progress' && (
                      <IconButton 
                        size="small" 
                        color="success" 
                        onClick={() => handleStatusChange(repair.id, 'Completed')}
                      >
                        <CheckCircle />
                      </IconButton>
                    )}
                    <IconButton size="small" color="error" onClick={() => handleDelete(repair.id)}>
                      <Delete />
                    </IconButton>
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
          {editingRepair ? 'Edit Repair Record' : 'Add New Repair Record'}
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
                <InputLabel>Error Log</InputLabel>
                <Select
                  name="error_log_id"
                  value={formData.error_log_id}
                  onChange={handleFormChange}
                  label="Error Log"
                  required
                >
                  <MenuItem value="">Select Error</MenuItem>
                  {errors.map(error => (
                    <MenuItem key={error.id} value={error.id}>
                      {error.error_title} - {error.equipment_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Engineer ID"
                name="engineer_id"
                type="number"
                value={formData.engineer_id}
                onChange={handleFormChange}
                placeholder="Enter engineer ID"
              />
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
              />
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
                rows={2}
                placeholder="Step by step repair procedure"
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time Taken (minutes)"
                name="time_taken"
                type="number"
                value={formData.time_taken}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0 } }}
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
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Verified">Verified</MenuItem>
                </Select>
              </FormControl>
            </Grid>
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
                Upload Repair Images
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
            {editingRepair ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle>
          Repair Details
          <IconButton
            onClick={handleCloseView}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewingRepair && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Equipment</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingRepair.equipment_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Error</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingRepair.error_title || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Engineer</Typography>
                  <Typography variant="body1">
                    {viewingRepair.engineer_name || 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={viewingRepair.status}
                    color={getStatusColor(viewingRepair.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Time Taken</Typography>
                  <Typography variant="body1">
                    {viewingRepair.time_taken ? `${viewingRepair.time_taken} minutes` : 'Not recorded'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Repair Date</Typography>
                  <Typography variant="body1">
                    {viewingRepair.repair_date ? new Date(viewingRepair.repair_date).toLocaleString() : '-'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>Root Cause</Typography>
              <Typography variant="body1" paragraph>
                {viewingRepair.root_cause || 'Not specified'}
              </Typography>

              <Typography variant="h6" gutterBottom>Problem Analysis</Typography>
              <Typography variant="body1" paragraph>
                {viewingRepair.problem_analysis || 'Not specified'}
              </Typography>

              <Typography variant="h6" gutterBottom>Corrective Action</Typography>
              <Typography variant="body1" paragraph>
                {viewingRepair.corrective_action || 'Not specified'}
              </Typography>

              <Typography variant="h6" gutterBottom>Repair Procedure</Typography>
              <Typography variant="body1" paragraph>
                {viewingRepair.repair_procedure || 'Not specified'}
              </Typography>

              <Typography variant="h6" gutterBottom>Solution Description</Typography>
              <Typography variant="body1" paragraph>
                {viewingRepair.solution_description || 'Not specified'}
              </Typography>

              {viewingRepair.remarks && (
                <>
                  <Typography variant="h6" gutterBottom>Remarks</Typography>
                  <Typography variant="body1" paragraph>
                    {viewingRepair.remarks}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView}>Close</Button>
          {viewingRepair?.status !== 'Completed' && viewingRepair?.status !== 'Verified' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                handleStatusChange(viewingRepair.id, 'Completed')
                handleCloseView()
              }}
            >
              Mark as Completed
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Repairs