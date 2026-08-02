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
  ShoppingCart,
  CheckCircle,
  Cancel,
  Print,
  Refresh
} from '@mui/icons-material'
import { purchaseOrderService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: ''
  })
  const [formData, setFormData] = useState({
    hospital_id: '',
    vendor_name: '',
    po_number: '',
    order_date: '',
    delivery_date: '',
    total_amount: '',
    notes: '',
    status: 'Draft'
  })

  useEffect(() => {
    fetchOrders()
    fetchHospitals()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await purchaseOrderService.getAll()
      setOrders(response.data.orders || [])
    } catch (error) {
      toast.error('Failed to fetch purchase orders')
    } finally {
      setLoading(false)
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

  const handleOpenDialog = (order = null) => {
    if (order) {
      setEditingOrder(order)
      setFormData({
        hospital_id: order.hospital_id,
        vendor_name: order.vendor_name,
        po_number: order.po_number || '',
        order_date: order.order_date || '',
        delivery_date: order.delivery_date || '',
        total_amount: order.total_amount || '',
        notes: order.notes || '',
        status: order.status || 'Draft'
      })
    } else {
      setEditingOrder(null)
      setFormData({
        hospital_id: '',
        vendor_name: '',
        po_number: `PO-${Date.now().toString().slice(-8)}`,
        order_date: '',
        delivery_date: '',
        total_amount: '',
        notes: '',
        status: 'Draft'
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingOrder(null)
  }

  const handleView = (order) => {
    setViewingOrder(order)
    setOpenViewDialog(true)
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setViewingOrder(null)
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async () => {
    try {
      if (editingOrder) {
        await purchaseOrderService.update(editingOrder.id, formData)
        toast.success('Purchase order updated successfully')
      } else {
        await purchaseOrderService.create(formData)
        toast.success('Purchase order created successfully')
      }
      fetchOrders()
      handleCloseDialog()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await purchaseOrderService.delete(id)
        toast.success('Purchase order deleted successfully')
        fetchOrders()
      } catch (error) {
        toast.error('Failed to delete purchase order')
      }
    }
  }

  const handleApprove = async (id) => {
    try {
      await purchaseOrderService.update(id, { status: 'Approved' })
      toast.success('Purchase order approved')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to approve order')
    }
  }

  const handleReject = async (id) => {
    try {
      await purchaseOrderService.update(id, { status: 'Cancelled' })
      toast.success('Purchase order cancelled')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to cancel order')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Pending Approval': 'warning',
      'Approved': 'success',
      'Ordered': 'info',
      'Received': 'success',
      'Cancelled': 'error'
    }
    return colors[status] || 'default'
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || order.status === filters.status
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
          Purchase Orders
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchOrders}
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
            Create Purchase Order
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search purchase orders..."
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
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Pending Approval">Pending Approval</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Ordered">Ordered</MenuItem>
              <MenuItem value="Received">Received</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
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
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>PO Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Hospital</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Vendor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Order Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Delivery Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 3, color: '#6c757d' }}>
                    No purchase orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingCart sx={{ fontSize: 18, color: '#0B5FA5' }} />
                      <Typography variant="body2" fontWeight={500}>
                        {order.po_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{order.hospital_name}</TableCell>
                  <TableCell>{order.vendor_name}</TableCell>
                  <TableCell>{order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    {order.total_amount ? `$${parseFloat(order.total_amount).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => handleView(order)}>
                      <Visibility />
                    </IconButton>
                    {order.status === 'Draft' && (
                      <IconButton size="small" color="info" onClick={() => handleOpenDialog(order)}>
                        <Edit />
                      </IconButton>
                    )}
                    {order.status === 'Pending Approval' && (
                      <>
                        <IconButton size="small" color="success" onClick={() => handleApprove(order.id)}>
                          <CheckCircle />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleReject(order.id)}>
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                    {order.status === 'Draft' && (
                      <IconButton size="small" color="error" onClick={() => handleDelete(order.id)}>
                        <Delete />
                      </IconButton>
                    )}
                    {(order.status === 'Approved' || order.status === 'Ordered') && (
                      <IconButton size="small" color="primary">
                        <Print />
                      </IconButton>
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
          {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
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
              <TextField
                fullWidth
                label="PO Number"
                name="po_number"
                value={formData.po_number}
                onChange={handleFormChange}
                required
              />
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
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Pending Approval">Pending Approval</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Ordered">Ordered</MenuItem>
                  <MenuItem value="Received">Received</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order Date"
                name="order_date"
                type="date"
                value={formData.order_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Date"
                name="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Amount ($)"
                name="total_amount"
                type="number"
                value={formData.total_amount}
                onChange={handleFormChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                multiline
                rows={3}
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
            {editingOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle>
          Purchase Order Details
          <IconButton onClick={handleCloseView} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewingOrder && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">PO Number</Typography>
                <Typography variant="body1" fontWeight={500}>{viewingOrder.po_number}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Chip label={viewingOrder.status} color={getStatusColor(viewingOrder.status)} size="small" />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Hospital</Typography>
                <Typography variant="body1">{viewingOrder.hospital_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Vendor</Typography>
                <Typography variant="body1">{viewingOrder.vendor_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Order Date</Typography>
                <Typography variant="body1">
                  {viewingOrder.order_date ? new Date(viewingOrder.order_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Delivery Date</Typography>
                <Typography variant="body1">
                  {viewingOrder.delivery_date ? new Date(viewingOrder.delivery_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                <Typography variant="body1">
                  {viewingOrder.total_amount ? `$${parseFloat(viewingOrder.total_amount).toFixed(2)}` : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Notes</Typography>
                <Typography variant="body1">{viewingOrder.notes || 'No notes'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView}>Close</Button>
          <Button variant="contained" startIcon={<Print />}>Print</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PurchaseOrders