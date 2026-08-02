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
  Avatar
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
  Image,
  AttachMoney,
  Inventory
} from '@mui/icons-material'
import { sparePartService, repairService } from '../api/services'
import { toast } from 'react-toastify'

const SpareParts = () => {
  const [spareParts, setSpareParts] = useState([])
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPart, setEditingPart] = useState(null)
  const [filters, setFilters] = useState({
    brand: '',
    compatible_equipment: ''
  })
  const [formData, setFormData] = useState({
    repair_id: '',
    part_name: '',
    part_number: '',
    brand: '',
    quantity: 1,
    unit_cost: '',
    total_cost: '',
    compatible_equipment: '',
    installation_notes: '',
    manufacturer: ''
  })

  useEffect(() => {
    fetchSpareParts()
    fetchRepairs()
  }, [])

  const fetchSpareParts = async () => {
    setLoading(true)
    try {
      const response = await sparePartService.getAll()
      setSpareParts(response.data.spareParts || [])
    } catch (error) {
      toast.error('Failed to fetch spare parts')
    } finally {
      setLoading(false)
    }
  }

  const fetchRepairs = async () => {
    try {
      const response = await repairService.getAll()
      setRepairs(response.data.repairs || [])
    } catch (error) {
      console.error('Failed to fetch repairs:', error)
    }
  }

  const handleOpenDialog = (part = null) => {
    if (part) {
      setEditingPart(part)
      setFormData({
        repair_id: part.repair_id,
        part_name: part.part_name,
        part_number: part.part_number || '',
        brand: part.brand || '',
        quantity: part.quantity || 1,
        unit_cost: part.unit_cost || '',
        total_cost: part.total_cost || '',
        compatible_equipment: part.compatible_equipment || '',
        installation_notes: part.installation_notes || '',
        manufacturer: part.manufacturer || ''
      })
    } else {
      setEditingPart(null)
      setFormData({
        repair_id: '',
        part_name: '',
        part_number: '',
        brand: '',
        quantity: 1,
        unit_cost: '',
        total_cost: '',
        compatible_equipment: '',
        installation_notes: '',
        manufacturer: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingPart(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0
    const unitCost = parseFloat(formData.unit_cost) || 0
    const total = quantity * unitCost
    setFormData({
      ...formData,
      total_cost: total.toFixed(2)
    })
  }

  useEffect(() => {
    calculateTotal()
  }, [formData.quantity, formData.unit_cost])

  const handleSubmit = async () => {
    try {
      if (editingPart) {
        await sparePartService.update(editingPart.id, formData)
        toast.success('Spare part updated successfully')
      } else {
        await sparePartService.create(formData)
        toast.success('Spare part added successfully')
      }
      fetchSpareParts()
      handleCloseDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this spare part?')) {
      try {
        await sparePartService.delete(id)
        toast.success('Spare part deleted successfully')
        fetchSpareParts()
      } catch (error) {
        toast.error('Failed to delete spare part')
      }
    }
  }

  const filteredParts = spareParts.filter(part => {
    const matchesSearch = part.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          part.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          part.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBrand = !filters.brand || part.brand?.toLowerCase().includes(filters.brand.toLowerCase())
    return matchesSearch && matchesBrand
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Spare Parts Management
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
          Add Spare Part
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search spare parts..."
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
          <TextField
            size="small"
            label="Brand"
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            sx={{ minWidth: 150 }}
          />
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Part Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Part Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Brand</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Quantity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Unit Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Compatible Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No spare parts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => (
                <TableRow key={part.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#C9A227' }}>
                        <Inventory sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {part.part_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{part.part_number || '-'}</TableCell>
                  <TableCell>{part.brand || '-'}</TableCell>
                  <TableCell>
                    <Chip label={part.quantity} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    {part.unit_cost ? `$${parseFloat(part.unit_cost).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    {part.total_cost ? `$${parseFloat(part.total_cost).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{part.compatible_equipment || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" color="info" onClick={() => handleOpenDialog(part)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(part.id)}>
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
          {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
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
                <InputLabel>Repair ID (Optional)</InputLabel>
                <Select
                  name="repair_id"
                  value={formData.repair_id}
                  onChange={handleFormChange}
                  label="Repair ID (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {repairs.map(repair => (
                    <MenuItem key={repair.id} value={repair.id}>
                      Repair #{repair.id} - {repair.equipment_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Part Name"
                name="part_name"
                value={formData.part_name}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Part Number"
                name="part_number"
                value={formData.part_number}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleFormChange}
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
                label="Unit Cost ($)"
                name="unit_cost"
                type="number"
                value={formData.unit_cost}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <AttachMoney />,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Cost ($)"
                name="total_cost"
                type="number"
                value={formData.total_cost}
                disabled
                InputProps={{
                  startAdornment: <AttachMoney />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Compatible Equipment"
                name="compatible_equipment"
                value={formData.compatible_equipment}
                onChange={handleFormChange}
                placeholder="e.g., Ventilator, Patient Monitor"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Installation Notes"
                name="installation_notes"
                value={formData.installation_notes}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="Any special instructions for installation..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Image />}
                fullWidth
                sx={{ py: 2 }}
              >
                Upload Spare Part Image
                <input type="file" hidden accept="image/*" />
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
            {editingPart ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SpareParts