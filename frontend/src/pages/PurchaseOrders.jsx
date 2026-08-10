// src/pages/PurchaseOrders.jsx
// ✅ ENGINEER: Create, View, Edit (NO Delete, NO Approve/Reject)
// ✅ SUPER_ADMIN: Create, View, Edit, Delete, Approve, Reject (Full Access)
// ❌ HOSPITAL_ADMIN: Access Denied

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  CircularProgress
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
  Refresh,
  AttachFile,
  FileDownload,
  Person,
  Business,
  Receipt,
  LocalShipping,
  Check,
  Description,
  Image,
  PictureAsPdf,
  Warning as WarningIcon,
  Info
} from '@mui/icons-material'
import { purchaseOrderService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
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

const safeToFixed = (value, decimals = 2) => {
  const num = parseFloat(value)
  return isNaN(num) ? '0.00' : num.toFixed(decimals)
}

const safeFormatDate = (date) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

const getStatusColor = (status) => {
  const colors = {
    'Draft': '#6c757d',
    'Pending Approval': '#ff9800',
    'Approved': '#28a745',
    'Ordered': '#2196f3',
    'Received': '#4caf50',
    'Cancelled': '#dc3545'
  }
  return colors[status] || '#6c757d'
}

const getStatusIcon = (status) => {
  switch(status) {
    case 'Draft': return <Description sx={{ fontSize: 20 }} />
    case 'Pending Approval': return <Info sx={{ fontSize: 20 }} />
    case 'Approved': return <CheckCircle sx={{ fontSize: 20 }} />
    case 'Ordered': return <LocalShipping sx={{ fontSize: 20 }} />
    case 'Received': return <Check sx={{ fontSize: 20 }} />
    case 'Cancelled': return <Cancel sx={{ fontSize: 20 }} />
    default: return <ShoppingCart sx={{ fontSize: 20 }} />
  }
}

const PurchaseOrders = () => {
  const { user } = useSelector((state) => state.auth)
  
  // ✅ HOSPITAL_ADMIN - Access Denied
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Purchase Orders." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  // ✅ PERMISSIONS
  const canCreate = isEngineer || isSuperAdmin
  const canEdit = isEngineer || isSuperAdmin
  const canDelete = isSuperAdmin
  const canApprove = isSuperAdmin
  const canView = isEngineer || isSuperAdmin

  const [orders, setOrders] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    hospital_id: ''
  })
  
  const [itemsList, setItemsList] = useState([
    { id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }
  ])
  const [itemIdCounter, setItemIdCounter] = useState(2)

  const [formData, setFormData] = useState({
    hospital_id: '',
    vendor_name: '',
    vendor_contact: '',
    vendor_email: '',
    vendor_address: '',
    po_number: '',
    order_date: '',
    delivery_date: '',
    total_amount: '',
    notes: '',
    status: 'Draft',
    approved_by: '',
    documents: ''
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
    if (order && !canEdit) {
      toast.error('You do not have permission to edit purchase orders')
      return
    }
    
    if (order) {
      setEditingOrder(order)
      setFormData({
        hospital_id: order.hospital_id || '',
        vendor_name: order.vendor_name || '',
        vendor_contact: order.vendor_contact || '',
        vendor_email: order.vendor_email || '',
        vendor_address: order.vendor_address || '',
        po_number: order.po_number || '',
        order_date: order.order_date || '',
        delivery_date: order.delivery_date || '',
        total_amount: order.total_amount || '',
        notes: order.notes || '',
        status: order.status || 'Draft',
        approved_by: order.approved_by || '',
        documents: order.documents || ''
      })
      if (order.items && order.items.length > 0) {
        setItemsList(order.items.map((item, index) => ({
          id: index + 1,
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: item.total || 0
        })))
        setItemIdCounter(order.items.length + 1)
      } else {
        setItemsList([{ id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }])
        setItemIdCounter(2)
      }
    } else {
      setEditingOrder(null)
      setFormData({
        hospital_id: '',
        vendor_name: '',
        vendor_contact: '',
        vendor_email: '',
        vendor_address: '',
        po_number: `PO-${Date.now().toString().slice(-8)}`,
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        total_amount: '',
        notes: '',
        status: 'Draft',
        approved_by: '',
        documents: ''
      })
      setItemsList([{ id: 1, description: '', quantity: 1, unit_price: 0, total: 0 }])
      setItemIdCounter(2)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingOrder(null)
  }

  const handleView = (order) => {
    if (!canView) {
      toast.error('You do not have permission to view purchase orders')
      return
    }
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

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...itemsList]
    updatedItems[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = (parseFloat(updatedItems[index].quantity) || 0) * (parseFloat(updatedItems[index].unit_price) || 0)
    }
    setItemsList(updatedItems)
  }

  const addItem = () => {
    setItemsList([...itemsList, { id: itemIdCounter, description: '', quantity: 1, unit_price: 0, total: 0 }])
    setItemIdCounter(itemIdCounter + 1)
  }

  const removeItem = (index) => {
    if (itemsList.length > 1) {
      const updatedItems = itemsList.filter((_, i) => i !== index)
      setItemsList(updatedItems)
    } else {
      toast.warning('At least one item is required')
    }
  }

  const calculateTotal = () => {
    return itemsList.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
  }

  const handleSubmit = async () => {
    try {
      console.log('📦 Submitting purchase order:', formData);

      if (!formData.hospital_id) {
        toast.error('Please select a hospital');
        return;
      }
      if (!formData.vendor_name || formData.vendor_name.trim() === '') {
        toast.error('Vendor name is required');
        return;
      }
      if (!formData.po_number || formData.po_number.trim() === '') {
        toast.error('PO number is required');
        return;
      }

      const items = itemsList
        .filter(item => item.description && item.description.trim() !== '')
        .map(item => ({
          description: item.description.trim(),
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          total: parseFloat(item.total) || 0
        }));

      const submitData = {
        hospital_id: parseInt(formData.hospital_id),
        vendor_name: formData.vendor_name.trim(),
        po_number: formData.po_number.trim(),
        order_date: formData.order_date || null,
        delivery_date: formData.delivery_date || null,
        total_amount: calculateTotal(),
        notes: formData.notes || '',
        status: formData.status || 'Draft',
        items: items,
        documents: formData.documents || ''
      };

      console.log('📤 Submitting data:', submitData);

      let response;
      if (editingOrder) {
        response = await purchaseOrderService.update(editingOrder.id, submitData);
        toast.success('Purchase order updated successfully');
      } else {
        response = await purchaseOrderService.create(submitData);
        toast.success('Purchase order created successfully');
      }

      console.log('✅ Response:', response.data);
      fetchOrders();
      handleCloseDialog();

    } catch (error) {
      console.error('❌ Submit error:', error);
      console.error('❌ Response:', error.response?.data);
      
      const errorMsg = error.response?.data?.message || error.message || 'Operation failed';
      toast.error(errorMsg);
    }
  }

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('Only Super Admin can delete purchase orders')
      return
    }
    
    const order = orders.find(o => o.id === id)
    if (!order) {
      toast.error('Order not found')
      return
    }
    
    if (order.status !== 'Draft') {
      toast.error('Only Draft orders can be deleted')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete purchase order ${order.po_number}?`)) {
      try {
        await purchaseOrderService.delete(id)
        toast.success('Purchase order deleted successfully')
        fetchOrders()
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error.response?.data?.message || 'Failed to delete purchase order')
      }
    }
  }

  const handleApprove = async (id) => {
    if (!canApprove) {
      toast.error('Only Super Admin can approve orders')
      return
    }
    
    try {
      const order = orders.find(o => o.id === id)
      if (!order) {
        toast.error('Order not found')
        return
      }

      if (order.status !== 'Pending Approval') {
        toast.error(`Cannot approve order with status '${order.status}'. Only 'Pending Approval' orders can be approved.`)
        return
      }

      console.log('📤 Approving order:', id);
      
      const response = await purchaseOrderService.update(id, { status: 'Approved' });
      
      console.log('✅ Approve response:', response.data);
      toast.success('Purchase order approved');
      fetchOrders();
      handleCloseView();
    } catch (error) {
      console.error('❌ Approve error:', error)
      toast.error(error.response?.data?.message || 'Failed to approve order');
    }
  }

  const handleReject = async (id) => {
    if (!canApprove) {
      toast.error('Only Super Admin can reject orders')
      return
    }
    
    try {
      const order = orders.find(o => o.id === id)
      if (!order) {
        toast.error('Order not found')
        return
      }

      if (order.status !== 'Pending Approval') {
        toast.error(`Cannot reject order with status '${order.status}'. Only 'Pending Approval' orders can be rejected.`)
        return
      }

      console.log('📤 Rejecting order:', id);
      
      const response = await purchaseOrderService.update(id, { status: 'Cancelled' });
      
      console.log('✅ Reject response:', response.data);
      toast.success('Purchase order cancelled');
      fetchOrders();
      handleCloseView();
    } catch (error) {
      console.error('❌ Reject error:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const order = orders.find(o => o.id === id)
      if (!order) {
        toast.error('Order not found')
        return
      }

      const allowedTransitions = {
        'Draft': ['Pending Approval'],
        'Pending Approval': ['Approved', 'Cancelled'],
        'Approved': ['Ordered'],
        'Ordered': ['Received'],
        'Received': [],
        'Cancelled': []
      }

      if (!allowedTransitions[order.status]?.includes(newStatus)) {
        toast.error(`Cannot change status from '${order.status}' to '${newStatus}'`)
        return
      }

      if ((newStatus === 'Approved' || newStatus === 'Cancelled') && !canApprove) {
        toast.error('Only Super Admin can approve or cancel orders')
        return
      }

      console.log('📤 Updating order status:', id, '->', newStatus);
      
      const response = await purchaseOrderService.update(id, { status: newStatus });
      
      console.log('✅ Status update response:', response.data);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      handleCloseView();
    } catch (error) {
      console.error('❌ Status update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  }

  const handlePrint = () => {
    if (!viewingOrder) {
      toast.error('No order selected to print')
      return
    }

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        toast.error('Please allow popups for printing')
        return
      }

      const orderDate = safeFormatDate(viewingOrder.order_date)
      const deliveryDate = safeFormatDate(viewingOrder.delivery_date)

      const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order ${viewingOrder.po_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #0B5FA5; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #0B5FA5; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .po-number { text-align: right; font-size: 18px; font-weight: bold; color: #0B5FA5; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; margin-bottom: 20px; }
          .info-item { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-item .label { font-weight: 600; min-width: 120px; color: #666; }
          .info-item .value { color: #333; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${getStatusColor(viewingOrder.status)}; color: white; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #0B5FA5; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: 600; font-size: 16px; }
          .total-row td { border-top: 2px solid #0B5FA5; padding-top: 12px; }
          .total-amount { font-size: 18px; color: #0B5FA5; }
          .notes { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          .documents { margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PAEC Equipment Management Portal</h1>
          <p>Purchase Order</p>
        </div>
        <div class="po-number">
          ${viewingOrder.po_number || 'N/A'}
          <span class="status-badge" style="margin-left: 15px;">${viewingOrder.status || 'Draft'}</span>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="label">Hospital:</span><span class="value">${viewingOrder.hospital_name || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Vendor:</span><span class="value">${viewingOrder.vendor_name || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Order Date:</span><span class="value">${orderDate}</span></div>
          <div class="info-item"><span class="label">Delivery Date:</span><span class="value">${deliveryDate}</span></div>
          ${viewingOrder.vendor_contact ? `<div class="info-item"><span class="label">Contact Person:</span><span class="value">${viewingOrder.vendor_contact}</span></div>` : ''}
          ${viewingOrder.vendor_email ? `<div class="info-item"><span class="label">Email:</span><span class="value">${viewingOrder.vendor_email}</span></div>` : ''}
          ${viewingOrder.vendor_address ? `<div class="info-item" style="grid-column: span 2;"><span class="label">Address:</span><span class="value">${viewingOrder.vendor_address}</span></div>` : ''}
        </div>
        <h3 style="margin: 20px 0 10px 0; color: #0B5FA5;">Order Items</h3>
        <table>
          <thead><tr><th>#</th><th>Description</th><th style="text-align: center;">Quantity</th><th style="text-align: right;">Unit Price</th><th style="text-align: right;">Total</th></tr></thead>
          <tbody>
            ${viewingOrder.items && viewingOrder.items.length > 0 ? viewingOrder.items.map((item, index) => `
            <tr><td>${index + 1}</td><td>${item.description || 'N/A'}</td><td style="text-align: center;">${item.quantity || 0}</td><td style="text-align: right;">$${safeToFixed(item.unit_price)}</td><td style="text-align: right;">$${safeToFixed(item.total)}</td></tr>
            `).join('') : `<tr><td colspan="5" style="text-align: center; color: #999;">No items</td></tr>`}
            <tr class="total-row"><td colspan="4" style="text-align: right;">Total Amount:</td><td style="text-align: right;"><span class="total-amount">$${safeToFixed(viewingOrder.total_amount)}</span></td></tr>
          </tbody>
        </table>
        ${viewingOrder.notes ? `<div class="notes"><strong>Notes:</strong><p style="margin-top: 5px;">${viewingOrder.notes}</p></div>` : ''}
        ${viewingOrder.documents && viewingOrder.documents.split(',').filter(Boolean).length > 0 ? `
        <div class="documents"><strong>Attached Documents:</strong><ul style="margin-top: 5px; list-style: none; padding: 0;">
          ${viewingOrder.documents.split(',').filter(Boolean).map(url => `<li style="padding: 2px 0;">📎 ${url.split('/').pop()}</li>`).join('')}
        </ul></div>` : ''}
        <div class="footer">Generated on ${new Date().toLocaleString()}<br>This is a system-generated document from PAEC Equipment Management Portal</div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);<\/script>
      </body>
      </html>
      `

      printWindow.document.write(content)
      printWindow.document.close()

    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to print: ' + error.message)
    }
  }

  const getStatusSteps = () => {
    return ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Received']
  }

  const getCurrentStep = (status) => {
    const steps = getStatusSteps()
    const index = steps.indexOf(status)
    return index !== -1 ? index : 0
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filters.status || order.status === filters.status
    const matchesHospital = !filters.hospital_id || order.hospital_id === parseInt(filters.hospital_id)
    return matchesSearch && matchesStatus && matchesHospital
  })

  // Stats
  const totalOrders = orders.length
  const draftOrders = orders.filter(o => o.status === 'Draft').length
  const pendingOrders = orders.filter(o => o.status === 'Pending Approval').length
  const completedOrders = orders.filter(o => o.status === 'Approved' || o.status === 'Received' || o.status === 'Ordered').length
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Box>
      {/* ✅ Header - Same as Service Documentation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2C3E50' }}>
            Purchase Orders
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchOrders}
            size="small"
          >
            Refresh
          </Button>
          {canCreate && (
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
          )}
        </Box>
      </Box>

      {/* ✅ Stats Cards - Same as Service Documentation */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} color="#0B5FA5">
              {totalOrders}
            </Typography>
            <Typography variant="body2" color="textSecondary">Total Orders</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#e3f2fd' }}>
            <Typography variant="h4" fontWeight={700} color="#2196f3">
              {draftOrders}
            </Typography>
            <Typography variant="body2" color="textSecondary">Draft</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#fff3e0' }}>
            <Typography variant="h4" fontWeight={700} color="#ff9800">
              {pendingOrders}
            </Typography>
            <Typography variant="body2" color="textSecondary">Pending Approval</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#e8f5e9' }}>
            <Typography variant="h4" fontWeight={700} color="#4caf50">
              {completedOrders}
            </Typography>
            <Typography variant="body2" color="textSecondary">Completed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#ffebee' }}>
            <Typography variant="h4" fontWeight={700} color="#dc3545">
              {cancelledOrders}
            </Typography>
            <Typography variant="body2" color="textSecondary">Cancelled</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ✅ Search & Filter - Same as Service Documentation */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Hospital</InputLabel>
            <Select
              value={filters.hospital_id}
              onChange={(e) => setFilters({ ...filters, hospital_id: e.target.value })}
              label="Hospital"
            >
              <MenuItem value="">All Hospitals</MenuItem>
              {hospitals.map(h => (
                <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* ✅ Cards View - Same as Service Documentation */}
      <Grid container spacing={3}>
        {filteredOrders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card sx={{ 
              borderRadius: 2, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: getStatusColor(order.status),
                    width: 40,
                    height: 40,
                    mr: 2
                  }}>
                    {getStatusIcon(order.status)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {order.po_number}
                    </Typography>
                    <Chip
                      label={order.status}
                      size="small"
                      color={
                        order.status === 'Approved' || order.status === 'Received' ? 'success' :
                        order.status === 'Pending Approval' ? 'warning' :
                        order.status === 'Draft' ? 'default' :
                        order.status === 'Ordered' ? 'info' :
                        order.status === 'Cancelled' ? 'error' : 'default'
                      }
                      sx={{ height: 22, fontSize: '11px' }}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" color="textSecondary">
                  <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Vendor: {order.vendor_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <ShoppingCart sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Hospital: {order.hospital_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <Receipt sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Amount: ${safeToFixed(order.total_amount)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <Description sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  Items: {order.items?.length || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  {order.order_date ? `Ordered: ${new Date(order.order_date).toLocaleDateString()}` : ''}
                  {order.delivery_date ? ` | Delivery: ${new Date(order.delivery_date).toLocaleDateString()}` : ''}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Tooltip title="View Details">
                  <Button 
                    size="small" 
                    startIcon={<Visibility />} 
                    color="primary"
                    onClick={() => handleView(order)}
                  >
                    View
                  </Button>
                </Tooltip>
                
                {canEdit && order.status === 'Draft' && (
                  <Tooltip title="Edit">
                    <IconButton 
                      size="small" 
                      color="info" 
                      onClick={() => handleOpenDialog(order)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {canDelete && order.status === 'Draft' && (
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(order.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                {canApprove && order.status === 'Pending Approval' && (
                  <>
                    <Tooltip title="Approve">
                      <IconButton 
                        size="small" 
                        color="success" 
                        onClick={() => handleApprove(order.id)}
                      >
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleReject(order.id)}
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                
                {(order.status === 'Approved' || order.status === 'Ordered' || order.status === 'Received') && (
                  <Tooltip title="Print">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => {
                        setViewingOrder(order)
                        setTimeout(handlePrint, 100)
                      }}
                    >
                      <Print fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ✅ Empty State - Same as Service Documentation */}
      {filteredOrders.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <ShoppingCart sx={{ fontSize: 64, color: '#6c757d' }} />
          <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
            No purchase orders found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Try adjusting your search or filters
          </Typography>
          {canCreate && (
            <Button              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ mt: 2 }}
            >
              Create First Purchase Order
            </Button>
          )}
        </Paper>
      )}

      {/* ✅ Add/Edit Dialog - Same as Service Documentation */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart sx={{ color: 'white' }} />
            <Typography variant="h6" fontWeight={600}>
              {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
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
                disabled={editingOrder}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  <Business sx={{ fontSize: 16, mr: 1 }} />
                  Vendor Details
                </Typography>
              </Divider>
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
                label="Vendor Contact Person"
                name="vendor_contact"
                value={formData.vendor_contact}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Email"
                name="vendor_email"
                type="email"
                value={formData.vendor_email}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Phone"
                name="vendor_phone"
                value={formData.vendor_phone}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vendor Address"
                name="vendor_address"
                value={formData.vendor_address}
                onChange={handleFormChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  <Receipt sx={{ fontSize: 16, mr: 1 }} />
                  Order Details
                </Typography>
              </Divider>
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
                label="Approved By"
                name="approved_by"
                value={formData.approved_by}
                onChange={handleFormChange}
                placeholder="Name of approver"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  <ShoppingCart sx={{ fontSize: 16, mr: 1 }} />
                  Order Items
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {itemsList.map((item, index) => (
                  <Grid container spacing={1} key={item.id} sx={{ mb: 1 }}>
                    <Grid item xs={4}>
                      <TextField
                        size="small"
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        size="small"
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        fullWidth
                        InputProps={{ inputProps: { min: 1, step: 1 } }}
                      />
                    </Grid>
                    <Grid item xs={2.5}>
                      <TextField
                        size="small"
                        label="Unit Price ($)"
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        fullWidth
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      />
                    </Grid>
                    <Grid item xs={2.5}>
                      <TextField
                        size="small"
                        label="Total ($)"
                        value={item.total.toFixed(2)}
                        fullWidth
                        disabled
                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f5f5f5' } }}
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => removeItem(index)}
                        disabled={itemsList.length <= 1}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button 
                  size="small" 
                  startIcon={<Add />} 
                  onClick={addItem}
                  sx={{ mt: 1 }}
                >
                  Add Item
                </Button>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Total Amount: ${calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
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
                placeholder="Additional notes or special instructions..."
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                <AttachFile sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                Documents (Quotation, Invoice, etc.)
              </Typography>
              
              <FileUpload
                endpoint="/upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                multiple={true}
                label="Click to upload documents"
                maxFiles={5}
                maxSize={20}
                showPreview={true}
                onUploadComplete={(files) => {
                  console.log('📄 Documents uploaded:', files)
                  const urls = files.map(f => f.url || f.fileUrl).filter(Boolean)
                  const currentFiles = formData.documents ? formData.documents.split(',') : []
                  const updatedFiles = [...currentFiles, ...urls]
                  setFormData(prev => ({
                    ...prev,
                    documents: updatedFiles.join(',')
                  }))
                  toast.success(`${files.length} document(s) uploaded successfully`)
                }}
                onUploadError={(error) => toast.error('Upload failed: ' + error)}
                onDelete={(file) => {
                  const currentFiles = formData.documents?.split(',') || []
                  const updatedFiles = currentFiles.filter(f => f !== file.url)
                  setFormData(prev => ({
                    ...prev,
                    documents: updatedFiles.join(',')
                  }))
                  toast.info('Document removed')
                }}
                existingFiles={formData.documents ? formData.documents.split(',').filter(Boolean).map(url => ({
                  url: url,
                  name: url.split('/').pop(),
                  type: 'document'
                })) : []}
              />
              
              {formData.documents && formData.documents.split(',').filter(Boolean).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    {formData.documents.split(',').filter(Boolean).length} document(s) attached
                  </Typography>
                </Box>
              )}
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

      {/* ✅ View Dialog - Same as Service Documentation */}
      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0B5FA5', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Purchase Order Details
            </Typography>
            <IconButton onClick={handleCloseView} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingOrder && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {viewingOrder.po_number}
                  </Typography>
                  <Chip 
                    label={viewingOrder.status} 
                    color={
                      viewingOrder.status === 'Approved' || viewingOrder.status === 'Received' ? 'success' :
                      viewingOrder.status === 'Pending Approval' ? 'warning' :
                      viewingOrder.status === 'Draft' ? 'default' :
                      viewingOrder.status === 'Ordered' ? 'info' :
                      viewingOrder.status === 'Cancelled' ? 'error' : 'default'
                    }
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                  Order Status Timeline
                </Typography>
                <Stepper activeStep={getCurrentStep(viewingOrder.status)} orientation="vertical">
                  {getStatusSteps().map((step, index) => (
                    <Step key={step}>
                      <StepLabel 
                        StepIconComponent={({ active, completed }) => {
                          const colors = {
                            'Draft': '#9e9e9e',
                            'Pending Approval': '#ff9800',
                            'Approved': '#4caf50',
                            'Ordered': '#2196f3',
                            'Received': '#4caf50'
                          }
                          return (
                            <Avatar sx={{ 
                              bgcolor: active || completed ? colors[step] : '#e0e0e0',
                              width: 24, 
                              height: 24,
                              fontSize: 14
                            }}>
                              {index + 1}
                            </Avatar>
                          )
                        }}
                      >
                        {step}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" color="textSecondary">
                          {step === viewingOrder.status ? 'Current status' : 
                           getCurrentStep(viewingOrder.status) > index ? 'Completed' : 'Pending'}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Hospital</Typography>
                <Typography variant="body1" fontWeight={500}>{viewingOrder.hospital_name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">Vendor</Typography>
                <Typography variant="body1" fontWeight={500}>{viewingOrder.vendor_name}</Typography>
              </Grid>
              {viewingOrder.vendor_contact && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Vendor Contact</Typography>
                  <Typography variant="body1">{viewingOrder.vendor_contact}</Typography>
                </Grid>
              )}
              {viewingOrder.vendor_email && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Vendor Email</Typography>
                  <Typography variant="body1">{viewingOrder.vendor_email}</Typography>
                </Grid>
              )}
              {viewingOrder.vendor_address && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Vendor Address</Typography>
                  <Typography variant="body1">{viewingOrder.vendor_address}</Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Order Date</Typography>
                <Typography variant="body1">
                  {viewingOrder.order_date ? new Date(viewingOrder.order_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Delivery Date</Typography>
                <Typography variant="body1">
                  {viewingOrder.delivery_date ? new Date(viewingOrder.delivery_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                <Typography variant="body1" fontWeight={600} color="#0B5FA5">
                  {viewingOrder.total_amount ? `$${parseFloat(viewingOrder.total_amount).toFixed(2)}` : '-'}
                </Typography>
              </Grid>

              {viewingOrder.items && viewingOrder.items.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                      Order Items
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="center">Quantity</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {viewingOrder.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right">${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                              <TableCell align="right">${parseFloat(item.total).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </>
              )}

              {viewingOrder.notes && (
                <Grid item xs={12}>
                  <Divider />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Notes</Typography>
                  <Typography variant="body1">{viewingOrder.notes}</Typography>
                </Grid>
              )}

              {viewingOrder.documents && viewingOrder.documents.split(',').filter(Boolean).length > 0 && (
                <Grid item xs={12}>
                  <Divider />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                    <AttachFile sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                    Attached Documents ({viewingOrder.documents.split(',').filter(Boolean).length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {viewingOrder.documents.split(',').filter(Boolean).map((url, index) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                      const isPDF = url.match(/\.(pdf)$/i)
                      
                      return (
                        <Button
                          key={index}
                          variant="outlined"
                          size="small"
                          startIcon={isImage ? <Image /> : isPDF ? <PictureAsPdf /> : <Description />}
                          href={getFullUrl(url)}
                          target="_blank"
                          sx={{ textTransform: 'none' }}
                        >
                          {url.split('/').pop().substring(0, 20)}
                        </Button>
                      )
                    })}
                  </Box>
                </Grid>
              )}

              {viewingOrder.status !== 'Cancelled' && viewingOrder.status !== 'Received' && canEdit && (
                <Grid item xs={12}>
                  <Divider />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                    Update Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewingOrder.status === 'Draft' && canCreate && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="warning"
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Pending Approval')}
                      >
                        Submit for Approval
                      </Button>
                    )}
                    {viewingOrder.status === 'Pending Approval' && canApprove && (
                      <>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => handleApprove(viewingOrder.id)}
                          startIcon={<CheckCircle />}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="error"
                          onClick={() => handleReject(viewingOrder.id)}
                          startIcon={<Cancel />}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {viewingOrder.status === 'Pending Approval' && !canApprove && (
                      <Alert severity="info" sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body2">
                          <strong>Waiting for Super Admin approval.</strong> Only Super Admin can approve or reject orders.
                        </Typography>
                      </Alert>
                    )}
                    {viewingOrder.status === 'Approved' && canEdit && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Ordered')}
                        startIcon={<LocalShipping />}
                      >
                        Mark as Ordered
                      </Button>
                    )}
                    {viewingOrder.status === 'Ordered' && canEdit && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Received')}
                        startIcon={<Check />}
                      >
                        Mark as Received
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}

              {viewingOrder.status === 'Cancelled' && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>This order has been cancelled.</strong> No further actions can be taken.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {viewingOrder.status === 'Received' && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Order completed!</strong> All items have been received.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseView}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<Print />} 
            sx={{ bgcolor: '#0B5FA5' }}
            onClick={handlePrint}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PurchaseOrders