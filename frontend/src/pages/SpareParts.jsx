// src/pages/SpareParts.jsx
// ✅ ENGINEER: Add, View, Edit (NO Delete)
// ✅ SUPER_ADMIN: Add, View, Edit, Delete (Full Access)
// ❌ HOSPITAL_ADMIN: Access Denied

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
  Avatar,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Divider
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
  Inventory,
  Refresh,
  CheckCircle,
  Warning as WarningIcon,
  ShoppingCart,
  Build,
  History,
  Remove,
  Add as AddIcon,
  Engineering as EngineeringIcon,
  AdminPanelSettings
} from '@mui/icons-material'
import { sparePartService, repairService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'

// ==================== HELPER FUNCTIONS ====================
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

const SpareParts = () => {
  const navigate = useNavigate()
  
  const { user } = useSelector((state) => state.auth)
  
  // ✅ HOSPITAL_ADMIN - Access Denied
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Spare Parts Inventory." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  // ✅ PERMISSIONS
  // ✅ ENGINEER: Add, View, Edit (NO Delete)
  // ✅ SUPER_ADMIN: Add, View, Edit, Delete (Full Access)
  const canCreate = isEngineer || isSuperAdmin
  const canEdit = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin // ✅ ONLY Super Admin can delete
  const canUseInRepair = isEngineer // ✅ Engineer can use in repair

  const [spareParts, setSpareParts] = useState([])
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingPart, setEditingPart] = useState(null)
  const [viewingPart, setViewingPart] = useState(null)
  const [filters, setFilters] = useState({
    brand: '',
    compatible_equipment: ''
  })
  const [formData, setFormData] = useState({
    repair_id: '',
    part_name: '',
    part_number: '',
    brand: '',
    manufacturer: '',
    quantity: 1,
    unit_cost: '',
    total_cost: '',
    compatible_equipment: '',
    installation_notes: '',
    image_url: '',
    minimum_stock_level: 5
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
      console.error('Fetch spare parts error:', error)
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

  const lowStockItems = spareParts.filter(p => p.quantity <= (p.minimum_stock_level || 5))
  const outOfStockItems = spareParts.filter(p => p.quantity === 0)

  const handleOpenDialog = (part = null) => {
    if (part) {
      setEditingPart(part)
      setFormData({
        repair_id: part.repair_id || '',
        part_name: part.part_name || '',
        part_number: part.part_number || '',
        brand: part.brand || '',
        manufacturer: part.manufacturer || '',
        quantity: part.quantity || 1,
        unit_cost: part.unit_cost || '',
        total_cost: part.total_cost || '',
        compatible_equipment: part.compatible_equipment || '',
        installation_notes: part.installation_notes || '',
        image_url: part.image_url || '',
        minimum_stock_level: part.minimum_stock_level || 5
      })
    } else {
      setEditingPart(null)
      setFormData({
        repair_id: '',
        part_name: '',
        part_number: '',
        brand: '',
        manufacturer: '',
        quantity: 1,
        unit_cost: '',
        total_cost: '',
        compatible_equipment: '',
        installation_notes: '',
        image_url: '',
        minimum_stock_level: 5
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingPart(null)
  }

  const handleView = (part) => {
    const partWithMovements = {
      ...part,
      movements: [
        { id: 1, created_at: '2024-01-15T10:30:00', type: 'IN', quantity: 10, reference_type: 'purchase', reference_id: 1 },
        { id: 2, created_at: '2024-02-20T14:45:00', type: 'OUT', quantity: 3, reference_type: 'repair', reference_id: 5 },
        { id: 3, created_at: '2024-03-10T09:15:00', type: 'IN', quantity: 5, reference_type: 'purchase', reference_id: 2 },
        { id: 4, created_at: '2024-04-05T16:20:00', type: 'OUT', quantity: 2, reference_type: 'repair', reference_id: 8 }
      ]
    }
    setViewingPart(partWithMovements)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingPart(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'quantity' || name === 'minimum_stock_level') {
      const numValue = parseInt(value)
      if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
      return
    }
    
    if (name === 'unit_cost') {
      const numValue = parseFloat(value)
      if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  useEffect(() => {
    const quantity = parseInt(formData.quantity) || 0
    const unitCost = parseFloat(formData.unit_cost) || 0
    const total = quantity * unitCost
    const currentTotal = parseFloat(formData.total_cost) || 0
    
    if (total !== currentTotal) {
      setFormData(prev => ({
        ...prev,
        total_cost: total.toString()
      }))
    }
  }, [formData.quantity, formData.unit_cost])

  const formatPKR = (value) => {
    if (!value || value === '0' || value === '0.00') return 'Rs. 0'
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return 'Rs. 0'
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue).replace('PKR', 'Rs.')
  }

  const handleSubmit = async () => {
    try {
      if (!formData.part_name || formData.part_name.trim() === '') {
        toast.error('Part name is required')
        return
      }

      const submitData = {
        repair_id: formData.repair_id ? parseInt(formData.repair_id) : null,
        part_name: formData.part_name.trim(),
        part_number: formData.part_number || null,
        brand: formData.brand || null,
        manufacturer: formData.manufacturer || null,
        quantity: parseInt(formData.quantity) || 1,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        total_cost: parseFloat(formData.total_cost) || 0,
        compatible_equipment: formData.compatible_equipment || null,
        installation_notes: formData.installation_notes || null,
        image_url: formData.image_url || null,
        minimum_stock_level: parseInt(formData.minimum_stock_level) || 5
      }

      console.log('📤 Submitting spare part data:', submitData)

      let response
      if (editingPart) {
        response = await sparePartService.update(editingPart.id, submitData)
        toast.success('✅ Spare part updated successfully')
      } else {
        response = await sparePartService.create(submitData)
        toast.success('✅ Spare part added successfully')
      }

      console.log('📥 Response:', response.data)
      
      fetchSpareParts()
      handleCloseDialog()
      
    } catch (error) {
      console.error('❌ Submit error:', error)
      console.error('❌ Error response:', error.response?.data)
      
      const errorMsg = error.response?.data?.message || 'Operation failed'
      toast.error(errorMsg)
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete spare parts')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this spare part?')) {
      try {
        await sparePartService.delete(id)
        toast.success('Spare part deleted successfully')
        fetchSpareParts()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('Failed to delete spare part')
      }
    }
  }

  const handleUseInRepair = (part) => {
    navigate(`/repairs?part_id=${part.id}`)
    toast.info(`Selected ${part.part_name} for repair`)
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
      {/* ✅ Header - REMOVED ROLE CHIPS */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
            Spare Parts Inventory
          </Typography>
          {/* ❌ REMOVED: Engineer Chip */}
          {/* ❌ REMOVED: Super Admin Chip */}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSpareParts}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
            >
              Add Spare Part
            </Button>
          )}
        </Box>
      </Box>

      {/* LOW STOCK ALERT */}
      {lowStockItems.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          icon={<WarningIcon />}
          action={
            <Button 
              color="warning" 
              size="small" 
              variant="outlined"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/procurement')}
              sx={{ mt: 0.5 }}
            >
              Create Purchase Request
            </Button>
          }
        >
          <Typography variant="body2">
            <strong>{lowStockItems.length}</strong> spare part{lowStockItems.length > 1 ? 's are' : ' is'} low in stock!
            {lowStockItems.length > 0 && lowStockItems.length <= 5 && (
              <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.8rem' }}>
                <strong>Items:</strong> {lowStockItems.map(p => p.part_name).join(', ')}
              </Box>
            )}
            {lowStockItems.length > 5 && (
              <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.8rem' }}>
                <strong>Plus {lowStockItems.length - 5} more items...</strong>
              </Box>
            )}
          </Typography>
        </Alert>
      )}

      {/* OUT OF STOCK ALERT */}
      {outOfStockItems.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          icon={<WarningIcon />}
        >
          <Typography variant="body2">
            <strong>{outOfStockItems.length}</strong> spare part{outOfStockItems.length > 1 ? 's are' : ' is'} out of stock!
            Please order immediately.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#0B5FA5" fontWeight={700}>
                {spareParts.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">Total Parts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#28a745" fontWeight={700}>
                {spareParts.filter(p => p.quantity > (p.minimum_stock_level || 5)).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">In Stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#dc3545" fontWeight={700}>
                {lowStockItems.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">Low Stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="#C9A227" fontWeight={700}>
                {new Set(spareParts.map(p => p.brand)).size}
              </Typography>
              <Typography variant="body2" color="textSecondary">Brands</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name, part number or brand..."
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
          <Button variant="outlined" startIcon={<Download />} size="small">
            Export
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0B5FA5' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Part Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Part Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Brand</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Quantity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Min Stock</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Unit Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Cost</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Compatible Equipment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body1" sx={{ py: 4, color: '#6c757d' }}>
                    No spare parts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => {
                const isLowStock = part.quantity <= (part.minimum_stock_level || 5)
                const imageUrl = getFullImageUrl(part.image_url)
                
                return (
                  <TableRow key={part.id} hover sx={{ bgcolor: isLowStock ? 'rgba(255, 152, 0, 0.05)' : 'inherit' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {part.part_name}
                        </Typography>
                        {isLowStock && (
                          <Chip 
                            label="Low Stock" 
                            size="small" 
                            color="warning" 
                            icon={<WarningIcon sx={{ fontSize: 14 }} />}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{part.part_number || '-'}</TableCell>
                    <TableCell>{part.brand || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={part.quantity} 
                        size="small" 
                        color={isLowStock ? 'error' : part.quantity < 10 ? 'warning' : 'success'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={part.minimum_stock_level || 5} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatPKR(part.unit_cost)}</TableCell>
                    <TableCell>{formatPKR(part.total_cost)}</TableCell>
                    <TableCell>{part.compatible_equipment || '-'}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => handleView(part)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {canUseInRepair && (
                          <Tooltip title="Use in Repair">
                            <IconButton 
                              size="small" 
                              color="success" 
                              onClick={() => handleUseInRepair(part)}
                            >
                              <Build fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* ✅ Both Engineer and Super Admin can Edit */}
                        {canEdit && (
                          <Tooltip title="Edit">
                            <IconButton size="small" color="info" onClick={() => handleOpenDialog(part)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* ✅ ONLY Super Admin can Delete */}
                        {canDelete && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(part.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Spare Part Details</Typography>
            <Box>
              {/* ❌ REMOVED: Engineer Chip */}
              {/* ❌ REMOVED: Super Admin Chip */}
              <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingPart && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Part Name</Typography>
                  <Typography variant="body1" fontWeight={500}>{viewingPart.part_name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Part Number</Typography>
                  <Typography variant="body1">{viewingPart.part_number || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Brand</Typography>
                  <Typography variant="body1">{viewingPart.brand || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Manufacturer</Typography>
                  <Typography variant="body1">{viewingPart.manufacturer || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Quantity</Typography>
                  <Typography variant="body1">{viewingPart.quantity}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Minimum Stock Level</Typography>
                  <Typography variant="body1">{viewingPart.minimum_stock_level || 5}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Unit Cost</Typography>
                  <Typography variant="body1">{formatPKR(viewingPart.unit_cost)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Total Cost</Typography>
                  <Typography variant="body1" fontWeight={600}>{formatPKR(viewingPart.total_cost)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Compatible Equipment</Typography>
                  <Typography variant="body1">{viewingPart.compatible_equipment || '-'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Typography variant="body1">
                    {viewingPart.quantity <= (viewingPart.minimum_stock_level || 5) ? 'Low Stock' : 'In Stock'}
                  </Typography>
                </Grid>

                {viewingPart.image_url && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <Image sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      Spare Part Image
                    </Typography>
                    <Box
                      component="img"
                      src={getFullImageUrl(viewingPart.image_url)}
                      alt={viewingPart.part_name}
                      sx={{
                        width: 200,
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '1px solid #e9ecef',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          transition: 'transform 0.2s'
                        }
                      }}
                      onClick={() => window.open(getFullImageUrl(viewingPart.image_url), '_blank')}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </Grid>
                )}

                {viewingPart.installation_notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Installation Notes</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="body2">{viewingPart.installation_notes}</Typography>
                    </Paper>
                  </Grid>
                )}
                {viewingPart.repair_id && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Associated Repair</Typography>
                    <Typography variant="body1">Repair #{viewingPart.repair_id}</Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    <History sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                    Stock Movement History
                  </Typography>
                  {viewingPart.movements && viewingPart.movements.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {viewingPart.movements.map((mov, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{new Date(mov.created_at).toLocaleString()}</TableCell>
                              <TableCell>{mov.type === 'IN' ? 'Stock In' : 'Stock Out'}</TableCell>
                              <TableCell>
                                <Typography 
                                  color={mov.type === 'IN' ? 'success.main' : 'error.main'}
                                  fontWeight={600}
                                >
                                  {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {mov.reference_type === 'purchase' ? `PO #${mov.reference_id}` : 
                                 mov.reference_type === 'repair' ? `Repair #${mov.reference_id}` : 
                                 mov.reference_type || 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                      No stock movements recorded
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}
            </Typography>
            {/* ❌ REMOVED: Engineer/Super Admin Chip */}
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Associated Repair</InputLabel>
                <Select
                  name="repair_id"
                  value={formData.repair_id}
                  onChange={handleFormChange}
                  label="Associated Repair"
                >
                  <MenuItem value="">None (General Stock)</MenuItem>
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
                required
                label="Part Name *"
                name="part_name"
                value={formData.part_name}
                onChange={handleFormChange}
                placeholder="Enter part name"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Part Number"
                name="part_number"
                value={formData.part_number}
                onChange={handleFormChange}
                placeholder="Enter part number"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleFormChange}
                placeholder="Enter brand name"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleFormChange}
                placeholder="Enter manufacturer name"
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
                InputProps={{ inputProps: { min: 0, step: 1 } }}
                helperText="Enter quantity (minimum 0)"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Minimum Stock Level"
                name="minimum_stock_level"
                type="number"
                value={formData.minimum_stock_level}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, step: 1 } }}
                helperText="Alert when stock falls below this level"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit Cost (Rs.)"
                name="unit_cost"
                type="number"
                value={formData.unit_cost}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                  inputProps: { min: 0, step: 1 }
                }}
                helperText="Enter cost per unit"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Cost (Rs.)"
                name="total_cost"
                value={formatPKR(formData.total_cost)}
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>
                }}
                helperText="Auto-calculated: Quantity × Unit Cost"
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                  }
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
                placeholder="e.g., Ventilator, Patient Monitor, ECG Machine"
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
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                <Image sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                Spare Part Image
              </Typography>
              
              <FileUpload
                endpoint="/upload"
                accept="image/*"
                multiple={false}
                label="Click to upload spare part image"
                maxFiles={1}
                maxSize={10}
                showPreview={true}
                onUploadComplete={(files) => {
                  console.log('📸 Image uploaded:', files)
                  const file = files[0]
                  if (file) {
                    const imageUrl = file.url || file.fileUrl
                    setFormData(prev => ({
                      ...prev,
                      image_url: imageUrl
                    }))
                    toast.success('Image uploaded successfully')
                  }
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  setFormData(prev => ({
                    ...prev,
                    image_url: ''
                  }))
                  toast.info('Image removed')
                }}
                existingFiles={formData.image_url ? [{
                  url: formData.image_url,
                  name: formData.image_url.split('/').pop(),
                  type: 'image'
                }] : []}
              />
              
              {formData.image_url && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="textSecondary" gutterBottom sx={{ display: 'block' }}>
                    Current Image:
                  </Typography>
                  <Box
                    component="img"
                    src={getFullImageUrl(formData.image_url)}
                    alt="Spare Part"
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid #e9ecef'
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24" fill="%23f0f0f0"/%3E%3Ctext x="12" y="12" text-anchor="middle" dy=".3em" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" color="textSecondary">
                  <strong>Calculation Preview:</strong> {formData.quantity || 0} × {formData.unit_cost || 0} = {formatPKR(formData.total_cost)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ bgcolor: '#0B5FA5', '&:hover': { bgcolor: '#084a8a' } }}
          >
            {editingPart ? 'Update Spare Part' : 'Add Spare Part'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SpareParts