// src/pages/PurchaseOrders.jsx
// ✅ DARK NAVY + LIGHT CYAN THEME - Matching Sidebar

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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Fade,
  Grow,
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
  Info,
  Verified,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from '@mui/icons-material'
import { purchaseOrderService, hospitalService } from '../api/services'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import AccessDenied from '../components/Auth/AccessDenied'
import FileUpload from '../components/FileUpload'

// ============================================================
// ✅ DARK NAVY + LIGHT CYAN THEME COLORS
// ============================================================
const colors = {
  // Dark Navy Base
  darkNavy: '#0F172A',
  darkNavyLight: '#1E293B',
  darkNavyDark: '#0A0F1E',
  darkNavyHover: '#1E3A5F',
  
  // Light Cyan Accents
  lightCyan: '#67E8F9',
  lightCyanBright: '#A5F3FC',
  lightCyanDark: '#22D3EE',
  lightCyanGlow: 'rgba(103, 232, 249, 0.15)',
  lightCyanGlowStrong: 'rgba(103, 232, 249, 0.3)',
  
  // Gold accent (keeping PAEC branding)
  accentGold: '#C9A227',
  goldLight: '#E8C84A',
  
  // Text
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  textLight: '#CBD5E1',
  cyanText: '#67E8F9',
  darkText: '#0F172A',
  lightText: '#64748B',
  
  // Cards/Background
  cardBg: '#FFFFFF',
  borderColor: 'rgba(103, 232, 249, 0.1)',
  shadowColor: 'rgba(15, 23, 42, 0.08)',
  mainBg: '#F1F5F9',
  
  // Status colors
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}

// ============================================================
// ✅ ENHANCED STAT CARD COMPONENT
// ============================================================
const StatCard = ({ title, value, icon, color, bgColor, subtext }) => (
  <Grow in timeout={300}>
    <Card sx={{ 
      borderRadius: 3, 
      border: `1px solid ${colors.borderColor}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 30px ${colors.lightCyanGlow}`,
        borderColor: colors.lightCyan,
      }
    }}>
      <CardContent sx={{ textAlign: 'center', py: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mb: 1.5
        }}>
          <Avatar sx={{ 
            bgcolor: bgColor || color || colors.darkNavy,
            width: 48,
            height: 48,
            boxShadow: `0 4px 16px ${color || colors.darkNavy}44`
          }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" sx={{ color: colors.darkNavy, fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.lightText, fontWeight: 500 }}>
          {title}
        </Typography>
        {subtext && (
          <Typography variant="caption" sx={{ color: colors.lightText, display: 'block', mt: 0.5 }}>
            {subtext}
          </Typography>
        )}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color || colors.darkNavy}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      </CardContent>
    </Card>
  </Grow>
)

