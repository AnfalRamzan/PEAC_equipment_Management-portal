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
  Card,
  CardContent,
  LinearProgress,
  Alert
} from '@mui/material'
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Download,
  FilterList,
  Close
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { hospitalService } from '../api/services'
import { toast } from 'react-toastify'

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingHospital, setEditingHospital] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    phone: '',
    email: '',
    biomedical_head: ''
  })

  const { user } = useSelector((state) => state.auth)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    fetchHospitals()
  }, [])

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

  const handleOpenDialog = (hospital = null) => {
    if (hospital) {
      setEditingHospital(hospital)
      setFormData({
        name: hospital.name,
        address: hospital.address,
        city: hospital.city || '',
        state: hospital.state || '',
        country: hospital.country || 'Pakistan',
        phone: hospital.phone || '',
        email: hospital.email || '',
        biomedical_head: hospital.biomedical_head || ''
      })
    } else {
      setEditingHospital(null)
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        country: 'Pakistan',
        phone: '',
        email: '',
        biomedical_head: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingHospital(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    try {
      if (editingHospital) {
        await hospitalService.update(editingHospital.id, formData)
        toast.success('Hospital updated successfully')
      } else {
        await hospitalService.create(formData)
        toast.success('Hospital created successfully')
      }
      fetchHospitals()
      handleCloseDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      try {
        await hospitalService.delete(id)
        toast.success('Hospital deleted successfully')
        fetchHospitals()
      } catch (error) {
        toast.error('Failed to delete hospital')
      }
    }
  }

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.biomedical_head?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Hospitals
        </Typography>
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

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
          <Button variant="outlined" startIcon={<FilterList />}>
            Filter
          </Button>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hospital Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Address</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Biomedical Head</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Engineers</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHospitals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
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
                  <TableCell>{hospital.engineer_count || 0}</TableCell>
                  <TableCell>{hospital.equipment_count || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={hospital.is_active ? 'Active' : 'Inactive'}
                      color={hospital.is_active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <Visibility />
                    </IconButton>
                    {isSuperAdmin && (
                      <>
                        <IconButton size="small" color="info" onClick={() => handleOpenDialog(hospital)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(hospital.id)}>
                          <Delete />
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
          {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
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
              <TextField
                fullWidth
                label="Hospital Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Biomedical Engineering Head"
                name="biomedical_head"
                value={formData.biomedical_head}
                onChange={handleFormChange}
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
            {editingHospital ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Hospitals