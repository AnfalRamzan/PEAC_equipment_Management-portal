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
  Alert
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
  Refresh
} from '@mui/icons-material'
import { amcService, equipmentService } from '../api/services'
import { toast } from 'react-toastify'

const AMC = () => {
  const [contracts, setContracts] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [viewingContract, setViewingContract] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
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
    status: 'Active'
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

  const handleOpenDialog = (contract = null) => {
    if (contract) {
      setEditingContract(contract)
      setFormData({
        equipment_id: contract.equipment_id,
        vendor_name: contract.vendor_name,
        contract_number: contract.contract_number || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        cost: contract.cost || '',
        contact_person: contract.contact_person || '',
        contact_phone: contract.contact_phone || '',
        status: contract.status || 'Active'
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
        status: 'Active'
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
    try {
      if (editingContract) {
        await amcService.update(editingContract.id, formData)
        toast.success('AMC contract updated successfully')
      } else {
        await amcService.create(formData)
        toast.success('AMC contract created successfully')
      }
      fetchContracts()
      handleCloseDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
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

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'success',
      'Expired': 'error',
      'Pending': 'warning'
    }
    return colors[status] || 'default'
  }

  const isExpiringSoon = (endDate) => {
    if (!endDate) return false
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || contract.status === filters.status
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Annual Maintenance Contracts (AMC)
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchContracts}
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
            Add AMC
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search AMC contracts..."
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
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
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
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Vendor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Contract #</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>End Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No AMC contracts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {contract.equipment_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{contract.vendor_name}</TableCell>
                  <TableCell>
                    <Chip label={contract.contract_number || 'N/A'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Box>
                      {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '-'}
                      {isExpiringSoon(contract.end_date) && contract.status === 'Active' && (
                        <Chip
                          label="Expiring Soon"
                          size="small"
                          color="warning"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {contract.cost ? `$${parseFloat(contract.cost).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={contract.status}
                      color={getStatusColor(contract.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => handleView(contract)}>
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" color="info" onClick={() => handleOpenDialog(contract)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(contract.id)}>
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
          {editingContract ? 'Edit AMC Contract' : 'Add New AMC Contract'}
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
              <FormControl fullWidth>
                <InputLabel>Equipment</InputLabel>
                <Select
                  name="equipment_id"
                  value={formData.equipment_id}
                  onChange={handleFormChange}
                  label="Equipment"
                  required
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
                label="Vendor Name"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contract Number"
                name="contract_number"
                value={formData.contract_number}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost ($)"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
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
                  <MenuItem value="Expired">Expired</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFile />}
                fullWidth
                sx={{ py: 2 }}
              >
                Upload Contract Document
                <input type="file" hidden />
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
            {editingContract ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle>
          AMC Contract Details
          <IconButton
            onClick={handleCloseView}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewingContract && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Equipment</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {viewingContract.equipment_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Vendor</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {viewingContract.vendor_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Contract Number</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {viewingContract.contract_number || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Chip
                  label={viewingContract.status}
                  color={getStatusColor(viewingContract.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Start Date</Typography>
                <Typography variant="body1">
                  {viewingContract.start_date ? new Date(viewingContract.start_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">End Date</Typography>
                <Typography variant="body1">
                  {viewingContract.end_date ? new Date(viewingContract.end_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Cost</Typography>
                <Typography variant="body1">
                  {viewingContract.cost ? `$${parseFloat(viewingContract.cost).toFixed(2)}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Contact Person</Typography>
                <Typography variant="body1">
                  {viewingContract.contact_person || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Contact Phone</Typography>
                <Typography variant="body1">
                  {viewingContract.contact_phone || '-'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AMC