// ============================================================
// ✅ ENHANCED ORDER CARD - DARK NAVY + CYAN
// ============================================================
const OrderCard = ({ order, onView, onEdit, onDelete, onApprove, onReject, onPrint, canEdit, canDelete, canApprove }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const getStatusColor = (status) => {
    const statusColors = {
      'Draft': colors.lightText,
      'Pending Approval': colors.warning,
      'Approved': colors.success,
      'Ordered': colors.info,
      'Received': colors.success,
      'Cancelled': colors.error
    }
    return statusColors[status] || colors.lightText
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

  return (
    <Grow in timeout={300}>
      <Card
        sx={{
          borderRadius: 3,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${colors.borderColor}`,
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          boxShadow: isHovered ? `0 12px 40px ${colors.lightCyanGlow}` : '0 2px 12px rgba(0,0,0,0.04)',
          '&:hover': {
            borderColor: colors.lightCyan,
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Gradient Bar - Dark Navy to Cyan */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${getStatusColor(order.status)}, ${colors.lightCyan})`,
        }} />
        
        {/* Decorative Background */}
        <Box sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${getStatusColor(order.status)}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Order Icon with Badge */}
            <Badge
              badgeContent={order.items?.length || 0}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: colors.lightCyan,
                  color: colors.darkNavy,
                  fontWeight: 700,
                  fontSize: '10px',
                  height: 20,
                  minWidth: 20,
                  border: `2px solid ${colors.white}`,
                }
              }}
            >
              <Avatar sx={{ 
                bgcolor: `${getStatusColor(order.status)}15`,
                width: 56,
                height: 56,
                border: `2px solid ${getStatusColor(order.status)}30`,
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05) rotate(-5deg)' : 'scale(1)',
              }}>
                {getStatusIcon(order.status)}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: colors.darkNavy, mb: 0.5, fontSize: '1rem' }} noWrap>
                {order.po_number}
              </Typography>
              <Chip
                label={order.status}
                size="small"
                sx={{
                  bgcolor: getStatusColor(order.status),
                  color: 'white',
                  fontWeight: 600,
                  height: 22,
                  fontSize: '10px',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          </Box>

          {/* Details Section */}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: colors.lightText }}>
              <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Vendor: <strong style={{ color: colors.darkNavy }}>{order.vendor_name}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: colors.lightText }}>
              <ShoppingCart sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Hospital: <span style={{ color: colors.darkNavy }}>{order.hospital_name}</span>
            </Typography>
            <Typography variant="body2" sx={{ color: colors.darkNavy }}>
              <Receipt sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Amount: <strong style={{ color: colors.lightCyanDark }}>${safeToFixed(order.total_amount)}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: colors.lightText }}>
              <Description sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
              Items: {order.items?.length || 0}
              {order.order_date && ` • Ordered: ${new Date(order.order_date).toLocaleDateString()}`}
              {order.delivery_date && ` • Delivery: ${new Date(order.delivery_date).toLocaleDateString()}`}
            </Typography>
          </Box>

          {/* Click Hint */}
          <Box sx={{ 
            mt: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            opacity: isHovered ? 1 : 0.4,
            transition: 'opacity 0.3s ease',
          }}>
            <Typography variant="caption" sx={{ color: colors.lightText, fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Click to view details
            </Typography>
            <ChevronRight sx={{ fontSize: 16, color: colors.lightText }} />
          </Box>
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              startIcon={<Visibility />} 
              onClick={() => onView(order)}
              sx={{ 
                color: colors.darkNavy,
                '&:hover': { color: colors.lightCyanDark },
                fontSize: '12px',
                textTransform: 'none',
              }}
            >
              View
            </Button>
          </Tooltip>
          
          {canEdit && order.status === 'Draft' && (
            <Tooltip title="Edit">
              <IconButton 
                size="small" 
                onClick={() => onEdit(order)}
                sx={{ 
                  color: colors.darkNavy, 
                  '&:hover': { 
                    color: colors.lightCyanDark,
                    backgroundColor: 'rgba(103, 232, 249, 0.08)'
                  } 
                }}
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
                onClick={() => onDelete(order.id)}
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
                  onClick={() => onApprove(order.id)}
                  sx={{ 
                    color: colors.success, 
                    '&:hover': { 
                      color: colors.lightCyanDark,
                      backgroundColor: 'rgba(103, 232, 249, 0.08)'
                    } 
                  }}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => onReject(order.id)}
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
                onClick={() => onPrint(order)}
                sx={{ 
                  color: colors.darkNavy, 
                  '&:hover': { 
                    color: colors.lightCyanDark,
                    backgroundColor: 'rgba(103, 232, 249, 0.08)'
                  } 
                }}
              >
                <Print fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </CardActions>
      </Card>
    </Grow>
  )
}

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================
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

// ============================================================
// ✅ MAIN COMPONENT
// ============================================================
const PurchaseOrders = () => {
  const { user } = useSelector((state) => state.auth)
  
  if (user?.role === 'HOSPITAL_ADMIN') {
    return <AccessDenied message="Hospital Administrators cannot access Purchase Orders." />
  }
  
  const isEngineer = user?.role === 'ENGINEER'
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
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

  const handlePrint = (order) => {
    if (!order) {
      toast.error('No order selected to print')
      return
    }

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        toast.error('Please allow popups for printing')
        return
      }

      const orderDate = safeFormatDate(order.order_date)
      const deliveryDate = safeFormatDate(order.delivery_date)

      const getStatusColor = (status) => {
        const colors_map = {
          'Draft': '#6c757d',
          'Pending Approval': '#ff9800',
          'Approved': '#28a745',
          'Ordered': '#2196f3',
          'Received': '#4caf50',
          'Cancelled': '#dc3545'
        }
        return colors_map[status] || '#6c757d'
      }

      const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order ${order.po_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #0F172A; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #0F172A; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .po-number { text-align: right; font-size: 18px; font-weight: bold; color: #0F172A; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; margin-bottom: 20px; }
          .info-item { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-item .label { font-weight: 600; min-width: 120px; color: #666; }
          .info-item .value { color: #333; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${getStatusColor(order.status)}; color: white; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #0F172A; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; }
          .total-row { font-weight: 600; font-size: 16px; }
          .total-row td { border-top: 2px solid #0F172A; padding-top: 12px; }
          .total-amount { font-size: 18px; color: #0F172A; }
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
          ${order.po_number || 'N/A'}
          <span class="status-badge" style="margin-left: 15px;">${order.status || 'Draft'}</span>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="label">Hospital:</span><span class="value">${order.hospital_name || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Vendor:</span><span class="value">${order.vendor_name || 'N/A'}</span></div>
          <div class="info-item"><span class="label">Order Date:</span><span class="value">${orderDate}</span></div>
          <div class="info-item"><span class="label">Delivery Date:</span><span class="value">${deliveryDate}</span></div>
          ${order.vendor_contact ? `<div class="info-item"><span class="label">Contact Person:</span><span class="value">${order.vendor_contact}</span></div>` : ''}
          ${order.vendor_email ? `<div class="info-item"><span class="label">Email:</span><span class="value">${order.vendor_email}</span></div>` : ''}
          ${order.vendor_address ? `<div class="info-item" style="grid-column: span 2;"><span class="label">Address:</span><span class="value">${order.vendor_address}</span></div>` : ''}
        </div>
        <h3 style="margin: 20px 0 10px 0; color: #0F172A;">Order Items</h3>
        <table>
          <thead><tr><th>#</th><th>Description</th><th style="text-align: center;">Quantity</th><th style="text-align: right;">Unit Price</th><th style="text-align: right;">Total</th></tr></thead>
          <tbody>
            ${order.items && order.items.length > 0 ? order.items.map((item, index) => `
            <tr><td>${index + 1}</td><td>${item.description || 'N/A'}</td><td style="text-align: center;">${item.quantity || 0}</td><td style="text-align: right;">$${safeToFixed(item.unit_price)}</td><td style="text-align: right;">$${safeToFixed(item.total)}</td></tr>
            `).join('') : `<tr><td colspan="5" style="text-align: center; color: #999;">No items</td></tr>`}
            <tr class="total-row"><td colspan="4" style="text-align: right;">Total Amount:</td><td style="text-align: right;"><span class="total-amount">$${safeToFixed(order.total_amount)}</span></td></tr>
          </tbody>
        </table>
        ${order.notes ? `<div class="notes"><strong>Notes:</strong><p style="margin-top: 5px;">${order.notes}</p></div>` : ''}
        ${order.documents && order.documents.split(',').filter(Boolean).length > 0 ? `
        <div class="documents"><strong>Attached Documents:</strong><ul style="margin-top: 5px; list-style: none; padding: 0;">
          ${order.documents.split(',').filter(Boolean).map(url => `<li style="padding: 2px 0;">📎 ${url.split('/').pop()}</li>`).join('')}
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

  const totalOrders = orders.length
  const draftOrders = orders.filter(o => o.status === 'Draft').length
  const pendingOrders = orders.filter(o => o.status === 'Pending Approval').length
  const completedOrders = orders.filter(o => o.status === 'Approved' || o.status === 'Received' || o.status === 'Ordered').length
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length

  if (loading) {
    return <LinearProgress sx={{ bgcolor: colors.borderColor, '& .MuiLinearProgress-bar': { bgcolor: colors.lightCyan } }} />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              color: colors.darkNavy,
              '&::after': {
                content: '""',
                display: 'block',
                width: '40px',
                height: '3px',
                background: `linear-gradient(90deg, ${colors.lightCyan}, ${colors.darkNavy})`,
                borderRadius: '2px',
                marginTop: '4px',
              }
            }}
          >
            Purchase Orders
          </Typography>
          <Chip 
            icon={<ShoppingCart sx={{ fontSize: 16 }} />}
            label={`${orders.length} Orders`}
            size="small"
            sx={{ 
              bgcolor: colors.darkNavy, 
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-icon': { color: colors.lightCyan }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchOrders}
            size="small"
            sx={{ 
              borderColor: colors.borderColor, 
              color: colors.darkNavy,
              '&:hover': { 
                borderColor: colors.lightCyan, 
                color: colors.lightCyanDark,
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              }
            }}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: colors.darkNavy,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
                },
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Create Purchase Order
            </Button>
          )}
        </Box>
      </Box>

      {/* Enhanced Stats Cards - DARK NAVY + CYAN */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2.4}>
          <StatCard 
            title="Total Orders" 
            value={totalOrders} 
            icon={<ShoppingCart sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.darkNavy}
            bgColor={colors.darkNavy}
            subtext="All purchase orders"
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard 
            title="Draft" 
            value={draftOrders} 
            icon={<Description sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.info}
            bgColor={colors.info}
            subtext="In progress"
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard 
            title="Pending Approval" 
            value={pendingOrders} 
            icon={<Info sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.warning}
            bgColor={colors.warning}
            subtext="Awaiting review"
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard 
            title="Completed" 
            value={completedOrders} 
            icon={<CheckCircle sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.success}
            bgColor={colors.success}
            subtext="Approved/Received"
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard 
            title="Cancelled" 
            value={cancelledOrders} 
            icon={<Cancel sx={{ fontSize: 24, color: 'white' }} />}
            color={colors.error}
            bgColor={colors.error}
            subtext="Cancelled orders"
          />
        </Grid>
      </Grid>

      {/* Search & Filter - CYAN THEMED */}
      <Paper sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        bgcolor: colors.cardBg,
      }}>
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
                  <Search sx={{ color: colors.lightText }} />
                </InputAdornment>
              ),
              sx: {
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }}
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
            <InputLabel sx={{ color: colors.lightText }}>Hospital</InputLabel>
            <Select
              value={filters.hospital_id}
              onChange={(e) => setFilters({ ...filters, hospital_id: e.target.value })}
              label="Hospital"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: colors.lightCyan },
                  '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                }
              }}
            >
              <MenuItem value="">All Hospitals</MenuItem>
              {hospitals.map(h => (
                <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Enhanced Order Cards Grid */}
      <Grid container spacing={3}>
        {filteredOrders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <OrderCard
              order={order}
              onView={handleView}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onReject={handleReject}
              onPrint={handlePrint}
              canEdit={canEdit}
              canDelete={canDelete}
              canApprove={canApprove}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty State - CYAN THEMED */}
      {filteredOrders.length === 0 && !loading && (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 2,
          border: `1px solid ${colors.borderColor}`
        }}>
          <ShoppingCart sx={{ fontSize: 64, color: colors.lightText }} />
          <Typography variant="h6" sx={{ color: colors.lightText, mt: 2 }}>
            No purchase orders found
          </Typography>
          <Typography variant="body2" sx={{ color: colors.lightText, mb: 2 }}>
            Try adjusting your search or filters
          </Typography>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                mt: 2,
                bgcolor: colors.darkNavy,
                '&:hover': { 
                  bgcolor: colors.darkNavyHover,
                  boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
                },
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Create First Purchase Order
            </Button>
          )}
        </Paper>
      )}

      {/* Add/Edit Dialog - DARK NAVY + CYAN */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
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
                <InputLabel sx={{ color: colors.lightText }}>Hospital</InputLabel>
                <Select
                  name="hospital_id"
                  value={formData.hospital_id}
                  onChange={handleFormChange}
                  label="Hospital"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText }}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Contact Person"
                name="vendor_contact"
                value={formData.vendor_contact}
                onChange={handleFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor Phone"
                name="vendor_phone"
                value={formData.vendor_phone}
                onChange={handleFormChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText }}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.lightText }}>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: colors.lightCyan },
                      '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                    }
                  }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: colors.borderColor }}>
                <Typography variant="caption" sx={{ color: colors.lightText }}>
                  <ShoppingCart sx={{ fontSize: 16, mr: 1 }} />
                  Order Items
                </Typography>
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderColor: colors.borderColor }}>
                {itemsList.map((item, index) => (
                  <Grid container spacing={1} key={item.id} sx={{ mb: 1 }}>
                    <Grid item xs={4}>
                      <TextField
                        size="small"
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          }
                        }}
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          }
                        }}
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={2.5}>
                      <TextField
                        size="small"
                        label="Total ($)"
                        value={item.total.toFixed(2)}
                        fullWidth
                        disabled
                        sx={{ 
                          '& .MuiInputBase-root': { bgcolor: colors.mainBg },
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: colors.lightCyan },
                            '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                          }
                        }}
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
                  sx={{ 
                    mt: 1,
                    color: colors.darkNavy,
                    '&:hover': { color: colors.lightCyanDark }
                  }}
                >
                  Add Item
                </Button>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: colors.darkNavy }}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': { borderColor: colors.lightCyan },
                    '&.Mui-focused fieldset': { borderColor: colors.lightCyanDark }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: colors.lightText }} gutterBottom>
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
                  <Typography variant="caption" sx={{ color: colors.lightText }}>
                    {formData.documents.split(',').filter(Boolean).length} document(s) attached
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              bgcolor: colors.darkNavy,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 20px ${colors.lightCyanGlowStrong}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            {editingOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog - DARK NAVY + CYAN */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseView} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.darkNavy, 
          color: 'white',
          borderRadius: '8px 8px 0 0',
        }}>
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
                  <Typography variant="h6" fontWeight={600} sx={{ color: colors.darkNavy }}>
                    {viewingOrder.po_number}
                  </Typography>
                  <Chip 
                    label={viewingOrder.status} 
                    sx={{
                      bgcolor: viewingOrder.status === 'Approved' || viewingOrder.status === 'Received' ? colors.success :
                               viewingOrder.status === 'Pending Approval' ? colors.warning :
                               viewingOrder.status === 'Draft' ? colors.lightText :
                               viewingOrder.status === 'Ordered' ? colors.info :
                               viewingOrder.status === 'Cancelled' ? colors.error : colors.lightText,
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mb: 2 }}>
                  Order Status Timeline
                </Typography>
                <Stepper activeStep={getCurrentStep(viewingOrder.status)} orientation="vertical">
                  {getStatusSteps().map((step, index) => (
                    <Step key={step}>
                      <StepLabel 
                        StepIconComponent={({ active, completed }) => {
                          const stepColors = {
                            'Draft': colors.lightText,
                            'Pending Approval': colors.warning,
                            'Approved': colors.success,
                            'Ordered': colors.info,
                            'Received': colors.success
                          }
                          return (
                            <Avatar sx={{ 
                              bgcolor: active || completed ? stepColors[step] : colors.borderColor,
                              width: 24, 
                              height: 24,
                              fontSize: 14,
                              color: 'white'
                            }}>
                              {index + 1}
                            </Avatar>
                          )
                        }}
                      >
                        {step}
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" sx={{ color: colors.lightText }}>
                          {step === viewingOrder.status ? 'Current status' : 
                           getCurrentStep(viewingOrder.status) > index ? 'Completed' : 'Pending'}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Hospital</Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                  {viewingOrder.hospital_name}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Vendor</Typography>
                <Typography variant="body1" fontWeight={500} sx={{ color: colors.darkNavy }}>
                  {viewingOrder.vendor_name}
                </Typography>
              </Grid>
              {viewingOrder.vendor_contact && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Vendor Contact</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                    {viewingOrder.vendor_contact}
                  </Typography>
                </Grid>
              )}
              {viewingOrder.vendor_email && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Vendor Email</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                    {viewingOrder.vendor_email}
                  </Typography>
                </Grid>
              )}
              {viewingOrder.vendor_address && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: colors.lightText }}>Vendor Address</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                    {viewingOrder.vendor_address}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ borderColor: colors.borderColor }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Order Date</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                  {viewingOrder.order_date ? new Date(viewingOrder.order_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Delivery Date</Typography>
                <Typography variant="body1" sx={{ color: colors.darkNavy }}>
                  {viewingOrder.delivery_date ? new Date(viewingOrder.delivery_date).toLocaleDateString() : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: colors.lightText }}>Total Amount</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: colors.lightCyanDark }}>
                  {viewingOrder.total_amount ? `$${parseFloat(viewingOrder.total_amount).toFixed(2)}` : '-'}
                </Typography>
              </Grid>

              {viewingOrder.items && viewingOrder.items.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ borderColor: colors.borderColor }} />
                    <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mt: 2, mb: 1 }}>
                      Order Items
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderColor: colors.borderColor }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: colors.mainBg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="center">Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="right">Unit Price</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: colors.darkNavy }} align="right">Total</TableCell>
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
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="body2" sx={{ color: colors.lightText, mt: 2 }}>Notes</Typography>
                  <Typography variant="body1" sx={{ color: colors.darkNavy }}>{viewingOrder.notes}</Typography>
                </Grid>
              )}

              {viewingOrder.documents && viewingOrder.documents.split(',').filter(Boolean).length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="body2" sx={{ color: colors.lightText, mt: 2, mb: 1 }}>
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
                          sx={{ 
                            textTransform: 'none',
                            borderColor: colors.borderColor,
                            color: colors.darkNavy,
                            '&:hover': { borderColor: colors.lightCyan, color: colors.lightCyanDark }
                          }}
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
                  <Divider sx={{ borderColor: colors.borderColor }} />
                  <Typography variant="subtitle2" sx={{ color: colors.darkNavy, mt: 2, mb: 1 }}>
                    Update Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {viewingOrder.status === 'Draft' && canCreate && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Pending Approval')}
                        sx={{ 
                          borderColor: colors.warning,
                          color: colors.warning,
                          '&:hover': { 
                            borderColor: colors.lightCyan, 
                            color: colors.lightCyanDark,
                            backgroundColor: 'rgba(103, 232, 249, 0.04)'
                          },
                          textTransform: 'none',
                          borderRadius: 2,
                        }}
                      >
                        Submit for Approval
                      </Button>
                    )}
                    {viewingOrder.status === 'Pending Approval' && canApprove && (
                      <>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => handleApprove(viewingOrder.id)}
                          startIcon={<CheckCircle />}
                          sx={{ 
                            bgcolor: colors.success,
                            '&:hover': { bgcolor: '#1B5E20' },
                            boxShadow: `0 4px 16px ${colors.success}44`,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="error"
                          onClick={() => handleReject(viewingOrder.id)}
                          startIcon={<Cancel />}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {viewingOrder.status === 'Pending Approval' && !canApprove && (
                      <Alert severity="info" sx={{ mt: 1, width: '100%', borderRadius: 2, border: `1px solid rgba(103, 232, 249, 0.2)` }}>
                        <Typography variant="body2">
                          <strong>Waiting for Super Admin approval.</strong> Only Super Admin can approve or reject orders.
                        </Typography>
                      </Alert>
                    )}
                    {viewingOrder.status === 'Approved' && canEdit && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Ordered')}
                        startIcon={<LocalShipping />}
                        sx={{ 
                          bgcolor: colors.info,
                          '&:hover': { bgcolor: '#0D47A1' },
                          boxShadow: `0 4px 16px ${colors.info}44`,
                          textTransform: 'none',
                          borderRadius: 2,
                        }}
                      >
                        Mark as Ordered
                      </Button>
                    )}
                    {viewingOrder.status === 'Ordered' && canEdit && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleStatusUpdate(viewingOrder.id, 'Received')}
                        startIcon={<Check />}
                        sx={{ 
                          bgcolor: colors.success,
                          '&:hover': { bgcolor: '#1B5E20' },
                          boxShadow: `0 4px 16px ${colors.success}44`,
                          textTransform: 'none',
                          borderRadius: 2,
                        }}
                      >
                        Mark as Received
                      </Button>
                    )}
                  </Box>
                </Grid>
              )}

              {viewingOrder.status === 'Cancelled' && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.error}33` }}>
                    <Typography variant="body2">
                      <strong>This order has been cancelled.</strong> No further actions can be taken.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {viewingOrder.status === 'Received' && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2, border: `1px solid ${colors.success}33` }}>
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
          <Button 
            onClick={handleCloseView} 
            sx={{ 
              color: colors.darkNavy,
              '&:hover': { 
                backgroundColor: 'rgba(103, 232, 249, 0.04)'
              },
              textTransform: 'none',
            }}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Print />} 
            sx={{ 
              bgcolor: colors.darkNavy,
              '&:hover': { 
                bgcolor: colors.darkNavyHover,
                boxShadow: `0 4px 16px ${colors.lightCyanGlow}`
              },
              boxShadow: `0 4px 16px ${colors.lightCyanGlow}`,
              textTransform: 'none',
              borderRadius: 2,
            }}
            onClick={() => handlePrint(viewingOrder)}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PurchaseOrders